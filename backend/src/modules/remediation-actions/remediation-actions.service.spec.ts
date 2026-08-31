import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
      delete: jest.Mock;
    };
    vulnerabilityFinding: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: { findFirst: jest.Mock };
    remediationEvidence: { create: jest.Mock; findFirst: jest.Mock; delete: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      remediationAction: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      vulnerabilityFinding: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirst: jest.fn() },
      remediationEvidence: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
    };
    service = new RemediationActionsService(
      prisma as unknown as PrismaService,
    );
  });

  it('uploads validated tenant-scoped remediation evidence', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({ id: 'action-1', organizationId: 'org-1' });
    prisma.remediationEvidence.create.mockResolvedValue({ id: 'evidence-1', fileName: 'proof.pdf' });
    await expect(service.addEvidence('action-1', {
      originalname: 'proof.pdf', mimetype: 'application/pdf', size: 4, buffer: Buffer.from('test'),
    }, 'user-1', 'org-1')).resolves.toEqual(expect.objectContaining({ message: 'Evidence uploaded successfully' }));
    expect(prisma.remediationEvidence.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: 'org-1', uploadedById: 'user-1' }) }));
  });

  it('rejects unsafe evidence types and oversized files', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({ id: 'action-1', organizationId: 'org-1' });
    await expect(service.addEvidence('action-1', { originalname: 'script.exe', mimetype: 'application/octet-stream', size: 1, buffer: Buffer.from('x') }, 'user-1', 'org-1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.addEvidence('action-1', { originalname: 'large.pdf', mimetype: 'application/pdf', size: 6 * 1024 * 1024, buffer: Buffer.from('x') }, 'user-1', 'org-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents cross-tenant evidence downloads', async () => {
    prisma.remediationEvidence.findFirst.mockResolvedValue(null);
    await expect(service.getEvidence('evidence-1', 'org-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.remediationEvidence.findFirst).toHaveBeenCalledWith({ where: { id: 'evidence-1', organizationId: 'org-1' } });
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

  it('uses tenant scope when fetching one remediation action', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({ id: 'action-1' });

    await service.findOne('action-1', 'org-1');

    expect(prisma.remediationAction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'action-1', organizationId: 'org-1' },
      }),
    );
  });

  it('rejects creating remediation for a vulnerability outside the tenant', async () => {
    prisma.vulnerabilityFinding.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        {
          actionTitle: 'Patch app',
          vulnerabilityFindingId: 'vuln-1',
        },
        'org-2',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.remediationAction.create).not.toHaveBeenCalled();
  });

  it('rejects an assigned user outside the vulnerability organization', async () => {
    prisma.vulnerabilityFinding.findFirst.mockResolvedValue({
      id: 'vuln-1',
      organizationId: 'org-1',
    });
    prisma.remediationAction.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        actionTitle: 'Patch app',
        vulnerabilityFindingId: 'vuln-1',
        assignedUserId: 'user-2',
      }),
    ).rejects.toThrow('Assigned user not found in the selected organization');
  });

  it('creates remediation from trusted vulnerability ownership data', async () => {
    const vulnerability = {
      id: 'vuln-1',
      softwareInventoryId: 'software-1',
      deviceId: 'device-1',
      organizationId: 'org-1',
    };
    prisma.vulnerabilityFinding.findFirst.mockResolvedValue(vulnerability);
    prisma.remediationAction.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.remediationAction.create.mockResolvedValue({ id: 'action-1' });

    await service.create({
      actionTitle: 'Patch app',
      vulnerabilityFindingId: 'vuln-1',
      assignedUserId: 'user-1',
      dueDate: '2026-08-30T10:00:00.000Z',
    });

    expect(prisma.remediationAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dueDate: new Date('2026-08-30T10:00:00.000Z'),
          softwareInventoryId: 'software-1',
          deviceId: 'device-1',
          organizationId: 'org-1',
        }),
      }),
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

  it('rejects completedAt when status is not completed', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({
      id: 'action-1',
      status: RemediationStatus.PENDING,
      verificationStatus: RemediationVerificationStatus.NOT_VERIFIED,
    });

    await expect(
      service.update('action-1', {
        status: RemediationStatus.IN_PROGRESS,
        completedAt: '2026-08-25T10:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.remediationAction.update).not.toHaveBeenCalled();
  });

  it('rejects verification before remediation is completed', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({
      id: 'action-1',
      status: RemediationStatus.IN_PROGRESS,
      verificationStatus: RemediationVerificationStatus.NOT_VERIFIED,
      startedAt: new Date(),
    });

    await expect(
      service.update('action-1', {
        verificationStatus: RemediationVerificationStatus.VERIFIED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('automatically records completion time for completed remediation', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({
      id: 'action-1',
      status: RemediationStatus.IN_PROGRESS,
      verificationStatus: RemediationVerificationStatus.NOT_VERIFIED,
      vulnerabilityFindingId: 'vuln-1',
      startedAt: new Date(),
    });
    prisma.remediationAction.update.mockResolvedValue({ id: 'action-1' });

    await service.update('action-1', {
      status: RemediationStatus.COMPLETED,
    });

    expect(prisma.remediationAction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }),
    );
  });

  it('deletes only a remediation action found inside the tenant', async () => {
    prisma.remediationAction.findFirst.mockResolvedValue({ id: 'action-1' });
    prisma.remediationAction.delete.mockResolvedValue({ id: 'action-1' });

    await expect(service.remove('action-1', 'org-1')).resolves.toEqual({
      message: 'Remediation action deleted successfully',
    });
    expect(prisma.remediationAction.findFirst).toHaveBeenCalledWith({
      where: { id: 'action-1', organizationId: 'org-1' },
    });
    expect(prisma.remediationAction.delete).toHaveBeenCalledWith({
      where: { id: 'action-1' },
    });
  });
});
