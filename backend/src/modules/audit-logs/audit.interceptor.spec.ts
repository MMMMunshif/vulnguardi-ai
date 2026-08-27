import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLogsService } from './audit-logs.service';

describe('AuditInterceptor', () => {
  const auditLogs = { record: jest.fn() };
  const createContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode: 201 }),
      }),
    }) as unknown as ExecutionContext;
  const next = (result: unknown): CallHandler => ({ handle: () => of(result) });
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogs.record.mockResolvedValue(undefined);
    interceptor = new AuditInterceptor(auditLogs as unknown as AuditLogsService);
  });

  it('records authenticated mutation metadata without request bodies', async () => {
    const context = createContext({
      method: 'POST',
      path: '/devices',
      params: {},
      user: {
        sub: 'user-1',
        email: 'admin@example.com',
        role: 'Organization Admin',
        organizationId: 'org-1',
      },
      body: { password: 'must-not-be-logged' },
    });

    await lastValueFrom(
      interceptor.intercept(
        context,
        next({ message: 'Device created successfully', device: { id: 'device-1' } }),
      ),
    );

    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'devices',
        resourceId: 'device-1',
        actorEmail: 'admin@example.com',
        organizationId: 'org-1',
      }),
    );
    expect(JSON.stringify(auditLogs.record.mock.calls[0][0])).not.toContain(
      'must-not-be-logged',
    );
  });

  it('does not record read-only requests', async () => {
    const context = createContext({ method: 'GET', path: '/devices', params: {} });

    await lastValueFrom(interceptor.intercept(context, next({ devices: [] })));

    expect(auditLogs.record).not.toHaveBeenCalled();
  });
});
