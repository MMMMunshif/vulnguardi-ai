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
  import { CreateRemediationActionDto } from './dto/create-remediation-action.dto';
  import { UpdateRemediationActionDto } from './dto/update-remediation-action.dto';
  import { RemediationActionsService } from './remediation-actions.service';
  
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
    findAll() {
      return this.remediationActionsService.findAll();
    }
  
    @Post()
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst')
    create(@Body() createDto: CreateRemediationActionDto) {
      return this.remediationActionsService.create(createDto);
    }
  
    @Get(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    findOne(@Param('id') id: string) {
      return this.remediationActionsService.findOne(id);
    }
  
    @Patch(':id')
    @Roles('Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician')
    update(@Param('id') id: string, @Body() updateDto: UpdateRemediationActionDto) {
      return this.remediationActionsService.update(id, updateDto);
    }
  
    @Delete(':id')
    @Roles('Super Admin', 'Organization Admin')
    remove(@Param('id') id: string) {
      return this.remediationActionsService.remove(id);
    }
  }