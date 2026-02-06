import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface CascadeOptions {
  maxDepth?: number;
  timeout?: number;
  retries?: number;
  failOnError?: boolean;
}

export enum CascadeMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  WATERFALL = 'waterfall',
  PIPELINE = 'pipeline',
}

export enum CascadeState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface CascadeController {
  id: string;
  name: string;
  mode: CascadeMode;
  state: CascadeState;
  options: CascadeOptions;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CascadeStep {
  id: string;
  name: string;
  handler: (input: any, context: CascadeContext) => Promise<any>;
  dependencies?: string[];
  optional?: boolean;
  timeout?: number;
  retries?: number;
}

export interface CascadeContext {
  controllerId: string;
  stepId: string;
  input: any;
  output?: any;
  error?: Error;
  metadata: Record<string, any>;
  startTime: Date;
  endTime?: Date;
}

@Injectable()
export class CascadeService extends EventEmitter {
  private readonly logger = new Logger(CascadeService.name);
  private readonly controllers = new Map<string, CascadeController>();
  private readonly steps = new Map<string, CascadeStep[]>();
  private readonly activeExecutions = new Map<string, Promise<any>>();

  constructor() {
    super();
    this.logger.log('CascadeService initialized');
  }

  createController(name: string, mode: CascadeMode, options?: CascadeOptions): CascadeController {
    const id = this.generateId();
    const controller: CascadeController = {
      id,
      name,
      mode,
      state: CascadeState.IDLE,
      options: {
        maxDepth: 10,
        timeout: 30000,
        retries: 3,
        failOnError: true,
        ...options,
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.controllers.set(id, controller);
    this.steps.set(id, []);
    this.logger.debug(`Created cascade controller: ${name} (${id})`);
    this.emit('controllerCreated', controller);
    return controller;
  }

  addStep(controllerId: string, step: Omit<CascadeStep, 'id'>): CascadeStep {
    const controller = this.controllers.get(controllerId);
    if (!controller) {
      throw new Error(`Controller not found: ${controllerId}`);
    }

    const stepId = this.generateId();
    const fullStep: CascadeStep = {
      ...step,
      id: stepId,
    };

    const steps = this.steps.get(controllerId) || [];
    steps.push(fullStep);
    this.steps.set(controllerId, steps);

    controller.updatedAt = new Date();
    this.controllers.set(controllerId, controller);

    this.logger.debug(`Added step to controller ${controllerId}: ${step.name} (${stepId})`);
    this.emit('stepAdded', controllerId, fullStep);
    return fullStep;
  }

  async executeController(controllerId: string, input: any): Promise<any> {
    const controller = this.controllers.get(controllerId);
    if (!controller) {
      throw new Error(`Controller not found: ${controllerId}`);
    }

    if (this.activeExecutions.has(controllerId)) {
      throw new Error(`Controller already executing: ${controllerId}`);
    }

    const steps = this.steps.get(controllerId) || [];
    if (steps.length === 0) {
      throw new Error(`No steps defined for controller: ${controllerId}`);
    }

    this.updateControllerState(controllerId, CascadeState.RUNNING);
    const execution = this.executeSteps(controllerId, steps, input);
    this.activeExecutions.set(controllerId, execution);

    try {
      const result = await execution;
      this.updateControllerState(controllerId, CascadeState.COMPLETED);
      this.activeExecutions.delete(controllerId);
      this.logger.debug(`Controller execution completed: ${controllerId}`);
      this.emit('executionCompleted', controllerId, result);
      return result;
    } catch (error) {
      this.updateControllerState(controllerId, CascadeState.FAILED);
      this.activeExecutions.delete(controllerId);
      this.logger.error(`Controller execution failed: ${controllerId}`, error);
      this.emit('executionFailed', controllerId, error);
      throw error;
    }
  }

  async cancelExecution(controllerId: string): Promise<void> {
    const controller = this.controllers.get(controllerId);
    if (!controller) {
      throw new Error(`Controller not found: ${controllerId}`);
    }

    this.updateControllerState(controllerId, CascadeState.CANCELLED);
    this.activeExecutions.delete(controllerId);
    this.logger.debug(`Cancelled controller execution: ${controllerId}`);
    this.emit('executionCancelled', controllerId);
  }

  getController(controllerId: string): CascadeController | undefined {
    return this.controllers.get(controllerId);
  }

  getSteps(controllerId: string): CascadeStep[] {
    return this.steps.get(controllerId) || [];
  }

  getAllControllers(): CascadeController[] {
    return Array.from(this.controllers.values());
  }

  deleteController(controllerId: string): boolean {
    const controller = this.controllers.get(controllerId);
    if (!controller) {
      return false;
    }

    // Cancel execution if running
    if (this.activeExecutions.has(controllerId)) {
      this.cancelExecution(controllerId);
    }

    this.controllers.delete(controllerId);
    this.steps.delete(controllerId);
    this.logger.debug(`Deleted controller: ${controllerId}`);
    this.emit('controllerDeleted', controllerId);
    return true;
  }

  private async executeSteps(controllerId: string, steps: CascadeStep[], input: any): Promise<any> {
    const controller = this.controllers.get(controllerId)!;

    switch (controller.mode) {
      case CascadeMode.SEQUENTIAL:
        return this.executeSequential(controllerId, steps, input);
      case CascadeMode.PARALLEL:
        return this.executeParallel(controllerId, steps, input);
      case CascadeMode.WATERFALL:
        return this.executeWaterfall(controllerId, steps, input);
      case CascadeMode.PIPELINE:
        return this.executePipeline(controllerId, steps, input);
      default:
        throw new Error(`Unsupported cascade mode: ${controller.mode}`);
    }
  }

  private async executeSequential(
    controllerId: string,
    steps: CascadeStep[],
    input: any,
  ): Promise<any> {
    const results: any[] = [];
    const controller = this.controllers.get(controllerId)!;

    for (const step of steps) {
      const context: CascadeContext = {
        controllerId,
        stepId: step.id,
        input,
        metadata: {},
        startTime: new Date(),
      };

      try {
        const result = await this.executeStep(step, input, context);
        results.push(result);
        this.emit('stepCompleted', controllerId, step.id, result);
      } catch (error) {
        context.error = error as Error;
        context.endTime = new Date();
        this.emit('stepFailed', controllerId, step.id, error);
        if (controller.options.failOnError && !step.optional) {
          throw error;
        }
      }
    }

    return results;
  }

  private async executeParallel(
    controllerId: string,
    steps: CascadeStep[],
    input: any,
  ): Promise<any[]> {
    const controller = this.controllers.get(controllerId)!;
    const promises = steps.map(async (step) => {
      const context: CascadeContext = {
        controllerId,
        stepId: step.id,
        input,
        metadata: {},
        startTime: new Date(),
      };

      try {
        const result = await this.executeStep(step, input, context);
        this.emit('stepCompleted', controllerId, step.id, result);
        return result;
      } catch (error) {
        context.error = error as Error;
        context.endTime = new Date();
        this.emit('stepFailed', controllerId, step.id, error);
        if (controller.options.failOnError && !step.optional) {
          throw error;
        }
        return null;
      }
    });

    return Promise.all(promises);
  }

  private async executeWaterfall(
    controllerId: string,
    steps: CascadeStep[],
    input: any,
  ): Promise<any> {
    let currentInput = input;
    const controller = this.controllers.get(controllerId)!;

    for (const step of steps) {
      const context: CascadeContext = {
        controllerId,
        stepId: step.id,
        input: currentInput,
        metadata: {},
        startTime: new Date(),
      };

      try {
        const result = await this.executeStep(step, currentInput, context);
        currentInput = result;
        this.emit('stepCompleted', controllerId, step.id, result);
      } catch (error) {
        context.error = error as Error;
        context.endTime = new Date();
        this.emit('stepFailed', controllerId, step.id, error);
        if (controller.options.failOnError && !step.optional) {
          throw error;
        }
      }
    }

    return currentInput;
  }

  private async executePipeline(
    controllerId: string,
    steps: CascadeStep[],
    input: any,
  ): Promise<any> {
    const controller = this.controllers.get(controllerId)!;
    const executed = new Set<string>();
    const results = new Map<string, any>();

    const executeWithDependencies = async (step: CascadeStep): Promise<any> => {
      if (executed.has(step.id)) {
        return results.get(step.id);
      }

      // Execute dependencies first
      if (step.dependencies && step.dependencies.length > 0) {
        for (const depId of step.dependencies) {
          const depStep = steps.find((s) => s.id === depId);
          if (!depStep) {
            throw new Error(`Dependency not found: ${depId}`);
          }
          await executeWithDependencies(depStep);
        }
      }

      const context: CascadeContext = {
        controllerId,
        stepId: step.id,
        input,
        metadata: {},
        startTime: new Date(),
      };

      try {
        const result = await this.executeStep(step, input, context);
        executed.add(step.id);
        results.set(step.id, result);
        this.emit('stepCompleted', controllerId, step.id, result);
        return result;
      } catch (error) {
        context.error = error as Error;
        context.endTime = new Date();
        this.emit('stepFailed', controllerId, step.id, error);
        if (controller.options.failOnError && !step.optional) {
          throw error;
        }
        executed.add(step.id);
        results.set(step.id, null);
        return null;
      }
    };

    // Execute all steps with dependency resolution
    for (const step of steps) {
      await executeWithDependencies(step);
    }

    return Array.from(results.values());
  }

  private async executeStep(step: CascadeStep, input: any, context: CascadeContext): Promise<any> {
    const timeout = step.timeout || 30000;
    const retries = step.retries || 3;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const promise = step.handler(input, context);
        const result = await Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Step ${step.id} timed out after ${timeout}ms`)),
              timeout,
            ),
          ),
        ]);
        return result;
      } catch (error) {
        if (attempt === retries - 1) {
          throw error;
        }

        this.logger.debug(`Step ${step.id} attempt ${attempt + 1} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private updateControllerState(controllerId: string, state: CascadeState): void {
    const controller = this.controllers.get(controllerId);
    if (controller) {
      controller.state = state;
      controller.updatedAt = new Date();
      this.controllers.set(controllerId, controller);
      this.emit('stateChanged', controllerId, state);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
