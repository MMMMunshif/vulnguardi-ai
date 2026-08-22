import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

type AuthenticatedRequest = Request & {
  user: { role: string; organizationId: string };
};

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
  getSummary(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getSummary(this.getOrganizationScope(request));
  }

  @Get('recent-activity')
  @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
  getRecentActivity(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getRecentActivity(
      this.getOrganizationScope(request),
    );
  }

  private getOrganizationScope(request: AuthenticatedRequest) {
    return request.user.role === 'Super Admin'
      ? undefined
      : request.user.organizationId;
  }
}
