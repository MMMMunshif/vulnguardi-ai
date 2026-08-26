import { Injectable, Logger } from '@nestjs/common';
import { GenerateRemediationRecommendationDto } from './dto/generate-remediation-recommendation.dto';

type RecommendationCore = {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  actionType:
    | 'UPDATE_SOFTWARE'
    | 'CONFIGURATION_CHANGE'
    | 'REMOVE_SOFTWARE'
    | 'ACCEPT_RISK'
    | 'VERIFY_PATCH'
    | 'OTHER';
  recommendedFix: string;
  explanation: string;
  remediationSteps: string[];
};

@Injectable()
export class AiRecommendationsService {
  private readonly logger = new Logger(AiRecommendationsService.name);

  async generateRemediationRecommendation(
    dto: GenerateRemediationRecommendationDto,
  ) {
    const provider = process.env.AI_PROVIDER?.toLowerCase();
    const useNvidia = provider === 'nvidia';
    const useOpenAi = provider === 'openai';

    if (useNvidia && process.env.AI_SERVICE_URL && process.env.AI_SERVICE_TOKEN) {
      try {
        const recommendation = await this.generateWithNvidia(dto);
        return this.withMetadata(
          recommendation,
          'VulnGuard AI powered by NVIDIA Nemotron',
          'nvidia',
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `NVIDIA recommendation failed; using rules fallback: ${message}`,
        );
      }
    }

    if (useOpenAi && process.env.OPENAI_API_KEY) {
      try {
        const recommendation = await this.generateWithOpenAi(dto);
        return this.withMetadata(
          recommendation,
          'VulnGuard AI powered by OpenAI',
          'openai',
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `OpenAI recommendation failed; using rules fallback: ${message}`,
        );
      }
    }

    return this.withMetadata(
      this.generateWithRules(dto),
      useNvidia
        ? 'VulnGuard Rules Engine (NVIDIA fallback)'
        : useOpenAi
          ? 'VulnGuard Rules Engine (OpenAI fallback)'
          : 'VulnGuard AI Smart Recommendation Engine',
      'rules',
    );
  }

  private async generateWithNvidia(
    dto: GenerateRemediationRecommendationDto,
  ): Promise<RecommendationCore> {
    const configuredUrl = process.env.AI_SERVICE_URL!.replace(/\/$/, '');
    const baseUrl = /^https?:\/\//.test(configuredUrl)
      ? configuredUrl
      : `http://${configuredUrl}`;
    const response = await fetch(`${baseUrl}/recommendations/remediation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Service-Token': process.env.AI_SERVICE_TOKEN!,
      },
      signal: AbortSignal.timeout(35_000),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA AI service returned ${response.status}`);
    }

