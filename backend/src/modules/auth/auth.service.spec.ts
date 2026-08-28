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
import { NotificationsService } from '../notifications/notifications.service';
import { EmailVerificationService } from '../notifications/email-verification.service';

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
    emailVerifiedAt: new Date(),
  };
  const prisma = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: { findFirst: jest.fn() },
    department: { findFirst: jest.fn() },
    role: { findFirst: jest.fn() },
    auditLog: { create: jest.fn() },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwt = { signAsync: jest.fn() };
  const notifications = { queuePasswordResetEmail: jest.fn() };
  const emailVerification = { issue: jest.fn(), verify: jest.fn() };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      notifications as unknown as NotificationsService,
      emailVerification as unknown as EmailVerificationService,
    );
  });

  it('requires email verification before login', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...loginUser, emailVerifiedAt: null });
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    await expect(service.login({ email: loginUser.email, password: 'SecurePass123' })).rejects.toThrow('verify your email');
  });

  it('verifies email tokens and safely resends only when required', async () => {
    await expect(service.verifyEmail({ token: 'a'.repeat(64) })).resolves.toEqual({ message: 'Email verified successfully' });
    expect(emailVerification.verify).toHaveBeenCalledWith('a'.repeat(64));

    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.com', status: 'ACTIVE', emailVerifiedAt: null });
    await service.resendVerification({ email: 'user@test.com' });
    expect(emailVerification.issue).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
  });

  it('returns a generic forgot-password response without revealing unknown accounts', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.forgotPassword({ email: 'missing@test.com' })).resolves.toEqual({
      message: 'If an active account exists, a password reset link has been sent',
    });
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('does not create reset tokens for inactive accounts', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'inactive@test.com', status: 'INACTIVE' });
    await service.forgotPassword({ email: 'inactive@test.com' });
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(notifications.queuePasswordResetEmail).not.toHaveBeenCalled();
  });

  it('creates a hashed reset token and queues an email for an active account', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.com', status: 'ACTIVE' });
    prisma.$transaction.mockResolvedValue([]);
    await service.forgotPassword({ email: 'user@test.com' });
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    });
    expect(notifications.queuePasswordResetEmail).toHaveBeenCalledWith('user@test.com', expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it('rejects expired password reset tokens', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({ id: 'token-1', userId: 'user-1', usedAt: null, expiresAt: new Date(Date.now() - 1000) });
    await expect(service.resetPassword({ token: 'a'.repeat(64), password: 'NewPassword123' })).rejects.toThrow('invalid or expired');
  });

  it('rejects missing and already-used password reset tokens', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'token-1', userId: 'user-1', usedAt: new Date(), expiresAt: new Date(Date.now() + 10000),
    });
    await expect(service.resetPassword({ token: 'c'.repeat(64), password: 'NewPassword123' })).rejects.toThrow('invalid or expired');
    await expect(service.resetPassword({ token: 'd'.repeat(64), password: 'NewPassword123' })).rejects.toThrow('invalid or expired');
  });

  it('hashes the new password and consumes a valid reset token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({ id: 'token-1', userId: 'user-1', usedAt: null, expiresAt: new Date(Date.now() + 10000) });
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    prisma.$transaction.mockResolvedValue([]);
    await expect(service.resetPassword({ token: 'b'.repeat(64), password: 'NewPassword123' })).resolves.toEqual({ message: 'Password reset successfully' });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { password: 'new-hash' } });
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({ where: { id: 'token-1' }, data: { usedAt: expect.any(Date) } });
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
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-1' });

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
      refreshToken: expect.stringMatching(/^[a-f0-9]{96}$/),
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

  it('rotates valid refresh tokens and revokes logout tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh-1', revokedAt: null, expiresAt: new Date(Date.now() + 10000),
      user: loginUser,
    });
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    jwt.signAsync.mockResolvedValue('renewed-access-token');
    const refreshed = await service.refresh({ refreshToken: 'r'.repeat(64) });
    expect(refreshed.accessToken).toBe('renewed-access-token');
    expect(refreshed.refreshToken).toMatch(/^[a-f0-9]{96}$/);
    await expect(service.logout({ refreshToken: 'r'.repeat(64) })).resolves.toEqual({ message: 'Logout successful' });
  });
});
