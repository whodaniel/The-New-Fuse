import { Injectable, Logger } from '@nestjs/common';
import { Task, Pipeline } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface RecoveryContext {
  retries?: number;
  lastAttempt?: Date;
}

@Injectable()
export class ErrorRecoverySystem {
  private readonly logger = new Logger(ErrorRecoverySystem.name);
  private readonly recoveryStrategies: Map<string, (entity: any, context?: RecoveryContext) => Promise<void>> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies(): void {
    this.recoveryStrategies.set('task', this.handleTaskFailure.bind(this));
    this.recoveryStrategies.set('pipeline', this.handlePipelineFailure.bind(this));
  }

  async attemptRecovery(entityType: string, entity: any, context?: RecoveryContext): Promise<void> {
    const strategy = this.recoveryStrategies.get(entityType);
    if (strategy) {
      this.logger.log(`Attempting recovery for ${entityType} with ID: ${entity.id}`);
      try {
        await strategy(entity, context);
        this.eventEmitter.emit(`${entityType}.recovery.success`, { entityId: entity.id });
      } catch (error) {
        this.logger.error(`Recovery failed for ${entityType} with ID: ${entity.id}`, error.stack);
        this.eventEmitter.emit(`${entityType}.recovery.failed`, { entityId: entity.id, error });
        this.escalateFailure(entityType, entity, error);
      }
    } else {
      this.logger.warn(`No recovery strategy found for entity type: ${entityType}`);
      this.escalateFailure(entityType, entity, new Error(`No recovery strategy defined for ${entityType}.`));
    }
  }

  private async handleTaskFailure(task: Task, context: RecoveryContext = { retries: 0 }): Promise<void> {
    this.logger.log(`Executing recovery strategy for Task ID: ${task.id}`);
    const { retries = 0 } = context;
    if (retries < 3) {
      this.logger.log(`Retrying task... (Attempt ${retries + 1})`);
      // In a real implementation, you would re-queue the task or trigger its execution again.
      // this.taskService.retry(task.id, { ...context, retries: retries + 1 });
      this.eventEmitter.emit('task.retry', { taskId: task.id, context: { ...context, retries: retries + 1 } });
    } else {
      throw new Error('Maximum retry attempts reached for task.');
    }
  }

  private async handlePipelineFailure(pipeline: Pipeline, context: RecoveryContext = {}): Promise<void> {
    this.logger.log(`Executing recovery strategy for Pipeline ID: ${pipeline.id}`);
    // Example: Notify the pipeline owner and reset its status to 'FAILED'
    this.eventEmitter.emit('pipeline.failed', { pipelineId: pipeline.id });
    // Or, attempt to restart the pipeline from the point of failure
    // this.pipelineService.restartFromFailure(pipeline.id, { ...context });
    throw new Error('Pipeline recovery is not yet fully implemented.');
  }

  private escalateFailure(entityType: string, entity: any, error: Error): void {
    this.logger.error(`Escalating failure for ${entityType} ID: ${entity.id}. Manual intervention may be required.`);
    this.eventEmitter.emit('system.escalation', {
      entityType,
      entityId: entity.id,
      error,
      message: `Failed to recover ${entityType} after multiple attempts.`,
      needsManualIntervention: true,
    });
  }
}
