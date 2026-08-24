import { Injectable, NotFoundException } from '@nestjs/common';
import { SoftwareUpdateStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSoftwareUpdateFindingDto } from './dto/create-software-update-finding.dto';
import { UpdateSoftwareUpdateFindingDto } from './dto/update-software-update-finding.dto';

@Injectable()
export class SoftwareUpdateFindingsService {
  constructor(private readonly prisma: PrismaService) {}

  private updateFindingSelect = {
    id: true,
    installedVersion: true,
    latestVersion: true,
    updateAvailable: true,
    status: true,
    source: true,
    checkedAt: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    softwareInventory: {
      select: {
        id: true,
        softwareName: true,
        publisher: true,
        installedVersion: true,
        status: true,
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
  };

  private calculateStatus(
    installedVersion?: string | null,
    latestVersion?: string | null,
    updateAvailable?: boolean,
  ) {
    if (typeof updateAvailable === 'boolean') {
      return updateAvailable
        ? SoftwareUpdateStatus.OUTDATED
        : SoftwareUpdateStatus.UP_TO_DATE;
    }

    if (!installedVersion || !latestVersion) {
      return SoftwareUpdateStatus.UNKNOWN;
    }

    return installedVersion === latestVersion
      ? SoftwareUpdateStatus.UP_TO_DATE
      : SoftwareUpdateStatus.OUTDATED;
  }

  private calculateUpdateAvailable(
    installedVersion?: string | null,
    latestVersion?: string | null,
    updateAvailable?: boolean,
  ) {
    if (typeof updateAvailable === 'boolean') {
      return updateAvailable;
    }

    if (!installedVersion || !latestVersion) {
      return false;
    }

    return installedVersion !== latestVersion;
  }

  async findAll(organizationId?: string) {
    const findings = await this.prisma.softwareUpdateFinding.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      select: this.updateFindingSelect,
    });

    return {
      message: 'Software update findings fetched successfully',
      findings,
    };
  }

  async findOne(id: string, organizationId?: string) {
    const finding = await this.prisma.softwareUpdateFinding.findFirst({
      where: { id, ...(organizationId ? { organizationId } : {}) },
      select: this.updateFindingSelect,
    });

    if (!finding) {
      throw new NotFoundException('Software update finding not found');
    }

    return {
      message: 'Software update finding fetched successfully',
      finding,
    };
  }

  async create(createDto: CreateSoftwareUpdateFindingDto, organizationId?: string) {
    const softwareInventory = await this.prisma.softwareInventory.findFirst({
      where: {
        id: createDto.softwareInventoryId,
        ...(organizationId ? { organizationId } : {}),
      },
    });

    if (!softwareInventory) {
      throw new NotFoundException('Software inventory record not found');
    }

    const installedVersion =
      createDto.installedVersion || softwareInventory.installedVersion;

    const latestVersion = createDto.latestVersion;

    const updateAvailable = this.calculateUpdateAvailable(
      installedVersion,
      latestVersion,
      createDto.updateAvailable,
    );

    const status =
      createDto.status ||
      this.calculateStatus(
        installedVersion,
        latestVersion,
        createDto.updateAvailable,
      );

    const finding = await this.prisma.softwareUpdateFinding.create({
      data: {
        installedVersion,
        latestVersion,
        updateAvailable,
        status,
        source: createDto.source,
        notes: createDto.notes,
        softwareInventoryId: softwareInventory.id,
        deviceId: softwareInventory.deviceId,
        organizationId: softwareInventory.organizationId,
      },
      select: this.updateFindingSelect,
    });

    return {
      message: 'Software update finding created successfully',
      finding,
    };
  }

  async update(id: string, updateDto: UpdateSoftwareUpdateFindingDto, organizationId?: string) {
    const finding = await this.prisma.softwareUpdateFinding.findFirst({
      where: { id, ...(organizationId ? { organizationId } : {}) },
    });

    if (!finding) {
      throw new NotFoundException('Software update finding not found');
    }

    const installedVersion =
      updateDto.installedVersion || finding.installedVersion;

    const latestVersion = updateDto.latestVersion || finding.latestVersion;

    const updateAvailable = this.calculateUpdateAvailable(
      installedVersion,
      latestVersion,
      updateDto.updateAvailable,
    );

    const status =
      updateDto.status ||
      this.calculateStatus(
        installedVersion,
        latestVersion,
        updateDto.updateAvailable,
      );

    const updatedFinding = await this.prisma.softwareUpdateFinding.update({
      where: {
        id,
      },
      data: {
        installedVersion,
        latestVersion,
        updateAvailable,
        status,
        source: updateDto.source,
        notes: updateDto.notes,
        checkedAt: new Date(),
      },
      select: this.updateFindingSelect,
    });

    return {
      message: 'Software update finding updated successfully',
      finding: updatedFinding,
    };
  }

  async remove(id: string, organizationId?: string) {
    const finding = await this.prisma.softwareUpdateFinding.findFirst({
      where: { id, ...(organizationId ? { organizationId } : {}) },
    });

    if (!finding) {
      throw new NotFoundException('Software update finding not found');
    }

    await this.prisma.softwareUpdateFinding.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Software update finding deleted successfully',
    };
  }
}
