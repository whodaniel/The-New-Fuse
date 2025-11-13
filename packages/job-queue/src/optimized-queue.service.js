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
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bull, { Queue, Job } from 'bull';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
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
    configService;
    unifiedRedis;
    logger = new Logger(OptimizedQueueService_1.name);
    queues = new Map();
    metrics = new Map();
    // Queue configurations optimized for different job types
    queueConfigs = {
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
    constructor(configService, unifiedRedis) {
        this.configService = configService;
        this.unifiedRedis = unifiedRedis;
        this.logger.log('Job Queue Service initialized with UnifiedRedisService integration');
    }
    async onModuleInit() {
        await this.initializeQueues();
        this.startMetricsCollection();
        this.logger.log('Optimized Queue Service initialized');
    }
    // Bull queues require their own Redis connections
    // UnifiedRedisService is used for auxiliary Redis operations like caching job metadata
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
            this.logger.log(`Initialized queue: ${config.name} with concurrency: ${config.concurrency});
    }
  }

  private setupQueueEventListeners(queue: Queue, jobType: string): void {
    queue.on('completed', (job: Job, result: JobResult) => {`, this.logger.debug(Job, completed, $, { job, : .id } ` in queue: ${jobType}`));
            this.updateMetrics(jobType, 'completed');
        }
        ;
        queue.on('failed', (job, error) => {
            this.logger.error(Job, failed, $, { job, : .id } in queue, $, { jobType }, error);
            this.updateMetrics(jobType, 'failed');
        });
        queue.on('active', (job) => {
            `
      this.logger.debug(`;
            Job;
            started: $;
            {
                job.id;
            }
             in queue;
            $;
            {
                jobType;
            }
            `);
      this.updateMetrics(jobType, 'active');
    });

    queue.on('stalled', (job: Job) => {
      this.logger.warn(Job stalled: ${job.id} in queue: ${jobType});
    });
  }

  // Add job with intelligent routing and optimization
  async addJob(
    jobType: JobType,
    jobData: JobData,
    options: Partial<JobOptions> = {}
  ): Promise<Job<JobData>> {
    const queue = this.queues.get(jobType);
    if (!queue) {`;
            throw new Error(Queue, not, found);
            for (job; type; )
                : $;
            {
                jobType;
            }
            `);
    }

    const config = this.queueConfigs[jobType];
    const jobOptions: JobOptions = {
      priority: options.priority || config.priority,
      delay: options.delay || 0,
      ...options,
    };

    // Add job metadata for tracking
    const jobId = jobData.id || this.generateJobId();
    const enhancedJobData: JobData = {
      ...jobData,
      id: jobId,
      type: jobType,
      context: {
        ...jobData.context,
        queuedAt: new Date().toISOString(),
        priority: jobOptions.priority,
      },
    };

    const job = await queue.add(enhancedJobData, jobOptions);
    
    // Cache job metadata using UnifiedRedisService for fast lookups
    try {
      const jobMetadataKey = job:metadata:${jobId}`;
            await this.unifiedRedis.set(jobMetadataKey, JSON.stringify({
                id: jobId,
                type: jobType,
                status: 'queued',
                queuedAt: enhancedJobData.context.queuedAt,
                priority: jobOptions.priority
            }), 3600); // 1 hour TTL
        });
        try { }
        catch (error) {
            this.logger.warn(Failed, to, cache, job, metadata);
            for ($; { jobId }, error;)
                ;
        }
        `
    this.logger.log(Job added: ${job.id}`;
        to;
        queue: $;
        {
            jobType;
        }
        with (priority)
            : $;
        {
            jobOptions.priority;
        }
        ;
        return job;
    }
    if(, queue) {
        throw new Error(Queue, not, found);
        for (job; type; )
            : $;
        {
            jobType;
        }
        `);
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
    this.logger.log(Batch added ${addedJobs.length}`;
        jobs;
        to;
        queue: $;
        {
            jobType;
        }
        ;
        return addedJobs;
    }
    // Intelligent job processing with optimizations
    async processJob(job) {
        const startTime = Date.now();
        const { type, payload, context } = job.data;
        // Update job status in cache
        try {
            const jobMetadataKey = job, metadata, { job, data, id };
            await this.unifiedRedis.set(jobMetadataKey, JSON.stringify({
                id: job.data.id,
                type,
                status: 'processing',
                startedAt: new Date().toISOString(),
                attemptsMade: job.attemptsMade
            }), 3600);
            `
    } catch (error) {`;
            this.logger.warn(`Failed to update job status for ${job.data.id}, error);
    }
`);
            try {
                `
      this.logger.debug(Processing job: ${job.id}`;
                of;
                type: $;
                {
                    type;
                }
                ;
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
                        throw new Error(Unknown, job, type, $, { type });
                }
                const duration = Date.now() - startTime;
                const jobResult = {
                    success: true,
                    data: result,
                    duration,
                    retryCount: job.attemptsMade,
                };
                // Update completion status in cache`
                try {
                    `
        const jobMetadataKey = job:metadata:${job.data.id}`;
                    await this.unifiedRedis.set(jobMetadataKey, JSON.stringify({
                        id: job.data.id,
                        type,
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        duration,
                        success: true
                    }), 3600);
                }
                catch (error) {
                    this.logger.warn(Failed, to, update, job, completion, status);
                    for ($; { job, : .data.id }, error;)
                        ;
                }
                `
`;
                this.logger.debug(`Job completed: ${job.id} in ${duration}ms);
      return jobResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const jobResult: JobResult = {
        success: false,
        error: error.message,
        duration,
        retryCount: job.attemptsMade,
      };

      // Update failure status in cache
      try {`);
                const jobMetadataKey = job, metadata, { job, data, id };
                `;
        await this.unifiedRedis.set(jobMetadataKey, JSON.stringify({
          id: job.data.id,
          type,
          status: 'failed',
          failedAt: new Date().toISOString(),
          duration,
          error: error.message,
          attemptsMade: job.attemptsMade
        }), 3600);
      } catch (error) {
        this.logger.warn(Failed to update job failure status for ${job.data.id}`, error;
                ;
            }
            finally {
            }
            this.logger.error(Job, failed, $, { job, : .id }, after, $, { duration }, ms, error);
            throw error; // Re-throw to trigger retry logic
        }
        finally {
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
        `
    if (queue) {`;
        await queue.pause();
        `
      this.logger.log(Queue paused: ${jobType});
    }
  }

  async resumeQueue(jobType: JobType): Promise<void> {
    const queue = this.queues.get(jobType);
    if (queue) {
      await queue.resume();`;
        this.logger.log(Queue, resumed, $, { jobType } `);
    }
  }

  async getQueueMetrics(jobType?: JobType): Promise<Map<string, QueueMetrics> | QueueMetrics> {
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

  async cleanupCompletedJobs(olderThanHours: number = 24): Promise<number> {
    let totalCleaned = 0;

    for (const [jobType, queue] of this.queues) {
      const cleaned = await queue.clean(olderThanHours * 60 * 60 * 1000, 'completed');
      totalCleaned += cleaned.length;
      this.logger.log(Cleaned ${cleaned.length} completed jobs from queue: ${jobType}`);
    }
};
OptimizedQueueService = OptimizedQueueService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof UnifiedRedisService !== "undefined" && UnifiedRedisService) === "function" ? _a : Object])
], OptimizedQueueService);
export { OptimizedQueueService };
return totalCleaned;
// Get job status from cached metadata using UnifiedRedisService
async;
getJobStatus(jobId, string);
Promise < any | null > {
    try: {
        const: jobMetadataKey = job, metadata: $
    }
};
{
    jobId;
}
;
const metadata = await this.unifiedRedis.get(jobMetadataKey);
return metadata ? JSON.parse(metadata) : null;
`
    } catch (error) {`;
