import { LoggingService } from '../services/LoggingService';
export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'idle' | 'active' | 'busy' | 'error';
    capabilities: string[];
    metadata?: Record<string, any>;
}
export interface AgentTask {
    id: string;
    agentId: string;
    type: string;
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}
export declare class AgentSystem {
    private readonly logger;
    private agents;
    private tasks;
    constructor(logger: LoggingService);
    /**
     * Register a new agent in the system
     */
    registerAgent(agent: Agent): Promise<void>;
}
//# sourceMappingURL=AgentSystem.d.ts.map