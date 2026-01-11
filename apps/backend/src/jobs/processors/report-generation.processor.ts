import { OnQueueActive, OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { agents, transactions, wallets, users } from '@the-new-fuse/database/drizzle/schema';
import { Job } from 'bull';
import { and, count, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { SystemMetricsService } from '../../modules/system-metrics/system-metrics.service';
import { EmailService } from '../../services/email.service';
import { QueueName } from '../constants/queue-names';
import { ReportGenerationJobData } from '../interfaces/job-data.interface';

/**
 * Report generation job processor
 * Handles generating various types of reports in the background
 */
@Processor(QueueName.REPORT_GENERATION)
@Injectable()
export class ReportGenerationProcessor {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly systemMetricsService: SystemMetricsService,
    private readonly db: DatabaseService
  ) {}

  /**
   * Process report generation job
   */
  @Process('generate-report')
  async handleGenerateReport(job: Job<ReportGenerationJobData>) {
    this.logger.log(`Processing generate-report job ${job.id} for type ${job.data.reportType}`);

    try {
      const { reportType, userId, parameters, format, emailOnComplete, email } = job.data;

      // Update progress
      await job.progress(10);

      this.logger.log(`Generating ${reportType} report for user ${userId}`);

      // Simulate data collection
      await this.sleep(1000);
      await job.progress(30);

      // Generate report based on type
      let reportData: any;
      switch (reportType) {
        case 'user-activity':
          reportData = await this.generateUserActivityReport(parameters);
          break;
        case 'agent-performance':
          reportData = await this.generateAgentPerformanceReport(parameters);
          break;
        case 'system-metrics':
          reportData = await this.generateSystemMetricsReport(parameters);
          break;
        case 'revenue':
          reportData = await this.generateRevenueReport(parameters, userId);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      await job.progress(70);

      // Format report
      const formattedReport = await this.formatReport(reportData, format || 'json');
      await job.progress(90);

      // Save report (simulated)
      const reportUrl = await this.saveReport(formattedReport, reportType, userId);

      // Send email if requested
      if (emailOnComplete && email) {
        await this.emailService.sendEmail({
          to: email,
          subject: `Your ${reportType} report is ready`,
          html: `
            <h1>Report Generation Complete</h1>
            <p>Your ${reportType} report has been generated successfully.</p>
            <p><strong>Report Details:</strong></p>
            <ul>
              <li>Type: ${reportType}</li>
              <li>Format: ${format || 'json'}</li>
              <li>Generated: ${new Date().toISOString()}</li>
            </ul>
            <p>Download your report: <a href="${reportUrl}">Click here</a></p>
          `,
        });
      }

      await job.progress(100);

      const result = {
        reportType,
        userId,
        format: format || 'json',
        reportUrl,
        recordCount: reportData.recordCount || 0,
        generatedAt: new Date().toISOString(),
      };

      this.logger.log(`Report ${reportType} generated successfully for user ${userId}`);

      return result;
    } catch (error) {
      this.logger.error(`Report generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process scheduled report generation
   */
  @Process('scheduled-report')
  async handleScheduledReport(job: Job<ReportGenerationJobData & { schedule: string }>) {
    this.logger.log(`Processing scheduled-report job ${job.id} for type ${job.data.reportType}`);

    try {
      // Generate the report using the main handler
      const result = await this.handleGenerateReport(job);

      return {
        ...result,
        scheduled: true,
        schedule: job.data.schedule,
      };
    } catch (error) {
      this.logger.error(`Scheduled report generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate user activity report
   */
  private async generateUserActivityReport(parameters: Record<string, any>) {
    this.logger.debug('Generating user activity report');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsersResult] = await this.db.client
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(isNull(users.deletedAt));
    const totalUsers = Number(totalUsersResult?.count ?? 0);

    const [activeUsersResult] = await this.db.client
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.isActive, true), isNull(users.deletedAt)));
    const activeUsers = Number(activeUsersResult?.count ?? 0);

    const [newUsersResult] = await this.db.client
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(gte(users.createdAt, thirtyDaysAgo), isNull(users.deletedAt)));
    const newUsers = Number(newUsersResult?.count ?? 0);

    return {
      recordCount: totalUsers,
      data: {
        totalUsers,
        activeUsers,
        newUsers,
        averageSessionDuration: 0, // Not tracked currently
      },
    };
  }

  /**
   * Generate agent performance report
   */
  private async generateAgentPerformanceReport(parameters: Record<string, any>) {
    this.logger.debug('Generating agent performance report');

    // TODO: Replace with actual agent metrics
    return {
      recordCount: 50,
      data: {
        totalAgents: 50,
        averageExecutionTime: 5000,
        successRate: 95.5,
        failureRate: 4.5,
      },
    };
  }

  /**
   * Generate system metrics report
   */
  private async generateSystemMetricsReport(parameters: Record<string, any>) {
    this.logger.debug('Generating system metrics report');

    const metrics = await this.systemMetricsService.getMetrics();

    return {
      recordCount: 1,
      data: {
        cpuUsage: metrics.cpu.usagePercent,
        memoryUsage: metrics.memory.usagePercent,
        diskUsage: metrics.disk?.usagePercent || 0,
        networkTraffic: metrics.network?.totalTraffic || 0,
        uptime: metrics.uptime,
        status: metrics.status,
      },
    };
  }

  /**
   * Generate revenue report
   */
  private async generateRevenueReport(parameters: Record<string, any>, userId?: string) {
    this.logger.debug('Generating revenue report');

    if (!userId) {
      throw new Error('UserId is required for revenue report');
    }

    // 1. Get Agent IDs for user
    const userAgents = await this.db.client
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.userId, userId));

    const agentIds = userAgents.map((a) => a.id);

    if (agentIds.length === 0) {
      return {
        recordCount: 0,
        data: {
          totalRevenue: 0,
          transactions: 0,
          averageTransactionValue: 0,
        },
      };
    }

    // 2. Get Wallet IDs for agents
    const agentWallets = await this.db.client
      .select({ id: wallets.id })
      .from(wallets)
      .where(inArray(wallets.agentId, agentIds));

    const walletIds = agentWallets.map((w) => w.id);

    if (walletIds.length === 0) {
      return {
        recordCount: 0,
        data: {
          totalRevenue: 0,
          transactions: 0,
          averageTransactionValue: 0,
        },
      };
    }

    // 3. Aggregate transactions
    const result = await this.db.client
      .select({
        totalRevenue: sql<number>`sum(${transactions.value})`,
        txCount: count(transactions.id),
        avgValue: sql<number>`avg(${transactions.value})`,
      })
      .from(transactions)
      .where(inArray(transactions.walletId, walletIds));

    const stats = result[0];

    return {
      recordCount: Number(stats.txCount),
      data: {
        totalRevenue: Number(stats.totalRevenue) || 0,
        transactions: Number(stats.txCount),
        averageTransactionValue: Number(stats.avgValue) || 0,
      },
    };
  }

  /**
   * Format report in requested format
   */
  private async formatReport(data: any, format: string) {
    this.logger.debug(`Formatting report as ${format}`);

    // TODO: Implement actual formatting logic
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'pdf':
        return this.convertToPDF(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert data to CSV
   */
  private convertToCSV(data: any): string {
    // TODO: Implement actual CSV conversion
    return 'CSV data placeholder';
  }

  /**
   * Convert data to PDF
   */
  private convertToPDF(data: any): string {
    // TODO: Implement actual PDF conversion
    return 'PDF data placeholder';
  }

  /**
   * Save report and return URL
   */
  private async saveReport(report: any, reportType: string, userId: string): Promise<string> {
    // TODO: Implement actual storage (S3, local file system, etc.)
    const reportId = `${reportType}-${userId}-${Date.now()}`;
    return `https://storage.thenewfuse.com/reports/${reportId}`;
  }

  /**
   * Event handler for active jobs
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing report generation job ${job.id} of type ${job.name}`);
  }

  /**
   * Event handler for completed jobs
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(
      `Report generation job ${job.id} completed. Type: ${result.reportType}, Records: ${result.recordCount}`
    );
  }

  /**
   * Event handler for failed jobs
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Report generation job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack
    );
  }

  /**
   * Helper method to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
