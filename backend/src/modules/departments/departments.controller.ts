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
  import { CreateDepartmentDto } from './dto/create-department.dto';
  import { UpdateDepartmentDto } from './dto/update-department.dto';
  import { DepartmentsService } from './departments.service';

  type AuthenticatedRequest = Request & {
    user: { role: string; organizationId: string };
  };
  
  @ApiTags('Departments')
  @ApiBearerAuth()
  @Controller('departments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}
  
    @Get()
    @Roles('Super Admin', 'Organization Admin')
    findAll(@Req() request: AuthenticatedRequest) {
      return this.departmentsService.findAll(this.scope(request));
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin')
    findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.departmentsService.findOne(id, this.scope(request));
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin')
    create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() request: AuthenticatedRequest) {
      return this.departmentsService.create(createDepartmentDto, this.scope(request));
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin')
    update(
      @Param('id') id: string,
      @Body() updateDepartmentDto: UpdateDepartmentDto,
      @Req() request: AuthenticatedRequest,
    ) {
      return this.departmentsService.update(id, updateDepartmentDto, this.scope(request));
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin')
    remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
      return this.departmentsService.remove(id, this.scope(request));
    }

    private scope(request: AuthenticatedRequest) {
      return request.user.role === 'Super Admin' ? undefined : request.user.organizationId;
    }
  }
