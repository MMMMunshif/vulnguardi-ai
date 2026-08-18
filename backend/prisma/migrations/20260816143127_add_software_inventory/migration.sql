-- CreateEnum
CREATE TYPE "SoftwareSource" AS ENUM ('MANUAL', 'SYSTEM_SCAN', 'IMPORTED');

-- CreateEnum
CREATE TYPE "SoftwareStatus" AS ENUM ('INSTALLED', 'REMOVED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "SoftwareInventory" (
    "id" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "publisher" TEXT,
    "installedVersion" TEXT,
    "installedPath" TEXT,
    "installDate" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "source" "SoftwareSource" NOT NULL DEFAULT 'MANUAL',
    "status" "SoftwareStatus" NOT NULL DEFAULT 'INSTALLED',
    "deviceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoftwareInventory_deviceId_idx" ON "SoftwareInventory"("deviceId");

-- CreateIndex
CREATE INDEX "SoftwareInventory_organizationId_idx" ON "SoftwareInventory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareInventory_deviceId_softwareName_key" ON "SoftwareInventory"("deviceId", "softwareName");

-- AddForeignKey
ALTER TABLE "SoftwareInventory" ADD CONSTRAINT "SoftwareInventory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareInventory" ADD CONSTRAINT "SoftwareInventory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
