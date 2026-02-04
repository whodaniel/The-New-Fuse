import { DatabaseService } from '../database/database.service.tsx';
import { Task, TaskStatus, TaskPriority, CreateTaskDto } from "@the-new-fuse/types";
export declare class TaskService {
    private readonly db;
    constructor(db: DatabaseService);
    findStuckTasks(): Promise<Task[]>;
    updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
    findTaskById(taskId: string): Promise<Task | null>;
    createTask(data: CreateTaskDto): Promise<Task>;
    getPendingTasks(): Promise<Task[]>;
    getTasksByStatus(status: TaskStatus): Promise<Task[]>;
    getTasksByPriority(priority: TaskPriority): Promise<Task[]>;
}
//# sourceMappingURL=task.service.d.ts.map