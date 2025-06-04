import { RedisService } from './redis.service.js';
export declare class AgentCommunicationService {
    private readonly redis;
    constructor(redis: RedisService);
    broadcastMessage(message: AgentMessage): Promise<void>;
    createDirectChannel(agentId: string): Promise<string>;
    sendDirectMessage(targetAgent: string, message: AgentMessage): Promise<void>;
}
