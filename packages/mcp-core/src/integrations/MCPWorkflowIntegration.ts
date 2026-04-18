/**
 * MCP Workflow Integration Implementation
 *
 * Provides integration between MCP services and workflow execution systems.
 * Handles task delegation, execution tracking, and callback management.
 */

import { EventEmitter } from 'events';
import { IMCPBroker } from '../interfaces/IMCPBroker';
import { IMCPClient } from '../interfaces/IMCPClient';
import { MCPRequest, MCPResponse } from '../interfaces/IMCPMessage';
import {
  ErrorRecoveryConfig,
  ExecutionStatus,
  IMCPWorkflowIntegration,
  MCPCallback,
  MonitoringConfig,
  StepResult,
  Task,
  TaskExecutionStatus,
  TaskResult,
  WorkflowContext,
  WorkflowStep,
} from '../interfaces/IMCPWorkflowIntegration';
import { RetryPolicy } from '../types/common';
import { MCPErrorClass } from '../types/error';
import { CallbackHandlerConfig, MCPCallbackHandler } from './MCPCallbackHandler';
import { WorkflowExecutionMonitor } from './WorkflowExecutionMonitor';

/**
 * Configuration for MCP workflow integration
 */
export interface MCPWorkflowIntegrationConfig {
  /** MCP client for service communication */
  client: IMCPClient;

  /** MCP broker for service discovery */
  broker: IMCPBroker;

  /** Default timeout for operations */
  defaultTimeout: number;

  /** Default retry policy */
  defaultRetryPolicy: RetryPolicy;

  /** Error recovery configuration */
  errorRecovery: ErrorRecoveryConfig;

  /** Monitoring configuration */
  monitoring: MonitoringConfig;

  /** Callback handler configuration */
  callbackConfig?: CallbackHandlerConfig;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * MCP Workflow Integration implementation
 */
export class MCPWorkflowIntegration extends EventEmitter implements IMCPWorkflowIntegration {
  private readonly config: MCPWorkflowIntegrationConfig;
  private readonly executionTracker = new Map<string, ExecutionStatus>();
  private readonly callbackHandlers = new Map<string, (callback: MCPCallback) => Promise<void>>();
  private readonly monitor: WorkflowExecutionMonitor;
  private readonly callbackHandler: MCPCallbackHandler;
  private isInitialized = false;

  constructor(config: MCPWorkflowIntegrationConfig) {
    super();
    this.config = config;

    // Initialize monitoring and callback handling
    this.monitor = new WorkflowExecutionMonitor(config.monitoring, config.errorRecovery);

    const callbackConfig: CallbackHandlerConfig = config.callbackConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      maxRetryDelay: 10000,
      retryStrategy: 'exponential',
      callbackTimeout: 30000,
      maxQueueSize: 1000,
      enablePersistence: false,
      batchSize: 10,
      processingInterval: 1000,
    };

    this.callbackHandler = new MCPCallbackHandler(callbackConfig);

    this.setupEventHandlers();
  }

  /**
   * Initialize the workflow integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Start monitoring and callback handling
      this.monitor.start();
      this.callbackHandler.start();

      // Set up callback handling
      this.setupCallbackHandling();

      this.isInitialized = true;
      this.emit('initialized');

      if (this.config.debug) {
        console.log('[MCPWorkflowIntegration] Initialized successfully');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit(
        'error',
        new MCPErrorClass(-32603, `Failed to initialize workflow integration: ${err.message}`, {
          cause: err,
        })
      );
      throw err;
    }
  }

  /**
   * Shutdown the workflow integration
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.monitor.stop();
      this.callbackHandler.stop();

      this.isInitialized = false;
      this.emit('shutdown');

      if (this.config.debug) {
        console.log('[MCPWorkflowIntegration] Shutdown completed');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit(
        'error',
        new MCPErrorClass(-32603, `Failed to shutdown workflow integration: ${err.message}`, {
          cause: err,
        })
      );
      throw err;
    }
  }

  /**
   * Execute a workflow step using MCP service delegation
   */
  async executeWorkflowStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    const startTime = Date.now();

