-- CreateEnum
CREATE TYPE "SoftwareUpdateStatus" AS ENUM ('UP_TO_DATE', 'OUTDATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UpdateCheckSource" AS ENUM ('MANUAL', 'WINGET', 'SYSTEM_SCAN', 'IMPORTED');

-- CreateTable
CREATE TABLE "SoftwareUpdateFinding" (
    "id" TEXT NOT NULL,
    "installedVersion" TEXT,
    "latestVersion" TEXT,
    "updateAvailable" BOOLEAN NOT NULL DEFAULT false,
    "status" "SoftwareUpdateStatus" NOT NULL DEFAULT 'UNKNOWN',
    "source" "UpdateCheckSource" NOT NULL DEFAULT 'MANUAL',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "softwareInventoryId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareUpdateFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoftwareUpdateFinding_softwareInventoryId_idx" ON "SoftwareUpdateFinding"("softwareInventoryId");

-- CreateIndex
CREATE INDEX "SoftwareUpdateFinding_deviceId_idx" ON "SoftwareUpdateFinding"("deviceId");

-- CreateIndex
CREATE INDEX "SoftwareUpdateFinding_organizationId_idx" ON "SoftwareUpdateFinding"("organizationId");

-- AddForeignKey
ALTER TABLE "SoftwareUpdateFinding" ADD CONSTRAINT "SoftwareUpdateFinding_softwareInventoryId_fkey" FOREIGN KEY ("softwareInventoryId") REFERENCES "SoftwareInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareUpdateFinding" ADD CONSTRAINT "SoftwareUpdateFinding_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareUpdateFinding" ADD CONSTRAINT "SoftwareUpdateFinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
