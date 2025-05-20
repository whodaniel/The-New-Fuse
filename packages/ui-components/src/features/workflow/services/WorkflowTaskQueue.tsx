import { TaskStatus, TaskPriority, TaskType } from '../../../task/types.js';
import { WorkflowStep, WorkflowExecutionResult } from '../types.js';

interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  metadata: Record<string, unknown>;
  input: Record<string, unknown>;
  dependencies: string[];
  error?: unknown;
  output?: unknown;
}

interface TaskService {
  createTask(task: Partial<Task>): Promise<string>;
  getTask(taskId: string): Promise<Task>;
}

export class WorkflowTaskQueue {
  private static instance: WorkflowTaskQueue;
  private taskService: TaskService;

  private constructor() {
    // Initialize task service
    this.taskService = {} as TaskService; // Replace with actual implementation
  }

  public static getInstance(): WorkflowTaskQueue {
    if (!WorkflowTaskQueue.instance) {
      WorkflowTaskQueue.instance = new WorkflowTaskQueue();
    }
    return WorkflowTaskQueue.instance;
  }

  public async enqueueWorkflowStep(
    workflowId: string,
    step: WorkflowStep
  ): Promise<string> {
    const task: Partial<Task> = {
      type: TaskType.WORKFLOW,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      metadata: {
        workflowId,
        stepId: step.id,
        stepType: step.type
      },
      input: {
        action: step.action || step.type,
        parameters: step.parameters || step.config || {}
      },
      dependencies: this.getStepDependencies(step)
    };

    return this.taskService.createTask(task);
  }

  public async getStepStatus(taskId: string): Promise<WorkflowExecutionResult> {
    const task = await this.taskService.getTask(taskId);

    return {
      success: task.status === TaskStatus.COMPLETED,
      error: task.error,
      output: task.output
    };
  }

  private getStepDependencies(step: WorkflowStep): string[] {
    return step.metadata?.dependencies || [];
  }
}