this.logger.error(Failed, to, get, job, status);
for ($; { jobId } `, error);
      return null;
    }
  }

  // Get queue metrics from UnifiedRedisService cache
  async getCachedQueueMetrics(jobType: JobType): Promise<any | null> {
    try {
      const metricsKey = queue:metrics:${jobType};
      const metrics = await this.unifiedRedis.get(metricsKey);
      return metrics ? JSON.parse(metrics) : null;`; )
    ;
try { }
catch (error) {
    `
      this.logger.error(Failed to get cached metrics for ${jobType}`, error;
    ;
    return null;
}
updateMetrics(jobType, string, event, string);
void {
    // Update internal metrics for monitoring
    try: {
        const: metricsKey = queue, events: $
    }
};
{
    jobType;
}
$;
{
    event;
}
;
const timestamp = Date.now();
// Use UnifiedRedisService to increment event counters
this.unifiedRedis.incr(metricsKey)
    .then(() => {
    // Set expiry for event counters (1 hour)
    return this.unifiedRedis.expire(metricsKey, 3600);
}) `
        .catch(error => {`;
this.logger.error(`Failed to update metrics for ${jobType}:${event}, error);
        });
    } catch (error) {`, this.logger.error(Error in updateMetrics));
for ($; { jobType } `:${event}`, error;)
    ;
startMetricsCollection();
void {
    // Start periodic metrics collection
    setInterval(async) { }
}();
{
    for (const [jobType] of this.queues) {
        await this.collectQueueMetrics(jobType);
    }
}
60000;
; // Collect metrics every minute
async;
collectQueueMetrics(jobType, string);
Promise < void  > {
    // Collect and store queue metrics using UnifiedRedisService
    try: {
        const: queue = this.queues.get(jobType),
        if(, queue) { }, return: ,
        const: waiting = await queue.getWaiting(),
        const: active = await queue.getActive(),
        const: completed = await queue.getCompleted(),
        const: failed = await queue.getFailed(),
        const: metrics = {
            pending: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            timestamp: Date.now(),
        },
        // Store metrics in Redis using UnifiedRedisService
        const: metricsKey = queue, metrics: $
    }
};
{
    jobType;
}
;
await this.unifiedRedis.set(metricsKey, JSON.stringify(metrics), 300); // 5 minutes TTL
`
      this.logger.debug(`;
Collected;
metrics;
for (queue; ; )
    : $;
{
    jobType;
}
;
`
    } catch (error) {
      this.logger.error(Failed to collect metrics for queue: ${jobType}, error);
    }
  }

  private generateJobId(): string {`;
return job_$;
{
    Date.now();
}
`_${Math.random().toString(36).substr(2, 9)};
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queues...');

    for (const [jobType, queue] of this.queues) {`;
await queue.close();
`
      this.logger.log(Queue closed: ${jobType}`;
;
// UnifiedRedisService handles its own cleanup
this.logger.log('Queue service shutdown complete');
//# sourceMappingURL=optimized-queue.service.js.map