import { NotFoundException } from '@nestjs/common';
import { SoftwareUpdateStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SoftwareUpdateFindingsService } from './software-update-findings.service';

describe('SoftwareUpdateFindingsService', () => {
  const software = {
    id: 'software-1',
    installedVersion: '126.0.0',
    deviceId: 'device-1',
    organizationId: 'org-1',
  };
  const finding = {
    id: 'update-1',
    installedVersion: '126.0.0',
    latestVersion: '127.0.0',
    updateAvailable: true,
    status: SoftwareUpdateStatus.OUTDATED,
    organizationId: 'org-1',
  };
  const prisma = {
    softwareUpdateFinding: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    softwareInventory: { findFirst: jest.fn() },
  };

  let service: SoftwareUpdateFindingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SoftwareUpdateFindingsService(
      prisma as unknown as PrismaService,
    );
  });

  it('scopes update findings to the authenticated organization', async () => {
    prisma.softwareUpdateFinding.findMany.mockResolvedValue([finding]);

    await expect(service.findAll('org-1')).resolves.toEqual({
      message: 'Software update findings fetched successfully',
      findings: [finding],
    });
    expect(prisma.softwareUpdateFinding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });

  it('applies tenant scope when fetching one update finding', async () => {
    prisma.softwareUpdateFinding.findFirst.mockResolvedValue(finding);

    await service.findOne('update-1', 'org-1');

    expect(prisma.softwareUpdateFinding.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'update-1', organizationId: 'org-1' },
      }),
    );
  });

  it('rejects software inventory outside the tenant', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(null);

    await expect(
      service.create({ softwareInventoryId: 'software-1' }, 'org-2'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.softwareUpdateFinding.create).not.toHaveBeenCalled();
  });

  it('marks different installed and latest versions as outdated', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(software);
    prisma.softwareUpdateFinding.create.mockResolvedValue(finding);

    await service.create(
      { softwareInventoryId: software.id, latestVersion: '127.0.0' },
      'org-1',
    );

    expect(prisma.softwareUpdateFinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          installedVersion: '126.0.0',
          updateAvailable: true,
          status: SoftwareUpdateStatus.OUTDATED,
          deviceId: software.deviceId,
          organizationId: software.organizationId,
        }),
      }),
    );
  });

  it('marks equal versions as up to date', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(software);
    prisma.softwareUpdateFinding.create.mockResolvedValue(finding);

    await service.create(
      { softwareInventoryId: software.id, latestVersion: '126.0.0' },
      'org-1',
    );

    expect(prisma.softwareUpdateFinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          updateAvailable: false,
          status: SoftwareUpdateStatus.UP_TO_DATE,
        }),
      }),
    );
  });

  it('keeps status unknown when version information is incomplete', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(software);
    prisma.softwareUpdateFinding.create.mockResolvedValue(finding);

    await service.create({ softwareInventoryId: software.id }, 'org-1');

    expect(prisma.softwareUpdateFinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          updateAvailable: false,
          status: SoftwareUpdateStatus.UNKNOWN,
        }),
      }),
    );
  });

  it('honors an explicit update availability override', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(software);
    prisma.softwareUpdateFinding.create.mockResolvedValue(finding);

    await service.create(
      {
        softwareInventoryId: software.id,
        latestVersion: '127.0.0',
        updateAvailable: false,
      },
      'org-1',
    );

    expect(prisma.softwareUpdateFinding.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          updateAvailable: false,
          status: SoftwareUpdateStatus.UP_TO_DATE,
        }),
      }),
    );
  });

  it('recalculates status when an update installs the latest version', async () => {
    const updated = {
      ...finding,
      installedVersion: '127.0.0',
      updateAvailable: false,
      status: SoftwareUpdateStatus.UP_TO_DATE,
    };
    prisma.softwareUpdateFinding.findFirst.mockResolvedValue(finding);
    prisma.softwareUpdateFinding.update.mockResolvedValue(updated);

    await expect(
      service.update(
        'update-1',
        { installedVersion: '127.0.0' },
        'org-1',
      ),
    ).resolves.toEqual({
      message: 'Software update finding updated successfully',
      finding: updated,
    });
    expect(prisma.softwareUpdateFinding.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          updateAvailable: false,
          status: SoftwareUpdateStatus.UP_TO_DATE,
          checkedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('deletes only an update finding inside the tenant', async () => {
    prisma.softwareUpdateFinding.findFirst.mockResolvedValue(finding);
    prisma.softwareUpdateFinding.delete.mockResolvedValue(finding);

    await expect(service.remove('update-1', 'org-1')).resolves.toEqual({
      message: 'Software update finding deleted successfully',
    });
    expect(prisma.softwareUpdateFinding.findFirst).toHaveBeenCalledWith({
      where: { id: 'update-1', organizationId: 'org-1' },
    });
    expect(prisma.softwareUpdateFinding.delete).toHaveBeenCalledWith({
      where: { id: 'update-1' },
    });
  });
});
