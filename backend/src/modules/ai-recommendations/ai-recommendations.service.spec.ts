import { AiRecommendationsService } from './ai-recommendations.service';

describe('AiRecommendationsService', () => {
  const service = new AiRecommendationsService();

  it('creates a critical 24-hour update recommendation for a public exploit', () => {
    const before = Date.now();
    const result = service.generateRemediationRecommendation({
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

  it('recommends mitigation when no fix exists', () => {
    const result = service.generateRemediationRecommendation({
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
});
