/**
 * Workflow Execution Engine
 *
 * Executes workflows with support for:
 * - Step dependencies and parallel execution
 * - Multiple step types (agent, tool, condition, transformation)
 * - Real-time WebSocket updates
 * - Pause/Resume/Cancel operations
 * - Error handling and retries
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { db } from '@the-new-fuse/database';
import {
  workflowExecutions,
  workflows,
  workflowSteps,
} from '@the-new-fuse/database/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import {
  MassBlockConfig,
  MassBlocksService,
} from '../modules/mass/building-blocks/mass-blocks.service.js';
import { WorkflowExecutionGateway } from './workflow-execution.gateway.js';

// Types
export type WorkflowStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  definition?: any;
  variables?: Record<string, any>;
  triggers?: any[];
}

export interface WorkflowStepConfig {
  id: string;
  name: string;
  type: StepType;
  config?: any;
  order: number;
  nextSteps?: string[];
  conditions?: any[];
  transformations?: any[];
  agentId?: string;
}

export type StepType =
  | 'agent'
  | 'tool'
  | 'condition'
  | 'transformation'
  | 'parallel'
  | 'loop'
  | 'wait'
  | 'webhook'
  | 'code';

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  input: any;
  variables: Record<string, any>;
  stepResults: Map<string, any>;
  logs: ExecutionLog[];
  startTime: Date;
  metadata: Record<string, any>;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  metadata?: any;
}

export interface StepResult {
  stepId: string;
  status: StepStatus;
  output?: any;
  error?: string;
  duration: number;
  startedAt: Date;
  completedAt?: Date;
}

// Active executions tracking
const activeExecutions = new Map<
  string,
  {
    context: ExecutionContext;
    abortController: AbortController;
    status: ExecutionStatus;
  }
>();

@Injectable()
export class WorkflowExecutionService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(
    private readonly gateway: WorkflowExecutionGateway,
    private readonly massBlocks: MassBlocksService
  ) {}

  async onModuleInit() {
    this.logger.log('Workflow Execution Engine initialized');
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflowId: string,
    input: any = {},
    options: {
      userId?: string;
      projectId?: string;
      variables?: Record<string, any>;
    } = {}
  ): Promise<{ executionId: string; status: ExecutionStatus }> {
    // Load workflow from database
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status === 'DRAFT') {
      throw new Error('Cannot execute a draft workflow. Publish it first.');
    }

    // Load workflow steps
    const steps = await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(workflowSteps.order);

    if (steps.length === 0) {
      throw new Error('Workflow has no steps to execute');
    }

    const workflowVariables =
      workflow.variables && typeof workflow.variables === 'object' ? workflow.variables : {};
    const optionVariables =
      options.variables && typeof options.variables === 'object' ? options.variables : {};

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        status: 'PENDING',
        input,
        startedAt: new Date(),
        projectId: options.projectId,
        context: {
          variables: { ...workflowVariables, ...optionVariables },
          userId: options.userId,
        },
        nodeExecutions: [],
        logs: [],
      } as any)
      .returning();

    const executionId = execution.id;

    // Initialize execution context
    const context: ExecutionContext = {
      executionId,
      workflowId,
      input,
      variables: { ...workflowVariables, ...optionVariables },
      stepResults: new Map(),
      logs: [],
      startTime: new Date(),
      metadata: {
        userId: options.userId,
        projectId: options.projectId,
      },
    };

    // Create abort controller for cancellation
    const abortController = new AbortController();

    // Track active execution
    activeExecutions.set(executionId, {
      context,
      abortController,
      status: 'RUNNING',
    });

    // Update status to running
    await this.updateExecutionStatus(executionId, 'RUNNING');

    // Start execution in background
    this.executeWorkflow(executionId, workflow, steps, context, abortController.signal).catch(
      (error) => {
        this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      }
    );

    return { executionId, status: 'RUNNING' };
  }

  /**
   * Main workflow execution logic
   */
  private async executeWorkflow(
    executionId: string,
    workflow: any,
    steps: any[],
    context: ExecutionContext,
    abortSignal: AbortSignal
  ): Promise<void> {
    try {
      this.log(context, 'info', `Starting workflow execution: ${workflow.name}`);

      // Build step graph for dependency resolution
      const stepGraph = this.buildStepGraph(steps);

      // Execute steps in topological order with parallel support
      const completedSteps = new Set<string>();
      const stepResults: StepResult[] = [];

      while (completedSteps.size < steps.length) {
        // Check for abort
        if (abortSignal.aborted) {
          await this.handleAbort(executionId, context);
          return;
        }

        // Check for pause
        const executionState = activeExecutions.get(executionId);
        if (executionState?.status === 'PAUSED') {
          await this.waitForResume(executionId, abortSignal);
          if (abortSignal.aborted) {
            await this.handleAbort(executionId, context);
            return;
          }
        }

        // Get next executable steps (all dependencies completed)
        const nextSteps = this.getNextExecutableSteps(stepGraph, completedSteps);

        if (nextSteps.length === 0 && completedSteps.size < steps.length) {
          // Deadlock - circular dependency or missing dependency
          throw new Error('Workflow deadlock detected: unable to proceed with remaining steps');
        }

        // Execute steps in parallel
        const stepPromises = nextSteps.map((stepId) => {
          const step = steps.find((s) => s.id === stepId);
          if (!step) return Promise.resolve(null);
          return this.executeStep(executionId, step, context, stepResults, abortSignal);
        });

        const results = await Promise.all(stepPromises);

        // Process results
        for (const result of results) {
          if (result) {
            completedSteps.add(result.stepId);
            stepResults.push(result);
            context.stepResults.set(result.stepId, result.output);

            if (result.status === 'failed') {
              // Check if step has error handling
              const step = steps.find((s) => s.id === result.stepId);
              if (step?.config?.continueOnError) {
                this.log(
                  context,
                  'warn',
                  `Step ${result.stepId} failed but continuing`,
                  result.stepId
                );
              } else {
                throw new Error(`Step ${result.stepId} failed: ${result.error}`);
              }
            }
          }
        }
      }

      // All steps completed successfully
      await this.completeExecution(executionId, context, stepResults);
    } catch (error) {
      await this.failExecution(executionId, context, error);
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    executionId: string,
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[],
    abortSignal: AbortSignal
  ): Promise<StepResult> {
    const startTime = new Date();
    const stepStartTime = Date.now();

    this.log(context, 'info', `Executing step: ${step.name}`, step.id);

    // Notify via WebSocket
    this.gateway.sendNodeStarted(executionId, step.id, {
      name: step.name,
      type: step.type,
    });

    try {
      let output: any;

      // Execute based on step type
      switch (step.type as StepType) {
        case 'agent':
          output = await this.executeAgentStep(step, context, previousResults);
          break;
        case 'tool':
          output = await this.executeToolStep(step, context, previousResults);
          break;
        case 'condition':
          output = await this.executeConditionStep(step, context, previousResults);
          break;
        case 'transformation':
          output = await this.executeTransformationStep(step, context, previousResults);
          break;
        case 'parallel':
          output = await this.executeParallelStep(step, context, previousResults, abortSignal);
          break;
        case 'loop':
          output = await this.executeLoopStep(step, context, previousResults, abortSignal);
          break;
        case 'wait':
          output = await this.executeWaitStep(step, abortSignal);
          break;
        case 'code':
          output = await this.executeCodeStep(step, context, previousResults);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const duration = Date.now() - stepStartTime;
      const completedAt = new Date();

      // Notify completion
      this.gateway.sendNodeCompleted(executionId, step.id, output, duration);

      return {
        stepId: step.id,
        status: 'completed',
        output,
        duration,
        startedAt: startTime,
        completedAt,
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      const completedAt = new Date();

      // Notify failure
      this.gateway.sendNodeFailed(executionId, step.id, {
        message: error.message,
        stack: error.stack,
      });

      return {
        stepId: step.id,
        status: 'failed',
        error: error.message,
        duration,
        startedAt: startTime,
        completedAt,
      };
    }
  }

  /**
   * Step type executors
   */
  private async executeAgentStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[]
  ): Promise<any> {
    if (!step.agentId) {
      throw new Error('Agent step requires agentId');
    }

    // Get input from previous step or context
    const input = this.resolveStepInput(step, context, previousResults);

    // Execute via MassBlocks
    const config: MassBlockConfig = {
      type: 'custom',
      parameters: step.config || {},
    };

    const result = await this.massBlocks.executeBlock(step.agentId, input, config);

    return result.result;
  }

  private async executeToolStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[]
  ): Promise<any> {
    const toolName = step.config?.toolName;
    if (!toolName) {
      throw new Error('Tool step requires toolName in config');
    }

    const input = this.resolveStepInput(step, context, previousResults);

    // Execute via MassBlocks tool-use
    const config: MassBlockConfig = {
      type: 'tool-use',
      parameters: { toolName, ...step.config },
    };

    const result = await this.massBlocks.executeBlock('tool-executor', input, config);
    return result.result;
  }

  private async executeConditionStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[]
  ): Promise<any> {
    const conditions = step.conditions || [];
    const input = this.resolveStepInput(step, context, previousResults);

    for (const condition of conditions) {
      const result = this.evaluateCondition(condition, input, context);
      if (result) {
        return { matched: true, condition: condition.id, branch: condition.branch };
      }
    }

    return { matched: false, defaultBranch: step.config?.defaultBranch };
  }

  private async executeTransformationStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[]
  ): Promise<any> {
    const transformations = step.transformations || [];
    let data = this.resolveStepInput(step, context, previousResults);

    for (const transform of transformations) {
      data = this.applyTransformation(transform, data, context);
    }

    return data;
  }

  private async executeParallelStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[],
    abortSignal: AbortSignal
  ): Promise<any> {
    const parallelSteps = step.config?.steps || [];
    const input = this.resolveStepInput(step, context, previousResults);

    const results = await Promise.all(
      parallelSteps.map(async (subStep: any) => {
        if (abortSignal.aborted) return null;
        return this.executeStep(
          context.executionId,
          subStep,
          context,
          previousResults,
          abortSignal
        );
      })
    );

    return {
      parallel: true,
      results: results.filter((r) => r !== null),
    };
  }

  private async executeLoopStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[],
    abortSignal: AbortSignal
  ): Promise<any> {
    const items = step.config?.items || [];
    const maxIterations = step.config?.maxIterations || 100;
    const results = [];

    for (let i = 0; i < Math.min(items.length, maxIterations); i++) {
      if (abortSignal.aborted) break;

      const item = items[i];
      const iterationContext = {
        ...context,
        variables: { ...context.variables, $item: item, $index: i },
      };

      const result = await this.executeStep(
        context.executionId,
        { ...step, type: step.config?.stepType || 'transformation' },
        iterationContext,
        previousResults,
        abortSignal
      );

      results.push(result);
    }

    return { loop: true, iterations: results.length, results };
  }

  private async executeWaitStep(step: any, abortSignal: AbortSignal): Promise<any> {
    const duration = step.config?.duration || 1000;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, duration);
      abortSignal.addEventListener('abort', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    return { waited: duration };
  }

  private async executeCodeStep(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[]
  ): Promise<any> {
    const code = step.config?.code;
    if (!code) {
      throw new Error('Code step requires code in config');
    }

    // Safe execution context
    const sandbox = {
      input: this.resolveStepInput(step, context, previousResults),
      context: { variables: context.variables },
      console: { log: (...args: any[]) => this.log(context, 'info', args.join(' '), step.id) },
    };

    // Execute code (in production, use a proper sandbox like vm2 or isolated-vm)
    const fn = new Function('input', 'context', 'console', code);
    return fn(sandbox.input, sandbox.context, sandbox.console);
  }

  /**
   * Helper methods
   */
  private buildStepGraph(steps: any[]): Map<string, { step: any; dependencies: string[] }> {
    const graph = new Map();

    for (const step of steps) {
      const dependencies: string[] = [];

      // Find dependencies from nextSteps of other steps
      for (const otherStep of steps) {
        if (otherStep.nextSteps?.includes(step.id)) {
          dependencies.push(otherStep.id);
        }
      }

      // First step has no dependencies
      if (step.order === 0 || dependencies.length === 0) {
        graph.set(step.id, { step, dependencies: [] });
      } else {
        graph.set(step.id, { step, dependencies });
      }
    }

    return graph;
  }

  private getNextExecutableSteps(
    graph: Map<string, { step: any; dependencies: string[] }>,
    completed: Set<string>
  ): string[] {
    const executable: string[] = [];

    for (const [stepId, { dependencies }] of graph) {
      if (completed.has(stepId)) continue;

      const allDependenciesCompleted = dependencies.every((dep) => completed.has(dep));
      if (allDependenciesCompleted) {
        executable.push(stepId);
      }
    }

    return executable;
  }

  private resolveStepInput(
    step: any,
    context: ExecutionContext,
    previousResults: StepResult[]
  ): any {
    // Check if input is mapped from previous step
    if (step.config?.inputFrom) {
      const prevResult = context.stepResults.get(step.config.inputFrom);
      return prevResult;
    }

    // Check for input mapping
    if (step.config?.inputMapping) {
      const mapped: any = {};
      for (const [key, path] of Object.entries(step.config.inputMapping)) {
        mapped[key] = this.resolvePath(path as string, context, previousResults);
      }
      return mapped;
    }

    // Default: use workflow input
    return context.input;
  }

  private resolvePath(path: string, context: ExecutionContext, previousResults: StepResult[]): any {
    if (path.startsWith('$input.')) {
      const key = path.substring(7);
      return context.input[key];
    }
    if (path.startsWith('$variables.')) {
      const key = path.substring(11);
      return context.variables[key];
    }
    if (path.startsWith('$steps.')) {
      const parts = path.substring(7).split('.');
      const stepId = parts[0];
      const field = parts.slice(1).join('.');
      const result = context.stepResults.get(stepId);
      return field ? result?.[field] : result;
    }
    return path;
  }

  private evaluateCondition(condition: any, input: any, context: ExecutionContext): boolean {
    const { field, operator, value } = condition;

    let fieldValue: any;
    if (field.startsWith('$')) {
      fieldValue = this.resolvePath(field, context, []);
    } else {
      fieldValue = input[field];
    }

    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'neq':
        return fieldValue !== value;
      case 'gt':
        return fieldValue > value;
      case 'gte':
        return fieldValue >= value;
      case 'lt':
        return fieldValue < value;
      case 'lte':
        return fieldValue <= value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'true':
        return Boolean(fieldValue);
      case 'false':
        return !fieldValue;
      default:
        return false;
    }
  }

  private applyTransformation(transform: any, data: any, context: ExecutionContext): any {
    const { type, ...params } = transform;

    switch (type) {
      case 'map':
        return data.map((item: any) => this.applyTransformation(params, item, context));
      case 'filter':
        return data.filter((item: any) => this.evaluateCondition(params.condition, item, context));
      case 'pick':
        return params.fields.reduce((acc: any, field: string) => {
          acc[field] = data[field];
          return acc;
        }, {});
      case 'merge':
        return { ...data, ...params.with };
      case 'set':
        return { ...data, [params.key]: params.value };
      case 'template':
        return params.template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
      default:
        return data;
    }
  }

  private log(
    context: ExecutionContext,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    nodeId?: string
  ): void {
    const log: ExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      nodeId,
    };

    context.logs.push(log);
    this.logger[level](`[Workflow ${context.executionId}] ${message}`);

    // Send via WebSocket
    this.gateway.sendLog(context.executionId, level, message, { nodeId });
  }

  /**
   * Execution state management
   */
  private async updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void> {
    await db
      .update(workflowExecutions)
      .set({ status, updatedAt: new Date() } as any)
      .where(eq(workflowExecutions.id, executionId));

    // Update active execution tracking
    const execution = activeExecutions.get(executionId);
    if (execution) {
      execution.status = status;
    }

    // Notify via WebSocket
    this.gateway.sendExecutionUpdate(executionId, {
      type: 'status',
      data: { status },
    });
  }

  private async completeExecution(
    executionId: string,
    context: ExecutionContext,
    stepResults: StepResult[]
  ): Promise<void> {
    const output = stepResults[stepResults.length - 1]?.output;
    const completedAt = new Date();
    const duration = completedAt.getTime() - context.startTime.getTime();

    await db
      .update(workflowExecutions)
      .set({
        status: 'COMPLETED',
        output,
        completedAt,
        nodeExecutions: stepResults,
        logs: context.logs,
        statistics: {
          totalSteps: stepResults.length,
          completedSteps: stepResults.filter((s) => s.status === 'completed').length,
          failedSteps: stepResults.filter((s) => s.status === 'failed').length,
          duration,
        },
      } as any)
      .where(eq(workflowExecutions.id, executionId));

    // Update workflow stats
    await db
      .update(workflows)
      .set({
        lastExecutedAt: completedAt,
        executionCount: sql`${workflows.executionCount} + 1`,
      } as any)
      .where(eq(workflows.id, context.workflowId));

    activeExecutions.delete(executionId);

    this.gateway.sendWorkflowCompleted(executionId, context.workflowId, output, {
      duration,
      stepsCompleted: stepResults.length,
    });

    this.logger.log(`Workflow execution completed: ${executionId}`);
  }

  private async failExecution(
    executionId: string,
    context: ExecutionContext,
    error: Error
  ): Promise<void> {
    await db
      .update(workflowExecutions)
      .set({
        status: 'FAILED',
        error: error.message,
        completedAt: new Date(),
        logs: context.logs,
      } as any)
      .where(eq(workflowExecutions.id, executionId));

    activeExecutions.delete(executionId);

    this.gateway.sendWorkflowFailed(executionId, context.workflowId, {
      message: error.message,
      stack: error.stack,
    });

    this.logger.error(`Workflow execution failed: ${executionId} - ${error.message}`);
  }

  /**
   * Pause/Resume/Cancel operations
   */
  async pause(executionId: string): Promise<void> {
    const execution = activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found or not running: ${executionId}`);
    }

    await this.updateExecutionStatus(executionId, 'PAUSED');
    this.logger.log(`Workflow execution paused: ${executionId}`);
  }

  async resume(executionId: string): Promise<void> {
    const execution = activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    await this.updateExecutionStatus(executionId, 'RUNNING');
    this.logger.log(`Workflow execution resumed: ${executionId}`);
  }

  async cancel(executionId: string, reason?: string): Promise<void> {
    const execution = activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.abortController.abort();
    execution.status = 'CANCELLED';

    await db
      .update(workflowExecutions)
      .set({
        status: 'CANCELLED',
        error: reason || 'Cancelled by user',
        completedAt: new Date(),
      } as any)
      .where(eq(workflowExecutions.id, executionId));

    activeExecutions.delete(executionId);

    this.gateway.sendExecutionUpdate(executionId, {
      type: 'status',
      data: { status: 'CANCELLED', reason },
    });

    this.logger.log(`Workflow execution cancelled: ${executionId}`);
  }

  private async handleAbort(executionId: string, context: ExecutionContext): Promise<void> {
    await db
      .update(workflowExecutions)
      .set({
        status: 'CANCELLED',
        error: 'Execution aborted',
        completedAt: new Date(),
        logs: context.logs,
      } as any)
      .where(eq(workflowExecutions.id, executionId));

    activeExecutions.delete(executionId);
  }

  private async waitForResume(executionId: string, abortSignal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const checkResume = () => {
        const execution = activeExecutions.get(executionId);
        if (execution?.status === 'RUNNING') {
          resolve();
        } else if (abortSignal.aborted) {
          resolve();
        }
      };

      const interval = setInterval(checkResume, 500);
      abortSignal.addEventListener('abort', () => {
        clearInterval(interval);
        resolve();
      });
    });
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<any> {
    const [execution] = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId));

    return execution;
  }

  async getWorkflowExecutions(workflowId: string, limit = 50): Promise<any[]> {
    return db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.workflowId, workflowId))
      .limit(limit);
  }
}
