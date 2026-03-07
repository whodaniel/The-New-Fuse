-- ============================================================================
-- Add Performance Indexes
-- Date: 2024-07-25
-- Description: This migration adds missing indexes to improve query performance.
--              It also includes an analysis of other requested indexes that
--              were found to be already present or not applicable.
-- ============================================================================

-- Index for agentRegistrations on agentId to speed up agent lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_registrations_agent_id ON "agent_registrations"("agentId");

-- =============================================================================
-- ANALYSIS OF REQUESTED INDEXES
-- =============================================================================

-- The following is an analysis of the 10 indexes requested in the task:
--
-- 1. chatRoomParticipants.roomId: NOT APPLICABLE - The `chatRoomParticipants` table does not exist in the schema.
-- 2. chatRoomMessages.roomId: ALREADY EXISTS - An index `idx_messages_roomId` is already present on the `messages` table.
-- 3. chatRoomMessages.senderId: ALREADY EXISTS - An index `idx_messages_senderId` is already present on the `messages` table.
-- 4. agentRegistrations.agentId: ADDED - An index `idx_agent_registrations_agent_id` was added by this migration.
-- 5. readReceipts.messageId: NOT APPLICABLE - The `readReceipts` table does not exist in the schema.
-- 6. readReceipts.userId: NOT APPLICABLE - The `readReceipts` table does not exist in the schema.
-- 7. tasks.agentId: ALREADY EXISTS - An index `idx_tasks_assignedToId_status` is present, covering `assignedToId` which is the `agentId`.
-- 8. tasks.status: ALREADY EXISTS - An index `idx_tasks_status` is already present.
-- 9. agents.status: ALREADY EXISTS - An index `idx_agents_status` is already present.
-- 10. sessions.userId: ALREADY EXISTS - An index `idx_auth_sessions_userId` is already present on the `auth_sessions` table.
