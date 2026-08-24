import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DevicesService } from './devices.service';

describe('DevicesService', () => {
  const device = {
    id: 'device-1',
    hostname: 'SECURITY-LAPTOP-01',
    organizationId: 'org-1',
    assignedUserId: 'user-1',
  };
  const createDto = {
    hostname: device.hostname,
    organizationId: device.organizationId,
    assignedUserId: device.assignedUserId,
  };
  const prisma = {
    device: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: { findUnique: jest.fn() },
    user: { findFirst: jest.fn() },
  };

  let service: DevicesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DevicesService(prisma as unknown as PrismaService);
  });

  it('scopes device listings to the authenticated organization', async () => {
    prisma.device.findMany.mockResolvedValue([device]);

    await expect(service.findAll('org-1')).resolves.toEqual({
      message: 'Devices fetched successfully',
      devices: [device],
    });
    expect(prisma.device.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });

  it('uses tenant scope when fetching one device', async () => {
    prisma.device.findFirst.mockResolvedValue(device);

    await service.findOne('device-1', 'org-1');

    expect(prisma.device.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'device-1', organizationId: 'org-1' },
      }),
    );
  });

  it('rejects creating a device for another organization', async () => {
    await expect(service.create(createDto, 'org-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it('prevents duplicate hostnames within an organization', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.device.findFirst.mockResolvedValue(device);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.device.create).not.toHaveBeenCalled();
  });

  it('rejects an assigned user from outside the organization', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.device.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      'Assigned user not found in the selected organization',
    );
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', organizationId: 'org-1' },
    });
  });

  it('creates a device with a valid tenant user assignment', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.device.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.device.create.mockResolvedValue(device);

    await expect(service.create(createDto, 'org-1')).resolves.toEqual({
      message: 'Device created successfully',
      device,
    });
    expect(prisma.device.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: createDto }),
    );
  });

  it('rejects updating a device outside the tenant', async () => {
    prisma.device.findFirst.mockResolvedValue(null);

    await expect(
      service.update('device-1', { osVersion: '11' }, 'org-2'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.device.update).not.toHaveBeenCalled();
  });

  it('prevents moving a scoped device to another organization', async () => {
    prisma.device.findFirst.mockResolvedValue(device);

    await expect(
      service.update('device-1', { organizationId: 'org-2' }, 'org-1'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it('prevents renaming a device to another tenant hostname', async () => {
    prisma.device.findFirst
      .mockResolvedValueOnce(device)
      .mockResolvedValueOnce({ ...device, id: 'device-2' });

    await expect(
      service.update('device-1', { hostname: 'SERVER-01' }, 'org-1'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.device.findFirst).toHaveBeenLastCalledWith({
      where: {
        hostname: 'SERVER-01',
        organizationId: 'org-1',
        NOT: { id: 'device-1' },
      },
    });
  });

  it('updates a device when its new assigned user belongs to the tenant', async () => {
    const updated = { ...device, hostname: 'SERVER-01' };
    prisma.device.findFirst
      .mockResolvedValueOnce(device)
      .mockResolvedValueOnce(null);
    prisma.user.findFirst.mockResolvedValue({ id: 'user-2' });
    prisma.device.update.mockResolvedValue(updated);

    await expect(
      service.update(
        'device-1',
        { hostname: 'SERVER-01', assignedUserId: 'user-2' },
        'org-1',
      ),
    ).resolves.toEqual({ message: 'Device updated successfully', device: updated });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-2', organizationId: 'org-1' },
    });
  });

  it('retires only a device inside the tenant', async () => {
    const retired = { ...device, status: DeviceStatus.RETIRED };
    prisma.device.findFirst.mockResolvedValue(device);
    prisma.device.update.mockResolvedValue(retired);

    await expect(service.retire('device-1', 'org-1')).resolves.toEqual({
      message: 'Device retired successfully',
      device: retired,
    });
    expect(prisma.device.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: DeviceStatus.RETIRED } }),
    );
  });
});
