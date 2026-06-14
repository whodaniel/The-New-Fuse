import type { NewPipeline, NewTask, NewTaskExecution, Pipeline, Task, TaskExecution } from '../types/index.js';
type TaskScope = {
    tenantId?: string;
    workspaceId?: string;
};
/**
 * Task Repository - provides data access for Task entities
 */
export declare class DrizzleTaskRepository {
    private appendTaskScopeConditions;
    private appendPipelineScopeConditions;
    /**
     * Create a new task
     */
    createTask(data: NewTask): Promise<Task>;
    /**
     * Find tasks created after a certain date
     */
    findTasksCreatedAfter(date: Date, userId: string, scope?: TaskScope): Promise<Task[]>;
    /**
     * Find task by ID
     */
    findTaskById(id: string, scope?: TaskScope): Promise<Task | null>;
    /**
     * Find tasks by user ID
     */
    findTasksByUserId(userId: string, scope?: TaskScope): Promise<Task[]>;
    /**
     * Find tasks by pipeline ID
     */
    findTasksByPipelineId(pipelineId: string): Promise<Task[]>;
    /**
     * Find tasks by status (unscoped - for system services)
     */
    findTasksByStatusUnscoped(status: string): Promise<Task[]>;
    /**
     * Find tasks by status
     */
    findTasksByStatus(status: string, userId?: string, scope?: TaskScope): Promise<Task[]>;
    /**
     * Find tasks by multiple statuses
     */
    findTasksByStatuses(statuses: string[], userId?: string, scope?: TaskScope): Promise<Task[]>;
    /**
     * Find tasks assigned to agent
     */
    findTasksAssignedToAgent(agentId: string): Promise<Task[]>;
    /**
     * Find tasks by priority
     */
    findTasksByPriority(priority: string, userId?: string, scope?: TaskScope): Promise<Task[]>;
    /**
     * Update task
     */
    updateTask(id: string, data: Partial<NewTask>): Promise<Task | null>;
    /**
     * Update task status
     */
    updateTaskStatus(id: string, status: string): Promise<Task | null>;
    /**
     * Assign task to agent
     */
    assignTask(id: string, agentId: string): Promise<Task | null>;
    /**
     * Soft delete task
     */
    softDeleteTask(id: string): Promise<boolean>;
    /**
     * Hard delete task
     */
    hardDeleteTask(id: string): Promise<boolean>;
    /**
     * Count tasks by status
     */
    countTasksByStatus(userId?: string, scope?: TaskScope): Promise<{
        status: string;
        count: number;
    }[]>;
    /**
     * Create a pipeline
     */
    createPipeline(data: NewPipeline): Promise<Pipeline>;
    /**
     * Find pipeline by ID
     */
    findPipelineById(id: string): Promise<Pipeline | null>;
    /**
     * Find pipelines by user ID
     */
    findPipelinesByUserId(userId: string, scope?: TaskScope): Promise<Pipeline[]>;
    /**
     * Update pipeline
     */
    updatePipeline(id: string, data: Partial<NewPipeline>): Promise<Pipeline | null>;
    /**
     * Soft delete pipeline
     */
    softDeletePipeline(id: string): Promise<boolean>;
    /**
     * Create task execution
     */
    createExecution(data: NewTaskExecution): Promise<TaskExecution>;
    /**
     * Find executions by task ID
     */
    findExecutionsByTaskId(taskId: string): Promise<TaskExecution[]>;
    /**
     * Delete all executions for a task.
     */
    deleteExecutionsByTaskId(taskId: string): Promise<number>;
    /**
     * Update execution
     */
    updateExecution(id: string, data: Partial<NewTaskExecution>): Promise<TaskExecution | null>;
    /**
     * Complete execution
     */
    completeExecution(id: string, output: any): Promise<TaskExecution | null>;
    /**
     * Fail execution
     */
    failExecution(id: string, error: string): Promise<TaskExecution | null>;
}
export declare const drizzleTaskRepository: DrizzleTaskRepository;
export {};
//# sourceMappingURL=task.repository.d.ts.map