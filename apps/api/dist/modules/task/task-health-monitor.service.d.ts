import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TaskService } from './task.service';
export declare class TaskHealthMonitorService implements OnModuleInit, OnModuleDestroy {
    private readonly taskService;
    private readonly logger;
    private timer;
    constructor(taskService: TaskService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private scanForStuckTasks;
    private getIntervalMs;
}
//# sourceMappingURL=task-health-monitor.service.d.ts.map