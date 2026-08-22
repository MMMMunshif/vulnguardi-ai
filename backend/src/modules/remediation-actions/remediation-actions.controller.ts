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
  import { CreateRemediationActionDto } from './dto/create-remediation-action.dto';
  import { UpdateRemediationActionDto } from './dto/update-remediation-action.dto';
  import { RemediationActionsService } from './remediation-actions.service';

  type AuthenticatedRequest = Request & {
    user: { role: string; organizationId: string };
  };
  
  @ApiTags('Remediation Actions')
  @ApiBearerAuth()
  @Controller('remediation-actions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class RemediationActionsController {
    constructor(
      private readonly remediationActionsService: RemediationActionsService,
    ) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findAll(@Req() request: AuthenticatedRequest) {
      return this.remediationActionsService.findAll(
        this.getOrganizationScope(request),
      );
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    create(@Body() createDto: CreateRemediationActionDto, @Req() request: AuthenticatedRequest) {
      return this.remediationActionsService.create(
        createDto,
        this.getOrganizationScope(request),
      );
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.remediationActionsService.findOne(
        id,
        this.getOrganizationScope(request),
      );
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    update(@Param('id') id: string, @Body() updateDto: UpdateRemediationActionDto, @Req() request: AuthenticatedRequest) {
      return this.remediationActionsService.update(
        id,
        updateDto,
        this.getOrganizationScope(request),
      );
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin')
    remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.remediationActionsService.remove(
        id,
        this.getOrganizationScope(request),
      );
    }

    private getOrganizationScope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin'
        ? undefined
        : request.user.organizationId;
    }
  }