    try {
      if (this.config.debug) {
        console.log(`[MCPWorkflowIntegration] Executing workflow step: ${step.id}`);
      }

      // Validate step configuration
      this.validateWorkflowStep(step);

      // Create execution tracking
      const executionId = this.generateExecutionId(context.executionId, step.id);
      const executionStatus: ExecutionStatus = {
        executionId,
        status: TaskExecutionStatus.RUNNING,
        progress: 0,
        lastUpdated: new Date(),
        metadata: {
          workflowId: context.workflowId,
          stepId: step.id,
          stepType: step.type,
          mcpService: step.mcpService,
        },
      };

      this.trackExecution(executionId, TaskExecutionStatus.RUNNING);
      this.monitor.trackExecution(executionId, executionStatus);

      // Prepare MCP request based on step type
      const mcpRequest = await this.prepareMCPRequest(step, context);

      // Resolve service availability before dispatching request.
      const services = await this.config.broker.discoverServices({ name: step.mcpService });
      if (!services || services.length === 0) {
        throw new MCPErrorClass(-32004, `MCP service not found: ${step.mcpService}`);
      }

      // Execute the MCP request with retry logic
      const mcpResponse = await this.executeWithRetry(
        mcpRequest,
        step.mcpService,
        step.retryPolicy || this.config.defaultRetryPolicy,
        step.timeout || this.config.defaultTimeout
      );

      // Process the response
      const result = await this.processStepResponse(mcpResponse, step, context);

      // Update execution tracking
      this.updateExecution(executionId, TaskExecutionStatus.COMPLETED, result);
      this.monitor.updateExecutionStatus(
        executionId,
        TaskExecutionStatus.COMPLETED,
        100,
        'Step completed successfully',
        result
      );

      const duration = Date.now() - startTime;

      const stepResult: StepResult = {
        success: true,
        result: result,
        duration,
        metadata: {
          executionId,
          stepType: step.type,
          mcpService: step.mcpService,
          mcpMethod: step.mcpMethod,
        },
      };

      this.emit('stepCompleted', { step, context, result: stepResult });

      if (this.config.debug) {
        console.log(
          `[MCPWorkflowIntegration] Step completed successfully: ${step.id} (${duration}ms)`
        );
      }

      return stepResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      const stepResult: StepResult = {
        success: false,
        error: err.message,
        duration,
        metadata: {
          stepType: step.type,
          mcpService: step.mcpService,
          mcpMethod: step.mcpMethod,
          errorType: err.constructor.name,
        },
      };

      this.emit('stepFailed', { step, context, error: err, result: stepResult });

      if (this.config.debug) {
        console.error(`[MCPWorkflowIntegration] Step failed: ${step.id}`, err);
      }

      return stepResult;
    }
  }

  /**
   * Delegate a task to an MCP service
   */
  async delegateTask(task: Task, mcpService: string): Promise<TaskResult> {
    const startTime = new Date();
    const executionId = this.generateTaskExecutionId(task.id);

    try {
      if (this.config.debug) {
        console.log(
          `[MCPWorkflowIntegration] Delegating task: ${task.id} to service: ${mcpService}`
        );
      }

      // Track task execution
      const executionStatus: ExecutionStatus = {
        executionId,
        status: TaskExecutionStatus.RUNNING,
        progress: 0,
        lastUpdated: new Date(),
        metadata: {
          taskId: task.id,
          taskType: task.type,
          mcpService,
        },
      };

      this.trackExecution(executionId, TaskExecutionStatus.RUNNING);
      this.monitor.trackExecution(executionId, executionStatus);

      // Discover the target service
      const services = await this.config.broker.discoverServices({ name: mcpService });
      if (services.length === 0) {
        throw new MCPErrorClass(-32004, `MCP service not found: ${mcpService}`);
      }

      // Prepare task request
      const mcpRequest: MCPRequest = {
        jsonrpc: '2.0',
        id: executionId,
        method: 'tools/call',
        params: {
          name: task.type,
          arguments: task.parameters,
        },
      };

      // Execute the task
      const response = await this.config.client.sendRequest(mcpRequest);

      if (response.error) {
        throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
      }

      // Update execution tracking
      this.updateExecution(executionId, TaskExecutionStatus.COMPLETED, response.result);
      this.monitor.updateExecutionStatus(
        executionId,
        TaskExecutionStatus.COMPLETED,
        100,
        'Task completed successfully',
        response.result
      );

      const taskResult: TaskResult = {
        executionId,
        success: true,
        result: response.result,
        status: TaskExecutionStatus.COMPLETED,
        startedAt: startTime,
        completedAt: new Date(),
        metadata: {
          mcpService,
          taskType: task.type,
          duration: Date.now() - startTime.getTime(),
        },
      };

      this.emit('taskCompleted', { task, result: taskResult });

      if (this.config.debug) {
        console.log(`[MCPWorkflowIntegration] Task completed: ${task.id}`);
      }

      return taskResult;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Update execution tracking
      this.updateExecution(executionId, TaskExecutionStatus.FAILED, null, err.message);
      this.monitor.updateExecutionStatus(
        executionId,
        TaskExecutionStatus.FAILED,
        undefined,
        err.message
      );
      this.monitor.updateExecutionStatus(
        executionId,
        TaskExecutionStatus.FAILED,
        undefined,
        err.message
      );

      const taskResult: TaskResult = {
        executionId,
        success: false,
        error: err.message,
        status: TaskExecutionStatus.FAILED,
        startedAt: startTime,
        completedAt: new Date(),
        metadata: {
          mcpService,
          taskType: task.type,
          errorType: err.constructor.name,
        },
      };

      this.emit('taskFailed', { task, error: err, result: taskResult });

      if (this.config.debug) {
        console.error(`[MCPWorkflowIntegration] Task failed: ${task.id}`, err);
      }

      return taskResult;
    }
  }

  /**
   * Track the execution status of an MCP-delegated task
   */
  async trackMCPExecution(executionId: string): Promise<ExecutionStatus> {
    // Try to get from monitor first (more comprehensive)
    const monitorStatus = this.monitor.getExecutionStatus(executionId);
    if (monitorStatus) {
      return monitorStatus;
    }

    // Fallback to internal tracker
    const status = this.executionTracker.get(executionId);

    if (!status) {
      throw new MCPErrorClass(-32001, `Execution not found: ${executionId}`);
    }

    // Update last accessed time
    status.lastUpdated = new Date();

    return { ...status };
  }

  /**
   * Handle asynchronous callbacks from MCP services
   */
  async handleMCPCallback(callback: MCPCallback): Promise<void> {
    try {
      if (this.config.debug) {
        console.log(
          `[MCPWorkflowIntegration] Handling callback: ${callback.type} for execution: ${callback.executionId}`
        );
      }

      // Let the monitor handle the callback (it will update execution status)
      this.monitor.handleCallback(callback);

      // Also update internal tracker for backward compatibility
      const execution = this.executionTracker.get(callback.executionId);
      if (execution) {
        switch (callback.type) {
          case 'progress':
            execution.progress = callback.payload.progress;
            execution.message = callback.payload.message;
            execution.lastUpdated = new Date();
            break;

          case 'result':
            execution.status = TaskExecutionStatus.COMPLETED;
            execution.progress = 100;
            execution.lastUpdated = new Date();
            break;

          case 'error':
            execution.status = TaskExecutionStatus.FAILED;
            execution.message = callback.payload.error;
            execution.lastUpdated = new Date();
            break;

          case 'status':
            execution.status = callback.payload.status;
            execution.message = callback.payload.message;
            execution.lastUpdated = new Date();
            break;
        }
      }

      // Use callback handler for reliable delivery
      await this.callbackHandler.handleCallback(callback);

      this.emit('callbackReceived', callback);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('callbackError', { callback, error: err });

      if (this.config.debug) {
        console.error(`[MCPWorkflowIntegration] Callback handling failed:`, err);
      }
    }
  }

  /**
   * Register a callback handler for a specific execution
   */
  registerCallbackHandler(
    executionId: string,
    handler: (callback: MCPCallback) => Promise<void>
  ): void {
    this.callbackHandlers.set(executionId, handler);
    this.callbackHandler.registerHandler(executionId, handler);
  }

  /**
   * Unregister a callback handler
   */
  unregisterCallbackHandler(executionId: string): void {
    this.callbackHandlers.delete(executionId);
    this.callbackHandler.unregisterHandler(executionId);
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics(): {
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
  } {
    // Use monitor statistics if available (more comprehensive)
    const monitorMetrics = this.monitor.getMetrics();

    return {
      totalExecutions: monitorMetrics.totalExecutions,
      activeExecutions: monitorMetrics.activeExecutions,
      completedExecutions: monitorMetrics.completedExecutions,
      failedExecutions: monitorMetrics.failedExecutions,
    };
  }

  /**
   * Get detailed monitoring metrics
   */
  getMonitoringMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get callback handler statistics
   */
  getCallbackStatistics() {
    return this.callbackHandler.getStatistics();
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number, offset?: number) {
    return this.monitor.getExecutionHistory(limit, offset);
  }

  /**
   * Get execution events
   */
  getExecutionEvents(executionId?: string, limit?: number) {
    return this.monitor.getExecutionEvents(executionId, limit);
  }

  /**
   * Clean up completed executions older than specified time
   */
  cleanupExecutions(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    let cleanedCount = 0;

    for (const [executionId, status] of this.executionTracker.entries()) {
      if (
        status.lastUpdated < cutoffTime &&
        (status.status === TaskExecutionStatus.COMPLETED ||
          status.status === TaskExecutionStatus.FAILED)
      ) {
        this.executionTracker.delete(executionId);
        this.callbackHandlers.delete(executionId);
        cleanedCount++;
      }
    }

    if (this.config.debug && cleanedCount > 0) {
      console.log(`[MCPWorkflowIntegration] Cleaned up ${cleanedCount} old executions`);
    }

    return cleanedCount;
  }

  // Private helper methods

  private setupEventHandlers(): void {
    this.on('error', (error) => {
      if (this.config.debug) {
        console.error('[MCPWorkflowIntegration] Error:', error);
      }
    });
  }

  private setupCallbackHandling(): void {
    // Set up periodic cleanup of old executions
    setInterval(
      () => {
        this.cleanupExecutions();
        this.monitor.cleanupExecutions();
      },
      60 * 60 * 1000
    ); // Clean up every hour

    // Forward monitor events
    this.monitor.on('executionStarted', (event) => this.emit('executionStarted', event));
    this.monitor.on('executionUpdated', (event) => this.emit('executionUpdated', event));
    this.monitor.on('executionCancelled', (event) => this.emit('executionCancelled', event));
    this.monitor.on('alert', (alert) => this.emit('alert', alert));

    // Forward callback handler events
    this.callbackHandler.on('callbackProcessed', (event) => this.emit('callbackProcessed', event));
    this.callbackHandler.on('callbackFailed', (event) => this.emit('callbackFailed', event));
    this.callbackHandler.on('callbackError', (event) => this.emit('callbackError', event));
  }

  private validateWorkflowStep(step: WorkflowStep): void {
    if (!step.id) {
      throw new MCPErrorClass(-32602, 'Workflow step must have an ID');
    }

    if (!step.mcpService) {
      throw new MCPErrorClass(-32602, 'Workflow step must specify an MCP service');
    }

    if (!step.mcpMethod) {
      throw new MCPErrorClass(-32602, 'Workflow step must specify an MCP method');
    }

    if (!['mcp_call', 'mcp_resource', 'mcp_tool'].includes(step.type)) {
      throw new MCPErrorClass(-32602, 'Invalid workflow step type');
    }
  }

  private async prepareMCPRequest(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<MCPRequest> {
    const requestId = this.generateExecutionId(context.executionId, step.id);

    switch (step.type) {
      case 'mcp_call':
        return {
          jsonrpc: '2.0',
          id: requestId,
          method: step.mcpMethod,
          params: this.resolveParameters(step.parameters, context),
        };

      case 'mcp_resource':
        return {
          jsonrpc: '2.0',
          id: requestId,
          method: 'resources/read',
          params: {
            uri: step.parameters.uri,
            ...this.resolveParameters(step.parameters, context),
          },
        };

      case 'mcp_tool':
        return {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools/call',
          params: {
            name: step.mcpMethod,
            arguments: this.resolveParameters(step.parameters, context),
          },
        };

      default:
        throw new MCPErrorClass(-32602, `Unsupported step type: ${step.type}`);
    }
  }

  private resolveParameters(parameters: any, context: WorkflowContext): any {
    if (typeof parameters !== 'object' || parameters === null) {
      return parameters;
    }

    // Simple parameter resolution - replace ${variable} patterns
    const resolved = JSON.parse(JSON.stringify(parameters));

    const resolveValue = (value: any): any => {
      if (typeof value === 'string' && value.includes('${')) {
        return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
          const parts = varName.split('.');
          let result: any = context;

          for (const part of parts) {
            result = result?.[part];
          }

          return result !== undefined ? String(result) : match;
        });
      }

      if (Array.isArray(value)) {
        return value.map(resolveValue);
      }

      if (typeof value === 'object' && value !== null) {
        const resolvedObj: any = {};
        for (const [key, val] of Object.entries(value)) {
          resolvedObj[key] = resolveValue(val);
        }
        return resolvedObj;
      }

      return value;
    };

    return resolveValue(resolved);
  }

  private async executeWithRetry(
    request: MCPRequest,
    serviceName: string,
    retryPolicy: RetryPolicy,
    timeoutMs: number
  ): Promise<MCPResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt, retryPolicy);
          await this.sleep(delay);

          if (this.config.debug) {
            console.log(
              `[MCPWorkflowIntegration] Retrying request (attempt ${attempt + 1}/${retryPolicy.maxAttempts + 1})`
            );
          }
        }

        return await this.executeWithTimeout(request, timeoutMs);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const message = lastError.message.toLowerCase();
        if (message.includes('timeout')) {
          break;
        }

        if (attempt === retryPolicy.maxAttempts) {
          break;
        }
      }
    }

    throw new MCPErrorClass(
      -32603,
      `Request failed after ${retryPolicy.maxAttempts + 1} attempts: ${lastError?.message}`,
      { cause: lastError || undefined }
    );
  }

  private calculateRetryDelay(attempt: number, retryPolicy: RetryPolicy): number {
    const multiplier = retryPolicy.backoffMultiplier || 2;
    let delay: number;

    if (multiplier > 1) {
      // Exponential backoff
      delay = retryPolicy.baseDelay * Math.pow(multiplier, attempt - 1);
    } else {
      // Fixed delay
      delay = retryPolicy.baseDelay;
    }

    // Apply jitter if specified
    if (retryPolicy.jitter && retryPolicy.jitter > 0) {
      const jitterAmount = delay * retryPolicy.jitter * Math.random();
      delay = delay + jitterAmount;
    }

    return Math.min(delay, retryPolicy.maxDelay);
  }

  private async processStepResponse(
    response: MCPResponse,
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<any> {
    if (response.error) {
      throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
    }

    return response.result;
  }

  private trackExecution(
    executionId: string,
    status: TaskExecutionStatus,
    result?: any,
    error?: string
  ): void {
    this.executionTracker.set(executionId, {
      executionId,
      status,
      progress: status === TaskExecutionStatus.COMPLETED ? 100 : 0,
      message: error || undefined,
      intermediateResults: result ? [result] : undefined,
      lastUpdated: new Date(),
      metadata: {},
    });
  }

  private updateExecution(
    executionId: string,
    status: TaskExecutionStatus,
    result?: any,
    error?: string
  ): void {
    const execution = this.executionTracker.get(executionId);
    if (execution) {
      execution.status = status;
      execution.progress = status === TaskExecutionStatus.COMPLETED ? 100 : execution.progress;
      execution.message = error || execution.message;
      execution.lastUpdated = new Date();

      if (result !== undefined) {
        execution.intermediateResults = execution.intermediateResults || [];
        execution.intermediateResults.push(result);
      }
    }
  }

  private generateExecutionId(workflowExecutionId: string, stepId: string): string {
    return `${workflowExecutionId}-${stepId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTaskExecutionId(taskId: string): string {
    return `task-${taskId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeWithTimeout(request: MCPRequest, timeoutMs: number): Promise<MCPResponse> {
    return await new Promise<MCPResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new MCPErrorClass(-32000, `Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.config.client
        .sendRequest(request)
        .then((response) => {
          clearTimeout(timeout);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
}
