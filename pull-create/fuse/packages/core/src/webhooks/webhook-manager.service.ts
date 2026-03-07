import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  active: boolean;
  retryAttempts: number;
  timeout: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  webhookId: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

@Injectable()
export class WebhookManagerService {
  private readonly logger = new Logger(WebhookManagerService.name);
  private webhooks: Map<string, WebhookConfig> = new Map();
  private events: Map<string, WebhookEvent> = new Map();

  constructor(private eventEmitter: EventEmitter2) {}

  async registerWebhook(config: Omit<WebhookConfig, 'id'>): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      id: this.generateId(),
      ...config
    };
    this.webhooks.set(webhook.id, webhook);
    this.eventEmitter.emit('webhook.registered', webhook);
    return webhook;
  }

  async unregisterWebhook(webhookId: string): Promise<boolean> {
    const deleted = this.webhooks.delete(webhookId);
    if (deleted) {
      this.eventEmitter.emit('webhook.unregistered', { webhookId });
    }
    return deleted;
  }

  async updateWebhook(webhookId: string, updates: Partial<Omit<WebhookConfig, 'id'>>): Promise<WebhookConfig | null> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;
    
    const updatedWebhook = { ...webhook, ...updates };
    this.webhooks.set(webhookId, updatedWebhook);
    this.eventEmitter.emit('webhook.updated', updatedWebhook);
    return updatedWebhook;
  }

  async getWebhook(webhookId: string): Promise<WebhookConfig | null> {
    return this.webhooks.get(webhookId) || null;
  }

  async getAllWebhooks(): Promise<WebhookConfig[]> {
    return Array.from(this.webhooks.values());
  }

  async triggerWebhook(eventType: string, data: any): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.active && webhook.events.includes(eventType));
    
    for (const webhook of relevantWebhooks) {
      const event: WebhookEvent = {
        id: this.generateId(),
        type: eventType,
        data,
        timestamp: new Date(),
        webhookId: webhook.id,
        status: 'pending',
        attempts: 0
      };
      this.events.set(event.id, event);
      this.sendWebhook(event, webhook);
    }
  }

  private async sendWebhook(event: WebhookEvent, webhook: WebhookConfig): Promise<void> {
    try {
      // Mock webhook sending - replace with actual HTTP request
      await new Promise(resolve => setTimeout(resolve, 100));
      
      event.status = 'sent';
      event.attempts += 1;
      event.lastAttempt = new Date();
      this.events.set(event.id, event);
      this.eventEmitter.emit('webhook.sent', { event, webhook });
      this.logger.log(`Webhook sent successfully: ${webhook.url}`);
    } catch (error) {
      event.status = 'failed';
      event.error = (error as Error).message;
      event.attempts += 1;
      event.lastAttempt = new Date();
      this.events.set(event.id, event);
      this.eventEmitter.emit('webhook.failed', { event, webhook, error });
      this.logger.error(`Webhook failed: ${webhook.url}`, error);
    }
  }

  async getWebhookEvents(webhookId?: string): Promise<WebhookEvent[]> {
    const events = Array.from(this.events.values());
    return webhookId ? events.filter(e => e.webhookId === webhookId) : events;
  }

  async retryFailedWebhooks(): Promise<void> {
    const failedEvents = Array.from(this.events.values())
      .filter(event => event.status === 'failed' && event.attempts < 3);
    
    for (const event of failedEvents) {
      const webhook = this.webhooks.get(event.webhookId);
      if (webhook) {
        event.status = 'retrying';
        this.sendWebhook(event, webhook);
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}