import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SoftwareInventoryModule } from './modules/software-inventory/software-inventory.module';
import { SoftwareUpdateFindingsModule } from './modules/software-update-findings/software-update-findings.module';
import { VulnerabilityFindingsModule } from './modules/vulnerability-findings/vulnerability-findings.module';
import { RemediationActionsModule } from './modules/remediation-actions/remediation-actions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AiRecommendationsModule } from './modules/ai-recommendations/ai-recommendations.module';
import { RepositoryScansModule } from './modules/repository-scans/repository-scans.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';



@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    DepartmentsModule,
    DevicesModule,
    SoftwareInventoryModule,
    SoftwareUpdateFindingsModule,
    VulnerabilityFindingsModule,
    RemediationActionsModule,
    DashboardModule,
    AiRecommendationsModule,
    RepositoryScansModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
