import { AgentSystem } from './AgentSystem';
import { AgentCommunicationManager } from './AgentCommunicationManager';
import { LoggingService } from '../services/LoggingService';
export interface AgentManagerConfig {
    maxAgents?: number;
    taskTimeout?: number;
    healthCheckInterval?: number;
}
export declare class AgentManager {
    private readonly agentSystem;
    private readonly communicationManager;
    private readonly logger;
    private config;
    private healthCheckTimer?;
    constructor(agentSystem: AgentSystem, communicationManager: AgentCommunicationManager, logger: LoggingService);
    /**
     * Initialize the agent manager
     */
    initialize(config?: Partial<AgentManagerConfig>): Promise<void>;
    /**
     * Create and register a new agent
     */
    createAgent(name: string, type: string, capabilities: string[], metadata?: Record<string, any>): Promise<string>;
    /**
     * Assign task to specific agent
     */
    assignTaskToAgent(agentId: string, taskType: string, payload: any, metadata?: Record<string, any>): Promise<string>;
}
//# sourceMappingURL=AgentManager.d.ts.map