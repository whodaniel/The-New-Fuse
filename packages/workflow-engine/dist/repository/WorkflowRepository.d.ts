/**
 * Workflow Repository - Persistence Layer for Unified Workflow Engine
 *
 * Provides database operations for workflows and executions
 * Integrates with existing Drizzle schema and database structure
 */
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedWorkflow, WorkflowExecution, WorkflowQuery, ExecutionQuery, WorkflowStatus } from '../types/WorkflowTypes.js';
export interface RepositoryConfig {
    enableCaching: boolean;
    cacheTimeoutMs: number;
    maxCacheSize: number;
    enableMetrics: boolean;
}
export declare class WorkflowRepository {
    private drizzle;
    private logger;
    private config;
    private cache;
    constructor(drizzle: any, config: RepositoryConfig, logger: Logger);
    /**
     * Workflow CRUD operations
     */
    createWorkflow(workflow: Omit<UnifiedWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnifiedWorkflow>;
    getWorkflow(id: string): Promise<UnifiedWorkflow | null>;
    updateWorkflow(id: string, updates: Partial<UnifiedWorkflow>): Promise<UnifiedWorkflow | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    queryWorkflows(query: WorkflowQuery): Promise<{
        workflows: UnifiedWorkflow[];
        total: number;
    }>;
    /**
     * Execution operations
     */
    createExecution(execution: Omit<WorkflowExecution, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowExecution>;
    getExecution(id: string): Promise<WorkflowExecution | null>;
    updateExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | null>;
    queryExecutions(query: ExecutionQuery): Promise<{
        executions: WorkflowExecution[];
        total: number;
    }>;
    /**
     * Statistics and analytics
     */
    getWorkflowStatistics(workflowId?: string): Promise<any>;
    /**
     * Bulk operations
     */
    bulkUpdateWorkflowStatus(ids: string[], status: WorkflowStatus): Promise<number>;
    cleanupOldExecutions(retentionDays: number): Promise<number>;
    /**
     * Helper methods
     */
    private convertDbToUnified;
    private convertDbExecutionToUnified;
    private getFromCache;
    private setCache;
    private invalidateCache;
    private startCacheCleanup;
    /**
     * Public API
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=WorkflowRepository.d.ts.map