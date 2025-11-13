"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("../services/LoggingService");
const MetricsService_1 = require("../monitoring/MetricsService");
let QueueService = class QueueService {
    logger;
    metricsService;
    queues = new Map();
    jobs = new Map();
    workers = new Map();
    processors = new Map();
    jobQueues = new Map();
    isInitialized = false;
    processingIntervals = new Map();
    constructor(logger, metricsService) {
        this.logger = logger;
        this.metricsService = metricsService;
    }
    async initialize() {
        try {
            this.logger.log('Initializing Queue Service...', 'QueueService');
            // Create default queues
            await this.createQueue('default', {
                concurrency: 5,
                max_retries: 3,
                retry_delay_ms: 5000,
                max_jobs: 10000,
                cleanup_interval_ms: 300000, // 5 minutes
                job_timeout_ms: 300000 // 5 minutes
            });
            await this.createQueue('high-priority', {
                concurrency: 3,
                max_retries: 2,
                retry_delay_ms: 1000,
                max_jobs: 1000,
                cleanup_interval_ms: 60000, // 1 minute
                job_timeout_ms: 60000 // 1 minute
            });
            await this.createQueue('low-priority', {
                concurrency: 2,
                max_retries: 5,
                retry_delay_ms: 10000,
                max_jobs: 50000,
                cleanup_interval_ms: 600000, // 10 minutes
                job_timeout_ms: 600000 // 10 minutes
            });
            this.startCleanupWorker();
            this.isInitialized = true;
            this.logger.log('Queue Service initialized successfully', 'QueueService');
            await this.metricsService.recordMetric('queue_service_initialized', 1, 'counter', { labels: { component: 'queue' } });
        }
        catch (error) {
            this.logger.error('Failed to initialize Queue Service', error instanceof Error ? error : new Error(String(error)), 'QueueService');
            throw error;
        }
    }
    async createQueue(name, options) {
        const config = {
            name,
            ...options
        };
        this.queues.set(name, config);
        this.jobQueues.set(name, []);
        // Start processing for this queue
        this.startQueueProcessing(name);
        this.logger.log(`Queue '${name}' created, 'QueueService');
    await this.metricsService.recordMetric('queue_created', 1, 'counter', { labels: { queue_name: name } });

    return config;
  }

  async addJob(
    queueName: string,
    payload: any,
    options: {
      priority?: number;
      delay_ms?: number;
      max_attempts?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<QueueJob> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {`);
        throw new Error(`Queue '${queueName}`, ' does not exist););
    }
    currentJobs = this.jobQueues.get(queueName) || [];
    if(currentJobs, length) { }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        MetricsService_1.MetricsService])
], QueueService);
 >= queue.max_jobs;
{
    throw new Error(Queue, '${queueName}', is, at, maximum, capacity);
}
const job = {} `
        id: job_${Date.now()}`, _$, { Math, random };
().toString(36).substr(2, 9);
queue_name: queueName,
    payload,
    priority;
options.priority || 0,
    delay_until;
options.delay_ms ? new Date(Date.now() + options.delay_ms) : undefined,
    max_attempts;
options.max_attempts || queue.max_retries,
    attempt_count;
0,
    status;
options.delay_ms ? 'delayed' : 'pending',
    created_at;
new Date(),
    metadata;
