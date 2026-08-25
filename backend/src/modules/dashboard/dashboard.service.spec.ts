import { PrismaService } from '../../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    organization: { count: jest.fn() },
    user: { count: jest.fn() },
    device: { count: jest.fn(), findMany: jest.fn() },
    softwareInventory: { count: jest.fn(), findMany: jest.fn() },
    softwareUpdateFinding: { count: jest.fn() },
    vulnerabilityFinding: { count: jest.fn(), findMany: jest.fn() },
    remediationAction: { count: jest.fn(), findMany: jest.fn() },
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(prisma as unknown as PrismaService);
    for (const model of [
      prisma.organization,
      prisma.user,
      prisma.device,
      prisma.softwareInventory,
      prisma.softwareUpdateFinding,
      prisma.vulnerabilityFinding,
      prisma.remediationAction,
    ]) {
      model.count.mockResolvedValue(0);
    }
    prisma.device.findMany.mockResolvedValue([]);
    prisma.softwareInventory.findMany.mockResolvedValue([]);
    prisma.vulnerabilityFinding.findMany.mockResolvedValue([]);
    prisma.remediationAction.findMany.mockResolvedValue([]);
  });

  it('scopes every dashboard domain to the authenticated organization', async () => {
    await service.getSummary('org-1');

    expect(prisma.organization.count).toHaveBeenCalledWith({
      where: { id: 'org-1' },
    });
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

  it('maps aggregate counts and distinct remediation coverage correctly', async () => {
    prisma.organization.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prisma.user.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    prisma.device.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    prisma.softwareInventory.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    prisma.softwareUpdateFinding.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2);
    prisma.vulnerabilityFinding.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    prisma.remediationAction.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    prisma.remediationAction.findMany.mockResolvedValue([
      { vulnerabilityFindingId: 'vuln-1' },
      { vulnerabilityFindingId: 'vuln-2' },
    ]);

    const result = await service.getSummary();

    expect(result.summary).toEqual({
      organizations: { total: 2, active: 1, suspended: 1 },
      users: { total: 5, active: 4, inactive: 1 },
      devices: { total: 3, active: 2, retired: 1 },
      softwareInventory: { total: 4, installed: 3, removed: 1 },
      softwareUpdates: { total: 4, outdated: 2, upToDate: 2 },
      vulnerabilities: { total: 6, open: 3, inProgress: 1, resolved: 2 },
      remediationActions: {
        total: 5,
        pending: 1,
        inProgress: 1,
        completed: 2,
        cancelled: 1,
        verified: 2,
        notVerified: 2,
        verificationFailed: 1,
        coveredVulnerabilities: 2,
        overdue: 1,
        dueSoon: 2,
      },
    });
  });

  it('queries recent activity with tenant scope, newest-first limits, and deadlines', async () => {
    await service.getRecentActivity('org-1');

    expect(prisma.device.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(prisma.remediationAction.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        take: 5,
        where: expect.objectContaining({ organizationId: 'org-1' }),
        orderBy: { dueDate: 'asc' },
      }),
    );
  });

  it('labels past deadlines overdue and upcoming deadlines due soon', async () => {
    const pastDue = new Date(Date.now() - 60_000);
    const upcoming = new Date(Date.now() + 60_000);
    prisma.remediationAction.findMany
      .mockResolvedValueOnce([{ id: 'recent-action' }])
      .mockResolvedValueOnce([
        { id: 'overdue-action', dueDate: pastDue },
        { id: 'due-soon-action', dueDate: upcoming },
        { id: 'no-date-action', dueDate: null },
      ]);

    const result = await service.getRecentActivity('org-1');

    expect(result.recentActivity.recentRemediations).toEqual([
      { id: 'recent-action' },
    ]);
    expect(result.recentActivity.deadlineRemediations).toEqual([
      { id: 'overdue-action', dueDate: pastDue, deadlineState: 'OVERDUE' },
      { id: 'due-soon-action', dueDate: upcoming, deadlineState: 'DUE_SOON' },
      { id: 'no-date-action', dueDate: null, deadlineState: 'DUE_SOON' },
    ]);
  });
});
