/**
 * Agent Registry
 *
 * Central registry for all integrated AI agents in The New Fuse Framework.
 * Provides discovery, metadata, and capability information for all available agents.
 *
 * @module AgentRegistry
 * @since 2025-10-05
 */
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare enum AgentType {
    CLI_AGENT = "cli_agent",
    API_AGENT = "api_agent",
    SUB_AGENT = "sub_agent",
    PYDANTIC_AGENT = "pydantic_agent",
    MCP_SERVER = "mcp_server"
}
export declare enum AgentStatus {
    AVAILABLE = "available",
    UNAVAILABLE = "unavailable",
    AUTHENTICATION_REQUIRED = "authentication_required",
    NOT_INSTALLED = "not_installed",
    ERROR = "error"
}
export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    category: 'coding' | 'analysis' | 'testing' | 'documentation' | 'deployment' | 'monitoring' | 'communication' | 'other';
}
export interface AgentMetadata {
    id: string;
    name: string;
    displayName: string;
    type: AgentType;
    provider: 'google' | 'anthropic' | 'openai' | 'custom';
    version: string;
    description: string;
    status: AgentStatus;
    capabilities: AgentCapability[];
    protocols: string[];
    requiresAuth: boolean;
    authMethod?: 'oauth' | 'api_key' | 'cli_login';
    cliCommand?: string;
    apiEndpoint?: string;
    documentation?: string;
    icon?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class AgentRegistry {
    private readonly eventEmitter;
    private readonly logger;
    private agents;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Initialize built-in agents
     */
    private initializeBuiltInAgents;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): boolean;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentMetadata | undefined;
    /**
     * Get all agents
     */
    getAllAgents(): AgentMetadata[];
    /**
     * Get agents by type
     */
    getAgentsByType(type: AgentType): AgentMetadata[];
    /**
     * Get agents by provider
     */
    getAgentsByProvider(provider: string): AgentMetadata[];
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capabilityId: string): AgentMetadata[];
    /**
     * Get agents by status
     */
    getAgentsByStatus(status: AgentStatus): AgentMetadata[];
    /**
     * Search agents
     */
    searchAgents(query: string): AgentMetadata[];
    /**
     * Get available agents (status = available)
     */
    getAvailableAgents(): AgentMetadata[];
    /**
     * Get CLI agents
     */
    getCLIAgents(): AgentMetadata[];
    /**
     * Get API agents
     */
    getAPIAgents(): AgentMetadata[];
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): boolean;
    /**
     * Check if agent exists
     */
    hasAgent(agentId: string): boolean;
    /**
     * Get agent count
     */
    getAgentCount(): number;
    /**
     * Get agent statistics
     */
    getStatistics(): {
        total: number;
        byType: Record<AgentType, number>;
        byProvider: Record<string, number>;
        byStatus: Record<AgentStatus, number>;
    };
    /**
     * Export agent registry as JSON
     */
    exportRegistry(): string;
    /**
     * Get agents compatible with a protocol
     */
    getAgentsByProtocol(protocol: string): AgentMetadata[];
}
//# sourceMappingURL=AgentRegistry.d.ts.map