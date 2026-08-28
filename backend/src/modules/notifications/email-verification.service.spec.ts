import { PrismaService } from '../../prisma/prisma.service';
import { EmailVerificationService } from './email-verification.service';
import { NotificationsService } from './notifications.service';

describe('EmailVerificationService', () => {
  const prisma = {
    emailVerificationToken: {
      deleteMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(),
    },
    user: { update: jest.fn() },
    $transaction: jest.fn(),
  };
  const notifications = { queueEmailVerification: jest.fn() };
  let service: EmailVerificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([]);
    service = new EmailVerificationService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('issues only a hashed, expiring token and emails the raw token', async () => {
    await service.issue({ id: 'user-1', email: 'user@test.com' });
    expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), expiresAt: expect.any(Date) }),
    });
    expect(notifications.queueEmailVerification).toHaveBeenCalledWith('user@test.com', expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it('rejects invalid, used, and expired verification links', async () => {
    prisma.emailVerificationToken.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ usedAt: new Date(), expiresAt: new Date(Date.now() + 1000) })
      .mockResolvedValueOnce({ usedAt: null, expiresAt: new Date(Date.now() - 1000) });
    for (const token of ['a', 'b', 'c']) {
      await expect(service.verify(token.repeat(64))).rejects.toThrow('invalid or expired');
    }
  });

  it('marks a valid email and token as verified', async () => {
    prisma.emailVerificationToken.findUnique.mockResolvedValue({ id: 'token-1', userId: 'user-1', usedAt: null, expiresAt: new Date(Date.now() + 1000) });
    await service.verify('d'.repeat(64));
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { emailVerifiedAt: expect.any(Date) } });
    expect(prisma.emailVerificationToken.update).toHaveBeenCalledWith({ where: { id: 'token-1' }, data: { usedAt: expect.any(Date) } });
  });
});
