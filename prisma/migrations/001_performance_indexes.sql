-- Performance Optimization Indexes
-- These indexes are designed based on common query patterns in agent workflows

-- User-related queries (frequently accessed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_role ON "User"(email, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON "User"(createdAt DESC);

-- Agent performance indexes (core functionality)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_user_status ON "Agent"(userId, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_type_status ON "Agent"(type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_updated_at ON "Agent"(updatedAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_composite ON "Agent"(userId, type, status, updatedAt DESC);

-- Agent metadata queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metadata_last_active ON "AgentMetadata"(lastActive DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metadata_agent_version ON "AgentMetadata"(agentId, version);

-- Chat and message optimization (high traffic)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_user_updated ON "Chat"(userId, updatedAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_agent_updated ON "Chat"(agentId, updatedAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_created ON "Message"(chatId, createdAt ASC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_role_created ON "Message"(role, createdAt DESC);

-- Task management optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status ON "Task"(userId, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_agent_status ON "Task"(agentId, status) WHERE agentId IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_priority_status ON "Task"(priority, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_created ON "Task"(status, createdAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completed_at ON "Task"(completedAt DESC) WHERE completedAt IS NOT NULL;

-- Workflow optimization (complex queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_agent_status ON "Workflow"(agentId, status) WHERE agentId IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_status_updated ON "Workflow"(status, updatedAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_steps_workflow_order ON "WorkflowStep"(workflowId, "order");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_steps_type ON "WorkflowStep"(type);

-- Workflow execution tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_workflow_started ON "WorkflowExecution"(workflowId, startedAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_status_started ON "WorkflowExecution"(status, startedAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_completed ON "WorkflowExecution"(completedAt DESC) WHERE completedAt IS NOT NULL;

-- Pipeline optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pipelines_user_status ON "Pipeline"(userId, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pipelines_agent_status ON "Pipeline"(agentId, status) WHERE agentId IS NOT NULL;

-- Session management (security)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_expires ON "Session"(userId, expiresAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_expires ON "Session"(token, expiresAt);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON "Session"(expiresAt) WHERE expiresAt > NOW();

-- JSON/JSONB optimization for metadata searches (if using JSONB)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metadata_capabilities_gin ON "AgentMetadata" USING gin(capabilities);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_metadata_gin ON "Task" USING gin(metadata);

-- Full-text search indexes (if using PostgreSQL full-text search)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_name_description_fts ON "Agent" USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_title_description_fts ON "Task" USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Statistics update for better query planning
ANALYZE "User";
ANALYZE "Agent";
ANALYZE "AgentMetadata";
ANALYZE "Chat";
ANALYZE "Message";
ANALYZE "Task";
ANALYZE "Workflow";
ANALYZE "WorkflowStep";
ANALYZE "WorkflowExecution";
ANALYZE "Pipeline";
ANALYZE "Session";