    return this.validateRecommendation(await response.json());
  }

  private async generateWithOpenAi(
    dto: GenerateRemediationRecommendationDto,
  ): Promise<RecommendationCore> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        store: false,
        instructions:
          'You are a defensive vulnerability remediation assistant. Use only the supplied finding data. Produce concise, actionable guidance for an authorized security team. Do not claim a patch was applied or verified.',
        input: JSON.stringify(dto),
        text: {
          format: {
            type: 'json_schema',
            name: 'remediation_recommendation',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: [
                'priority',
                'actionType',
                'recommendedFix',
                'explanation',
                'remediationSteps',
              ],
              properties: {
                priority: {
                  type: 'string',
                  enum: ['Critical', 'High', 'Medium', 'Low'],
                },
                actionType: {
                  type: 'string',
                  enum: [
                    'UPDATE_SOFTWARE',
                    'CONFIGURATION_CHANGE',
                    'REMOVE_SOFTWARE',
                    'ACCEPT_RISK',
                    'VERIFY_PATCH',
                    'OTHER',
                  ],
                },
                recommendedFix: { type: 'string' },
                explanation: { type: 'string' },
                remediationSteps: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 8,
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
    const outputText = payload.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === 'output_text')?.text;

    if (!outputText) {
      throw new Error('OpenAI response did not contain output text');
    }

    return this.validateRecommendation(JSON.parse(outputText));
  }

  private validateRecommendation(value: unknown): RecommendationCore {
    const recommendation = value as Partial<RecommendationCore>;
    const priorities = ['Critical', 'High', 'Medium', 'Low'];
    const actionTypes = [
      'UPDATE_SOFTWARE',
      'CONFIGURATION_CHANGE',
      'REMOVE_SOFTWARE',
      'ACCEPT_RISK',
      'VERIFY_PATCH',
      'OTHER',
    ];

    if (
      !recommendation ||
      !priorities.includes(recommendation.priority || '') ||
      !actionTypes.includes(recommendation.actionType || '') ||
      typeof recommendation.recommendedFix !== 'string' ||
      typeof recommendation.explanation !== 'string' ||
      !Array.isArray(recommendation.remediationSteps) ||
      recommendation.remediationSteps.length === 0 ||
      !recommendation.remediationSteps.every((step) => typeof step === 'string')
    ) {
      throw new Error('AI response failed recommendation validation');
    }

    return recommendation as RecommendationCore;
  }

  private generateWithRules(
    dto: GenerateRemediationRecommendationDto,
  ): RecommendationCore {
    const softwareName = dto.softwareName || 'the affected software';
    const affectedVersion = dto.affectedVersion || 'the affected version';
    const fixedVersion = dto.fixedVersion || 'the latest secure version';
    let priority: RecommendationCore['priority'] = 'Medium';
    let actionType: RecommendationCore['actionType'] = 'VERIFY_PATCH';
    let recommendedFix = `Review ${softwareName} and apply the latest available security update.`;

    if (dto.fixAvailability === 'FIX_AVAILABLE') {
      priority = 'High';
      actionType = 'UPDATE_SOFTWARE';
      recommendedFix = `Update ${softwareName} from version ${affectedVersion} to version ${fixedVersion} or later.`;
    }
    if (dto.exploitAvailability === 'PUBLIC_EXPLOIT_AVAILABLE') {
      priority = 'Critical';
    }
    if (dto.fixAvailability === 'NO_FIX_AVAILABLE') {
      priority = 'High';
      actionType = 'ACCEPT_RISK';
      recommendedFix = `No official fix is currently available for ${softwareName}. Apply temporary mitigation, restrict access, monitor the asset, and document risk acceptance until a fix is released.`;
    }

    const explanationParts = [
      `The vulnerability "${dto.title}" affects ${softwareName}.`,
    ];
    if (dto.cveId) explanationParts.push(`It is tracked as ${dto.cveId}.`);
    if (dto.affectedVersion) {
      explanationParts.push(`The affected installed version is ${dto.affectedVersion}.`);
    }
    if (dto.fixedVersion && dto.fixAvailability === 'FIX_AVAILABLE') {
      explanationParts.push(`A fixed version is available: ${dto.fixedVersion}.`);
    }
    explanationParts.push(
      dto.exploitAvailability === 'PUBLIC_EXPLOIT_AVAILABLE'
        ? 'A public exploit is available, so this issue should be handled with urgent priority.'
        : dto.exploitAvailability === 'NO_KNOWN_EXPLOIT'
          ? 'No known public exploit is currently recorded, but remediation is still recommended.'
          : 'Exploit availability is unknown, so the security team should review it carefully.',
    );

    return {
      priority,
      actionType,
      recommendedFix,
      explanation: explanationParts.join(' '),
      remediationSteps: this.buildRemediationSteps(
        dto.fixAvailability,
        softwareName,
        fixedVersion,
      ),
    };
  }

  private withMetadata(
    recommendation: RecommendationCore,
    generatedBy: string,
    provider: 'nvidia' | 'openai' | 'rules',
  ) {
    const slaHours = this.getSlaHours(recommendation.priority);
    return {
      ...recommendation,
      slaHours,
      suggestedDueDate: new Date(
        Date.now() + slaHours * 60 * 60 * 1000,
      ).toISOString(),
      generatedBy,
      provider,
    };
  }

  private getSlaHours(priority: string) {
    return { Critical: 24, High: 72, Medium: 168, Low: 336 }[priority] ?? 168;
  }

  private buildRemediationSteps(
    fixAvailability?: string,
    softwareName?: string,
    fixedVersion?: string,
  ) {
    if (fixAvailability === 'FIX_AVAILABLE') {
      return [
        `Confirm the affected device has ${softwareName} installed.`,
        `Download or deploy ${softwareName} version ${fixedVersion} or later.`,
        'Apply the update during an approved maintenance window.',
        'Restart the application or device if required.',
        'Verify that the vulnerable version is no longer installed.',
        'Mark the remediation action as completed and verified.',
      ];
    }
    if (fixAvailability === 'NO_FIX_AVAILABLE') {
      return [
        'Check vendor advisory for temporary mitigation guidance.',
        'Restrict access to the affected software or system.',
        'Monitor the asset for suspicious activity.',
        'Document the accepted risk and business justification.',
        'Review the vulnerability again when a vendor fix becomes available.',
      ];
    }
    return [
      'Review the vulnerability details manually.',
      'Check vendor or NVD references for available fixes.',
      'Decide whether to update, mitigate, remove, or accept the risk.',
      'Create a remediation action and assign it to a responsible user.',
    ];
  }
}
