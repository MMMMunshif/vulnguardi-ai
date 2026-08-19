import { Injectable } from '@nestjs/common';
import {
  DeviceStatus,
  OrganizationStatus,
  RemediationStatus,
  SoftwareStatus,
  SoftwareUpdateStatus,
  UserStatus,
  VulnerabilityStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
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
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({
        where: { status: OrganizationStatus.ACTIVE },
      }),
      this.prisma.organization.count({
        where: { status: OrganizationStatus.SUSPENDED },
      }),

      this.prisma.user.count(),
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { status: UserStatus.INACTIVE },
      }),

      this.prisma.device.count(),
      this.prisma.device.count({
        where: { status: DeviceStatus.ACTIVE },
      }),
      this.prisma.device.count({
        where: { status: DeviceStatus.RETIRED },
      }),

      this.prisma.softwareInventory.count(),
      this.prisma.softwareInventory.count({
        where: { status: SoftwareStatus.INSTALLED },
      }),
      this.prisma.softwareInventory.count({
        where: { status: SoftwareStatus.REMOVED },
      }),

      this.prisma.softwareUpdateFinding.count(),
      this.prisma.softwareUpdateFinding.count({
        where: { status: SoftwareUpdateStatus.OUTDATED },
      }),
      this.prisma.softwareUpdateFinding.count({
        where: { status: SoftwareUpdateStatus.UP_TO_DATE },
      }),

      this.prisma.vulnerabilityFinding.count(),
      this.prisma.vulnerabilityFinding.count({
        where: { status: VulnerabilityStatus.OPEN },
      }),
      this.prisma.vulnerabilityFinding.count({
        where: { status: VulnerabilityStatus.IN_PROGRESS },
      }),
      this.prisma.vulnerabilityFinding.count({
        where: { status: VulnerabilityStatus.RESOLVED },
      }),

      this.prisma.remediationAction.count(),
      this.prisma.remediationAction.count({
        where: { status: RemediationStatus.PENDING },
      }),
      this.prisma.remediationAction.count({
        where: { status: RemediationStatus.IN_PROGRESS },
      }),
      this.prisma.remediationAction.count({
        where: { status: RemediationStatus.COMPLETED },
      }),
      this.prisma.remediationAction.count({
        where: { status: RemediationStatus.CANCELLED },
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
        },
      },
    };
  }

  async getRecentActivity() {
    const [
      recentDevices,
      recentSoftware,
      recentVulnerabilities,
      recentRemediations,
    ] = await Promise.all([
      this.prisma.device.findMany({
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
    ]);

    return {
      message: 'Recent dashboard activity fetched successfully',
      recentActivity: {
        recentDevices,
        recentSoftware,
        recentVulnerabilities,
        recentRemediations,
      },
    };
  }
}