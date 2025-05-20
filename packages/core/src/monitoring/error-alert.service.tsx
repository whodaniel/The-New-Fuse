import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { ErrorCategory, ErrorSeverity } from './ErrorTrackingService.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

interface ErrorAlert {
  timestamp: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  count: number;
  message: string;
}

interface AlertNotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    minSeverity: ErrorSeverity;
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    minSeverity: ErrorSeverity;
  };
  pagerDuty?: {
    enabled: boolean;
    serviceKey: string;
    minSeverity: ErrorSeverity;
  };
}

@Injectable()
export class ErrorAlertService implements OnModuleInit {
  private readonly logger = new Logger(ErrorAlertService.name);
  private notificationConfig: AlertNotificationConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  onModuleInit() {
    // Load notification configuration
    this.notificationConfig = {
      email: {
        enabled: this.configService.get<boolean>('alerts.email.enabled', false),
        recipients: this.configService.get<string[]>('alerts.email.recipients', []),
        minSeverity: this.configService.get<ErrorSeverity>('alerts.email.minSeverity', ErrorSeverity.HIGH)
      },
      slack: {
        enabled: this.configService.get<boolean>('alerts.slack.enabled', false),
        webhookUrl: this.configService.get<string>('alerts.slack.webhookUrl', ''),
        channel: this.configService.get<string>('alerts.slack.channel', '#alerts'),
        minSeverity: this.configService.get<ErrorSeverity>('alerts.slack.minSeverity', ErrorSeverity.MEDIUM)
      },
      pagerDuty: {
        enabled: this.configService.get<boolean>('alerts.pagerDuty.enabled', false),
        serviceKey: this.configService.get<string>('alerts.pagerDuty.serviceKey', ''),
        minSeverity: this.configService.get<ErrorSeverity>('alerts.pagerDuty.minSeverity', ErrorSeverity.CRITICAL)
      }
    };

    this.logger.info('Error alert service initialized');
  }

  @OnEvent('error.alert')
  async handleErrorAlert(alert: ErrorAlert) {
    this.logger.warn(`Error alert triggered: ${alert.message}`);

    // Store alert in database
    await this.storeAlert(alert);

    // Send notifications based on severity
    await this.sendNotifications(alert);
  }

  private async storeAlert(alert: ErrorAlert): Promise<void> {
    try {
      await this.prisma.errorMetric.create({
        data: {
          name: 'error_alert',
          category: alert.category,
          severity: alert.severity,
          service: 'error_monitoring',
          timestamp: new Date(alert.timestamp),
          metadata: alert as any
        }
      });
    } catch (error) {
      this.logger.error('Failed to store error alert', error);
    }
  }

  private async sendNotifications(alert: ErrorAlert): Promise<void> {
    const severityLevels = Object.values(ErrorSeverity);
    const alertSeverityIndex = severityLevels.indexOf(alert.severity);

    // Send email notifications
    if (
      this.notificationConfig.email?.enabled &&
      alertSeverityIndex >= severityLevels.indexOf(this.notificationConfig.email.minSeverity)
    ) {
      await this.sendEmailAlert(alert);
    }

    // Send Slack notifications
    if (
      this.notificationConfig.slack?.enabled &&
      alertSeverityIndex >= severityLevels.indexOf(this.notificationConfig.slack.minSeverity)
    ) {
      await this.sendSlackAlert(alert);
    }

    // Send PagerDuty notifications
    if (
      this.notificationConfig.pagerDuty?.enabled &&
      alertSeverityIndex >= severityLevels.indexOf(this.notificationConfig.pagerDuty.minSeverity)
    ) {
      await this.sendPagerDutyAlert(alert);
    }
  }

  private async sendEmailAlert(alert: ErrorAlert): Promise<void> {
    try {
      // Implementation would use an email service
      this.logger.info(`Would send email alert to ${this.notificationConfig.email?.recipients.join(', ')}`);
      
      // Emit event for email notification
      this.eventEmitter.emit('notification.email', {
        recipients: this.notificationConfig.email?.recipients,
        subject: `[${alert.severity.toUpperCase()}] Error Alert: ${alert.category}`,
        body: `
          <h1>Error Alert</h1>
          <p><strong>Severity:</strong> ${alert.severity}</p>
          <p><strong>Category:</strong> ${alert.category}</p>
          <p><strong>Count:</strong> ${alert.count}</p>
          <p><strong>Time:</strong> ${alert.timestamp}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
        `
      });
    } catch (error) {
      this.logger.error('Failed to send email alert', error);
    }
  }

  private async sendSlackAlert(alert: ErrorAlert): Promise<void> {
    try {
      // Implementation would use Slack API
      this.logger.info(`Would send Slack alert to ${this.notificationConfig.slack?.channel}`);
      
      // Emit event for Slack notification
      this.eventEmitter.emit('notification.slack', {
        channel: this.notificationConfig.slack?.channel,
        text: `*[${alert.severity.toUpperCase()}] Error Alert*\n>Category: ${alert.category}\n>Count: ${alert.count}\n>Message: ${alert.message}`
      });
    } catch (error) {
      this.logger.error('Failed to send Slack alert', error);
    }
  }

  private async sendPagerDutyAlert(alert: ErrorAlert): Promise<void> {
    try {
      // Implementation would use PagerDuty API
      this.logger.info('Would send PagerDuty alert');
      
      // Emit event for PagerDuty notification
      this.eventEmitter.emit('notification.pagerDuty', {
        serviceKey: this.notificationConfig.pagerDuty?.serviceKey,
        incidentKey: `error_${alert.category}_${alert.severity}`,
        description: `[${alert.severity.toUpperCase()}] ${alert.count} ${alert.category} errors detected`,
        details: alert
      });
    } catch (error) {
      this.logger.error('Failed to send PagerDuty alert', error);
    }
  }
}
