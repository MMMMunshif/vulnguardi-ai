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
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('Super Admin', 'Organization Admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('Super Admin', 'Organization Admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('Super Admin', 'Organization Admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('Super Admin', 'Organization Admin')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}