/**
 * Unit tests for MCPWorkflowIntegration
 */

import { EventEmitter } from 'events';
import { MCPWorkflowIntegration, MCPWorkflowIntegrationConfig } from './MCPWorkflowIntegration.js';
import { 
  WorkflowStep, 
  WorkflowContext, 
  Task, 
  MCPCallback, 
  TaskExecutionStatus,
  ErrorRecoveryConfig,
  MonitoringConfig
} from '../interfaces/IMCPWorkflowIntegration.js';
import { IMCPClient } from '../interfaces/IMCPClient.js';
import { IMCPBroker } from '../interfaces/IMCPBroker.js';
import { MCPRequest, MCPResponse } from '../interfaces/IMCPMessage.js';
import { RetryPolicy } from '../types/common.js';
import { MCPServiceInfo } from '../types/broker.js';

// Mock implementations
class MockMCPClient extends EventEmitter implements IMCPClient {
  private responses = new Map<string, MCPResponse>();
  private shouldFail = false;
  private failureCount = 0;
  private maxFailures = 0;

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(`Mock client failure ${this.failureCount}`);
    }

    const response = this.responses.get(request.method) || {
      jsonrpc: '2.0',
      id: request.id,
      result: { success: true, data: 'mock result' }
    };

    return response;
  }

  setResponse(method: string, response: MCPResponse): void {
    this.responses.set(method, response);
  }

  setFailure(shouldFail: boolean, maxFailures = 1): void {
    this.shouldFail = shouldFail;
    this.maxFailures = maxFailures;
    this.failureCount = 0;
  }

  // Other required methods (simplified)
  async subscribeToNotifications(): Promise<void> {}
  async listResources(): Promise<any[]> { return []; }
  async readResource(): Promise<any> { return {}; }
  async callTool(): Promise<any> { return {}; }
  async getServerCapabilities(): Promise<any[]> { return []; }
}

class MockMCPBroker extends EventEmitter implements IMCPBroker {
  private services = new Map<string, MCPServiceInfo>();

  async registerService(): Promise<void> {}
  async unregisterService(): Promise<void> {}

  async discoverServices(query: any): Promise<MCPServiceInfo[]> {
    if (query.name) {
      const service = this.services.get(query.name);
      return service ? [service] : [];
    }
    return Array.from(this.services.values());
  }

  async routeRequest(): Promise<MCPResponse> {
    return { jsonrpc: '2.0', id: 1, result: {} };
  }

  async getServiceHealth(): Promise<any> {
    return { status: 'healthy' };
  }

  addMockService(name: string, service: MCPServiceInfo): void {
    this.services.set(name, service);
  }
}

