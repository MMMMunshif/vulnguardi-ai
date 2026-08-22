import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const count = jest.fn().mockResolvedValue(0);
  const findMany = jest.fn().mockResolvedValue([]);
  const prisma = {
    organization: { count },
    user: { count },
    device: { count },
    softwareInventory: { count },
    softwareUpdateFinding: { count },
    vulnerabilityFinding: { count },
    remediationAction: { count, findMany },
  };
  const service = new DashboardService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
  });

  it('scopes dashboard summary queries to the authenticated organization', async () => {
    await service.getSummary('org-1');

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    expect(prisma.device.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    expect(prisma.remediationAction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });
});
