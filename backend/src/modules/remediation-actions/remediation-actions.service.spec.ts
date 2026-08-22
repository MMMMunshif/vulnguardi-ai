import { ConflictException } from '@nestjs/common';
import {
  RemediationStatus,
  RemediationVerificationStatus,
  VulnerabilityStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RemediationActionsService } from './remediation-actions.service';

describe('RemediationActionsService', () => {
  let service: RemediationActionsService;
  let prisma: {
    remediationAction: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    vulnerabilityFinding: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      remediationAction: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vulnerabilityFinding: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirst: jest.fn() },
    };
    service = new RemediationActionsService(
      prisma as unknown as PrismaService,
    );
  });

  it('prevents duplicate remediation actions for one vulnerability', async () => {
    prisma.vulnerabilityFinding.findFirst.mockResolvedValue({ id: 'vuln-1' });
    prisma.remediationAction.findFirst.mockResolvedValue({ id: 'action-1' });

    await expect(
      service.create({
        actionTitle: 'Patch app',
        vulnerabilityFindingId: 'vuln-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.remediationAction.create).not.toHaveBeenCalled();
  });

  it('scopes remediation lists to the authenticated organization', async () => {
    prisma.remediationAction.findMany.mockResolvedValue([]);

    await service.findAll('org-1');

    expect(prisma.remediationAction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });

  it('marks the related vulnerability in progress', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({
      id: 'action-1',
      status: RemediationStatus.PENDING,
      verificationStatus: RemediationVerificationStatus.NOT_VERIFIED,
      vulnerabilityFindingId: 'vuln-1',
      startedAt: null,
    });
    prisma.remediationAction.update.mockResolvedValue({ id: 'action-1' });

    const result = await service.update('action-1', {
      status: RemediationStatus.IN_PROGRESS,
    });

    expect(prisma.vulnerabilityFinding.update).toHaveBeenCalledWith({
      where: { id: 'vuln-1' },
      data: { status: VulnerabilityStatus.IN_PROGRESS },
    });
    expect(result.vulnerabilityInProgress).toBe(true);
  });

  it('resolves the vulnerability after completed verified remediation', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({
      id: 'action-1',
      status: RemediationStatus.IN_PROGRESS,
      verificationStatus: RemediationVerificationStatus.NOT_VERIFIED,
      vulnerabilityFindingId: 'vuln-1',
      startedAt: new Date(),
    });
    prisma.remediationAction.update.mockResolvedValue({ id: 'action-1' });

    const result = await service.update('action-1', {
      status: RemediationStatus.COMPLETED,
      verificationStatus: RemediationVerificationStatus.VERIFIED,
    });

    expect(prisma.vulnerabilityFinding.update).toHaveBeenCalledWith({
      where: { id: 'vuln-1' },
      data: { status: VulnerabilityStatus.RESOLVED },
    });
    expect(result.vulnerabilityResolved).toBe(true);
  });
});
