/**
 * Unified Workflow Engine for The New Fuse Framework
 * 
 * This engine consolidates all workflow execution capabilities from various scattered implementations.
 * It integrates with the Master Agent Registry, Relay System, and Orchestration Services to provide a cohesive workflow experience.
 */

import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/relay-core';
// import { PrismaClient } from '@prisma/client';
import {
  UnifiedWorkflow,
  WorkflowExecution,
  NodeExecution,
  WorkflowEventType,
  WorkflowEvent,
  ExecutionContext,
  NodeExecutionStatus,
  WorkflowExecutionStatus,
  WorkflowNode,
  WorkflowNodeType,
  isAgentTaskNode,
  isAgentHandoffNode,
  isConditionNode,
  AgentTaskNodeConfig,
  AgentHandoffNodeConfig
} from '../types/WorkflowTypes';
import { getErrorMessage } from '../utils/errorUtils';

// Import actual types from relay-core
import { MasterAgentRegistry } from '@the-new-fuse/relay-core';

interface HeartbeatMonitoringService {
  registerAgent(agentId: string, expectedResponseTime?: number): void;
  recordActivity(agentId: string, activityType: string, metadata?: any): void;
}

export interface WorkflowEngineConfig {
  maxConcurrentExecutions: number;
  defaultTimeoutMs: number;
  enableHeartbeatMonitoring: boolean;
  enableAgentCoordination: boolean;
  enableStatePreservation: boolean;
  relayIntegration: boolean;
  debug: boolean;
}

export class UnifiedWorkflowEngine extends EventEmitter {
  private logger: Logger;
  private config: WorkflowEngineConfig;
  private prisma: any; // PrismaClient;
  private agentRegistry: MasterAgentRegistry;
  private heartbeatService: HeartbeatMonitoringService;
  // Removed handoffService - implementing handoff logic directly
  
  // Execution tracking
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private executionQueue: string[] = [];
  private nodeExecutors: Map<WorkflowNodeType, (node: WorkflowNode, context: ExecutionContext) => Promise<any>> = new Map();
  private isRunning: boolean = true;
  
