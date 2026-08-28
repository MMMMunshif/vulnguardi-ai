import nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

describe('NotificationsService', () => {
  const finding = {
    id: 'finding-1',
    cveId: 'CVE-2026-1234',
    title: '<Remote> code execution',
    description: null,
    affectedVersion: '1.0.0',
    fixedVersion: '1.0.1',
    referenceUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2026-1234',
    organization: { id: 'org-1', name: 'Example & Company' },
    device: { hostname: 'server-1' },
    softwareInventory: { softwareName: 'Example App' },
  };
  const prisma = {
    user: { findMany: jest.fn() },
  };
  const sendMail = jest.fn();
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EMAIL_NOTIFICATIONS_ENABLED;
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_FROM = 'VulnGuard <alerts@example.com>';
    process.env.FRONTEND_URL = 'https://vulnguard.example.com/';
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    prisma.user.findMany.mockResolvedValue([
      { email: 'admin@example.com' },
      { email: 'admin@example.com' },
      { email: 'analyst@example.com' },
    ]);
    sendMail.mockResolvedValue({ messageId: 'mail-1' });
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  afterAll(() => {
    delete process.env.EMAIL_NOTIFICATIONS_ENABLED;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    delete process.env.FRONTEND_URL;
  });

  it('does nothing when email notifications are disabled', () => {
    service.queueHighPriorityVulnerabilityAlert(finding);

    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('sends password reset links using the configured frontend URL', async () => {
    service.queuePasswordResetEmail('user@example.com', 'secure-token');
    await new Promise(setImmediate);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Reset your VulnGuard AI password',
        text: expect.stringContaining(
          'https://vulnguard.example.com/reset-password?token=secure-token',
        ),
      }),
    );
  });

  it('sends email verification links using the configured frontend URL', async () => {
    service.queueEmailVerification('user@example.com', 'verify-token');
    await new Promise(setImmediate);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Verify your VulnGuard AI email',
        text: expect.stringContaining('/verify-email?token=verify-token'),
      }),
    );
  });

  it('supports authenticated secure SMTP for password reset emails', async () => {
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';

    service.queuePasswordResetEmail('user@example.com', 'secure-token');
    await new Promise(setImmediate);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 465,
        secure: true,
        auth: { user: 'smtp-user', pass: 'smtp-pass' },
      }),
    );
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  it('emails unique active tenant administrators and analysts', async () => {
    process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';

    service.queueHighPriorityVulnerabilityAlert(finding);
    await new Promise(setImmediate);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-1',
        status: 'ACTIVE',
        role: {
          roleName: { in: ['Organization Admin', 'Security Analyst'] },
        },
      },
      select: { email: true },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['admin@example.com', 'analyst@example.com'],
        subject: '[High Priority] Public exploit detected: CVE-2026-1234',
        text: expect.stringContaining('Affected version: 1.0.0'),
        html: expect.stringContaining('Example &amp; Company'),
      }),
    );
  });

  it('does not connect to SMTP when the tenant has no recipients', async () => {
    process.env.EMAIL_NOTIFICATIONS_ENABLED = 'true';
    prisma.user.findMany.mockResolvedValue([]);

    service.queueHighPriorityVulnerabilityAlert(finding);
    await new Promise(setImmediate);

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });
});
