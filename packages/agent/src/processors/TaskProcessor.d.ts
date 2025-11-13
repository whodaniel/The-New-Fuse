import { BaseProcessor } from './BaseProcessor';
import { Logger } from '@nestjs/common';
import { Task, UUID } from '@the-new-fuse/types';
import { AlertService } from '../services/AlertService';
import { RedisService } from '../services/RedisService';
/**
 * Processes incoming task assignment messages and executes the tasks.
 */
export declare class TaskProcessor extends BaseProcessor {
    protected logger: Logger;
    private alertService;
    private redisService;
    private agentId;
    private activeTasks;
    constructor(agentId: UUID, alertService: AlertService, redisService: RedisService);
    const task: Task;
    if(: any, task: any, id: any): any;
}
//# sourceMappingURL=TaskProcessor.d.ts.map