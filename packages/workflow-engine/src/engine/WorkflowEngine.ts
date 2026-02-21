/**
 * Unified Workflow Engine for The New Fuse Framework
 * 
 * This engine consolidates all workflow execution capabilities from various scattered implementations.
 * It integrates with the Master Agent Registry, Relay System, and Orchestration Services to provide a cohesive workflow experience.
 */

import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/relay-core';
// import { PrismaClient } from '@prisma/client';
import { WorkflowQueue } from '../queue/WorkflowQueue';
import { telemetry } from '../telemetry/TelemetryService';
import { WorkflowExecutor } from '../executor/WorkflowExecutor';
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
    activeExecutionCount: 0
  };

  constructor(
    config: WorkflowEngineConfig,
    prisma: any /* PrismaClient */,
    agentRegistry: MasterAgentRegistry,
    heartbeatService: HeartbeatMonitoringService,
    logger: Logger,
    workflowQueue?: WorkflowQueue
  ) {
    super();
    this.config = config;
    this.prisma = prisma;
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
            enableDebugLogging: config.debug
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
      userContext: context.userContext
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
      relayConnection: null
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
            if (this.workflowQueue) {
                await this.workflowQueue.addStartWorkflowJob({
                    executionId: dbExecution.id,
                    workflowId: dbExecution.workflowId
                });
                this.logger.info(`🔄 Re-queued interrupted execution: ${dbExecution.id}`);
            } else {
                this.logger.warn(`Cannot recover execution ${dbExecution.id}: WorkflowQueue not initialized.`);
            }
        } catch (err) {
            this.logger.error(`❌ Failed to recover execution ${dbExecution.id}: ${getErrorMessage(err)}`);
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
    return telemetry.startActiveSpan('executeWorkflow', async (span) => {
      span.setAttribute('workflowId', workflowId);
      span.setAttribute('triggeredBy', triggeredBy);
      span.setAttribute('triggerType', triggerType);

      try {
        this.logger.info(`🚀 Starting workflow execution: ${workflowId}`);

        const workflow = await this.loadWorkflow(workflowId);
        if (!workflow) {
          throw new Error(`Workflow not found: ${workflowId}`);
        }

        if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
          throw new Error('Maximum concurrent executions reached');
        }

        const execution = await this.createExecution(workflow, input, triggeredBy, triggerType);
        span.setAttribute('executionId', execution.id);

        await this.startExecution(execution);

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
      metadata: {}
    };

    await this.finalizeExecution(execution);
    this.logger.info(`🛑 Workflow execution cancelled: ${executionId} - ${reason}`);
    
    return true;
  }

  public async loadWorkflow(workflowId: string): Promise<UnifiedWorkflow | null> {
    try {
      const dbWorkflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: { orderBy: { order: 'asc' } },
          agent: true
        }
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
        relayConnection: null
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

  private async startExecution(execution: WorkflowExecution): Promise<void> {
    this.activeExecutions.set(execution.id, execution);

    if (this.workflowQueue) {
      await this.workflowQueue.addStartWorkflowJob({
        executionId: execution.id,
        workflowId: execution.workflowId
      });
    } else {
      this.logger.warn('WorkflowQueue not initialized. Execution will not start automatically.');
    }
    
    this.emitWorkflowEvent({
      id: `event_${Date.now()}`,
      type: WorkflowEventType.WORKFLOW_STARTED,
      workflowId: execution.workflowId,
      executionId: execution.id,
      timestamp: new Date(),
      data: { triggeredBy: execution.triggeredBy }
    });

    if (this.config.enableHeartbeatMonitoring) {
      this.heartbeatService.registerAgent(execution.id, this.config.defaultTimeoutMs);
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  public async executeNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    return telemetry.startActiveSpan('executeNode', async (span) => {
        span.setAttribute('nodeId', node.id);
        span.setAttribute('nodeType', node.type);
        span.setAttribute('executionId', context.executionId);

        let execution = this.activeExecutions.get(context.executionId);
        if (!execution) {
            execution = await this.loadExecution(context.executionId) || undefined;
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
      Object
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
      c => c.sourceNodeId === currentNode.id
    );

    const nextNodes: WorkflowNode[] = [];

    for (const connection of connections) {
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

  public async finalizeExecution(execution: WorkflowExecution): Promise<void> {
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

    this.activeExecutions.delete(execution.id);

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
      const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + execution.duration;
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

  async getWorkflowExecutions(workflowId: string, _limit: number = 10): Promise<WorkflowExecution[]> {
    return [];
  }
}
