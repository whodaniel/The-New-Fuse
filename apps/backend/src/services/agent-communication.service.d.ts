import { RedisService } from './redis.service';
import { AgentMessage } from '@the-new-fuse/types';
export declare class AgentCommunicationService {
    private readonly redis;
    constructor(redis: RedisService);
    broadcastMessage(message: AgentMessage): Promise<void>;
    createDirectChannel(agentId: string, callback?: (message: string) => void): Promise<string>;
    sendDirectMessage(targetAgent: string, message: AgentMessage): Promise<void>;
}
//# sourceMappingURL=agent-communication.service.d.ts.map