CREATE TYPE "public"."AgentCapability" AS ENUM('CODE_GENERATION', 'CODE_REVIEW', 'CODE_REFACTORING', 'CODE_EXECUTION', 'DEBUGGING', 'TESTING', 'DOCUMENTATION', 'ARCHITECTURE_DESIGN', 'OPTIMIZATION', 'SECURITY_AUDIT', 'PROJECT_MANAGEMENT', 'TOOL_USAGE', 'TASK_EXECUTION', 'FILE_MANAGEMENT', 'CODE_COMPLETION', 'CODE_SUGGESTIONS', 'SYNTAX_HIGHLIGHTING', 'ERROR_DETECTION', 'CODE_FORMATTING', 'INTELLISENSE', 'CHAT', 'WORKFLOW', 'RESEARCH', 'ANALYSIS', 'INTEGRATION');--> statement-breakpoint
CREATE TYPE "public"."AgentStatus" AS ENUM('ACTIVE', 'INACTIVE', 'IDLE', 'BUSY', 'ERROR', 'OFFLINE', 'INITIALIZING', 'READY', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."AgentType" AS ENUM('BASIC', 'CHAT', 'WORKFLOW', 'TASK', 'ASSISTANT', 'ANALYSIS', 'CONVERSATIONAL', 'IDE_EXTENSION', 'API', 'ORCHESTRATOR', 'BROKER', 'MONITOR', 'VALIDATOR', 'ROUTER', 'SCHEDULER', 'GATEWAY', 'CLI_CODER', 'CLI_DEBUGGER', 'CLI_DEVOPS', 'CLI_DATABASE', 'CLI_GIT', 'CLI_SHELL', 'IDE_VSCODE', 'IDE_CURSOR', 'IDE_WINDSURF', 'IDE_JETBRAINS', 'IDE_NEOVIM', 'IDE_EMACS', 'BROWSER_GEMINI', 'BROWSER_CLAUDE', 'BROWSER_CHATGPT', 'BROWSER_COPILOT', 'BROWSER_PERPLEXITY', 'BROWSER_PHIND', 'GITHUB_JULES', 'GITHUB_COPILOT', 'GITHUB_ACTIONS', 'GITHUB_CODESPACES', 'CODE_GENERATOR', 'CODE_REVIEWER', 'CODE_REFACTORER', 'CODE_DOCUMENTER', 'CODE_TESTER', 'CODE_ARCHITECT', 'CODE_OPTIMIZER', 'CODE_SECURITY', 'CODE_MIGRATOR', 'CODE_TRANSLATOR', 'DATA_ANALYST', 'DATA_ENGINEER', 'DATA_SCIENTIST', 'DATA_VISUALIZER', 'DATA_CLEANER', 'DATA_VALIDATOR', 'INFRA_DEVOPS', 'INFRA_CLOUD', 'INFRA_KUBERNETES', 'INFRA_DOCKER', 'INFRA_TERRAFORM', 'INFRA_MONITORING', 'DOC_WRITER', 'DOC_API', 'DOC_README', 'DOC_CHANGELOG', 'DOC_TUTORIAL', 'TEST_UNIT', 'TEST_INTEGRATION', 'TEST_E2E', 'TEST_PERFORMANCE', 'TEST_SECURITY', 'TEST_ACCESSIBILITY', 'AI_TRAINER', 'AI_EVALUATOR', 'AI_PROMPT_ENGINEER', 'AI_RAG', 'AI_EMBEDDINGS', 'AI_FINE_TUNER', 'COMM_TRANSLATOR', 'COMM_SUMMARIZER', 'COMM_WRITER', 'COMM_EMAIL', 'COMM_SLACK', 'COMM_DISCORD', 'RESEARCH_WEB', 'RESEARCH_ACADEMIC', 'RESEARCH_MARKET', 'RESEARCH_COMPETITOR', 'DOMAIN_LEGAL', 'DOMAIN_FINANCE', 'DOMAIN_HEALTHCARE', 'DOMAIN_EDUCATION', 'DOMAIN_ECOMMERCE', 'DOMAIN_GAMING', 'TNF_CORE', 'TNF_ONBOARDING', 'TNF_COORDINATOR', 'TNF_HANDOFF', 'TNF_HEARTBEAT', 'TNF_CLEANUP');--> statement-breakpoint
CREATE TYPE "public"."CodeExecutionLanguage" AS ENUM('JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'RUBY', 'SHELL', 'HTML', 'CSS');--> statement-breakpoint
CREATE TYPE "public"."CodeExecutionStatus" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."CodeExecutionTier" AS ENUM('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."EntityStatus" AS ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED', 'PENDING', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."MarketplaceStatus" AS ENUM('ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."MessageRole" AS ENUM('USER', 'AGENT', 'SYSTEM', 'ASSISTANT', 'TOOL');--> statement-breakpoint
CREATE TYPE "public"."OfferStatus" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."PipelineStatus" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."RegisteredEntityType" AS ENUM('AGENT', 'WORKFLOW', 'TOOL', 'SERVICE', 'INTEGRATION', 'TEMPLATE', 'COMPONENT', 'MODULE');--> statement-breakpoint
CREATE TYPE "public"."TaskPriority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."TaskStatus" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."TransactionStatus" AS ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('TRANSFER', 'CONTRACT_CALL', 'CONTRACT_DEPLOYMENT', 'NFT_MINT', 'NFT_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'AGENT_OPERATOR');--> statement-breakpoint
CREATE TYPE "public"."WalletType" AS ENUM('SMART_ACCOUNT', 'EOA', 'MULTI_SIG');--> statement-breakpoint
CREATE TYPE "public"."WorkflowExecutionStatus" AS ENUM('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."WorkflowStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."jules_config_type" AS ENUM('DISABLED', 'BYOK', 'PLATFORM');--> statement-breakpoint
CREATE TYPE "public"."jules_session_status" AS ENUM('PENDING', 'IN_PROGRESS', 'NEEDS_APPROVAL', 'USER_INPUT_REQUIRED', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "agent_capability_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"capability_name" varchar(255) NOT NULL,
	"capability_type" varchar(100) NOT NULL,
	"version" varchar(20) NOT NULL,
	"description" text,
	"parameters" jsonb,
	"verification_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_directory_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp DEFAULT now(),
	"searchable_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_directory_entries_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"config" jsonb,
	CONSTRAINT "agent_metadata_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "agent_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"value" real NOT NULL,
	"unit" varchar(50),
	"tags" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_nfts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"token_id" integer NOT NULL,
	"contract_address" varchar(100) NOT NULL,
	"smart_account_address" varchar(100),
	"is_fractionalized" boolean DEFAULT false NOT NULL,
	"total_shares" integer DEFAULT 0 NOT NULL,
	"metadata_uri" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_nfts_agent_id_unique" UNIQUE("agent_id"),
	CONSTRAINT "agent_nfts_token_id_unique" UNIQUE("token_id")
);
--> statement-breakpoint
CREATE TABLE "agent_onboarding_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"event_data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"instruction" text NOT NULL,
	"exemplars" jsonb,
	"performance_metrics" jsonb,
	"mass_stage" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"auth_token" varchar(512) NOT NULL,
	"registration_data" jsonb NOT NULL,
	"verification_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"onboarding_status" varchar(50) DEFAULT 'INITIALIZED' NOT NULL,
	"onboarding_progress" real DEFAULT 0 NOT NULL,
	"heartbeat_interval" integer DEFAULT 60000 NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_heartbeat" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_registrations_auth_token_unique" UNIQUE("auth_token")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "AgentType" NOT NULL,
	"status" "AgentStatus" DEFAULT 'INACTIVE' NOT NULL,
	"description" text,
	"system_prompt" text,
	"config" jsonb,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider" varchar(100) DEFAULT 'default' NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "MessageRole" NOT NULL,
	"content" text NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_room_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'MEMBER' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_read_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"topic" text,
	"purpose" text,
	"type" varchar(50) DEFAULT 'GENERAL',
	"is_private" boolean DEFAULT false NOT NULL,
	"is_ephemeral" boolean DEFAULT false NOT NULL,
	"max_participants" integer DEFAULT 50,
	"owner_id" uuid NOT NULL,
	"settings" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255),
	"agent_id" uuid NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"role" "MessageRole" DEFAULT 'USER' NOT NULL,
	"sender_id" uuid,
	"sender_name" varchar(255),
	"agent_id" uuid,
	"chat_id" uuid,
	"room_id" uuid,
	"parent_message_id" uuid,
	"metadata" jsonb,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_ephemeral" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"reactions" jsonb
);
--> statement-breakpoint
CREATE TABLE "read_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_execution_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"owner_id" uuid NOT NULL,
	"collaborators" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"files" jsonb NOT NULL,
	"environment" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"storage_usage" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_execution_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"execution_id" varchar(255) NOT NULL,
	"language" "CodeExecutionLanguage" NOT NULL,
	"code" text NOT NULL,
	"result" jsonb,
	"output" jsonb,
	"error" jsonb,
	"execution_time" integer NOT NULL,
	"memory_usage" integer NOT NULL,
	"compute_units" real NOT NULL,
	"cost" real NOT NULL,
	"tier" "CodeExecutionTier" NOT NULL,
	"environment" varchar(100) NOT NULL,
	"status" "CodeExecutionStatus" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "code_execution_usage_execution_id_unique" UNIQUE("execution_id")
);
--> statement-breakpoint
CREATE TABLE "jules_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"config_type" "jules_config_type" DEFAULT 'DISABLED' NOT NULL,
	"api_key_encrypted" text,
	"webhook_secret" varchar(255),
	"preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "jules_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jules_session_id" varchar(255) NOT NULL,
	"task_id" uuid NOT NULL,
	"delegated_by_agent_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "jules_session_status" DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb,
	"result" jsonb,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "jules_sessions_jules_session_id_unique" UNIQUE("jules_session_id")
);
--> statement-breakpoint
CREATE TABLE "jules_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"usage_type" varchar(50) NOT NULL,
	"metrics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fractional_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_nft_id" uuid NOT NULL,
	"owner_address" varchar(100) NOT NULL,
	"share_amount" numeric(38, 18) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_nft_id" uuid NOT NULL,
	"listing_id" integer NOT NULL,
	"seller" varchar(100) NOT NULL,
	"share_amount" numeric(38, 18) NOT NULL,
	"price_per_share" numeric(38, 18) NOT NULL,
	"total_price" numeric(38, 18) NOT NULL,
	"status" "MarketplaceStatus" DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_listings_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"buyer" varchar(100) NOT NULL,
	"share_amount" numeric(38, 18) NOT NULL,
	"offer_price" numeric(38, 18) NOT NULL,
	"status" "OfferStatus" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_distributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revenue_stream_id" uuid NOT NULL,
	"tx_hash" varchar(100) NOT NULL,
	"total_amount" numeric(38, 18) NOT NULL,
	"distributed_to" jsonb NOT NULL,
	"block_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_nft_id" uuid NOT NULL,
	"stream_name" varchar(255) NOT NULL,
	"description" text,
	"token_address" varchar(100) NOT NULL,
	"total_revenue" numeric(38, 18) NOT NULL,
	"distributed_revenue" numeric(38, 18) NOT NULL,
	"distribution_threshold" numeric(38, 18) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimization_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"config" jsonb NOT NULL,
	"results" jsonb,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "workflow_topologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"nodes" jsonb NOT NULL,
	"edges" jsonb NOT NULL,
	"performance_metrics" jsonb,
	"mass_optimized" boolean DEFAULT false NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" real NOT NULL,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"api_key" varchar(512) NOT NULL,
	"api_endpoint" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 10 NOT NULL,
	"retry_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_starred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"current_version_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"analytics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"label" varchar(100),
	"content" text NOT NULL,
	"variables" jsonb,
	"metrics" jsonb,
	"changelog" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registered_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "RegisteredEntityType" NOT NULL,
	"description" text,
	"metadata" jsonb,
	"config" jsonb,
	"status" "EntityStatus" DEFAULT 'ACTIVE' NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"namespace" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "validation_datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"items" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"configuration" jsonb,
	"status" "PipelineStatus" DEFAULT 'DRAFT' NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"output" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255),
	"description" text,
	"type" varchar(100) NOT NULL,
	"status" "TaskStatus" DEFAULT 'PENDING' NOT NULL,
	"priority" "TaskPriority" DEFAULT 'MEDIUM' NOT NULL,
	"data" jsonb,
	"result" jsonb,
	"error" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"pipeline_id" uuid,
	"assigned_to_id" uuid,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "auth_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(512) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"successful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(255),
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"hashed_password" varchar(255) NOT NULL,
	"role" "UserRole" DEFAULT 'USER' NOT NULL,
	"roles" jsonb DEFAULT '["USER"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"preferences" jsonb,
	"refresh_token" text,
	"deleted_at" timestamp,
	"email_verified" boolean DEFAULT false NOT NULL,
	"wallet_address" varchar(255),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash" varchar(100) NOT NULL,
	"wallet_id" uuid NOT NULL,
	"from_address" varchar(100) NOT NULL,
	"to_address" varchar(100) NOT NULL,
	"value" numeric(38, 18) NOT NULL,
	"gas_price" numeric(38, 18) NOT NULL,
	"gas_used" integer NOT NULL,
	"gas_limit" integer NOT NULL,
	"status" "TransactionStatus" DEFAULT 'PENDING' NOT NULL,
	"block_number" integer,
	"block_hash" varchar(100),
	"type" "TransactionType" DEFAULT 'TRANSFER' NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	CONSTRAINT "transactions_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(100) NOT NULL,
	"agent_id" uuid,
	"type" "WalletType" DEFAULT 'SMART_ACCOUNT' NOT NULL,
	"balance" numeric(38, 18) DEFAULT '0' NOT NULL,
	"nonce" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_activity" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_address_unique" UNIQUE("address"),
	CONSTRAINT "wallets_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"status" "WorkflowExecutionStatus" DEFAULT 'PENDING' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"project_id" uuid
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"config" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"workflow_id" uuid,
	"agent_id" uuid,
	"next_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conditions" jsonb,
	"transformations" jsonb,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_executed_at" timestamp,
	"statistics" jsonb
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) DEFAULT 'Custom' NOT NULL,
	"definition" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"creator_id" uuid,
	"metadata" jsonb,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"definition" jsonb,
	"status" "WorkflowStatus" DEFAULT 'DRAFT' NOT NULL,
	"creator_id" uuid,
	"agent_id" uuid,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"variables" jsonb,
	"triggers" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_executed_at" timestamp,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"statistics" jsonb,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" jsonb NOT NULL,
	"agent_id" uuid,
	"project_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"workspace_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255) NOT NULL,
	"project_id" uuid NOT NULL,
	"allocated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255) NOT NULL,
	"tenant_id" varchar(255),
	"conflict_type" varchar(50) NOT NULL,
	"local_version" jsonb NOT NULL,
	"remote_version" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" varchar(255),
	"resolution" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255) NOT NULL,
	"tenant_id" varchar(255),
	"version" integer NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"last_sync" timestamp NOT NULL,
	"synced_by" varchar(255) NOT NULL,
	"metadata" jsonb NOT NULL,
	CONSTRAINT "sync_states_resource_type_resource_id_tenant_id_unique" UNIQUE("resource_type","resource_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_capability_registry" ADD CONSTRAINT "agent_capability_registry_registration_id_agent_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."agent_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_directory_entries" ADD CONSTRAINT "agent_directory_entries_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_metadata" ADD CONSTRAINT "agent_metadata_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_metrics" ADD CONSTRAINT "agent_metrics_registration_id_agent_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."agent_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_nfts" ADD CONSTRAINT "agent_nfts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_onboarding_events" ADD CONSTRAINT "agent_onboarding_events_registration_id_agent_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."agent_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_prompt_versions" ADD CONSTRAINT "agent_prompt_versions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_registrations" ADD CONSTRAINT "agent_registrations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD CONSTRAINT "chat_room_participants_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_participants" ADD CONSTRAINT "chat_room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_execution_usage" ADD CONSTRAINT "code_execution_usage_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_configs" ADD CONSTRAINT "jules_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_sessions" ADD CONSTRAINT "jules_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_sessions" ADD CONSTRAINT "jules_sessions_delegated_by_agent_id_agents_id_fk" FOREIGN KEY ("delegated_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_sessions" ADD CONSTRAINT "jules_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_usage_logs" ADD CONSTRAINT "jules_usage_logs_session_id_jules_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."jules_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jules_usage_logs" ADD CONSTRAINT "jules_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fractional_shares" ADD CONSTRAINT "fractional_shares_agent_nft_id_agent_nfts_id_fk" FOREIGN KEY ("agent_nft_id") REFERENCES "public"."agent_nfts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_agent_nft_id_agent_nfts_id_fk" FOREIGN KEY ("agent_nft_id") REFERENCES "public"."agent_nfts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_distributions" ADD CONSTRAINT "revenue_distributions_revenue_stream_id_revenue_streams_id_fk" FOREIGN KEY ("revenue_stream_id") REFERENCES "public"."revenue_streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_streams" ADD CONSTRAINT "revenue_streams_agent_nft_id_agent_nfts_id_fk" FOREIGN KEY ("agent_nft_id") REFERENCES "public"."agent_nfts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_jobs" ADD CONSTRAINT "optimization_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_topologies" ADD CONSTRAINT "workflow_topologies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_template_id_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_agents_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_allocations" ADD CONSTRAINT "resource_allocations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "code_exec_agent_id_idx" ON "code_execution_usage" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "code_exec_client_id_idx" ON "code_execution_usage" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "code_exec_created_at_idx" ON "code_execution_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "code_exec_language_idx" ON "code_execution_usage" USING btree ("language");--> statement-breakpoint
CREATE INDEX "code_exec_tier_idx" ON "code_execution_usage" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "code_exec_status_idx" ON "code_execution_usage" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tx_wallet_id_idx" ON "transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "tx_hash_idx" ON "transactions" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "tx_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tx_created_at_idx" ON "transactions" USING btree ("created_at");