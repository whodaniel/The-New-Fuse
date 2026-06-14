/**
 * Agent Service - Drizzle ORM Implementation
 *
 * This service provides business logic for Agent operations.
 * It uses the Drizzle-based AgentRepository for data access.
 */
import { AgentCapability } from '@the-new-fuse/types';
import { AgentRepository, type Agent, type NewAgent } from '../repositories/agent.repository.js';
export declare class LocalAIDetectionService {
    detectAndCreateAgents(_userId: string): Promise<any[]>;
    getAvailableProviders(): Promise<any[]>;
}
export declare class AgentService {
    private readonly agentRepository;
    private readonly localAIDetectionService;
    private readonly logger;
    constructor(agentRepository: AgentRepository, localAIDetectionService: LocalAIDetectionService);
    /**
     * Handle errors consistently
     */
    private handleError;
    private normalizeStatus;
    private extractConfig;
    private extractProfile;
    /**
     * Get all agents for a user
     */
    getAgents(userId: string): Promise<Agent[]>;
    /**
     * Get all agents (for admin/monitoring use)
     */
    findAll(): Promise<Agent[]>;
    /**
     * Get agent by ID for a specific user
     */
    getAgentById(id: string, userId: string): Promise<Agent | null>;
    /**
     * Create a new agent for a user
     */
    createAgent(data: Partial<NewAgent>, userId: string): Promise<Agent>;
    /**
     * Update an agent for a user
     */
    updateAgent(id: string, data: Partial<NewAgent>, userId: string): Promise<Agent>;
    /**
     * Delete an agent for a user
     */
    deleteAgent(id: string, userId: string): Promise<boolean>;
    /**
     * Get agents by capability for a user
     */
    getAgentsByCapability(capability: AgentCapability, userId: string): Promise<Agent[]>;
    /**
     * Detect and register local AI providers as agents
     */
    detectAndRegisterLocalAIs(userId: string): Promise<Agent[]>;
    /**
     * Get all local AI agents for a user
     */
    getLocalAIAgents(userId: string): Promise<Agent[]>;
    /**
     * Refresh local AI detection and update agents
     */
    refreshLocalAIAgents(userId: string): Promise<Agent[]>;
    /**
     * Create default system agents for all detected local AIs
     */
    createSystemLocalAIAgents(): Promise<Agent[]>;
    /**
     * Start an agent (Set status to active)
     */
    startAgent(id: string, userId: string): Promise<Agent>;
    /**
     * Stop an agent (Set status to inactive)
     */
    stopAgent(id: string, userId: string): Promise<Agent>;
}
//# sourceMappingURL=agent.service.d.ts.map