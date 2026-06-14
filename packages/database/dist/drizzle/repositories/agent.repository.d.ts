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
        metadata: unknown;
        agentId: string;
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
        registrationId: string;
        eventType: string;
        message: string;
        eventData: unknown;
        timestamp: Date;
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
        tags: string[];
        isPublic: boolean;
        agentId: string;
        displayName: string;
        category: string;
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
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            status: "ACTIVE" | "INACTIVE" | "IDLE" | "BUSY" | "ERROR" | "OFFLINE" | "INITIALIZING" | "READY" | "TERMINATED";
            userId: string;
            type: "BASIC" | "CHAT" | "WORKFLOW" | "TASK" | "ASSISTANT" | "ANALYSIS" | "CONVERSATIONAL" | "IDE_EXTENSION" | "API" | "ORCHESTRATOR" | "BROKER" | "MONITOR" | "VALIDATOR" | "ROUTER" | "SCHEDULER" | "GATEWAY" | "CLI_CODER" | "CLI_DEBUGGER" | "CLI_DEVOPS" | "CLI_DATABASE" | "CLI_GIT" | "CLI_SHELL" | "IDE_VSCODE" | "IDE_CURSOR" | "IDE_WINDSURF" | "IDE_JETBRAINS" | "IDE_NEOVIM" | "IDE_EMACS" | "BROWSER_GEMINI" | "BROWSER_CLAUDE" | "BROWSER_CHATGPT" | "BROWSER_COPILOT" | "BROWSER_PERPLEXITY" | "BROWSER_PHIND" | "GITHUB_JULES" | "GITHUB_COPILOT" | "GITHUB_ACTIONS" | "GITHUB_CODESPACES" | "CODE_GENERATOR" | "CODE_REVIEWER" | "CODE_REFACTORER" | "CODE_DOCUMENTER" | "CODE_TESTER" | "CODE_ARCHITECT" | "CODE_OPTIMIZER" | "CODE_SECURITY" | "CODE_MIGRATOR" | "CODE_TRANSLATOR" | "DATA_ANALYST" | "DATA_ENGINEER" | "DATA_SCIENTIST" | "DATA_VISUALIZER" | "DATA_CLEANER" | "DATA_VALIDATOR" | "INFRA_DEVOPS" | "INFRA_CLOUD" | "INFRA_KUBERNETES" | "INFRA_DOCKER" | "INFRA_TERRAFORM" | "INFRA_MONITORING" | "DOC_WRITER" | "DOC_API" | "DOC_README" | "DOC_CHANGELOG" | "DOC_TUTORIAL" | "TEST_UNIT" | "TEST_INTEGRATION" | "TEST_E2E" | "TEST_PERFORMANCE" | "TEST_SECURITY" | "TEST_ACCESSIBILITY" | "AI_TRAINER" | "AI_EVALUATOR" | "AI_PROMPT_ENGINEER" | "AI_RAG" | "AI_EMBEDDINGS" | "AI_FINE_TUNER" | "COMM_TRANSLATOR" | "COMM_SUMMARIZER" | "COMM_WRITER" | "COMM_EMAIL" | "COMM_SLACK" | "COMM_DISCORD" | "RESEARCH_WEB" | "RESEARCH_ACADEMIC" | "RESEARCH_MARKET" | "RESEARCH_COMPETITOR" | "DOMAIN_LEGAL" | "DOMAIN_FINANCE" | "DOMAIN_HEALTHCARE" | "DOMAIN_EDUCATION" | "DOMAIN_ECOMMERCE" | "DOMAIN_GAMING" | "TNF_CORE" | "TNF_ONBOARDING" | "TNF_COORDINATOR" | "TNF_HANDOFF" | "TNF_HEARTBEAT" | "TNF_CLEANUP";
            systemPrompt: string | null;
            config: unknown;
            capabilities: string[];
            provider: string;
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