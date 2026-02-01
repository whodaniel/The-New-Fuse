/**
 * Task Service - Migrated to Drizzle ORM
 * Provides task management operations using the Drizzle repository
 */
import { Injectable } from '@nestjs/common';
import type { NewTask, NewTaskExecution, Task, TaskExecution } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class TaskService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Find tasks that are stuck (running for more than 30 minutes)
   */
  async findStuckTasks(): Promise<Task[]> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    // Use the task repository to find tasks that started before 30 minutes ago and are still running
    const allTasks = await this.db.tasks.findTasksByStatusSystem('IN_PROGRESS');
    return allTasks.filter((task) => task.startTime && new Date(task.startTime) < thirtyMinutesAgo);
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: Partial<NewTask>): Promise<Task | null> {
    return this.db.tasks.updateTask(taskId, updates);
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    return this.db.tasks.findTaskById(taskId);
  }

  /**
   * Create a new task
   */
  async createTask(data: NewTask): Promise<Task> {
    return this.db.tasks.createTask(data);
  }

  /**
   * Get pending tasks ordered by priority
   */
  async getPendingTasks(): Promise<Task[]> {
    const tasks = await this.db.tasks.findTasksByStatusSystem('PENDING');
    // Sort by priority (assuming priority is a string like 'HIGH', 'MEDIUM', 'LOW')
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return tasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      return aPriority - bPriority;
    });
  }

  /**
   * Get task executions for a task
   */
  async getTaskExecutions(taskId: string): Promise<TaskExecution[]> {
    return this.db.tasks.findExecutionsByTaskId(taskId);
  }

  /**
   * Delete tasks by pipeline ID
   */
  async deleteTasks(pipelineId: string): Promise<void> {
    const tasks = await this.db.tasks.findTasksByPipelineId(pipelineId);
    for (const task of tasks) {
      await this.db.tasks.hardDeleteTask(task.id);
    }
  }

  /**
   * Delete task executions by task ID
   */
  async deleteTaskExecutions(taskId: string): Promise<void> {
    // Note: This would need a corresponding method in the repository
    // For now, we can't delete executions directly as the repository doesn't expose this
    // TODO: Add deleteExecutionsByTaskId to DrizzleTaskRepository if needed
    console.warn(
      `deleteTaskExecutions for task ${taskId} - method needs implementation in repository`
    );
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string): Promise<Task | null> {
    return this.db.tasks.updateTaskStatus(taskId, status);
  }

  /**
   * Assign task to an agent
   */
  async assignTask(taskId: string, agentId: string): Promise<Task | null> {
    return this.db.tasks.assignTask(taskId, agentId);
  }

  /**
   * Create a task execution record
   */
  async createExecution(data: NewTaskExecution): Promise<TaskExecution> {
    return this.db.tasks.createExecution(data);
  }

  /**
   * Complete a task execution
   */
  async completeExecution(executionId: string, output: any): Promise<TaskExecution | null> {
    return this.db.tasks.completeExecution(executionId, output);
  }

  /**
   * Fail a task execution
   */
  async failExecution(executionId: string, error: string): Promise<TaskExecution | null> {
    return this.db.tasks.failExecution(executionId, error);
  }

  /**
   * Get task count by status
   */
  async countTasksByStatus(userId?: string): Promise<{ status: string; count: number }[]> {
    return this.db.tasks.countTasksByStatus(userId);
  }
}
