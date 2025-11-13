"use strict";
/**
 * Integration tests for MCP Workflow Integration
 *
 * Tests end-to-end workflow execution scenarios with real MCP components
 */
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const MCPWorkflowIntegration_1 = require("./MCPWorkflowIntegration");
const WorkflowExecutionMonitor_1 = require("./WorkflowExecutionMonitor");
const MCPCallbackHandler_1 = require("./MCPCallbackHandler");
const IMCPWorkflowIntegration_1 = require("../interfaces/IMCPWorkflowIntegration");
// Enhanced mock implementations for integration testing
class IntegrationMockMCPClient extends events_1.EventEmitter {
    responses = new Map();
    delays = new Map();
    callHistory = [];
    shouldFail = false;
    failurePattern = [];
    currentCall = 0;
    async connect() {
        await this.delay(10);
    }
    async disconnect() {
        await this.delay(10);
    }
    async sendRequest(request) {
        this.callHistory.push({ ...request });
        this.currentCall++;
        // Check failure pattern
        if (this.shouldFail && this.failurePattern.includes(this.currentCall)) {
            throw new Error(`Simulated failure on call ${this.currentCall});
    }

    // Apply delay if configured
    const delay = this.delays.get(request.method) || 0;
    if (delay > 0) {
      await this.delay(delay);
    }

    const response = this.responses.get(request.method) || {
      jsonrpc: '2.0',
      id: request.id,`, result, { success: true, data: `Mock response for ${request.method}` });
        }
        ;
        return { ...response, id: request.id };
    }
    setResponse(method, response) {
        this.responses.set(method, response);
    }
    setDelay(method, delayMs) {
        this.delays.set(method, delayMs);
    }
    setFailurePattern(pattern) {
        this.failurePattern = pattern;
        this.shouldFail = pattern.length > 0;
        this.currentCall = 0;
    }
    getCallHistory() {
        return [...this.callHistory];
    }
    clearHistory() {
        this.callHistory = [];
        this.currentCall = 0;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Other required methods (simplified)
    async subscribeToNotifications() { }
    async listResources() { return []; }
    async readResource() { return {}; }
    async callTool() { return {}; }
    async getServerCapabilities() { return []; }
}
class IntegrationMockMCPBroker extends events_1.EventEmitter {
    services = new Map();
    discoveryDelay = 0;
    async registerService() { }
    async unregisterService() { }
    async discoverServices(query) {
        if (this.discoveryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.discoveryDelay));
        }
        if (query.name) {
            const service = this.services.get(query.name);
            return service ? [service] : [];
        }
        return Array.from(this.services.values());
    }
    async routeRequest() {
        return { jsonrpc: '2.0', id: 1, result: {} };
    }
    async getServiceHealth() {
        return { status: 'healthy' };
    }
    addMockService(name, service) {
        this.services.set(name, service);
    }
    setDiscoveryDelay(delayMs) {
        this.discoveryDelay = delayMs;
    }
}
describe('MCP Workflow Integration - End-to-End Tests', () => {
    let mockClient;
    let mockBroker;
    let monitor;
    let callbackHandler;
    let integration;
    let config;
    const defaultRetryPolicy = {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        strategy: 'exponential'
    };
    const defaultErrorRecovery = {
        maxRetries: 3,
        retryDelay: 'exponential',
        baseDelay: 100,
        maxDelay: 5000,
        enableFallback: true,
        fallbackServices: ['fallback-service']
    };
    const defaultMonitoring = {
        enableTracking: true,
        enableMetrics: true,
        enableDetailedLogging: false,
        metricsInterval: 100, // Faster for testing
        logLevel: 'info'
    };
    const defaultCallbackConfig = {
        maxRetries: 3,
        retryDelay: 50,
        maxRetryDelay: 500,
        retryStrategy: 'exponential',
        callbackTimeout: 1000,
        maxQueueSize: 100,
        enablePersistence: false,
        batchSize: 10,
        processingInterval: 50
    };
    beforeEach(async () => {
        mockClient = new IntegrationMockMCPClient();
        mockBroker = new IntegrationMockMCPBroker();
        monitor = new WorkflowExecutionMonitor_1.WorkflowExecutionMonitor(defaultMonitoring, defaultErrorRecovery);
        callbackHandler = new MCPCallbackHandler_1.MCPCallbackHandler(defaultCallbackConfig);
        config = {
            client: mockClient,
            broker: mockBroker,
            defaultTimeout: 5000,
            defaultRetryPolicy,
            errorRecovery: defaultErrorRecovery,
            monitoring: defaultMonitoring,
            debug: false
        };
        integration = new MCPWorkflowIntegration_1.MCPWorkflowIntegration(config);
        // Add mock services
        mockBroker.addMockService('data-service', {
            id: 'data-service-1',
            name: 'data-service',
            version: '1.0.0',
            endpoint: 'http://localhost:3001',
            capabilities: ['resources', 'tools'],
            resources: [],
            tools: [],
            status: 'online',
            metadata: {},
            registeredAt: new Date(),
            lastHeartbeat: new Date()
        });
        mockBroker.addMockService('compute-service', {
            id: 'compute-service-1',
            name: 'compute-service',
            version: '1.0.0',
            endpoint: 'http://localhost:3002',
            capabilities: ['tools'],
            resources: [],
            tools: [],
            status: 'online',
            metadata: {},
            registeredAt: new Date(),
            lastHeartbeat: new Date()
        });
        await integration.initialize();
        monitor.start();
        callbackHandler.start();
    });
    afterEach(() => {
        integration.removeAllListeners();
        monitor.stop();
        callbackHandler.stop();
        mockClient.clearHistory();
    });
    describe('Complex Workflow Execution', () => {
        it('should execute a multi-step data processing workflow', async () => {
            // Set up responses for each step
            mockClient.setResponse('resources/read', {
                jsonrpc: '2.0',
                id: 'step1',
                result: { content: 'raw,data,values\n1,2,3\n4,5,6' }
            });
            mockClient.setResponse('tools/call', {
                jsonrpc: '2.0',
                id: 'step2',
                result: { processedData: [{ sum: 6 }, { sum: 15 }] }
            });
            // Define workflow steps
            const steps = [
                {
                    id: 'load-data',
                    type: 'mcp_resource',
                    mcpService: 'data-service',
                    mcpMethod: 'get-csv',
                    parameters: { uri: 'file://data.csv', }
                },
                {
                    id: 'process-data',
                    type: 'mcp_tool',
                    mcpService: 'compute-service',
                    mcpMethod: 'process-csv',
                    parameters: {
                        data: '${stepResults.load-data.content}',
                        operation: 'sum_rows'
                    }
                }
            ];
            const context = {
                executionId: 'workflow-exec-1',
                workflowId: 'data-processing-workflow',
                currentStepId: 'load-data',
                input: { source: 'data.csv' },
                stepResults: {},
                variables: { operation: 'sum_rows',
                    // Execute first step
                    context, : .currentStepId = 'load-data',
                    const: step1Result = await integration.executeWorkflowStep(steps[0], context),
                    expect(step1Result) { }, : .success }
            };
        }).toBe(true);
        expect(step1Result.result.content).toContain('raw,data,values');
        // Update context with step result
        context.stepResults['load-data'] = step1Result.result;
        context.currentStepId = 'process-data';
        // Execute second step
        const step2Result = await integration.executeWorkflowStep(steps[1], context);
        expect(step2Result.success).toBe(true);
        expect(step2Result.result.processedData).toHaveLength(2);
        // Verify call history
        const callHistory = mockClient.getCallHistory();
        expect(callHistory).toHaveLength(2);
        expect(callHistory[0].method).toBe('resources/read');
        expect(callHistory[1].method).toBe('tools/call');
        // Verify parameter resolution
        expect(callHistory[1].params.arguments.data).toBe('raw,data,values\n1,2,3\n4,5,6');
    }, 10000);
    it('should handle workflow step failures with retry logic', async () => {
        // Configure client to fail first two attempts, succeed on third
        mockClient.setFailurePattern([1, 2]);
        mockClient.setResponse('tools/call', {
            jsonrpc: '2.0',
            id: 'retry-test',
            result: { success: true, attempt: 3 }
        });
        const step = {
            id: 'retry-step',
            type: 'mcp_tool',
            mcpService: 'compute-service',
            mcpMethod: 'unreliable-operation',
            parameters: { data: 'test' },
            retryPolicy: {
                maxAttempts: 3,
                baseDelay: 50,
                maxDelay: 200,
                strategy: 'exponential',
                const: context, WorkflowContext: IMCPWorkflowIntegration_1.WorkflowContext = {
                    executionId: 'retry-workflow-1',
                    workflowId: 'retry-test-workflow',
                    currentStepId: 'retry-step',
                    input: {},
                    stepResults: {},
                    variables: {}
                },
                const: startTime = Date.now(),
                const: result = await integration.executeWorkflowStep(step, context),
                const: duration = Date.now() - startTime,
                expect(result) { }, : .success
            }
        };
    }).toBe(true);
    expect(result.result.success).toBe(true);
    expect(duration).toBeGreaterThan(100); // Should have taken time for retries
    // Verify all attempts were made
    const callHistory = mockClient.getCallHistory();
    expect(callHistory).toHaveLength(3);
}, 10000);
it('should handle concurrent workflow executions', async () => {
    // Set up different responses for different executions
    mockClient.setResponse('tools/call', {
        jsonrpc: '2.0',
        id: 'concurrent',
        result: { executionId: 'dynamic' }
    });
    const createWorkflowExecution = (executionId) => {
        const step = {
            id: 'concurrent-step',
            type: 'mcp_tool',
            mcpService: 'compute-service',
            mcpMethod: 'concurrent-operation',
            parameters: { executionId }
        };
        const context = {
            executionId,
            workflowId: 'concurrent-workflow',
            currentStepId: 'concurrent-step',
            input: { executionId },
            stepResults: {},
            variables: {}
        };
        return integration.executeWorkflowStep(step, context);
    };
    // Execute multiple workflows concurrently
    const executions = await Promise.all([
        createWorkflowExecution('exec-1'),
        createWorkflowExecution('exec-2'),
        createWorkflowExecution('exec-3'),
        createWorkflowExecution('exec-4'),
        createWorkflowExecution('exec-5')
    ]);
    // All should succeed
    executions.forEach((result, index) => {
        expect(result.success).toBe(true);
        `
        expect(result.metadata?.executionId).toContain(exec-${index + 1}`;
    });
});
// Verify all calls were made
const callHistory = mockClient.getCallHistory();
expect(callHistory).toHaveLength(5);
10000;
;
;
describe('Task Delegation with Monitoring', () => {
    it('should delegate tasks and track execution with monitoring', async () => {
        const task = {
            id: 'monitored-task',
            type: 'data-analysis',
            parameters: { dataset: 'large-dataset.csv', algorithm: 'ml-analysis',
                // Set up response with delay to simulate long-running task
                mockClient, : .setDelay('tools/call', 200),
                mockClient, : .setResponse('tools/call', {
                    jsonrpc: '2.0',
                    id: 'monitored',
                    result: {
                        analysisResults: { accuracy: 0.95, features: 42 },
                        processingTime: 200
                    }
                }),
                // Track execution events
                const: executionEvents, any, []:  = [],
                integration, : .on('taskCompleted', (event) => executionEvents.push(event)),
                // Delegate task
                const: taskResult = await integration.delegateTask(task, 'compute-service'),
                expect(taskResult) { }, : .success }
        };
    }).toBe(true);
    expect(taskResult.result.analysisResults.accuracy).toBe(0.95);
    expect(taskResult.executionId).toBeDefined();
    // Verify execution was tracked
    const executionStatus = await integration.trackMCPExecution(taskResult.executionId);
    expect(executionStatus.status).toBe(IMCPWorkflowIntegration_1.TaskExecutionStatus.COMPLETED);
    expect(executionStatus.progress).toBe(100);
    // Verify events were emitted
    expect(executionEvents).toHaveLength(1);
    expect(executionEvents[0].task).toBe(task);
    expect(executionEvents[0].result.success).toBe(true);
}, 10000);
it('should handle task delegation failures with proper error tracking', async () => {
    const task = {
        id: 'failing-task',
        type: 'impossible-operation',
        parameters: { data: 'invalid',
            // Configure service to return error
            mockClient, : .setResponse('tools/call', {
                jsonrpc: '2.0',
                id: 'failing',
                error: {
                    code: -32603,
                    message: 'Operation failed: Invalid data format',
                    data: { errorType: 'ValidationError'
                    }
                }
            }),
            // Track failure events
            const: failureEvents, any, []:  = [],
            integration, : .on('taskFailed', (event) => failureEvents.push(event)),
            // Delegate task
            const: taskResult = await integration.delegateTask(task, 'compute-service'),
            expect(taskResult) { }, : .success }
    };
}).toBe(false);
expect(taskResult.error).toContain('Operation failed');
expect(taskResult.status).toBe(IMCPWorkflowIntegration_1.TaskExecutionStatus.FAILED);
// Verify execution was tracked
const executionStatus = await integration.trackMCPExecution(taskResult.executionId);
expect(executionStatus.status).toBe(IMCPWorkflowIntegration_1.TaskExecutionStatus.FAILED);
// Verify failure events were emitted
expect(failureEvents).toHaveLength(1);
expect(failureEvents[0].error.message).toContain('Operation failed');
10000;
;
;
describe('Callback Handling Integration', () => {
    it('should handle asynchronous callbacks with workflow integration', async () => {
        const task = {
            id: 'async-task',
            type: 'long-running-analysis',
            parameters: { complexity: 'high',
                // Set up initial response
                mockClient, : .setResponse('tools/call', {
                    jsonrpc: '2.0',
                    id: 'async',
                    result: { taskId: 'async-task-123', status: 'started' }
                }),
                // Delegate task
                const: taskResult = await integration.delegateTask(task, 'compute-service'),
                expect(taskResult) { }, : .success }
        };
    }).toBe(true);
    // Register callback handler
    const callbackEvents = [];
    integration.registerCallbackHandler(taskResult.executionId, async (callback) => {
        callbackEvents.push(callback);
    });
    // Simulate progress callbacks
    const progressCallback = {
        type: 'progress',
        executionId: taskResult.executionId,
        payload: { progress: 25, message: 'Processing data...' },
        timestamp: new Date(),
        source: 'compute-service'
    };
    await integration.handleMCPCallback(progressCallback);
    // Simulate completion callback
    const completionCallback = {
        type: 'result',
        executionId: taskResult.executionId,
        payload: {
            finalResults: { accuracy: 0.98, insights: ['pattern1', 'pattern2'] },
            totalProcessingTime: 5000
        },
        timestamp: new Date(),
        source: 'compute-service'
    };
    await integration.handleMCPCallback(completionCallback);
    // Verify callbacks were processed
    expect(callbackEvents).toHaveLength(2);
    expect(callbackEvents[0].type).toBe('progress');
    expect(callbackEvents[1].type).toBe('result');
    // Verify execution status was updated
    const finalStatus = await integration.trackMCPExecution(taskResult.executionId);
    expect(finalStatus.status).toBe(IMCPWorkflowIntegration_1.TaskExecutionStatus.COMPLETED);
    expect(finalStatus.progress).toBe(100);
}, 10000);
it('should handle callback errors and retry mechanisms', async () => {
    const executionId = 'callback-error-test';
    // Register a handler that fails initially
    let handlerCallCount = 0;
    integration.registerCallbackHandler(executionId, async (callback) => {
        handlerCallCount++;
        if (handlerCallCount <= 2) {
            throw new Error(`Handler failure ${handlerCallCount});
        }
        // Success on third attempt
      });

      const callback: MCPCallback = {
        type: 'progress',
        executionId,
        payload: { progress: 50 },
        timestamp: new Date(),
        source: 'test-service'
      };

      // This should trigger retries
      await integration.handleMCPCallback(callback);

      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Handler should have been called multiple times
      expect(handlerCallCount).toBeGreaterThan(1);
    }, 10000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from service unavailability', async () => {
      const step: WorkflowStep = {
        id: 'resilience-test',
        type: 'mcp_tool',
        mcpService: 'unreliable-service',
        mcpMethod: 'test-operation',
        parameters: { data: 'test';

      const context: WorkflowContext = {
        executionId: 'resilience-exec-1',
        workflowId: 'resilience-workflow',
        currentStepId: 'resilience-test',
        input: {},
        stepResults: {},
        variables: {}
      };

      // Initially no service available
      const result1 = await integration.executeWorkflowStep(step, context);
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('MCP service not found');

      // Add service and retry
      mockBroker.addMockService('unreliable-service', {
        id: 'unreliable-service-1',
        name: 'unreliable-service',
        version: '1.0.0',
        endpoint: 'http://localhost:3003',
        capabilities: ['tools'],
        resources: [],
        tools: [],
        status: 'online' as any,
        metadata: {},
        registeredAt: new Date(),
        lastHeartbeat: new Date()
      });

      mockClient.setResponse('tools/call', {
        jsonrpc: '2.0',
        id: 'resilience',
        result: { recovered: true }
      });

      const result2 = await integration.executeWorkflowStep(step, context);
      expect(result2.success).toBe(true);
      expect(result2.result.recovered).toBe(true);
    }, 10000);

    it('should handle network timeouts gracefully', async () => {
      const step: WorkflowStep = {
        id: 'timeout-test',
        type: 'mcp_tool',
        mcpService: 'compute-service',
        mcpMethod: 'slow-operation',
        parameters: { data: 'test' },
        timeout: 100 // Very short timeout
      };

      const context: WorkflowContext = {
        executionId: 'timeout-exec-1',
        workflowId: 'timeout-workflow',
        currentStepId: 'timeout-test',
        input: {},
        stepResults: {},
        variables: {}
      };

      // Set a long delay to trigger timeout
      mockClient.setDelay('tools/call', 200);

      const result = await integration.executeWorkflowStep(step, context);
      
      // Should fail due to timeout, but gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.duration).toBeLessThan(1000); // Should fail quickly
    }, 10000);
  });

  describe('Performance and Scalability', () => {
    it('should handle high-throughput workflow execution', async () => {
      const numWorkflows = 50;
      const workflows: Promise<any>[] = [];

      mockClient.setResponse('tools/call', {
        jsonrpc: '2.0',
        id: 'throughput',
        result: { processed: true }
      });

      const startTime = Date.now();

      // Create many concurrent workflow executions
      for (let i = 0; i < numWorkflows; i++) {
        const step: WorkflowStep = {`, id, throughput - step - $, { i } ``, type, 'mcp_tool', mcpService, 'compute-service', mcpMethod, 'fast-operation', parameters, { index: i });
        }
        ;
        const context = {
            executionId: throughput - exec - $
        }, { i }, workflowId;
        `
          currentStepId: throughput-step-${i}`,
            input;
        {
            index: i;
        }
        stepResults: { }
        variables: { }
    });
    workflows.push(integration.executeWorkflowStep(step, context));
});
// Wait for all to complete
const results = await Promise.all(workflows);
const duration = Date.now() - startTime;
// All should succeed
results.forEach((result, index) => {
    expect(result.success).toBe(true);
});
// Should complete in reasonable time
expect(duration).toBeLessThan(5000);
// Verify throughput
const throughput = numWorkflows / (duration / 1000);
expect(throughput).toBeGreaterThan(10); // At least 10 workflows per second
console.log(Processed, $, { numWorkflows } ` workflows in ${duration}ms (${throughput.toFixed(2)} workflows/sec)`);
15000;
;
;
;
//# sourceMappingURL=MCPWorkflowIntegration.integration.test.js.map