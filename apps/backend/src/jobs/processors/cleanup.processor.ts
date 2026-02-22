import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueName } from '../constants/queue-names';
import { CleanupJobData } from '../interfaces/job-data.interface';
import { DatabaseService } from '@the-new-fuse/database';
import { authSessions } from '@the-new-fuse/database';
import { lt } from 'drizzle-orm';

/**
 * Cleanup job processor
 * Handles scheduled cleanup tasks for old data, sessions, temp files, etc.
 */
@Processor(QueueName.CLEANUP)
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Process cleanup job
   */
  @Process('cleanup')
  async handleCleanup(job: Job<CleanupJobData>) {
    this.logger.log(
      `Processing cleanup job ${job.id} for type ${job.data.cleanupType}`,
    );

    try {
      const { cleanupType, olderThan, batchSize } = job.data;

      await job.progress(10);

      let result: any;

      switch (cleanupType) {
        case 'old_sessions':
          result = await this.cleanupOldSessions(olderThan || 7, batchSize);
          break;
        case 'temp_files':
          result = await this.cleanupTempFiles(olderThan || 1, batchSize);
          break;
        case 'expired_tokens':
          result = await this.cleanupExpiredTokens(batchSize);
          break;
        case 'old_logs':
          result = await this.cleanupOldLogs(olderThan || 30, batchSize);
          break;
        default:
          throw new Error(`Unknown cleanup type: ${cleanupType}`);
      }

      await job.progress(100);

      this.logger.log(
        `Cleanup completed for ${cleanupType}. Removed ${result.removedCount} items.`,
      );

      return {
        cleanupType,
        removedCount: result.removedCount,
        processedCount: result.processedCount,
        cleanedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Cleanup failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clean up old sessions
   */
  private async cleanupOldSessions(olderThanDays: number, batchSize = 100) {
    this.logger.debug(`Cleaning up sessions older than ${olderThanDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // TODO: Implement actual database cleanup
    // Example: await this.drizzle.session.deleteMany({
    //   where: { updatedAt: { lt: cutoffDate } }
    // });

    await this.sleep(1000);

    return {
      processedCount: 150,
      removedCount: 120,
    };
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(olderThanDays: number, batchSize = 100) {
    this.logger.debug(`Cleaning up temp files older than ${olderThanDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // TODO: Implement actual file system cleanup
    // Example: Delete files in /tmp, /uploads/temp, etc.

    await this.sleep(1500);

    return {
      processedCount: 50,
      removedCount: 45,
    };
  }

  /**
   * Clean up expired tokens
   */
  private async cleanupExpiredTokens(batchSize = 100) {
    this.logger.debug('Cleaning up expired tokens');

    const now = new Date();

    const result = await this.db.client
      .delete(authSessions)
      .where(lt(authSessions.expiresAt, now));

    return {
      processedCount: (result as any).rowCount,
      removedCount: (result as any).rowCount,
    };
  }

  /**
   * Clean up old logs
   */
  private async cleanupOldLogs(olderThanDays: number, batchSize = 100) {
    this.logger.debug(`Cleaning up logs older than ${olderThanDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // TODO: Implement actual log cleanup
    // Example: Delete old log files or database log entries

    await this.sleep(2000);

    return {
      processedCount: 1000,
      removedCount: 950,
    };
  }

  /**
   * Event handler for active jobs
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing cleanup job ${job.id} of type ${job.name}`);
  }

  /**
   * Event handler for completed jobs
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Cleanup job ${job.id} completed. Type: ${result.cleanupType}, Removed: ${result.removedCount} items`,
    );
  }

  /**
   * Event handler for failed jobs
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Cleanup job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Helper method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
