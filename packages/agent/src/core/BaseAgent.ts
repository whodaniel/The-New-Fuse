import { EventEmitter } from 'events';

import { Priority } from '../bridges';
import { ContextManager, ContextType } from '../context/manager';
import { ErrorRecovery, ErrorSeverity } from '../error/recovery';
import { AgentState } from '../interfaces/agent.interface';
import { MetricsRegistry, PerformanceMonitor } from '../monitoring/metrics';
import { Logger } from '../types/core';

import type { Redis } from 'ioredis';
import type { BaseBridge, MessageType } from '../bridges';
import type { ErrorCategory } from '../error/recovery';
import type { AgentConfig, Task } from '../interfaces/agent.interface';

// Create logger
const logger = new Logger('BaseAgent');

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected bridge?: BaseBridge;
  protected contextManager: ContextManager;
  protected metrics: MetricsRegistry;
  protected monitor: PerformanceMonitor;
  protected errorRecovery: ErrorRecovery;

  protected state: AgentState = AgentState.INITIALIZING;
  protected tasks: Map<string, Task> = new Map();
  protected context: Map<string, any> = new Map();
  protected shouldRun: boolean = false;
  protected taskProcessor?: Promise<void>;

  constructor(config: AgentConfig, bridge?: BaseBridge, redisClient?: Redis) {
    super();
    this.config = {
      modelName: 'gpt-4',
      maxConcurrentTasks: 5,
      taskTimeout: 300,
      retryLimit: 3,
      memoryLimit: 1000,
      ...config,
    };
    this.bridge = bridge;

    // Initialize context manager
    this.contextManager = new ContextManager(ContextType.AGENT, config.agentId, redisClient);

    // Initialize monitoring
    this.monitor = new PerformanceMonitor(config.agentId, redisClient);

    // Initialize remaining state
    this.metrics = new MetricsRegistry(config.agentId);
    this.errorRecovery = new ErrorRecovery();
  }

  abstract processMessage(message: Record<string, unknown>): Promise<void>;
  abstract executeTask(task: Task): Promise<Record<string, unknown>>;

  protected async sendMessage(
    message: Record<string, unknown>,
    messageType: MessageType,
    priority: Priority = Priority.MEDIUM
  ): Promise<void> {
    if (!this.bridge) {
      throw new Error('Bridge not initialized');
    }
    await this.bridge.sendMessage(message, messageType, priority);
  }

  protected async handleError(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity
  ): Promise<void> {
    logger.error(`Agent ${this.config.agentId} encountered error:`, {
      error: error.message,
      category,
      severity,
    });

    await this.errorRecovery.handleError(error, category, severity);

    if (severity === ErrorSeverity.FATAL) {
      this.terminate();
    }
  }

  protected async start(): Promise<void> {
    if (this.shouldRun) {
      return;
    }

    this.shouldRun = true;
    await this.processNextTask();
  }

  protected async stop(): Promise<void> {
    this.shouldRun = false;
  }

  protected async terminate(): Promise<void> {
    await this.stop();
    this.state = AgentState.TERMINATED;
    this.emit('terminated');
  }

  protected async processNextTask(): Promise<void> {
    if (!this.shouldRun || this.tasks.size === 0) {
      return;
    }

    // Find next task to process
    const [taskId, task] = Array.from(this.tasks.entries()).find(
      ([_, t]) => t.status === 'pending'
    ) || [null, null];

    if (!taskId || !task) {
      return;
    }

    task.status = 'running';
    task.startTime = Date.now();

    try {
      const result = await this.executeTask(task);
      task.status = 'completed';
      task.result = result;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error : new Error(String(error));
    }
  }
}
