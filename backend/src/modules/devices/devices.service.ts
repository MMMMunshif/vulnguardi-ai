import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { DeviceStatus } from '@prisma/client';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateDeviceDto } from './dto/create-device.dto';
  import { UpdateDeviceDto } from './dto/update-device.dto';
  
  @Injectable()
  export class DevicesService {
    constructor(private readonly prisma: PrismaService) {}
  
    private deviceSelect = {
      id: true,
      hostname: true,
      ipAddress: true,
      macAddress: true,
      osName: true,
      osVersion: true,
      deviceType: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };
  
    async findAll(organizationId?: string) {
      const devices = await this.prisma.device.findMany({
        where: organizationId ? { organizationId } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        select: this.deviceSelect,
      });
  
      return {
        message: 'Devices fetched successfully',
        devices,
      };
    }
  
    async findOne(id: string, organizationId?: string) {
      const device = await this.prisma.device.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
        select: this.deviceSelect,
      });
  
      if (!device) {
        throw new NotFoundException('Device not found');
      }
  
      return {
        message: 'Device fetched successfully',
        device,
      };
    }
  
    async create(createDeviceDto: CreateDeviceDto, organizationId?: string) {
      if (organizationId && createDeviceDto.organizationId !== organizationId) {
        throw new NotFoundException('Organization not found');
      }

      const organization = await this.prisma.organization.findUnique({
        where: {
          id: createDeviceDto.organizationId,
        },
      });
  
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
  
      const existingDevice = await this.prisma.device.findFirst({
        where: {
          hostname: createDeviceDto.hostname,
          organizationId: createDeviceDto.organizationId,
        },
      });
  
      if (existingDevice) {
        throw new ConflictException(
          'Device hostname already exists in this organization',
        );
      }
  
      if (createDeviceDto.assignedUserId) {
        const user = await this.prisma.user.findFirst({
          where: {
            id: createDeviceDto.assignedUserId,
            organizationId: createDeviceDto.organizationId,
          },
        });
  
        if (!user) {
          throw new NotFoundException(
            'Assigned user not found in the selected organization',
          );
        }
      }
  
      const device = await this.prisma.device.create({
        data: createDeviceDto,
        select: this.deviceSelect,
      });
  
      return {
        message: 'Device created successfully',
        device,
      };
    }
  
    async update(id: string, updateDeviceDto: UpdateDeviceDto, scopedOrganizationId?: string) {
      const device = await this.prisma.device.findFirst({
        where: { id, ...(scopedOrganizationId ? { organizationId: scopedOrganizationId } : {}) },
      });
  
      if (!device) {
        throw new NotFoundException('Device not found');
      }

      if (
        scopedOrganizationId &&
        updateDeviceDto.organizationId &&
        updateDeviceDto.organizationId !== scopedOrganizationId
      ) {
        throw new NotFoundException('Organization not found');
      }
  
      const organizationId = updateDeviceDto.organizationId || device.organizationId;
  
      if (updateDeviceDto.organizationId) {
        const organization = await this.prisma.organization.findUnique({
          where: {
            id: updateDeviceDto.organizationId,
          },
        });
  
        if (!organization) {
          throw new NotFoundException('Organization not found');
        }
      }
  
      if (updateDeviceDto.hostname) {
        const existingDevice = await this.prisma.device.findFirst({
          where: {
            hostname: updateDeviceDto.hostname,
            organizationId,
            NOT: {
              id,
            },
          },
        });
  
        if (existingDevice) {
          throw new ConflictException(
            'Device hostname already exists in this organization',
          );
        }
      }
  
      if (updateDeviceDto.assignedUserId) {
        const user = await this.prisma.user.findFirst({
          where: {
            id: updateDeviceDto.assignedUserId,
            organizationId,
          },
        });
  
        if (!user) {
          throw new NotFoundException(
            'Assigned user not found in the selected organization',
          );
        }
      }
  
      const updatedDevice = await this.prisma.device.update({
        where: {
          id,
        },
        data: updateDeviceDto,
        select: this.deviceSelect,
      });
  
      return {
        message: 'Device updated successfully',
        device: updatedDevice,
      };
    }
  
    async retire(id: string, organizationId?: string) {
      const device = await this.prisma.device.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
      });
  
      if (!device) {
        throw new NotFoundException('Device not found');
      }
  
      const retiredDevice = await this.prisma.device.update({
        where: {
          id,
        },
        data: {
          status: DeviceStatus.RETIRED,
        },
        select: this.deviceSelect,
      });
  
      return {
        message: 'Device retired successfully',
        device: retiredDevice,
      };
    }
  }
