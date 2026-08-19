import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { CreateSoftwareUpdateFindingDto } from './dto/create-software-update-finding.dto';
  import { UpdateSoftwareUpdateFindingDto } from './dto/update-software-update-finding.dto';
  import { SoftwareUpdateFindingsService } from './software-update-findings.service';
  
  @ApiTags('Software Update Findings')
  @ApiBearerAuth()
  @Controller('software-update-findings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class SoftwareUpdateFindingsController {
    constructor(
      private readonly softwareUpdateFindingsService: SoftwareUpdateFindingsService,
    ) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findAll() {
      return this.softwareUpdateFindingsService.findAll();
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    create(@Body() createDto: CreateSoftwareUpdateFindingDto) {
      return this.softwareUpdateFindingsService.create(createDto);
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string) {
      return this.softwareUpdateFindingsService.findOne(id);
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    update(
      @Param('id') id: string,
      @Body() updateDto: UpdateSoftwareUpdateFindingDto,
    ) {
      return this.softwareUpdateFindingsService.update(id, updateDto);
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    remove(@Param('id') id: string) {
      return this.softwareUpdateFindingsService.remove(id);
    }
  }