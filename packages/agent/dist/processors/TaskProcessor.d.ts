import { BaseProcessor } from './BaseProcessor';
import { Logger } from '../types/core';
import { Message, Task, CoreTaskResult as TaskResult, UUID } from '@the-new-fuse/types';
import { AlertService } from '../services/AlertService';
import { RedisService } from '../services/RedisService';
import { MessageValidator } from '../services/MessageValidator';
import { InterAgentChatService } from '../services/InterAgentChatService';
/**
 * Processes incoming task assignment messages and executes the tasks.
 */
export declare class TaskProcessor extends BaseProcessor {
    protected logger: Logger;
    private alertService;
    private redisService;
    private messageValidator;
    private chatService;
    private agentId;
    activeTasks: Map<UUID, Task>;
    private cancelledTasks;
    constructor(agentId: UUID, alertService: AlertService, redisService: RedisService, messageValidator: MessageValidator, chatService: InterAgentChatService);
    private loadUnfinishedTasks;
    process(message: Message): Promise<TaskResult | null>;
    private updateTaskStatus;
    cancelTask(taskId: UUID): Promise<boolean>;
}
//# sourceMappingURL=TaskProcessor.d.ts.map