options.metadata || {};
;
this.jobs.set(job.id, job);
// Add to queue with priority ordering
this.addJobToQueue(queueName, job);
await this.metricsService.recordMetric('job_added', 1, 'counter', {
    labels: {
        queue_name: queueName,
        priority: job.priority.toString()
    }
});
return job;
try { }
catch (error) {
    this.logger.error('Failed to add job to queue', error instanceof Error ? error : new Error(String(error)), 'QueueService');
    throw error;
}
async;
getJob(jobId, string);
Promise < QueueJob | null > {
    return: this.jobs.get(jobId) || null
};
async;
cancelJob(jobId, string);
Promise < boolean > {
    try: {
        const: job = this.jobs.get(jobId),
        if(, job) {
            return false;
        },
        if(job) { }, : .status === 'processing'
    }
};
{
    // Cannot cancel processing jobs
    return false;
}
if (job.status === 'pending' || job.status === 'delayed') {
    job.status = 'cancelled';
    job.completed_at = new Date();
    // Remove from queue
    const queueJobs = this.jobQueues.get(job.queue_name) || [];
    const index = queueJobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
        queueJobs.splice(index, 1);
        this.jobQueues.set(job.queue_name, queueJobs);
    }
    this.jobs.set(jobId, job);
    await this.metricsService.recordMetric('job_cancelled', 1, 'counter', {
        labels: {
            queue_name: job.queue_name
        }
    });
    return true;
}
return false;
try { }
catch (error) {
    this.logger.error('Failed to cancel job', error instanceof Error ? error : new Error(String(error)), 'QueueService');
    return false;
}
async;
registerProcessor(queueName, string, processor, JobProcessor);
Promise < void  > {} `
    const queue = this.queues.get(queueName);`;
if (!queue) {
    throw new Error(Queue, '${queueName}', does, not, exist);
}
`
    this.processors.set(queueName, processor);`;
this.logger.log(`Processor registered for queue '${queueName}', 'QueueService');

    await this.metricsService.recordMetric('processor_registered', 1, 'counter', { 
      labels: { 
        queue_name: queueName
      } 
    });
  }

  async createWorker(queueName: string): Promise<QueueWorker> {
    const queue = this.queues.get(queueName);`);
if (!queue) {
    `
      throw new Error(Queue '${queueName}`;
    ' does not exist);;
}
const worker = {
    id: worker_$
}, { Date, now };
();
_$;
{
    Math.random().toString(36).substr(2, 9);
}
queue_name: queueName,
    status;
'idle',
    jobs_processed;
0,
    jobs_failed;
0,
    last_activity;
new Date(),
    created_at;
