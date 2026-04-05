--
-- PostgreSQL database dump
--

\restrict NcRb7sYdb2JJkoIBdyvaAPILyjwClQWRufMMBpf3jAyb7UzJNnEI0KocBfDEoz3

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ai_assets_marketplace; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA ai_assets_marketplace;


ALTER SCHEMA ai_assets_marketplace OWNER TO postgres;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: AgentCapability; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentCapability" AS ENUM (
    'CODE_GENERATION',
    'CODE_REVIEW',
    'CODE_REFACTORING',
    'CODE_EXECUTION',
    'DEBUGGING',
    'TESTING',
    'DOCUMENTATION',
    'ARCHITECTURE_DESIGN',
    'OPTIMIZATION',
    'SECURITY_AUDIT',
    'PROJECT_MANAGEMENT',
    'TOOL_USAGE',
    'TASK_EXECUTION',
    'FILE_MANAGEMENT',
    'CODE_COMPLETION',
    'CODE_SUGGESTIONS',
    'SYNTAX_HIGHLIGHTING',
    'ERROR_DETECTION',
    'CODE_FORMATTING',
    'INTELLISENSE',
    'CHAT',
    'WORKFLOW',
    'RESEARCH',
    'ANALYSIS',
    'INTEGRATION'
);


ALTER TYPE public."AgentCapability" OWNER TO postgres;

--
-- Name: AgentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'IDLE',
    'BUSY',
    'ERROR',
    'OFFLINE',
    'INITIALIZING',
    'READY',
    'TERMINATED'
);


ALTER TYPE public."AgentStatus" OWNER TO postgres;

--
-- Name: AgentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentType" AS ENUM (
    'BASIC',
    'CHAT',
    'WORKFLOW',
    'TASK',
    'ASSISTANT',
    'ANALYSIS',
    'CONVERSATIONAL',
    'IDE_EXTENSION',
    'API',
    'ORCHESTRATOR',
    'BROKER',
    'MONITOR',
    'VALIDATOR',
    'ROUTER',
    'SCHEDULER',
    'GATEWAY',
    'CLI_CODER',
    'CLI_DEBUGGER',
    'CLI_DEVOPS',
    'CLI_DATABASE',
    'CLI_GIT',
    'CLI_SHELL',
    'IDE_VSCODE',
    'IDE_CURSOR',
    'IDE_WINDSURF',
    'IDE_JETBRAINS',
    'IDE_NEOVIM',
    'IDE_EMACS',
    'BROWSER_GEMINI',
    'BROWSER_CLAUDE',
    'BROWSER_CHATGPT',
    'BROWSER_COPILOT',
    'BROWSER_PERPLEXITY',
    'BROWSER_PHIND',
    'GITHUB_JULES',
    'GITHUB_COPILOT',
    'GITHUB_ACTIONS',
    'GITHUB_CODESPACES',
    'CODE_GENERATOR',
    'CODE_REVIEWER',
    'CODE_REFACTORER',
    'CODE_DOCUMENTER',
    'CODE_TESTER',
    'CODE_ARCHITECT',
    'CODE_OPTIMIZER',
    'CODE_SECURITY',
    'CODE_MIGRATOR',
    'CODE_TRANSLATOR',
    'DATA_ANALYST',
    'DATA_ENGINEER',
    'DATA_SCIENTIST',
    'DATA_VISUALIZER',
    'DATA_CLEANER',
    'DATA_VALIDATOR',
    'INFRA_DEVOPS',
    'INFRA_CLOUD',
    'INFRA_KUBERNETES',
    'INFRA_DOCKER',
    'INFRA_TERRAFORM',
    'INFRA_MONITORING',
    'DOC_WRITER',
    'DOC_API',
    'DOC_README',
    'DOC_CHANGELOG',
    'DOC_TUTORIAL',
    'TEST_UNIT',
    'TEST_INTEGRATION',
    'TEST_E2E',
    'TEST_PERFORMANCE',
    'TEST_SECURITY',
    'TEST_ACCESSIBILITY',
    'AI_TRAINER',
    'AI_EVALUATOR',
    'AI_PROMPT_ENGINEER',
    'AI_RAG',
    'AI_EMBEDDINGS',
    'AI_FINE_TUNER',
    'COMM_TRANSLATOR',
    'COMM_SUMMARIZER',
    'COMM_WRITER',
    'COMM_EMAIL',
    'COMM_SLACK',
    'COMM_DISCORD',
    'RESEARCH_WEB',
    'RESEARCH_ACADEMIC',
    'RESEARCH_MARKET',
    'RESEARCH_COMPETITOR',
    'DOMAIN_LEGAL',
    'DOMAIN_FINANCE',
    'DOMAIN_HEALTHCARE',
    'DOMAIN_EDUCATION',
    'DOMAIN_ECOMMERCE',
    'DOMAIN_GAMING',
    'TNF_CORE',
    'TNF_ONBOARDING',
    'TNF_COORDINATOR',
    'TNF_HANDOFF',
    'TNF_HEARTBEAT',
    'TNF_CLEANUP'
);


ALTER TYPE public."AgentType" OWNER TO postgres;

--
-- Name: CodeExecutionLanguage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CodeExecutionLanguage" AS ENUM (
    'JAVASCRIPT',
    'TYPESCRIPT',
    'PYTHON',
    'RUBY',
    'SHELL',
    'HTML',
    'CSS'
);


ALTER TYPE public."CodeExecutionLanguage" OWNER TO postgres;

--
-- Name: CodeExecutionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CodeExecutionStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'TIMEOUT',
    'CANCELLED'
);


ALTER TYPE public."CodeExecutionStatus" OWNER TO postgres;

--
-- Name: CodeExecutionTier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CodeExecutionTier" AS ENUM (
    'BASIC',
    'STANDARD',
    'PREMIUM',
    'ENTERPRISE'
);


ALTER TYPE public."CodeExecutionTier" OWNER TO postgres;

--
-- Name: EntityStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EntityStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DEPRECATED',
    'PENDING',
    'FAILED'
);


ALTER TYPE public."EntityStatus" OWNER TO postgres;

--
-- Name: MarketplaceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MarketplaceStatus" AS ENUM (
    'ACTIVE',
    'SOLD',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."MarketplaceStatus" OWNER TO postgres;

--
-- Name: MessageRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessageRole" AS ENUM (
    'USER',
    'AGENT',
    'SYSTEM',
    'ASSISTANT',
    'TOOL'
);


ALTER TYPE public."MessageRole" OWNER TO postgres;

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public."OfferStatus" OWNER TO postgres;

--
-- Name: PipelineStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PipelineStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."PipelineStatus" OWNER TO postgres;

--
-- Name: RegisteredEntityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RegisteredEntityType" AS ENUM (
    'AGENT',
    'WORKFLOW',
    'TOOL',
    'SERVICE',
    'INTEGRATION',
    'TEMPLATE',
    'COMPONENT',
    'MODULE'
);


ALTER TYPE public."RegisteredEntityType" OWNER TO postgres;

--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."TaskPriority" OWNER TO postgres;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."TaskStatus" OWNER TO postgres;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."TransactionStatus" OWNER TO postgres;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'TRANSFER',
    'CONTRACT_CALL',
    'CONTRACT_DEPLOYMENT',
    'NFT_MINT',
    'NFT_TRANSFER'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'SUPER_ADMIN',
    'AGENCY_OWNER',
    'AGENCY_ADMIN',
    'AGENCY_MANAGER',
    'AGENT_OPERATOR'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: WalletType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WalletType" AS ENUM (
    'SMART_ACCOUNT',
    'EOA',
    'MULTI_SIG'
);


ALTER TYPE public."WalletType" OWNER TO postgres;

--
-- Name: WorkflowExecutionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WorkflowExecutionStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'PAUSED',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."WorkflowExecutionStatus" OWNER TO postgres;

--
-- Name: WorkflowStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WorkflowStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."WorkflowStatus" OWNER TO postgres;

--
-- Name: jules_config_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jules_config_type AS ENUM (
    'DISABLED',
    'BYOK',
    'PLATFORM'
);


ALTER TYPE public.jules_config_type OWNER TO postgres;

