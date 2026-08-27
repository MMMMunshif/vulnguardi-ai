import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  const prisma = {
    auditLog: { create: jest.fn(), findMany: jest.fn() },
  };
  let service: AuditLogsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditLogsService(prisma as unknown as PrismaService);
  });

  it('records a sanitized audit event', async () => {
    const event = {
      action: 'UPDATE',
      resource: 'devices',
      resourceId: 'device-1',
      method: 'PATCH',
      path: '/devices/device-1',
      statusCode: 200,
      actorEmail: 'admin@example.com',
      userId: 'user-1',
      organizationId: 'org-1',
    };
    prisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

    await service.record(event);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: event });
  });

  it('keeps application operations available when audit storage fails', async () => {
    prisma.auditLog.create.mockRejectedValue(new Error('database unavailable'));

    await expect(
      service.record({
        action: 'CREATE',
        resource: 'devices',
        method: 'POST',
        path: '/devices',
        statusCode: 201,
        actorEmail: 'admin@example.com',
        organizationId: 'org-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('scopes organization administrators and caps result limits', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);

    await service.findAll('org-1', 1000);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' }, take: 500 }),
    );
  });

  it('allows super administrators to view cross-organization events', async () => {
    prisma.auditLog.findMany.mockResolvedValue([{ id: 'log-1' }]);

    await expect(service.findAll(undefined, 25)).resolves.toEqual({
      message: 'Audit logs fetched successfully',
      logs: [{ id: 'log-1' }],
    });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined, take: 25 }),
    );
  });
});
