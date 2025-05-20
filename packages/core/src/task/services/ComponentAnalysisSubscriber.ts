import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../../logger/logger.service.js';
import { WebhookService } from '../../webhook/webhook.service.js';

@Injectable()
export class ComponentAnalysisSubscriber {
  constructor(
    private readonly logger: LoggerService,
    private readonly webhookService: WebhookService
  ) {}

  @OnEvent('component-analysis.completed')
  async handleAnalysisCompleted(payload: any) {
    this.logger.info('Component analysis completed', {
      results: payload.results.stats,
      trends: payload.trends
    });

    await this.webhookService.notify('component-analysis.completed', payload);
  }

  @OnEvent('component-analysis.significant-change')
  async handleSignificantChange(payload: any) {
    this.logger.warn('Significant changes detected in component analysis', {
      changes: payload.changes
    });

    // Send webhook notification with high priority
    await this.webhookService.notify('component-analysis.significant-change', {
      ...payload,
      priority: 'high'
    });
  }

  @OnEvent('component-analysis.error')
  async handleAnalysisError(payload: { error: Error }) {
    this.logger.error('Component analysis failed', {
      error: payload.error,
      stack: payload.error.stack
    });

    await this.webhookService.notify('component-analysis.error', {
      error: payload.error.message,
      timestamp: new Date().toISOString()
    });
  }
}