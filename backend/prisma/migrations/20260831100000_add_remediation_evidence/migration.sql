CREATE TABLE "RemediationEvidence" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remediationActionId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "RemediationEvidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RemediationEvidence_remediationActionId_createdAt_idx" ON "RemediationEvidence"("remediationActionId", "createdAt");
CREATE INDEX "RemediationEvidence_organizationId_idx" ON "RemediationEvidence"("organizationId");
ALTER TABLE "RemediationEvidence" ADD CONSTRAINT "RemediationEvidence_remediationActionId_fkey" FOREIGN KEY ("remediationActionId") REFERENCES "RemediationAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationEvidence" ADD CONSTRAINT "RemediationEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemediationEvidence" ADD CONSTRAINT "RemediationEvidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
