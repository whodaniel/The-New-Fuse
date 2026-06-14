import { TaskService } from './TaskService.js';
export declare class TaskScheduler {
    private readonly taskService;
    private readonly logger;
    constructor(taskService: TaskService);
    handleCron(): Promise<void>;
}
//# sourceMappingURL=TaskScheduler.d.ts.map