import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditLogsService } from './audit-logs.service';

type AuthenticatedRequest = Request & {
  user: { role: string; organizationId: string };
};

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('Super Admin', 'Organization Admin')
  @ApiOperation({ summary: 'View recent tenant-scoped audit events' })
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const organizationId =
      request.user.role === 'Super Admin'
        ? undefined
        : request.user.organizationId;
    return this.auditLogsService.findAll(organizationId, Number(limit) || 100);
  }
}
