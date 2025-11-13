/**
 * TaskChainService.ts
 *
 * Task chaining and context retention system for maintaining continuity across agent handoffs.
 * Enables Traycer-style task chaining where context is retained from previous tasks.
 */
import { EventEmitter } from 'events';
import { AgentHandoffService } from './AgentHandoffService';
export interface TaskChain {
    id: string;
    title: string;
    description: string;
    planId?: string;
    status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
    steps: ChainStep[];
    context: ChainContext;
    metadata: ChainMetadata;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface ChainStep {
    id: string;
    chainId: string;
    stepIndex: number;
    agentId: string;
    taskType: 'plan_execution' | 'step_execution' | 'verification' | 'analysis' | 'custom';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    input: ChainStepInput;
    output?: ChainStepOutput;
    dependencies: string[];
    conditions?: ChainCondition[];
    retryCount: number;
    maxRetries: number;
    executionTime?: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface ChainStepInput {
    instructions: string;
    context: Record<string, any>;
    parameters: Record<string, any>;
    files?: string[];
    codeSelection?: {
        file: string;
        startLine: number;
        endLine: number;
        content: string;
    };
}
export interface ChainStepOutput {
    result: any;
    output: string;
    filesModified?: string[];
    artifacts?: ChainArtifact[];
    metadata: Record<string, any>;
    contextUpdates?: Record<string, any>;
}
export interface ChainContext {
    workspace: string;
    repository?: string;
    branch?: string;
    files: string[];
    variables: Map<string, any>;
    sharedState: Record<string, any>;
    conversationHistory: ConversationEntry[];
    artifacts: ChainArtifact[];
    cumulativeChanges: FileChange[];
    performanceMetrics: ChainPerformanceMetrics;
}
export interface ChainArtifact {
    id: string;
    type: 'file' | 'code' | 'data' | 'log' | 'screenshot' | 'report';
    name: string;
    content: string;
    metadata: Record<string, any>;
    createdBy: string;
    createdAt: Date;
}
export interface ConversationEntry {
    role: 'user' | 'assistant' | 'system';
    content: string;
    agentId?: string;
    stepId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface FileChange {
    stepId: string;
    agentId: string;
    path: string;
    operation: 'create' | 'modify' | 'delete' | 'rename';
    before?: string;
    after?: string;
    timestamp: Date;
}
export interface ChainCondition {
    type: 'success_required' | 'failure_required' | 'output_contains' | 'file_exists' | 'custom';
    target?: string;
    value?: any;
    description: string;
}
export interface ChainMetadata {
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    estimatedDuration?: number;
    actualDuration?: number;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    userId?: string;
    projectId?: string;
}
export interface ChainPerformanceMetrics {
    startTime?: Date;
    endTime?: Date;
    totalExecutionTime: number;
    averageStepTime: number;
    successRate: number;
    agentPerformance: Map<string, AgentStepPerformance>;
}
export interface AgentStepPerformance {
    agentId: string;
    stepsExecuted: number;
    successfulSteps: number;
    averageExecutionTime: number;
    totalTime: number;
}
export interface ChainTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: ChainStepTemplate[];
    defaultContext: Record<string, any>;
    metadata: Record<string, any>;
}
export interface ChainStepTemplate {
    agentType: string;
    taskType: string;
    instructions: string;
    parameters: Record<string, any>;
    dependencies?: number[];
    conditions?: ChainCondition[];
    optional?: boolean;
}
export interface ChainExecution {
    chainId: string;
    currentStepIndex: number;
    isRunning: boolean;
    isPaused: boolean;
    pauseReason?: string;
    nextStepAt?: Date;
    executionStrategy: 'sequential' | 'parallel' | 'conditional' | 'custom';
}
export declare class TaskChainService extends EventEmitter {
    private handoffService?;
    private chains;
    private executions;
    private templates;
    constructor(handoffService?: AgentHandoffService | undefined);
    /**
     * Create a new task chain
     */
    createChain(title: string, description: string, context: Partial<ChainContext>, options?: {
        planId?: string;
        templateId?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        tags?: string[];
    }): Promise<TaskChain>;
    /**
     * Add a step to a chain
     */
    addStep(chainId: string, agentId: string, taskType: ChainStep['taskType'], input: ChainStepInput, options?: {
        dependencies?: string[];
        conditions?: ChainCondition[];
        maxRetries?: number;
        insertAt?: number;
    }): Promise<ChainStep>;
    /**
     * Execute chain steps sequentially
     */
    private executeSequentially;
    /**
     * Execute eligible steps in parallel
     */
    private executeInParallel;
    /**
     * Execute chain with conditional logic
     */
    private executeConditionally;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Execute custom step (fallback)
     */
    private executeCustomStep;
    execution: any;
    isPaused: boolean;
    execution: any;
    pauseReason: any;
    chain: any;
    status: string;
    chain: any;
    updatedAt: Date;
}
//# sourceMappingURL=TaskChainService.d.ts.map