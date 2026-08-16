import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, OrganizationsModule, DepartmentsModule, DevicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}