--
-- Name: jules_session_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jules_session_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'NEEDS_APPROVAL',
    'USER_INPUT_REQUIRED',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public.jules_session_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artifacts; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.artifacts (
    filename text NOT NULL,
    content_type text NOT NULL,
    content_text text,
    content_bytea bytea,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ai_assets_marketplace.artifacts OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


ALTER TABLE ai_assets_marketplace.categories OWNER TO postgres;

--
-- Name: crawl_runs; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.crawl_runs (
    id text NOT NULL,
    status character varying(32) NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    stats jsonb,
    error text
);


ALTER TABLE ai_assets_marketplace.crawl_runs OWNER TO postgres;

--
-- Name: mcp_categories; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.mcp_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


ALTER TABLE ai_assets_marketplace.mcp_categories OWNER TO postgres;

--
-- Name: mcp_links; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.mcp_links (
    id integer NOT NULL,
    source_id integer NOT NULL,
    link_url text NOT NULL,
    anchor text
);


ALTER TABLE ai_assets_marketplace.mcp_links OWNER TO postgres;

--
-- Name: mcp_servers; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.mcp_servers (
    id integer NOT NULL,
    source_id integer,
    server_name text NOT NULL,
    server_url text,
    repo_url text,
    description text,
    tags text,
    maintainer text,
    stars integer,
    license text,
    transport text,
    created_at text
);


ALTER TABLE ai_assets_marketplace.mcp_servers OWNER TO postgres;

--
-- Name: mcp_sources; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.mcp_sources (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    title text,
    brief text,
    source_type character varying(80),
    created_at text,
    updated_at text
);


ALTER TABLE ai_assets_marketplace.mcp_sources OWNER TO postgres;

--
-- Name: prompts; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.prompts (
    id integer NOT NULL,
    source_id integer NOT NULL,
    title text,
    prompt_text text NOT NULL,
    prompt_hash character varying(128) NOT NULL,
    url text,
    license text,
    tags text,
    created_at text
);


ALTER TABLE ai_assets_marketplace.prompts OWNER TO postgres;

--
-- Name: skill_marketplace_entries; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.skill_marketplace_entries (
    id integer NOT NULL,
    source text NOT NULL,
    entry_url text NOT NULL,
    title text,
    brief text,
    tags text,
    discovered_at text
);


ALTER TABLE ai_assets_marketplace.skill_marketplace_entries OWNER TO postgres;

--
-- Name: source_links; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.source_links (
    id integer NOT NULL,
    source_id integer NOT NULL,
    link_url text NOT NULL,
    anchor text
);


ALTER TABLE ai_assets_marketplace.source_links OWNER TO postgres;

--
-- Name: sources; Type: TABLE; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE TABLE ai_assets_marketplace.sources (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    title text,
    brief text,
    source_type character varying(80),
    created_at text,
    updated_at text
);


ALTER TABLE ai_assets_marketplace.sources OWNER TO postgres;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: agent_capability_registry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_capability_registry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    capability_name character varying(255) NOT NULL,
    capability_type character varying(100) NOT NULL,
    version character varying(20) NOT NULL,
    description text,
    parameters jsonb,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_capability_registry OWNER TO postgres;

--
-- Name: agent_directory_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_directory_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    rating real DEFAULT 0 NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    last_active_at timestamp without time zone DEFAULT now(),
    searchable_data text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_directory_entries OWNER TO postgres;

--
-- Name: agent_memories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_memories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    agent_id uuid,
    project_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_memories OWNER TO postgres;

--
-- Name: agent_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    version character varying(20) DEFAULT '1.0.0'::character varying NOT NULL,
    config jsonb
);


ALTER TABLE public.agent_metadata OWNER TO postgres;

--
-- Name: agent_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    metric_type character varying(100) NOT NULL,
    value real NOT NULL,
    unit character varying(50),
    tags jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_metrics OWNER TO postgres;

--
-- Name: agent_nfts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_nfts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    token_id integer NOT NULL,
    contract_address character varying(100) NOT NULL,
    smart_account_address character varying(100),
    is_fractionalized boolean DEFAULT false NOT NULL,
    total_shares integer DEFAULT 0 NOT NULL,
    metadata_uri text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_nfts OWNER TO postgres;

--
-- Name: agent_onboarding_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_onboarding_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    message text NOT NULL,
    event_data jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_onboarding_events OWNER TO postgres;

--
-- Name: agent_prompt_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_prompt_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    version_number integer NOT NULL,
    instruction text NOT NULL,
    exemplars jsonb,
    performance_metrics jsonb,
    mass_stage character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_prompt_versions OWNER TO postgres;

--
-- Name: agent_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    encrypted_auth_token character varying(1024) NOT NULL,
    registration_data jsonb NOT NULL,
    verification_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    onboarding_status character varying(50) DEFAULT 'INITIALIZED'::character varying NOT NULL,
    onboarding_progress real DEFAULT 0 NOT NULL,
    heartbeat_interval integer DEFAULT 60000 NOT NULL,
    is_online boolean DEFAULT false NOT NULL,
    last_heartbeat timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agent_registrations OWNER TO postgres;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type public."AgentType" NOT NULL,
    status public."AgentStatus" DEFAULT 'INACTIVE'::public."AgentStatus" NOT NULL,
    description text,
    system_prompt text,
    config jsonb,
    capabilities jsonb DEFAULT '[]'::jsonb NOT NULL,
    provider character varying(100) DEFAULT 'default'::character varying NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    insight_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description character varying(2000),
    severity character varying(20) DEFAULT 'info'::character varying NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    recommendations jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_acknowledged boolean DEFAULT false NOT NULL,
    acknowledged_at timestamp without time zone,
    acknowledged_by_id uuid,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_insights OWNER TO postgres;

--
-- Name: auth_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    details jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auth_events OWNER TO postgres;

--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(512) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auth_sessions OWNER TO postgres;

--
-- Name: business_analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    metric_type character varying(50) NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    dimensions jsonb DEFAULT '{}'::jsonb NOT NULL,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.business_analytics OWNER TO postgres;

--
-- Name: business_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50) NOT NULL,
    source character varying(50) NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid,
    correlation_id character varying(255),
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    processing_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone
);


ALTER TABLE public.business_events OWNER TO postgres;

--
-- Name: business_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    value real NOT NULL,
    tags jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.business_metrics OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public."MessageRole" NOT NULL,
    content text NOT NULL,
    expires_at timestamp without time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_room_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_room_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'MEMBER'::character varying NOT NULL,
    joined_at timestamp without time zone DEFAULT now() NOT NULL,
    last_read_at timestamp without time zone,
    metadata jsonb
);


ALTER TABLE public.chat_room_participants OWNER TO postgres;

--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    topic text,
    purpose text,
    type character varying(50) DEFAULT 'GENERAL'::character varying,
    is_private boolean DEFAULT false NOT NULL,
    is_ephemeral boolean DEFAULT false NOT NULL,
    max_participants integer DEFAULT 50,
    owner_id uuid NOT NULL,
    settings jsonb,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_message_at timestamp without time zone,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.chat_rooms OWNER TO postgres;

--
-- Name: chats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255),
    agent_id uuid NOT NULL,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.chats OWNER TO postgres;

--
-- Name: code_execution_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.code_execution_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    collaborators jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    files jsonb NOT NULL,
    environment jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    storage_usage integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.code_execution_sessions OWNER TO postgres;

--
-- Name: code_execution_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.code_execution_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    client_id character varying(255) NOT NULL,
    execution_id character varying(255) NOT NULL,
    language public."CodeExecutionLanguage" NOT NULL,
    code text NOT NULL,
    result jsonb,
    output jsonb,
    error jsonb,
    execution_time integer NOT NULL,
    memory_usage integer NOT NULL,
    compute_units real NOT NULL,
    cost real NOT NULL,
    tier public."CodeExecutionTier" NOT NULL,
    environment character varying(100) NOT NULL,
    status public."CodeExecutionStatus" NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.code_execution_usage OWNER TO postgres;

--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message text NOT NULL,
    stack text,
    context jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.error_logs OWNER TO postgres;

--
-- Name: fractional_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fractional_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_nft_id uuid NOT NULL,
    owner_address character varying(100) NOT NULL,
    share_amount numeric(38,18) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fractional_shares OWNER TO postgres;

--
-- Name: jules_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jules_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    config_type public.jules_config_type DEFAULT 'DISABLED'::public.jules_config_type NOT NULL,
    api_key_encrypted text,
    webhook_secret character varying(255),
    preferences jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.jules_configs OWNER TO postgres;

