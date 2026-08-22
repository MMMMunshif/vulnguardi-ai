import { Injectable } from '@nestjs/common';
import {
  DeviceStatus,
  OrganizationStatus,
  RemediationStatus,
  RemediationVerificationStatus,
  SoftwareStatus,
  SoftwareUpdateStatus,
  UserStatus,
  VulnerabilityStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId?: string) {
    const now = new Date();
    const dueSoonCutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const organizationWhere = organizationId ? { id: organizationId } : {};
    const scopedWhere = organizationId ? { organizationId } : {};
    const [
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,

      totalUsers,
      activeUsers,
      inactiveUsers,

      totalDevices,
      activeDevices,
      retiredDevices,

      totalSoftwareRecords,
      installedSoftware,
      removedSoftware,

      totalUpdateFindings,
      outdatedSoftware,
      upToDateSoftware,

      totalVulnerabilities,
      openVulnerabilities,
      inProgressVulnerabilities,
      resolvedVulnerabilities,

      totalRemediationActions,
      pendingRemediations,
      inProgressRemediations,
      completedRemediations,
      cancelledRemediations,
      verifiedRemediations,
      unverifiedRemediations,
      failedVerificationRemediations,
      remediatedVulnerabilities,
      overdueRemediations,
      dueSoonRemediations,
    ] = await Promise.all([
      this.prisma.organization.count({ where: organizationWhere }),
      this.prisma.organization.count({
        where: { ...organizationWhere, status: OrganizationStatus.ACTIVE },
      }),
      this.prisma.organization.count({
        where: { ...organizationWhere, status: OrganizationStatus.SUSPENDED },
      }),

      this.prisma.user.count({ where: scopedWhere }),
      this.prisma.user.count({
        where: { ...scopedWhere, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { ...scopedWhere, status: UserStatus.INACTIVE },
      }),

      this.prisma.device.count({ where: scopedWhere }),
      this.prisma.device.count({
        where: { ...scopedWhere, status: DeviceStatus.ACTIVE },
      }),
      this.prisma.device.count({
        where: { ...scopedWhere, status: DeviceStatus.RETIRED },
      }),

      this.prisma.softwareInventory.count({ where: scopedWhere }),
      this.prisma.softwareInventory.count({
        where: { ...scopedWhere, status: SoftwareStatus.INSTALLED },
      }),
      this.prisma.softwareInventory.count({
        where: { ...scopedWhere, status: SoftwareStatus.REMOVED },
      }),

      this.prisma.softwareUpdateFinding.count({ where: scopedWhere }),
      this.prisma.softwareUpdateFinding.count({
        where: { ...scopedWhere, status: SoftwareUpdateStatus.OUTDATED },
      }),
      this.prisma.softwareUpdateFinding.count({
        where: { ...scopedWhere, status: SoftwareUpdateStatus.UP_TO_DATE },
      }),

      this.prisma.vulnerabilityFinding.count({ where: scopedWhere }),
      this.prisma.vulnerabilityFinding.count({
        where: { ...scopedWhere, status: VulnerabilityStatus.OPEN },
      }),
      this.prisma.vulnerabilityFinding.count({
        where: { ...scopedWhere, status: VulnerabilityStatus.IN_PROGRESS },
      }),
      this.prisma.vulnerabilityFinding.count({
        where: { ...scopedWhere, status: VulnerabilityStatus.RESOLVED },
      }),

      this.prisma.remediationAction.count({ where: scopedWhere }),
      this.prisma.remediationAction.count({
        where: { ...scopedWhere, status: RemediationStatus.PENDING },
      }),
      this.prisma.remediationAction.count({
        where: { ...scopedWhere, status: RemediationStatus.IN_PROGRESS },
      }),
      this.prisma.remediationAction.count({
        where: { ...scopedWhere, status: RemediationStatus.COMPLETED },
      }),
      this.prisma.remediationAction.count({
        where: { ...scopedWhere, status: RemediationStatus.CANCELLED },
      }),
      this.prisma.remediationAction.count({
        where: {
          ...scopedWhere,
          verificationStatus: RemediationVerificationStatus.VERIFIED,
        },
      }),
      this.prisma.remediationAction.count({
        where: {
          ...scopedWhere,
          verificationStatus: RemediationVerificationStatus.NOT_VERIFIED,
        },
      }),
      this.prisma.remediationAction.count({
        where: {
          ...scopedWhere,
          verificationStatus: RemediationVerificationStatus.FAILED,
        },
      }),
      this.prisma.remediationAction.findMany({
        where: scopedWhere,
        distinct: ['vulnerabilityFindingId'],
        select: {
          vulnerabilityFindingId: true,
        },
      }),
      this.prisma.remediationAction.count({
        where: {
          ...scopedWhere,
          status: {
            in: [RemediationStatus.PENDING, RemediationStatus.IN_PROGRESS],
          },
          dueDate: { lt: now },
        },
      }),
      this.prisma.remediationAction.count({
        where: {
          ...scopedWhere,
          status: {
            in: [RemediationStatus.PENDING, RemediationStatus.IN_PROGRESS],
          },
          dueDate: {
            gte: now,
            lte: dueSoonCutoff,
          },
        },
      }),
    ]);

    return {
      message: 'Dashboard summary fetched successfully',
      summary: {
        organizations: {
          total: totalOrganizations,
          active: activeOrganizations,
          suspended: suspendedOrganizations,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        devices: {
          total: totalDevices,
          active: activeDevices,
          retired: retiredDevices,
        },
        softwareInventory: {
          total: totalSoftwareRecords,
          installed: installedSoftware,
          removed: removedSoftware,
        },
        softwareUpdates: {
          total: totalUpdateFindings,
          outdated: outdatedSoftware,
          upToDate: upToDateSoftware,
        },
        vulnerabilities: {
          total: totalVulnerabilities,
          open: openVulnerabilities,
          inProgress: inProgressVulnerabilities,
          resolved: resolvedVulnerabilities,
        },
        remediationActions: {
          total: totalRemediationActions,
          pending: pendingRemediations,
          inProgress: inProgressRemediations,
          completed: completedRemediations,
          cancelled: cancelledRemediations,
          verified: verifiedRemediations,
          notVerified: unverifiedRemediations,
          verificationFailed: failedVerificationRemediations,
          coveredVulnerabilities: remediatedVulnerabilities.length,
          overdue: overdueRemediations,
          dueSoon: dueSoonRemediations,
        },
      },
    };
  }

  async getRecentActivity(organizationId?: string) {
    const now = new Date();
    const dueSoonCutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const scopedWhere = organizationId ? { organizationId } : {};
    const [
      recentDevices,
      recentSoftware,
      recentVulnerabilities,
      recentRemediations,
      deadlineRemediations,
    ] = await Promise.all([
      this.prisma.device.findMany({
        where: scopedWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          hostname: true,
          deviceType: true,
          status: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      this.prisma.softwareInventory.findMany({
        where: scopedWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          softwareName: true,
          installedVersion: true,
          status: true,
          createdAt: true,
          device: {
            select: {
              id: true,
              hostname: true,
            },
          },
        },
      }),

      this.prisma.vulnerabilityFinding.findMany({
        where: scopedWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          cveId: true,
          title: true,
          status: true,
          fixAvailability: true,
          createdAt: true,
          device: {
            select: {
              id: true,
              hostname: true,
            },
          },
        },
      }),

      this.prisma.remediationAction.findMany({
        where: scopedWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          actionTitle: true,
          status: true,
          verificationStatus: true,
          dueDate: true,
          createdAt: true,
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.remediationAction.findMany({
        take: 5,
        where: {
          ...scopedWhere,
          status: {
            in: [RemediationStatus.PENDING, RemediationStatus.IN_PROGRESS],
          },
          dueDate: {
            lte: dueSoonCutoff,
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        select: {
          id: true,
          actionTitle: true,
          status: true,
          dueDate: true,
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          vulnerabilityFinding: {
            select: {
              id: true,
              cveId: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Recent dashboard activity fetched successfully',
      recentActivity: {
        recentDevices,
        recentSoftware,
        recentVulnerabilities,
        recentRemediations,
        deadlineRemediations: deadlineRemediations.map((action) => ({
          ...action,
          deadlineState:
            action.dueDate && action.dueDate < now ? 'OVERDUE' : 'DUE_SOON',
        })),
      },
    };
  }
}
