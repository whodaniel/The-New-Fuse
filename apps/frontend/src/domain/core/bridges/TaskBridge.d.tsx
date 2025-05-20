import { TaskDefinition, Result } from '../types.js';
import { TaskStatus, TaskPriority } from '../../../models/enums.js';
export interface TaskUpdateEvent {
    taskId: string;
    changes: Partial<TaskDefinition>;
    userId: string;
    timestamp: number;
}
export declare class TaskBridge {
    private static instance;
    private readonly communicationManager;
    private readonly eventBus;
    private readonly stateManager;
    private readonly logger;
    private constructor();
    static getInstance(): TaskBridge;
    private setupEventListeners;
    private handleTaskUpdate;
    private handleStatusChange;
    createTask(task: Omit<TaskDefinition, 'id'>): Promise<Result<TaskDefinition>>;
    getTask(taskId: string): Promise<Result<TaskDefinition>>;
    updateTask(taskId: string, changes: Partial<TaskDefinition>): Promise<Result<void>>;
    updateStatus(taskId: string, status: TaskStatus): Promise<Result<void>>;
    assignTask(taskId: string, userId: string): Promise<Result<void>>;
    updatePriority(taskId: string, priority: TaskPriority): Promise<Result<void>>;
    subscribeToTaskUpdates(taskId: string, callback: (task: TaskDefinition) => void): () => void;
    subscribeToStatusUpdates(taskId: string, callback: (status: TaskStatus) => void): () => void;
}
