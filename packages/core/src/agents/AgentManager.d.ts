import { Agent, ExtendedAgentConfig } from '../types/agent.d';
import { AgentProcessor } from '../agent/AgentProcessor';
import { AgentCommunicationManager } from './AgentCommunicationManager';
export declare enum AgentStatus {
    INITIALIZING = "initializing",
    READY = "ready",
    BUSY = "busy",
    ERROR = "error",
    STOPPED = "stopped"
}
export declare class AgentManager {
    private readonly agentProcessor;
    private readonly communicationManager;
    private readonly logger;
    private readonly agents;
    constructor(agentProcessor: AgentProcessor, communicationManager: AgentCommunicationManager);
    createAgent(config: ExtendedAgentConfig): Promise<Agent>;
    getAgent(agentId: string): Promise<Agent | undefined>;
    getAllAgents(): Promise<Agent[]>;
    updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent>;
    deleteAgent(agentId: string): Promise<boolean>;
    startAgent(agentId: string): Promise<void>;
    stopAgent(agentId: string): Promise<void>;
}
//# sourceMappingURL=AgentManager.d.ts.map