import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateOrganizationDto } from './dto/create-organization.dto';
  import { UpdateOrganizationDto } from './dto/update-organization.dto';
  
  @Injectable()
  export class OrganizationsService {
    constructor(private readonly prisma: PrismaService) {}
  
    async findAll(organizationId?: string) {
      const organizations = await this.prisma.organization.findMany({
        where: organizationId ? { id: organizationId } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          website: true,
          industry: true,
          country: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              departments: true,
            },
          },
        },
      });
  
      return {
        message: 'Organizations fetched successfully',
        organizations,
      };
    }
  
    async findOne(id: string, organizationId?: string) {
      if (organizationId && id !== organizationId) {
        throw new NotFoundException('Organization not found');
      }

      const organization = await this.prisma.organization.findFirst({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          website: true,
          industry: true,
          country: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
  
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
  
      return {
        message: 'Organization fetched successfully',
        organization,
      };
    }
  
    async create(createOrganizationDto: CreateOrganizationDto) {
      const existingOrganization = await this.prisma.organization.findUnique({
        where: {
          email: createOrganizationDto.email,
        },
      });
  
      if (existingOrganization) {
        throw new ConflictException('Organization email already exists');
      }
  
      const organization = await this.prisma.organization.create({
        data: createOrganizationDto,
      });
  
      return {
        message: 'Organization created successfully',
        organization,
      };
    }
  
    async update(id: string, updateOrganizationDto: UpdateOrganizationDto, organizationId?: string) {
      if (organizationId && id !== organizationId) {
        throw new NotFoundException('Organization not found');
      }

      const organization = await this.prisma.organization.findFirst({
        where: { id },
      });
  
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
  
      if (updateOrganizationDto.email) {
        const existingEmail = await this.prisma.organization.findUnique({
          where: {
            email: updateOrganizationDto.email,
          },
        });
  
        if (existingEmail && existingEmail.id !== id) {
          throw new ConflictException('Organization email already exists');
        }
      }
  
      const updatedOrganization = await this.prisma.organization.update({
        where: {
          id,
        },
        data: updateOrganizationDto,
      });
  
      return {
        message: 'Organization updated successfully',
        organization: updatedOrganization,
      };
    }
  
    async suspend(id: string) {
      const organization = await this.prisma.organization.findUnique({
        where: {
          id,
        },
      });
  
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
  
      const suspendedOrganization = await this.prisma.organization.update({
        where: {
          id,
        },
        data: {
          status: 'SUSPENDED',
        },
      });
  
      return {
        message: 'Organization suspended successfully',
        organization: suspendedOrganization,
      };
    }
  }
