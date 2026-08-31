  import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import {
    Prisma,
    RemediationStatus,
    RemediationVerificationStatus,
    VulnerabilityStatus,
  } from '@prisma/client';
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
      evidence: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
      },
    };
  
    async findAll(organizationId?: string) {
      const actions = await this.prisma.remediationAction.findMany({
        where: organizationId ? { organizationId } : undefined,
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
  
    async findOne(id: string, organizationId?: string) {
      const action = await this.prisma.remediationAction.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
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
  
    async create(createDto: CreateRemediationActionDto, organizationId?: string) {
      const vulnerabilityFinding =
        await this.prisma.vulnerabilityFinding.findFirst({
          where: {
            id: createDto.vulnerabilityFindingId,
            ...(organizationId ? { organizationId } : {}),
          },
        });
  
      if (!vulnerabilityFinding) {
        throw new NotFoundException('Vulnerability finding not found');
      }

      const existingRemediation =
        await this.prisma.remediationAction.findFirst({
          where: {
            vulnerabilityFindingId: vulnerabilityFinding.id,
          },
          select: {
            id: true,
          },
        });

      if (existingRemediation) {
        throw new ConflictException({
          message:
            'A remediation action already exists for this vulnerability finding',
          existingActionId: existingRemediation.id,
        });
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
  
    async update(id: string, updateDto: UpdateRemediationActionDto, organizationId?: string) {
      const existingAction = await this.prisma.remediationAction.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
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
        updateDto.status === RemediationStatus.IN_PROGRESS &&
        !updateDto.startedAt &&
        !existingAction.startedAt
      ) {
        updateDto.startedAt = new Date().toISOString();
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

      const requestedStatus = updateDto.status ?? existingAction.status;
      const requestedVerificationStatus =
        updateDto.verificationStatus ?? existingAction.verificationStatus;

      if (
        requestedVerificationStatus ===
          RemediationVerificationStatus.VERIFIED &&
        requestedStatus !== RemediationStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'verificationStatus can only be VERIFIED when status is COMPLETED',
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

      const finalStatus = updateDto.status ?? existingAction.status;
      const finalVerificationStatus =
        updateDto.verificationStatus ?? existingAction.verificationStatus;
      const vulnerabilityResolved =
        finalStatus === RemediationStatus.COMPLETED &&
        finalVerificationStatus === RemediationVerificationStatus.VERIFIED;
      const vulnerabilityInProgress =
        finalStatus === RemediationStatus.IN_PROGRESS;
      const synchronizedVulnerabilityStatus = vulnerabilityResolved
        ? VulnerabilityStatus.RESOLVED
        : vulnerabilityInProgress
          ? VulnerabilityStatus.IN_PROGRESS
          : null;

      if (synchronizedVulnerabilityStatus) {
        await this.prisma.vulnerabilityFinding.update({
          where: {
            id: existingAction.vulnerabilityFindingId,
          },
          data: {
            status: synchronizedVulnerabilityStatus,
          },
        });
      }
  
      return {
        message: vulnerabilityResolved
          ? 'Remediation action updated and vulnerability resolved successfully'
          : vulnerabilityInProgress
            ? 'Remediation action and vulnerability marked as in progress'
          : 'Remediation action updated successfully',
        action: updatedAction,
        vulnerabilityResolved,
        vulnerabilityInProgress,
        vulnerabilityStatus: synchronizedVulnerabilityStatus,
      };
    }
  
    async remove(id: string, organizationId?: string) {
      const existingAction = await this.prisma.remediationAction.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
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

    async addEvidence(id: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }, userId: string, organizationId?: string) {
      const action = await this.prisma.remediationAction.findFirst({
        where: { id, ...(organizationId ? { organizationId } : {}) },
      });
      if (!action) throw new NotFoundException('Remediation action not found');
      const allowed = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
      if (!allowed.includes(file.mimetype)) throw new BadRequestException('Only PNG, JPEG, PDF, and text evidence is allowed');
      if (!file.size || file.size > 5 * 1024 * 1024) throw new BadRequestException('Evidence file must be 5 MB or smaller');
      const evidence = await this.prisma.remediationEvidence.create({
        data: {
          fileName: file.originalname.slice(0, 255), mimeType: file.mimetype, size: file.size,
          data: Uint8Array.from(file.buffer), remediationActionId: id, uploadedById: userId,
          organizationId: action.organizationId,
        },
        select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
      });
      return { message: 'Evidence uploaded successfully', evidence };
    }

    async getEvidence(evidenceId: string, organizationId?: string) {
      const evidence = await this.prisma.remediationEvidence.findFirst({
        where: { id: evidenceId, ...(organizationId ? { organizationId } : {}) },
      });
      if (!evidence) throw new NotFoundException('Evidence not found');
      return evidence;
    }

    async removeEvidence(evidenceId: string, organizationId?: string) {
      const evidence = await this.getEvidence(evidenceId, organizationId);
      await this.prisma.remediationEvidence.delete({ where: { id: evidence.id } });
      return { message: 'Evidence deleted successfully' };
    }
  }
