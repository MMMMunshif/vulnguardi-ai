import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditEvent = {
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  actorEmail: string;
  message?: string;
  userId?: string;
  organizationId: string;
};

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: event });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unable to record audit event: ${message}`);
    }
  }

  async findAll(organizationId?: string, requestedLimit = 100) {
    const limit = Math.min(Math.max(requestedLimit || 100, 1), 500);
    const logs = await this.prisma.auditLog.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        method: true,
        path: true,
        statusCode: true,
        actorEmail: true,
        message: true,
        createdAt: true,
        organization: { select: { id: true, name: true } },
      },
    });

    return { message: 'Audit logs fetched successfully', logs };
  }
}
