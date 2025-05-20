import { Subject, BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { useA2ACommunication } from '@/hooks';
import { workflowDatabaseService } from './WorkflowDatabaseService.js';
import { webSocketService } from './WebSocketService.js';

export interface ExecutionUpdate {
  executionId: string;
  nodeId?: string;
  state: 'started' | 'running' | 'completed' | 'failed' | 'aborted';
  message: string;
  result?: any;
  timestamp: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  version?: string;
}

export interface ExecutionOptions {
  timeout?: number;
  parallel?: boolean;
  variables?: Record<string, any>;
}

// Execution history item
export interface ExecutionHistoryItem {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'aborted';
  startTime: number;
  endTime?: number;
  nodeResults: Record<string, any>;
  error?: string;
  metrics?: {
    totalExecutionTime: number;
    nodeExecutionTimes: Record<string, number>;
    successRate: number;
  };
}

// Debug mode options
export interface DebugOptions {
  enabled: boolean;
  stepByStep: boolean;
  breakpoints: string[];
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

export class WorkflowExecutionService {
  private executionSubject = new Subject<ExecutionUpdate>();
  private activeExecutions = new Map<string, AbortController>();
  private nodeResults = new Map<string, Map<string, any>>();
  private a2aService: ReturnType<typeof useA2ACommunication> | null = null;
  private executionHistory: ExecutionHistoryItem[] = [];
  private executionHistorySubject = new BehaviorSubject<ExecutionHistoryItem[]>([]);
  private debugOptions: DebugOptions = {
    enabled: false,
    stepByStep: false,
    breakpoints: [],
    logLevel: 'info'
  };
  private debugPaused = false;
  private debugStepResolve: (() => void) | null = null;

  // Set A2A service
  setA2AService(service: ReturnType<typeof useA2ACommunication>) {
    this.a2aService = service;
  }

  // Subscribe to execution updates
  subscribe(callback: (update: ExecutionUpdate) => void) {
    return this.executionSubject.subscribe(callback);
  }

  // Get execution history
  getExecutionHistory(): ExecutionHistoryItem[] {
    return this.executionHistory;
  }

  // Subscribe to execution history updates
  subscribeToExecutionHistory(callback: (history: ExecutionHistoryItem[]) => void) {
    return this.executionHistorySubject.subscribe(callback);
  }

  // Set debug options
  setDebugOptions(options: Partial<DebugOptions>) {
    this.debugOptions = {
      ...this.debugOptions,
      ...options
    };

    // Log debug options change
    this.log('debug', 'Debug options updated:', this.debugOptions);
  }

  // Get debug options
  getDebugOptions(): DebugOptions {
    return this.debugOptions;
  }

  // Continue execution in debug mode
  continueExecution() {
    if (this.debugPaused && this.debugStepResolve) {
      this.debugPaused = false;
      this.debugStepResolve();
      this.debugStepResolve = null;
    }
  }

  // Execute a workflow
  async executeWorkflow(workflow: Workflow, options: ExecutionOptions = {}): Promise<string> {
    // Connect to WebSocket for real-time updates
    try {
      await webSocketService.connect();
    } catch (error) {
      console.warn('Failed to connect to WebSocket:', error);
      // Continue without WebSocket
    }
    const executionId = uuidv4();
    const abortController = new AbortController();
    this.activeExecutions.set(executionId, abortController);
    this.nodeResults.set(executionId, new Map());

    // Create execution history item
    const historyItem: ExecutionHistoryItem = {
      id: executionId,
      workflowId: workflow.id,
      status: 'pending',
      startTime: Date.now(),
      nodeResults: {}
    };

    // Add to history
    this.executionHistory.push(historyItem);
    this.executionHistorySubject.next(this.executionHistory);

    try {
      // Update history item status
      historyItem.status = 'running';
      this.executionHistorySubject.next(this.executionHistory);

      // Notify execution started
      const startUpdate = {
        executionId,
        state: 'started',
        message: 'Workflow execution started',
        timestamp: Date.now()
      };

      this.executionSubject.next(startUpdate);

      // Send execution started event to WebSocket
      try {
        await webSocketService.send('workflow.execution.started', {
          workflowId: workflow.id,
          executionId,
          timestamp: startUpdate.timestamp
        });
      } catch (error) {
        console.warn('Failed to send execution started event:', error);
      }

      // Log execution start
      this.log('info', `Starting workflow execution: ${workflow.name} (${executionId})`);

      // Create execution plan
      const executionPlan = this.createExecutionPlan(workflow);
      this.log('debug', 'Execution plan created:', executionPlan);

      // Execute nodes according to plan
      if (options.parallel) {
        await this.executeNodesInParallel(workflow, executionId, executionPlan, abortController.signal);
      } else {
        await this.executeNodesSequentially(workflow, executionId, executionPlan, abortController.signal);
      }

      // Calculate metrics
      const endTime = Date.now();
      const nodeResults = this.nodeResults.get(executionId) || new Map();
      const nodeExecutionTimes: Record<string, number> = {};
      let successCount = 0;

      // Calculate node execution times and success rate
      for (const [nodeId, result] of nodeResults.entries()) {
        if (result && result._executionTime) {
          nodeExecutionTimes[nodeId] = result._executionTime;
        }

        if (result && result._success) {
          successCount++;
        }
      }

      const metrics = {
        totalExecutionTime: endTime - historyItem.startTime,
        nodeExecutionTimes,
        successRate: nodeResults.size > 0 ? successCount / nodeResults.size : 1
      };

      // Update history item
      historyItem.status = 'completed';
      historyItem.endTime = endTime;
      historyItem.nodeResults = Object.fromEntries(nodeResults);
      historyItem.metrics = metrics;
      this.executionHistorySubject.next(this.executionHistory);

      // Save execution to database
      try {
        await workflowDatabaseService.createWorkflowExecution(workflow.id, {
          executionId,
          status: 'completed',
          startTime: historyItem.startTime,
          endTime,
          nodeResults: Object.fromEntries(nodeResults),
          metrics
        });
      } catch (dbError) {
        this.log('error', 'Failed to save execution to database:', dbError);
      }

      // Notify execution completed
      const completeUpdate = {
        executionId,
        state: 'completed',
        message: 'Workflow execution completed',
        timestamp: endTime,
        result: {
          metrics
        }
      };

      this.executionSubject.next(completeUpdate);

      // Send execution completed event to WebSocket
      try {
        await webSocketService.send('workflow.execution.completed', {
          workflowId: workflow.id,
          executionId,
          timestamp: endTime,
          metrics
        });
      } catch (error) {
        console.warn('Failed to send execution completed event:', error);
      }

      this.log('info', `Workflow execution completed: ${workflow.name} (${executionId})`);

      return executionId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update history item
      historyItem.status = 'failed';
      historyItem.endTime = Date.now();
      historyItem.error = errorMessage;
      this.executionHistorySubject.next(this.executionHistory);

      // Save execution to database
      try {
        await workflowDatabaseService.createWorkflowExecution(workflow.id, {
          executionId,
          status: 'failed',
          startTime: historyItem.startTime,
          endTime: historyItem.endTime,
          error: errorMessage
        });
      } catch (dbError) {
        this.log('error', 'Failed to save execution to database:', dbError);
      }

      // Notify execution failed
      const failedUpdate = {
        executionId,
        state: 'failed',
        message: errorMessage,
        timestamp: Date.now()
      };

      this.executionSubject.next(failedUpdate);

      // Send execution failed event to WebSocket
      try {
        await webSocketService.send('workflow.execution.failed', {
          workflowId: workflow.id,
          executionId,
          timestamp: failedUpdate.timestamp,
          error: errorMessage
        });
      } catch (error) {
        console.warn('Failed to send execution failed event:', error);
      }

      this.log('error', `Workflow execution failed: ${workflow.name} (${executionId})`, error);

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  // Abort a workflow execution
  async abortExecution(executionId: string) {
    const controller = this.activeExecutions.get(executionId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(executionId);

      // Update history item
      const historyItem = this.executionHistory.find(item => item.id === executionId);
      if (historyItem) {
        historyItem.status = 'aborted';
        historyItem.endTime = Date.now();
        this.executionHistorySubject.next(this.executionHistory);

        // Save execution to database
        try {
          await workflowDatabaseService.abortWorkflowExecution(historyItem.workflowId, executionId);
        } catch (dbError) {
          this.log('error', 'Failed to save aborted execution to database:', dbError);
        }
      }

      // Notify execution aborted
      const abortedUpdate = {
        executionId,
        state: 'aborted',
        message: 'Workflow execution aborted',
        timestamp: Date.now()
      };

      this.executionSubject.next(abortedUpdate);

      // Send execution aborted event to WebSocket
      try {
        await webSocketService.send('workflow.execution.aborted', {
          workflowId: historyItem.workflowId,
          executionId,
          timestamp: abortedUpdate.timestamp
        });
      } catch (error) {
        console.warn('Failed to send execution aborted event:', error);
      }

      this.log('info', `Workflow execution aborted: ${executionId}`);
    }
  }

  // Create execution plan
  private createExecutionPlan(workflow: Workflow): string[] {
    // Find input nodes (nodes with no incoming edges)
    const inputNodes = workflow.nodes.filter(node =>
      !workflow.edges.some(edge => edge.target === node.id)
    );

    // Create a map of node dependencies
    const nodeDependencies = new Map<string, string[]>();
    workflow.nodes.forEach(node => {
      nodeDependencies.set(node.id, []);
    });

    workflow.edges.forEach(edge => {
      const dependencies = nodeDependencies.get(edge.target) || [];
      dependencies.push(edge.source);
      nodeDependencies.set(edge.target, dependencies);
    });

    // Topological sort
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('Workflow has a cycle');
      }

      if (!visited.has(nodeId)) {
        temp.add(nodeId);

        const dependencies = nodeDependencies.get(nodeId) || [];
        dependencies.forEach(dep => visit(dep));

        temp.delete(nodeId);
        visited.add(nodeId);
        order.push(nodeId);
      }
    };

    // Start with input nodes
    inputNodes.forEach(node => visit(node.id));

    // Check if all nodes are visited
    if (visited.size !== workflow.nodes.length) {
      throw new Error('Workflow has unreachable nodes');
    }

    return order;
  }

  // Execute nodes sequentially
  private async executeNodesSequentially(
    workflow: Workflow,
    executionId: string,
    nodeIds: string[],
    signal: AbortSignal
  ) {
    for (const nodeId of nodeIds) {
      if (signal.aborted) {
        throw new Error('Execution aborted');
      }

      // Check if we need to pause for debugging
      await this.handleDebugPause(nodeId);

      try {
        await this.executeNode(workflow, executionId, nodeId);
      } catch (error) {
        // Handle error based on retry policy
        const node = workflow.nodes.find(n => n.id === nodeId);
        const retryPolicy = node?.data?.config?.retryPolicy || {};

        if (retryPolicy.maxRetries && retryPolicy.maxRetries > 0) {
          this.log('warn', `Node execution failed, retrying: ${nodeId}`, error);

          // Retry with exponential backoff
          for (let retry = 0; retry < retryPolicy.maxRetries; retry++) {
            try {
              // Wait before retrying
              const backoffMs = retryPolicy.backoffMs || 1000;
              const delay = backoffMs * Math.pow(2, retry);
              await new Promise(resolve => setTimeout(resolve, delay));

              this.log('info', `Retry ${retry + 1}/${retryPolicy.maxRetries} for node: ${nodeId}`);

              // Try again
              await this.executeNode(workflow, executionId, nodeId);

              // Success, break out of retry loop
              break;
            } catch (retryError) {
              // Last retry failed
              if (retry === retryPolicy.maxRetries - 1) {
                throw retryError;
              }
            }
          }
        } else if (retryPolicy.errorBehavior === 'continue') {
          // Continue despite error
          this.log('warn', `Node execution failed but continuing: ${nodeId}`, error);
        } else {
          // No retry policy or continue behavior, rethrow
          throw error;
        }
      }
    }
  }

  // Execute nodes in parallel
  private async executeNodesInParallel(
    workflow: Workflow,
    executionId: string,
    nodeIds: string[],
    signal: AbortSignal
  ) {
    const nodeDependencies = new Map<string, string[]>();
    workflow.edges.forEach(edge => {
      const dependencies = nodeDependencies.get(edge.target) || [];
      dependencies.push(edge.source);
      nodeDependencies.set(edge.target, dependencies);
    });

    const nodePromises = new Map<string, Promise<any>>();
    const nodeResults = this.nodeResults.get(executionId) || new Map();

    const executeNodeWithDependencies = async (nodeId: string) => {
      if (signal.aborted) {
        throw new Error('Execution aborted');
      }

      // Wait for dependencies to complete
      const dependencies = nodeDependencies.get(nodeId) || [];
      await Promise.all(dependencies.map(depId => nodePromises.get(depId)));

      // Execute node
      return this.executeNode(workflow, executionId, nodeId);
    };

    // Create promises for all nodes
    for (const nodeId of nodeIds) {
      nodePromises.set(nodeId, executeNodeWithDependencies(nodeId));
    }

    // Wait for all nodes to complete
    await Promise.all(nodePromises.values());
  }

  // Handle debug pause
  private async handleDebugPause(nodeId: string): Promise<void> {
    if (!this.debugOptions.enabled) {
      return;
    }

    // Check if we need to pause at this node
    const shouldPause = this.debugOptions.stepByStep ||
      (this.debugOptions.breakpoints.length > 0 && this.debugOptions.breakpoints.includes(nodeId));

    if (shouldPause) {
      this.log('debug', `Pausing execution at node: ${nodeId}`);
      this.debugPaused = true;

      // Wait for continue signal
      await new Promise<void>(resolve => {
        this.debugStepResolve = resolve;
      });

      this.log('debug', `Resuming execution at node: ${nodeId}`);
    }
  }

  // Execute a node
  private async executeNode(workflow: Workflow, executionId: string, nodeId: string): Promise<any> {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Notify node execution started
    this.executionSubject.next({
      executionId,
      nodeId,
      state: 'running',
      message: `Executing node: ${node.data?.name || node.type}`,
      timestamp: Date.now()
    });

    // Log node execution start
    this.log('info', `Executing node: ${node.data?.name || node.type} (${nodeId})`);
    const startTime = Date.now();

    try {
      // Get node inputs
      const inputs = await this.getNodeInputs(workflow, executionId, nodeId);
      this.log('debug', `Node inputs:`, inputs);

      // Execute node based on type
      let result;
      switch (node.type) {
        case 'a2a':
          result = await this.executeA2ANode(node, inputs);
          break;
        case 'mcpTool':
          result = await this.executeMCPToolNode(node, inputs);
          break;
        case 'agent':
          result = await this.executeAgentNode(node, inputs);
          break;
        case 'transform':
          result = await this.executeTransformNode(node, inputs);
          break;
        case 'condition':
          result = await this.executeConditionNode(node, inputs);
          break;
        case 'notification':
          result = await this.executeNotificationNode(node, inputs);
          break;
        case 'input':
          result = inputs;
          break;
        case 'output':
          result = inputs;
          break;
        default:
          result = await this.executeGenericNode(node, inputs);
      }

      // Add execution metadata
      const executionTime = Date.now() - startTime;
      result = {
        ...result,
        _executionTime: executionTime,
        _success: true
      };

      this.log('info', `Node execution completed: ${node.data?.name || node.type} (${nodeId}) in ${executionTime}ms`);
      this.log('debug', `Node result:`, result);

      // Store node result
      const nodeResults = this.nodeResults.get(executionId) || new Map();
      nodeResults.set(nodeId, result);
      this.nodeResults.set(executionId, nodeResults);

      // Notify node execution completed
      this.executionSubject.next({
        executionId,
        nodeId,
        state: 'completed',
        message: 'Node execution completed',
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const executionTime = Date.now() - startTime;

      // Add execution metadata
      const result = {
        error: errorMessage,
        _executionTime: executionTime,
        _success: false
      };

      // Store node result
      const nodeResults = this.nodeResults.get(executionId) || new Map();
      nodeResults.set(nodeId, result);
      this.nodeResults.set(executionId, nodeResults);

      // Notify node execution failed
      this.executionSubject.next({
        executionId,
        nodeId,
        state: 'failed',
        message: errorMessage,
        timestamp: Date.now()
      });

      this.log('error', `Node execution failed: ${node.data?.name || node.type} (${nodeId}) after ${executionTime}ms`, error);

      throw error;
    }
  }

  // Get node inputs
  private async getNodeInputs(workflow: Workflow, executionId: string, nodeId: string): Promise<any> {
    const nodeResults = this.nodeResults.get(executionId) || new Map();
    const inputs: Record<string, any> = {};

    // Find incoming edges
    const incomingEdges = workflow.edges.filter(edge => edge.target === nodeId);

    // Get results from source nodes
    for (const edge of incomingEdges) {
      const sourceResult = nodeResults.get(edge.source);
      if (sourceResult !== undefined) {
        // If edge has a sourceHandle and targetHandle, use them
        if (edge.sourceHandle && edge.targetHandle) {
          inputs[edge.targetHandle] = sourceResult[edge.sourceHandle] || sourceResult;
        } else {
          // Otherwise, use the entire result
          inputs.input = sourceResult;
        }
      }
    }

    return inputs;
  }

  // Execute an A2A node
  private async executeA2ANode(node: any, inputs: any): Promise<any> {
    if (!this.a2aService) {
      throw new Error('A2A service not initialized');
    }

    const { agentId, communicationPattern, messageType, timeout, retryCount, priority, payloadTemplate } = node.data?.config || {};

    if (!agentId && communicationPattern !== 'broadcast') {
      throw new Error('Agent ID is required for direct communication');
    }

    // Parse payload template
    let payload = inputs;
    if (payloadTemplate) {
      try {
        // Replace variables in template
        const template = payloadTemplate.replace(/{{(\w+)}}/g, (match, key) => {
          return JSON.stringify(inputs[key] || null);
        });

        payload = JSON.parse(template);
      } catch (error) {
        console.error('Failed to parse payload template:', error);
      }
    }

    // Create A2A message
    const message: any = {
      type: messageType || 'TASK_REQUEST',
      sender: 'workflow',
      payload,
      metadata: {
        priority: priority || 'medium',
        timeout: timeout || 30000,
        retryCount: retryCount || 3
      }
    };

    // Send message based on communication pattern
    switch (communicationPattern) {
      case 'broadcast':
        return await this.a2aService.broadcastMessage(message);
      case 'request-response':
        return await this.a2aService.sendRequestAndWaitForResponse({
          ...message,
          recipient: agentId
        }, timeout || 30000);
      case 'direct':
      default:
        return await this.a2aService.sendMessage({
          ...message,
          recipient: agentId
        });
    }
  }

  // Execute an MCP tool node
  private async executeMCPToolNode(node: any, inputs: any): Promise<any> {
    // Mock implementation
    console.log('Executing MCP tool node:', node.id, inputs);
    return {
      success: true,
      result: `Executed MCP tool: ${node.data?.config?.toolId || 'unknown'}`,
      timestamp: Date.now()
    };
  }

  // Execute an agent node
  private async executeAgentNode(node: any, inputs: any): Promise<any> {
    // Mock implementation
    console.log('Executing agent node:', node.id, inputs);
    return {
      success: true,
      result: `Executed agent: ${node.data?.config?.agentId || 'unknown'}`,
      timestamp: Date.now()
    };
  }

  // Execute a transform node
  private async executeTransformNode(node: any, inputs: any): Promise<any> {
    const { transformType, transformCode } = node.data?.config || {};

    if (!transformCode) {
      return inputs;
    }

    try {
      switch (transformType) {
        case 'javascript':
          // Execute JavaScript transform
          const transformFn = new Function('input', transformCode);
          return transformFn(inputs);
        case 'json-path':
          // Mock JSON path transform
          return {
            result: `Applied JSONPath: ${transformCode}`,
            data: inputs
          };
        case 'template':
          // Mock template transform
          return {
            result: `Applied template: ${transformCode}`,
            data: inputs
          };
        default:
          return inputs;
      }
    } catch (error) {
      throw new Error(`Transform error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Execute a condition node
  private async executeConditionNode(node: any, inputs: any): Promise<any> {
    const { condition } = node.data?.config || {};

    if (!condition) {
      return { result: true, inputs };
    }

    try {
      // Execute condition
      const conditionFn = new Function('input', `return ${condition};`);
      const result = conditionFn(inputs);

      return {
        result,
        inputs
      };
    } catch (error) {
      throw new Error(`Condition error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Execute a notification node
  private async executeNotificationNode(node: any, inputs: any): Promise<any> {
    const { type, channel, title, message } = node.data?.config || {};

    // Mock notification
    console.log(`Sending ${type} notification via ${channel}: ${title} - ${message}`);

    return {
      success: true,
      notification: {
        type: type || 'info',
        channel: channel || 'ui',
        title: title || 'Notification',
        message: message || 'No message'
      },
      timestamp: Date.now()
    };
  }

  // Execute a generic node
  private async executeGenericNode(node: any, inputs: any): Promise<any> {
    // Mock implementation
    console.log('Executing generic node:', node.id, inputs);
    return {
      success: true,
      result: `Executed node: ${node.id}`,
      inputs,
      timestamp: Date.now()
    };
  }

  // Log message with appropriate level
  private log(level: 'error' | 'warn' | 'info' | 'debug' | 'trace', message: string, ...args: any[]) {
    // Skip logging if level is higher than configured
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    if (levels.indexOf(level) > levels.indexOf(this.debugOptions.logLevel)) {
      return;
    }

    switch (level) {
      case 'error':
        console.error(`[WorkflowExecution] ${message}`, ...args);
        break;
      case 'warn':
        console.warn(`[WorkflowExecution] ${message}`, ...args);
        break;
      case 'info':
        console.info(`[WorkflowExecution] ${message}`, ...args);
        break;
      case 'debug':
        console.debug(`[WorkflowExecution] ${message}`, ...args);
        break;
      case 'trace':
        console.log(`[WorkflowExecution] ${message}`, ...args);
        break;
    }
  }
}

// Create singleton instance
export const workflowExecutionService = new WorkflowExecutionService();
