/**
 * TaskOrchestrator.ts
 *
 * Task orchestration service for managing complex multi-agent workflows.
 * Handles task queuing, workflow definition, state management, and error recovery.
 */
import { EventEmitter } from 'events';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    dependencies?: WorkflowDependency[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStep {
    id: string;
    name: string;
    agentId: string;
    prompt: string;
    expectedOutput?: string;
    timeout?: number;
    retries?: number;
    fallbackAgents?: string[];
    conditions?: WorkflowCondition[];
    parallel?: boolean;
    optional?: boolean;
}
export interface WorkflowDependency {
    stepId: string;
    dependsOn: string[];
    condition?: 'all' | 'any' | 'custom';
    customCondition?: (results: Record<string, any>) => boolean;
}
export interface WorkflowCondition {
    type: 'output_contains' | 'output_matches' | 'success' | 'custom';
    value?: any;
    customValidator?: (output: any) => boolean;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt?: Date;
    completedAt?: Date;
    currentStep?: string;
    stepResults: Record<string, WorkflowStepResult>;
    error?: string;
    metadata?: Record<string, any>;
}
export interface WorkflowStepResult {
    stepId: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    output?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    attempts: number;
}
export interface TaskQueueItem {
    id: string;
    workflowExecutionId?: string;
    stepId?: string;
    agentId: string;
    prompt: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledAt: Date;
    timeout?: number;
    retries?: number;
    maxRetries?: number;
    dependencies?: string[];
    metadata?: Record<string, any>;
}
export interface ResourceAllocation {
    agentId: string;
    maxConcurrentTasks: number;
    currentTasks: number;
    queuedTasks: number;
    lastActivity: Date;
    overloaded: boolean;
}
export declare class TaskOrchestrator extends EventEmitter {
    private options;
    private workflows;
    private executions;
    private taskQueue;
    private resourceAllocations;
    private protobufAdapter;
    private processingInterval?;
    private isProcessing;
    constructor(options?: {
        processingInterval?: number;
        maxConcurrentTasks?: number;
        defaultTimeout?: number;
        maxRetries?: number;
    });
    /**
     * Create a new workflow definition
     */
    createWorkflow(workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition>;
    /**
     * Validate workflow definition
     */
    private validateWorkflow;
}
//# sourceMappingURL=TaskOrchestrator.d.ts.map