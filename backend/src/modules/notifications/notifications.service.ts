import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

export interface HighPriorityVulnerabilityAlert {
  id: string;
  cveId: string | null;
  title: string;
  description: string | null;
  affectedVersion: string | null;
  fixedVersion: string | null;
  referenceUrl: string | null;
  organization: { id: string; name: string };
  device: { hostname: string };
  softwareInventory: { softwareName: string };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  queuePasswordResetEmail(email: string, token: string): void {
    void this.sendPasswordResetEmail(email, token).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Password reset email failed: ${message}`);
    });
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    const resetUrl = `${frontendUrl || 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(token)}`;
    const transporter = this.createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your VulnGuard AI password',
      text: `Reset your password using this link (expires in 30 minutes): ${resetUrl}`,
      html: `<p>Reset your VulnGuard AI password using the link below. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  }

  private createTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
      throw new Error('SMTP_HOST and SMTP_FROM are required');
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  queueHighPriorityVulnerabilityAlert(
    finding: HighPriorityVulnerabilityAlert,
  ): void {
    if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'true') {
      return;
    }

    void this.sendHighPriorityVulnerabilityAlert(finding).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `High-priority vulnerability email failed for ${finding.id}: ${message}`,
      );
    });
  }

  private async sendHighPriorityVulnerabilityAlert(
    finding: HighPriorityVulnerabilityAlert,
  ): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpFrom = process.env.SMTP_FROM;
    if (!smtpHost || !smtpFrom) {
      throw new Error('SMTP_HOST and SMTP_FROM are required');
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        organizationId: finding.organization.id,
        status: 'ACTIVE',
        role: {
          roleName: { in: ['Organization Admin', 'Security Analyst'] },
        },
      },
      select: { email: true },
    });

    const to = [...new Set(recipients.map(({ email }) => email))];
    if (to.length === 0) {
      this.logger.warn(
        `No notification recipients found for organization ${finding.organization.id}`,
      );
      return;
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    const label = finding.cveId || finding.title;
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    const findingUrl = frontendUrl
      ? `${frontendUrl}/vulnerability-findings`
      : finding.referenceUrl;

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: `[High Priority] Public exploit detected: ${label}`,
      text: this.buildText(finding, findingUrl),
      html: this.buildHtml(finding, findingUrl),
    });
  }

  private buildText(
    finding: HighPriorityVulnerabilityAlert,
    findingUrl?: string | null,
  ): string {
    return [
      'VulnGuard AI high-priority vulnerability alert',
      '',
      `Organization: ${finding.organization.name}`,
      `Vulnerability: ${finding.cveId || finding.title}`,
      `Title: ${finding.title}`,
      `Software: ${finding.softwareInventory.softwareName}`,
      `Device: ${finding.device.hostname}`,
      `Affected version: ${finding.affectedVersion || 'Unknown'}`,
      `Fixed version: ${finding.fixedVersion || 'Not available'}`,
      'Exploit availability: Public exploit available',
      findingUrl ? `Review: ${findingUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildHtml(
    finding: HighPriorityVulnerabilityAlert,
    findingUrl?: string | null,
  ): string {
    const escape = (value: string) =>
      value.replace(
        /[&<>"']/g,
        (character) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
          })[character]!,
      );
    const row = (label: string, value: string) =>
      `<tr><th align="left">${escape(label)}</th><td>${escape(value)}</td></tr>`;
    const reviewLink = findingUrl
      ? `<p><a href="${escape(findingUrl)}">Review in VulnGuard AI</a></p>`
      : '';

    return `<h2>High-priority vulnerability detected</h2>
<p>A public exploit is available for this vulnerability.</p>
<table>
${row('Organization', finding.organization.name)}
${row('Vulnerability', finding.cveId || finding.title)}
${row('Title', finding.title)}
${row('Software', finding.softwareInventory.softwareName)}
${row('Device', finding.device.hostname)}
${row('Affected version', finding.affectedVersion || 'Unknown')}
${row('Fixed version', finding.fixedVersion || 'Not available')}
</table>${reviewLink}`;
  }
}
