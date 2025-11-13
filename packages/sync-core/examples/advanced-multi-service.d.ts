/**
 * Advanced Multi-Service Integration Example
 *
 * Shows complex scenarios with multiple services coordinating
 * through sync-core for distributed workflows.
 */
import { OnModuleInit } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
import { ConflictManager } from '../src/services/ConflictManager';
import { TaskSynchronizationService } from '../src/services/TaskSynchronizationService';
interface WorkflowExecution {
    id: string;
    tenantId: string;
    name: string;
    status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
    steps: WorkflowStep[];
    currentStep: number;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: any;
}
interface WorkflowStep {
    id: string;
    name: string;
    type: 'agent' | 'service' | 'function';
    target: string;
    input: any;
    output?: any;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    dependencies?: string[];
    retryCount: number;
    maxRetries: number;
}
export declare class DistributedWorkflowService implements OnModuleInit {
    private readonly syncOrchestrator;
    private readonly conflictManager;
    private readonly taskSync;
    constructor(syncOrchestrator: SyncOrchestrator, conflictManager: ConflictManager, taskSync: TaskSynchronizationService);
    onModuleInit(): Promise<void>;
    /**
     * Subscribe to workflow-related events
     */
    private subscribeToWorkflowEvents;
    /**
     * Execute distributed workflow
     */
    executeWorkflow(workflowDef: Omit<WorkflowExecution, 'id' | 'status' | 'currentStep'>, tenantId: string): Promise<WorkflowExecution>;
    /**
     * Execute next workflow step
     */
    private executeNextStep;
    /**
     * Execute individual workflow step
     */
    private executeStep;
    /**
     * Execute agent-based step
     */
    private executeAgentStep;
    /**
     * Execute service call step
     */
    private executeServiceStep;
    /**
     * Execute function step
     */
    private executeFunctionStep;
    /**
     * Handle step error with retry logic
     */
    private handleStepError;
    /**
     * Complete workflow
     */
    private completeWorkflow;
    /**
     * Check if step dependencies are met
     */
    private checkDependencies;
    /**
     * Sync workflow state across instances
     */
    private syncWorkflowState;
    /**
     * Handle workflow sync from other instances
     */
    private handleWorkflowSync;
    /**
     * Handle step completion from other instances
     */
    private handleStepCompletion;
    /**
     * Handle task updates from task sync service
     */
    private handleTaskUpdate;
    /**
     * Pause workflow execution
     */
    pauseWorkflow(workflowId: string, tenantId: string): Promise<void>;
    /**
     * Resume workflow execution
     */
    resumeWorkflow(workflowId: string, tenantId: string): Promise<void>;
    /**
     * Cancel workflow execution
     */
    cancelWorkflow(workflowId: string, tenantId: string): Promise<void>;
    /**
     * Get workflow execution status
     */
    getWorkflowStatus(workflowId: string): Promise<WorkflowExecution>;
    /**
     * Get workflow metrics
     */
    getWorkflowMetrics(tenantId: string): Promise<{
        totalWorkflows: number;
        activeWorkflows: number;
        completedWorkflows: number;
        avgExecutionTime: number;
        successRate: number;
        conflictRate: number;
    }>;
    private generateId;
    private storeWorkflow;
    private getWorkflow;
    private updateWorkflowCache;
    private updateWorkflowWithTaskResult;
    private waitForTaskCompletion;
    private callService;
    private getFunctionByName;
    private countWorkflows;
    private countActiveWorkflows;
    private countCompletedWorkflows;
    private getAvgExecutionTime;
}
export {};
//# sourceMappingURL=advanced-multi-service.d.ts.map