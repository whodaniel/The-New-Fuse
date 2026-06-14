import { BaseProcessor } from './BaseProcessor';
import { Logger } from '../types/core';
import { Command, CommandResult, Message, UUID } from '@the-new-fuse/types';
import { InterAgentChatService } from '../services/InterAgentChatService';
import { RedisService } from '../services/RedisService';
import { MessageValidator } from '../services/MessageValidator';
import { TaskProcessor } from './TaskProcessor';
/**
 * Interface for command handlers.
 */
interface CommandHandler {
    (command: Command, agentId: UUID): Promise<CommandResult>;
}
/**
 * Processes incoming command messages for an agent.
 */
export declare class CommandProcessor extends BaseProcessor {
    protected logger: Logger;
    private commandHandlers;
    private chatService;
    private redisService;
    private messageValidator;
    private taskProcessor;
    private agentId;
    constructor(agentId: UUID, chatService: InterAgentChatService, redisService: RedisService, messageValidator: MessageValidator, taskProcessor: TaskProcessor);
    registerCommandHandler(commandType: string, handler: CommandHandler): void;
    process(message: Message): Promise<CommandResult | null>;
    private handlePing;
    private handleGetStatus;
    private handleCancelTask;
}
export {};
//# sourceMappingURL=CommandProcessor.d.ts.map