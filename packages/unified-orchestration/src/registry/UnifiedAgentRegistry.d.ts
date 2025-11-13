/**
 * Unified Agent Registry for The New Fuse Framework
 *
 * This registry consolidates all agent types from CLI, Workflow, Sync, and Custom agents
 * into a single, unified system while maintaining backward compatibility and enabling
 * advanced orchestration capabilities.
 */
import { EventEmitter } from 'events';
export type AgentRegistryEvents = 'agent_registered' | 'agent_deregistered' | 'agent_status_changed' | 'registry_initialized';
export interface AgentRegistrationOptions {
    overwrite?: boolean;
    source?: string;
}
export interface AgentQueryOptions {
    status?: AgentStatus;
    capability?: AgentCapability;
    type?: AgentType;
}
import { UnifiedAgent, AgentType, AgentStatus, AgentCapability, AgentSelectionCriteria, AgentSelectionResult, AgentExecutionRequest, AgentExecutionResult, AgentRegistryConfig } from '../types/UnifiedAgentTypes';
export declare class UnifiedAgentRegistry extends EventEmitter {
    private agents;
    private capabilities;
    private agentsByType;
    private agentsByStatus;
    private healthChecks;
    private metricsCache;
    private cliOrchestrator?;
    private syncOrchestrator?;
    private workflowEngine?;
    private config;
    private isInitialized;
    constructor(config?: Partial<AgentRegistryConfig>);
    /**
     * Initialize the registry and integrate with existing systems
     */
    initialize(): Promise<void>;
    /**
     * Deregister an agent from the registry
     */
    deregisterAgent(agentId: string): Promise<boolean>;
    /**
     * Find optimal agent for given criteria
     */
    selectOptimalAgent(criteria: AgentSelectionCriteria): Promise<AgentSelectionResult | null>;
    /**
     * Execute task using optimal agent selection
     */
    executeTask(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
    /**
     * Get all registered agents
     */
    getAllAgents(): UnifiedAgent[];
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): UnifiedAgent | null;
    /**
     * Get agents by type
     */
    getAgentsByType(type: AgentType): UnifiedAgent[];
    /**
     * Get agents by capability
     */
    getAgentsByCapability(capability: AgentCapability): UnifiedAgent[];
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): Promise<boolean>;
    /**
     * Get registry statistics
     */
    getRegistryStats(): {
        totalAgents: number;
        agentsByType: Record<AgentType, number>;
        agentsByStatus: Record<AgentStatus, number>;
        totalCapabilities: number;
        healthyAgents: number;
        busyAgents: number;
        offlineAgents: number;
    };
    private initializeLegacyIntegrations;
    private integrateCLIAgents;
    private executeWorkflowAgentTask;
    private executeSyncAgentTask;
    private executeCustomAgentTask;
    private executeFederationAgentTask;
    private updateAgentIndices;
    private removeFromAgentIndices;
    private initializeMetrics;
    private updateAgentMetrics;
    private getDefaultConfiguration;
}
//# sourceMappingURL=UnifiedAgentRegistry.d.ts.map