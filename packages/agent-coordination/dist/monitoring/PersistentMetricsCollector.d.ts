import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { AgentTask } from '../types/coordination.types';
export interface AgentMetrics {
    tasksCompleted: number;
    tasksFailed: number;
    averageExecutionTime: number;
    successRate: number;
    lastActive: number;
}
export interface SystemMetrics {
    totalTasksCreated: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
    activeAgents: number;
    averageExecutionTime: number;
    tasksPerMinute: number;
}
export declare class PersistentMetricsCollector {
    private readonly redisService;
    private readonly logger;
    private readonly keyPrefix;
    constructor(redisService: UnifiedRedisService, keyPrefix?: string);
    recordTaskCreated(task: AgentTask): Promise<void>;
    recordTaskCompleted(task: AgentTask, duration: number): Promise<void>;
    recordTaskFailed(task: AgentTask, error: string): Promise<void>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getAgentMetrics(agentId: string): Promise<AgentMetrics | null>;
    clearMetrics(): Promise<void>;
}
//# sourceMappingURL=PersistentMetricsCollector.d.ts.map