--
-- Name: jules_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jules_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    jules_session_id character varying(255) NOT NULL,
    task_id uuid NOT NULL,
    delegated_by_agent_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.jules_session_status DEFAULT 'PENDING'::public.jules_session_status NOT NULL,
    metadata jsonb,
    result jsonb,
    error text,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.jules_sessions OWNER TO postgres;

--
-- Name: jules_usage_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jules_usage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    usage_type character varying(50) NOT NULL,
    metrics jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.jules_usage_logs OWNER TO postgres;

--
-- Name: llm_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.llm_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(100) NOT NULL,
    model_name character varying(255) NOT NULL,
    api_key character varying(512) NOT NULL,
    api_endpoint text,
    is_custom boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 10 NOT NULL,
    retry_config jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.llm_configs OWNER TO postgres;

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ip_address character varying(45) NOT NULL,
    successful boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- Name: marketplace_catalog_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_catalog_items (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    kind character varying(40) NOT NULL,
    category character varying(120) NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    capabilities jsonb DEFAULT '[]'::jsonb NOT NULL,
    rating real DEFAULT 0 NOT NULL,
    total_runs integer DEFAULT 0 NOT NULL,
    success_rate real DEFAULT 0 NOT NULL,
    price_per_run real DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'online'::character varying NOT NULL,
    publication_status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    launch_url text,
    avatar_url text,
    created_by text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.marketplace_catalog_items OWNER TO postgres;

--
-- Name: marketplace_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_nft_id uuid NOT NULL,
    listing_id integer NOT NULL,
    seller character varying(100) NOT NULL,
    share_amount numeric(38,18) NOT NULL,
    price_per_share numeric(38,18) NOT NULL,
    total_price numeric(38,18) NOT NULL,
    status public."MarketplaceStatus" DEFAULT 'ACTIVE'::public."MarketplaceStatus" NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.marketplace_listings OWNER TO postgres;

--
-- Name: marketplace_offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.marketplace_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    buyer character varying(100) NOT NULL,
    share_amount numeric(38,18) NOT NULL,
    offer_price numeric(38,18) NOT NULL,
    status public."OfferStatus" DEFAULT 'PENDING'::public."OfferStatus" NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.marketplace_offers OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    role public."MessageRole" DEFAULT 'USER'::public."MessageRole" NOT NULL,
    sender_id uuid,
    sender_name character varying(255),
    agent_id uuid,
    chat_id uuid,
    room_id uuid,
    parent_message_id uuid,
    metadata jsonb,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    is_ephemeral boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone,
    reactions jsonb
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: optimization_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.optimization_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50) NOT NULL,
    target_id character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    config jsonb NOT NULL,
    results jsonb,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    error text
);


ALTER TABLE public.optimization_jobs OWNER TO postgres;

--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    configuration jsonb,
    status public."PipelineStatus" DEFAULT 'DRAFT'::public."PipelineStatus" NOT NULL,
    user_id uuid NOT NULL,
    agent_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.pipelines OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    workspace_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: prompt_snippets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_snippets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    content text NOT NULL,
    type character varying(50) NOT NULL,
    category character varying(100),
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    description text,
    is_starred boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prompt_snippets OWNER TO postgres;

--
-- Name: prompt_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    current_version_id uuid,
    is_public boolean DEFAULT false NOT NULL,
    category character varying(100),
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    analytics jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prompt_templates OWNER TO postgres;

--
-- Name: prompt_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    version_number integer NOT NULL,
    label character varying(50) DEFAULT 'development'::character varying,
    content text NOT NULL,
    variables jsonb DEFAULT '{}'::jsonb NOT NULL,
    metrics jsonb DEFAULT '{"totalRuns": 0, "successRate": 0, "avgResponseTime": 0}'::jsonb,
    changelog text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    name character varying(255),
    blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by character varying(255)
);


ALTER TABLE public.prompt_versions OWNER TO postgres;

--
-- Name: read_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.read_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.read_receipts OWNER TO postgres;

--
-- Name: registered_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registered_entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type public."RegisteredEntityType" NOT NULL,
    description text,
    metadata jsonb,
    config jsonb,
    status public."EntityStatus" DEFAULT 'ACTIVE'::public."EntityStatus" NOT NULL,
    version character varying(20) DEFAULT '1.0.0'::character varying NOT NULL,
    namespace character varying(100),
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    capabilities jsonb DEFAULT '[]'::jsonb NOT NULL,
    dependencies jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    owner_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.registered_entities OWNER TO postgres;

--
-- Name: resource_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id character varying(255) NOT NULL,
    project_id uuid NOT NULL,
    allocated_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


ALTER TABLE public.resource_allocations OWNER TO postgres;

--
-- Name: resource_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_id character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.resource_favorites OWNER TO postgres;

--
-- Name: resource_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_id character varying(255) NOT NULL,
    from_user_id uuid NOT NULL,
    to_agent_id character varying(255) NOT NULL,
    notes text,
    shared_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.resource_shares OWNER TO postgres;

--
-- Name: revenue_distributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue_distributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    revenue_stream_id uuid NOT NULL,
    tx_hash character varying(100) NOT NULL,
    total_amount numeric(38,18) NOT NULL,
    distributed_to jsonb NOT NULL,
    block_number integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.revenue_distributions OWNER TO postgres;

--
-- Name: revenue_streams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue_streams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_nft_id uuid NOT NULL,
    stream_name character varying(255) NOT NULL,
    description text,
    token_address character varying(100) NOT NULL,
    total_revenue numeric(38,18) NOT NULL,
    distributed_revenue numeric(38,18) NOT NULL,
    distribution_threshold numeric(38,18) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.revenue_streams OWNER TO postgres;

--
-- Name: sse_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sse_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid,
    event_types jsonb DEFAULT '[]'::jsonb NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone
);


ALTER TABLE public.sse_subscriptions OWNER TO postgres;

--
-- Name: sync_conflicts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_conflicts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id character varying(255) NOT NULL,
    tenant_id character varying(255),
    conflict_type character varying(50) NOT NULL,
    local_version jsonb NOT NULL,
    remote_version jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone,
    resolved_by character varying(255),
    resolution jsonb
);


ALTER TABLE public.sync_conflicts OWNER TO postgres;

--
-- Name: sync_states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_states (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id character varying(255) NOT NULL,
    tenant_id character varying(255),
    version integer NOT NULL,
    checksum character varying(64) NOT NULL,
    last_sync timestamp without time zone NOT NULL,
    synced_by character varying(255) NOT NULL,
    metadata jsonb NOT NULL
);


ALTER TABLE public.sync_states OWNER TO postgres;

--
-- Name: system_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_configurations (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    category character varying(100) DEFAULT 'general'::character varying NOT NULL,
    description text,
    sensitive boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by character varying(255)
);


ALTER TABLE public.system_configurations OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer DEFAULT 1 NOT NULL,
    config jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by character varying(255)
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: task_executions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    output jsonb,
    error text,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.task_executions OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255),
    description text,
    type character varying(100) NOT NULL,
    status public."TaskStatus" DEFAULT 'PENDING'::public."TaskStatus" NOT NULL,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    data jsonb,
    result jsonb,
    error text,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    pipeline_id uuid,
    assigned_to_id uuid,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    metadata jsonb
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hash character varying(100) NOT NULL,
    wallet_id uuid NOT NULL,
    from_address character varying(100) NOT NULL,
    to_address character varying(100) NOT NULL,
    value numeric(38,18) NOT NULL,
    gas_price numeric(38,18) NOT NULL,
    gas_used integer NOT NULL,
    gas_limit integer NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    block_number integer,
    block_hash character varying(100),
    type public."TransactionType" DEFAULT 'TRANSFER'::public."TransactionType" NOT NULL,
    data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp without time zone
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255),
    name character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    roles jsonb DEFAULT '["USER"]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp without time zone,
    preferences jsonb,
    refresh_token text,
    deleted_at timestamp without time zone,
    email_verified boolean DEFAULT false NOT NULL,
    wallet_address character varying(255),
    verification_token character varying(255),
    verification_expires timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: validation_datasets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.validation_datasets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    items jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.validation_datasets OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    address character varying(100) NOT NULL,
    agent_id uuid,
    type public."WalletType" DEFAULT 'SMART_ACCOUNT'::public."WalletType" NOT NULL,
    balance numeric(38,18) DEFAULT '0'::numeric NOT NULL,
    nonce integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_activity timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: webhook_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    source character varying(50) NOT NULL,
    endpoint_url character varying(500) NOT NULL,
    secret_key character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.webhook_configurations OWNER TO postgres;