new Date();
;
this.workers.set(worker.id, worker);
await this.metricsService.recordMetric('worker_created', 1, 'counter', {
    labels: {
        queue_name: queueName
    }
});
return worker;
async;
pauseQueue(queueName, string);
Promise < boolean > {
    try: {
        const: interval = this.processingIntervals.get(queueName),
        if(interval) {
            clearInterval(interval);
            this.processingIntervals.delete(queueName);
        }
        // Update workers to paused status
        ,
        : .workers.values()
    }
};
{
    if (worker.queue_name === queueName && worker.status !== 'stopped') {
        worker.status = 'paused';
        this.workers.set(worker.id, worker);
    }
}
this.logger.log(Queue, '${queueName}', paused, 'QueueService');
return true;
try { }
catch (error) {
    this.logger.error('Failed to pause queue', error instanceof Error ? error : new Error(String(error)), 'QueueService');
    return false;
}
async;
resumeQueue(queueName, string);
Promise < boolean > {
    try: {
        const: queue = this.queues.get(queueName),
        if(, queue) {
            return false;
        },
        this: .startQueueProcessing(queueName),
        : .workers.values()
    }
};
{
    if (worker.queue_name === queueName && worker.status === 'paused') {
        worker.status = 'idle';
        this.workers.set(worker.id, worker);
    }
}
`
`;
this.logger.log(Queue, '${queueName}', resumed `, 'QueueService');
      return true;
    } catch (error) {
      this.logger.error('Failed to resume queue', error instanceof Error ? error : new Error(String(error)), 'QueueService');
      return false;
    }
  }

  async getQueueMetrics(queueName: string): Promise<QueueMetrics> {
    const queueJobs = Array.from(this.jobs.values()).filter(job => job.queue_name === queueName);
    const queueWorkers = Array.from(this.workers.values()).filter(worker => worker.queue_name === queueName);

    const pendingJobs = queueJobs.filter(job => job.status === 'pending' || job.status === 'delayed').length;
    const processingJobs = queueJobs.filter(job => job.status === 'processing').length;
    const completedJobs = queueJobs.filter(job => job.status === 'completed').length;
    const failedJobs = queueJobs.filter(job => job.status === 'failed').length;
    const activeWorkers = queueWorkers.filter(worker => worker.status === 'busy' || worker.status === 'idle').length;

    const completedJobsWithTime = queueJobs.filter(job => 
      job.status === 'completed' && job.started_at && job.completed_at
    );

    const averageProcessingTime = completedJobsWithTime.length > 0 ?
      completedJobsWithTime.reduce((sum, job) => {
        const processingTime = job.completed_at!.getTime() - job.started_at!.getTime();
        return sum + processingTime;
      }, 0) / completedJobsWithTime.length : 0;

    const oldestPendingJob = queueJobs
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];

    // Calculate throughput (jobs completed in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentCompletedJobs = queueJobs.filter(job => 
      job.status === 'completed' && job.completed_at && job.completed_at > oneMinuteAgo
    ).length;

    const errorRate = queueJobs.length > 0 ? failedJobs / queueJobs.length : 0;

    return {
      queue_name: queueName,
      pending_jobs: pendingJobs,
      processing_jobs: processingJobs,
      completed_jobs: completedJobs,
      failed_jobs: failedJobs,
      total_jobs: queueJobs.length,
      active_workers: activeWorkers,
      average_processing_time_ms: averageProcessingTime,
      throughput_per_minute: recentCompletedJobs,
      error_rate: errorRate,
      oldest_pending_job: oldestPendingJob?.created_at,
      last_updated: new Date()
    };
  }

  async getAllQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];
    for (const queueName of this.queues.keys()) {
      metrics.push(await this.getQueueMetrics(queueName));
    }
    return metrics;
  }

  async getHealthStatus(): Promise<{ 
    status: 'healthy' | 'degraded' | 'unhealthy'; 
    details: Record<string, any> 
  }> {
    try {
      const allMetrics = await this.getAllQueueMetrics();
      const totalPendingJobs = allMetrics.reduce((sum, m) => sum + m.pending_jobs, 0);
      const totalFailedJobs = allMetrics.reduce((sum, m) => sum + m.failed_jobs, 0);
      const totalJobs = allMetrics.reduce((sum, m) => sum + m.total_jobs, 0);
      const averageErrorRate = totalJobs > 0 ? totalFailedJobs / totalJobs : 0;
      const maxProcessingTime = Math.max(...allMetrics.map(m => m.average_processing_time_ms));

      const status = averageErrorRate > 0.1 || maxProcessingTime > 60000 ? 'unhealthy' : 
                    averageErrorRate > 0.05 || totalPendingJobs > 1000 ? 'degraded' : 'healthy';

      return {
        status,
        details: {
          total_queues: this.queues.size,
          total_workers: this.workers.size,
          total_pending_jobs: totalPendingJobs,
          total_failed_jobs: totalFailedJobs,
          average_error_rate: averageErrorRate,
          max_processing_time_ms: maxProcessingTime,
          initialized: this.isInitialized
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  private addJobToQueue(queueName: string, job: QueueJob): void {
    const queueJobs = this.jobQueues.get(queueName) || [];
    
    // Insert job based on priority (higher priority first)
    let insertIndex = queueJobs.length;
    for (let i = 0; i < queueJobs.length; i++) {
      if (job.priority > queueJobs[i].priority) {
        insertIndex = i;
        break;
      }
    }
    
    queueJobs.splice(insertIndex, 0, job);
    this.jobQueues.set(queueName, queueJobs);
  }

  private startQueueProcessing(queueName: string): void {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    // Clear existing interval if any
    const existingInterval = this.processingIntervals.get(queueName);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      await this.processQueueJobs(queueName);
    }, 1000); // Check every second

    this.processingIntervals.set(queueName, interval);
  }

  private async processQueueJobs(queueName: string): Promise<void> {
    try {
      const queue = this.queues.get(queueName);
      const processor = this.processors.get(queueName);
      if (!queue || !processor) return;

      const queueJobs = this.jobQueues.get(queueName) || [];
      const currentlyProcessing = Array.from(this.jobs.values()).filter(
        job => job.queue_name === queueName && job.status === 'processing'
      ).length;

      // Don't exceed concurrency limit
      if (currentlyProcessing >= queue.concurrency) return;

      // Process delayed jobs
      this.processDelayedJobs(queueName);

      // Get next available job
      const availableJobs = queueJobs.filter(job => 
        job.status === 'pending' && 
        (!job.delay_until || job.delay_until <= new Date())
      );

      if (availableJobs.length === 0) return;

      const job = availableJobs[0];
      
      // Remove from queue
      const jobIndex = queueJobs.findIndex(j => j.id === job.id);
      if (jobIndex !== -1) {
        queueJobs.splice(jobIndex, 1);
        this.jobQueues.set(queueName, queueJobs);
      }

      // Process the job
      await this.processJob(job, processor, queue);

    } catch (error) {
      this.logger.error(Error processing queue ${queueName}, error instanceof Error ? error : new Error(String(error)), 'QueueService');
    }
  }

  private async processJob(job: QueueJob, processor: JobProcessor, queue: QueueConfig): Promise<void> {
    try {
      job.status = 'processing';
      job.started_at = new Date();
      job.attempt_count++;
      this.jobs.set(job.id, job);

      // Set timeout for job processing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), queue.job_timeout_ms);
      });

      // Process job with timeout
      const result = await Promise.race([
        processor(job),
        timeoutPromise
      ]);

      job.status = 'completed';
      job.completed_at = new Date();
      this.jobs.set(job.id, job);

      await this.metricsService.recordMetric('job_completed', 1, 'counter', { 
        labels: { 
          queue_name: job.queue_name,
          attempts: job.attempt_count.toString()
        } 
      });

    } catch (error) {
      job.error_message = error instanceof Error ? error.message : String(error);
      job.failed_at = new Date();

      if (job.attempt_count >= job.max_attempts) {
        job.status = 'failed';
        
        // Move to dead letter queue if configured
        if (queue.dead_letter_queue) {
          await this.addJob(queue.dead_letter_queue, {
            original_job: job,
            error: job.error_message
          });
        }

        await this.metricsService.recordMetric('job_failed', 1, 'counter', { 
          labels: { 
            queue_name: job.queue_name,
            final_attempt: 'true');
      } else {
        // Retry with exponential backoff
        const delay = queue.retry_delay_ms * Math.pow(2, job.attempt_count - 1);
        job.delay_until = new Date(Date.now() + delay);
        job.status = 'delayed';
        
        // Add back to queue for retry
        this.addJobToQueue(job.queue_name, job);

        await this.metricsService.recordMetric('job_retried', 1, 'counter', { 
          labels: { 
            queue_name: job.queue_name,
            attempt: job.attempt_count.toString()
          } 
        });
      }
`, this.jobs.set(job.id, job));
`
      this.logger.error(`;
Job;
$;
{
    job.id;
}
failed `, error instanceof Error ? error : new Error(String(error)), 'QueueService');
    }
  }

  private processDelayedJobs(queueName: string): void {
    const now = new Date();
    const delayedJobs = Array.from(this.jobs.values()).filter(job => 
      job.queue_name === queueName && 
      job.status === 'delayed' && 
      job.delay_until && 
      job.delay_until <= now
    );

    delayedJobs.forEach(job => {
      job.status = 'pending';
      job.delay_until = undefined;
      this.jobs.set(job.id, job);
      this.addJobToQueue(queueName, job);
    });
  }

  private startCleanupWorker(): void {
    setInterval(() => {
      this.cleanupCompletedJobs();
    }, 300000); // Every 5 minutes
  }

  private cleanupCompletedJobs(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [jobId, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.completed_at && 
          job.completed_at < cutoffTime) {
        this.jobs.delete(jobId);
      }
    }
  }
}

export default QueueService;;
//# sourceMappingURL=QueueService.js.map