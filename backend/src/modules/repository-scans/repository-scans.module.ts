import { Module } from '@nestjs/common';
import { RepositoryScansController } from './repository-scans.controller';
import { RepositoryScansService } from './repository-scans.service';

@Module({
  controllers: [RepositoryScansController],
  providers: [RepositoryScansService],
})
export class RepositoryScansModule {}
