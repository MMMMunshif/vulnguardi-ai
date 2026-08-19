-- CreateEnum
CREATE TYPE "RemediationActionType" AS ENUM ('UPDATE_SOFTWARE', 'CONFIGURATION_CHANGE', 'REMOVE_SOFTWARE', 'ACCEPT_RISK', 'VERIFY_PATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RemediationVerificationStatus" AS ENUM ('NOT_VERIFIED', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "RemediationAction" (
    "id" TEXT NOT NULL,
    "actionTitle" TEXT NOT NULL,
    "actionDescription" TEXT,
    "recommendedFix" TEXT,
    "actionType" "RemediationActionType" NOT NULL DEFAULT 'UPDATE_SOFTWARE',
    "status" "RemediationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "RemediationVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "dueDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "notes" TEXT,
    "vulnerabilityFindingId" TEXT NOT NULL,
    "softwareInventoryId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RemediationAction_vulnerabilityFindingId_idx" ON "RemediationAction"("vulnerabilityFindingId");

-- CreateIndex
CREATE INDEX "RemediationAction_softwareInventoryId_idx" ON "RemediationAction"("softwareInventoryId");

-- CreateIndex
CREATE INDEX "RemediationAction_deviceId_idx" ON "RemediationAction"("deviceId");

-- CreateIndex
CREATE INDEX "RemediationAction_organizationId_idx" ON "RemediationAction"("organizationId");

-- CreateIndex
CREATE INDEX "RemediationAction_assignedUserId_idx" ON "RemediationAction"("assignedUserId");

-- AddForeignKey
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_vulnerabilityFindingId_fkey" FOREIGN KEY ("vulnerabilityFindingId") REFERENCES "VulnerabilityFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_softwareInventoryId_fkey" FOREIGN KEY ("softwareInventoryId") REFERENCES "SoftwareInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationAction" ADD CONSTRAINT "RemediationAction_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
