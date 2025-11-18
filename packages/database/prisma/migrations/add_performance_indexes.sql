-- Performance Optimization Indexes
-- This migration adds indexes to improve query performance across the application

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users("deletedAt") WHERE "deletedAt" IS NULL;

-- Agent table indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents("userId");
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_agents_deleted_at ON agents("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_agents_user_status ON agents("userId", status) WHERE "deletedAt" IS NULL;

-- Composite index for agent capabilities filtering
CREATE INDEX IF NOT EXISTS idx_agents_capabilities ON agents USING GIN(capabilities);

-- Chat table indexes
CREATE INDEX IF NOT EXISTS idx_chats_agent_id ON chats("agentId");
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats("userId");
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_chats_deleted_at ON chats("deletedAt") WHERE "deletedAt" IS NULL;

-- Message table indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages("chatId");
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages("roomId");
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages("agentId");
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages("parentMessageId");
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages("isDeleted") WHERE "isDeleted" = false;

-- Full-text search index for messages (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_messages_content_fulltext ON messages USING GIN(to_tsvector('english', content));

-- ChatRoom table indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_owner_id ON chat_rooms("ownerId");
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_active ON chat_rooms("isActive");
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON chat_rooms("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms("lastMessageAt" DESC);

-- Workflow table indexes
CREATE INDEX IF NOT EXISTS idx_workflows_creator_id ON workflows("creatorId");
CREATE INDEX IF NOT EXISTS idx_workflows_agent_id ON workflows("agentId");
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows("isActive");
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_last_executed_at ON workflows("lastExecutedAt" DESC);

-- WorkflowExecution table indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions("workflowId");
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions("startedAt" DESC);

-- Task table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks("userId");
CREATE INDEX IF NOT EXISTS idx_tasks_pipeline_id ON tasks("pipelineId");
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON tasks("assignedToId");
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks("deletedAt") WHERE "deletedAt" IS NULL;

-- Pipeline table indexes
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON pipelines("userId");
CREATE INDEX IF NOT EXISTS idx_pipelines_agent_id ON pipelines("agentId");
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipelines_created_at ON pipelines("createdAt" DESC);

-- AuthSession table indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions("expiresAt");

-- LoginAttempt table indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts("userId");
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_successful ON login_attempts(successful);

-- Transaction table indexes (already have some, adding composite)
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_status ON transactions("walletId", status);
CREATE INDEX IF NOT EXISTS idx_transactions_from_to ON transactions("fromAddress", "toAddress");

-- AgentNFT table indexes
CREATE INDEX IF NOT EXISTS idx_agent_nfts_agent_id ON agent_nfts("agentId");
CREATE INDEX IF NOT EXISTS idx_agent_nfts_token_id ON agent_nfts("tokenId");
CREATE INDEX IF NOT EXISTS idx_agent_nfts_contract_address ON agent_nfts("contractAddress");

-- MarketplaceListing table indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_agent_nft_id ON marketplace_listings("agentNFTId");
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings("createdAt" DESC);

-- SyncState table indexes
CREATE INDEX IF NOT EXISTS idx_sync_states_last_sync ON sync_states("lastSync" DESC);
CREATE INDEX IF NOT EXISTS idx_sync_states_tenant_id ON sync_states("tenantId");

-- Comments explaining index strategy:
-- 1. Single column indexes on frequently queried foreign keys
-- 2. Composite indexes on common query combinations (userId + status)
-- 3. Partial indexes on soft-delete columns to improve performance when filtering out deleted records
-- 4. DESC indexes on timestamp columns for efficient sorting of recent records
-- 5. GIN indexes for array/JSON fields and full-text search
