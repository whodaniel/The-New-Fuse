import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  errorType: string;
  priority: number;
  actions: RecoveryAction[];
  enabled: boolean;
  metadata: Record<string, unknown>;
}

interface RecoveryAction {
  type: 'retry' | 'rollback' | 'compensate' | 'notify' | 'custom';
  config: Record<string, unknown>;
  timeout?: number;
  retries?: number;
}

interface RecoveryAttempt {
  id: string;
  errorId: string;
  strategyId: string;
  status: 'pending' | 'in_progress' | 'succeeded' | 'failed';
  startTime: Date;
  endTime?: Date;
  actions: {
    type: string;
    status: string;
    timestamp: Date;
    result?: unknown;
    error?: string;
  }[];
  metadata: Record<string, unknown>;
}

interface ErrorContext {
  processingId: string;
  component: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ErrorRecoveryService extends EventEmitter implements OnModuleInit {
  private readonly logger: Logger;
  private readonly redis: Redis;
  private readonly db: DatabaseService;
  private readonly strategies: Map<string, RecoveryStrategy> = new Map();
  private readonly recoveryHandlers: Map<string, (error: Error) => Promise<void>> = new Map();
  private readonly activeRecoveries: Map<string, RecoveryAttempt> = new Map();

  constructor(
    logger: Logger,
    redis: Redis,
    db: DatabaseService
  ) {
    super();
    this.logger = logger;
    this.redis = redis;
    this.db = db;
  }

  async onModuleInit(): Promise<void> {
    await this.loadRecoveryStrategies();
  }

  private async loadRecoveryStrategies(): Promise<void> {
    try {
      const strategies = await this.db.recoveryStrategies.findMany({
        where: { enabled: true }
      });

      for (const strategy of strategies) {
        this.strategies.set(strategy.id, {
          ...strategy,
          actions: JSON.parse(strategy.actions as string),
          metadata: JSON.parse(strategy.metadata as string)
        });
      }

      this.logger.info(`Loaded ${strategies.length} recovery strategies`);
    } catch (error: unknown) {
      this.logger.error('Failed to load recovery strategies:', error);
    }
  }

  registerRecoveryHandler(
    type: string,
    handler: (error: Error) => Promise<void>
  ): void {
    this.recoveryHandlers.set(type, handler);
  }

  async createStrategy(
    strategy: Omit<RecoveryStrategy, 'id'>
  ): Promise<RecoveryStrategy> {
    const id = crypto.randomUUID();
    const newStrategy = {
      ...strategy,
      id,
      enabled: true
    };

    // Persist strategy
    await this.db.recoveryStrategies.create({
      data: {
        id,
        name: strategy.name,
        description: strategy.description,
        errorType: strategy.errorType,
        priority: strategy.priority,
        actions: JSON.stringify(strategy.actions),
        enabled: true,
        metadata: JSON.stringify(strategy.metadata)
      }
    });

    this.strategies.set(id, newStrategy);
    return newStrategy;
  }

  async updateStrategy(
    id: string,
    updates: Partial<RecoveryStrategy>
  ): Promise<RecoveryStrategy> {
    const strategy = this.strategies.get(id);
    if (!strategy) {
      throw new Error(`Recovery strategy ${id} not found`);
    }

    const updatedStrategy = {
      ...strategy,
      ...updates
    };

    // Update in database
    await this.db.recoveryStrategies.update({
      where: { id },
      data: {
        ...updates,
        actions: updates.actions ? JSON.stringify(updatedStrategy.actions) : undefined,
        metadata: updates.metadata ? JSON.stringify(updatedStrategy.metadata) : undefined
      }
    });

    this.strategies.set(id, updatedStrategy);
    return updatedStrategy;
  }

  async attemptRecovery(
    error: Error,
    errorId: string,
    context: Record<string, unknown> = {}
  ): Promise<RecoveryAttempt> {
    try {
      // Find applicable strategies
      const strategies = Array.from(this.strategies.values())
        .filter(s => s.enabled && s.errorType === (error as any).constructor.name)
        .sort((a, b) => b.priority - a.priority);

      if (strategies.length === 0) {
        throw new Error(`No recovery strategies found for ${(error as any).constructor.name}`);
      }

      // Create recovery attempt
      const attempt: RecoveryAttempt = {
        id: crypto.randomUUID(),
        errorId,
        strategyId: strategies[0].id,
        status: 'pending',
        startTime: new Date(),
        actions: [],
        metadata: {
          ...context,
          errorType: (error as any).constructor.name,
          errorMessage: error.message
        }
      };

      // Store attempt
      await this.persistRecoveryAttempt(attempt);
      this.activeRecoveries.set(attempt.id, attempt);

      // Execute recovery
      await this.executeRecovery(attempt, strategies[0], error);

      // Update status
      attempt.status = 'succeeded';
      attempt.endTime = new Date();
      await this.updateRecoveryStatus(attempt);

      // Remove from active
      this.activeRecoveries.delete(attempt.id);

      // Emit success event
      this.emit('recoverySucceeded', { attempt, error });

      return attempt;
    } catch (recoveryError) {
      this.logger.error('Recovery failed:', recoveryError);
      throw recoveryError;
    }
  }

  private async persistRecoveryAttempt(
    attempt: RecoveryAttempt
  ): Promise<void> {
    await this.db.recoveryAttempts.create({
      data: {
        id: attempt.id,
        errorId: attempt.errorId,
        strategyId: attempt.strategyId,
        status: attempt.status,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        actions: JSON.stringify(attempt.actions),
        metadata: JSON.stringify(attempt.metadata)
      }
    });
  }

  private async executeRecovery(
    attempt: RecoveryAttempt,
    strategy: RecoveryStrategy,
    error: Error
  ): Promise<void> {
    try {
      attempt.status = 'in_progress';
      await this.updateRecoveryStatus(attempt);

      // Execute each action in sequence
      for (const action of strategy.actions) {
        const actionResult = {
          type: action.type,
          status: 'pending',
          timestamp: new Date()
        };
        attempt.actions.push(actionResult);

        try {
          const result = await this.executeAction(action, error);
          actionResult.status = 'succeeded';
          actionResult.result = result;
        } catch (actionError) {
          actionResult.status = 'failed';
          actionResult.error = actionError instanceof Error ? actionError.message : 'Unknown error';
          throw actionError;
        }
      }

      attempt.status = 'succeeded';
      attempt.endTime = new Date();
      await this.updateRecoveryStatus(attempt);

      // Emit success event
      this.emit('recoverySucceeded', { attempt, error });
    } catch (error) {
      attempt.status = 'failed';
      attempt.endTime = new Date();
      await this.updateRecoveryStatus(attempt);

      // Emit failure event
      this.emit('recoveryFailed', { attempt, error });

      throw error;
    } finally {
      this.activeRecoveries.delete(attempt.id);
    }
  }

  private async executeAction(
    action: RecoveryAction,
    error: Error
  ): Promise<any> {
    switch (action.type) {
      case 'retry':
        return this.executeRetryAction(action, error);
      case 'rollback':
        return this.executeRollbackAction(action, error);
      case 'compensate':
        return this.executeCompensationAction(action, error);
      case 'notify':
        return this.executeNotificationAction(action, error);
      case 'custom':
        return this.executeCustomAction(action, error);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeRetryAction(
    action: RecoveryAction,
    error: Error
  ): Promise<void> {
    const maxRetries = action.retries || 3;
    const delay = (action.config as any).delay || 1000; // ms

    for (let i = 0; i < maxRetries; i++) {
      try {
        const handler = this.recoveryHandlers.get((error as any).constructor.name);
        if (handler) {
          await handler(error);
          return;
        }
        throw new Error(`No handler found for ${(error as any).constructor.name}`);
      } catch (retryError) {
        if (i === maxRetries - 1) {
          throw retryError;
        }
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  private async executeRollbackAction(
    action: RecoveryAction,
    error: Error
  ): Promise<void> {
    // Implement rollback logic
  }

  private async executeCompensationAction(
    action: RecoveryAction,
    error: Error
  ): Promise<void> {
    // Implement compensation logic
  }

  private async executeNotificationAction(
    action: RecoveryAction,
    error: Error
  ): Promise<void> {
    // Implement notification logic
  }

  private async executeCustomAction(
    action: RecoveryAction,
    error: Error
  ): Promise<void> {
    const handler = (action.config as any).handler;
    if (typeof handler === 'function') {
      await handler(error);
    }
  }

  private async updateRecoveryStatus(
    attempt: RecoveryAttempt
  ): Promise<void> {
    await this.db.recoveryAttempts.update({
      where: { id: attempt.id },
      data: {
        status: attempt.status,
        endTime: attempt.endTime,
        actions: JSON.stringify(attempt.actions)
      }
    });
  }

  async getRecoveryAttempt(
    id: string
  ): Promise<RecoveryAttempt | null> {
    return this.db.recoveryAttempts.findUnique({
      where: { id }
    });
  }

  async getRecoveryAttempts(
    options: {
      errorId?: string;
      strategyId?: string;
      status?: string;
      startTime?: Date;
      endTime?: Date;
    } = {}
  ): Promise<RecoveryAttempt[]> {
    return this.db.recoveryAttempts.findMany({
      where: {
        errorId: options.errorId,
        strategyId: options.strategyId,
        status: options.status,
        startTime: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { startTime: 'desc' }
    });
  }

  async cleanup(
    options: {
      olderThan?: Date;
      status?: string;
    } = {}
  ): Promise<void> {
    // Clear active recoveries that are stuck
    for (const [id, attempt] of this.activeRecoveries.entries()) {
      if (
        attempt.status === 'in_progress' &&
        Date.now() - (attempt.startTime as any).getTime() > 3600000 // 1 hour
      ) {
        attempt.status = 'failed';
        attempt.endTime = new Date();
        await this.updateRecoveryStatus(attempt);
        this.activeRecoveries.delete(id);
      }
    }

    // Clear database records
    await this.db.recoveryAttempts.deleteMany({
      where: {
        startTime: options.olderThan ? { lt: options.olderThan } : undefined,
        status: options.status
      }
    });
  }

  async handleError(
    error: Error, 
    context: ErrorContext
  ): Promise<void> {
    try {
      this.logger.error('Handling error:', {
        error: error.message,
        context
      });
      
      await this.attemptRecovery(error, crypto.randomUUID(), context);
    } catch (recoveryError) {
      this.logger.error('Error in error recovery:', {
        originalError: error.message,
        recoveryError: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
      });
    }
  }
}
