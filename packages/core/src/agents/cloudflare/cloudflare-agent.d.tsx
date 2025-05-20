import { Agent } from 'agents';
import { ExtendedAgentConfig } from '../../types/agent.js';
export declare class NewFuseAgent extends Agent {
    private config;
    private redisService;
    constructor(config: ExtendedAgentConfig);
    initialize(): Promise<void>;
    private setupRedisSubscriptions;
    private handleRedisMessage;
    private handleTask;
    private executeTask;
}
