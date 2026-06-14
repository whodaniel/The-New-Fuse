import { EventEmitter2 } from '@nestjs/event-emitter';
export interface TaskProgress {
    taskId: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    progress: number;
    message?: string;
    metadata?: Record<string, any>;
}
export declare class ProgressTrackerService {
    private readonly eventEmitter;
    private readonly logger;
    private tasks;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Starts tracking a new task.
     */
    startTask(taskId: string, metadata?: Record<string, any>): TaskProgress;
    /**
     * Updates the progress of an existing task.
     */
    updateProgress(taskId: string, progress: number, message?: string): TaskProgress | null;
    /**
     * Completes a task.
     */
    completeTask(taskId: string, message?: string): TaskProgress | null;
    /**
     * Marks a task as failed.
     */
    failTask(taskId: string, errorMessage: string): TaskProgress | null;
    /**
     * Retrieves the status of a specific task.
     */
    getTaskStatus(taskId: string): TaskProgress | null;
}
//# sourceMappingURL=progressTracker.d.ts.map