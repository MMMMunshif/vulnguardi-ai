import { AiRecommendationsService } from './ai-recommendations.service';

describe('AiRecommendationsService', () => {
  const service = new AiRecommendationsService();

  afterEach(() => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_SERVICE_URL;
    delete process.env.AI_SERVICE_TOKEN;
    jest.restoreAllMocks();
  });

  it('creates a critical 24-hour update recommendation for a public exploit', async () => {
    const before = Date.now();
    const result = await service.generateRemediationRecommendation({
      title: 'Remote code execution',
      softwareName: 'Google Chrome',
      affectedVersion: '126',
      fixedVersion: '127',
      fixAvailability: 'FIX_AVAILABLE',
      exploitAvailability: 'PUBLIC_EXPLOIT_AVAILABLE',
      cveId: 'CVE-2024-12345',
    });

    expect(result.priority).toBe('Critical');
    expect(result.actionType).toBe('UPDATE_SOFTWARE');
    expect(result.slaHours).toBe(24);
    expect(new Date(result.suggestedDueDate).getTime()).toBeGreaterThanOrEqual(
      before + 24 * 60 * 60 * 1000,
    );
    expect(result.recommendedFix).toContain('version 127');
  });

  it('recommends mitigation when no fix exists', async () => {
    const result = await service.generateRemediationRecommendation({
      title: 'Unpatched vulnerability',
      softwareName: 'Legacy App',
      fixAvailability: 'NO_FIX_AVAILABLE',
    });

    expect(result.priority).toBe('High');
    expect(result.actionType).toBe('ACCEPT_RISK');
    expect(result.slaHours).toBe(72);
    expect(result.remediationSteps).toContain(
      'Monitor the asset for suspicious activity.',
    );
  });

  it('uses a validated structured OpenAI recommendation when configured', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  priority: 'High',
                  actionType: 'CONFIGURATION_CHANGE',
                  recommendedFix: 'Disable the affected feature.',
                  explanation: 'Temporary mitigation is required.',
                  remediationSteps: ['Disable the feature.', 'Verify access.'],
                }),
              },
            ],
          },
        ],
      }),
    } as Response);

    const result = await service.generateRemediationRecommendation({
      title: 'Configuration vulnerability',
    });

    expect(result.provider).toBe('openai');
    expect(result.actionType).toBe('CONFIGURATION_CHANGE');
    expect(result.generatedBy).toBe('VulnGuard AI powered by OpenAI');
  });

  it('uses the NVIDIA AI microservice when configured', async () => {
    process.env.AI_PROVIDER = 'nvidia';
    process.env.AI_SERVICE_URL = 'https://ai.example.com/';
    process.env.AI_SERVICE_TOKEN = 'service-secret';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        priority: 'Critical',
        actionType: 'UPDATE_SOFTWARE',
        recommendedFix: 'Deploy the fixed release.',
        explanation: 'A public exploit affects this release.',
        remediationSteps: ['Test the release.', 'Deploy the release.'],
      }),
    } as Response);

    const result = await service.generateRemediationRecommendation({
      title: 'Publicly exploited vulnerability',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://ai.example.com/recommendations/remediation',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-AI-Service-Token': 'service-secret',
        }),
      }),
    );
    expect(result.provider).toBe('nvidia');
    expect(result.generatedBy).toBe('VulnGuard AI powered by NVIDIA Nemotron');
  });

  it('falls back to rules when the NVIDIA AI service fails', async () => {
    process.env.AI_PROVIDER = 'nvidia';
    process.env.AI_SERVICE_URL = 'https://ai.example.com';
    process.env.AI_SERVICE_TOKEN = 'service-secret';
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('service offline'));

    const result = await service.generateRemediationRecommendation({
      title: 'Fallback vulnerability',
    });

    expect(result.provider).toBe('rules');
    expect(result.generatedBy).toBe('VulnGuard Rules Engine (NVIDIA fallback)');
  });
});
