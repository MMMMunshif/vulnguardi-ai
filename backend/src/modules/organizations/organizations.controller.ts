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
  import { CreateOrganizationDto } from './dto/create-organization.dto';
  import { UpdateOrganizationDto } from './dto/update-organization.dto';
  import { OrganizationsService } from './organizations.service';

  type AuthenticatedRequest = Request & {
    user: { role: string; organizationId: string };
  };
  
  @ApiTags('Organizations')
  @ApiBearerAuth()
  @Controller('organizations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin')
    findAll(@Req() request: AuthenticatedRequest) {
      return this.organizationsService.findAll(this.scope(request));
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin')
    findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.organizationsService.findOne(id, this.scope(request));
    }
  
    @Post()
    @Roles('Super Admin')
    create(@Body() createOrganizationDto: CreateOrganizationDto) {
      return this.organizationsService.create(createOrganizationDto);
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin')
    update(
      @Param('id') id: string,
      @Body() updateOrganizationDto: UpdateOrganizationDto,
      @Req() request: AuthenticatedRequest,
    ) {
      return this.organizationsService.update(id, updateOrganizationDto, this.scope(request));
    }
  
    @Delete(':id')
    @Roles('Super Admin')
    suspend(@Param('id') id: string) {
      return this.organizationsService.suspend(id);
    }

    private scope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin' ? undefined : request.user.organizationId;
    }
  }
