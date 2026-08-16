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
  import { CreateDeviceDto } from './dto/create-device.dto';
  import { UpdateDeviceDto } from './dto/update-device.dto';
  import { DevicesService } from './devices.service';
  
  @ApiTags('Devices')
  @ApiBearerAuth()
  @Controller('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class DevicesController {
    constructor(private readonly devicesService: DevicesService) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findAll() {
      return this.devicesService.findAll();
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string) {
      return this.devicesService.findOne(id);
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    create(@Body() createDeviceDto: CreateDeviceDto) {
      return this.devicesService.create(createDeviceDto);
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
      return this.devicesService.update(id, updateDeviceDto);
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin')
    retire(@Param('id') id: string) {
      return this.devicesService.retire(id);
    }
  }