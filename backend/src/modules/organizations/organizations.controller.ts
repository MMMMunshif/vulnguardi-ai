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
  import { CreateOrganizationDto } from './dto/create-organization.dto';
  import { UpdateOrganizationDto } from './dto/update-organization.dto';
  import { OrganizationsService } from './organizations.service';
  
  @ApiTags('Organizations')
  @ApiBearerAuth()
  @Controller('organizations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) {}
  
    @Get()
    @Roles('Super Admin')
    findAll() {
      return this.organizationsService.findAll();
    }
  
    @Get(':id')
    @Roles('Super Admin')
    findOne(@Param('id') id: string) {
      return this.organizationsService.findOne(id);
    }
  
    @Post()
    @Roles('Super Admin')
    create(@Body() createOrganizationDto: CreateOrganizationDto) {
      return this.organizationsService.create(createOrganizationDto);
    }
  
    @Patch(':id')
    @Roles('Super Admin')
    update(
      @Param('id') id: string,
      @Body() updateOrganizationDto: UpdateOrganizationDto,
    ) {
      return this.organizationsService.update(id, updateOrganizationDto);
    }
  
    @Delete(':id')
    @Roles('Super Admin')
    suspend(@Param('id') id: string) {
      return this.organizationsService.suspend(id);
    }
  }