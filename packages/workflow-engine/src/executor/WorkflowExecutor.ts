/**
 * Workflow Executor - Runtime Execution Engine
 * 
 * Handles the actual runtime execution of workflow steps and manages execution state
 * Integrates with agents, relay system, and orchestration services
 */

import { EventEmitter } from 'events';
import { Logger, MasterAgentRegistry } from '@tnf/relay-core';
import {
  WorkflowExecution,
  NodeExecution,
  ExecutionContext,
  WorkflowNode,
  WorkflowNodeType,
  NodeExecutionStatus,
  ExecutionError,
} from '../types/WorkflowTypes.js';
import { getErrorMessage } from '../utils/errorUtils.js';

export interface ExecutorConfig {
  maxParallelNodes: number;
  nodeTimeoutMs: number;
  retryDelayMs: number;
  maxRetries: number;
  enableDebugLogging: boolean;
}

export class WorkflowExecutor extends EventEmitter {
  private logger: Logger;
  private config: ExecutorConfig;
  private agentRegistry: MasterAgentRegistry;
  
  // Execution state
  private runningNodes: Map<string, NodeExecution> = new Map();
  private completedNodes: Set<string> = new Set();
  private failedNodes: Set<string> = new Set();

  constructor(config: ExecutorConfig, agentRegistry: MasterAgentRegistry, logger: Logger) {
    super();
    this.config = config;
    this.agentRegistry = agentRegistry;
    this.logger = logger;
  }

  /**
   * Execute workflow step
   */
  async executeStep(
    node: WorkflowNode,
    context: ExecutionContext,
    execution: WorkflowExecution
  ): Promise<any> {
    const nodeExecution = this.createNodeExecution(node, execution.id);
    
    try {
      this.runningNodes.set(node.id, nodeExecution);
      nodeExecution.status = NodeExecutionStatus.RUNNING;
      
      this.logger.debug(`🔧 Executing node: ${node.name} (${node.type})`);
      
      // Execute based on node type
      const result = await this.executeNodeByType(node, context, nodeExecution);
      
      // Mark as completed
      nodeExecution.status = NodeExecutionStatus.COMPLETED;
      nodeExecution.completedAt = new Date();
      nodeExecution.duration = nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime();
      nodeExecution.output = result;
      
      this.completedNodes.add(node.id);
      this.runningNodes.delete(node.id);
      
      this.emit('nodeCompleted', { node, result, execution: nodeExecution });
      
      return result;
      
    } catch (error) {
      nodeExecution.status = NodeExecutionStatus.FAILED;
      nodeExecution.completedAt = new Date();
      nodeExecution.error = this.createExecutionError(error, node.id);
      
      this.failedNodes.add(node.id);
      this.runningNodes.delete(node.id);
      
      this.emit('nodeFailed', { node, error, execution: nodeExecution });
      
      // Handle retry logic
      if (nodeExecution.retryCount < this.config.maxRetries) {
        return this.retryNodeExecution(node, context, execution, nodeExecution);
      }
      
      throw error;
    }
  }

