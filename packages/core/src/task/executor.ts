export interface TaskExecutionContext {
  taskId: string;
  userId?: string;
  params?: any;
  metadata?: Record<string, any>;
}

export interface TaskExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export class TaskExecutor {
  private executors: Map<string, (context: TaskExecutionContext) => Promise<any>> = new Map();

  register(taskType: string, executor: (context: TaskExecutionContext) => Promise<any>): void {
    this.executors.set(taskType, executor);
  }

  unregister(taskType: string): void {
    this.executors.delete(taskType);
  }

  async execute(taskType: string, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const startTime = Date.now();

    try {
      const executor = this.executors.get(taskType);
      if (!executor) {
        throw new Error(`No executor registered for task type: ${taskType}`);
      }

      const result = await executor(context);
      const duration = Date.now() - startTime;

      return {
        success: true,
        result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  hasExecutor(taskType: string): boolean {
    return this.executors.has(taskType);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.executors.keys());
  }
}
