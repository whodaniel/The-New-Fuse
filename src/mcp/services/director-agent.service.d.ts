import { MCPBrokerService } from './mcp-broker.service.tsx';
/**
 * Task interface for Director Agent
 */
export interface DirectorTask {
    id: string;
    type: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high';
    description: string;
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
    metadata?: Record<string, any>;
}
/**
 * Director Agent Service
 *
 * Main agent that coordinates all MCP operations and sub-agents.
 * Acts as the central orchestrator for all AI tasks.
 */
export declare class DirectorAgentService {
    private readonly mcpBroker;
    private readonly logger;
    private readonly tasks;
    private readonly agents;
    constructor(mcpBroker: MCPBrokerService);
    /**
     * Handle command message
     */
    private handleCommand;
    /**
     * Handle response message
     */
    private handleResponse;
    /**
     * Handle error message
     */
    private handleError;
    /**
     * Process task
     */
    private processTask;
    /**
     * Assign task to appropriate agent
     */
    private assignTaskToAgent;
    /**
     * Register a new agent
     */
    registerAgent(agentId: string, capabilities: string[]): void;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): void;
    /**
     * Get all tasks
     */
    getTasks(filter?: {
        status?: string;
        assignedTo?: string;
    }): DirectorTask[];
    /**
     * Get task by ID
     */
    getTask(taskId: string): DirectorTask | undefined;
    /**
     * Create a new task
     */
    createTask(type: string, description: string, params?: Record<string, any>, options?: {
        priority?: 'low' | 'medium' | 'high';
        metadata?: Record<string, any>;
    }): Promise<DirectorTask>;
}
//# sourceMappingURL=director-agent.service.d.ts.map