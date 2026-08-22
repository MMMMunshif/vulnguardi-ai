import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { SoftwareStatus } from '@prisma/client';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateSoftwareInventoryDto } from './dto/create-software-inventory.dto';
  import { UpdateSoftwareInventoryDto } from './dto/update-software-inventory.dto';
  
  @Injectable()
  export class SoftwareInventoryService {
    constructor(private readonly prisma: PrismaService) {}
  
    private softwareSelect = {
      id: true,
      softwareName: true,
      publisher: true,
      installedVersion: true,
      installedPath: true,
      installDate: true,
      lastUsedAt: true,
      source: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      device: {
        select: {
          id: true,
          hostname: true,
          ipAddress: true,
          osName: true,
          osVersion: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    };
  
    async findAll(organizationId?: string) {
      const softwareInventory = await this.prisma.softwareInventory.findMany({
        where: organizationId ? { organizationId } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        select: this.softwareSelect,
      });
  
      return {
        message: 'Software inventory fetched successfully',
        softwareInventory,
      };
    }
  
    async findOne(id: string, organizationId?: string) {
      const software = await this.prisma.softwareInventory.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
        select: this.softwareSelect,
      });
  
      if (!software) {
        throw new NotFoundException('Software inventory record not found');
      }
  
      return {
        message: 'Software inventory record fetched successfully',
        software,
      };
    }
  
    async create(createSoftwareInventoryDto: CreateSoftwareInventoryDto, organizationId?: string) {
      if (
        organizationId &&
        createSoftwareInventoryDto.organizationId !== organizationId
      ) {
        throw new NotFoundException('Organization not found');
      }

      const organization = await this.prisma.organization.findUnique({
        where: {
          id: createSoftwareInventoryDto.organizationId,
        },
      });
  
      if (!organization) {
        throw new NotFoundException('Organization not found');
      }
  
      const device = await this.prisma.device.findFirst({
        where: {
          id: createSoftwareInventoryDto.deviceId,
          organizationId: createSoftwareInventoryDto.organizationId,
        },
      });
  
      if (!device) {
        throw new NotFoundException(
          'Device not found in the selected organization',
        );
      }
  
      const existingSoftware = await this.prisma.softwareInventory.findFirst({
        where: {
          deviceId: createSoftwareInventoryDto.deviceId,
          softwareName: createSoftwareInventoryDto.softwareName,
        },
      });
  
      if (existingSoftware) {
        throw new ConflictException(
          'Software already exists for this device. Please update the existing record.',
        );
      }
  
      const software = await this.prisma.softwareInventory.create({
        data: {
          ...createSoftwareInventoryDto,
          installDate: createSoftwareInventoryDto.installDate
            ? new Date(createSoftwareInventoryDto.installDate)
            : undefined,
          lastUsedAt: createSoftwareInventoryDto.lastUsedAt
            ? new Date(createSoftwareInventoryDto.lastUsedAt)
            : undefined,
        },
        select: this.softwareSelect,
      });
  
      return {
        message: 'Software inventory record created successfully',
        software,
      };
    }
  
    async update(id: string, updateSoftwareInventoryDto: UpdateSoftwareInventoryDto, organizationId?: string) {
      const software = await this.prisma.softwareInventory.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
      });
  
      if (!software) {
        throw new NotFoundException('Software inventory record not found');
      }
  
      if (updateSoftwareInventoryDto.softwareName) {
        const existingSoftware = await this.prisma.softwareInventory.findFirst({
          where: {
            deviceId: software.deviceId,
            softwareName: updateSoftwareInventoryDto.softwareName,
            NOT: {
              id,
            },
          },
        });
  
        if (existingSoftware) {
          throw new ConflictException(
            'Software name already exists for this device',
          );
        }
      }
  
      const updatedSoftware = await this.prisma.softwareInventory.update({
        where: {
          id,
        },
        data: {
          softwareName: updateSoftwareInventoryDto.softwareName,
          publisher: updateSoftwareInventoryDto.publisher,
          installedVersion: updateSoftwareInventoryDto.installedVersion,
          installedPath: updateSoftwareInventoryDto.installedPath,
          installDate: updateSoftwareInventoryDto.installDate
            ? new Date(updateSoftwareInventoryDto.installDate)
            : undefined,
          lastUsedAt: updateSoftwareInventoryDto.lastUsedAt
            ? new Date(updateSoftwareInventoryDto.lastUsedAt)
            : undefined,
          source: updateSoftwareInventoryDto.source,
          status: updateSoftwareInventoryDto.status,
        },
        select: this.softwareSelect,
      });
  
      return {
        message: 'Software inventory record updated successfully',
        software: updatedSoftware,
      };
    }
  
    async remove(id: string, organizationId?: string) {
      const software = await this.prisma.softwareInventory.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
      });
  
      if (!software) {
        throw new NotFoundException('Software inventory record not found');
      }
  
      const removedSoftware = await this.prisma.softwareInventory.update({
        where: {
          id,
        },
        data: {
          status: SoftwareStatus.REMOVED,
        },
        select: this.softwareSelect,
      });
  
      return {
        message: 'Software inventory record marked as removed successfully',
        software: removedSoftware,
      };
    }
  }
