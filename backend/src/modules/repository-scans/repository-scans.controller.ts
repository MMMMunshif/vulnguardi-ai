import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScanRepositoryDto } from './dto/scan-repository.dto';
import { RepositoryScansService } from './repository-scans.service';

@ApiTags('Repository Scans')
@ApiBearerAuth()
@Controller('repository-scans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RepositoryScansController {
  constructor(private readonly repositoryScansService: RepositoryScansService) {}

  @Post()
  @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
  @ApiOperation({ summary: 'Scan a public GitHub or GitLab repository dependency manifests' })
  scan(@Body() dto: ScanRepositoryDto) {
    return this.repositoryScansService.scan(dto);
  }
}
