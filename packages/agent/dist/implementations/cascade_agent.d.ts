/**
 * Cascade Agent Implementation
 * An agent that manages cascading workflows - executing tasks through chains of agents
 * Implements the "cascade" pattern where one agent's output becomes another's input
 */
import type { IAgent } from '../interfaces/IAgent.js';
export interface CascadeConfig {
    agentId: string;
    name: string;
    maxCascadeDepth?: number;
    timeoutPerStep?: number;
    errorStrategy?: 'stop' | 'skip' | 'retry';
    retryAttempts?: number;
}
export interface CascadeStep {
    agentId: string;
    agentType: string;
    action: string;
    inputMapping?: Record<string, string>;
    outputKey?: string;
    fallback?: CascadeStep;
}
export interface CascadePipeline {
    pipelineId: string;
    name: string;
    description?: string;
    steps: CascadeStep[];
    globalVariables?: Record<string, unknown>;
}
export interface CascadeExecution {
    executionId: string;
    pipelineId: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    currentStepIndex: number;
    results: CascadeStepResult[];
    variables: Record<string, unknown>;
    startTime: Date;
    endTime?: Date;
}
export interface CascadeStepResult {
    stepIndex: number;
    agentId: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    input: unknown;
    output: unknown;
    error?: string;
    duration: number;
}
export declare class CascadeAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type = "cascade";
    readonly capabilities: string[];
    private config;
    private memory;
    private state;
    private isInitialized;
    private pipelines;
    private executions;
    private agentRegistry;
    constructor(config: CascadeConfig);
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
    registerPipeline(pipeline: CascadePipeline): Promise<{
        success: boolean;
        pipelineId: string;
    }>;
    registerAgent(agent: IAgent): Promise<void>;
    executePipeline(pipelineId: string, initialInput?: unknown): Promise<CascadeExecution>;
    private executeStep;
    private resolveVariable;
    getExecutionStatus(executionId: string): Promise<CascadeExecution | null>;
    pauseExecution(executionId: string): Promise<boolean>;
    resumeExecution(executionId: string): Promise<boolean>;
    listPipelines(): Promise<CascadePipeline[]>;
}
export default CascadeAgent;
//# sourceMappingURL=cascade_agent.d.ts.map