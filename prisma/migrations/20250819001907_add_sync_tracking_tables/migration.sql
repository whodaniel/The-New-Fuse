-- CreateTable
CREATE TABLE "sync_states" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "tenantId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "checksum" TEXT NOT NULL,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedBy" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "tenantId" TEXT,
    "conflictType" TEXT NOT NULL,
    "localVersion" JSONB NOT NULL,
    "remoteVersion" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_states_resourceType_idx" ON "sync_states"("resourceType");

-- CreateIndex
CREATE INDEX "sync_states_tenantId_idx" ON "sync_states"("tenantId");

-- CreateIndex
CREATE INDEX "sync_states_lastSync_idx" ON "sync_states"("lastSync");

-- CreateIndex
CREATE UNIQUE INDEX "sync_states_resourceType_resourceId_tenantId_key" ON "sync_states"("resourceType", "resourceId", "tenantId");

-- CreateIndex
CREATE INDEX "sync_conflicts_resourceType_idx" ON "sync_conflicts"("resourceType");

-- CreateIndex
CREATE INDEX "sync_conflicts_tenantId_idx" ON "sync_conflicts"("tenantId");

-- CreateIndex
CREATE INDEX "sync_conflicts_createdAt_idx" ON "sync_conflicts"("createdAt");

-- CreateIndex
CREATE INDEX "sync_conflicts_resolvedAt_idx" ON "sync_conflicts"("resolvedAt");
