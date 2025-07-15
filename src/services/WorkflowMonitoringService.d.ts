import { RedisService } from '../redis/redis.service.tsx';
import { MetricsService } from '../metrics/metrics.service.js';
import { Logger } from '../common/logger.service.js';
export interface WorkflowMetrics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    avgTaskDuration: number;
    resourceUtilization: Map<string, number>;
}
export declare class WorkflowMonitoringService {
    private readonly redis;
    private readonly metrics;
    private readonly logger;
    private readonly metricsPrefix;
    private readonly statusPrefix;
    constructor(redis: RedisService, metrics: MetricsService, logger: Logger);
    trackWorkflowExecution(workflowId: string, event: any): Promise<void>;
    getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics>;
    updateMetrics(workflowId: string, event: any): Promise<void>;
    private notifySubscribers;
    subscribeToWorkflow(workflowId: string, callback: (event: any) => void): Promise<void>;
    unsubscribeFromWorkflow(workflowId: string): Promise<void>;
}
//# sourceMappingURL=WorkflowMonitoringService.d.ts.map