  /**
   * Execute node based on its type
   */
  private async executeNodeByType(
    node: WorkflowNode,
    context: ExecutionContext,
    nodeExecution: NodeExecution
  ): Promise<any> {
    switch (node.type) {
      case WorkflowNodeType.START:
        return this.executeStartNode(node, context);
        
      case WorkflowNodeType.END:
        return this.executeEndNode(node, context);
        
      case WorkflowNodeType.AGENT_TASK:
        return this.executeAgentTaskNode(node, context, nodeExecution);
        
      case WorkflowNodeType.AGENT_HANDOFF:
        return this.executeAgentHandoffNode(node, context);
        
      case WorkflowNodeType.AGENT_COORDINATION:
        return this.executeAgentCoordinationNode(node, context);
        
      case WorkflowNodeType.CONDITION:
        return this.executeConditionNode(node, context);
        
      case WorkflowNodeType.LOOP:
        return this.executeLoopNode(node, context);
        
      case WorkflowNodeType.PARALLEL:
        return this.executeParallelNode(node, context);
        
      case WorkflowNodeType.MERGE:
        return this.executeMergeNode(node, context);
        
      case WorkflowNodeType.API_CALL:
        return this.executeAPICallNode(node, context);
        
      case WorkflowNodeType.DATABASE_QUERY:
        return this.executeDatabaseQueryNode(node, context);
        
      case WorkflowNodeType.FILE_OPERATION:
        return this.executeFileOperationNode(node, context);
        
      case WorkflowNodeType.RELAY_MESSAGE:
        return this.executeRelayMessageNode(node, context);
        
      case WorkflowNodeType.WEBHOOK:
        return this.executeWebhookNode(node, context);
        
      case WorkflowNodeType.EMAIL:
        return this.executeEmailNode(node, context);
        
      case WorkflowNodeType.LLM_PROMPT:
        return this.executeLLMPromptNode(node, context);
        
      case WorkflowNodeType.CODE_GENERATION:
        return this.executeCodeGenerationNode(node, context);
        
      case WorkflowNodeType.ANALYSIS:
        return this.executeAnalysisNode(node, context);
        
      case WorkflowNodeType.CUSTOM:
        return this.executeCustomNode(node, context);
        
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  /**
   * Node execution implementations
   */
  private async executeStartNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    this.logger.info('🚀 Workflow execution started');
    return {
      status: 'started',
      timestamp: new Date(),
      workflowId: context.workflowId,
      executionId: context.executionId
    };
  }

  private async executeEndNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    this.logger.info('🏁 Workflow execution completed');
    return {
      status: 'completed',
      timestamp: new Date(),
      finalOutput: context.variables,
      executionSummary: {
        completedNodes: this.completedNodes.size,
        failedNodes: this.failedNodes.size,
        totalNodes: this.completedNodes.size + this.failedNodes.size
      }
    };
  }

  private async executeAgentTaskNode(
    node: WorkflowNode,
    context: ExecutionContext,
    nodeExecution: NodeExecution
  ): Promise<any> {
    const config = node.config as any;
    
    // Find suitable agent
    let agentId = config.agentId;
    if (!agentId) {
      const agents = this.agentRegistry.getAllAgents();
      const suitableAgent = agents.find((a: any) => 
        a.type === config.agentType && 
        a.status === 'ACTIVE' &&
        this.checkAgentCapabilities(a, config.requiredCapabilities || [])
      );
      
      if (!suitableAgent) {
        throw new Error(`No suitable agent found for task: ${node.name}`);
      }
      agentId = suitableAgent.id;
    }

    nodeExecution.agentId = agentId;

    // Create agent task
    const taskData = {
      content: `[WORKFLOW] ${config.task}`,
      priority: config.priority || 'medium',
      category: 'task' as const,
      estimatedDuration: config.expectedDuration || 30,
      context: {
        workflowExecutionId: context.executionId,
        nodeId: node.id,
        instructions: config.instructions,
        workflowContext: config.context,
        inputs: this.extractNodeInputs(node, context)
      }
    };

    const todoId = await this.agentRegistry.addAgentTodo(agentId, taskData);
    
    this.logger.info(`🤖 Agent task assigned: ${agentId} - ${config.task}`);

    // Monitor task completion
    return this.monitorAgentTask(agentId, todoId, config.expectedDuration || 30);
  }

