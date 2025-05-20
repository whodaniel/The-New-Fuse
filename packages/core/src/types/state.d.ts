export interface BaseState {
    id: string;
    version: number;
    timestamp: number;
    owner: string;
}
export interface TaskState extends BaseState {
    type: TASK';
    data: {
        status: PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
        progress?: number;
        result?: unknown;
        error?: string;
    };
}
export interface AgentState extends BaseState {
    type: AGENT';
    data: {
        status: IDLE' | 'BUSY' | 'ERROR';
        currentTask?: string;
        capabilities: string[];
        metrics: {
            tasksCompleted: number;
            errorCount: number;
            uptime: number;
        };
    };
}
export interface SystemState extends BaseState {
    type: SYSTEM';
    data: {
        activeAgents: number;
        pendingTasks: number;
        resourceUsage: {
            cpu: number;
            memory: number;
            connections: number;
        };
        errors: {
            count: number;
            lastError?: string;
        };
    };
}
export type State = TaskState | AgentState | SystemState;
