/**
 * MCP Workflow Integration Implementation
 * 
 * Provides integration between MCP services and workflow execution systems.
 * Handles task delegation, execution tracking, and callback management.
 */

import { EventEmitter } from 'events';
import { 
  IMCPWorkflowIntegration, 
  WorkflowStep, 
  WorkflowContext, 
  StepResult, 
  Task, 
  TaskResult, 
  ExecutionStatus, 
  MCPCallback, 
  TaskExecutionStatus,
  ErrorRecoveryConfig,
  MonitoringConfig
} from '../interfaces/IMCPWorkflowIntegration';
import { IMCPClient } from '../interfaces/IMCPClient';
import { IMCPBroker } from '../interfaces/IMCPBroker';
import { MCPRequest, MCPResponse } from '../interfaces/IMCPMessage';
import { RetryPolicy } from '../types/common';
import { MCPErrorClass } from '../types/error';

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
  private isInitialized = false;

  constructor(config: MCPWorkflowIntegrationConfig) {
    super();
    this.config = config;
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
      // Set up callback handling
      this.setupCallbackHandling();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      if (this.config.debug) {
        console.log('[MCPWorkflowIntegration] Initialized successfully');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', new MCPErrorClass(-32603, `Failed to initialize workflow integration: ${err.message}`, { originalError: err }));
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
      this.trackExecution(executionId, TaskExecutionStatus.RUNNING);

      // Prepare MCP request based on step type
      const mcpRequest = await this.prepareMCPRequest(step, context);
      
      // Execute the MCP request with retry logic
      const mcpResponse = await this.executeWithRetry(mcpRequest, step.mcpService, step.retryPolicy || this.config.defaultRetryPolicy);
      
      // Process the response
      const result = await this.processStepResponse(mcpResponse, step, context);
      
      // Update execution tracking
      this.updateExecution(executionId, TaskExecutionStatus.COMPLETED, result);
      
      const duration = Date.now() - startTime;
      
      const stepResult: StepResult = {
        success: true,
        result: result,
        duration,
        metadata: {
          executionId,
          stepType: step.type,
          mcpService: step.mcpService,
          mcpMethod: step.mcpMethod
        }
      };

      this.emit('stepCompleted', { step, context, result: stepResult });
      
      if (this.config.debug) {
        console.log(`[MCPWorkflowIntegration] Step completed successfully: ${step.id} (${duration}ms)`);
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
          errorType: err.constructor.name
        }
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
        console.log(`[MCPWorkflowIntegration] Delegating task: ${task.id} to service: ${mcpService}`);
      }

      // Track task execution
      this.trackExecution(executionId, TaskExecutionStatus.RUNNING);

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
          arguments: task.parameters
        }
      };

      // Execute the task
      const response = await this.config.client.sendRequest(mcpRequest);
      
      if (response.error) {
        throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
      }

      // Update execution tracking
      this.updateExecution(executionId, TaskExecutionStatus.COMPLETED, response.result);

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
          duration: Date.now() - startTime.getTime()
        }
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
          errorType: err.constructor.name
        }
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
        console.log(`[MCPWorkflowIntegration] Handling callback: ${callback.type} for execution: ${callback.executionId}`);
      }

      // Update execution status based on callback
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

      // Execute registered callback handlers
      const handler = this.callbackHandlers.get(callback.executionId);
      if (handler) {
        await handler(callback);
      }

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
  registerCallbackHandler(executionId: string, handler: (callback: MCPCallback) => Promise<void>): void {
    this.callbackHandlers.set(executionId, handler);
  }

  /**
   * Unregister a callback handler
   */
  unregisterCallbackHandler(executionId: string): void {
    this.callbackHandlers.delete(executionId);
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
    const executions = Array.from(this.executionTracker.values());
    
    return {
      totalExecutions: executions.length,
      activeExecutions: executions.filter(e => e.status === TaskExecutionStatus.RUNNING || e.status === TaskExecutionStatus.PENDING).length,
      completedExecutions: executions.filter(e => e.status === TaskExecutionStatus.COMPLETED).length,
      failedExecutions: executions.filter(e => e.status === TaskExecutionStatus.FAILED).length
    };
  }

  /**
   * Clean up completed executions older than specified time
   */
  cleanupExecutions(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    let cleanedCount = 0;
    
    for (const [executionId, status] of this.executionTracker.entries()) {
      if (status.lastUpdated < cutoffTime && 
          (status.status === TaskExecutionStatus.COMPLETED || status.status === TaskExecutionStatus.FAILED)) {
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
    setInterval(() => {
      this.cleanupExecutions();
    }, 60 * 60 * 1000); // Clean up every hour
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

  private async prepareMCPRequest(step: WorkflowStep, context: WorkflowContext): Promise<MCPRequest> {
    const requestId = this.generateExecutionId(context.executionId, step.id);
    
    switch (step.type) {
      case 'mcp_call':
        return {
          jsonrpc: '2.0',
          id: requestId,
          method: step.mcpMethod,
          params: this.resolveParameters(step.parameters, context)
        };
        
      case 'mcp_resource':
        return {
          jsonrpc: '2.0',
          id: requestId,
          method: 'resources/read',
          params: {
            uri: step.parameters.uri,
            ...this.resolveParameters(step.parameters, context)
          }
        };
        
      case 'mcp_tool':
        return {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools/call',
          params: {
            name: step.mcpMethod,
            arguments: this.resolveParameters(step.parameters, context)
          }
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

  private async executeWithRetry(request: MCPRequest, serviceName: string, retryPolicy: RetryPolicy): Promise<MCPResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt, retryPolicy);
          await this.sleep(delay);
          
          if (this.config.debug) {
            console.log(`[MCPWorkflowIntegration] Retrying request (attempt ${attempt + 1}/${retryPolicy.maxAttempts + 1})`);
          }
        }
        
        return await this.config.client.sendRequest(request);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retryPolicy.maxAttempts) {
          break;
        }
      }
    }
    
    throw new MCPErrorClass(-32603, `Request failed after ${retryPolicy.maxAttempts + 1} attempts: ${lastError?.message}`, { originalError: lastError });
  }

  private calculateRetryDelay(attempt: number, retryPolicy: RetryPolicy): number {
    switch (retryPolicy.strategy) {
      case 'exponential':
        return Math.min(retryPolicy.baseDelay * Math.pow(2, attempt - 1), retryPolicy.maxDelay);
      case 'linear':
        return Math.min(retryPolicy.baseDelay * attempt, retryPolicy.maxDelay);
      case 'fixed':
      default:
        return retryPolicy.baseDelay;
    }
  }

  private async processStepResponse(response: MCPResponse, step: WorkflowStep, context: WorkflowContext): Promise<any> {
    if (response.error) {
      throw new MCPErrorClass(response.error.code, response.error.message, response.error.data);
    }
    
    return response.result;
  }

  private trackExecution(executionId: string, status: TaskExecutionStatus, result?: any, error?: string): void {
    this.executionTracker.set(executionId, {
      executionId,
      status,
      progress: status === TaskExecutionStatus.COMPLETED ? 100 : 0,
      message: error || undefined,
      intermediateResults: result ? [result] : undefined,
      lastUpdated: new Date(),
      metadata: {}
    });
  }

  private updateExecution(executionId: string, status: TaskExecutionStatus, result?: any, error?: string): void {
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}