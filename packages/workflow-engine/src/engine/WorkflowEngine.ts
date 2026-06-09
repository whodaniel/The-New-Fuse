/**
 * Unified Workflow Engine for The New Fuse Framework
 *
 * This engine consolidates all workflow execution capabilities from various scattered implementations.
 * It integrates with the Master Agent Registry, Relay System, and Orchestration Services to provide a cohesive workflow experience.
 */

import { Logger } from '@the-new-fuse/relay-core';
import { EventEmitter } from 'events';
// import { DrizzleClient } from '@drizzle/client';
import { WorkflowExecutor } from '../executor/WorkflowExecutor.js';
import { WorkflowQueue } from '../queue/WorkflowQueue.js';
import { telemetry } from '../telemetry/TelemetryService.js';
import {
  ExecutionContext,
  NodeExecution,
  UnifiedWorkflow,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowNode,
  WorkflowNodeType,
  NodeExecutionStatus,
} from '../types/WorkflowTypes.js';
import { getErrorMessage } from '../utils/errorUtils.js';
import { assertDevLoopBudget } from '../utils/dev-loop-guard.js';

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
  private drizzle: any; // DrizzleClient;
  private agentRegistry: MasterAgentRegistry;
  private heartbeatService: HeartbeatMonitoringService;
  private workflowQueue?: WorkflowQueue;
  private executor: WorkflowExecutor;
  private isRunning: boolean = true;

  // Execution tracking
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  // Performance metrics
  private metrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    activeExecutionCount: 0,
  };

  constructor(
    config: WorkflowEngineConfig,
    drizzle: any /* DrizzleClient */,
    agentRegistry: MasterAgentRegistry,
    heartbeatService: HeartbeatMonitoringService,
    logger: Logger,
    workflowQueue?: WorkflowQueue
  ) {
    super();
    this.config = config;
    this.drizzle = drizzle;
    this.agentRegistry = agentRegistry;
    this.heartbeatService = heartbeatService;
    this.workflowQueue = workflowQueue;
    this.logger = logger;

    this.executor = new WorkflowExecutor(
      {
        maxParallelNodes: 1,
        nodeTimeoutMs: config.defaultTimeoutMs,
        retryDelayMs: 1000,
        maxRetries: 3,
        enableDebugLogging: config.debug,
      },
      agentRegistry,
      logger
    );

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
      userContext: context.userContext,
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
      agentRegistry: this.agentRegistry,
      relayConnection: null,
    };
  }

  /**
   * Recover interrupted executions on startup
   */
  private async recoverInterruptedExecutions(): Promise<void> {
    try {
      this.logger.info('🔄 Checking for interrupted workflow executions...');

      const interruptedExecutions = await this.drizzle.workflowExecution.findMany({
        where: {
          status: WorkflowExecutionStatus.RUNNING,
        },
      });

      if (interruptedExecutions.length === 0) {
        this.logger.info('✅ No interrupted executions found.');
        return;
      }

      this.logger.info(
        `⚠️ Found ${interruptedExecutions.length} interrupted executions. Attempting recovery...`
      );

      for (const dbExecution of interruptedExecutions) {
        try {
          if (this.workflowQueue) {
            await this.workflowQueue.addStartWorkflowJob({
              executionId: dbExecution.id,
              workflowId: dbExecution.workflowId,
            });
            this.logger.info(`🔄 Re-queued interrupted execution: ${dbExecution.id}`);
          } else {
            const execution = await this.loadExecution(dbExecution.id);
            if (!execution) {
              this.logger.warn(`Cannot recover execution ${dbExecution.id}: execution not found.`);
              continue;
            }

            this.activeExecutions.set(execution.id, execution);
            void this.runExecutionInProcess(execution).catch(async (error) => {
              await this.failExecution(execution, error);
            });
            this.logger.info(`🔄 Resuming interrupted execution in-process: ${dbExecution.id}`);
          }
        } catch (err) {
          this.logger.error(
            `❌ Failed to recover execution ${dbExecution.id}: ${getErrorMessage(err)}`
          );
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
    const devLoopIteration = assertDevLoopBudget(`workflow.${workflowId}`, input);
    return telemetry.startActiveSpan('executeWorkflow', async (span) => {
      span.setAttribute('workflowId', workflowId);
      span.setAttribute('triggeredBy', triggeredBy);
      span.setAttribute('triggerType', triggerType);
      span.setAttribute('devLoopIteration', devLoopIteration);

      try {
        this.logger.info(`🚀 Starting workflow execution: ${workflowId}`);

        const workflow = await this.loadWorkflow(workflowId);
        if (!workflow) {
          throw new Error(`Workflow not found: ${workflowId}`);
        }

        if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
          throw new Error('Maximum concurrent executions reached');
        }

        const execution = await this.createExecution(
          workflow,
          { ...input, devLoopIteration },
          triggeredBy,
          triggerType
        );
        span.setAttribute('executionId', execution.id);

        await this.startExecution(execution, workflow);

        this.metrics.totalExecutions++;
        this.logger.info(`✅ Workflow execution started: ${execution.id}`);

        return execution.id;
      } catch (error) {
        this.logger.error(`❌ Failed to start workflow execution: ${getErrorMessage(error)}`);
        throw error;
      }
    });
  }

  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    const activeExecution = this.activeExecutions.get(executionId);
    if (activeExecution) {
      return activeExecution;
    }
    return this.loadExecution(executionId);
  }

  async cancelExecution(executionId: string, reason: string = 'User cancelled'): Promise<boolean> {
    const execution = await this.getExecutionStatus(executionId);
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
      metadata: {},
    };

    await this.finalizeExecution(execution);
    this.logger.info(`🛑 Workflow execution cancelled: ${executionId} - ${reason}`);

    return true;
  }

  public async loadWorkflow(workflowId: string): Promise<UnifiedWorkflow | null> {
    try {
      const dbWorkflow = await this.drizzle.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: { orderBy: { order: 'asc' } },
          agent: true,
        },
      });

      if (!dbWorkflow) return null;
      return this.convertDbWorkflowToUnified(dbWorkflow);
    } catch (error) {
      this.logger.error(`Failed to load workflow ${workflowId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  private async createExecution(
    workflow: UnifiedWorkflow,
    input: Record<string, any>,
    triggeredBy: string,
    triggerType: string
  ): Promise<WorkflowExecution> {
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
        relayConnection: null,
      },
      statistics: {
        totalNodes: workflow.definition.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
        totalDuration: 0,
        averageNodeDuration: 0,
      },
      logs: [],
      metadata: {
        taskId: this.extractTaskId(input),
        workflowVersion: workflow.version,
        engineVersion: '1.0.0',
      },
    };

    await this.drizzle.workflowExecution.create({
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
        metadata: execution.metadata,
      },
    });

    return execution;
  }

  private async startExecution(
    execution: WorkflowExecution,
    workflow?: UnifiedWorkflow
  ): Promise<void> {
    this.activeExecutions.set(execution.id, execution);

    if (this.workflowQueue) {
      await this.workflowQueue.addStartWorkflowJob({
        executionId: execution.id,
        workflowId: execution.workflowId,
      });
    } else {
      this.logger.info('WorkflowQueue not initialized. Running execution in-process.');
      void this.runExecutionInProcess(execution, workflow).catch(async (error) => {
        await this.failExecution(execution, error);
      });
    }

    this.emitWorkflowEvent({
      id: `event_${Date.now()}`,
      type: WorkflowEventType.WORKFLOW_STARTED,
      workflowId: execution.workflowId,
      executionId: execution.id,
      timestamp: new Date(),
      data: { triggeredBy: execution.triggeredBy },
    });

    if (this.config.enableHeartbeatMonitoring) {
      this.heartbeatService.registerAgent(execution.id, this.config.defaultTimeoutMs);
    }
  }

  private async runExecutionInProcess(
    execution: WorkflowExecution,
    workflow?: UnifiedWorkflow
  ): Promise<void> {
    const activeWorkflow = workflow || (await this.loadWorkflow(execution.workflowId));
    if (!activeWorkflow) {
      throw new Error(`Workflow not found: ${execution.workflowId}`);
    }

    execution.status = WorkflowExecutionStatus.RUNNING;
    this.appendExecutionLog(execution, 'info', 'Workflow execution started');

    const pendingNodes = this.getStartNodes(activeWorkflow);
    if (pendingNodes.length === 0) {
      throw new Error(`Workflow ${activeWorkflow.id} has no executable start nodes`);
    }

    const completedNodeIds = new Set(
      execution.nodeExecutions
        .filter((nodeExecution) => nodeExecution.status === NodeExecutionStatus.COMPLETED)
        .map((nodeExecution) => nodeExecution.nodeId)
    );
    const queuedNodeIds = new Set(pendingNodes.map((node) => node.id));
    const visitCounts = new Map<string, number>();
    const maxSteps = this.getMaxSequencerSteps(activeWorkflow);
    let steps = 0;

    while (pendingNodes.length > 0) {
      if (!this.isRunning || execution.status !== WorkflowExecutionStatus.RUNNING) {
        return;
      }

      if (steps >= maxSteps) {
        throw new Error(`Workflow ${activeWorkflow.id} exceeded max sequencer steps (${maxSteps})`);
      }

      const node = pendingNodes.shift()!;
      queuedNodeIds.delete(node.id);

      if (completedNodeIds.has(node.id) && !this.nodeAllowsRepeat(node)) {
        for (const nextNode of this.findNextNodes(node, activeWorkflow, execution.context)) {
          if (!completedNodeIds.has(nextNode.id) && !queuedNodeIds.has(nextNode.id)) {
            pendingNodes.push(nextNode);
            queuedNodeIds.add(nextNode.id);
          }
        }
        continue;
      }

      const visitCount = (visitCounts.get(node.id) || 0) + 1;
      visitCounts.set(node.id, visitCount);
      if (visitCount > this.getNodeMaxVisits(node)) {
        this.recordSkippedNode(execution, node, 'Node max visit count reached');
        continue;
      }

      steps++;
      const nodeExecution = await this.executeNodeInSequence(node, execution);
      execution.nodeExecutions.push(nodeExecution);

      if (nodeExecution.status === NodeExecutionStatus.COMPLETED) {
        completedNodeIds.add(node.id);
        execution.statistics.completedNodes++;
        const contextOutput = this.createSerializableNodeOutput(node, nodeExecution.output);
        nodeExecution.output = contextOutput;
        execution.context.temporaryData[node.id] = contextOutput;
        if (node.type !== WorkflowNodeType.END) {
          execution.context.variables[node.id] = contextOutput;
          execution.context.variables[`${node.id}Output`] = contextOutput;
        }

        this.emitWorkflowEvent({
          id: `event_${Date.now()}_${this.generateSecureId()}`,
          type: WorkflowEventType.NODE_COMPLETED,
          workflowId: execution.workflowId,
          executionId: execution.id,
          nodeId: node.id,
          timestamp: new Date(),
          data: {
            duration: nodeExecution.duration,
            output: nodeExecution.output,
          },
        });

        await this.persistExecutionProgress(execution);

        for (const nextNode of this.findNextNodes(node, activeWorkflow, execution.context)) {
          if (
            (this.nodeAllowsRepeat(nextNode) || !completedNodeIds.has(nextNode.id)) &&
            !queuedNodeIds.has(nextNode.id)
          ) {
            pendingNodes.push(nextNode);
            queuedNodeIds.add(nextNode.id);
          }
        }
      } else if (this.shouldContinueAfterNodeError(activeWorkflow)) {
        execution.statistics.failedNodes++;
        await this.persistExecutionProgress(execution);
      } else {
        execution.statistics.failedNodes++;
        execution.error = nodeExecution.error;
        execution.status = WorkflowExecutionStatus.FAILED;
        await this.finalizeExecution(execution);
        return;
      }
    }

    execution.status = WorkflowExecutionStatus.COMPLETED;
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.statistics.totalDuration = execution.duration;
    execution.statistics.averageNodeDuration =
      execution.statistics.completedNodes > 0
        ? execution.statistics.totalDuration / execution.statistics.completedNodes
        : 0;
    execution.output = {
      variables: execution.context.variables,
      temporaryData: execution.context.temporaryData,
      completedNodes: execution.statistics.completedNodes,
      failedNodes: execution.statistics.failedNodes,
      skippedNodes: execution.statistics.skippedNodes,
    };
    this.appendExecutionLog(execution, 'info', 'Workflow execution completed');

    await this.finalizeExecution(execution);
  }

  private getStartNodes(workflow: UnifiedWorkflow): WorkflowNode[] {
    const startNodes = workflow.definition.nodes.filter(
      (node) => node.type === WorkflowNodeType.START
    );
    if (startNodes.length > 0) {
      return startNodes;
    }

    const targetNodeIds = new Set(
      workflow.definition.connections.map((connection) => connection.targetNodeId)
    );
    return workflow.definition.nodes.filter((node) => !targetNodeIds.has(node.id));
  }

  private getMaxSequencerSteps(workflow: UnifiedWorkflow): number {
    const configuredMax = (workflow.definition.settings as any)?.maxSequencerSteps;
    if (typeof configuredMax === 'number' && configuredMax > 0) {
      return configuredMax;
    }

    return Math.max(workflow.definition.nodes.length * 10, 100);
  }

  private getNodeMaxVisits(node: WorkflowNode): number {
    const configuredMax = node.config?.maxVisits;
    return typeof configuredMax === 'number' && configuredMax > 0 ? configuredMax : 1;
  }

  private nodeAllowsRepeat(node: WorkflowNode): boolean {
    return node.config?.allowRepeat === true || node.type === WorkflowNodeType.LOOP;
  }

  private async executeNodeInSequence(
    node: WorkflowNode,
    execution: WorkflowExecution
  ): Promise<NodeExecution> {
    const startedAt = new Date();
    this.appendExecutionLog(execution, 'info', `Executing node: ${node.name}`, node.id);

    this.emitWorkflowEvent({
      id: `event_${Date.now()}_${this.generateSecureId()}`,
      type: WorkflowEventType.NODE_STARTED,
      workflowId: execution.workflowId,
      executionId: execution.id,
      nodeId: node.id,
      timestamp: startedAt,
      data: {
        nodeType: node.type,
        nodeName: node.name,
      },
    });

    try {
      const output = await this.executor.executeStep(node, execution.context, execution);
      const completedAt = new Date();
      return {
        id: `node_exec_${Date.now()}_${this.generateSecureId()}`,
        nodeId: node.id,
        status: NodeExecutionStatus.COMPLETED,
        input: this.extractNodeExecutionInput(node, execution.context),
        output,
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        retryCount: 0,
        metadata: {
          nodeType: node.type,
          nodeName: node.name,
        },
      };
    } catch (error) {
      const completedAt = new Date();
      const executionError = {
        code: 'NODE_EXECUTION_FAILED',
        message: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : undefined,
        nodeId: node.id,
        timestamp: completedAt,
        recoverable: false,
        metadata: {},
      };

      this.appendExecutionLog(
        execution,
        'error',
        `Node execution failed: ${getErrorMessage(error)}`,
        node.id
      );
      this.emitWorkflowEvent({
        id: `event_${Date.now()}_${this.generateSecureId()}`,
        type: WorkflowEventType.NODE_FAILED,
        workflowId: execution.workflowId,
        executionId: execution.id,
        nodeId: node.id,
        timestamp: completedAt,
        data: {
          error: executionError,
        },
      });

      return {
        id: `node_exec_${Date.now()}_${this.generateSecureId()}`,
        nodeId: node.id,
        status: NodeExecutionStatus.FAILED,
        input: this.extractNodeExecutionInput(node, execution.context),
        error: executionError,
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        retryCount: 0,
        metadata: {
          nodeType: node.type,
          nodeName: node.name,
        },
      };
    }
  }

  private extractNodeExecutionInput(
    node: WorkflowNode,
    context: ExecutionContext
  ): Record<string, any> {
    if (!Array.isArray(node.inputs) || node.inputs.length === 0) {
      return {};
    }

    return node.inputs.reduce<Record<string, any>>((input, nodeInput) => {
      if (context.variables[nodeInput.name] !== undefined) {
        input[nodeInput.name] = context.variables[nodeInput.name];
      } else if (nodeInput.defaultValue !== undefined) {
        input[nodeInput.name] = nodeInput.defaultValue;
      }
      return input;
    }, {});
  }

  private createSerializableNodeOutput(node: WorkflowNode, output: any): any {
    if (node.type === WorkflowNodeType.END && output && typeof output === 'object') {
      return {
        ...output,
        finalOutput: this.cloneSerializable(output.finalOutput || {}),
      };
    }

    return this.cloneSerializable(output);
  }

  private cloneSerializable(value: any): any {
    if (value === undefined || value === null) {
      return value;
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return {
        unserializable: true,
        type: typeof value,
        summary: String(value),
      };
    }
  }

  private recordSkippedNode(execution: WorkflowExecution, node: WorkflowNode, reason: string): void {
    const timestamp = new Date();
    execution.nodeExecutions.push({
      id: `node_exec_${Date.now()}_${this.generateSecureId()}`,
      nodeId: node.id,
      status: NodeExecutionStatus.SKIPPED,
      startedAt: timestamp,
      completedAt: timestamp,
      duration: 0,
      retryCount: 0,
      metadata: {
        nodeType: node.type,
        nodeName: node.name,
        reason,
      },
    });
    execution.statistics.skippedNodes++;
    this.appendExecutionLog(execution, 'debug', `Skipped node: ${reason}`, node.id);
  }

  private shouldContinueAfterNodeError(workflow: UnifiedWorkflow): boolean {
    const onError = workflow.definition.settings?.errorHandling?.onError;
    return onError === 'continue' || onError === 'skip';
  }

  private async persistExecutionProgress(execution: WorkflowExecution): Promise<void> {
    await this.drizzle.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: execution.status,
        nodeExecutions: execution.nodeExecutions,
        context: this.serializeContext(execution.context),
        statistics: execution.statistics,
        logs: execution.logs,
        metadata: execution.metadata,
      },
    });
  }

  private appendExecutionLog(
    execution: WorkflowExecution,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    nodeId?: string,
    metadata: Record<string, any> = {}
  ): void {
    execution.logs.push({
      id: `log_${Date.now()}_${this.generateSecureId()}`,
      timestamp: new Date(),
      level,
      message,
      nodeId,
      metadata,
    });
  }

  private async failExecution(execution: WorkflowExecution, error: unknown): Promise<void> {
    execution.status = WorkflowExecutionStatus.FAILED;
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    execution.error = {
      code: 'WORKFLOW_EXECUTION_FAILED',
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: execution.completedAt,
      recoverable: false,
      metadata: {},
    };
    this.appendExecutionLog(execution, 'error', `Workflow execution failed: ${getErrorMessage(error)}`);
    await this.finalizeExecution(execution);
  }

  public stop(): void {
    this.isRunning = false;
  }

  public async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    assertDevLoopBudget(`workflow-node.${node.type}`, context);
    return telemetry.startActiveSpan('executeNode', async (span) => {
      span.setAttribute('nodeId', node.id);
      span.setAttribute('nodeType', node.type);
      span.setAttribute('executionId', context.executionId);

      let execution = this.activeExecutions.get(context.executionId);
      if (!execution) {
        execution = (await this.loadExecution(context.executionId)) || undefined;
      }

      if (!execution) {
        throw new Error(`Execution ${context.executionId} not found`);
      }

      return await this.executor.executeStep(node, context, execution);
    });
  }

  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    const context = {
      ...variables,
      Math,
      Date,
      String,
      Number,
      Boolean,
      Array,
      Object,
    };

    try {
      const func = new Function(...Object.keys(context), `return (${expression});`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error(`Expression evaluation error: ${getErrorMessage(error)}`);
    }
  }

  public findNextNodes(
    currentNode: WorkflowNode,
    workflow: UnifiedWorkflow,
    context: ExecutionContext
  ): WorkflowNode[] {
    const connections = workflow.definition.connections.filter(
      (c) => c.sourceNodeId === currentNode.id
    );

    const nextNodes: WorkflowNode[] = [];

    for (const connection of connections) {
      if (!this.connectionMatchesSelectedOutput(currentNode, connection, context)) {
        continue;
      }

      if (connection.condition) {
        try {
          const conditionResult = this.evaluateExpression(connection.condition, context.variables);
          if (!conditionResult) continue;
        } catch (error) {
          this.logger.warn(`Connection condition evaluation failed: ${getErrorMessage(error)}`);
          continue;
        }
      }

      const nextNode = workflow.definition.nodes.find((n) => n.id === connection.targetNodeId);
      if (nextNode) {
        nextNodes.push(nextNode);
      }
    }

    return nextNodes;
  }

  private connectionMatchesSelectedOutput(
    currentNode: WorkflowNode,
    connection: { sourceOutputId?: string; sourceHandle?: string },
    context: ExecutionContext
  ): boolean {
    if (currentNode.type !== WorkflowNodeType.CONDITION) {
      return true;
    }

    const nodeOutput =
      context.temporaryData[currentNode.id] || context.variables[`${currentNode.id}Output`];
    const selectedOutput = nodeOutput?.selectedOutput;
    if (typeof selectedOutput !== 'string' || selectedOutput.length === 0) {
      return true;
    }

    return connection.sourceOutputId === selectedOutput || connection.sourceHandle === selectedOutput;
  }

  public async finalizeExecution(execution: WorkflowExecution): Promise<void> {
    await this.drizzle.workflowExecution.update({
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
        metadata: execution.metadata,
      },
    });

    this.activeExecutions.delete(execution.id);

    const eventType =
      execution.status === WorkflowExecutionStatus.COMPLETED
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
        failedNodes: execution.statistics.failedNodes,
      },
    });

    this.updateMetrics(execution);
  }

  private emitWorkflowEvent(event: WorkflowEvent): void {
    this.emit('workflowEvent', event);

    if (this.config.debug) {
      this.logger.debug(`Workflow event: ${event.type} - ${event.workflowId}`);
    }
  }

  private updateMetrics(execution: WorkflowExecution): void {
    if (execution.duration) {
      const totalTime =
        this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + execution.duration;
      this.metrics.averageExecutionTime = totalTime / this.metrics.totalExecutions;
    }
    this.metrics.activeExecutionCount = this.activeExecutions.size;
  }

  private extractWorkflowVariables(workflow: UnifiedWorkflow): Record<string, any> {
    const variables: Record<string, any> = {};
    for (const variable of workflow.definition.variables) {
      variables[variable.name] = variable.defaultValue;
    }
    return variables;
  }

  private extractTaskId(input: Record<string, any>): string | undefined {
    const candidate = input?.taskId || input?.recordId || input?.integrationId || input?.id;
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
  }

  private convertDbWorkflowToUnified(dbWorkflow: any): UnifiedWorkflow {
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
          retryPolicy: {
            enabled: false,
            maxAttempts: 3,
            delayMs: 1000,
            backoffMultiplier: 2,
            maxDelayMs: 30000,
          },
          errorHandling: { onError: 'stop', captureErrors: true, notifyOnError: true },
          logging: {
            level: 'info',
            includeInputs: true,
            includeOutputs: true,
            includeTiming: true,
            retentionDays: 30,
          },
          notifications: { onStart: false, onComplete: true, onError: true, channels: [] },
        },
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
          bottleneckNodes: [],
        },
      },
      metadata: {
        category: 'general',
        tags: [],
        author: 'system',
        dependencies: [],
        integrations: [],
        customProperties: {},
      },
    };
  }

  private async loadExecution(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const dbExecution = await this.drizzle.workflowExecution.findUnique({
        where: { id: executionId },
      });

      if (!dbExecution) return null;

      const nodeExecutions = (dbExecution.nodeExecutions as NodeExecution[]) || [];
      const contextData = dbExecution.context || {};
      const context = this.deserializeContext(contextData);

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
          averageNodeDuration: 0,
        },
        logs: (dbExecution.logs as any) || [],
        metadata: (dbExecution.metadata as any) || {},
      };
    } catch (error) {
      this.logger.error(`Failed to load execution ${executionId}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  private generateSecureId(): string {
    const { randomBytes } = require('crypto');
    return randomBytes(9).toString('hex').substring(0, 9);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  async updateExecutionState(executionId: string, context: any): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      (execution.context as any).variables = {
        ...execution.context.variables,
        ...(context.variables || {}),
      };
    }
  }

  async getWorkflowExecutions(
    workflowId: string,
    _limit: number = 10
  ): Promise<WorkflowExecution[]> {
    return [];
  }
}
