// Optimized Job Queue Service - High-performance background job processing for agent workflows
// Features intelligent prioritization, batching, parallel processing, and automatic retry logic
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OptimizedQueueService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bull from 'bull';
import { Redis } from 'ioredis';
export var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["CRITICAL"] = 1] = "CRITICAL";
    JobPriority[JobPriority["HIGH"] = 2] = "HIGH";
    JobPriority[JobPriority["MEDIUM"] = 3] = "MEDIUM";
    JobPriority[JobPriority["LOW"] = 4] = "LOW";
    JobPriority[JobPriority["BATCH"] = 5] = "BATCH";
})(JobPriority || (JobPriority = {}));
export var JobType;
(function (JobType) {
    JobType["AGENT_COMMUNICATION"] = "agent_communication";
    JobType["WORKFLOW_EXECUTION"] = "workflow_execution";
    JobType["TASK_PROCESSING"] = "task_processing";
    JobType["DATA_SYNC"] = "data_sync";
    JobType["ANALYTICS_CALCULATION"] = "analytics_calculation";
    JobType["NOTIFICATION_DELIVERY"] = "notification_delivery";
    JobType["CLEANUP"] = "cleanup";
    JobType["BATCH_OPERATION"] = "batch_operation";
})(JobType || (JobType = {}));
let OptimizedQueueService = OptimizedQueueService_1 = class OptimizedQueueService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(OptimizedQueueService_1.name);
        this.queues = new Map();
        this.metrics = new Map();
        // Queue configurations optimized for different job types
        this.queueConfigs = {
            [JobType.AGENT_COMMUNICATION]: {
                name: 'agent-communication',
                concurrency: 10,
                priority: JobPriority.HIGH,
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 50,
                removeOnFail: 20,
            },
            [JobType.WORKFLOW_EXECUTION]: {
                name: 'workflow-execution',
                concurrency: 5,
                priority: JobPriority.MEDIUM,
                attempts: 5,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 50,
            },
            [JobType.TASK_PROCESSING]: {
                name: 'task-processing',
                concurrency: 8,
                priority: JobPriority.MEDIUM,
                attempts: 3,
                backoff: { type: 'fixed', delay: 3000 },
                removeOnComplete: 75,
                removeOnFail: 25,
            },
            [JobType.DATA_SYNC]: {
                name: 'data-sync',
                concurrency: 3,
                priority: JobPriority.LOW,
                attempts: 2,
                backoff: { type: 'fixed', delay: 10000 },
                removeOnComplete: 25,
                removeOnFail: 10,
            },
            [JobType.ANALYTICS_CALCULATION]: {
                name: 'analytics',
                concurrency: 2,
                priority: JobPriority.LOW,
                attempts: 2,
                backoff: { type: 'fixed', delay: 15000 },
                removeOnComplete: 20,
                removeOnFail: 10,
            },
            [JobType.NOTIFICATION_DELIVERY]: {
                name: 'notifications',
                concurrency: 15,
                priority: JobPriority.HIGH,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 30,
                removeOnFail: 15,
            },
            [JobType.CLEANUP]: {
                name: 'cleanup',
                concurrency: 1,
                priority: JobPriority.LOW,
                attempts: 1,
                backoff: { type: 'fixed', delay: 60000 },
                removeOnComplete: 5,
                removeOnFail: 5,
            },
            [JobType.BATCH_OPERATION]: {
                name: 'batch-operations',
                concurrency: 3,
                priority: JobPriority.BATCH,
                attempts: 2,
                backoff: { type: 'fixed', delay: 30000 },
                removeOnComplete: 10,
                removeOnFail: 10,
            },
        };
        this.initializeRedis();
    }
    async onModuleInit() {
        await this.initializeQueues();
        this.startMetricsCollection();
        this.logger.log('Optimized Queue Service initialized');
    }
    initializeRedis() {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_QUEUE_DB', 1),
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            connectTimeout: 10000,
        });
        this.redis.on('error', (error) => {
            this.logger.error('Redis connection error for job queue:', error);
        });
    }
    async initializeQueues() {
        for (const [jobType, config] of Object.entries(this.queueConfigs)) {
            const queue = new Bull(config.name, {
                redis: {
                    host: this.configService.get('REDIS_HOST', 'localhost'),
                    port: this.configService.get('REDIS_PORT', 6379),
                    password: this.configService.get('REDIS_PASSWORD'),
                    db: this.configService.get('REDIS_QUEUE_DB', 1),
                },
                defaultJobOptions: {
                    attempts: config.attempts,
                    backoff: config.backoff,
                    removeOnComplete: config.removeOnComplete,
                    removeOnFail: config.removeOnFail,
                },
            });
            // Set up job processing with optimized concurrency
            queue.process(config.concurrency, async (job) => {
                return this.processJob(job);
            });
            // Set up event listeners for monitoring
            this.setupQueueEventListeners(queue, jobType);
            this.queues.set(jobType, queue);
            this.logger.log(`Initialized queue: ${config.name} with concurrency: ${config.concurrency}`);
        }
    }
    setupQueueEventListeners(queue, jobType) {
        queue.on('completed', (job, result) => {
            this.logger.debug(`Job completed: ${job.id} in queue: ${jobType}`);
            this.updateMetrics(jobType, 'completed');
        });
        queue.on('failed', (job, error) => {
            this.logger.error(`Job failed: ${job.id} in queue: ${jobType}`, error);
            this.updateMetrics(jobType, 'failed');
        });
        queue.on('active', (job) => {
            this.logger.debug(`Job started: ${job.id} in queue: ${jobType}`);
            this.updateMetrics(jobType, 'active');
        });
        queue.on('stalled', (job) => {
            this.logger.warn(`Job stalled: ${job.id} in queue: ${jobType}`);
        });
    }
    // Add job with intelligent routing and optimization
    async addJob(jobType, jobData, options = {}) {
        const queue = this.queues.get(jobType);
        if (!queue) {
            throw new Error(`Queue not found for job type: ${jobType}`);
        }
        const config = this.queueConfigs[jobType];
        const jobOptions = {
            priority: options.priority || config.priority,
            delay: options.delay || 0,
            ...options,
        };
        // Add job metadata for tracking
        const enhancedJobData = {
            ...jobData,
            id: jobData.id || this.generateJobId(),
            type: jobType,
            context: {
                ...jobData.context,
                queuedAt: new Date().toISOString(),
                priority: jobOptions.priority,
            },
        };
        const job = await queue.add(enhancedJobData, jobOptions);
        this.logger.log(`Job added: ${job.id} to queue: ${jobType} with priority: ${jobOptions.priority}`);
        return job;
    }
    // Batch job addition for improved performance
    async addBatchJobs(jobType, jobs) {
        const queue = this.queues.get(jobType);
        if (!queue) {
            throw new Error(`Queue not found for job type: ${jobType}`);
        }
        const batchJobs = jobs.map(({ data, options = {} }) => ({
            name: jobType,
            data: {
                ...data,
                id: data.id || this.generateJobId(),
                type: jobType,
            },
            opts: {
                priority: options.priority || this.queueConfigs[jobType].priority,
                ...options,
            },
        }));
        const addedJobs = await queue.addBulk(batchJobs);
        this.logger.log(`Batch added ${addedJobs.length} jobs to queue: ${jobType}`);
        return addedJobs;
    }
    // Intelligent job processing with optimizations
    async processJob(job) {
        const startTime = Date.now();
        const { type, payload, context } = job.data;
        try {
            this.logger.debug(`Processing job: ${job.id} of type: ${type}`);
            let result;
            // Route to appropriate processor based on job type
            switch (type) {
                case JobType.AGENT_COMMUNICATION:
                    result = await this.processAgentCommunication(job.data);
                    break;
                case JobType.WORKFLOW_EXECUTION:
                    result = await this.processWorkflowExecution(job.data);
                    break;
                case JobType.TASK_PROCESSING:
                    result = await this.processTaskProcessing(job.data);
                    break;
                case JobType.DATA_SYNC:
                    result = await this.processDataSync(job.data);
                    break;
                case JobType.ANALYTICS_CALCULATION:
                    result = await this.processAnalyticsCalculation(job.data);
                    break;
                case JobType.NOTIFICATION_DELIVERY:
                    result = await this.processNotificationDelivery(job.data);
                    break;
                case JobType.CLEANUP:
                    result = await this.processCleanup(job.data);
                    break;
                case JobType.BATCH_OPERATION:
                    result = await this.processBatchOperation(job.data);
                    break;
                default:
                    throw new Error(`Unknown job type: ${type}`);
            }
            const duration = Date.now() - startTime;
            const jobResult = {
                success: true,
                data: result,
                duration,
                retryCount: job.attemptsMade,
            };
            this.logger.debug(`Job completed: ${job.id} in ${duration}ms`);
            return jobResult;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const jobResult = {
                success: false,
                error: error.message,
                duration,
                retryCount: job.attemptsMade,
            };
            this.logger.error(`Job failed: ${job.id} after ${duration}ms`, error);
            throw error; // Re-throw to trigger retry logic
        }
    }
    // Job processors for different types
    async processAgentCommunication(jobData) {
        // Implement agent communication processing
        // This would handle inter-agent messaging, status updates, etc.
        return { processed: true, agentId: jobData.agentId };
    }
    async processWorkflowExecution(jobData) {
        // Implement workflow execution processing
        // This would handle workflow step execution, state management, etc.
        return { executed: true, workflowId: jobData.workflowId };
    }
    async processTaskProcessing(jobData) {
        // Implement task processing
        // This would handle individual task execution, result storage, etc.
        return { processed: true, taskId: jobData.payload.taskId };
    }
    async processDataSync(jobData) {
        // Implement data synchronization
        // This would handle database sync, cache updates, etc.
        return { synced: true, recordCount: jobData.payload.recordCount };
    }
    async processAnalyticsCalculation(jobData) {
        // Implement analytics processing
        // This would handle metric calculations, report generation, etc.
        return { calculated: true, metrics: jobData.payload.metrics };
    }
    async processNotificationDelivery(jobData) {
        // Implement notification delivery
        // This would handle email, SMS, push notifications, etc.
        return { delivered: true, recipients: jobData.payload.recipients };
    }
    async processCleanup(jobData) {
        // Implement cleanup operations
        // This would handle log cleanup, temp file removal, etc.
        return { cleaned: true, itemsRemoved: jobData.payload.itemCount };
    }
    async processBatchOperation(jobData) {
        // Implement batch operations
        // This would handle bulk database operations, imports, etc.
        return { processed: true, batchSize: jobData.payload.batchSize };
    }
    // Queue management methods
    async pauseQueue(jobType) {
        const queue = this.queues.get(jobType);
        if (queue) {
            await queue.pause();
            this.logger.log(`Queue paused: ${jobType}`);
        }
    }
    async resumeQueue(jobType) {
        const queue = this.queues.get(jobType);
        if (queue) {
            await queue.resume();
            this.logger.log(`Queue resumed: ${jobType}`);
        }
    }
    async getQueueMetrics(jobType) {
        if (jobType) {
            const queue = this.queues.get(jobType);
            if (queue) {
                const waiting = await queue.getWaiting();
                const active = await queue.getActive();
                const completed = await queue.getCompleted();
                const failed = await queue.getFailed();
                const delayed = await queue.getDelayed();
                return {
                    pending: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length,
                    delayed: delayed.length,
                    waiting: waiting.length,
                    throughput: 0, // Calculate from metrics
                    averageProcessingTime: 0, // Calculate from metrics
                };
            }
        }
        return this.metrics;
    }
    async cleanupCompletedJobs(olderThanHours = 24) {
        let totalCleaned = 0;
        for (const [jobType, queue] of this.queues) {
            const cleaned = await queue.clean(olderThanHours * 60 * 60 * 1000, 'completed');
            totalCleaned += cleaned.length;
            this.logger.log(`Cleaned ${cleaned.length} completed jobs from queue: ${jobType}`);
        }
        return totalCleaned;
    }
    updateMetrics(jobType, event) {
        // Update internal metrics for monitoring
        // Implementation would track throughput, processing times, etc.
    }
    startMetricsCollection() {
        // Start periodic metrics collection
        setInterval(async () => {
            for (const [jobType] of this.queues) {
                await this.collectQueueMetrics(jobType);
            }
        }, 60000); // Collect metrics every minute
    }
    async collectQueueMetrics(jobType) {
        // Collect and store queue metrics for monitoring
        // Implementation would gather performance data
    }
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down queues...');
        for (const [jobType, queue] of this.queues) {
            await queue.close();
            this.logger.log(`Queue closed: ${jobType}`);
        }
        if (this.redis) {
            await this.redis.quit();
        }
        this.logger.log('Queue service shutdown complete');
    }
};
OptimizedQueueService = OptimizedQueueService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], OptimizedQueueService);
export { OptimizedQueueService };
//# sourceMappingURL=optimized-queue.service.js.map