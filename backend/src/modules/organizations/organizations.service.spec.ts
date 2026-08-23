import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const organization = {
    id: 'org-1',
    name: 'VulnGuard',
    email: 'security@vulnguard.test',
  };

  const prisma = {
    organization: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: OrganizationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationsService(prisma as unknown as PrismaService);
  });

  it('scopes organization listings when an organization id is provided', async () => {
    prisma.organization.findMany.mockResolvedValue([organization]);

    await expect(service.findAll('org-1')).resolves.toEqual({
      message: 'Organizations fetched successfully',
      organizations: [organization],
    });
    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'org-1' } }),
    );
  });

  it('rejects cross-organization reads before querying the database', async () => {
    await expect(service.findOne('org-2', 'org-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.organization.findFirst).not.toHaveBeenCalled();
  });

  it('returns an organization belonging to the requested tenant', async () => {
    prisma.organization.findFirst.mockResolvedValue(organization);

    await expect(service.findOne('org-1', 'org-1')).resolves.toEqual({
      message: 'Organization fetched successfully',
      organization,
    });
  });

  it('throws when an organization cannot be found', async () => {
    prisma.organization.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('prevents creating an organization with a duplicate email', async () => {
    prisma.organization.findUnique.mockResolvedValue(organization);

    await expect(
      service.create({ name: 'Duplicate', email: organization.email }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.organization.create).not.toHaveBeenCalled();
  });

  it('creates an organization when its email is available', async () => {
    prisma.organization.findUnique.mockResolvedValue(null);
    prisma.organization.create.mockResolvedValue(organization);

    await expect(
      service.create({ name: organization.name, email: organization.email }),
    ).resolves.toEqual({
      message: 'Organization created successfully',
      organization,
    });
  });

  it('prevents changing an organization to another organization email', async () => {
    prisma.organization.findFirst.mockResolvedValue(organization);
    prisma.organization.findUnique.mockResolvedValue({
      id: 'org-2',
      email: 'other@vulnguard.test',
    });

    await expect(
      service.update('org-1', { email: 'other@vulnguard.test' }, 'org-1'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.organization.update).not.toHaveBeenCalled();
  });

  it('updates an organization within its tenant', async () => {
    const updated = { ...organization, name: 'VulnGuard AI' };
    prisma.organization.findFirst.mockResolvedValue(organization);
    prisma.organization.update.mockResolvedValue(updated);

    await expect(
      service.update('org-1', { name: updated.name }, 'org-1'),
    ).resolves.toEqual({
      message: 'Organization updated successfully',
      organization: updated,
    });
  });

  it('suspends an existing organization', async () => {
    const suspended = { ...organization, status: 'SUSPENDED' };
    prisma.organization.findUnique.mockResolvedValue(organization);
    prisma.organization.update.mockResolvedValue(suspended);

    await expect(service.suspend('org-1')).resolves.toEqual({
      message: 'Organization suspended successfully',
      organization: suspended,
    });
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { status: 'SUSPENDED' },
    });
  });
});
