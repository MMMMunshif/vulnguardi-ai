import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    profileImage: true,
    status: true,
    lastLogin: true,
    createdAt: true,
    updatedAt: true,
    organization: {
      select: {
        id: true,
        name: true,
      },
    },
    department: {
      select: {
        id: true,
        name: true,
      },
    },
    role: {
      select: {
        id: true,
        roleName: true,
      },
    },
  };

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Profile fetched successfully',
      user,
    };
  }

  async findAll(organizationId?: string) {
    const users = await this.prisma.user.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      select: this.userSelect,
    });

    return {
      message: 'Users fetched successfully',
      users,
    };
  }

  async findOne(id: string, organizationId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...(organizationId ? { organizationId } : {}) },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched successfully',
      user,
    };
  }

  async create(createUserDto: CreateUserDto, organizationId?: string) {
    if (organizationId && createUserDto.organizationId !== organizationId) {
      throw new NotFoundException('Organization not found');
    }

    if (organizationId && createUserDto.roleName === 'Super Admin') {
      throw new ForbiddenException(
        'Organization administrators cannot create Super Admin users',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        id: createUserDto.organizationId,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const department = await this.prisma.department.findFirst({
      where: {
        id: createUserDto.departmentId,
        organizationId: createUserDto.organizationId,
      },
    });

    if (!department) {
      throw new NotFoundException(
        'Department not found in the selected organization',
      );
    }

    const role = await this.prisma.role.findUnique({
      where: {
        roleName: createUserDto.roleName,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: hashedPassword,
        phone: createUserDto.phone,
        organizationId: createUserDto.organizationId,
        departmentId: createUserDto.departmentId,
        roleId: role.id,
      },
      select: this.userSelect,
    });

    return {
      message: 'User created successfully',
      user,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto, scopedOrganizationId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...(scopedOrganizationId ? { organizationId: scopedOrganizationId } : {}) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      scopedOrganizationId &&
      updateUserDto.organizationId &&
      updateUserDto.organizationId !== scopedOrganizationId
    ) {
      throw new NotFoundException('Organization not found');
    }

    if (scopedOrganizationId && updateUserDto.roleName === 'Super Admin') {
      throw new ForbiddenException(
        'Organization administrators cannot assign the Super Admin role',
      );
    }

    if (updateUserDto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: {
          email: updateUserDto.email,
        },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.organizationId && !updateUserDto.departmentId) {
      throw new BadRequestException(
        'departmentId is required when changing organization',
      );
    }

    if (updateUserDto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: {
          id: updateUserDto.organizationId,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
    }

    if (updateUserDto.departmentId) {
      const organizationId =
        updateUserDto.organizationId || user.organizationId;

      const department = await this.prisma.department.findFirst({
        where: {
          id: updateUserDto.departmentId,
          organizationId,
        },
      });

      if (!department) {
        throw new NotFoundException(
          'Department not found in the selected organization',
        );
      }
    }

    let roleId: string | undefined;

    if (updateUserDto.roleName) {
      const role = await this.prisma.role.findUnique({
        where: {
          roleName: updateUserDto.roleName,
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      roleId = role.id;
    }

    let hashedPassword: string | undefined;

    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        email: updateUserDto.email,
        password: hashedPassword,
        phone: updateUserDto.phone,
        status: updateUserDto.status,
        organizationId: updateUserDto.organizationId,
        departmentId: updateUserDto.departmentId,
        roleId,
      },
      select: this.userSelect,
    });

    return {
      message: 'User updated successfully',
      user: updatedUser,
    };
  }

  async deactivate(id: string, organizationId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, ...(organizationId ? { organizationId } : {}) },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deactivatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        status: UserStatus.INACTIVE,
      },
      select: this.userSelect,
    });

    return {
      message: 'User deactivated successfully',
      user: deactivatedUser,
    };
  }
}
