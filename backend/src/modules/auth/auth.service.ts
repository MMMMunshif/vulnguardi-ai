import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, password } = registerDto;

    const userCount = await this.prisma.user.count();

    if (userCount > 0) {
      throw new ForbiddenException(
        'Public registration is disabled after the initial administrator is created',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const organization = await this.prisma.organization.findFirst();
    const department = await this.prisma.department.findFirst();
    const role = await this.prisma.role.findFirst({
      where: {
        roleName: 'Super Admin',
      },
    });

    if (!organization || !department || !role) {
      throw new InternalServerErrorException(
        'Default organization, department, or role not found. Please run database seed.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        organizationId: organization.id,
        departmentId: department.id,
        roleId: role.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        role: {
          select: {
            id: true,
            roleName: true,
          },
        },
      },
    });

    return {
      message: 'User registered successfully',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
        organization: true,
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.roleName,
      organizationId: user.organizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          resource: 'auth',
          resourceId: user.id,
          method: 'POST',
          path: '/auth/login',
          statusCode: 200,
          actorEmail: user.email,
          message: 'User logged in successfully',
          userId: user.id,
          organizationId: user.organizationId,
        },
      });
    } catch {
      // Authentication remains available if audit persistence is temporarily unavailable.
    }

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        role: {
          id: user.role.id,
          roleName: user.role.roleName,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
        department: {
          id: user.department.id,
          name: user.department.name,
        },
      },
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const genericResponse = {
      message: 'If an active account exists, a password reset link has been sent',
    };
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') return genericResponse;

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      }),
    ]);
    this.notificationsService.queuePasswordResetEmail(user.email, token);
    return genericResponse;
  }

  async resetPassword({ token, password }: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new BadRequestException('Password reset link is invalid or expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Password reset successfully' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
