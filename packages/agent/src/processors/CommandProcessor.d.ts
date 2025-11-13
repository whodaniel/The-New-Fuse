import { BaseProcessor } from './BaseProcessor';
import { Logger } from '@nestjs/common';
import { UUID } from '@the-new-fuse/types';
import { InterAgentChatService } from '../services/InterAgentChatService';
import { RedisService } from '../services/RedisService';
/**
 * Processes incoming command messages for an agent.
 */
export declare class CommandProcessor extends BaseProcessor {
    protected logger: Logger;
    private commandHandlers;
    private chatService;
    private redisService;
    private agentId;
    constructor(agentId: UUID, chatService: InterAgentChatService, redisService: RedisService);
}
//# sourceMappingURL=CommandProcessor.d.ts.map