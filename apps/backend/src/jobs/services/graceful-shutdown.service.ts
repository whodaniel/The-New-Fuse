import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueName } from '../constants/queue-names.js';

/**
 * Graceful shutdown service
 * Ensures all jobs complete before shutting down
 */
@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds default

  constructor(
    @InjectQueue(QueueName.EMAIL) private emailQueue: Queue,
    @InjectQueue(QueueName.AGENT_EXECUTION) private agentQueue: Queue,
    @InjectQueue(QueueName.REPORT_GENERATION) private reportQueue: Queue,
    @InjectQueue(QueueName.DATA_SYNC) private dataSyncQueue: Queue,
    @InjectQueue(QueueName.CLEANUP) private cleanupQueue: Queue,
  ) {
    // Register signal handlers
    this.registerSignalHandlers();
  }

  /**
   * Called when the module is being destroyed
   */
  async onModuleDestroy() {
    await this.shutdown();
  }

  /**
   * Register signal handlers for graceful shutdown
   */
  private registerSignalHandlers() {
    // Handle SIGTERM (Docker/Kubernetes shutdown)
    process.on('SIGTERM', async () => {
      this.logger.warn('SIGTERM received, starting graceful shutdown');
      await this.shutdown();
      process.exit(0);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      this.logger.warn('SIGINT received, starting graceful shutdown');
      await this.shutdown();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught exception:', error);
      await this.shutdown();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      this.logger.error('Unhandled rejection:', reason);
      await this.shutdown();
      process.exit(1);
    });
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown() {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    this.logger.log('Starting graceful shutdown...');

    const startTime = Date.now();

    try {
      // Pause all queues to prevent new jobs
      await this.pauseAllQueues();

      // Wait for active jobs to complete
      await this.waitForActiveJobs();

      // Close all queue connections
      await this.closeAllQueues();

      const duration = Date.now() - startTime;
      this.logger.log(`Graceful shutdown completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      throw error;
    }
  }

  /**
   * Pause all queues
   */
  private async pauseAllQueues() {
    this.logger.log('Pausing all queues...');

    const queues = [
      this.emailQueue,
      this.agentQueue,
      this.reportQueue,
      this.dataSyncQueue,
      this.cleanupQueue,
    ];

    await Promise.all(
      queues.map(async (queue) => {
        try {
          await queue.pause(true); // true = pause locally only
          this.logger.debug(`Queue ${queue.name} paused`);
        } catch (error) {
          this.logger.error(`Failed to pause queue ${queue.name}:`, error);
        }
      }),
    );

    this.logger.log('All queues paused');
  }

  /**
   * Wait for all active jobs to complete
   */
  private async waitForActiveJobs() {
    this.logger.log('Waiting for active jobs to complete...');

    const queues = [
      { name: QueueName.EMAIL, queue: this.emailQueue },
      { name: QueueName.AGENT_EXECUTION, queue: this.agentQueue },
      { name: QueueName.REPORT_GENERATION, queue: this.reportQueue },
      { name: QueueName.DATA_SYNC, queue: this.dataSyncQueue },
      { name: QueueName.CLEANUP, queue: this.cleanupQueue },
    ];

    const startTime = Date.now();

    // Poll for active jobs
    while (Date.now() - startTime < this.shutdownTimeout) {
      const activeJobCounts = await Promise.all(
        queues.map(async ({ name, queue }) => {
          const counts = await queue.getJobCounts();
          return { name, active: counts.active || 0 };
        }),
      );

      const totalActive = activeJobCounts.reduce(
        (sum, { active }) => sum + active,
        0,
      );

      if (totalActive === 0) {
        this.logger.log('All active jobs completed');
        return;
      }

      this.logger.debug(
        `Waiting for ${totalActive} active jobs to complete...`,
        activeJobCounts.filter((q) => q.active > 0),
      );

      // Wait 1 second before checking again
      await this.sleep(1000);
    }

    // Timeout reached
    const activeJobCounts = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts();
        return { name, active: counts.active || 0 };
      }),
    );

    const totalActive = activeJobCounts.reduce(
      (sum, { active }) => sum + active,
      0,
    );

    if (totalActive > 0) {
      this.logger.warn(
        `Shutdown timeout reached. ${totalActive} jobs still active:`,
        activeJobCounts.filter((q) => q.active > 0),
      );
    }
  }

  /**
   * Close all queue connections
   */
  private async closeAllQueues() {
    this.logger.log('Closing all queue connections...');

    const queues = [
      { name: QueueName.EMAIL, queue: this.emailQueue },
      { name: QueueName.AGENT_EXECUTION, queue: this.agentQueue },
      { name: QueueName.REPORT_GENERATION, queue: this.reportQueue },
      { name: QueueName.DATA_SYNC, queue: this.dataSyncQueue },
      { name: QueueName.CLEANUP, queue: this.cleanupQueue },
    ];

    await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          await queue.close();
          this.logger.debug(`Queue ${name} closed`);
        } catch (error) {
          this.logger.error(`Failed to close queue ${name}:`, error);
        }
      }),
    );

    this.logger.log('All queue connections closed');
  }

  /**
   * Set custom shutdown timeout
   */
  setShutdownTimeout(timeout: number) {
    this.shutdownTimeout = timeout;
    this.logger.log(`Shutdown timeout set to ${timeout}ms`);
  }

  /**
   * Get shutdown status
   */
  isShutdown(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Helper method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
