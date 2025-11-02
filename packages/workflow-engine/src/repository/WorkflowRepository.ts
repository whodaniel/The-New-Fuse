/**
 * Workflow Repository - Persistence Layer for Unified Workflow Engine
 * 
 * Provides database operations for workflows and executions
 * Integrates with existing Prisma schema and database structure
 */

// import { PrismaClient } from '@prisma/client';
import { Logger } from '@tnf/relay-core';
import {
  UnifiedWorkflow,
  WorkflowExecution,
  WorkflowQuery,
  ExecutionQuery,
  WorkflowStatus,
  WorkflowExecutionStatus
} from '../types/WorkflowTypes.js';
import { getErrorMessage } from '../utils/errorUtils.js';

export interface RepositoryConfig {
  enableCaching: boolean;
  cacheTimeoutMs: number;
  maxCacheSize: number;
  enableMetrics: boolean;
}

export class WorkflowRepository {
  private prisma: any; // PrismaClient;
  private logger: Logger;
  private config: RepositoryConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(prisma: any /* PrismaClient */, config: RepositoryConfig, logger: Logger) {
    this.prisma = prisma;
    this.config = config;
    this.logger = logger;

    if (config.enableCaching) {
      this.startCacheCleanup();
    }
  }

  /**
   * Workflow CRUD operations
   */
  async createWorkflow(workflow: Omit<UnifiedWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnifiedWorkflow> {
    const dbWorkflow = await this.prisma.workflow.create({
      data: {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        agentId: workflow.agentId,
        userId: workflow.userId,
        definition: workflow.definition as any,
        metadata: workflow.metadata as any,
        version: workflow.version,
        isTemplate: workflow.isTemplate,
        tags: workflow.tags
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        },
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    const unifiedWorkflow = this.convertDbToUnified(dbWorkflow);
    this.invalidateCache(`workflow:${dbWorkflow.id}`);
    
    this.logger.info(`📝 Workflow created: ${workflow.name} (${dbWorkflow.id})`);
    return unifiedWorkflow;
  }

  async getWorkflow(id: string): Promise<UnifiedWorkflow | null> {
    const cacheKey = `workflow:${id}`;
    
    if (this.config.enableCaching) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const dbWorkflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        },
        steps: {
          orderBy: { order: 'asc' }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            error: true
          }
        }
      }
    });

    if (!dbWorkflow) {
      return null;
    }

    const unifiedWorkflow = this.convertDbToUnified(dbWorkflow);
    
    if (this.config.enableCaching) {
      this.setCache(cacheKey, unifiedWorkflow);
    }

    return unifiedWorkflow;
  }

  async updateWorkflow(id: string, updates: Partial<UnifiedWorkflow>): Promise<UnifiedWorkflow | null> {
    const dbWorkflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        status: updates.status,
        definition: updates.definition as any,
        metadata: updates.metadata as any,
        version: updates.version,
        isTemplate: updates.isTemplate,
        tags: updates.tags,
        updatedAt: new Date()
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true
          }
        },
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    });

    const unifiedWorkflow = this.convertDbToUnified(dbWorkflow);
    this.invalidateCache(`workflow:${id}`);
    
    this.logger.info(`📝 Workflow updated: ${dbWorkflow.name} (${id})`);
    return unifiedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await this.prisma.workflow.delete({
        where: { id }
      });
      
      this.invalidateCache(`workflow:${id}`);
      this.logger.info(`🗑️ Workflow deleted: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete workflow ${id}: ${getErrorMessage(error)}`);
      return false;
    }
  }

  async queryWorkflows(query: WorkflowQuery): Promise<{ workflows: UnifiedWorkflow[]; total: number }> {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    if (query.agentId) {
      where.agentId = query.agentId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    if (query.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: query.createdAfter };
    }

    if (query.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: query.createdBefore };
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    const [workflows, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true
            }
          },
          _count: {
            select: {
              steps: true,
              executions: true
            }
          }
        },
        orderBy,
        skip: query.offset || 0,
        take: query.limit || 50
      }),
      this.prisma.workflow.count({ where })
    ]);

    return {
      workflows: workflows.map((wf: any) => this.convertDbToUnified(wf)),
      total
    };
  }

  /**
   * Execution operations
   */
  async createExecution(execution: Omit<WorkflowExecution, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowExecution> {
    const dbExecution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: execution.workflowId,
        status: execution.status,
        triggeredBy: execution.triggeredBy,
        input: execution.input as any,
        startedAt: execution.startedAt
      }
    });

    const unifiedExecution = this.convertDbExecutionToUnified(dbExecution);
    this.logger.debug(`🚀 Execution created: ${dbExecution.id}`);
    return unifiedExecution;
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    const dbExecution = await this.prisma.workflowExecution.findUnique({
      where: { id },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            definition: true
          }
        }
      }
    });

    if (!dbExecution) {
      return null;
    }

    return this.convertDbExecutionToUnified(dbExecution);
  }

  async updateExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | null> {
    const dbExecution = await this.prisma.workflowExecution.update({
      where: { id },
      data: {
        status: updates.status,
        output: updates.output as any,
        error: updates.error ? updates.error.message : null,
        completedAt: updates.completedAt
      }
    });

    return this.convertDbExecutionToUnified(dbExecution);
  }

  async queryExecutions(query: ExecutionQuery): Promise<{ executions: WorkflowExecution[]; total: number }> {
    const where: any = {};

    if (query.workflowId) {
      where.workflowId = query.workflowId;
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status };
    }

    if (query.triggeredBy) {
      where.triggeredBy = query.triggeredBy;
    }

    if (query.startedAfter) {
      where.startedAt = { ...where.startedAt, gte: query.startedAfter };
    }

    if (query.startedBefore) {
      where.startedAt = { ...where.startedAt, lte: query.startedBefore };
    }

    if (query.hasErrors !== undefined) {
      if (query.hasErrors) {
        where.error = { not: null };
      } else {
        where.error = null;
      }
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.startedAt = 'desc';
    }

    const [executions, total] = await Promise.all([
      this.prisma.workflowExecution.findMany({
        where,
        include: {
          workflow: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        skip: query.offset || 0,
        take: query.limit || 50
      }),
      this.prisma.workflowExecution.count({ where })
    ]);

    return {
      executions: executions.map((ex: any) => this.convertDbExecutionToUnified(ex)),
      total
    };
  }

  /**
   * Statistics and analytics
   */
  async getWorkflowStatistics(workflowId?: string): Promise<any> {
    const where = workflowId ? { workflowId } : {};

    const [
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      executionsByStatus
    ] = await Promise.all([
      this.prisma.workflow.count(workflowId ? { where: { id: workflowId } } : {}),
      this.prisma.workflow.count({
        where: {
          ...(workflowId && { id: workflowId }),
          status: WorkflowStatus.PUBLISHED
        }
      }),
      this.prisma.workflowExecution.count({ where }),
      this.prisma.workflowExecution.count({
        where: { ...where, status: WorkflowExecutionStatus.COMPLETED }
      }),
      this.prisma.workflowExecution.count({
        where: { ...where, status: WorkflowExecutionStatus.FAILED }
      }),
      this.prisma.workflowExecution.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      })
    ]);

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
      executionsByStatus: executionsByStatus.reduce((acc: any, { status, _count }: any) => {
        acc[status] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Bulk operations
   */
  async bulkUpdateWorkflowStatus(ids: string[], status: WorkflowStatus): Promise<number> {
    const result = await this.prisma.workflow.updateMany({
      where: { id: { in: ids } },
      data: { status, updatedAt: new Date() }
    });

    // Invalidate cache for all updated workflows
    ids.forEach(id => this.invalidateCache(`workflow:${id}`));
    
    this.logger.info(`📝 Bulk updated ${result.count} workflows to status: ${status}`);
    return result.count;
  }

  async cleanupOldExecutions(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.workflowExecution.deleteMany({
      where: {
        startedAt: { lt: cutoffDate },
        status: { in: [WorkflowExecutionStatus.COMPLETED, WorkflowExecutionStatus.FAILED] }
      }
    });

    this.logger.info(`🧹 Cleaned up ${result.count} old executions older than ${retentionDays} days`);
    return result.count;
  }

  /**
   * Helper methods
   */
  private convertDbToUnified(dbWorkflow: any): UnifiedWorkflow {
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
      version: dbWorkflow.version || '1.0.0',
      tags: dbWorkflow.tags || [],
      isTemplate: dbWorkflow.isTemplate || false,
      createdAt: dbWorkflow.createdAt,
      updatedAt: dbWorkflow.updatedAt,
      lastExecutedAt: dbWorkflow.lastExecutedAt,
      executionCount: dbWorkflow._count?.executions || 0,
      statistics: {
        totalExecutions: dbWorkflow._count?.executions || 0,
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
      metadata: dbWorkflow.metadata || {
        category: 'general',
        tags: [],
        author: 'system',
        dependencies: [],
        integrations: [],
        customProperties: {}
      }
    };
  }

  private convertDbExecutionToUnified(dbExecution: any): WorkflowExecution {
    return {
      id: dbExecution.id,
      workflowId: dbExecution.workflowId,
      status: dbExecution.status,
      triggeredBy: dbExecution.triggeredBy || 'system',
      triggerType: 'manual' as any,
      input: dbExecution.input as Record<string, any> || {},
      output: dbExecution.output as Record<string, any>,
      error: dbExecution.error ? {
        code: 'EXECUTION_ERROR',
        message: dbExecution.error,
        timestamp: new Date(),
        recoverable: false,
        metadata: {}
      } : undefined,
      startedAt: dbExecution.startedAt,
      completedAt: dbExecution.completedAt,
      duration: dbExecution.completedAt && dbExecution.startedAt 
        ? dbExecution.completedAt.getTime() - dbExecution.startedAt.getTime() 
        : undefined,
      nodeExecutions: [],
      context: {
        workflowId: dbExecution.workflowId,
        executionId: dbExecution.id,
        variables: {},
        temporaryData: {}
      },
      statistics: {
        totalNodes: 0,
        completedNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
        totalDuration: 0,
        averageNodeDuration: 0
      },
      logs: [],
      metadata: {}
    };
  }

  private getFromCache(key: string): any {
    if (!this.config.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.config.cacheTimeoutMs) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    if (!this.config.enableCaching) return;
    
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now()
    });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > this.config.cacheTimeoutMs) {
          this.cache.delete(key);
        }
      }
    }, this.config.cacheTimeoutMs);
  }

  /**
   * Public API
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: 0 // Would need to track hits/misses
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error(`Database health check failed: ${getErrorMessage(error)}`);
      return false;
    }
  }
}