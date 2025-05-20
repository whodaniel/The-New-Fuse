import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskDto,
} from "@the-new-fuse/types";
export interface TaskRepository {
  /**
   * Create a new task
   * @param data Task creation data
   */
  createTask(data: CreateTaskDto): Promise<Task>;
  /**
   * Retrieve a task by its ID
   * @param taskId Unique identifier of the task
   */
  getTaskById(taskId: string): Promise<Task | null>;
  /**
   * Update an existing task
   * @param taskId Unique identifier of the task
   * @param updates Partial task data to update
   */
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
  /**
   * Delete a task by its ID
   * @param taskId Unique identifier of the task
   */
  deleteTask(taskId: string): Promise<void>;
  /**
   * Find tasks by status
   * @param status Task status to filter by
   */
  findTasksByStatus(status: TaskStatus): Promise<Task[]>;
  /**
   * Find tasks by pipeline ID
   * @param pipelineId ID of the pipeline
   */
  findTasksByPipeline(pipelineId: string): Promise<Task[]>;
  /**
   * Find stuck tasks (running longer than expected)
   */
  findStuckTasks(): Promise<Task[]>;
  /**
   * Find tasks by priority
   * @param priority Task priority to filter by
   */
  findTasksByPriority(priority: TaskPriority): Promise<Task[]>;
  /**
   * Get tasks with dependencies
   * @param taskId ID of the task to get dependencies for
   */
  getTaskWithDependencies(taskId: string): Promise<
    Task & {
      dependencies: Task[];
    }
  >;
  /**
   * Update task status
   * @param taskId ID of the task
   * @param status New status
   * @param error Optional error message for failed status
   */
  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    error?: string,
  ): Promise<Task>;
}
