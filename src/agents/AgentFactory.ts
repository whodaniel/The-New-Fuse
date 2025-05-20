import { TaskExecutionAgent } from './TaskExecutionAgent.js';
import { ConfigurationManager } from '../config/A2AConfig.js';

export type AgentType = 'TASK_EXECUTION' | 'DATA_PROCESSING' | 'COORDINATION';

export class AgentFactory {
    private static instance: AgentFactory;
    private config: ConfigurationManager;
    private activeAgents: Map<string, any>;

    private constructor() {
        this.config = ConfigurationManager.getInstance();
        this.activeAgents = new Map();
    }

    static getInstance(): AgentFactory {
        if (!AgentFactory.instance) {
            AgentFactory.instance = new AgentFactory();
        }
        return AgentFactory.instance;
    }

    async createAgent(type: AgentType, id: string): Promise<any> {
        if (this.activeAgents.has(id)) {
            return this.activeAgents.get(id);
        }

        let agent;
        switch (type) {
            case 'TASK_EXECUTION':
                agent = new TaskExecutionAgent();
                break;
            // Additional agent types can be added here
            default:
                throw new Error(`Unknown agent type: ${type}`);
        }

        await agent.initialize();
        this.activeAgents.set(id, agent);
        return agent;
    }

    async terminateAgent(id: string): Promise<void> {
        const agent = this.activeAgents.get(id);
        if (agent) {
            await agent.terminate?.();
            this.activeAgents.delete(id);
        }
    }

    getActiveAgents(): string[] {
        return Array.from(this.activeAgents.keys());
    }
}