import { ConflictException, NotFoundException } from '@nestjs/common';
import { SoftwareStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SoftwareInventoryService } from './software-inventory.service';

describe('SoftwareInventoryService', () => {
  const software = {
    id: 'software-1',
    softwareName: 'Google Chrome',
    installedVersion: '126.0.0',
    deviceId: 'device-1',
    organizationId: 'org-1',
  };
  const createDto = {
    softwareName: software.softwareName,
    installedVersion: software.installedVersion,
    deviceId: software.deviceId,
    organizationId: software.organizationId,
  };
  const prisma = {
    softwareInventory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: { findUnique: jest.fn() },
    device: { findFirst: jest.fn() },
  };

  let service: SoftwareInventoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SoftwareInventoryService(prisma as unknown as PrismaService);
  });

  it('scopes software listings to the authenticated organization', async () => {
    prisma.softwareInventory.findMany.mockResolvedValue([software]);

    await expect(service.findAll('org-1')).resolves.toEqual({
      message: 'Software inventory fetched successfully',
      softwareInventory: [software],
    });
    expect(prisma.softwareInventory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });

  it('uses tenant scope when fetching one software record', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(software);

    await service.findOne('software-1', 'org-1');

    expect(prisma.softwareInventory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'software-1', organizationId: 'org-1' },
      }),
    );
  });

  it('rejects creating software for another organization', async () => {
    await expect(service.create(createDto, 'org-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it('validates that the device belongs to the selected organization', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.device.findFirst.mockResolvedValue(null);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      'Device not found in the selected organization',
    );
    expect(prisma.device.findFirst).toHaveBeenCalledWith({
      where: { id: 'device-1', organizationId: 'org-1' },
    });
  });

  it('prevents duplicate software names on the same device', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.device.findFirst.mockResolvedValue({ id: 'device-1' });
    prisma.softwareInventory.findFirst.mockResolvedValue(software);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.softwareInventory.create).not.toHaveBeenCalled();
  });

  it('creates software and converts supplied timestamps', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.device.findFirst.mockResolvedValue({ id: 'device-1' });
    prisma.softwareInventory.findFirst.mockResolvedValue(null);
    prisma.softwareInventory.create.mockResolvedValue(software);

    await expect(
      service.create(
        {
          ...createDto,
          installDate: '2026-08-01T10:00:00.000Z',
          lastUsedAt: '2026-08-23T12:00:00.000Z',
        },
        'org-1',
      ),
    ).resolves.toEqual({
      message: 'Software inventory record created successfully',
      software,
    });
    expect(prisma.softwareInventory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          installDate: new Date('2026-08-01T10:00:00.000Z'),
          lastUsedAt: new Date('2026-08-23T12:00:00.000Z'),
        }),
      }),
    );
  });

  it('rejects updating software outside the tenant', async () => {
    prisma.softwareInventory.findFirst.mockResolvedValue(null);

    await expect(
      service.update('software-1', { publisher: 'Updated' }, 'org-2'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.softwareInventory.update).not.toHaveBeenCalled();
  });

  it('prevents renaming software to a duplicate on its device', async () => {
    prisma.softwareInventory.findFirst
      .mockResolvedValueOnce(software)
      .mockResolvedValueOnce({ ...software, id: 'software-2' });

    await expect(
      service.update(
        'software-1',
        { softwareName: 'Microsoft Edge' },
        'org-1',
      ),
    ).rejects.toThrow(ConflictException);
    expect(prisma.softwareInventory.findFirst).toHaveBeenLastCalledWith({
      where: {
        deviceId: software.deviceId,
        softwareName: 'Microsoft Edge',
        NOT: { id: 'software-1' },
      },
    });
  });

  it('updates software and converts its install date', async () => {
    const updated = { ...software, installedVersion: '127.0.0' };
    prisma.softwareInventory.findFirst.mockResolvedValue(software);
    prisma.softwareInventory.update.mockResolvedValue(updated);

    await expect(
      service.update(
        'software-1',
        {
          installedVersion: '127.0.0',
          installDate: '2026-08-24T08:00:00.000Z',
        },
        'org-1',
      ),
    ).resolves.toEqual({
      message: 'Software inventory record updated successfully',
      software: updated,
    });
    expect(prisma.softwareInventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          installDate: new Date('2026-08-24T08:00:00.000Z'),
        }),
      }),
    );
  });

  it('soft-removes only software found inside the tenant', async () => {
    const removed = { ...software, status: SoftwareStatus.REMOVED };
    prisma.softwareInventory.findFirst.mockResolvedValue(software);
    prisma.softwareInventory.update.mockResolvedValue(removed);

    await expect(service.remove('software-1', 'org-1')).resolves.toEqual({
      message: 'Software inventory record marked as removed successfully',
      software: removed,
    });
    expect(prisma.softwareInventory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: SoftwareStatus.REMOVED } }),
    );
  });
});
