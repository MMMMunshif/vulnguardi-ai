import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('recent-activity')
  @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}