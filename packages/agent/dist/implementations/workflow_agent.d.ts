/**
 * Workflow Agent Implementation
 * An agent that orchestrates and executes multi-step workflows
 */
import { IAgent } from '../interfaces/IAgent.js';
export interface WorkflowConfig {
    agentId: string;
    name: string;
    maxConcurrentSteps?: number;
    stepTimeout?: number;
    retryAttempts?: number;
    onStepComplete?: (step: WorkflowStep, result: StepResult) => void;
    onWorkflowComplete?: (workflow: Workflow, results: StepResult[]) => void;
}
export interface WorkflowStep {
    id: string;
    type: 'agent' | 'tool' | 'condition' | 'loop' | 'delay' | 'parallel';
    name: string;
    config: Record<string, unknown>;
    dependsOn?: string[];
    retryOnFail?: boolean;
}
export interface Workflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    variables?: Record<string, unknown>;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}
export interface StepResult {
    stepId: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    output?: unknown;
    error?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
}
export interface WorkflowExecution {
    workflowId: string;
    executionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    results: StepResult[];
    startTime: Date;
    endTime?: Date;
    variables: Record<string, unknown>;
}
export declare class WorkflowAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type = "workflow";
    readonly capabilities: string[];
    private config;
    private memory;
    private state;
    private isInitialized;
    private activeExecutions;
    private workflows;
    constructor(config: WorkflowConfig);
    initialize(): Promise<void>;
    process(message: any): Promise<any>;
    learn(data: unknown): Promise<void>;
    saveToMemory(key: string, value: unknown): Promise<void>;
    retrieveFromMemory(key: string): Promise<any>;
    getState(): Promise<any>;
    setState(state: unknown): Promise<void>;
    sendMessage(message: any): Promise<void>;
    receiveMessage(message: any): Promise<void>;
    handleError(error: Error): Promise<void>;
    registerWorkflow(workflow: Workflow): Promise<{
        success: boolean;
        workflowId: string;
    }>;
    executeWorkflow(workflowId: string, variables?: Record<string, unknown>): Promise<WorkflowExecution>;
    private executeStep;
    private executeAgentStep;
    private executeToolStep;
    private executeConditionStep;
    private executeDelayStep;
    private executeParallelSteps;
    private evaluateCondition;
    private topologicalSort;
    getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
    cancelExecution(executionId: string): Promise<boolean>;
    listWorkflows(): Promise<Workflow[]>;
}
export default WorkflowAgent;
//# sourceMappingURL=workflow_agent.d.ts.map