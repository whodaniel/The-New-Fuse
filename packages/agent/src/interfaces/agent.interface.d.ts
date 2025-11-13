import { A2APriority } from '@the-new-fuse/a2a-core/src/types';
export declare enum AgentState {
    INITIALIZING = "INITIALIZING",
    READY = "READY",
    BUSY = "BUSY",
    ERROR = "ERROR",
    TERMINATED = "TERMINATED"
}
export interface AgentConfig {
    agentId: string;
    capabilities: Set<string>;
    modelName?: string;
    maxConcurrentTasks?: number;
    taskTimeout?: number;
    retryLimit?: number;
    memoryLimit?: number;
}
export interface Task {
    taskId: string;
    type: string;
    priority: A2APriority;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
    message: Record<string, unknown>;
    startTime?: number;
    result?: unknown;
    error?: Error;
}
//# sourceMappingURL=agent.interface.d.ts.map