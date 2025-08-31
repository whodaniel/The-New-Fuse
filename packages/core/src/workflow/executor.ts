import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowStatus,
  WorkflowStep,
  WorkflowStepType,
  WorkflowExecutionContext,
  WorkflowStepExecution,
} from '../types/types';
import { WorkflowValidator } from './validator';

@Injectable()
export class WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutor.name);
  private activeExecutions = new Map<string, AbortController>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly validator: WorkflowValidator,
  ) {}

  async executeWorkflow(
    template: WorkflowTemplate,
    context: any,
    userId?: string,
  ): Promise<WorkflowExecution> {
    // Validate template before execution
    const validation = this.validator.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid workflow template: ${validation.errors.join(', ')}`);
    }

    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      templateId: template.id,
      templateVersion: template.version,
      status: WorkflowStatus.PENDING,
      context,
      steps: {},
      startedAt: new Date().toISOString(),
      createdBy: userId,
    };

    this.logger.log(`Starting workflow execution: ${execution.id}`);
    try {
      execution.status = WorkflowStatus.RUNNING;
      await this.executeSteps(template, execution);
      execution.status = WorkflowStatus.COMPLETED;
      execution.completedAt = new Date().toISOString();
      this.logger.log(`Workflow execution completed: ${execution.id}`);
    } catch (error) {
      execution.status = WorkflowStatus.FAILED;
      execution.completedAt = new Date().toISOString();
      this.logger.error(`Workflow execution failed: ${execution.id}`, error);
      throw error;
    }

    return execution;
  }

  private async executeSteps(
    template: WorkflowTemplate,
    execution: WorkflowExecution,
  ): Promise<void> {
    const stepOrder = this.calculateStepOrder(template.steps);
    for (const stepId of stepOrder) {
      const step = template.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      await this.executeStep(step, template, execution);
      if (execution.steps[stepId]?.status === WorkflowStatus.FAILED) {
        throw new Error(`Step ${stepId} failed: ${execution.steps[stepId]?.error}`);
      }
    }
  }

  private async executeStep(
    step: WorkflowStep,
    template: WorkflowTemplate,
    execution: WorkflowExecution,
  ): Promise<void> {
    this.logger.log(`Executing step: ${step.id}`);
    const stepExecution: WorkflowStepExecution = {
      status: WorkflowStatus.RUNNING,
      startedAt: new Date().toISOString(),
      attempts: 0,
      output: undefined,
      error: undefined,
      completedAt: undefined,
    };
    execution.steps[step.id] = stepExecution;

    try {
      const result = await this.executeStepLogic(step, template, execution);
      stepExecution.status = WorkflowStatus.COMPLETED;
      stepExecution.output = result;
      stepExecution.completedAt = new Date().toISOString();
      this.eventEmitter.emit('workflow.step.completed', {
        executionId: execution.id,
        stepId: step.id,
        result,
      });
    } catch (error) {
      stepExecution.status = WorkflowStatus.FAILED;
      stepExecution.error = (error as Error).message;
      stepExecution.completedAt = new Date().toISOString();
      this.eventEmitter.emit('workflow.step.failed', {
        executionId: execution.id,
        stepId: step.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async executeStepLogic(
    step: WorkflowStep,
    template: WorkflowTemplate,
    execution: WorkflowExecution,
  ): Promise<any> {
    const context: WorkflowExecutionContext = {
      template,
      execution,
      variables: { ...template.variables, ...execution.context },
      globalContext: execution.context,
    };

    switch (step.type) {
      case WorkflowStepType.API_CALL:
        return await this.executeApiCall(step, context);
      case WorkflowStepType.DATA_TRANSFORM:
        return await this.executeDataTransform(step, context);
      case WorkflowStepType.CONDITION:
        return await this.executeCondition(step, context);
      case WorkflowStepType.LOOP:
        return await this.executeLoop(step, context);
      case WorkflowStepType.AGENT:
        return await this.executeAgent(step, context);
      case WorkflowStepType.TASK:
        return await this.executeTask(step, context);
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  private async executeApiCall(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<any> {
    const { url, method = 'GET', headers = {}, body, transform } = step.config;
    if (!url) {
      throw new Error('URL is required for API call');
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (transform) {
      return this.applyTransform(data, transform, context);
    }

    return data;
  }

  private async executeDataTransform(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<any> {
    const { transform } = step.config;
    if (!transform) {
      throw new Error('Transform expression is required');
    }

    return this.applyTransform(context.globalContext, transform, context);
  }

  private async executeCondition(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<any> {
    const { condition } = step.config;
    if (!condition) {
      throw new Error('Condition expression is required');
    }

    const result = this.evaluateCondition(condition, context);
    return {
      condition,
      result,
      next: result ? step.config.onTrue : step.config.onFalse,
    };
  }

  private async executeLoop(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<any> {
    const { iterationPath, maxIterations = 100 } = step.config;
    if (!iterationPath) {
      throw new Error('Iteration path is required for loop');
    }

    const items = this.getValueByPath(context.globalContext, iterationPath);
    if (!Array.isArray(items)) {
      throw new Error(`Iteration path must resolve to an array, got: ${typeof items}`);
    }

    const results = [];
    for (const item of items) {
      // This is a simplified loop execution. A real implementation would need to handle context per iteration.
      const result = await this.executeStepLogic(
        { ...step, type: WorkflowStepType.TASK }, // Assuming loop body is a task
        context.template,
        context.execution,
      );
      results.push(result);
    }

    return results;
  }

  private async executeAgent(
    step: WorkflowStep,
    _context: WorkflowExecutionContext,
  ): Promise<any> {
    const { agentType, prompt, input } = step.config;
    if (!agentType) {
      throw new Error('Agent type is required');
    }

    this.logger.log(`Executing agent step with type: ${agentType}`);
    // In a real implementation, this would call an agent service
    return {
      agentType,
      prompt,
      input,
      output: `Agent ${agentType} processed the request`,
    };
  }

  private async executeTask(
    step: WorkflowStep,
    _context: WorkflowExecutionContext,
  ): Promise<any> {
    const { taskType, parameters } = step.config;
    this.logger.log(`Executing task: ${taskType}`);
    // In a real implementation, this would call a task handler
    return {
      taskType,
      parameters,
      status: 'completed',
    };
  }

  private calculateStepOrder(steps: WorkflowStep[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const step of steps) {
      graph.set(step.id, []);
      inDegree.set(step.id, 0);
    }

    for (const step of steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          graph.get(dep)!.push(step.id);
          inDegree.set(step.id, inDegree.get(step.id)! + 1);
        }
      }
    }

    const queue: string[] = [];
    const result: string[] = [];
    inDegree.forEach((degree, stepId) => {
      if (degree === 0) {
        queue.push(stepId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      for (const neighbor of graph.get(current)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (result.length !== steps.length) {
      throw new Error('Circular dependency detected in workflow steps');
    }

    return result;
  }

  private applyTransform(data: any, transform: string, context: WorkflowExecutionContext): any {
    try {
      // This is a basic and insecure implementation. In a real-world scenario, use a sandboxed expression engine like `vm2`.
      const func = new Function('data', 'context', `return ${transform}`);
      return func(data, context);
    } catch (error) {
      throw new Error(`Transform failed: ${(error as Error).message}`);
    }
  }

  private evaluateCondition(condition: string, context: WorkflowExecutionContext): boolean {
    try {
      // This is a basic and insecure implementation. In a real-world scenario, use a sandboxed expression engine.
      const func = new Function('context', `return ${condition}`);
      return Boolean(func(context));
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${(error as Error).message}`);
    }
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cancelExecution(executionId: string): Promise<void> {
    const controller = this.activeExecutions.get(executionId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(executionId);
      this.logger.log(`Cancelled workflow execution: ${executionId}`);
    }
  }
}
