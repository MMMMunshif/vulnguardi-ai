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
  import { CreateSoftwareInventoryDto } from './dto/create-software-inventory.dto';
  import { UpdateSoftwareInventoryDto } from './dto/update-software-inventory.dto';
  import { SoftwareInventoryService } from './software-inventory.service';

  type AuthenticatedRequest = Request & {
    user: { role: string; organizationId: string };
  };
  
  @ApiTags('Software Inventory')
  @ApiBearerAuth()
  @Controller('software-inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class SoftwareInventoryController {
    constructor(
      private readonly softwareInventoryService: SoftwareInventoryService,
    ) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findAll(@Req() request: AuthenticatedRequest) {
      return this.softwareInventoryService.findAll(this.scope(request));
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.softwareInventoryService.findOne(id, this.scope(request));
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    create(@Body() createSoftwareInventoryDto: CreateSoftwareInventoryDto, @Req() request: AuthenticatedRequest) {
      return this.softwareInventoryService.create(createSoftwareInventoryDto, this.scope(request));
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    update(
      @Param('id') id: string,
      @Body() updateSoftwareInventoryDto: UpdateSoftwareInventoryDto,
      @Req() request: AuthenticatedRequest,
    ) {
      return this.softwareInventoryService.update(id, updateSoftwareInventoryDto, this.scope(request));
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.softwareInventoryService.remove(id, this.scope(request));
    }

    private scope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin' ? undefined : request.user.organizationId;
    }
  }
