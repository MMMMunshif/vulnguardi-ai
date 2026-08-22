import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateDepartmentDto } from './dto/create-department.dto';
  import { UpdateDepartmentDto } from './dto/update-department.dto';
  
  @Injectable()
  export class DepartmentsService {
    constructor(private readonly prisma: PrismaService) {}
  
    async findAll(organizationId?: string) {
      const departments = await this.prisma.department.findMany({
        where: organizationId ? { organizationId } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });
  
      return {
        message: 'Departments fetched successfully',
        departments,
      };
    }
  
    async findOne(id: string, organizationId?: string) {
      const department = await this.prisma.department.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
        },
      });
  
      if (!department) {
        throw new NotFoundException('Department not found');
      }
  
      return {
        message: 'Department fetched successfully',
        department,
      };
    }
  
    async create(createDepartmentDto: CreateDepartmentDto, organizationId?: string) {
      if (organizationId && createDepartmentDto.organizationId !== organizationId) {
        throw new NotFoundException('Organization not found');
      }

      const organization = await this.prisma.organization.findUnique({
        where: {
          id: createDepartmentDto.organizationId,
        },
      });
  
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
  
      const existingDepartment = await this.prisma.department.findFirst({
        where: {
          name: createDepartmentDto.name,
          organizationId: createDepartmentDto.organizationId,
        },
      });
  
      if (existingDepartment) {
        throw new ConflictException(
          'Department name already exists in this organization',
        );
      }
  
      const department = await this.prisma.department.create({
        data: createDepartmentDto,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
  
      return {
        message: 'Department created successfully',
        department,
      };
    }
  
    async update(id: string, updateDepartmentDto: UpdateDepartmentDto, organizationId?: string) {
      const department = await this.prisma.department.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
      });
  
      if (!department) {
        throw new NotFoundException('Department not found');
      }
  
      if (updateDepartmentDto.name) {
        const existingDepartment = await this.prisma.department.findFirst({
          where: {
            name: updateDepartmentDto.name,
            organizationId: department.organizationId,
            NOT: {
              id,
            },
          },
        });
  
        if (existingDepartment) {
          throw new ConflictException(
            'Department name already exists in this organization',
          );
        }
      }
  
      const updatedDepartment = await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
  
      return {
        message: 'Department updated successfully',
        department: updatedDepartment,
      };
    }
  
    async remove(id: string, organizationId?: string) {
      const department = await this.prisma.department.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
        include: {
          users: true,
        },
      });
  
      if (!department) {
        throw new NotFoundException('Department not found');
      }
  
      if (department.users.length > 0) {
        throw new ConflictException(
          'Cannot delete department because users are assigned to it',
        );
      }
  
      await this.prisma.department.delete({
        where: { id },
      });
  
      return {
        message: 'Department deleted successfully',
      };
    }
  }