--
-- Name: webhook_delivery_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_delivery_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    webhook_configuration_id uuid NOT NULL,
    event_id uuid,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    response_status integer,
    response_body character varying(2000),
    delivery_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    delivered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.webhook_delivery_logs OWNER TO postgres;

--
-- Name: workflow_executions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    status public."WorkflowExecutionStatus" DEFAULT 'PENDING'::public."WorkflowExecutionStatus" NOT NULL,
    input jsonb,
    output jsonb,
    error text,
    started_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    project_id uuid
);


ALTER TABLE public.workflow_executions OWNER TO postgres;

--
-- Name: workflow_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    config jsonb,
    "order" integer DEFAULT 0 NOT NULL,
    workflow_id uuid,
    agent_id uuid,
    next_steps jsonb DEFAULT '[]'::jsonb NOT NULL,
    conditions jsonb,
    transformations jsonb,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_executed_at timestamp without time zone,
    statistics jsonb
);


ALTER TABLE public.workflow_steps OWNER TO postgres;

--
-- Name: workflow_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) DEFAULT 'Custom'::character varying NOT NULL,
    definition jsonb NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    creator_id uuid,
    metadata jsonb,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workflow_templates OWNER TO postgres;

--
-- Name: workflow_topologies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_topologies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    nodes jsonb NOT NULL,
    edges jsonb NOT NULL,
    performance_metrics jsonb,
    mass_optimized boolean DEFAULT false NOT NULL,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workflow_topologies OWNER TO postgres;

--
-- Name: workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    definition jsonb,
    status public."WorkflowStatus" DEFAULT 'DRAFT'::public."WorkflowStatus" NOT NULL,
    creator_id uuid,
    agent_id uuid,
    metadata jsonb,
    is_active boolean DEFAULT true NOT NULL,
    variables jsonb,
    triggers jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_executed_at timestamp without time zone,
    execution_count integer DEFAULT 0 NOT NULL,
    statistics jsonb,
    deleted_at timestamp without time zone
);


ALTER TABLE public.workflows OWNER TO postgres;

