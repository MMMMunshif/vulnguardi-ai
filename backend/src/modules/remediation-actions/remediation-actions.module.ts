import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RemediationActionsController } from './remediation-actions.controller';
import { RemediationActionsService } from './remediation-actions.service';

@Module({
  imports: [PrismaModule],
  controllers: [RemediationActionsController],
  providers: [RemediationActionsService, RolesGuard],
})
export class RemediationActionsModule {}