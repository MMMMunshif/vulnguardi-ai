import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SoftwareInventoryModule } from './modules/software-inventory/software-inventory.module';
import { SoftwareUpdateFindingsModule } from './modules/software-update-findings/software-update-findings.module';


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
  ],
})
export class AppModule {}