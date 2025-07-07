import { EventEmitter } from 'events';
import { MCPTool } from './MCPService.js';
/**
 * Agent type enum
 */
export declare enum AgentType {
    LLM = "llm",
    TOOL = "tool",
    HYBRID = "hybrid",
    ANALYSIS = "analysis",
    ORCHESTRATOR = "orchestrator"
}
/**
 * Agent status enum
 */
export declare enum AgentStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    BUSY = "busy",
    ERROR = "error"
}
/**
 * Agent information interface
 */
export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    capabilities: string[];
    tools?: MCPTool[];
    metadata: Record<string, any>;
}
/**
 * Agent registration event
 */
export interface AgentRegistrationEvent {
    agent: Agent;
    timestamp: string;
}
/**
 * Agent registry options
 */
export interface AgentRegistryOptions {
    debug?: boolean;
}
/**
 * Agent Registry Service
 *
 * Provides a centralized registry for agents in the system,
 * enabling discovery and capability querying.
 */
export declare class AgentRegistry extends EventEmitter {
    private agents;
    private debug;
    constructor(options?: AgentRegistryOptions);
    /**
     * Register an agent with the registry
     */
    registerAgent(agent: Agent): Agent;
    /**
     * Update an existing agent's information
     */
    updateAgent(agentId: string, updates: Partial<Agent>): Agent;
    /**
     * Remove an agent from the registry
     */
    removeAgent(agentId: string): boolean;
    /**
     * Get an agent by ID
     */
    getAgent(agentId: string): Agent | undefined;
    /**
     * Get all agents
     */
    getAllAgents(): Agent[];
    /**
     * Find agents by criteria
     */
    findAgents(criteria: Partial<Agent>): Agent[];
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): Agent[];
    /**
     * Update agent status
     */
    updateAgentStatus(agentId: string, status: AgentStatus): Agent;
    /**
     * Register agent capabilities
     */
    registerAgentCapabilities(agentId: string, capabilities: string[]): Agent;
    /**
     * Register agent tools
     */
    registerAgentTools(agentId: string, tools: MCPTool[]): Agent;
    /**
     * Validate agent data
     */
    private validateAgent;
    /**
     * Utility method for logging
     */
    private log;
}
export declare const agentRegistry: AgentRegistry;