--
-- Name: workspace_bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_bookmarks (
    id text NOT NULL,
    workspace_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    url text NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    note text,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workspace_bookmarks OWNER TO postgres;

--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.workspaces OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: artifacts; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.artifacts (filename, content_type, content_text, content_bytea, uploaded_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.categories (id, name, description) FROM stdin;
\.


--
-- Data for Name: crawl_runs; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.crawl_runs (id, status, started_at, finished_at, stats, error) FROM stdin;
\.


--
-- Data for Name: mcp_categories; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.mcp_categories (id, name, description) FROM stdin;
\.


--
-- Data for Name: mcp_links; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.mcp_links (id, source_id, link_url, anchor) FROM stdin;
\.


--
-- Data for Name: mcp_servers; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.mcp_servers (id, source_id, server_name, server_url, repo_url, description, tags, maintainer, stars, license, transport, created_at) FROM stdin;
\.


--
-- Data for Name: mcp_sources; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.mcp_sources (id, category_id, name, url, title, brief, source_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: prompts; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.prompts (id, source_id, title, prompt_text, prompt_hash, url, license, tags, created_at) FROM stdin;
\.


--
-- Data for Name: skill_marketplace_entries; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.skill_marketplace_entries (id, source, entry_url, title, brief, tags, discovered_at) FROM stdin;
\.


--
-- Data for Name: source_links; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.source_links (id, source_id, link_url, anchor) FROM stdin;
\.


--
-- Data for Name: sources; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

COPY ai_assets_marketplace.sources (id, category_id, name, url, title, brief, source_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	80c35c76d37d8886e2e4af7162f7dca4e0077cc8f5ad6673b9bbe5d2b4f9c289	1767766635708
2	99e9a580bae2a01ca12fee1c7edafffcc18f3c31261c35e8bc05def4a9d962d2	1767891830851
3	beb1f3a3de224c30e32f3128c9794fdd24836553211df0fdad00355f889a0ba6	1772382500000
4	5678c1959f0e105f4a23dff6ada8287601b4cf51cb09b887ec2ed59f41631e4c	1772865000000
5	9ecf16df55e224448c78c01f32b7d5f23b17f10db5dfbeda3963afbfddf3abeb	1772866800000
6	627297ea9c42d41f5bb0f8a83ff58888d1be39dda8cceea74ede5ab63cffbaa4	1772956800000
7	2e9551deb81720f6f16840cff06b121c2b4050113f127011f7b27293bd24a2b8	1773855000000
8	0222f750037210390665f0e61da03aab310af2154614548f91d44ff55477eceb	1774004000000
9	0e20d03b7a13f84d690d2a0df70798a7850e293e76c766ddb66405c989f39e8b	1774006913835
\.


--
-- Data for Name: agent_capability_registry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_capability_registry (id, registration_id, capability_name, capability_type, version, description, parameters, verification_status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agent_directory_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_directory_entries (id, agent_id, display_name, description, category, tags, is_public, is_verified, featured, rating, usage_count, last_active_at, searchable_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agent_memories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_memories (id, key, value, agent_id, project_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agent_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_metadata (id, agent_id, metadata, version, config) FROM stdin;
\.


--
-- Data for Name: agent_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_metrics (id, registration_id, metric_type, value, unit, tags, "timestamp") FROM stdin;
\.


--
-- Data for Name: agent_nfts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_nfts (id, agent_id, token_id, contract_address, smart_account_address, is_fractionalized, total_shares, metadata_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agent_onboarding_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_onboarding_events (id, registration_id, event_type, message, event_data, "timestamp") FROM stdin;
\.


--
-- Data for Name: agent_prompt_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_prompt_versions (id, agent_id, version_number, instruction, exemplars, performance_metrics, mass_stage, created_at) FROM stdin;
\.


--
-- Data for Name: agent_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_registrations (id, agent_id, encrypted_auth_token, registration_data, verification_status, onboarding_status, onboarding_progress, heartbeat_interval, is_online, last_heartbeat, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, name, type, status, description, system_prompt, config, capabilities, provider, user_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: ai_insights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_insights (id, organization_id, insight_type, title, description, severity, data, recommendations, is_acknowledged, acknowledged_at, acknowledged_by_id, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: auth_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_events (id, user_id, type, details, created_at) FROM stdin;
\.


--
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_sessions (id, user_id, token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: business_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_analytics (id, organization_id, metric_type, metric_name, metric_value, dimensions, period_start, period_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: business_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_events (id, type, source, organization_id, user_id, correlation_id, data, metadata, processing_status, retry_count, created_at, updated_at, processed_at) FROM stdin;
\.


--
-- Data for Name: business_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.business_metrics (id, name, value, tags, created_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, user_id, role, content, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_room_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_room_participants (id, room_id, user_id, role, joined_at, last_read_at, metadata) FROM stdin;
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_rooms (id, name, description, topic, purpose, type, is_private, is_ephemeral, max_participants, owner_id, settings, metadata, created_at, updated_at, last_message_at, expires_at, is_active, deleted_at) FROM stdin;
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chats (id, title, agent_id, user_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: code_execution_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.code_execution_sessions (id, name, description, owner_id, collaborators, is_public, files, environment, created_at, updated_at, expires_at, storage_usage) FROM stdin;
\.


--
-- Data for Name: code_execution_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.code_execution_usage (id, agent_id, client_id, execution_id, language, code, result, output, error, execution_time, memory_usage, compute_units, cost, tier, environment, status, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.error_logs (id, message, stack, context, created_at) FROM stdin;
\.


--
-- Data for Name: fractional_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fractional_shares (id, agent_nft_id, owner_address, share_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jules_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jules_configs (id, user_id, config_type, api_key_encrypted, webhook_secret, preferences, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: jules_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jules_sessions (id, jules_session_id, task_id, delegated_by_agent_id, user_id, status, metadata, result, error, started_at, completed_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: jules_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jules_usage_logs (id, session_id, user_id, usage_type, metrics, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: llm_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.llm_configs (id, name, provider, model_name, api_key, api_endpoint, is_custom, enabled, priority, retry_config, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (id, user_id, ip_address, successful, created_at) FROM stdin;
\.


--
-- Data for Name: marketplace_catalog_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_catalog_items (id, slug, name, description, kind, category, tags, capabilities, rating, total_runs, success_rate, price_per_run, status, publication_status, launch_url, avatar_url, created_by, created_at, updated_at) FROM stdin;
exp-open-audio-deck	open-audio-deck	Open Audio Deck	Spotify-style Audius client for streaming trending tracks and searching the Open Audio catalog.	experience	music	["music", "audius", "streaming"]	["music_streaming", "playlist_discovery", "audius_search"]	4.9	4200	99.2	0	online	published	https://open-audio-deck-production.up.railway.app	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
exp-merkaba-lab	merkaba-lab	Merkaba Lab	PoolTogether-inspired arcade lab with rotating jackpot physics, sidepot strategy, and replay loops.	experience	pooltogether	["pooltogether", "merkaba", "lab"]	["pool_variations", "sidepot_strategy", "jackpot_cycles"]	4.8	13370	98.4	0	online	published	https://ai-arcade.xyz/#merkaba-lab	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
exp-community-neon-kart	community-neon-kart	Community Neon Kart	User-created mini-game spotlight with rotating daily tracks and leaderboard ladders.	experience	community	["community", "ugc", "games"]	["ugc_game", "daily_rotations", "leaderboards"]	4.5	7310	96.9	0	online	review	https://ai-arcade.xyz/#community-neon-kart	\N	community	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
wf-compliance-handoff	compliance-handoff-workflow	Compliance Handoff Workflow	Workflow primitive for multi-step policy checks, red-team gates, and final review handoff.	workflow	automation	["workflow", "compliance", "automation"]	["multi_step_validation", "review_gate", "handoff"]	4.7	5210	97.8	0.04	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
mcp-filesystem	filesystem-mcp-server	Filesystem MCP Server	Provides secure filesystem access for AI agents through MCP.	mcp_server	developer-tools	["mcp", "filesystem", "server"]	["file_read", "file_write", "directory_listing"]	4.6	8921	98.1	0	online	published	\N	\N	mcp-foundation	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
mcp-github	github-mcp-server	GitHub MCP Server	MCP server for repository operations, issue triage, and pull request workflows.	mcp_server	developer-tools	["mcp", "github", "server"]	["repo_read", "repo_write", "pr_management", "issue_triage"]	4.8	11230	98.7	0.01	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
skill-code-review-sentinel	code-review-sentinel	Code Review Sentinel	Security-aware review skill for pull requests with architecture and test quality checks.	skill	development	["skill", "code-review", "security"]	["code_review", "security_analysis", "test_gap_detection"]	4.7	9800	97.3	0.06	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
prompt-growth-brief	growth-brief-prompt-pack	Growth Brief Prompt Pack	Prompt primitive for GTM planning, launch copy iteration, and experimentation loops.	prompt	productivity	["prompt", "growth", "marketing"]	["brief_generation", "copy_iteration", "experiment_planning"]	4.5	7020	96.1	0.02	online	published	\N	\N	community	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
template-ops-director	ops-director-template	Ops Director Template	Ready-to-clone agent template for task intake, delegation, and multi-agent operations.	agent_template	automation	["template", "operations", "automation"]	["task_routing", "delegation", "execution_tracking"]	4.8	4330	98.9	0.08	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
agent-tnf-director	tnf-director	TNF Director	Master orchestrator for multi-agent swarms and complex workflow delegation.	agent	automation	["agent", "orchestration", "workflow"]	["orchestration", "delegation", "swarm_management"]	5	3200	99.1	0.25	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
model-qwen3-coder-next	qwen3-coder-next	Qwen3 Coder Next	High-speed coding and repository analysis primitive for developer workflows.	model	code	["model", "coder", "code"]	["code_generation", "refactoring", "repository_analysis"]	4.9	15420	98.2	0.05	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
model-deepseek-r1	deepseek-r1	DeepSeek R1	Reasoning-first primitive for complex planning and advanced mathematical proofing.	model	analytics	["model", "reasoning", "math"]	["reasoning", "complex_planning", "proof_verification"]	4.8	8750	97.5	0.1	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
\.


--
-- Data for Name: marketplace_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_listings (id, agent_nft_id, listing_id, seller, share_amount, price_per_share, total_price, status, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: marketplace_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.marketplace_offers (id, listing_id, buyer, share_amount, offer_price, status, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, content, role, sender_id, sender_name, agent_id, chat_id, room_id, parent_message_id, metadata, attachments, "timestamp", updated_at, is_edited, is_deleted, is_ephemeral, expires_at, reactions) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, read, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: optimization_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.optimization_jobs (id, type, target_id, status, config, results, user_id, created_at, updated_at, error) FROM stdin;
\.


--
-- Data for Name: pipelines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pipelines (id, name, description, configuration, status, user_id, agent_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, name, description, workspace_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: prompt_snippets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt_snippets (id, name, content, type, category, tags, usage_count, description, is_starred, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: prompt_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt_templates (id, name, description, current_version_id, is_public, category, tags, analytics, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: prompt_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompt_versions (id, template_id, version_number, label, content, variables, metrics, changelog, is_active, created_at, name, blocks, created_by) FROM stdin;
\.


--
-- Data for Name: read_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.read_receipts (id, message_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: registered_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registered_entities (id, name, type, description, metadata, config, status, version, namespace, tags, capabilities, dependencies, is_public, owner_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: resource_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_allocations (id, resource_type, resource_id, project_id, allocated_at, metadata) FROM stdin;
\.


--
-- Data for Name: resource_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_favorites (id, resource_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: resource_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_shares (id, resource_id, from_user_id, to_agent_id, notes, shared_at) FROM stdin;
\.


--
-- Data for Name: revenue_distributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revenue_distributions (id, revenue_stream_id, tx_hash, total_amount, distributed_to, block_number, created_at) FROM stdin;
\.


--
-- Data for Name: revenue_streams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revenue_streams (id, agent_nft_id, stream_name, description, token_address, total_revenue, distributed_revenue, distribution_threshold, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sse_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sse_subscriptions (id, organization_id, user_id, event_types, filters, is_active, created_at, updated_at, expires_at) FROM stdin;
\.


--
-- Data for Name: sync_conflicts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_conflicts (id, resource_type, resource_id, tenant_id, conflict_type, local_version, remote_version, created_at, resolved_at, resolved_by, resolution) FROM stdin;
\.


--
-- Data for Name: sync_states; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_states (id, resource_type, resource_id, tenant_id, version, checksum, last_sync, synced_by, metadata) FROM stdin;
\.


--
-- Data for Name: system_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_configurations (key, value, category, description, sensitive, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, config, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: task_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_executions (id, task_id, status, output, error, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, type, status, priority, data, result, error, start_time, end_time, pipeline_id, assigned_to_id, user_id, created_at, updated_at, deleted_at, metadata) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, hash, wallet_id, from_address, to_address, value, gas_price, gas_used, gas_limit, status, block_number, block_hash, type, data, created_at, confirmed_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, name, created_at, updated_at, hashed_password, role, roles, is_active, last_login, preferences, refresh_token, deleted_at, email_verified, wallet_address, verification_token, verification_expires) FROM stdin;
\.


--
-- Data for Name: validation_datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.validation_datasets (id, name, description, items, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, address, agent_id, type, balance, nonce, is_active, last_activity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: webhook_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_configurations (id, organization_id, source, endpoint_url, secret_key, is_active, configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: webhook_delivery_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_delivery_logs (id, webhook_configuration_id, event_id, payload, response_status, response_body, delivery_status, attempt_number, delivered_at, created_at) FROM stdin;
\.


--
-- Data for Name: workflow_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_executions (id, workflow_id, status, input, output, error, started_at, completed_at, project_id) FROM stdin;
\.


--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_steps (id, name, type, config, "order", workflow_id, agent_id, next_steps, conditions, transformations, metadata, is_active, created_at, updated_at, last_executed_at, statistics) FROM stdin;
\.


--
-- Data for Name: workflow_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_templates (id, name, description, category, definition, is_public, creator_id, metadata, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workflow_topologies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflow_topologies (id, name, description, nodes, edges, performance_metrics, mass_optimized, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workflows (id, name, description, definition, status, creator_id, agent_id, metadata, is_active, variables, triggers, created_at, updated_at, last_executed_at, execution_count, statistics, deleted_at) FROM stdin;
\.


--
-- Data for Name: workspace_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workspace_bookmarks (id, workspace_id, title, url, tags, note, created_by_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.workspaces (id, name, description, owner_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 9, true);


--
-- Name: artifacts artifacts_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.artifacts
    ADD CONSTRAINT artifacts_pkey PRIMARY KEY (filename);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: crawl_runs crawl_runs_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.crawl_runs
    ADD CONSTRAINT crawl_runs_pkey PRIMARY KEY (id);


--
-- Name: mcp_categories mcp_categories_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.mcp_categories
    ADD CONSTRAINT mcp_categories_pkey PRIMARY KEY (id);


--
-- Name: mcp_links mcp_links_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.mcp_links
    ADD CONSTRAINT mcp_links_pkey PRIMARY KEY (id);


--
-- Name: mcp_servers mcp_servers_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.mcp_servers
    ADD CONSTRAINT mcp_servers_pkey PRIMARY KEY (id);


--
-- Name: mcp_sources mcp_sources_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.mcp_sources
    ADD CONSTRAINT mcp_sources_pkey PRIMARY KEY (id);


--
-- Name: prompts prompts_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);


--
-- Name: skill_marketplace_entries skill_marketplace_entries_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.skill_marketplace_entries
    ADD CONSTRAINT skill_marketplace_entries_pkey PRIMARY KEY (id);


--
-- Name: source_links source_links_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.source_links
    ADD CONSTRAINT source_links_pkey PRIMARY KEY (id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ONLY ai_assets_marketplace.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: agent_capability_registry agent_capability_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_capability_registry
    ADD CONSTRAINT agent_capability_registry_pkey PRIMARY KEY (id);


--
-- Name: agent_directory_entries agent_directory_entries_agent_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_directory_entries
    ADD CONSTRAINT agent_directory_entries_agent_id_unique UNIQUE (agent_id);


--
-- Name: agent_directory_entries agent_directory_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_directory_entries
    ADD CONSTRAINT agent_directory_entries_pkey PRIMARY KEY (id);


--
-- Name: agent_memories agent_memories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_memories
    ADD CONSTRAINT agent_memories_pkey PRIMARY KEY (id);


--
-- Name: agent_metadata agent_metadata_agent_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_metadata
    ADD CONSTRAINT agent_metadata_agent_id_unique UNIQUE (agent_id);


--
-- Name: agent_metadata agent_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_metadata
    ADD CONSTRAINT agent_metadata_pkey PRIMARY KEY (id);


--
-- Name: agent_metrics agent_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_metrics
    ADD CONSTRAINT agent_metrics_pkey PRIMARY KEY (id);


--
-- Name: agent_nfts agent_nfts_agent_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_nfts
    ADD CONSTRAINT agent_nfts_agent_id_unique UNIQUE (agent_id);


--
-- Name: agent_nfts agent_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_nfts
    ADD CONSTRAINT agent_nfts_pkey PRIMARY KEY (id);


--
-- Name: agent_nfts agent_nfts_token_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_nfts
    ADD CONSTRAINT agent_nfts_token_id_unique UNIQUE (token_id);


--
-- Name: agent_onboarding_events agent_onboarding_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_onboarding_events
    ADD CONSTRAINT agent_onboarding_events_pkey PRIMARY KEY (id);


--
-- Name: agent_prompt_versions agent_prompt_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_prompt_versions
    ADD CONSTRAINT agent_prompt_versions_pkey PRIMARY KEY (id);


--
-- Name: agent_registrations agent_registrations_encrypted_auth_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_registrations
    ADD CONSTRAINT agent_registrations_encrypted_auth_token_unique UNIQUE (encrypted_auth_token);


--
-- Name: agent_registrations agent_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_registrations
    ADD CONSTRAINT agent_registrations_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: auth_events auth_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_events
    ADD CONSTRAINT auth_events_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_token_unique UNIQUE (token);


--
-- Name: business_analytics business_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_analytics
    ADD CONSTRAINT business_analytics_pkey PRIMARY KEY (id);


--
-- Name: business_events business_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_events
    ADD CONSTRAINT business_events_pkey PRIMARY KEY (id);


--
-- Name: business_metrics business_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_metrics
    ADD CONSTRAINT business_metrics_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_room_participants chat_room_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_room_participants
    ADD CONSTRAINT chat_room_participants_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: code_execution_sessions code_execution_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_execution_sessions
    ADD CONSTRAINT code_execution_sessions_pkey PRIMARY KEY (id);


--
-- Name: code_execution_usage code_execution_usage_execution_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_execution_usage
    ADD CONSTRAINT code_execution_usage_execution_id_unique UNIQUE (execution_id);


--
-- Name: code_execution_usage code_execution_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_execution_usage
    ADD CONSTRAINT code_execution_usage_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: fractional_shares fractional_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fractional_shares
    ADD CONSTRAINT fractional_shares_pkey PRIMARY KEY (id);


--
-- Name: jules_configs jules_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_configs
    ADD CONSTRAINT jules_configs_pkey PRIMARY KEY (id);


--
-- Name: jules_sessions jules_sessions_jules_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_sessions
    ADD CONSTRAINT jules_sessions_jules_session_id_unique UNIQUE (jules_session_id);


--
-- Name: jules_sessions jules_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_sessions
    ADD CONSTRAINT jules_sessions_pkey PRIMARY KEY (id);


--
-- Name: jules_usage_logs jules_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_usage_logs
    ADD CONSTRAINT jules_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: llm_configs llm_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llm_configs
    ADD CONSTRAINT llm_configs_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: marketplace_catalog_items marketplace_catalog_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_catalog_items
    ADD CONSTRAINT marketplace_catalog_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_listings marketplace_listings_listing_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_listing_id_unique UNIQUE (listing_id);


--
-- Name: marketplace_listings marketplace_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id);


--
-- Name: marketplace_offers marketplace_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_offers
    ADD CONSTRAINT marketplace_offers_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: optimization_jobs optimization_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimization_jobs
    ADD CONSTRAINT optimization_jobs_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: prompt_snippets prompt_snippets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_snippets
    ADD CONSTRAINT prompt_snippets_pkey PRIMARY KEY (id);


--
-- Name: prompt_templates prompt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_templates
    ADD CONSTRAINT prompt_templates_pkey PRIMARY KEY (id);


--
-- Name: prompt_versions prompt_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_pkey PRIMARY KEY (id);


--
-- Name: read_receipts read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.read_receipts
    ADD CONSTRAINT read_receipts_pkey PRIMARY KEY (id);


--
-- Name: registered_entities registered_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registered_entities
    ADD CONSTRAINT registered_entities_pkey PRIMARY KEY (id);


--
-- Name: resource_allocations resource_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_pkey PRIMARY KEY (id);


--
-- Name: resource_favorites resource_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_favorites
    ADD CONSTRAINT resource_favorites_pkey PRIMARY KEY (id);


--
-- Name: resource_shares resource_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_shares
    ADD CONSTRAINT resource_shares_pkey PRIMARY KEY (id);


--
-- Name: revenue_distributions revenue_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_distributions
    ADD CONSTRAINT revenue_distributions_pkey PRIMARY KEY (id);


--
-- Name: revenue_streams revenue_streams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_streams
    ADD CONSTRAINT revenue_streams_pkey PRIMARY KEY (id);


--
-- Name: sse_subscriptions sse_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sse_subscriptions
    ADD CONSTRAINT sse_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: sync_conflicts sync_conflicts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_conflicts
    ADD CONSTRAINT sync_conflicts_pkey PRIMARY KEY (id);


--
-- Name: sync_states sync_states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_states
    ADD CONSTRAINT sync_states_pkey PRIMARY KEY (id);


--
-- Name: sync_states sync_states_resource_type_resource_id_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_states
    ADD CONSTRAINT sync_states_resource_type_resource_id_tenant_id_unique UNIQUE (resource_type, resource_id, tenant_id);


--
-- Name: system_configurations system_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_pkey PRIMARY KEY (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: task_executions task_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_executions
    ADD CONSTRAINT task_executions_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_hash_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_hash_unique UNIQUE (hash);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: users users_wallet_address_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_unique UNIQUE (wallet_address);


--
-- Name: validation_datasets validation_datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.validation_datasets
    ADD CONSTRAINT validation_datasets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_address_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_address_unique UNIQUE (address);


--
-- Name: wallets wallets_agent_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_agent_id_unique UNIQUE (agent_id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: webhook_configurations webhook_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_configurations
    ADD CONSTRAINT webhook_configurations_pkey PRIMARY KEY (id);


--
-- Name: webhook_delivery_logs webhook_delivery_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_delivery_logs
    ADD CONSTRAINT webhook_delivery_logs_pkey PRIMARY KEY (id);


--
-- Name: workflow_executions workflow_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_pkey PRIMARY KEY (id);


--
-- Name: workflow_steps workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: workflow_templates workflow_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_pkey PRIMARY KEY (id);


--
-- Name: workflow_topologies workflow_topologies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_topologies
    ADD CONSTRAINT workflow_topologies_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: workspace_bookmarks workspace_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_bookmarks
    ADD CONSTRAINT workspace_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: ai_assets_categories_name_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_categories_name_uq ON ai_assets_marketplace.categories USING btree (name);


--
-- Name: ai_assets_crawl_runs_started_at_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_crawl_runs_started_at_idx ON ai_assets_marketplace.crawl_runs USING btree (started_at);


--
-- Name: ai_assets_crawl_runs_status_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_crawl_runs_status_idx ON ai_assets_marketplace.crawl_runs USING btree (status);


--
-- Name: ai_assets_mcp_categories_name_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_mcp_categories_name_uq ON ai_assets_marketplace.mcp_categories USING btree (name);


--
-- Name: ai_assets_mcp_links_link_url_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_links_link_url_idx ON ai_assets_marketplace.mcp_links USING btree (link_url);


--
-- Name: ai_assets_mcp_links_source_id_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_links_source_id_idx ON ai_assets_marketplace.mcp_links USING btree (source_id);


--
-- Name: ai_assets_mcp_links_source_url_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_mcp_links_source_url_uq ON ai_assets_marketplace.mcp_links USING btree (source_id, link_url);


--
-- Name: ai_assets_mcp_servers_repo_url_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_servers_repo_url_idx ON ai_assets_marketplace.mcp_servers USING btree (repo_url);


--
-- Name: ai_assets_mcp_servers_server_repo_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_mcp_servers_server_repo_uq ON ai_assets_marketplace.mcp_servers USING btree (server_url, repo_url);


--
-- Name: ai_assets_mcp_servers_server_url_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_servers_server_url_idx ON ai_assets_marketplace.mcp_servers USING btree (server_url);


--
-- Name: ai_assets_mcp_servers_source_id_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_servers_source_id_idx ON ai_assets_marketplace.mcp_servers USING btree (source_id);


--
-- Name: ai_assets_mcp_sources_category_id_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_sources_category_id_idx ON ai_assets_marketplace.mcp_sources USING btree (category_id);


--
-- Name: ai_assets_mcp_sources_name_url_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_mcp_sources_name_url_uq ON ai_assets_marketplace.mcp_sources USING btree (name, url);


--
-- Name: ai_assets_mcp_sources_url_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_mcp_sources_url_idx ON ai_assets_marketplace.mcp_sources USING btree (url);


--
-- Name: ai_assets_prompts_prompt_hash_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_prompts_prompt_hash_idx ON ai_assets_marketplace.prompts USING btree (prompt_hash);


--
-- Name: ai_assets_prompts_source_hash_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_prompts_source_hash_uq ON ai_assets_marketplace.prompts USING btree (source_id, prompt_hash);


--
-- Name: ai_assets_prompts_source_id_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_prompts_source_id_idx ON ai_assets_marketplace.prompts USING btree (source_id);


--
-- Name: ai_assets_skill_marketplace_entries_source_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_skill_marketplace_entries_source_idx ON ai_assets_marketplace.skill_marketplace_entries USING btree (source);


--
-- Name: ai_assets_skill_marketplace_entries_source_url_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_skill_marketplace_entries_source_url_uq ON ai_assets_marketplace.skill_marketplace_entries USING btree (source, entry_url);


--
-- Name: ai_assets_source_links_link_url_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_source_links_link_url_idx ON ai_assets_marketplace.source_links USING btree (link_url);


--
-- Name: ai_assets_source_links_source_id_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_source_links_source_id_idx ON ai_assets_marketplace.source_links USING btree (source_id);


--
-- Name: ai_assets_source_links_source_url_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_source_links_source_url_uq ON ai_assets_marketplace.source_links USING btree (source_id, link_url);


--
-- Name: ai_assets_sources_category_id_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_sources_category_id_idx ON ai_assets_marketplace.sources USING btree (category_id);


--
-- Name: ai_assets_sources_name_url_uq; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE UNIQUE INDEX ai_assets_sources_name_url_uq ON ai_assets_marketplace.sources USING btree (name, url);


--
-- Name: ai_assets_sources_url_idx; Type: INDEX; Schema: ai_assets_marketplace; Owner: postgres
--

CREATE INDEX ai_assets_sources_url_idx ON ai_assets_marketplace.sources USING btree (url);


--
-- Name: code_exec_agent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX code_exec_agent_id_idx ON public.code_execution_usage USING btree (agent_id);


--
-- Name: code_exec_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX code_exec_client_id_idx ON public.code_execution_usage USING btree (client_id);


--
-- Name: code_exec_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX code_exec_created_at_idx ON public.code_execution_usage USING btree (created_at);


--
-- Name: code_exec_language_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX code_exec_language_idx ON public.code_execution_usage USING btree (language);


--
-- Name: code_exec_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX code_exec_status_idx ON public.code_execution_usage USING btree (status);


--
-- Name: code_exec_tier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX code_exec_tier_idx ON public.code_execution_usage USING btree (tier);


--
-- Name: idx_ai_insights_org_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_insights_org_type ON public.ai_insights USING btree (organization_id, insight_type);


--
-- Name: idx_ai_insights_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_insights_severity ON public.ai_insights USING btree (severity);


--
-- Name: idx_business_analytics_org_metric; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_analytics_org_metric ON public.business_analytics USING btree (organization_id, metric_type);


--
-- Name: idx_business_analytics_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_analytics_period ON public.business_analytics USING btree (period_start, period_end);


--
-- Name: idx_business_events_correlation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_events_correlation ON public.business_events USING btree (correlation_id);


--
-- Name: idx_business_events_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_events_created ON public.business_events USING btree (created_at);


--
-- Name: idx_business_events_org_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_events_org_type ON public.business_events USING btree (organization_id, type);


--
-- Name: idx_business_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_events_status ON public.business_events USING btree (processing_status);


--
-- Name: idx_resource_favorites_resource_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resource_favorites_resource_id ON public.resource_favorites USING btree (resource_id);


--
-- Name: idx_resource_favorites_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resource_favorites_user_id ON public.resource_favorites USING btree (user_id);


--
-- Name: idx_resource_shares_from_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resource_shares_from_user_id ON public.resource_shares USING btree (from_user_id);


--
-- Name: idx_resource_shares_resource_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resource_shares_resource_id ON public.resource_shares USING btree (resource_id);


--
-- Name: idx_resource_shares_to_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resource_shares_to_agent_id ON public.resource_shares USING btree (to_agent_id);


--
-- Name: idx_webhook_delivery_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_delivery_status ON public.webhook_delivery_logs USING btree (delivery_status);


--
-- Name: idx_webhook_delivery_webhook_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhook_delivery_webhook_id ON public.webhook_delivery_logs USING btree (webhook_configuration_id);


--
-- Name: idx_workspace_bookmarks_workspace_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workspace_bookmarks_workspace_id ON public.workspace_bookmarks USING btree (workspace_id);


--
-- Name: marketplace_catalog_items_kind_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX marketplace_catalog_items_kind_idx ON public.marketplace_catalog_items USING btree (kind);


--
-- Name: marketplace_catalog_items_publication_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX marketplace_catalog_items_publication_idx ON public.marketplace_catalog_items USING btree (publication_status);


--
-- Name: marketplace_catalog_items_slug_uq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX marketplace_catalog_items_slug_uq ON public.marketplace_catalog_items USING btree (slug);


--
-- Name: marketplace_catalog_items_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX marketplace_catalog_items_updated_at_idx ON public.marketplace_catalog_items USING btree (updated_at);


--
-- Name: resource_favorites_resource_user_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX resource_favorites_resource_user_unique ON public.resource_favorites USING btree (resource_id, user_id);


--
-- Name: tx_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tx_created_at_idx ON public.transactions USING btree (created_at);


--
-- Name: tx_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tx_hash_idx ON public.transactions USING btree (hash);


--
-- Name: tx_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tx_status_idx ON public.transactions USING btree (status);


--
-- Name: tx_wallet_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tx_wallet_id_idx ON public.transactions USING btree (wallet_id);


--
-- Name: workspace_bookmarks_workspace_user_url_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX workspace_bookmarks_workspace_user_url_unique ON public.workspace_bookmarks USING btree (workspace_id, created_by_user_id, url);


--
-- Name: agent_capability_registry agent_capability_registry_registration_id_agent_registrations_i; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_capability_registry
    ADD CONSTRAINT agent_capability_registry_registration_id_agent_registrations_i FOREIGN KEY (registration_id) REFERENCES public.agent_registrations(id) ON DELETE CASCADE;


--
-- Name: agent_directory_entries agent_directory_entries_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_directory_entries
    ADD CONSTRAINT agent_directory_entries_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agent_memories agent_memories_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_memories
    ADD CONSTRAINT agent_memories_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: agent_metadata agent_metadata_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_metadata
    ADD CONSTRAINT agent_metadata_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agent_metrics agent_metrics_registration_id_agent_registrations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_metrics
    ADD CONSTRAINT agent_metrics_registration_id_agent_registrations_id_fk FOREIGN KEY (registration_id) REFERENCES public.agent_registrations(id) ON DELETE CASCADE;


--
-- Name: agent_nfts agent_nfts_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_nfts
    ADD CONSTRAINT agent_nfts_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: agent_onboarding_events agent_onboarding_events_registration_id_agent_registrations_id_; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_onboarding_events
    ADD CONSTRAINT agent_onboarding_events_registration_id_agent_registrations_id_ FOREIGN KEY (registration_id) REFERENCES public.agent_registrations(id) ON DELETE CASCADE;


--
-- Name: agent_prompt_versions agent_prompt_versions_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_prompt_versions
    ADD CONSTRAINT agent_prompt_versions_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agent_registrations agent_registrations_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_registrations
    ADD CONSTRAINT agent_registrations_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: agents agents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ai_insights ai_insights_acknowledged_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_acknowledged_by_id_users_id_fk FOREIGN KEY (acknowledged_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: auth_events auth_events_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_events
    ADD CONSTRAINT auth_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: auth_sessions auth_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: business_events business_events_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_events
    ADD CONSTRAINT business_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_room_participants chat_room_participants_room_id_chat_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_room_participants
    ADD CONSTRAINT chat_room_participants_room_id_chat_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_room_participants chat_room_participants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_room_participants
    ADD CONSTRAINT chat_room_participants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_rooms chat_rooms_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: chats chats_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;


--
-- Name: code_execution_usage code_execution_usage_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.code_execution_usage
    ADD CONSTRAINT code_execution_usage_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: fractional_shares fractional_shares_agent_nft_id_agent_nfts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fractional_shares
    ADD CONSTRAINT fractional_shares_agent_nft_id_agent_nfts_id_fk FOREIGN KEY (agent_nft_id) REFERENCES public.agent_nfts(id) ON DELETE CASCADE;


--
-- Name: jules_configs jules_configs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_configs
    ADD CONSTRAINT jules_configs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: jules_sessions jules_sessions_delegated_by_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_sessions
    ADD CONSTRAINT jules_sessions_delegated_by_agent_id_agents_id_fk FOREIGN KEY (delegated_by_agent_id) REFERENCES public.agents(id);


--
-- Name: jules_sessions jules_sessions_task_id_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_sessions
    ADD CONSTRAINT jules_sessions_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: jules_sessions jules_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_sessions
    ADD CONSTRAINT jules_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: jules_usage_logs jules_usage_logs_session_id_jules_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_usage_logs
    ADD CONSTRAINT jules_usage_logs_session_id_jules_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.jules_sessions(id) ON DELETE CASCADE;


--
-- Name: jules_usage_logs jules_usage_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jules_usage_logs
    ADD CONSTRAINT jules_usage_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: login_attempts login_attempts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_listings marketplace_listings_agent_nft_id_agent_nfts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_agent_nft_id_agent_nfts_id_fk FOREIGN KEY (agent_nft_id) REFERENCES public.agent_nfts(id) ON DELETE CASCADE;


--
-- Name: marketplace_offers marketplace_offers_listing_id_marketplace_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.marketplace_offers
    ADD CONSTRAINT marketplace_offers_listing_id_marketplace_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE;


--
-- Name: messages messages_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: messages messages_chat_id_chats_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_id_chats_id_fk FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: messages messages_room_id_chat_rooms_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_room_id_chat_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: optimization_jobs optimization_jobs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.optimization_jobs
    ADD CONSTRAINT optimization_jobs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pipelines pipelines_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: pipelines pipelines_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: prompt_versions prompt_versions_template_id_prompt_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_template_id_prompt_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.prompt_templates(id) ON DELETE CASCADE;


--
-- Name: read_receipts read_receipts_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.read_receipts
    ADD CONSTRAINT read_receipts_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: read_receipts read_receipts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.read_receipts
    ADD CONSTRAINT read_receipts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resource_allocations resource_allocations_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_allocations
    ADD CONSTRAINT resource_allocations_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: resource_favorites resource_favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_favorites
    ADD CONSTRAINT resource_favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resource_shares resource_shares_from_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_shares
    ADD CONSTRAINT resource_shares_from_user_id_users_id_fk FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: revenue_distributions revenue_distributions_revenue_stream_id_revenue_streams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_distributions
    ADD CONSTRAINT revenue_distributions_revenue_stream_id_revenue_streams_id_fk FOREIGN KEY (revenue_stream_id) REFERENCES public.revenue_streams(id) ON DELETE CASCADE;


--
-- Name: revenue_streams revenue_streams_agent_nft_id_agent_nfts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_streams
    ADD CONSTRAINT revenue_streams_agent_nft_id_agent_nfts_id_fk FOREIGN KEY (agent_nft_id) REFERENCES public.agent_nfts(id) ON DELETE CASCADE;


--
-- Name: sse_subscriptions sse_subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sse_subscriptions
    ADD CONSTRAINT sse_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_executions task_executions_task_id_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_executions
    ADD CONSTRAINT task_executions_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_to_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_agents_id_fk FOREIGN KEY (assigned_to_id) REFERENCES public.agents(id);


--
-- Name: tasks tasks_pipeline_id_pipelines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pipeline_id_pipelines_id_fk FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: tasks tasks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_wallet_id_wallets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_wallets_id_fk FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: webhook_delivery_logs webhook_delivery_logs_event_id_business_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_delivery_logs
    ADD CONSTRAINT webhook_delivery_logs_event_id_business_events_id_fk FOREIGN KEY (event_id) REFERENCES public.business_events(id) ON DELETE SET NULL;


--
-- Name: webhook_delivery_logs webhook_delivery_logs_webhook_configuration_id_webhook_configur; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_delivery_logs
    ADD CONSTRAINT webhook_delivery_logs_webhook_configuration_id_webhook_configur FOREIGN KEY (webhook_configuration_id) REFERENCES public.webhook_configurations(id) ON DELETE CASCADE;


--
-- Name: workflow_executions workflow_executions_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT workflow_executions_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_steps workflow_steps_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: workflow_steps workflow_steps_workflow_id_workflows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_workflow_id_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.workflows(id);


--
-- Name: workflow_templates workflow_templates_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_templates
    ADD CONSTRAINT workflow_templates_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: workflow_topologies workflow_topologies_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_topologies
    ADD CONSTRAINT workflow_topologies_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workflows workflows_agent_id_agents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_agent_id_agents_id_fk FOREIGN KEY (agent_id) REFERENCES public.agents(id);


--
-- Name: workflows workflows_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: workspace_bookmarks workspace_bookmarks_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_bookmarks
    ADD CONSTRAINT workspace_bookmarks_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: workspace_bookmarks workspace_bookmarks_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_bookmarks
    ADD CONSTRAINT workspace_bookmarks_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: workspaces workspaces_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NcRb7sYdb2JJkoIBdyvaAPILyjwClQWRufMMBpf3jAyb7UzJNnEI0KocBfDEoz3

