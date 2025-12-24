import { Priority } from '../bridges';
import { Skill } from '@the-new-fuse/mcp-core/types/skill';

export enum AgentState {
    INITIALIZING = 'INITIALIZING',
    READY = 'READY',
    BUSY = 'BUSY',
    ERROR = 'ERROR',
    TERMINATED = 'TERMINATED'
}

export interface AgentConfig {
    agentId: string;
    skills: Skill[];
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
