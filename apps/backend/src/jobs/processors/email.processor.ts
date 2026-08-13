import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueName } from '../constants/queue-names';
import {
  EmailJobData,
  WelcomeEmailJobData,
  NotificationEmailJobData,
} from '../interfaces/job-data.interface';
import { EmailService } from '../../services/email.service';

/**
 * Email job processor
 * Handles all email-related background jobs
 */
@Processor(QueueName.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Process generic email job
   */
  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing send-email job ${job.id}`);

    try {
      const { to, subject, text, html, from } = job.data;

      await this.emailService.sendEmail({
        to,
        subject,
        text,
        html,
        from,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return { success: true, to };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Process welcome email job
   */
  @Process('welcome-email')
  async handleWelcomeEmail(job: Job<WelcomeEmailJobData>) {
    this.logger.log(`Processing welcome-email job ${job.id} for user ${job.data.userId}`);

    try {
      const { email, name } = job.data;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to The New Fuse, ${name}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #666;">
            We're excited to have you on board. The New Fuse is your AI-powered platform
            for building and deploying intelligent agents.
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Getting Started</h2>
            <ul style="color: #666; line-height: 1.8;">
              <li>Explore the agent marketplace</li>
              <li>Create your first custom agent</li>
              <li>Connect your workflows</li>
              <li>Join our community</li>
            </ul>
          </div>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      `;

      await this.emailService.sendEmail({
        to: email,
        subject: 'Welcome to The New Fuse!',
        html,
      });

      this.logger.log(`Welcome email sent successfully to ${email}`);
      return { success: true, userId: job.data.userId };
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process notification email job
   */
  @Process('notification-email')
  async handleNotificationEmail(job: Job<NotificationEmailJobData>) {
    this.logger.log(`Processing notification-email job ${job.id}`);

    try {
      const { email, notificationType, data } = job.data;

      await this.emailService.sendNotificationEmail(email, notificationType, data);

      this.logger.log(`Notification email sent successfully to ${email}`);
      return { success: true, notificationType };
    } catch (error) {
      this.logger.error(`Failed to send notification email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Event handler for active jobs
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  /**
   * Event handler for completed jobs
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully. Result: ${JSON.stringify(result)}`);
  }

  /**
   * Event handler for failed jobs
   */
  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
      error.stack,
    );
  }
}
