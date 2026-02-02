/**
 * Enhanced Orchestration for TNF CLI
 *
 * Features:
 * - Workflow DAG execution with dependency resolution
 * - Parallel step execution
 * - Circuit breaker integration
 * - Task state management
 */

import { v4 as uuidv4 } from 'uuid';
import { RedisAgentClient } from './RedisAgentClient.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { Logger, createLogger } from './logger.js';
import {
  StepResult,
  TaskCreateRequest,
  TaskState,
  Workflow,
  WorkflowExecution,
  WorkflowStep,
} from './types.js';

export class Orchestrator {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private logger: Logger;
  private circuitBreaker: CircuitBreaker;

  constructor(
    private client: RedisAgentClient,
    logger?: Logger
  ) {
    this.logger =
      logger ||
      createLogger({
        level: 'info',
        format: 'pretty',
        output: 'console',
        includeTraceId: true,
      });
    this.circuitBreaker = new CircuitBreaker(
      'orchestrator',
      {
        failureThreshold: 3,
        successThreshold: 2,
        timeoutMs: 30000,
        halfOpenMaxCalls: 2,
      },
      this.logger
    );
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: Omit<Workflow, 'id' | 'status'>): string {
    const id = `workflow_${uuidv4()}`;
    const fullWorkflow: Workflow = {
      ...workflow,
      id,
      status: 'pending',
    };

    // Validate workflow DAG
    this.validateWorkflow(fullWorkflow);

    this.workflows.set(id, fullWorkflow);

    this.logger.info(`Workflow registered: ${id}`, {
      workflowId: id,
      name: workflow.name,
      steps: workflow.steps.length,
    });

    return id;
  }

