import type { NewTask, NewTaskExecution, Task, TaskExecution } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import type { TaskExecutionLogEntry, TaskExecutionLogPayload } from './task.types';
type TaskScope = {
    tenantId?: string;
    workspaceId?: string;
};
export declare class TaskService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    /**
     * Find tasks that are stuck (running for more than 30 minutes)
     */
    findStuckTasks(userId: string): Promise<Task[]>;
    /**
     * Find tasks that are stuck across all users.
     */
    findStuckTasksUnscoped(): Promise<Task[]>;
    /**
     * Find all active tasks across all users (for system services)
     */
    findActiveTasks(): Promise<Task[]>;
    /**
     * Update a task
     */
    updateTask(taskId: string, updates: Partial<NewTask>): Promise<Task | null>;
    /**
     * Get task by ID
     */
    getTaskById(taskId: string, scope?: TaskScope): Promise<Task | null>;
    /**
     * Get task by ID scoped to a specific user.
     */
    getTaskByIdForUser(taskId: string, userId: string, scope?: TaskScope): Promise<Task | null>;
    /**
     * Create a new task
     */
    createTask(data: NewTask): Promise<Task>;
    /**
     * List tasks for a user with optional status filter and pagination.
     */
    listTasks(userId: string, options?: {
        status?: string;
        page?: number;
        limit?: number;
        tenantId?: string;
        workspaceId?: string;
    }): Promise<{
        tasks: Task[];
        total: number;
    }>;
    /**
     * Get pending tasks ordered by priority
     */
    getPendingTasks(userId: string): Promise<Task[]>;
    /**
     * Get task executions for a task
     */
    getTaskExecutions(taskId: string): Promise<TaskExecution[]>;
    /**
     * Convert task execution records into normalized execution logs.
     */
    getExecutionLogs(taskId: string): Promise<TaskExecutionLogEntry[]>;
    /**
     * Append an execution log entry by recording a task execution row.
     */
    appendExecutionLog(taskId: string, payload: TaskExecutionLogPayload): Promise<TaskExecutionLogEntry>;
    /**
     * Delete tasks by pipeline ID
     */
    deleteTasks(pipelineId: string): Promise<void>;
    /**
     * Delete task executions by task ID
     */
    deleteTaskExecutions(taskId: string): Promise<void>;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: string): Promise<Task | null>;
    /**
     * Assign task to an agent
     */
    assignTask(taskId: string, agentId: string): Promise<Task | null>;
    /**
     * Create a task execution record
     */
    createExecution(data: NewTaskExecution): Promise<TaskExecution>;
    /**
     * Complete a task execution
     */
    completeExecution(executionId: string, output: any): Promise<TaskExecution | null>;
    /**
     * Fail a task execution
     */
    failExecution(executionId: string, error: string): Promise<TaskExecution | null>;
    /**
     * Get task count by status
     */
    countTasksByStatus(userId?: string): Promise<{
        status: string;
        count: number;
    }[]>;
    private mapExecutionToLog;
}
export {};
//# sourceMappingURL=task.service.d.ts.map