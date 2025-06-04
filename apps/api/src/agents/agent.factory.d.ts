import { ConfigService } from '@nestjs/config';
export interface AgentInstance {
    id: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    config: Record<string, any>;
}
export declare class AgentFactory {
    private configService;
    private activeAgents;
    constructor(configService: ConfigService);
    createAgent(type: string, agentId: string, config: Record<string, any>): Promise<AgentInstance>;
    updateAgent(instanceId: string, config: Record<string, any>): Promise<void>;
    destroyAgent(instanceId: string): Promise<void>;
    getDefaultConfig(type: string): Record<string, any>;
    getActiveAgents(): AgentInstance[];
    getAgent(agentId: string): AgentInstance | undefined;
}
