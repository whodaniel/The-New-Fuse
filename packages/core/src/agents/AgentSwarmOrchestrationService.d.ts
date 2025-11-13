/**
 * @fileoverview Agent swarm orchestration service for coordinating multiple agents
 */
import { EventEmitter } from 'events';
import { SwarmExecution, SwarmCoordinationStrategy, Agent } from '../types/agent';
import { TaskStatus } from '../types/core';
import { ServiceState } from '../constants/types';
export interface SwarmTask {
    id: string;
    name: string;
    description?: string;
    requiredCapabilities: string[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedDuration?: number;
    dependencies: string[];
    payload: any;
    assignedAgentId?: string;
    status: TaskStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
}
export interface SwarmConfiguration {
    strategy: SwarmCoordinationStrategy;
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryAttempts: number;
    failureThreshold: number;
    loadBalancing: 'round_robin' | 'capability_based' | 'load_based';
}
export declare class AgentSwarmOrchestrationService extends EventEmitter {
    private readonly logger;
    private state;
    private executions;
    private agents;
    private tasks;
    private taskQueue;
    private isProcessing;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    registerAgent(agent: Agent): void;
    unregisterAgent(agentId: string): boolean;
    getAgent(agentId: string): Agent | undefined;
    getAllAgents(): Agent[];
    getAvailableAgents(): Agent[];
    createExecution(name: string, tasks: Omit<SwarmTask, 'id' | 'status' | 'createdAt'>[], config: SwarmConfiguration): Promise<string>;
    startExecution(executionId: string): Promise<void>;
    cancelExecution(executionId: string): Promise<boolean>;
    getExecution(executionId: string): SwarmExecution | undefined;
    getExecutions(): SwarmExecution[];
    getExecutionDetails(executionId: string): any;
    orchestrate(executionId: string): Promise<void>;
    private executeSwarmStrategy;
    private executeSequential;
    private executeParallel;
    private executePipeline;
    private executeHierarchical;
    private executeTask;
    private findSuitableAgent;
    private selectBestCapabilityMatch;
    private selectLeastLoadedAgent;
    private performTaskExecution;
    private topologicalSort;
    private groupTasksByPriority;
    private calculateExecutionStatistics;
    private calculateAverageTaskDuration;
    private startTaskProcessor;
    private processTaskQueue;
    private getReadyTasks;
}
//# sourceMappingURL=AgentSwarmOrchestrationService.d.ts.map