import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const jwt = {
    signAsync: jest.fn(),
  };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks public registration after the first user exists', async () => {
    prisma.user.count.mockResolvedValue(1);

    await expect(
      service.register({
        firstName: 'Second',
        lastName: 'Admin',
        email: 'second@example.com',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