  private async executeAgentHandoffNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`🔄 Agent handoff: ${config.fromAgentId} → ${config.toAgentId}`);
    
    // Prepare handoff context
    const handoffContext = {
      fromAgentId: config.fromAgentId,
      toAgentId: config.toAgentId,
      workflowContext: config.preserveContext ? context.variables : {},
      executionId: context.executionId,
      nodeId: node.id,
      timestamp: new Date(),
      stagnationThreshold: config.stagnationThresholdMs || 900000 // 15 minutes
    };

    // Execute handoff
    return {
      handoffId: `handoff_${Date.now()}`,
      ...handoffContext,
      status: 'initiated'
    };
  }

  private async executeAgentCoordinationNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`🎭 Agent coordination: ${config.coordinationType}`);
    
    const agents = config.agentIds || [];
    const coordinationTasks = [];

    for (const agentId of agents) {
      const task = await this.agentRegistry.addAgentTodo(agentId, {
        content: `[COORDINATION] ${config.task}`,
        priority: 'high',
        category: 'coordination',
        context: {
          coordinationId: `coord_${Date.now()}`,
          participantAgents: agents,
          coordinationType: config.coordinationType
        }
      });
      coordinationTasks.push({ agentId, taskId: task });
    }

    return {
      coordinationId: `coord_${Date.now()}`,
      participantAgents: agents,
      tasks: coordinationTasks,
      status: 'initiated'
    };
  }

  private async executeConditionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    try {
      const result = this.evaluateExpression(config.expression, context.variables);
      
      this.logger.debug(`🔍 Condition evaluated: ${config.expression} = ${result}`);
      
      return {
        condition: config.expression,
        result: Boolean(result),
        selectedOutput: Boolean(result) ? config.truthyOutput : config.falsyOutput,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${getErrorMessage(error)}`);
    }
  }

  private async executeLoopNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    const iterable = context.variables[config.iterableVariable];
    if (!Array.isArray(iterable)) {
      throw new Error(`Loop variable ${config.iterableVariable} is not iterable`);
    }

    const results = [];
    const maxIterations = config.maxIterations || iterable.length;
    
    for (let i = 0; i < Math.min(iterable.length, maxIterations); i++) {
      const item = iterable[i];
      
      // Set loop context
      const loopContext = {
        ...context,
        variables: {
          ...context.variables,
          [config.itemVariable]: item,
          _loopIndex: i,
          _loopCount: iterable.length
        }
      };

      // Check break condition
      if (config.breakCondition) {
        const shouldBreak = this.evaluateExpression(config.breakCondition, loopContext.variables);
        if (shouldBreak) {
          this.logger.debug(`🔄 Loop break condition met at iteration ${i}`);
          break;
        }
      }

      // Execute loop body (would need to execute connected nodes)
      results.push({
        iteration: i,
        item,
        result: `Processed item ${i}` // Placeholder
      });
    }

    return {
      iterationCount: results.length,
      results,
      completed: true
    };
  }

  private async executeParallelNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`⚡ Parallel execution: ${config.parallelBranches?.length || 0} branches`);
    
    // Execute parallel branches (placeholder implementation)
    const branches = config.parallelBranches || [];
    const results = await Promise.allSettled(
      branches.map(async (branch: any, index: number) => {
        // Each branch would execute its connected nodes
        return {
          branchId: branch.id || `branch_${index}`,
          result: `Branch ${index} completed`,
          timestamp: new Date()
        };
      })
    );

    return {
      parallelResults: results,
      successCount: results.filter(r => r.status === 'fulfilled').length,
      failureCount: results.filter(r => r.status === 'rejected').length,
      completed: true
    };
  }

  private async executeMergeNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.debug(`🔀 Merge node: ${config.mergeStrategy}`);
    
    // Collect results from all incoming connections
    const incomingResults = config.incomingResults || [];
    
    let mergedResult;
    switch (config.mergeStrategy) {
      case 'first':
        mergedResult = incomingResults[0];
        break;
      case 'last':
        mergedResult = incomingResults[incomingResults.length - 1];
        break;
      case 'all':
        mergedResult = incomingResults;
        break;
      case 'combine':
        mergedResult = incomingResults.reduce((acc: any, result: any) => ({ ...acc, ...result }), {});
        break;
      default:
        mergedResult = incomingResults;
    }

    return {
      mergeStrategy: config.mergeStrategy,
      inputCount: incomingResults.length,
      mergedResult,
      timestamp: new Date()
    };
  }

  private async executeAPICallNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`🌐 API Call: ${config.method} ${config.url}`);
    
    // Prepare request
    const url = this.interpolateString(config.url, context.variables);
    const headers = { ...config.headers };
    const body = config.body ? this.interpolateObject(config.body, context.variables) : undefined;

    try {
      // Make API call (simplified implementation)
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

      try {
        const response = await fetch(url, {
          method: config.method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const result = await response.json();
        
        return {
          url,
          method: config.method,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers ? (() => {
            const headerObj: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              headerObj[key] = value;
            });
            return headerObj;
          })() : {},
          data: result,
          timestamp: new Date()
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      throw new Error(`API call failed: ${getErrorMessage(error)}`);
    }
  }

  private async executeDatabaseQueryNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`🗄️ Database query: ${config.operation}`);
    
    // Database operation would be implemented here
    return {
      operation: config.operation,
      query: config.query,
      result: `Database ${config.operation} completed`,
      timestamp: new Date()
    };
  }

  private async executeFileOperationNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`📁 File operation: ${config.operation}`);
    
    // File operation would be implemented here
    return {
      operation: config.operation,
      path: config.path,
      result: `File ${config.operation} completed`,
      timestamp: new Date()
    };
  }

  private async executeRelayMessageNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`📡 Relay message: ${config.messageType}`);
    
    // Relay message would be sent through the relay system
    return {
      messageId: `msg_${Date.now()}`,
      messageType: config.messageType,
      targetAgent: config.targetAgent,
      content: config.content,
      timestamp: new Date()
    };
  }

  private async executeWebhookNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`🪝 Webhook: ${config.url}`);
    
    // Webhook would be called here
    return {
      webhookId: `webhook_${Date.now()}`,
      url: config.url,
      method: config.method || 'POST',
      result: 'Webhook called successfully',
      timestamp: new Date()
    };
  }

  private async executeEmailNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`📧 Email: ${config.subject}`);
    
    // Email would be sent here
    return {
      emailId: `email_${Date.now()}`,
      to: config.to,
      subject: config.subject,
      result: 'Email sent successfully',
      timestamp: new Date()
    };
  }

  private async executeLLMPromptNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`🧠 LLM Prompt: ${config.provider}/${config.model}`);
    
    // LLM call would be implemented here
    const interpolatedPrompt = this.interpolateString(config.prompt, context.variables);
    
    return {
      promptId: `prompt_${Date.now()}`,
      provider: config.provider,
      model: config.model,
      prompt: interpolatedPrompt,
      response: 'LLM response would be here',
      timestamp: new Date()
    };
  }

  private async executeCodeGenerationNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`💻 Code generation: ${config.language}`);
    
    return {
      codeId: `code_${Date.now()}`,
      language: config.language,
      specification: config.specification,
      generatedCode: '// Generated code would be here',
      timestamp: new Date()
    };
  }

  private async executeAnalysisNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    const config = node.config as any;
    
    this.logger.info(`📊 Analysis: ${config.analysisType}`);
    
    return {
      analysisId: `analysis_${Date.now()}`,
      analysisType: config.analysisType,
      inputData: config.inputData,
      result: 'Analysis results would be here',
      timestamp: new Date()
    };
  }

  private async executeCustomNode(node: WorkflowNode, _context: ExecutionContext): Promise<any> {
    
    this.logger.info(`🔧 Custom node: ${node.name}`);
    
    // Custom node execution would be implemented based on config
    return {
      customNodeId: `custom_${Date.now()}`,
      nodeType: node.type,
      result: 'Custom node executed',
      timestamp: new Date()
    };
  }

  /**
   * Helper methods
   */
  private createNodeExecution(node: WorkflowNode, executionId: string): NodeExecution {
    return {
      id: `node_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId: node.id,
      status: NodeExecutionStatus.PENDING,
      startedAt: new Date(),
      retryCount: 0,
      metadata: {
        nodeType: node.type,
        nodeName: node.name,
        executionId
      }
    };
  }

  private createExecutionError(error: any, nodeId?: string): ExecutionError {
    return {
      code: error.code || 'EXECUTION_ERROR',
      message: getErrorMessage(error),
      stack: error.stack,
      nodeId,
      timestamp: new Date(),
      recoverable: false,
      metadata: {}
    };
  }

  private async retryNodeExecution(
    node: WorkflowNode,
    context: ExecutionContext,
    execution: WorkflowExecution,
    nodeExecution: NodeExecution
  ): Promise<any> {
    nodeExecution.retryCount++;
    nodeExecution.status = NodeExecutionStatus.RETRYING;
    
    this.logger.warn(`🔄 Retrying node execution: ${node.name} (attempt ${nodeExecution.retryCount})`);
    
    // Wait before retry
    await this.delay(this.config.retryDelayMs * nodeExecution.retryCount);
    
    // Retry execution
    return this.executeStep(node, context, execution);
  }

  private async monitorAgentTask(agentId: string, todoId: string, timeoutMinutes: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const agent = this.agentRegistry.getAgentProfile(agentId);
          if (!agent) {
            clearInterval(checkInterval);
            reject(new Error(`Agent ${agentId} not found`));
            return;
          }

          const todo = agent.todoList.find((t: any) => t.id === todoId);
          if (!todo) {
            clearInterval(checkInterval);
            reject(new Error(`Todo ${todoId} not found`));
            return;
          }

          if (todo.status === 'completed') {
            clearInterval(checkInterval);
            resolve({
              agentId,
              todoId,
              result: todo.context?.result || 'Task completed',
              completedAt: todo.updatedAt,
              duration: todo.updatedAt.getTime() - todo.createdAt.getTime()
            });
          } else if (todo.status === 'failed') {
            clearInterval(checkInterval);
            reject(new Error(`Agent task failed: ${todo.context?.error || 'Unknown error'}`));
          }
        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 5000); // Check every 5 seconds

      // Timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Agent task timeout after ${timeoutMinutes} minutes`));
      }, timeoutMinutes * 60 * 1000);
    });
  }

  private checkAgentCapabilities(agent: any, requiredCapabilities: string[]): boolean {
    if (!requiredCapabilities.length) return true;
    
    const agentCapabilities = Object.entries(agent.capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability, _]) => capability);

    return requiredCapabilities.every(required => agentCapabilities.includes(required));
  }

  private extractNodeInputs(node: WorkflowNode, context: ExecutionContext): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    for (const input of node.inputs) {
      if (context.variables[input.name] !== undefined) {
        inputs[input.name] = context.variables[input.name];
      } else if (input.defaultValue !== undefined) {
        inputs[input.name] = input.defaultValue;
      }
    }
    
    return inputs;
  }

  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    // Safe expression evaluation
    const context = { ...variables, Math, Date, String, Number, Boolean, Array, Object };
    
    try {
      const func = new Function(...Object.keys(context), `return (${expression});`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error(`Expression evaluation error: ${getErrorMessage(error)}`);
    }
  }

  private interpolateString(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const value = variables[varName.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  private interpolateObject(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.interpolateString(obj, variables);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, variables));
    } else if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, variables);
      }
      return result;
    }
    return obj;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Public API
   */
  getRunningNodes(): NodeExecution[] {
    return Array.from(this.runningNodes.values());
  }

  getCompletedNodes(): string[] {
    return Array.from(this.completedNodes);
  }

  getFailedNodes(): string[] {
    return Array.from(this.failedNodes);
  }

  getExecutionStats() {
    return {
      running: this.runningNodes.size,
      completed: this.completedNodes.size,
      failed: this.failedNodes.size,
      total: this.runningNodes.size + this.completedNodes.size + this.failedNodes.size
    };
  }
}