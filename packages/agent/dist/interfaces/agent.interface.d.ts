import { Skill } from '@the-new-fuse/mcp-core/types';
import { Priority } from '../bridges.js';
export declare enum AgentState {
    INITIALIZING = "INITIALIZING",
    READY = "READY",
    BUSY = "BUSY",
    ERROR = "ERROR",
    TERMINATED = "TERMINATED"
}
export interface AgentConfig {
    agentId: string;
    skills: Skill[];
    modelName?: string;
    maxConcurrentTasks?: number;
    taskTimeout?: number;
    retryLimit?: number;
    memoryLimit?: number;
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
//# sourceMappingURL=agent.interface.d.ts.map