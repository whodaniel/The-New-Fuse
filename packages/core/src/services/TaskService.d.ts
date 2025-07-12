import { EventEmitter2 } from '@nestjs/event-emitter';
export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: 'low' | 'medium' | 'high';
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class TaskService {
    private eventEmitter;
    private readonly logger;
    private tasks;
    constructor(eventEmitter: EventEmitter2);
    createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
    getTask(id: string): Promise<Task | null>;
    updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
    deleteTask(id: string): Promise<boolean>;
    getTasks(filters?: {
        status?: string;
        assignedTo?: string;
    }): Promise<Task[]>;
    completeTask(id: string): Promise<Task | null>;
    assignTask(id: string, assignedTo: string): Promise<Task | null>;
    getTaskStats(): Promise<any>;
}
//# sourceMappingURL=TaskService.d.ts.map