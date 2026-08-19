import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SoftwareUpdateFindingsController } from './software-update-findings.controller';
import { SoftwareUpdateFindingsService } from './software-update-findings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SoftwareUpdateFindingsController],
  providers: [SoftwareUpdateFindingsService, RolesGuard],
})
export class SoftwareUpdateFindingsModule {}