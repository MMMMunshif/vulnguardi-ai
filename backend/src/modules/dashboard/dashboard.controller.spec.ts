import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  const service = {
    getSummary: jest.fn(),
    getRecentActivity: jest.fn(),
  };
  const controller = new DashboardController(
    service as unknown as DashboardService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('scopes dashboard summary to a normal user organization', () => {
    controller.getSummary({
      user: { role: 'Security Analyst', organizationId: 'org-1' },
    } as never);

    expect(service.getSummary).toHaveBeenCalledWith('org-1');
  });

  it('allows Super Admin to request a global summary', () => {
    controller.getSummary({
      user: { role: 'Super Admin', organizationId: 'org-1' },
    } as never);

    expect(service.getSummary).toHaveBeenCalledWith(undefined);
  });

  it('scopes recent activity to a normal user organization', () => {
    controller.getRecentActivity({
      user: { role: 'IT Technician', organizationId: 'org-1' },
    } as never);

    expect(service.getRecentActivity).toHaveBeenCalledWith('org-1');
  });
});
