import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { Prisma, RemediationStatus } from '@prisma/client';
  import { PrismaService } from '../../prisma/prisma.service';
  import { CreateRemediationActionDto } from './dto/create-remediation-action.dto';
  import { UpdateRemediationActionDto } from './dto/update-remediation-action.dto';
  
  @Injectable()
  export class RemediationActionsService {
    constructor(private readonly prisma: PrismaService) {}
  
    private readonly remediationSelect: Prisma.RemediationActionSelect = {
      id: true,
      actionTitle: true,
      actionDescription: true,
      recommendedFix: true,
      actionType: true,
      status: true,
      verificationStatus: true,
      dueDate: true,
      startedAt: true,
      completedAt: true,
      verificationNotes: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      vulnerabilityFinding: {
        select: {
          id: true,
          cveId: true,
          title: true,
          status: true,
          fixAvailability: true,
        },
      },
      softwareInventory: {
        select: {
          id: true,
          softwareName: true,
          publisher: true,
          installedVersion: true,
        },
      },
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
      assignedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };
  
    async findAll() {
      const actions = await this.prisma.remediationAction.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: this.remediationSelect,
      });
  
      return {
        message: 'Remediation actions fetched successfully',
        actions,
      };
    }
  
    async findOne(id: string) {
      const action = await this.prisma.remediationAction.findUnique({
        where: {
          id,
        },
        select: this.remediationSelect,
      });
  
      if (!action) {
        throw new NotFoundException('Remediation action not found');
      }
  
      return {
        message: 'Remediation action fetched successfully',
        action,
      };
    }
  
    async create(createDto: CreateRemediationActionDto) {
      const vulnerabilityFinding =
        await this.prisma.vulnerabilityFinding.findUnique({
          where: {
            id: createDto.vulnerabilityFindingId,
          },
        });
  
      if (!vulnerabilityFinding) {
        throw new NotFoundException('Vulnerability finding not found');
      }
  
      if (createDto.assignedUserId) {
        const user = await this.prisma.user.findFirst({
          where: {
            id: createDto.assignedUserId,
            organizationId: vulnerabilityFinding.organizationId,
          },
        });
  
        if (!user) {
          throw new NotFoundException(
            'Assigned user not found in the selected organization',
          );
        }
      }
  
      const action = await this.prisma.remediationAction.create({
        data: {
          actionTitle: createDto.actionTitle,
          actionDescription: createDto.actionDescription,
          recommendedFix: createDto.recommendedFix,
          actionType: createDto.actionType,
          status: createDto.status,
          verificationStatus: createDto.verificationStatus,
          dueDate: createDto.dueDate ? new Date(createDto.dueDate) : undefined,
          notes: createDto.notes,
          vulnerabilityFindingId: vulnerabilityFinding.id,
          softwareInventoryId: vulnerabilityFinding.softwareInventoryId,
          deviceId: vulnerabilityFinding.deviceId,
          organizationId: vulnerabilityFinding.organizationId,
          assignedUserId: createDto.assignedUserId,
        },
        select: this.remediationSelect,
      });
  
      return {
        message: 'Remediation action created successfully',
        action,
      };
    }
  
    async update(id: string, updateDto: UpdateRemediationActionDto) {
      const existingAction = await this.prisma.remediationAction.findUnique({
        where: {
          id,
        },
      });
  
      if (!existingAction) {
        throw new NotFoundException('Remediation action not found');
      }
  
      if (updateDto.assignedUserId) {
        const user = await this.prisma.user.findFirst({
          where: {
            id: updateDto.assignedUserId,
            organizationId: existingAction.organizationId,
          },
        });
  
        if (!user) {
          throw new NotFoundException(
            'Assigned user not found in the selected organization',
          );
        }
      }
  
      if (
        updateDto.status === RemediationStatus.COMPLETED &&
        !updateDto.completedAt
      ) {
        updateDto.completedAt = new Date().toISOString();
      }
  
      if (
        updateDto.completedAt &&
        updateDto.status &&
        updateDto.status !== RemediationStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'completedAt can only be set when status is COMPLETED',
        );
      }
  
      const updatedAction = await this.prisma.remediationAction.update({
        where: {
          id,
        },
        data: {
          actionTitle: updateDto.actionTitle,
          actionDescription: updateDto.actionDescription,
          recommendedFix: updateDto.recommendedFix,
          actionType: updateDto.actionType,
          status: updateDto.status,
          verificationStatus: updateDto.verificationStatus,
          dueDate: updateDto.dueDate ? new Date(updateDto.dueDate) : undefined,
          startedAt: updateDto.startedAt
            ? new Date(updateDto.startedAt)
            : undefined,
          completedAt: updateDto.completedAt
            ? new Date(updateDto.completedAt)
            : undefined,
          verificationNotes: updateDto.verificationNotes,
          notes: updateDto.notes,
          assignedUserId: updateDto.assignedUserId,
        },
        select: this.remediationSelect,
      });
  
      return {
        message: 'Remediation action updated successfully',
        action: updatedAction,
      };
    }
  
    async remove(id: string) {
      const existingAction = await this.prisma.remediationAction.findUnique({
        where: {
          id,
        },
      });
  
      if (!existingAction) {
        throw new NotFoundException('Remediation action not found');
      }
  
      await this.prisma.remediationAction.delete({
        where: {
          id,
        },
      });
  
      return {
        message: 'Remediation action deleted successfully',
      };
    }
  }