import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
export type TaskStatusType = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'scheduled' | 'in_progress';
export interface Task {
    id: string;
    status: TaskStatusType;
    type: string;
    data: any;
    params?: Record<string, any>;
    config?: Record<string, any>;
    result?: any;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class TaskExecutor extends EventEmitter {
    private configService;
    private redisService;
    private readonly logger;
    constructor(configService: ConfigService, redisService: UnifiedRedisService);
    executeTask(task: Task): Promise<any>;
}
//# sourceMappingURL=TaskExecutor.d.ts.map