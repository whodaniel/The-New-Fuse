import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QueueName } from './constants/queue-names';
import { JobMetricsService } from './services/job-metrics.service';

/**
 * Jobs monitoring controller
 * Provides API endpoints for monitoring job queues
 */
@Controller('jobs')
export class JobsMonitoringController {
  constructor(private readonly metricsService: JobMetricsService) {}

  /**
   * Get overall job statistics
   * GET /api/jobs/stats
   */
  @Get('stats')
  async getStatistics() {
    return this.metricsService.getJobStatistics();
  }

  /**
   * Get metrics for all queues
   * GET /api/jobs/queues
   */
  @Get('queues')
  async getAllQueueMetrics() {
    return this.metricsService.getAllQueueMetrics();
  }

  /**
   * Get metrics for a specific queue
   * GET /api/jobs/queues/:queueName
   */
  @Get('queues/:queueName')
  async getQueueMetrics(@Param('queueName') queueName: QueueName) {
    return this.metricsService.getQueueMetrics(queueName);
  }

  /**
   * Get failed jobs for a queue
   * GET /api/jobs/queues/:queueName/failed
   */
  @Get('queues/:queueName/failed')
  async getFailedJobs(@Param('queueName') queueName: QueueName, @Query('limit') limit?: number) {
    return this.metricsService.getFailedJobs(queueName, limit || 10);
  }

  /**
   * Get active jobs for a queue
   * GET /api/jobs/queues/:queueName/active
   */
  @Get('queues/:queueName/active')
  async getActiveJobs(@Param('queueName') queueName: QueueName, @Query('limit') limit?: number) {
    return this.metricsService.getActiveJobs(queueName, limit || 10);
  }

  /**
   * Get completed jobs for a queue
   * GET /api/jobs/queues/:queueName/completed
   */
  @Get('queues/:queueName/completed')
  async getCompletedJobs(@Param('queueName') queueName: QueueName, @Query('limit') limit?: number) {
    return this.metricsService.getCompletedJobs(queueName, limit || 10);
  }

  /**
   * Get queue health status
   * GET /api/jobs/queues/:queueName/health
   */
  @Get('queues/:queueName/health')
  async getQueueHealth(@Param('queueName') queueName: QueueName) {
    return this.metricsService.getQueueHealth(queueName);
  }

  /**
   * Pause a queue
   * POST /api/jobs/queues/:queueName/pause
   */
  @Post('queues/:queueName/pause')
  async pauseQueue(@Param('queueName') queueName: QueueName) {
    await this.metricsService.pauseQueue(queueName);
    return { message: `Queue ${queueName} paused successfully` };
  }

  /**
   * Resume a queue
   * POST /api/jobs/queues/:queueName/resume
   */
  @Post('queues/:queueName/resume')
  async resumeQueue(@Param('queueName') queueName: QueueName) {
    await this.metricsService.resumeQueue(queueName);
    return { message: `Queue ${queueName} resumed successfully` };
  }

  /**
   * Clean old jobs from a queue
   * POST /api/jobs/queues/:queueName/clean
   */
  @Post('queues/:queueName/clean')
  async cleanQueue(
    @Param('queueName') queueName: QueueName,
    @Query('grace') grace?: number,
    @Query('status') status?: 'completed' | 'failed'
  ) {
    const cleaned = await this.metricsService.cleanQueue(queueName, grace, status);
    return { message: `Cleaned ${cleaned} jobs from ${queueName}` };
  }

  /**
   * Get dashboard data
   * GET /api/jobs/dashboard
   */
  @Get('dashboard')
  async getDashboard() {
    const statistics = await this.metricsService.getJobStatistics();

    // Get health for all queues
    const healthChecks = await Promise.all(
      statistics.queues.map(async (queue) => ({
        queueName: queue.queueName,
        health: await this.metricsService.getQueueHealth(queue.queueName as QueueName),
      }))
    );

    return {
      statistics,
      health: healthChecks,
      timestamp: new Date().toISOString(),
    };
  }
}
