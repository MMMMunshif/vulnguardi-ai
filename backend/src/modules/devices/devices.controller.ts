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
  import { CreateDeviceDto } from './dto/create-device.dto';
  import { UpdateDeviceDto } from './dto/update-device.dto';
  import { DevicesService } from './devices.service';

  type AuthenticatedRequest = Request & {
    user: { role: string; organizationId: string };
  };
  
  @ApiTags('Devices')
  @ApiBearerAuth()
  @Controller('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class DevicesController {
    constructor(private readonly devicesService: DevicesService) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findAll(@Req() request: AuthenticatedRequest) {
      return this.devicesService.findAll(this.scope(request));
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.devicesService.findOne(id, this.scope(request));
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    create(@Body() createDeviceDto: CreateDeviceDto, @Req() request: AuthenticatedRequest) {
      return this.devicesService.create(createDeviceDto, this.scope(request));
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto, @Req() request: AuthenticatedRequest) {
      return this.devicesService.update(id, updateDeviceDto, this.scope(request));
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin')
    retire(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.devicesService.retire(id, this.scope(request));
    }

    private scope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin' ? undefined : request.user.organizationId;
    }
  }
