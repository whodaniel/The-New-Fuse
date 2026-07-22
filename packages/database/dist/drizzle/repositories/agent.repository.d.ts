import type { Agent, AgentMetadata, NewAgent, NewAgentMetadata } from '../types/index.js';
/**
 * Agent Repository - provides data access for Agent entities
 *
 * This repository abstracts the database access layer, allowing for
 * easy migration from Drizzle to Drizzle without changing service code.
 */
export declare class DrizzleAgentRepository {
    /**
     * Create a new agent
     */
    create(data: Omit<NewAgent, 'id'> & {
        id?: string;
    }): Promise<Agent>;
    /**
     * Find agent by ID (Safe: Requires userId)
     */
    findById(id: string, userId?: string): Promise<Agent | null>;
    /**
     * Find agent by ID (System: internal use only, ignores userId)
     */
    findByIdSystem(id: string): Promise<Agent | null>;
    /**
     * Find agent by ID with metadata
     */
    findByIdWithMetadata(id: string, userId: string): Promise<(Agent & {
        metadata: AgentMetadata | null;
    }) | null>;
    /**
     * Fetch metadata rows for a batch of agents
     */
    findMetadataByAgentIds(agentIds: string[]): Promise<AgentMetadata[]>;
    /**
     * Find all agents for a user
     */
    findByUserId(userId: string): Promise<Agent[]>;
    /**
     * Find all active agents
     */
    findActive(userId: string): Promise<Agent[]>;
    /**
     * Find all agents (with optional limit)
     */
    findAll(userId: string, limit?: number): Promise<Agent[]>;
    /**
     * Find all agents (System: no userId filter)
     */
    findAllSystem(page?: number, limit?: number): Promise<{
        data: Agent[];
        total: number;
    }>;
    /**
     * Update an agent
     */
    update(id: string, userIdOrData: string | Partial<NewAgent>, dataArg?: Partial<NewAgent>): Promise<Agent | null>;
    /**
     * Soft delete an agent
     */
    softDelete(id: string, userId?: string): Promise<boolean>;
    /**
     * Hard delete an agent (use with caution)
     */
    hardDelete(id: string, userId?: string): Promise<boolean>;
    /**
     * Search agents by name or description
     */
    search(query: string, userId?: string): Promise<Agent[]>;
    /**
     * Count agents by status
     */
    countByStatus(): Promise<{
        status: string;
        count: number;
    }[]>;
    /**
     * Count total active agents across the system
     */
    countActive(): Promise<number>;
    /**
     * Create or update agent metadata
     */
    upsertMetadata(agentId: string, data: Partial<NewAgentMetadata>): Promise<AgentMetadata>;
    /**
     * Create agent registration
     */
    createRegistration(data: {
        agentId: string;
        authToken: string;
        registrationData: any;
        verificationStatus: string;
        onboardingStatus: string;
        onboardingProgress: number;
        heartbeatInterval: number;
        isOnline: boolean;
        metadata: any;
    }): Promise<{
        authToken: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        agentId: string;
        metadata: unknown;
        encryptedAuthToken: string;
        registrationData: unknown;
        verificationStatus: string;
        onboardingStatus: string;
        onboardingProgress: number;
        heartbeatInterval: number;
        isOnline: boolean;
        lastHeartbeat: Date | null;
    }>;
    /**
     * Find registration by auth token
     */
    findRegistrationByToken(token: string): Promise<{
        id: string;
        agentId: string;
        encryptedAuthToken: string;
        registrationData: unknown;
        verificationStatus: string;
        onboardingStatus: string;
        onboardingProgress: number;
        heartbeatInterval: number;
        isOnline: boolean;
        lastHeartbeat: Date | null;
        metadata: unknown;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Find registration by ID
     */
    findRegistrationById(id: string, userId?: string): Promise<{
        id: string;
        agentId: string;
        encryptedAuthToken: string;
        registrationData: unknown;
        verificationStatus: string;
        onboardingStatus: string;
        onboardingProgress: number;
        heartbeatInterval: number;
        isOnline: boolean;
        lastHeartbeat: Date | null;
        metadata: unknown;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    /**
     * Update registration heartbeat
     */
    updateRegistrationHeartbeat(registrationId: string): Promise<void>;
    /**
     * Create capability registry entry
     */
    createCapability(data: {
        registrationId: string;
        capabilityName: string;
        capabilityType: string;
        version: string;
        description?: string;
        parameters?: any;
        verificationStatus: string;
    }): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        version: string;
        verificationStatus: string;
        registrationId: string;
        capabilityName: string;
        capabilityType: string;
        parameters: unknown;
    }>;
    /**
     * Create onboarding event
     */
    createOnboardingEvent(data: {
        registrationId: string;
        eventType: string;
        message: string;
        eventData?: any;
    }): Promise<{
        id: string;
        timestamp: Date;
        registrationId: string;
        eventType: string;
        message: string;
        eventData: unknown;
    }>;
    /**
     * Create directory entry
     */
    createDirectoryEntry(data: {
        agentId: string;
        displayName: string;
        description?: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        isVerified: boolean;
        rating: number;
        usageCount: number;
        searchableData?: string;
    }): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        agentId: string;
        displayName: string;
        category: string;
        tags: string[];
        isPublic: boolean;
        isVerified: boolean;
        featured: boolean;
        rating: number;
        usageCount: number;
        lastActiveAt: Date | null;
        searchableData: string | null;
    }>;
    /**
     * Find registration with related data
     */
    findRegistrationWithDetails(registrationId: string, userId: string): Promise<{
        agent: {
            id: string;
            name: string;
            type: "BASIC" | "CHAT" | "WORKFLOW" | "TASK" | "ASSISTANT" | "ANALYSIS" | "CONVERSATIONAL" | "IDE_EXTENSION" | "API" | "ORCHESTRATOR" | "BROKER" | "MONITOR" | "VALIDATOR" | "ROUTER" | "SCHEDULER" | "GATEWAY" | "CLI_CODER" | "CLI_DEBUGGER" | "CLI_DEVOPS" | "CLI_DATABASE" | "CLI_GIT" | "CLI_SHELL" | "CLI_KILO" | "CLI_OPENCODE" | "CLI_PI" | "API_CLAUDE_CODE" | "IDE_VSCODE" | "IDE_CURSOR" | "IDE_WINDSURF" | "IDE_JETBRAINS" | "IDE_NEOVIM" | "IDE_EMACS" | "BROWSER_GEMINI" | "BROWSER_CLAUDE" | "BROWSER_CHATGPT" | "BROWSER_COPILOT" | "BROWSER_PERPLEXITY" | "BROWSER_PHIND" | "GITHUB_JULES" | "GITHUB_COPILOT" | "GITHUB_ACTIONS" | "GITHUB_CODESPACES" | "CODE_GENERATOR" | "CODE_REVIEWER" | "CODE_REFACTORER" | "CODE_DOCUMENTER" | "CODE_TESTER" | "CODE_ARCHITECT" | "CODE_OPTIMIZER" | "CODE_SECURITY" | "CODE_MIGRATOR" | "CODE_TRANSLATOR" | "DATA_ANALYST" | "DATA_ENGINEER" | "DATA_SCIENTIST" | "DATA_VISUALIZER" | "DATA_CLEANER" | "DATA_VALIDATOR" | "INFRA_DEVOPS" | "INFRA_CLOUD" | "INFRA_KUBERNETES" | "INFRA_DOCKER" | "INFRA_TERRAFORM" | "INFRA_MONITORING" | "DOC_WRITER" | "DOC_API" | "DOC_README" | "DOC_CHANGELOG" | "DOC_TUTORIAL" | "TEST_UNIT" | "TEST_INTEGRATION" | "TEST_E2E" | "TEST_PERFORMANCE" | "TEST_SECURITY" | "TEST_ACCESSIBILITY" | "AI_TRAINER" | "AI_EVALUATOR" | "AI_PROMPT_ENGINEER" | "AI_RAG" | "AI_EMBEDDINGS" | "AI_FINE_TUNER" | "COMM_TRANSLATOR" | "COMM_SUMMARIZER" | "COMM_WRITER" | "COMM_EMAIL" | "COMM_SLACK" | "COMM_DISCORD" | "RESEARCH_WEB" | "RESEARCH_ACADEMIC" | "RESEARCH_MARKET" | "RESEARCH_COMPETITOR" | "DOMAIN_LEGAL" | "DOMAIN_FINANCE" | "DOMAIN_HEALTHCARE" | "DOMAIN_EDUCATION" | "DOMAIN_ECOMMERCE" | "DOMAIN_GAMING" | "TNF_CORE" | "TNF_ONBOARDING" | "TNF_COORDINATOR" | "TNF_HANDOFF" | "TNF_HEARTBEAT" | "TNF_CLEANUP";
            status: "ACTIVE" | "INACTIVE" | "IDLE" | "BUSY" | "ERROR" | "OFFLINE" | "INITIALIZING" | "READY" | "TERMINATED";
            description: string | null;
            systemPrompt: string | null;
            config: unknown;
            capabilities: string[];
            provider: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            profile: {
                about?: string;
                personality?: string;
                avatar?: string;
                emoji?: string;
                tags?: string[];
                creator?: string;
                version?: string;
                lastUpdated?: string;
            } | null;
            workerAction: "conversational" | "assistant" | "analysis" | "code_generation" | "code_review" | "code_refactor" | "code_test" | "code_debug" | "code_architect" | "code_optimizer" | "code_security" | "code_migration" | "code_documentation" | "orchestrator" | "broker" | "router" | "monitor" | "validator" | "scheduler" | "gateway" | "director" | "coordinator" | "handoff" | "cleanup" | "workflow" | "task" | "cli_coder" | "cli_debugger" | "cli_devops" | "cli_database" | "cli_git" | "cli_shell" | "cli_research" | "cli_qa" | "research_web" | "research_academic" | "research_market" | "data_analyst" | "data_engineer" | "data_scientist" | "infra_devops" | "infra_cloud" | "infra_kubernetes" | "infra_docker" | "infra_terraform" | "infra_monitoring" | "comm_translator" | "comm_summarizer" | "comm_writer" | "comm_email" | "comm_slack" | "comm_discord" | "tnf_core" | "tnf_onboarding" | "tnf_heartbeat" | "basic" | "unknown" | null;
            daccRole: "orchestrator" | "broker" | "director" | "worker" | "participant";
            canonicalEntityId: string | null;
            idNumber: string | null;
            federation: {
                kind?: "agent" | "vector" | "session" | "unknown";
                canonicalEntityId: string | null;
                idNumber: string | null;
                mcid: string | null;
                scopes: string[];
                vector_id_prefix?: "ID#" | "VEC#";
            };
            fulfillment: {
                vendor?: string;
                model?: string;
                transport?: "stdio" | "http" | "websocket" | "browser-extension" | "ide" | "cli" | "unknown";
                protocol_version?: string;
                prompt_doc_uri?: string;
                tools?: string[];
                endpoint?: string;
                raw?: Record<string, unknown>;
            };
            traits: {
                observability?: "native" | "mirrored" | "opaque";
                subAgent_capable?: boolean;
                orchestrates_agents?: boolean;
                persona_source?: "self" | "tnf" | "platform" | "fixed";
                autonomy_level?: "supervised" | "semiautonomous" | "autonomous";
                description?: string;
                raw?: Record<string, unknown>;
            };
            fulfillmentUpdatedAt: Date | null;
        } | null;
        capabilities: {
            id: string;
            registrationId: string;
            capabilityName: string;
            capabilityType: string;
            version: string;
            description: string | null;
            parameters: unknown;
            verificationStatus: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        onboardingEvents: {
            id: string;
            registrationId: string;
            eventType: string;
            message: string;
            eventData: unknown;
            timestamp: Date;
        }[];
        id: string;
        agentId: string;
        encryptedAuthToken: string;
        registrationData: unknown;
        verificationStatus: string;
        onboardingStatus: string;
        onboardingProgress: number;
        heartbeatInterval: number;
        isOnline: boolean;
        lastHeartbeat: Date | null;
        metadata: unknown;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    /**
     * Count total agents
     */
    count(): Promise<number>;
    /**
     * Verify if a list of capabilities exist in the registry
     */
    verifyCapabilities(capabilityNames: string[]): Promise<string[]>;
    findByStatus(status: string, userId?: string): Promise<Agent[]>;
    findByNameAndUserId(name: string, userId: string): Promise<Agent | null>;
    findWithPagination(userId: string, page?: number, limit?: number): Promise<{
        data: Agent[];
        total: number;
    }>;
    findByCapability(capability: string, userId: string): Promise<Agent[]>;
    findByStatusAndUserId(status: string, userId: string): Promise<Agent[]>;
    updateStatus(id: string, status: string, userId?: string): Promise<Agent | null>;
    searchAgents(userId: string, filters?: {
        name?: string;
        type?: string;
        status?: string;
        capability?: string;
    }): Promise<Agent[]>;
}
export declare const drizzleAgentRepository: DrizzleAgentRepository;
//# sourceMappingURL=agent.repository.d.ts.map