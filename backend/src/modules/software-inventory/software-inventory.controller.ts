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
  import { CreateSoftwareInventoryDto } from './dto/create-software-inventory.dto';
  import { UpdateSoftwareInventoryDto } from './dto/update-software-inventory.dto';
  import { SoftwareInventoryService } from './software-inventory.service';
  
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
    findAll() {
      return this.softwareInventoryService.findAll();
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string) {
      return this.softwareInventoryService.findOne(id);
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    create(@Body() createSoftwareInventoryDto: CreateSoftwareInventoryDto) {
      return this.softwareInventoryService.create(createSoftwareInventoryDto);
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    update(
      @Param('id') id: string,
      @Body() updateSoftwareInventoryDto: UpdateSoftwareInventoryDto,
    ) {
      return this.softwareInventoryService.update(id, updateSoftwareInventoryDto);
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    remove(@Param('id') id: string) {
      return this.softwareInventoryService.remove(id);
    }
  }