import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, JobOptions } from 'bull';
export interface JobData {
    id: string;
    type: string;
    payload: any;
    userId?: string;
    agentId?: string;
    workflowId?: string;
    priority?: number;
    dependencies?: string[];
    context?: Record<string, any>;
}
export interface JobResult {
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
    retryCount: number;
}
export interface QueueMetrics {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
    throughput: number;
    averageProcessingTime: number;
}
export declare enum JobPriority {
    CRITICAL = 1,// System critical operations
    HIGH = 2,// Real-time agent communication
    MEDIUM = 3,// Workflow processing
    LOW = 4,// Background tasks
    BATCH = 5
}
export declare enum JobType {
    AGENT_COMMUNICATION = "agent_communication",
    WORKFLOW_EXECUTION = "workflow_execution",
    TASK_PROCESSING = "task_processing",
    DATA_SYNC = "data_sync",
    ANALYTICS_CALCULATION = "analytics_calculation",
    NOTIFICATION_DELIVERY = "notification_delivery",
    CLEANUP = "cleanup",
    BATCH_OPERATION = "batch_operation"
}
export declare class OptimizedQueueService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private queues;
    private redis;
    private metrics;
    private readonly queueConfigs;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initializeRedis;
    private initializeQueues;
    private setupQueueEventListeners;
    addJob(jobType: JobType, jobData: JobData, options?: Partial<JobOptions>): Promise<Job<JobData>>;
    addBatchJobs(jobType: JobType, jobs: Array<{
        data: JobData;
        options?: Partial<JobOptions>;
    }>): Promise<Job<JobData>[]>;
    private processJob;
    private processAgentCommunication;
    private processWorkflowExecution;
    private processTaskProcessing;
    private processDataSync;
    private processAnalyticsCalculation;
    private processNotificationDelivery;
    private processCleanup;
    private processBatchOperation;
    pauseQueue(jobType: JobType): Promise<void>;
    resumeQueue(jobType: JobType): Promise<void>;
    getQueueMetrics(jobType?: JobType): Promise<Map<string, QueueMetrics> | QueueMetrics>;
    cleanupCompletedJobs(olderThanHours?: number): Promise<number>;
    private updateMetrics;
    private startMetricsCollection;
    private collectQueueMetrics;
    private generateJobId;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=optimized-queue.service.d.ts.map