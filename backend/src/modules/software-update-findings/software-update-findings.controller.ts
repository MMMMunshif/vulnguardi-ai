import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { CreateSoftwareUpdateFindingDto } from './dto/create-software-update-finding.dto';
  import { UpdateSoftwareUpdateFindingDto } from './dto/update-software-update-finding.dto';
  import { SoftwareUpdateFindingsService } from './software-update-findings.service';

  type AuthenticatedRequest = Request & {
    user: { role: string; organizationId: string };
  };
  
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
    findAll(@Req() request: AuthenticatedRequest) {
      return this.softwareUpdateFindingsService.findAll(this.scope(request));
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    create(@Body() createDto: CreateSoftwareUpdateFindingDto, @Req() request: AuthenticatedRequest) {
      return this.softwareUpdateFindingsService.create(createDto, this.scope(request));
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.softwareUpdateFindingsService.findOne(id, this.scope(request));
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    update(
      @Param('id') id: string,
      @Body() updateDto: UpdateSoftwareUpdateFindingDto,
      @Req() request: AuthenticatedRequest,
    ) {
      return this.softwareUpdateFindingsService.update(id, updateDto, this.scope(request));
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.softwareUpdateFindingsService.remove(id, this.scope(request));
    }

    private scope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin' ? undefined : request.user.organizationId;
    }
  }
