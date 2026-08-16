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
  import { CreateDepartmentDto } from './dto/create-department.dto';
  import { UpdateDepartmentDto } from './dto/update-department.dto';
  import { DepartmentsService } from './departments.service';
  
  @ApiTags('Departments')
  @ApiBearerAuth()
  @Controller('departments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}
  
    @Get()
    @Roles('Super Admin')
    findAll() {
      return this.departmentsService.findAll();
    }
  
    @Get(':id')
    @Roles('Super Admin')
    findOne(@Param('id') id: string) {
      return this.departmentsService.findOne(id);
    }
  
    @Post()
    @Roles('Super Admin')
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
      return this.departmentsService.create(createDepartmentDto);
    }
  
    @Patch(':id')
    @Roles('Super Admin')
    update(
      @Param('id') id: string,
      @Body() updateDepartmentDto: UpdateDepartmentDto,
    ) {
      return this.departmentsService.update(id, updateDepartmentDto);
    }
  
    @Delete(':id')
    @Roles('Super Admin')
    remove(@Param('id') id: string) {
      return this.departmentsService.remove(id);
    }
  }