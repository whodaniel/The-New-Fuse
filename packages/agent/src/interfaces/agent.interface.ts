import { Priority } from '@the-new-fuse/a2a-core/src/types';

export enum AgentState {
    INITIALIZING = 'INITIALIZING',
    READY = 'READY',
    BUSY = 'BUSY',
    ERROR = 'ERROR',
    TERMINATED = 'TERMINATED'
}

export interface AgentConfig {
    agentId: string;
    capabilities: Set<string>; // Changed to string as per api-types/src/agent.ts
    modelName?: string;
    maxConcurrentTasks?: number;
    taskTimeout?: number;  // seconds
    retryLimit?: number;
    memoryLimit?: number;  // number of context items to remember
}

export interface Task {
    taskId: string;
    type: string;
    priority: Priority;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    message: Record<string, unknown>;
    startTime?: number;
    result?: unknown;
    error?: Error;
}
