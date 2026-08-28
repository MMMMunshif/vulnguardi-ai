import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { EmailVerificationService } from '../notifications/email-verification.service';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('UsersService', () => {
  const user = {
    id: 'user-1',
    email: 'analyst@vulnguard.test',
    organizationId: 'org-1',
  };
  const createDto: CreateUserDto = {
    firstName: 'Security',
    lastName: 'Analyst',
    email: user.email,
    password: 'SecurePass123',
    organizationId: 'org-1',
    departmentId: 'department-1',
    roleName: 'Security Analyst',
  };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: { findUnique: jest.fn() },
    department: { findFirst: jest.fn() },
    role: { findUnique: jest.fn() },
  };

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      prisma as unknown as PrismaService,
      { issue: jest.fn() } as unknown as EmailVerificationService,
    );
  });

  it('scopes user listings to the authenticated organization', async () => {
    prisma.user.findMany.mockResolvedValue([user]);

    await expect(service.findAll('org-1')).resolves.toEqual({
      message: 'Users fetched successfully',
      users: [user],
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });

  it('uses organization scope when fetching a user', async () => {
    prisma.user.findFirst.mockResolvedValue(user);

    await service.findOne('user-1', 'org-1');

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1', organizationId: 'org-1' },
      }),
    );
  });

  it('rejects creating a user for another organization', async () => {
    await expect(service.create(createDto, 'org-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('prevents organization admins from creating Super Admin users', async () => {
    await expect(
      service.create({ ...createDto, roleName: 'Super Admin' }, 'org-1'),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate user emails', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('validates that the department belongs to the selected organization', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      'Department not found in the selected organization',
    );
  });

  it('hashes the password before creating a valid user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.department.findFirst.mockResolvedValue({ id: 'department-1' });
    prisma.role.findUnique.mockResolvedValue({ id: 'role-1' });
    prisma.user.create.mockResolvedValue(user);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    await expect(service.create(createDto, 'org-1')).resolves.toEqual({
      message: 'User created successfully',
      user,
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password',
          roleId: 'role-1',
        }),
      }),
    );
  });

  it('rejects cross-organization user updates', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', { firstName: 'Changed' }, 'org-2'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('requires a department when moving a user to another organization', async () => {
    prisma.user.findFirst.mockResolvedValue(user);

    await expect(
      service.update('user-1', { organizationId: 'org-2' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('prevents organization admins from assigning the Super Admin role', async () => {
    prisma.user.findFirst.mockResolvedValue(user);

    await expect(
      service.update('user-1', { roleName: 'Super Admin' }, 'org-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates a password using its hash and resolves the selected role', async () => {
    const updated = { ...user, firstName: 'Updated' };
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.role.findUnique.mockResolvedValue({ id: 'role-2' });
    prisma.user.update.mockResolvedValue(updated);
    jest.mocked(bcrypt.hash).mockResolvedValue('new-password-hash' as never);

    await service.update(
      'user-1',
      { password: 'NewSecurePass123', roleName: 'IT Technician' },
      'org-1',
    );

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'new-password-hash',
          roleId: 'role-2',
        }),
      }),
    );
  });

  it('deactivates only a user in the requested organization', async () => {
    const inactiveUser = { ...user, status: UserStatus.INACTIVE };
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(inactiveUser);

    await expect(service.deactivate('user-1', 'org-1')).resolves.toEqual({
      message: 'User deactivated successfully',
      user: inactiveUser,
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', organizationId: 'org-1' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: UserStatus.INACTIVE } }),
    );
  });
});
