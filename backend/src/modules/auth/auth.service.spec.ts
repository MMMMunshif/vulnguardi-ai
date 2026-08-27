import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

describe('AuthService', () => {
  const registerDto = {
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@vulnguard.test',
    password: 'SecurePass123',
  };
  const loginUser = {
    id: 'user-1',
    firstName: 'Security',
    lastName: 'Analyst',
    email: 'analyst@vulnguard.test',
    password: 'stored-password-hash',
    status: 'ACTIVE',
    organizationId: 'org-1',
    role: { id: 'role-1', roleName: 'Security Analyst' },
    organization: { id: 'org-1', name: 'VulnGuard' },
    department: { id: 'department-1', name: 'Security Operations' },
  };
  const prisma = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organization: { findFirst: jest.fn() },
    department: { findFirst: jest.fn() },
    role: { findFirst: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const jwt = { signAsync: jest.fn() };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  it('blocks public registration after the first user exists', async () => {
    prisma.user.count.mockResolvedValue(1);

    await expect(service.register(registerDto)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('prevents a duplicate email during initial registration', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(service.register(registerDto)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('requires seeded organization, department, and Super Admin role', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
    prisma.department.findFirst.mockResolvedValue(null);
    prisma.role.findFirst.mockResolvedValue({ id: 'role-1' });

    await expect(service.register(registerDto)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('hashes the password and creates the initial administrator', async () => {
    const registeredUser = { id: 'user-1', email: registerDto.email };
    prisma.user.count.mockResolvedValue(0);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
    prisma.department.findFirst.mockResolvedValue({ id: 'department-1' });
    prisma.role.findFirst.mockResolvedValue({ id: 'role-1' });
    prisma.user.create.mockResolvedValue(registeredUser);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    await expect(service.register(registerDto)).resolves.toEqual({
      message: 'User registered successfully',
      user: registeredUser,
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password',
          organizationId: 'org-1',
          departmentId: 'department-1',
          roleId: 'role-1',
        }),
      }),
    );
  });

  it('rejects login for an unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@test.com', password: 'Password123' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('rejects login when the password does not match', async () => {
    prisma.user.findUnique.mockResolvedValue(loginUser);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      service.login({ email: loginUser.email, password: 'WrongPassword' }),
    ).rejects.toThrow('Invalid email or password');
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an inactive account after password verification', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...loginUser,
      status: 'INACTIVE',
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      service.login({ email: loginUser.email, password: 'SecurePass123' }),
    ).rejects.toThrow('User account is not active');
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('signs a tenant-aware JWT and returns a safe user response', async () => {
    prisma.user.findUnique.mockResolvedValue(loginUser);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jwt.signAsync.mockResolvedValue('signed-access-token');

    const result = await service.login({
      email: loginUser.email,
      password: 'SecurePass123',
    });

    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: loginUser.id,
      email: loginUser.email,
      role: loginUser.role.roleName,
      organizationId: loginUser.organizationId,
    });
    expect(result).toEqual({
      message: 'Login successful',
      accessToken: 'signed-access-token',
      user: {
        id: loginUser.id,
        firstName: loginUser.firstName,
        lastName: loginUser.lastName,
        email: loginUser.email,
        status: loginUser.status,
        role: loginUser.role,
        organization: loginUser.organization,
        department: loginUser.department,
      },
    });
    expect(result.user).not.toHaveProperty('password');
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'LOGIN',
        userId: loginUser.id,
        organizationId: loginUser.organizationId,
      }),
    });
  });
});
