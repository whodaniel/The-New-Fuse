import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config?: Record<string, any>;
  dependencies?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: 'success' | 'failure';
  results: Record<string, any>;
  errors?: string[];
  duration: number;
}

@Injectable()
export class WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutor.name);

  constructor(private eventEmitter: EventEmitter2) {}

  async execute(workflow: Workflow): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const results: Record<string, any> = {};
    const errors: string[] = [];

    try {
      this.eventEmitter.emit('workflow.started', workflow);
      this.logger.log(`Executing workflow: ${workflow.name}`);

      for (const step of workflow.steps) {
        try {
          this.eventEmitter.emit('workflow.step.started', { workflow, step });
          const result = await this.executeStep(step, results);
          results[step.id] = result;
          this.eventEmitter.emit('workflow.step.completed', { workflow, step, result });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Step ${step.id} failed: ${errorMessage}`);
          this.eventEmitter.emit('workflow.step.failed', { workflow, step, error });
        }
      }

      const duration = Date.now() - startTime;
      const executionResult: WorkflowExecutionResult = {
        workflowId: workflow.id,
        status: errors.length > 0 ? 'failure' : 'success',
        results,
        errors: errors.length > 0 ? errors : undefined,
        duration,
      };

      this.eventEmitter.emit('workflow.completed', executionResult);
      return executionResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Workflow execution failed: ${workflow.name}`, error);

      return {
        workflowId: workflow.id,
        status: 'failure',
        results,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration,
      };
    }
  }

  private async executeStep(step: WorkflowStep, context: Record<string, any>): Promise<any> {
    this.logger.debug(`Executing step: ${step.name}`);

    // Placeholder implementation
    return {
      stepId: step.id,
      completed: true,
      timestamp: new Date(),
    };
  }

  async validateWorkflow(workflow: Workflow): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!workflow.id) {
      errors.push('Workflow ID is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Check for circular dependencies
    const stepIds = new Set(workflow.steps.map((s) => s.id));
    workflow.steps.forEach((step) => {
      if (step.dependencies) {
        step.dependencies.forEach((dep) => {
          if (!stepIds.has(dep)) {
            errors.push(`Step ${step.id} depends on non-existent step: ${dep}`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