  // Performance metrics
  private metrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    activeExecutionCount: 0
  };

  constructor(
    config: WorkflowEngineConfig,
    prisma: any /* PrismaClient */,
    agentRegistry: MasterAgentRegistry,
    heartbeatService: HeartbeatMonitoringService,
    logger: Logger
  ) {
    super();
    this.config = config;
    this.prisma = prisma;
    this.agentRegistry = agentRegistry;
    this.heartbeatService = heartbeatService;
    // Handoff service functionality implemented directly in methods
    this.logger = logger;

    this.initializeNodeExecutors();
    this.startExecutionProcessor();
    this.recoverInterruptedExecutions();
  }

  /**
   * Serialize execution context for storage
   */
  private serializeContext(context: ExecutionContext): any {
    return {
      workflowId: context.workflowId,
      executionId: context.executionId,
      variables: context.variables,
      temporaryData: context.temporaryData,
      userContext: context.userContext
      // agentRegistry and relayConnection are not serializable
    };
  }

  /**
   * Deserialize execution context from storage
   */
  private deserializeContext(data: any): ExecutionContext {
    return {
      workflowId: data.workflowId,
      executionId: data.executionId,
      variables: data.variables || {},
      temporaryData: data.temporaryData || {},
      userContext: data.userContext,
      agentRegistry: this.agentRegistry, // Re-inject dependencies
      relayConnection: null // Will be set if relay integration enabled
    };
  }

  /**
   * Recover interrupted executions on startup
   */
  private async recoverInterruptedExecutions(): Promise<void> {
    try {
      this.logger.info('🔄 Checking for interrupted workflow executions...');

      const interruptedExecutions = await this.prisma.workflowExecution.findMany({
        where: {
          status: WorkflowExecutionStatus.RUNNING
        }
      });

      if (interruptedExecutions.length === 0) {
        this.logger.info('✅ No interrupted executions found.');
        return;
      }

      this.logger.info(`⚠️ Found ${interruptedExecutions.length} interrupted executions. Attempting recovery...`);

      for (const dbExecution of interruptedExecutions) {
        try {
            // Load full execution state
            const execution = await this.loadExecution(dbExecution.id);
            if (execution) {
                // Add to active executions and queue
                this.activeExecutions.set(execution.id, execution);
                this.executionQueue.push(execution.id);
                this.logger.info(`🔄 Resumed interrupted execution: ${execution.id}`);
            }
        } catch (err) {
            this.logger.error(`❌ Failed to recover execution ${dbExecution.id}: ${getErrorMessage(err)}`);
            // Optionally mark as failed
        }
      }
    } catch (error) {
      this.logger.error(`❌ Failed to recover interrupted executions: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Start workflow execution
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, any> = {},
    triggeredBy: string = 'system',
    triggerType: string = 'manual'
  ): Promise<string> {
    try {
      this.logger.info(`🚀 Starting workflow execution: ${workflowId}`);

      // Load workflow definition
      const workflow = await this.loadWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Check execution limits
      if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
        throw new Error('Maximum concurrent executions reached');
      }

      // Create execution record
      const execution = await this.createExecution(workflow, input, triggeredBy, triggerType);
      
      // Start execution
      await this.startExecution(execution);
      
      this.metrics.totalExecutions++;
      this.logger.info(`✅ Workflow execution started: ${execution.id}`);
      
      return execution.id;
    } catch (error) {
      this.logger.error(`❌ Failed to start workflow execution: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    // Check active executions first
    const activeExecution = this.activeExecutions.get(executionId);
    if (activeExecution) {
      return activeExecution;
    }

    // Load from database
    return this.loadExecution(executionId);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string, reason: string = 'User cancelled'): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = WorkflowExecutionStatus.CANCELLED;
    execution.completedAt = new Date();
    execution.error = {
      code: 'EXECUTION_CANCELLED',
      message: reason,
      timestamp: new Date(),
      recoverable: false,
      metadata: {}
    };

    await this.finalizeExecution(execution);
    this.logger.info(`🛑 Workflow execution cancelled: ${executionId} - ${reason}`);
    
    return true;
  }

  /**
   * Load workflow from database
   */
  private async loadWorkflow(workflowId: string): Promise<UnifiedWorkflow | null> {
    try {
      const dbWorkflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: { orderBy: { order: 'asc' } },
          agent: true
        }
      });

      if (!dbWorkflow) return null;

      // Convert database format to unified format
      return this.convertDbWorkflowToUnified(dbWorkflow);
    } catch (error) {
      this.logger.error(`Failed to load workflow ${workflowId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Create execution record
   */
  private async createExecution(
    workflow: UnifiedWorkflow,
    input: Record<string, any>,
    triggeredBy: string,
    triggerType: string
  ): Promise<WorkflowExecution> {
    // SECURITY FIX: Use cryptographically secure random ID generation
    const executionId = `exec_${Date.now()}_${this.generateSecureId()}`;

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: WorkflowExecutionStatus.PENDING,
      triggeredBy: triggeredBy,
      triggerType: triggerType as any,
      input: input,
      startedAt: new Date(),
      nodeExecutions: [],
      context: {
        workflowId: workflow.id,
        executionId: executionId,
        variables: { ...input, ...this.extractWorkflowVariables(workflow) },
        temporaryData: {},
        agentRegistry: this.agentRegistry,
        relayConnection: null // Will be set if relay integration enabled
      },
      statistics: {
        totalNodes: workflow.definition.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
        totalDuration: 0,
        averageNodeDuration: 0
      },
      logs: [],
      metadata: {
        workflowVersion: workflow.version,
        engineVersion: '1.0.0'
      }
    };

    // Store in database
    await this.prisma.workflowExecution.create({
      data: {
        id: executionId,
        workflowId: workflow.id,
        status: WorkflowExecutionStatus.PENDING,
        input: input,
        startedAt: execution.startedAt,
        nodeExecutions: [],
        context: this.serializeContext(execution.context),
        statistics: execution.statistics,
        logs: [],
        metadata: execution.metadata
      }
    });

    return execution;
  }

  /**
   * Start execution processing
   */
  private async startExecution(execution: WorkflowExecution): Promise<void> {
    this.activeExecutions.set(execution.id, execution);
    this.executionQueue.push(execution.id);
    
    // Emit event
    this.emitWorkflowEvent({
      id: `event_${Date.now()}`,
      type: WorkflowEventType.WORKFLOW_STARTED,
      workflowId: execution.workflowId,
      executionId: execution.id,
      timestamp: new Date(),
      data: { triggeredBy: execution.triggeredBy }
    });

    // Register with heartbeat monitoring if enabled
    if (this.config.enableHeartbeatMonitoring) {
      this.heartbeatService.registerAgent(execution.id, this.config.defaultTimeoutMs);
    }
  }

  /**
   * Process execution queue
   */
  private startExecutionProcessor(): void {
    const workLoop = async () => {
      while (this.isRunning) {
        const executionId = this.executionQueue.shift();
        if (executionId) {
          try {
            await this.processExecution(executionId);
          } catch (err) {
            this.logger.error(`Unhandled error in execution processor for ${executionId}: ${getErrorMessage(err)}`);
          }
        } else {
          // If queue is empty, wait a bit before checking again to prevent a busy loop.
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
    workLoop().catch(err => this.logger.error(`Workflow execution processor has crashed: ${getErrorMessage(err)}`));
  }

  /**
   * Stop the engine
   */
  public stop(): void {
    this.isRunning = false;
  }

  /**
   * Process single execution
   */
  private async processExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    try {
      execution.status = WorkflowExecutionStatus.RUNNING;
      
      // Load workflow definition
      const workflow = await this.loadWorkflow(execution.workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${execution.workflowId}`);
      }

      // Execute workflow nodes
      await this.executeWorkflowNodes(workflow, execution);

      // Complete execution
      execution.status = WorkflowExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      await this.finalizeExecution(execution);
      this.metrics.successfulExecutions++;

      this.logger.info(`✅ Workflow execution completed: ${executionId} (${execution.duration}ms)`);

    } catch (error) {
      execution.status = WorkflowExecutionStatus.FAILED;
      execution.completedAt = new Date();
      execution.error = {
        code: 'EXECUTION_FAILED',
        message: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date(),
        recoverable: false,
        metadata: {}
      };

      await this.finalizeExecution(execution);
      this.metrics.failedExecutions++;

      this.logger.error(`❌ Workflow execution failed: ${executionId} - ${getErrorMessage(error)}`);
    }
  }

  /**
   * Execute workflow nodes
   */
  private async executeWorkflowNodes(workflow: UnifiedWorkflow, execution: WorkflowExecution): Promise<void> {
    const startNode = workflow.definition.nodes.find(n => n.type === WorkflowNodeType.START);
    if (!startNode) {
      throw new Error('Workflow has no start node');
    }

    // Execute nodes following connections
    await this.executeNodeChain(startNode, workflow, execution);
  }

  /**
   * Execute node chain
   */
  private async executeNodeChain(
    node: WorkflowNode,
    workflow: UnifiedWorkflow,
    execution: WorkflowExecution
  ): Promise<void> {
    // Skip if already executed
    if (execution.nodeExecutions.some(ne => ne.nodeId === node.id)) {
      return;
    }

    // Create node execution
    // SECURITY FIX: Use cryptographically secure random ID generation
    const nodeExecution: NodeExecution = {
      id: `node_${Date.now()}_${this.generateSecureId()}`,
      nodeId: node.id,
      status: NodeExecutionStatus.PENDING,
      startedAt: new Date(),
      retryCount: 0,
      metadata: {}
    };

    execution.nodeExecutions.push(nodeExecution);

    try {
      // Emit node started event
      this.emitWorkflowEvent({
        id: `event_${Date.now()}`,
        type: WorkflowEventType.NODE_STARTED,
        workflowId: execution.workflowId,
        executionId: execution.id,
        nodeId: node.id,
        timestamp: new Date(),
        data: { nodeType: node.type }
      });

      // Execute node
      nodeExecution.status = NodeExecutionStatus.RUNNING;
      const result = await this.executeNode(node, execution.context);
      
      nodeExecution.status = NodeExecutionStatus.COMPLETED;
      nodeExecution.completedAt = new Date();
      nodeExecution.duration = nodeExecution.completedAt.getTime() - nodeExecution.startedAt.getTime();
      nodeExecution.output = result;

      execution.statistics.completedNodes++;

      // Persist state after node completion
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          nodeExecutions: execution.nodeExecutions,
          context: this.serializeContext(execution.context),
          statistics: execution.statistics
        }
      });

      // Record heartbeat if monitoring enabled
      if (this.config.enableHeartbeatMonitoring) {
        this.heartbeatService.recordActivity(execution.id, 'node_completed', {
          nodeId: node.id,
          nodeType: node.type,
          duration: nodeExecution.duration
        });
      }

      // Handle END node
      if (node.type === WorkflowNodeType.END) {
        execution.output = result;
        return;
      }

      // Find and execute next nodes
      const nextNodes = this.findNextNodes(node, workflow, execution.context);
      await Promise.all(
        nextNodes.map(nextNode => this.executeNodeChain(nextNode, workflow, execution))
      );

    } catch (error) {
      nodeExecution.status = NodeExecutionStatus.FAILED;
      nodeExecution.completedAt = new Date();
      nodeExecution.error = {
        code: 'NODE_EXECUTION_FAILED',
        message: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
        nodeId: node.id,
        timestamp: new Date(),
        recoverable: false,
        metadata: {}
      };

      execution.statistics.failedNodes++;

      // Emit node failed event
      this.emitWorkflowEvent({
        id: `event_${Date.now()}`,
        type: WorkflowEventType.NODE_FAILED,
        workflowId: execution.workflowId,
        executionId: execution.id,
        nodeId: node.id,
        timestamp: new Date(),
        data: { error: getErrorMessage(error) }
      });

      throw error;
    }
  }

  /**
   * Execute individual node
   */
  private async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    return await executor(node, context);
  }

  /**
   * Initialize node executors
   */
  private initializeNodeExecutors(): void {
    // Basic nodes
    this.nodeExecutors.set(WorkflowNodeType.START, async (node, _context) => {
      this.logger.debug(`Executing START node: ${node.id}`);
      return { status: 'started', timestamp: new Date() };
    });

    this.nodeExecutors.set(WorkflowNodeType.END, async (node, context) => {
      this.logger.debug(`Executing END node: ${node.id}`);
      return { status: 'completed', timestamp: new Date(), finalOutput: context.variables };
    });

    // Agent nodes
    this.nodeExecutors.set(WorkflowNodeType.AGENT_TASK, async (node, context) => {
      if (!isAgentTaskNode(node)) {
        throw new Error(`Invalid agent task node configuration for node ${node.id}`);
      }
      // Type assertion after type guard
      return this.executeAgentTask(node as WorkflowNode & { type: WorkflowNodeType.AGENT_TASK; config: AgentTaskNodeConfig }, context);
    });

    this.nodeExecutors.set(WorkflowNodeType.AGENT_HANDOFF, async (node, context) => {
      if (!isAgentHandoffNode(node)) {
        throw new Error(`Invalid agent handoff node configuration for node ${node.id}`);
      }
      // Type assertion after type guard
      return this.executeAgentHandoff(node as WorkflowNode & { type: WorkflowNodeType.AGENT_HANDOFF; config: AgentHandoffNodeConfig }, context);
    });

    // Logic nodes
    this.nodeExecutors.set(WorkflowNodeType.CONDITION, async (node, context) => {
      if (!isConditionNode(node)) {
        throw new Error(`Invalid condition node configuration for node ${node.id}`);
      }
      // Type assertion after type guard
      return this.executeCondition(node as WorkflowNode & { type: WorkflowNodeType.CONDITION; config: { expression: string; truthyOutput?: any; falsyOutput?: any } }, context);
    });

    // Add more node executors as needed
  }

  /**
   * Execute agent task node
   */
  private async executeAgentTask(
    node: WorkflowNode & { type: WorkflowNodeType.AGENT_TASK; config: AgentTaskNodeConfig },
    context: ExecutionContext
  ): Promise<any> {
    this.logger.info(`🤖 Executing agent task: ${node.name}`);

    // Find agent
    let agentId = node.config.agentId;
    if (!agentId && node.config.agentType) {
      // Find agent by type
      const agents = this.agentRegistry.getAllAgents();
      const suitableAgent = agents.find((a: any) => a.type === node.config.agentType && a.status === 'ACTIVE');
      if (suitableAgent) {
        agentId = suitableAgent.id;
      }
    }

    if (!agentId) {
      throw new Error(`No suitable agent found for task: ${node.name}`);
    }

    // Create agent todo
    const todoId = await this.agentRegistry.addAgentTodo(agentId, {
      content: node.config.task,
      priority: node.config.priority,
      category: 'task',
      estimatedDuration: node.config.expectedDuration,
      context: {
        workflowExecutionId: context.executionId,
        nodeId: node.id,
        instructions: node.config.instructions,
        workflowContext: node.config.context || {}
      }
    });

    // Monitor task execution
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
      };

      const checkInterval = setInterval(async () => {
        try {
          const agent = this.agentRegistry.getAgentProfile(agentId!);
          if (!agent) {
            cleanup();
            reject(new Error(`Agent ${agentId} not found during task monitoring`));
            return;
          }

          const todo = agent.todoList.find((t: any) => t.id === todoId);
          if (!todo) {
            cleanup();
            reject(new Error(`Todo ${todoId} not found for agent ${agentId} during monitoring`));
            return;
          }

          if (todo.status === 'completed') {
            cleanup();
            resolve({
              agentId,
              todoId,
              result: todo.context?.result || 'Task completed',
              completedAt: todo.updatedAt
            });
          } else if (todo.status === 'failed') {
            cleanup();
            reject(new Error(`Agent task failed: ${todo.context?.error || 'Unknown error'}`));
          }
        } catch (err) {
            cleanup();
            reject(new Error(`Error while checking agent task status: ${getErrorMessage(err)}`));
        }
      }, 5000); // Check every 5 seconds

      const timeoutDuration = node.config.expectedDuration ? node.config.expectedDuration * 60 * 1000 : this.config.defaultTimeoutMs;
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Agent task timeout after ${timeoutDuration}ms: ${node.name}`));
      }, timeoutDuration);
    });
  }

  /**
   * Execute agent handoff node
   */
  private async executeAgentHandoff(
    node: WorkflowNode & { type: WorkflowNodeType.AGENT_HANDOFF; config: AgentHandoffNodeConfig },
    context: ExecutionContext
  ): Promise<any> {
    this.logger.info(`🔄 Executing agent handoff: ${node.name}`);

    // Generate handoff prompt
    const handoffPrompt = this.createHandoffPrompt(
      node.config.handoffTemplateId,
      {
        fromAgentId: node.config.fromAgentId,
        toAgentId: node.config.toAgentId,
        workflowContext: context.variables,
        preserveContext: node.config.preserveContext,
        executionId: context.executionId
      }
    );

    // Emit handoff event
    this.emitWorkflowEvent({
      id: `event_${Date.now()}`,
      type: WorkflowEventType.AGENT_HANDOFF,
      workflowId: context.workflowId,
      executionId: context.executionId,
      nodeId: node.id,
      agentId: node.config.toAgentId,
      timestamp: new Date(),
      data: {
        fromAgentId: node.config.fromAgentId,
        toAgentId: node.config.toAgentId,
        handoffPrompt: handoffPrompt
      }
    });

    return {
      fromAgentId: node.config.fromAgentId,
      toAgentId: node.config.toAgentId,
      handoffPrompt: handoffPrompt,
      preserveContext: node.config.preserveContext,
      timestamp: new Date()
    };
  }

  /**
   * Execute condition node
   */
  private async executeCondition(
    node: WorkflowNode & { type: WorkflowNodeType.CONDITION; config: { expression: string; truthyOutput?: any; falsyOutput?: any } },
    context: ExecutionContext
  ): Promise<any> {
    this.logger.debug(`🔍 Executing condition: ${node.name}`);

    try {
      // Evaluate JavaScript expression in safe context
      const expression = node.config.expression;
      const result = this.evaluateExpression(expression, context.variables);
      
      return {
        condition: expression,
        result: Boolean(result),
        output: Boolean(result) ? node.config.truthyOutput : node.config.falsyOutput
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Safely evaluate JavaScript expressions
   */
  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    // Create safe evaluation context
    const context = {
      ...variables,
      Math,
      Date,
      String,
      Number,
      Boolean,
      Array,
      Object
    };

    try {
      // Use Function constructor for safer evaluation than eval
      const func = new Function(...Object.keys(context), `return (${expression});`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error(`Expression evaluation error: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Find next nodes to execute
   */
  private findNextNodes(
    currentNode: WorkflowNode,
    workflow: UnifiedWorkflow,
    context: ExecutionContext
  ): WorkflowNode[] {
    const connections = workflow.definition.connections.filter(
      c => c.sourceNodeId === currentNode.id
    );

    const nextNodes: WorkflowNode[] = [];

    for (const connection of connections) {
      // Check connection condition if present
      if (connection.condition) {
        try {
          const conditionResult = this.evaluateExpression(connection.condition, context.variables);
          if (!conditionResult) continue;
        } catch (error) {
          this.logger.warn(`Connection condition evaluation failed: ${getErrorMessage(error)}`);
          continue;
        }
      }

      const nextNode = workflow.definition.nodes.find(n => n.id === connection.targetNodeId);
      if (nextNode) {
        nextNodes.push(nextNode);
      }
    }

    return nextNodes;
  }

  /**
   * Finalize execution
   */
  private async finalizeExecution(execution: WorkflowExecution): Promise<void> {
    // Update database
    await this.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: execution.status,
        output: execution.output,
        error: execution.error as any,
        completedAt: execution.completedAt,
        nodeExecutions: execution.nodeExecutions,
        context: this.serializeContext(execution.context),
        statistics: execution.statistics,
        logs: execution.logs,
        metadata: execution.metadata
      }
    });

    // Remove from active executions
    this.activeExecutions.delete(execution.id);

    // Unregister from heartbeat monitoring
    if (this.config.enableHeartbeatMonitoring) {
      // Implementation would remove from heartbeat service
    }

    // Emit completion event
    const eventType = execution.status === WorkflowExecutionStatus.COMPLETED
      ? WorkflowEventType.WORKFLOW_COMPLETED
      : execution.status === WorkflowExecutionStatus.FAILED
      ? WorkflowEventType.WORKFLOW_FAILED
      : WorkflowEventType.WORKFLOW_CANCELLED;

    this.emitWorkflowEvent({
      id: `event_${Date.now()}`,
      type: eventType,
      workflowId: execution.workflowId,
      executionId: execution.id,
      timestamp: new Date(),
      data: {
        duration: execution.duration,
        completedNodes: execution.statistics.completedNodes,
        failedNodes: execution.statistics.failedNodes
      }
    });

    // Update metrics
    this.updateMetrics(execution);
  }

  /**
   * Emit workflow event
   */
  private emitWorkflowEvent(event: WorkflowEvent): void {
    this.emit('workflowEvent', event);
    
    if (this.config.debug) {
      this.logger.debug(`Workflow event: ${event.type} - ${event.workflowId}`);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(execution: WorkflowExecution): void {
    if (execution.duration) {
      const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + execution.duration;
      this.metrics.averageExecutionTime = totalTime / this.metrics.totalExecutions;
    }
    
    this.metrics.activeExecutionCount = this.activeExecutions.size;
  }

  /**
   * Helper methods
   */
  private extractWorkflowVariables(workflow: UnifiedWorkflow): Record<string, any> {
    const variables: Record<string, any> = {};
    
    for (const variable of workflow.definition.variables) {
      variables[variable.name] = variable.defaultValue;
    }
    
    return variables;
  }

  private convertDbWorkflowToUnified(dbWorkflow: any): UnifiedWorkflow {
    // Convert database format to unified format
    // This would need to be implemented based on your database schema
    return {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      description: dbWorkflow.description,
      definition: dbWorkflow.definition || {
        version: '1.0.0',
        nodes: [],
        connections: [],
        variables: [],
        triggers: [],
        settings: {
          parallel: false,
          maxConcurrentExecutions: 1,
          timeoutMs: 300000,
          retryPolicy: { enabled: false, maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2, maxDelayMs: 30000 },
          errorHandling: { onError: 'stop', captureErrors: true, notifyOnError: true },
          logging: { level: 'info', includeInputs: true, includeOutputs: true, includeTiming: true, retentionDays: 30 },
          notifications: { onStart: false, onComplete: true, onError: true, channels: [] }
        }
      },
      status: dbWorkflow.status,
      agentId: dbWorkflow.agentId,
      userId: dbWorkflow.userId,
      version: '1.0.0',
      tags: [],
      isTemplate: false,
      createdAt: dbWorkflow.createdAt,
      updatedAt: dbWorkflow.updatedAt,
      lastExecutedAt: dbWorkflow.lastExecutedAt,
      executionCount: 0,
      statistics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        performance: {
          averageCpuUsage: 0,
          averageMemoryUsage: 0,
          peakMemoryUsage: 0,
          throughput: 0,
          bottleneckNodes: []
        }
      },
      metadata: {
        category: 'general',
        tags: [],
        author: 'system',
        dependencies: [],
        integrations: [],
        customProperties: {}
      }
    };
  }

  private async loadExecution(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const dbExecution = await this.prisma.workflowExecution.findUnique({
        where: { id: executionId }
      });

      if (!dbExecution) return null;

      // Convert database format to execution format
      const nodeExecutions = (dbExecution.nodeExecutions as NodeExecution[]) || [];
      const contextData = dbExecution.context || {};
      const context = this.deserializeContext(contextData);

      // Ensure IDs match
      context.workflowId = dbExecution.workflowId;
      context.executionId = dbExecution.id;

      return {
        id: dbExecution.id,
        workflowId: dbExecution.workflowId,
        status: dbExecution.status,
        triggeredBy: dbExecution.triggeredBy || 'system',
        triggerType: 'manual' as any,
        input: dbExecution.input as Record<string, any>,
        output: dbExecution.output as Record<string, any>,
        startedAt: dbExecution.startedAt,
        completedAt: dbExecution.completedAt,
        nodeExecutions: nodeExecutions,
        context: context,
        statistics: (dbExecution.statistics as any) || {
          totalNodes: 0,
          completedNodes: 0,
          failedNodes: 0,
          skippedNodes: 0,
          totalDuration: 0,
          averageNodeDuration: 0
        },
        logs: (dbExecution.logs as any) || [],
        metadata: (dbExecution.metadata as any) || {}
      };
    } catch (error) {
      this.logger.error(`Failed to load execution ${executionId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Create handoff prompt (simplified implementation)
   */
  private createHandoffPrompt(
    templateId: string,
    _context: {
      fromAgentId: string;
      toAgentId: string;
      workflowContext: Record<string, any>;
      preserveContext: boolean;
      executionId: string;
    }
  ): string {
    // Simple handoff prompt template
    return `Agent handoff from ${_context.fromAgentId} to ${_context.toAgentId}. ` +
           `Execution ID: ${_context.executionId}. ` +
           `Context preservation: ${_context.preserveContext ? 'enabled' : 'disabled'}. ` +
           `Template: ${templateId}. ` +
           `Workflow context: ${JSON.stringify(_context.workflowContext, null, 2)}`;
  }

  // SECURITY: Generate cryptographically secure random IDs
  private generateSecureId(): string {
    // Use crypto module for secure random generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // Modern browsers and Node.js 15+ support randomUUID
      return crypto.randomUUID().replace(/-/g, '').substring(0, 9);
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Fallback for older environments with crypto.getRandomValues
      const array = new Uint8Array(9);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(36)).join('').substring(0, 9);
    } else {
      // Node.js fallback using crypto module
      const { randomBytes } = require('crypto');
      return randomBytes(9).toString('hex').substring(0, 9);
    }
  }

  /**
   * Public API methods
   */
  getMetrics() {
    return { ...this.metrics };
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  async getWorkflowExecutions(workflowId: string, _limit: number = 10): Promise<WorkflowExecution[]> {
    // Implementation to get workflow executions from database
    return [];
  }
}