  private validateWorkflow(workflow: Workflow): void {
    const stepIds = new Set(workflow.steps.map((s) => s.id));

    // Check all dependencies exist
    for (const step of workflow.steps) {
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          if (!stepIds.has(depId)) {
            throw new OrchestratorError(
              `Step ${step.id} depends on non-existent step ${depId}`,
              'INVALID_WORKFLOW'
            );
          }
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = workflow.steps.find((s) => s.id === stepId);
      if (step?.dependsOn) {
        for (const depId of step.dependsOn) {
          if (!visited.has(depId)) {
            if (hasCycle(depId)) return true;
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of workflow.steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) {
          throw new OrchestratorError(
            `Circular dependency detected in workflow ${workflow.name}`,
            'INVALID_WORKFLOW'
          );
        }
      }
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, params: any = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new OrchestratorError(`Workflow ${workflowId} not found`, 'WORKFLOW_NOT_FOUND');
    }

    const executionId = `exec_${uuidv4()}`;
    const execution: WorkflowExecution = {
      workflowId,
      executionId,
      status: 'running',
      stepResults: new Map(),
      startedAt: new Date().toISOString(),
    };

    this.executions.set(executionId, execution);
    workflow.status = 'running';

    this.logger.info(`Starting workflow execution: ${executionId}`, {
      executionId,
      workflowId,
      workflowName: workflow.name,
    });

    try {
      await this.executeWorkflowSteps(workflow, execution, params);

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      workflow.status = 'completed';

      this.logger.info(`Workflow execution completed: ${executionId}`, {
        executionId,
        duration:
          new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime(),
      });
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      workflow.status = 'failed';

      this.logger.error(`Workflow execution failed: ${executionId}`, {}, error as Error);
      throw error;
    }

    return execution;
  }

  private async executeWorkflowSteps(
    workflow: Workflow,
    execution: WorkflowExecution,
    params: any
  ): Promise<void> {
    const completedSteps = new Set<string>();
    const runningSteps = new Set<string>();

    const canExecute = (step: WorkflowStep): boolean => {
      if (!step.dependsOn || step.dependsOn.length === 0) return true;
      return step.dependsOn.every((depId) => completedSteps.has(depId));
    };

    const executeStep = async (step: WorkflowStep): Promise<void> => {
      if (completedSteps.has(step.id) || runningSteps.has(step.id)) return;

      runningSteps.add(step.id);

      const result: StepResult = {
        stepId: step.id,
        status: 'running',
        startedAt: new Date().toISOString(),
      };

      execution.stepResults.set(step.id, result);

      this.logger.info(`Executing step: ${step.id}`, {
        executionId: execution.executionId,
        stepId: step.id,
        stepName: step.name,
      });

      try {
        await this.circuitBreaker.execute(async () => {
          await this.runStepAction(step, params, execution);
        });

        result.status = 'completed';
        result.completedAt = new Date().toISOString();
        completedSteps.add(step.id);

        this.logger.info(`Step completed: ${step.id}`);
      } catch (error) {
        // Check retry policy
        const retryPolicy = step.retryPolicy;
        const currentRetries = execution.stepResults.get(step.id)?.output?.retries || 0;

        if (retryPolicy && currentRetries < retryPolicy.maxRetries) {
          this.logger.warn(
            `Step ${step.id} failed, retrying (${currentRetries + 1}/${retryPolicy.maxRetries})`
          );

          const delay =
            retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, currentRetries);
          await new Promise((resolve) => setTimeout(resolve, delay));

          result.output = { retries: currentRetries + 1 };
          runningSteps.delete(step.id);
          await executeStep(step);
          return;
        }

        result.status = 'failed';
        result.error = {
          code: 'STEP_FAILED',
          message: (error as Error).message,
        };
        result.completedAt = new Date().toISOString();

        throw error;
      } finally {
        runningSteps.delete(step.id);
      }
    };

    // Execute steps in dependency order
    while (completedSteps.size < workflow.steps.length) {
      const readySteps = workflow.steps.filter(
        (step) => !completedSteps.has(step.id) && !runningSteps.has(step.id) && canExecute(step)
      );

      if (readySteps.length === 0) {
        if (runningSteps.size === 0) {
          throw new OrchestratorError(
            'Deadlock detected in workflow execution',
            'WORKFLOW_DEADLOCK'
          );
        }
        // Wait for running steps to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      // Execute ready steps in parallel
      await Promise.all(readySteps.map((step) => executeStep(step)));
    }
  }

  private async runStepAction(
    step: WorkflowStep,
    params: any,
    execution: WorkflowExecution
  ): Promise<void> {
    // Built-in step types
    switch (step.task) {
      case 'health_check':
        await this.runHealthCheck();
        break;
      case 'code_review':
        await this.runCodeReview(params.path || '.');
        break;
      case 'self_improvement':
        await this.runSelfImprovement();
        break;
      case 'send_message':
        await this.sendMessage(step, params);
        break;
      case 'create_task':
        await this.createTask(step, params);
        break;
      case 'wait_for_task':
        await this.waitForTask(step, params);
        break;
      case 'parallel_map':
        await this.parallelMap(step, params);
        break;
      case 'condition':
        await this.evaluateCondition(step, params, execution);
        break;
      default:
        // Custom task - broadcast to workers
        await this.client.broadcast({
          type: 'command',
          content: step.task,
          metadata: {
            workflowId: execution.workflowId,
            executionId: execution.executionId,
            stepId: step.id,
            params,
          },
        });
    }
  }

  private async runHealthCheck(): Promise<void> {
    this.logger.info('Running health check...');

    await this.client.broadcast({
      type: 'command',
      content: 'health_check',
      metadata: { workflow: 'health-check' },
    });

    // Wait for responses
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async runCodeReview(path: string): Promise<void> {
    this.logger.info(`Starting code review for: ${path}`);

    // Create a task for code review
    const task = await this.client.createTask({
      title: 'Code Review',
      description: `Review code at ${path}`,
      priority: 'normal',
      tags: ['code-review'],
    });

    await this.client.send(`Please review the code at ${path}`, {
      type: 'command',
      metadata: {
        workflow: 'code-review',
        taskId: task.id,
        path,
      },
    });
  }

  private async runSelfImprovement(): Promise<void> {
    this.logger.info('Starting self-improvement cycle...');

    await this.client.broadcast({
      type: 'command',
      content: 'run_improvement_cycle',
      metadata: { workflow: 'self-improvement' },
    });
  }

  private async sendMessage(step: WorkflowStep, params: any): Promise<void> {
    const target = step.metadata?.target || params.target;
    const message = step.metadata?.message || params.message;

    if (!message) {
      throw new OrchestratorError('Message content required', 'MISSING_MESSAGE');
    }

    await this.client.send(message, {
      to: target ? { agentId: target } : undefined,
      type: 'command',
      metadata: {
        stepId: step.id,
        ...step.metadata,
      },
    });
  }

  private async createTask(step: WorkflowStep, params: any): Promise<void> {
    const request: TaskCreateRequest = {
      title: step.metadata?.title || 'Orchestrated Task',
      description: step.metadata?.description,
      assignedTo: step.metadata?.assignedTo,
      priority: step.metadata?.priority,
      tags: step.metadata?.tags,
    };

    await this.client.createTask(request);
  }

  private async waitForTask(step: WorkflowStep, params: any): Promise<void> {
    const taskId = step.metadata?.taskId || params.taskId;
    const timeout = step.metadata?.timeout || 300000; // 5 minutes

    if (!taskId) {
      throw new OrchestratorError('Task ID required', 'MISSING_TASK_ID');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new OrchestratorError(`Timeout waiting for task ${taskId}`, 'TASK_TIMEOUT'));
      }, timeout);

      const unsubscribe = this.client.taskManager.subscribe(taskId, (task) => {
        if (task.status.state === TaskState.Completed) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        } else if (
          task.status.state === TaskState.Failed ||
          task.status.state === TaskState.Canceled
        ) {
          clearTimeout(timeoutId);
          unsubscribe();
          reject(new OrchestratorError(`Task ${taskId} ${task.status.state}`, 'TASK_FAILED'));
        }
      });
    });
  }

  private async parallelMap(step: WorkflowStep, params: any): Promise<void> {
    const items = step.metadata?.items || params.items || [];
    const subStep = step.metadata?.step;

    if (!Array.isArray(items) || items.length === 0) return;

    this.logger.info(`Executing parallel map over ${items.length} items`);

    await Promise.all(
      items.map((item, index) =>
        this.client.send(`Process item ${index}`, {
          type: 'command',
          metadata: {
            step: subStep,
            item,
            index,
          },
        })
      )
    );
  }

  private async evaluateCondition(
    step: WorkflowStep,
    params: any,
    execution: WorkflowExecution
  ): Promise<void> {
    const condition = step.metadata?.condition;
    if (!condition) return;

    // Simple condition evaluation - can be extended
    const result = this.evaluateExpression(condition, params);

    if (!result) {
      // Mark dependent steps as skipped
      step.metadata?.falseBranch?.forEach((stepId: string) => {
        const result: StepResult = {
          stepId,
          status: 'skipped',
          output: { reason: 'Condition evaluated to false' },
        };
        execution.stepResults.set(stepId, result);
      });
    }
  }

  private evaluateExpression(expression: string, context: any): boolean {
    try {
      // Simple expression evaluator - use with caution
      const func = new Function('context', `with(context) { return ${expression}; }`);
      return func(context);
    } catch {
      return false;
    }
  }

  /**
   * Pause workflow execution
   */
  pauseExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'paused';
      this.logger.info(`Execution paused: ${executionId}`);
    }
  }

  /**
   * Resume workflow execution
   */
  resumeExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'running';
      this.logger.info(`Execution resumed: ${executionId}`);
    }
  }

  /**
   * Get workflow execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * List all executions for a workflow
   */
  getExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    if (workflowId) {
      return executions.filter((e) => e.workflowId === workflowId);
    }
    return executions;
  }

  /**
   * Get workflow definition
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}

export class OrchestratorError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

// Predefined workflow templates
export const WORKFLOW_TEMPLATES = {
  healthCheck: {
    name: 'Health Check',
    description: 'System-wide health check of all agents',
    steps: [{ id: 'check', name: 'Health Check', task: 'health_check' }],
  },
  codeReview: {
    name: 'Code Review',
    description: 'Review code at specified path',
    steps: [{ id: 'review', name: 'Code Review', task: 'code_review' }],
  },
  parallelCodeReview: {
    name: 'Parallel Code Review',
    description: 'Review multiple files in parallel',
    steps: [
      { id: 'map', name: 'Map Files', task: 'parallel_map' },
      { id: 'review', name: 'Review', task: 'code_review', dependsOn: ['map'] },
    ],
  },
};
