import { Agent, AgentState } from '../types/agent.d';
export declare class AgentProcessor {
    private readonly logger;
    processAgent(agent: Agent): Promise<{
        success: boolean;
        message: string;
        result?: unknown;
    }>;
    updateAgentStatus(id: string, status: AgentState['status']): Promise<void>;
    private validateAgentConfig;
    private executeAgentTasks;
}
//# sourceMappingURL=AgentProcessor.d.ts.map