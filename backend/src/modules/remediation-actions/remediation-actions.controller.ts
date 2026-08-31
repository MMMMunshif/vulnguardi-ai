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
    UseInterceptors,
    UploadedFile,
    Res,
    StreamableFile,
    BadRequestException,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  import { FileInterceptor } from '@nestjs/platform-express';
  import type { Response } from 'express';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { CreateRemediationActionDto } from './dto/create-remediation-action.dto';
  import { UpdateRemediationActionDto } from './dto/update-remediation-action.dto';
  import { RemediationActionsService } from './remediation-actions.service';

  type AuthenticatedRequest = Request & {
    user: { sub: string; role: string; organizationId: string };
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

    @Post(':id/evidence')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
    uploadEvidence(@Param('id') id: string, @UploadedFile() file: any, @Req() request: AuthenticatedRequest) {
      if (!file) throw new BadRequestException('Evidence file is required');
      return this.remediationActionsService.addEvidence(id, file, request.user.sub, this.getOrganizationScope(request));
    }

    @Get('evidence/:evidenceId/download')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    async downloadEvidence(@Param('evidenceId') evidenceId: string, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
      const evidence = await this.remediationActionsService.getEvidence(evidenceId, this.getOrganizationScope(request));
      response.setHeader('Content-Type', evidence.mimeType);
      response.setHeader('Content-Disposition', `attachment; filename="${evidence.fileName.replace(/["\\\r\n]/g, '_')}"`);
      return new StreamableFile(evidence.data);
    }

    @Delete('evidence/:evidenceId')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    removeEvidence(@Param('evidenceId') evidenceId: string, @Req() request: AuthenticatedRequest) {
      return this.remediationActionsService.removeEvidence(evidenceId, this.getOrganizationScope(request));
    }

    private getOrganizationScope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin'
        ? undefined
        : request.user.organizationId;
    }
  }
