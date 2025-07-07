import { Agent, ExtendedAgentConfig } from '../types/agent.d';
import { AgentManager } from './AgentManager';
import { AgentProcessor } from '../agent/AgentProcessor';
export declare class AgentSystem {
    private readonly agentManager;
    private readonly agentProcessor;
    private readonly logger;
    private readonly redis;
    private initialized;
    constructor(agentManager: AgentManager, agentProcessor: AgentProcessor);
    private initialize;
    createAgent(config: ExtendedAgentConfig): Promise<Agent>;
    getAgent(agentId: string): Promise<Agent | null>;
    deleteAgent(agentId: string): Promise<boolean>;
    listAgents(): Promise<Agent[]>;
    processAgent(agentId: string): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=AgentSystem.d.ts.map