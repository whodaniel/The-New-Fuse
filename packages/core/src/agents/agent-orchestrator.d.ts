import { EventEmitter } from 'events';
export interface Task {
    id: string;
    type: string;
    payload: any;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    agentId?: string;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    updatedAt: Date;
    retries: number;
    maxRetries: number;
}
export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'idle' | 'busy' | 'offline';
    capabilities: string[];
    currentTaskId?: string;
    lastActivity: Date;
}
export interface TaskResult {
    success: boolean;
    data?: any;
    error?: string;
}
export declare class AgentOrchestrator extends EventEmitter {
    private readonly logger;
    private readonly tasks;
    private readonly agents;
    private readonly taskQueue;
    constructor();
    addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retries'>): string;
    executeTask(taskId: string): Promise<TaskResult>;
    getTaskStatus(taskId: string): string | undefined;
    getPendingTasks(): Task[];
    getRunningTasks(): Task[];
    cancelTask(taskId: string): boolean;
    retryTask(taskId: string): boolean;
    registerAgent(agent: Omit<Agent, 'lastActivity'>): void;
    private getAvailableAgent;
    private tryAssignTask;
    private performTask;
    getAgentById(agentId: string): Agent | undefined;
    getAllAgents(): Agent[];
    getActiveAgents(): Agent[];
}
//# sourceMappingURL=agent-orchestrator.d.ts.map