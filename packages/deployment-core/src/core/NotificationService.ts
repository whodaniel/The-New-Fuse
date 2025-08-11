import {
  PipelineDefinition,
  PipelineResult,
  BuildResult,
  DeploymentResult,
  RollbackResult,
  NotificationChannel,
  NotificationEvent
} from '../types/pipeline';
import { Logger } from 'winston';
import axios from 'axios';

/**
 * Notification Service handles sending notifications for pipeline events
 */
export class NotificationService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Notify pipeline start
   */
  async notifyPipelineStart(pipeline: PipelineDefinition, executionId: string): Promise<void> {
    this.logger.info(`Sending pipeline start notifications: ${pipeline.name}`, {
      pipelineId: pipeline.id,
      executionId
    });

    const message = {
      type: 'pipeline_start',
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        environment: pipeline.environment.name
      },
      executionId,
      timestamp: new Date(),
      message: `Pipeline "${pipeline.name}" has started execution`
    };

    await this.sendNotifications(pipeline.notifications, message);
  }

  /**
   * Notify pipeline completion
   */
  async notifyPipelineComplete(result: PipelineResult): Promise<void> {
    this.logger.info(`Sending pipeline completion notifications: ${result.id}`, {
      pipelineId: result.pipelineId,
      status: result.status,
      duration: result.duration
    });

    const message = {
      type: 'pipeline_complete',
      pipeline: {
        id: result.pipelineId,
        executionId: result.id,
        status: result.status,
        environment: result.environment
      },
      result: {
        status: result.status,
        duration: result.duration,
        startTime: result.startTime,
        endTime: result.endTime,
        stageCount: result.stages.length,
        artifactCount: result.artifacts.length
      },
      timestamp: new Date(),
      message: `Pipeline execution ${result.status}: ${result.id} (${this.formatDuration(result.duration)})`
    };

    // Get pipeline config to access notification settings
    // For now, we'll use a default notification configuration
    const defaultNotifications = this.getDefaultNotifications();
    await this.sendNotifications(defaultNotifications, message);
  }

  /**
   * Notify pipeline failure
   */
  async notifyPipelineFailed(result: PipelineResult): Promise<void> {
    this.logger.info(`Sending pipeline failure notifications: ${result.id}`, {
      pipelineId: result.pipelineId,
      error: result.error
    });

    const failedStages = result.stages.filter(s => s.status === 'failed');
    
    const message = {
      type: 'pipeline_failed',
      pipeline: {
        id: result.pipelineId,
        executionId: result.id,
        status: result.status,
        environment: result.environment
      },
      result: {
        status: result.status,
        duration: result.duration,
        error: result.error,
        failedStages: failedStages.map(s => ({
          name: s.name,
          error: s.error
        }))
      },
      timestamp: new Date(),
      message: `Pipeline execution FAILED: ${result.id} - ${result.error}`,
      severity: 'high'
    };

    const defaultNotifications = this.getDefaultNotifications();
    await this.sendNotifications(defaultNotifications, message);
  }

  /**
   * Notify build completion
   */
  async notifyBuildComplete(result: BuildResult): Promise<void> {
    this.logger.info(`Sending build completion notifications: ${result.id}`, {
      triggerId: result.triggerId,
      status: result.status,
      duration: result.duration
    });

    const message = {
      type: 'build_complete',
      build: {
        id: result.id,
        triggerId: result.triggerId,
        status: result.status
      },
      result: {
        status: result.status,
        duration: result.duration,
        artifactCount: result.artifacts.length,
        metrics: result.metrics
      },
      timestamp: new Date(),
      message: `Build ${result.status}: ${result.id} (${this.formatDuration(result.duration)})`
    };

    const defaultNotifications = this.getDefaultNotifications();
    await this.sendNotifications(defaultNotifications, message);
  }

  /**
   * Notify deployment completion
   */
  async notifyDeploymentComplete(result: DeploymentResult): Promise<void> {
    this.logger.info(`Sending deployment completion notifications: ${result.id}`, {
      deploymentId: result.deploymentId,
      environment: result.environment,
      status: result.status
    });

    const message = {
      type: 'deployment_complete',
      deployment: {
        id: result.deploymentId,
        environment: result.environment,
        status: result.status
      },
      result: {
        status: result.status,
        duration: result.duration,
        services: result.services.map(s => ({
          name: s.name,
          status: s.status,
          replicas: s.replicas,
          version: s.version
        })),
        healthChecks: result.healthChecks.map(h => ({
          name: h.name,
          status: h.status
        }))
      },
      timestamp: new Date(),
      message: `Deployment ${result.status} to ${result.environment}: ${result.id}`
    };

    const defaultNotifications = this.getDefaultNotifications();
    await this.sendNotifications(defaultNotifications, message);
  }

  /**
   * Notify deployment failure
   */
  async notifyDeploymentFailed(result: DeploymentResult): Promise<void> {
    this.logger.info(`Sending deployment failure notifications: ${result.id}`, {
      deploymentId: result.deploymentId,
      environment: result.environment,
      error: result.error
    });

    const message = {
      type: 'deployment_failed',
      deployment: {
        id: result.deploymentId,
        environment: result.environment,
        status: result.status
      },
      result: {
        status: result.status,
        error: result.error,
        duration: result.duration,
        failedServices: result.services.filter(s => s.status === 'failed')
      },
      timestamp: new Date(),
      message: `Deployment FAILED to ${result.environment}: ${result.error}`,
      severity: 'critical'
    };

    const defaultNotifications = this.getDefaultNotifications();
    await this.sendNotifications(defaultNotifications, message);
  }

  /**
   * Notify rollback completion
   */
  async notifyRollbackComplete(result: RollbackResult): Promise<void> {
    this.logger.info(`Sending rollback completion notifications: ${result.id}`, {
      deploymentId: result.deploymentId,
      status: result.status
    });

    const message = {
      type: 'rollback_complete',
      rollback: {
        id: result.id,
        deploymentId: result.deploymentId,
        status: result.status
      },
      result: {
        status: result.status,
        duration: result.duration,
        previousVersion: result.previousVersion,
        currentVersion: result.currentVersion,
        reason: result.reason
      },
      timestamp: new Date(),
      message: `Rollback ${result.status}: ${result.deploymentId} (${result.reason})`
    };

    const defaultNotifications = this.getDefaultNotifications();
    await this.sendNotifications(defaultNotifications, message);
  }

  // Private helper methods

  private async sendNotifications(
    notifications: any[], 
    message: any
  ): Promise<void> {
    for (const notification of notifications) {
      if (!notification.enabled) {
        continue;
      }

      // Check if this event type should trigger notifications
      const shouldNotify = notification.events.some((event: NotificationEvent) => 
        event.type === message.type && event.enabled
      );

      if (!shouldNotify) {
        continue;
      }

      // Check notification conditions
      if (!this.evaluateNotificationConditions(notification.conditions, message)) {
        continue;
      }

      // Send to each channel
      for (const channel of notification.channels) {
        try {
          await this.sendToChannel(channel, message);
        } catch (error) {
          this.logger.error(`Failed to send notification to ${channel.type}`, {
            channel: channel.type,
            error: error.message,
            messageType: message.type
          });
        }
      }
    }
  }

  private async sendToChannel(channel: NotificationChannel, message: any): Promise<void> {
    switch (channel.type) {
      case 'slack':
        await this.sendSlackNotification(channel, message);
        break;
      case 'email':
        await this.sendEmailNotification(channel, message);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, message);
        break;
      case 'sms':
        await this.sendSMSNotification(channel, message);
        break;
      default:
        this.logger.warn(`Unknown notification channel type: ${channel.type}`);
    }
  }

  private async sendSlackNotification(channel: NotificationChannel, message: any): Promise<void> {
    const webhookUrl = channel.configuration.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const slackMessage = this.formatSlackMessage(message);
    
    await axios.post(webhookUrl, slackMessage, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.logger.debug('Slack notification sent', {
      channel: channel.configuration.channel,
      messageType: message.type
    });
  }

  private async sendEmailNotification(channel: NotificationChannel, message: any): Promise<void> {
    // Email notification implementation would go here
    // This would typically integrate with an email service like SendGrid, SES, etc.
    
    this.logger.info('Email notification sent (simulated)', {
      recipients: channel.recipients,
      subject: this.getEmailSubject(message),
      messageType: message.type
    });
  }

  private async sendWebhookNotification(channel: NotificationChannel, message: any): Promise<void> {
    const webhookUrl = channel.configuration.url;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'TNF-Pipeline-Notifier/1.0',
      ...channel.configuration.headers
    };

    await axios.post(webhookUrl, message, { headers });

    this.logger.debug('Webhook notification sent', {
      url: webhookUrl,
      messageType: message.type
    });
  }

  private async sendSMSNotification(channel: NotificationChannel, message: any): Promise<void> {
    // SMS notification implementation would go here
    // This would typically integrate with a service like Twilio, AWS SNS, etc.
    
    this.logger.info('SMS notification sent (simulated)', {
      recipients: channel.recipients,
      message: this.getSMSMessage(message),
      messageType: message.type
    });
  }

  private formatSlackMessage(message: any): any {
    const color = this.getSlackColor(message);
    const emoji = this.getSlackEmoji(message);

    let text = `${emoji} ${message.message}`;
    
    const fields: any[] = [];

    if (message.pipeline) {
      fields.push({
        title: 'Pipeline',
        value: message.pipeline.name || message.pipeline.id,
        short: true
      });

      if (message.pipeline.environment) {
        fields.push({
          title: 'Environment',
          value: message.pipeline.environment,
          short: true
        });
      }
    }

    if (message.deployment) {
      fields.push({
        title: 'Environment',
        value: message.deployment.environment,
        short: true
      });
    }

    if (message.result) {
      if (message.result.duration) {
        fields.push({
          title: 'Duration',
          value: this.formatDuration(message.result.duration),
          short: true
        });
      }

      if (message.result.error) {
        fields.push({
          title: 'Error',
          value: message.result.error,
          short: false
        });
      }
    }

    return {
      attachments: [{
        color,
        text,
        fields,
        ts: Math.floor(message.timestamp.getTime() / 1000)
      }]
    };
  }

  private getSlackColor(message: any): string {
    switch (message.type) {
      case 'pipeline_failed':
      case 'deployment_failed':
        return 'danger';
      case 'pipeline_complete':
      case 'deployment_complete':
      case 'rollback_complete':
        return message.result?.status === 'success' ? 'good' : 'danger';
      case 'pipeline_start':
        return 'warning';
      default:
        return 'good';
    }
  }

  private getSlackEmoji(message: any): string {
    switch (message.type) {
      case 'pipeline_start':
        return '🚀';
      case 'pipeline_complete':
        return message.result?.status === 'success' ? '✅' : '❌';
      case 'pipeline_failed':
        return '❌';
      case 'deployment_complete':
        return message.result?.status === 'success' ? '🎉' : '❌';
      case 'deployment_failed':
        return '💥';
      case 'rollback_complete':
        return '🔄';
      case 'build_complete':
        return message.result?.status === 'success' ? '🔨' : '❌';
      default:
        return 'ℹ️';
    }
  }

  private getEmailSubject(message: any): string {
    switch (message.type) {
      case 'pipeline_start':
        return `Pipeline Started: ${message.pipeline?.name}`;
      case 'pipeline_complete':
        return `Pipeline ${message.result?.status}: ${message.pipeline?.name}`;
      case 'pipeline_failed':
        return `Pipeline Failed: ${message.pipeline?.name}`;
      case 'deployment_complete':
        return `Deployment ${message.result?.status}: ${message.deployment?.environment}`;
      case 'deployment_failed':
        return `Deployment Failed: ${message.deployment?.environment}`;
      case 'rollback_complete':
        return `Rollback ${message.result?.status}: ${message.rollback?.deploymentId}`;
      case 'build_complete':
        return `Build ${message.result?.status}: ${message.build?.id}`;
      default:
        return 'Pipeline Notification';
    }
  }

  private getSMSMessage(message: any): string {
    return `${message.message} - ${new Date().toLocaleString()}`;
  }

  private evaluateNotificationConditions(conditions: any[], message: any): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.every(condition => {
      switch (condition.type) {
        case 'status':
          return message.result?.status === condition.value;
        case 'environment':
          return message.pipeline?.environment === condition.value || 
                 message.deployment?.environment === condition.value;
        case 'duration':
          const duration = message.result?.duration || 0;
          switch (condition.operator) {
            case 'greater_than':
              return duration > condition.value;
            case 'less_than':
              return duration < condition.value;
            default:
              return true;
          }
        default:
          return true;
      }
    });
  }

  private formatDuration(duration?: number): string {
    if (!duration) return '0s';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private getDefaultNotifications(): any[] {
    return [{
      enabled: true,
      channels: [{
        type: 'slack',
        configuration: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#ci-cd'
        },
        recipients: []
      }],
      events: [
        { type: 'pipeline_start', enabled: true },
        { type: 'pipeline_complete', enabled: true },
        { type: 'pipeline_failed', enabled: true },
        { type: 'deployment_complete', enabled: true },
        { type: 'deployment_failed', enabled: true },
        { type: 'rollback_complete', enabled: true }
      ],
      conditions: []
    }];
  }
}