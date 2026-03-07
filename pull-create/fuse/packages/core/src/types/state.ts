export interface BaseState {
    id: string;
    version: number;
    timestamp: number;
    owner: string;
}

export interface TaskState {
    type: 'TASK';
    data: {
        status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
        progress: number;
        details?: string;
    };
}

export interface AgentState {
    type: 'AGENT';
    data: {
        status: 'IDLE' | 'BUSY' | 'ERROR';
        currentTask?: string;
        healthMetrics?: Record<string, unknown>;
    };
}

export interface SystemState {
    type: 'SYSTEM';
    data: {
        status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
        activeAgents: number;
        pendingTasks: number;
        systemLoad: number;
    };
}