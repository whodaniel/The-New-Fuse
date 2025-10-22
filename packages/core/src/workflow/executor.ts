import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowTemplate, WorkflowExecution, WorkflowStatus, WorkflowStep, WorkflowStepType, WorkflowExecutionContext } from './types';
import { WorkflowValidator } from './validator';

@Injectable()
export class WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutor.name);
  private activeExecutions = new Map<string, AbortController>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly validator: WorkflowValidator,
  ) {}

  async execute(
    template: WorkflowTemplate,
    context: Record<string, any>,
    userId: string
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
        throw new Error(`Step not found: ${stepId}`);
      }

      if (this.shouldSkipStep(step, execution)) {
        continue;
      }

      await this.executeStep(step, template, execution);
    }
  }

  private async executeStep(
    step: WorkflowStep,
    template: WorkflowTemplate,
    execution: WorkflowExecution,
  ): Promise<void> {
    const stepExecution: {
      status: WorkflowStatus;
      output?: any;
      error?: string;
      startedAt?: string;
      completedAt?: string;
      attempts?: number;
    } = {
      status: WorkflowStatus.RUNNING,
      startedAt: new Date().toISOString(),
      attempts: 1,
    };

    execution.steps[step.id] = stepExecution;

    try {
      const result = await this.executeStepLogic(step, template, execution);
      stepExecution.output = result;
      stepExecution.status = WorkflowStatus.COMPLETED;
      stepExecution.completedAt = new Date().toISOString();
      
      this.eventEmitter.emit('step.completed', {
        executionId: execution.id,
        stepId: step.id,
        result,
      });
    } catch (error) {
      stepExecution.status = WorkflowStatus.FAILED;
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
      stepExecution.completedAt = new Date().toISOString();
      
      this.eventEmitter.emit('step.failed', {
        executionId: execution.id,
        stepId: step.id,
        error: stepExecution.error,
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
    
    for (let i = 0; i < Math.min(items.length, maxIterations); i++) {
      // Create a simple task execution for each loop iteration
      const loopResult = {
        stepId: step.id,
        iteration: i,
        item: items[i],
        timestamp: new Date().toISOString(),
      };
      results.push(loopResult);
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
    return {
      stepId: step.id,
      agentType,
      prompt,
      input,
      output: `Agent ${agentType} processed the request`,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeTask(
    step: WorkflowStep,
    _context: WorkflowExecutionContext,
  ): Promise<any> {
    const { taskType, parameters } = step.config;
    
    this.logger.log(`Executing task: ${taskType}`);
    return {
      stepId: step.id,
      taskType,
      parameters,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
  }

  private shouldSkipStep(step: WorkflowStep, execution: WorkflowExecution): boolean {
    // Check if all dependencies are completed
    if (step.dependencies) {
      for (const depId of step.dependencies) {
        const depExecution = execution.steps[depId];
        if (!depExecution || depExecution.status !== WorkflowStatus.COMPLETED) {
          return true;
        }
      }
    }
    return false;
  }

  private calculateStepOrder(steps: WorkflowStep[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    for (const step of steps) {
      graph.set(step.id, []);
      inDegree.set(step.id, 0);
    }

    // Build dependency graph
    for (const step of steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          graph.get(dep)!.push(step.id);
          inDegree.set(step.id, inDegree.get(step.id)! + 1);
        }
      }
    }

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    for (const [stepId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(stepId);
      }
    }

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
      const func = new Function('data', 'context', `return ${transform}`);
      return func(data, context);
    } catch (error) {
      throw new Error(`Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private evaluateCondition(condition: string, context: WorkflowExecutionContext): boolean {
    try {
      const func = new Function('context', `return ${condition}`);
      return Boolean(func(context));
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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