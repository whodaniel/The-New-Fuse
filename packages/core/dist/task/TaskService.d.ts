import { Task } from './TaskTypes.js';
export declare class TaskService {
    private readonly logger;
    private tasks;
    constructor();
    createTask(taskData: Partial<Task>): Promise<Task>;
    getTask(taskId: string): Promise<Task | undefined>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<Task | undefined>;
    deleteTask(taskId: string): Promise<boolean>;
}
//# sourceMappingURL=TaskService.d.ts.map