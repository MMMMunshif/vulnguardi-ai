import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SoftwareInventoryController } from './software-inventory.controller';
import { SoftwareInventoryService } from './software-inventory.service';

@Module({
  imports: [PrismaModule],
  controllers: [SoftwareInventoryController],
  providers: [SoftwareInventoryService, RolesGuard],
})
export class SoftwareInventoryModule {}