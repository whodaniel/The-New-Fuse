-- DropIndex
DROP INDEX "sync_states_resourceType_resourceId_tenantId_key";

-- CreateIndex
CREATE INDEX "sync_states_resourceType_resourceId_tenantId_idx" ON "sync_states"("resourceType", "resourceId", "tenantId");
