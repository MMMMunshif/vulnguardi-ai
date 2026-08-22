import { Injectable } from '@nestjs/common';
import { GenerateRemediationRecommendationDto } from './dto/generate-remediation-recommendation.dto';

@Injectable()
export class AiRecommendationsService {
  generateRemediationRecommendation(dto: GenerateRemediationRecommendationDto) {
    const softwareName = dto.softwareName || 'the affected software';
    const affectedVersion = dto.affectedVersion || 'the affected version';
    const fixedVersion = dto.fixedVersion || 'the latest secure version';

    let priority = 'Medium';
    let actionType = 'VERIFY_PATCH';
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

    const explanationParts: string[] = [];

    explanationParts.push(
      `The vulnerability "${dto.title}" affects ${softwareName}.`,
    );

    if (dto.cveId) {
      explanationParts.push(`It is tracked as ${dto.cveId}.`);
    }

    if (dto.affectedVersion) {
      explanationParts.push(
        `The affected installed version is ${dto.affectedVersion}.`,
      );
    }

    if (dto.fixedVersion && dto.fixAvailability === 'FIX_AVAILABLE') {
      explanationParts.push(
        `A fixed version is available: ${dto.fixedVersion}.`,
      );
    }

    if (dto.exploitAvailability === 'PUBLIC_EXPLOIT_AVAILABLE') {
      explanationParts.push(
        'A public exploit is available, so this issue should be handled with urgent priority.',
      );
    } else if (dto.exploitAvailability === 'NO_KNOWN_EXPLOIT') {
      explanationParts.push(
        'No known public exploit is currently recorded, but remediation is still recommended.',
      );
    } else {
      explanationParts.push(
        'Exploit availability is unknown, so the security team should review it carefully.',
      );
    }

    const remediationSteps = this.buildRemediationSteps(
      dto.fixAvailability,
      softwareName,
      fixedVersion,
    );

    return {
      priority,
      actionType,
      recommendedFix,
      explanation: explanationParts.join(' '),
      remediationSteps,
      generatedBy: 'VulnGuard AI Smart Recommendation Engine',
    };
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