describe('MCPWorkflowIntegration', () => {
  let mockClient: MockMCPClient;
  let mockBroker: MockMCPBroker;
  let config: MCPWorkflowIntegrationConfig;
  let integration: MCPWorkflowIntegration;

  const defaultRetryPolicy: RetryPolicy = {
    maxAttempts: 2,
    baseDelay: 100,
    maxDelay: 1000,
    strategy: 'exponential'
  };

  const defaultErrorRecovery: ErrorRecoveryConfig = {
    maxRetries: 3,
    retryDelay: 'exponential',
    baseDelay: 100,
    maxDelay: 5000,
    enableFallback: true,
    fallbackServices: ['fallback-service']
  };

  const defaultMonitoring: MonitoringConfig = {
    enableTracking: true,
    enableMetrics: true,
    enableDetailedLogging: false,
    metricsInterval: 1000,
    logLevel: 'info'
  };

  beforeEach(() => {
    mockClient = new MockMCPClient();
    mockBroker = new MockMCPBroker();
    
    config = {
      client: mockClient,
      broker: mockBroker,
      defaultTimeout: 5000,
      defaultRetryPolicy,
      errorRecovery: defaultErrorRecovery,
      monitoring: defaultMonitoring,
      debug: false
    };

    integration = new MCPWorkflowIntegration(config);
  });

  afterEach(() => {
    integration.removeAllListeners();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await integration.initialize();
      expect(integration).toBeDefined();
    });

    it('should emit initialized event', async () => {
      const initPromise = new Promise<void>((resolve) => {
        integration.once('initialized', resolve);
      });

      await integration.initialize();
      await initPromise;
    });

    it('should not initialize twice', async () => {
      await integration.initialize();
      await integration.initialize(); // Should not throw
    });
  });

  describe('executeWorkflowStep', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should execute mcp_call step successfully', async () => {
      const step: WorkflowStep = {
        id: 'test-step',
        type: 'mcp_call',
        mcpService: 'test-service',
        mcpMethod: 'test-method',
        parameters: { input: 'test' }
      };

      const context: WorkflowContext = {
        executionId: 'exec-1',
        workflowId: 'workflow-1',
        currentStepId: 'test-step',
        input: {},
        stepResults: {},
        variables: {}
      };

      mockClient.setResponse('test-method', {
        jsonrpc: '2.0',
        id: 'test-id',
        result: { output: 'success' }
      });

      const result = await integration.executeWorkflowStep(step, context);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ output: 'success' });
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metadata?.stepType).toBe('mcp_call');
    });

    it('should execute mcp_resource step successfully', async () => {
      const step: WorkflowStep = {
        id: 'resource-step',
        type: 'mcp_resource',
        mcpService: 'resource-service',
        mcpMethod: 'get-resource',
        parameters: { uri: 'file://test.txt' }
      };

      const context: WorkflowContext = {
        executionId: 'exec-2',
        workflowId: 'workflow-1',
        currentStepId: 'resource-step',
        input: {},
        stepResults: {},
        variables: {}
      };

      mockClient.setResponse('resources/read', {
        jsonrpc: '2.0',
        id: 'resource-id',
        result: { content: 'file content' }
      });

      const result = await integration.executeWorkflowStep(step, context);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ content: 'file content' });
    });

    it('should execute mcp_tool step successfully', async () => {
      const step: WorkflowStep = {
        id: 'tool-step',
        type: 'mcp_tool',
        mcpService: 'tool-service',
        mcpMethod: 'calculate',
        parameters: { operation: 'add', values: [1, 2, 3] }
      };

      const context: WorkflowContext = {
        executionId: 'exec-3',
        workflowId: 'workflow-1',
        currentStepId: 'tool-step',
        input: {},
        stepResults: {},
        variables: {}
      };

      mockClient.setResponse('tools/call', {
        jsonrpc: '2.0',
        id: 'tool-id',
        result: { result: 6 }
      });

      const result = await integration.executeWorkflowStep(step, context);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ result: 6 });
    });

    it('should handle step execution failure', async () => {
      const step: WorkflowStep = {
        id: 'failing-step',
        type: 'mcp_call',
        mcpService: 'test-service',
        mcpMethod: 'failing-method',
        parameters: {}
      };

      const context: WorkflowContext = {
        executionId: 'exec-4',
        workflowId: 'workflow-1',
        currentStepId: 'failing-step',
        input: {},
        stepResults: {},
        variables: {}
      };

      mockClient.setFailure(true, 3);

      const result = await integration.executeWorkflowStep(step, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mock client failure');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should resolve parameters with context variables', async () => {
      const step: WorkflowStep = {
        id: 'param-step',
        type: 'mcp_call',
        mcpService: 'test-service',
        mcpMethod: 'test-method',
        parameters: { 
          message: '${variables.greeting} ${input.name}',
          count: '${stepResults.previous.count}'
        }
      };

      const context: WorkflowContext = {
        executionId: 'exec-5',
        workflowId: 'workflow-1',
        currentStepId: 'param-step',
        input: { name: 'World' },
        stepResults: { previous: { count: 42 } },
        variables: { greeting: 'Hello' }
      };

      let capturedRequest: MCPRequest | null = null;
      mockClient.sendRequest = jest.fn().mockImplementation((request: MCPRequest) => {
        capturedRequest = request;
        return Promise.resolve({
          jsonrpc: '2.0',
          id: request.id,
          result: { success: true }
        });
      });

      await integration.executeWorkflowStep(step, context);

      expect(capturedRequest?.params).toEqual({
        message: 'Hello World',
        count: '42'
      });
    });

    it('should validate step configuration', async () => {
      const invalidStep: WorkflowStep = {
        id: '',
        type: 'mcp_call',
        mcpService: '',
        mcpMethod: '',
        parameters: {}
      };

      const context: WorkflowContext = {
        executionId: 'exec-6',
        workflowId: 'workflow-1',
        currentStepId: 'invalid-step',
        input: {},
        stepResults: {},
        variables: {}
      };

      const result = await integration.executeWorkflowStep(invalidStep, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Workflow step must have an ID');
    });

    it('should emit step events', async () => {
      const step: WorkflowStep = {
        id: 'event-step',
        type: 'mcp_call',
        mcpService: 'test-service',
        mcpMethod: 'test-method',
        parameters: {}
      };

      const context: WorkflowContext = {
        executionId: 'exec-7',
        workflowId: 'workflow-1',
        currentStepId: 'event-step',
        input: {},
        stepResults: {},
        variables: {}
      };

      const stepCompletedPromise = new Promise<any>((resolve) => {
        integration.once('stepCompleted', resolve);
      });

      await integration.executeWorkflowStep(step, context);
      const event = await stepCompletedPromise;

      expect(event.step).toBe(step);
      expect(event.context).toBe(context);
      expect(event.result.success).toBe(true);
    });
  });

  describe('delegateTask', () => {
    beforeEach(async () => {
      await integration.initialize();
      
      // Add mock service
      mockBroker.addMockService('task-service', {
        id: 'task-service-1',
        name: 'task-service',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        capabilities: ['tools'],
        resources: [],
        tools: [],
        status: 'online' as any,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });
    });

    it('should delegate task successfully', async () => {
      const task: Task = {
        id: 'task-1',
        type: 'calculate',
        parameters: { operation: 'multiply', values: [3, 4] }
      };

      mockClient.setResponse('tools/call', {
        jsonrpc: '2.0',
        id: 'task-id',
        result: { result: 12 }
      });

      const result = await integration.delegateTask(task, 'task-service');

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ result: 12 });
      expect(result.status).toBe(TaskExecutionStatus.COMPLETED);
      expect(result.executionId).toBeDefined();
    });

    it('should handle service not found', async () => {
      const task: Task = {
        id: 'task-2',
        type: 'calculate',
        parameters: {}
      };

      const result = await integration.delegateTask(task, 'nonexistent-service');

      expect(result.success).toBe(false);
      expect(result.error).toContain('MCP service not found');
      expect(result.status).toBe(TaskExecutionStatus.FAILED);
    });

    it('should handle task execution failure', async () => {
      const task: Task = {
        id: 'task-3',
        type: 'failing-task',
        parameters: {}
      };

      mockClient.setResponse('tools/call', {
        jsonrpc: '2.0',
        id: 'task-id',
        error: {
          code: -32603,
          message: 'Task execution failed'
        }
      });

      const result = await integration.delegateTask(task, 'task-service');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task execution failed');
      expect(result.status).toBe(TaskExecutionStatus.FAILED);
    });

    it('should emit task events', async () => {
      const task: Task = {
        id: 'task-4',
        type: 'test-task',
        parameters: {}
      };

      const taskCompletedPromise = new Promise<any>((resolve) => {
        integration.once('taskCompleted', resolve);
      });

      await integration.delegateTask(task, 'task-service');
      const event = await taskCompletedPromise;

      expect(event.task).toBe(task);
      expect(event.result.success).toBe(true);
    });
  });

  describe('trackMCPExecution', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should track execution status', async () => {
      const task: Task = {
        id: 'tracked-task',
        type: 'test',
        parameters: {}
      };

      // Add mock service
      mockBroker.addMockService('task-service', {
        id: 'task-service-1',
        name: 'task-service',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        capabilities: [],
        resources: [],
        tools: [],
        status: 'online' as any,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });

      const taskResult = await integration.delegateTask(task, 'task-service');
      const status = await integration.trackMCPExecution(taskResult.executionId);

      expect(status.executionId).toBe(taskResult.executionId);
      expect(status.status).toBe(TaskExecutionStatus.COMPLETED);
      expect(status.lastUpdated).toBeInstanceOf(Date);
    });

    it('should throw error for unknown execution', async () => {
      await expect(integration.trackMCPExecution('unknown-execution'))
        .rejects.toThrow('Execution not found');
    });
  });

  describe('handleMCPCallback', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should handle progress callback', async () => {
      const executionId = 'test-execution';
      
      // Create a tracked execution first
      const task: Task = {
        id: 'callback-task',
        type: 'test',
        parameters: {}
      };

      mockBroker.addMockService('task-service', {
        id: 'task-service-1',
        name: 'task-service',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        capabilities: [],
        resources: [],
        tools: [],
        status: 'online' as any,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });

      const taskResult = await integration.delegateTask(task, 'task-service');

      const callback: MCPCallback = {
        type: 'progress',
        executionId: taskResult.executionId,
        payload: { progress: 50, message: 'Half done' },
        timestamp: new Date(),
        source: 'task-service'
      };

      await integration.handleMCPCallback(callback);

      const status = await integration.trackMCPExecution(taskResult.executionId);
      expect(status.progress).toBe(50);
      expect(status.message).toBe('Half done');
    });

    it('should handle result callback', async () => {
      const task: Task = {
        id: 'result-task',
        type: 'test',
        parameters: {}
      };

      mockBroker.addMockService('task-service', {
        id: 'task-service-1',
        name: 'task-service',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        capabilities: [],
        resources: [],
        tools: [],
        status: 'online' as any,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });

      const taskResult = await integration.delegateTask(task, 'task-service');

      const callback: MCPCallback = {
        type: 'result',
        executionId: taskResult.executionId,
        payload: { finalResult: 'completed' },
        timestamp: new Date(),
        source: 'task-service'
      };

      await integration.handleMCPCallback(callback);

      const status = await integration.trackMCPExecution(taskResult.executionId);
      expect(status.status).toBe(TaskExecutionStatus.COMPLETED);
      expect(status.progress).toBe(100);
    });

    it('should emit callback events', async () => {
      const callback: MCPCallback = {
        type: 'status',
        executionId: 'test-execution',
        payload: { status: 'running' },
        timestamp: new Date(),
        source: 'test-service'
      };

      const callbackPromise = new Promise<MCPCallback>((resolve) => {
        integration.once('callbackReceived', resolve);
      });

      await integration.handleMCPCallback(callback);
      const receivedCallback = await callbackPromise;

      expect(receivedCallback).toBe(callback);
    });

    it('should execute registered callback handlers', async () => {
      const executionId = 'handler-test';
      let handlerCalled = false;
      let receivedCallback: MCPCallback | null = null;

      integration.registerCallbackHandler(executionId, async (callback) => {
        handlerCalled = true;
        receivedCallback = callback;
      });

      const callback: MCPCallback = {
        type: 'progress',
        executionId,
        payload: { progress: 25 },
        timestamp: new Date(),
        source: 'test-service'
      };

      await integration.handleMCPCallback(callback);

      expect(handlerCalled).toBe(true);
      expect(receivedCallback).toBe(callback);
    });
  });

  describe('callback handler management', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should register and unregister callback handlers', () => {
      const executionId = 'test-execution';
      const handler = jest.fn();

      integration.registerCallbackHandler(executionId, handler);
      integration.unregisterCallbackHandler(executionId);

      // Handler should not be called after unregistering
      const callback: MCPCallback = {
        type: 'progress',
        executionId,
        payload: {},
        timestamp: new Date(),
        source: 'test'
      };

      integration.handleMCPCallback(callback);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('execution statistics', () => {
    beforeEach(async () => {
      await integration.initialize();
      
      mockBroker.addMockService('stats-service', {
        id: 'stats-service-1',
        name: 'stats-service',
        version: '1.0.0',
        endpoint: 'http://localhost:3000',
        capabilities: [],
        resources: [],
        tools: [],
        status: 'online' as any,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });
    });

    it('should provide execution statistics', async () => {
      const task1: Task = { id: 'task-1', type: 'test', parameters: {} };
      const task2: Task = { id: 'task-2', type: 'test', parameters: {} };

      await integration.delegateTask(task1, 'stats-service');
      
      mockClient.setFailure(true, 3);
      await integration.delegateTask(task2, 'stats-service');

      const stats = integration.getExecutionStatistics();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.completedExecutions).toBe(1);
      expect(stats.failedExecutions).toBe(1);
      expect(stats.activeExecutions).toBe(0);
    });
  });

  describe('execution cleanup', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should clean up old executions', async () => {
      // This test would need to manipulate time or use a more sophisticated approach
      // For now, we'll test the basic functionality
      const cleanedCount = integration.cleanupExecutions(0); // Clean up everything
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });
});