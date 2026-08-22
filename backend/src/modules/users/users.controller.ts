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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
    organizationId: string;
  };
};

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Get('admin-only')
  @Roles('Super Admin')
  adminOnly(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Super Admin access granted',
      user: req.user,
    };
  }

  @Get()
  @Roles('Super Admin', 'Organization Admin')
  findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findAll(this.scope(req));
  }

  @Get(':id')
  @Roles('Super Admin', 'Organization Admin')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.findOne(id, this.scope(req));
  }

  @Post()
  @Roles('Super Admin', 'Organization Admin')
  create(@Body() createUserDto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.create(createUserDto, this.scope(req));
  }

  @Patch(':id')
  @Roles('Super Admin', 'Organization Admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.update(id, updateUserDto, this.scope(req));
  }

  @Delete(':id')
  @Roles('Super Admin', 'Organization Admin')
  deactivate(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.deactivate(id, this.scope(req));
  }

  private scope(request: AuthenticatedRequest) {
    return request.user.role === 'Super Admin'
      ? undefined
      : request.user.organizationId;
  }
}
