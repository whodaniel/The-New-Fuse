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
exports.WebhookManagerService = void 0;
const common_1 = require("@nestjs/common");
const LoggingService_1 = require("./LoggingService");
let WebhookManagerService = class WebhookManagerService {
    logger;
    webhooks = new Map();
    events = new Map();
    processing_queue = [];
    processing_interval;
    response_times = [];
    constructor(logger) {
        this.logger = logger;
        this.logger.log('WebhookManagerService initialized', 'WebhookManagerService');
        this.startEventProcessor();
    }
    async createWebhook(config) {
        const webhook = {
            id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
      name: config.name,
      url: config.url,
      method: config.method || 'POST',
      headers: config.headers || {},
      events: config.events,
      status: 'active',
      secret: config.secret,
      timeout: config.timeout || 30000,
      retry_attempts: config.retry_attempts || 3,
      retry_delay: config.retry_delay || 1000,
      created_at: new Date(),
      updated_at: new Date(),
      success_count: 0,
      failure_count: 0
    };

    this.webhooks.set(webhook.id, webhook);`,
            this: .logger.log(Webhook, created, $, { config, : .name } ` (${webhook.id}`), 'WebhookManagerService': 
        };
        return webhook.id;
    }
    async updateWebhook(id, updates) {
        const webhook = this.webhooks.get(id);
        if (!webhook) {
            return false;
        }
        Object.assign(webhook, updates, { updated_at: new Date() });
        this.logger.log(Webhook, updated, $, { webhook, : .name }($, { id }), 'WebhookManagerService');
        return true;
    }
    async deleteWebhook(id) {
        const webhook = this.webhooks.get(id);
        if (!webhook) {
            return false;
        }
        this.webhooks.delete(id);
        // Cancel pending events for this webhook
        const pending_events = Array.from(this.events.values())
            .filter(event => event.webhook_id === id && event.status === 'pending');
        pending_events.forEach(event => {
            event.status = 'failed';
            event.error_message = 'Webhook deleted';
        });
        `
    this.logger.log(`;
        Webhook;
        deleted: $;
        {
            webhook.name;
        }
        ($);
        {
            id;
        }
        `, 'WebhookManagerService');
    
    return true;
  }

  async getWebhook(id: string): Promise<WebhookConfig | null> {
    return this.webhooks.get(id) || null;
  }

  async getWebhooks(filter: {
    status?: WebhookConfig['status'];
    event_type?: string;
  } = {}): Promise<WebhookConfig[]> {
    let webhooks = Array.from(this.webhooks.values());

    if (filter.status) {
      webhooks = webhooks.filter(w => w.status === filter.status);
    }
    if (filter.event_type) {
      webhooks = webhooks.filter(w => w.events.includes(filter.event_type!));
    }

    return webhooks.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  async triggerEvent(event_type: string, payload: any): Promise<string[]> {
    const matching_webhooks = Array.from(this.webhooks.values())
      .filter(webhook => webhook.status === 'active' && webhook.events.includes(event_type));

    const event_ids: string[] = [];

    for (const webhook of matching_webhooks) {
      const event: WebhookEvent = {
        id: event_${Date.now()}_${Math.random().toString(36).substr(2, 9)},
        webhook_id: webhook.id,
        event_type,
        payload,
        status: 'pending',
        created_at: new Date(),
        retry_count: 0
      };

      this.events.set(event.id, event);
      this.processing_queue.push(event);
      event_ids.push(event.id);

      webhook.last_triggered = new Date();
    }
`;
        this.logger.log(Event, triggered, $, { event_type }($, { event_ids, : .length } ` webhooks)`, 'WebhookManagerService'));
        return event_ids;
    }
    async getEvent(id) {
        return this.events.get(id) || null;
    }
    async getEvents(filter = {}) {
        let events = Array.from(this.events.values());
        if (filter.webhook_id) {
            events = events.filter(e => e.webhook_id === filter.webhook_id);
        }
        if (filter.event_type) {
            events = events.filter(e => e.event_type === filter.event_type);
        }
        if (filter.status) {
            events = events.filter(e => e.status === filter.status);
        }
        if (filter.since) {
            events = events.filter(e => e.created_at >= filter.since);
        }
        events.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        return events.slice(0, filter.limit || 100);
    }
    async retryEvent(id) {
        const event = this.events.get(id);
        const webhook = event ? this.webhooks.get(event.webhook_id) : null;
        if (!event || !webhook || event.status !== 'failed') {
            return false;
        }
        if (event.retry_count >= webhook.retry_attempts) {
            this.logger.warn(Event, retry, limit, exceeded, $, { id }, 'WebhookManagerService');
            return false;
        }
        event.status = 'retrying';
        event.retry_count++;
        this.processing_queue.push(event);
        `
    this.logger.log(Event retry queued: ${id}`(attempt, $, { event, : .retry_count }) `, 'WebhookManagerService');
    
    return true;
  }

  async getStats(): Promise<WebhookStats> {
    const webhooks = Array.from(this.webhooks.values());
    const events = Array.from(this.events.values());
    
    const delivered_events = events.filter(e => e.status === 'delivered');
    const average_response_time = this.response_times.length > 0 ?
      this.response_times.reduce((a, b) => a + b, 0) / this.response_times.length : 0;

    return {
      total_webhooks: webhooks.length,
      active_webhooks: webhooks.filter(w => w.status === 'active').length,
      total_events: events.length,
      pending_events: events.filter(e => e.status === 'pending' || e.status === 'retrying').length,
      delivered_events: delivered_events.length,
      failed_events: events.filter(e => e.status === 'failed').length,
      average_response_time,
      success_rate: events.length > 0 ? delivered_events.length / events.length : 0
    };
  }

  async testWebhook(id: string): Promise<{
    success: boolean;
    response_status?: number;
    response_time: number;
    error?: string;
  }> {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return { success: false, response_time: 0, error: 'Webhook not found' };
    }

    const start_time = Date.now();
    
    try {
      // Simulate webhook test
      const response_time = Math.random() * 1000 + 100; // Random 100-1100ms
      const success = Math.random() > 0.1; // 90% success rate for testing
      
      await new Promise(resolve => setTimeout(resolve, response_time));
      
      if (success) {
        return {
          success: true,
          response_status: 200,
          response_time: Date.now() - start_time
        };
      } else {
        return {
          success: false,
          response_status: 500,
          response_time: Date.now() - start_time,
          error: 'Internal Server Error'
        };
      }
    } catch (error) {
      return {
        success: false,
        response_time: Date.now() - start_time,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private startEventProcessor(): void {
    this.processing_interval = setInterval(() => {
      this.processEvents();
    }, 1000);
  }

  private async processEvents(): Promise<void> {
    const events_to_process = this.processing_queue.splice(0, 10); // Process up to 10 events per cycle
    
    for (const event of events_to_process) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    const webhook = this.webhooks.get(event.webhook_id);
    if (!webhook) {
      event.status = 'failed';
      event.error_message = 'Webhook not found';
      return;
    }

    if (webhook.status !== 'active') {
      event.status = 'failed';
      event.error_message = 'Webhook is inactive';
      return;
    }

    const start_time = Date.now();
    
    try {
      event.status = 'sent';
      event.sent_at = new Date();
      
      // Simulate webhook delivery
      const delivery_time = Math.random() * webhook.timeout; // Random delivery time up to timeout
      const success = Math.random() > 0.05; // 95% success rate
      
      await new Promise(resolve => setTimeout(resolve, Math.min(delivery_time, 1000))); // Cap simulation at 1s
      
      if (success) {
        event.status = 'delivered';
        event.delivered_at = new Date();
        event.response_status = 200;
        event.response_body = 'OK';
        
        webhook.success_count++;
        
        const response_time = Date.now() - start_time;
        this.response_times.push(response_time);
        
        // Keep only recent response times
        if (this.response_times.length > 1000) {
          this.response_times.shift();
        }
        
        this.logger.debug(Webhook event delivered: ${event.id}, 'WebhookManagerService');
      } else {
        throw new Error('Webhook endpoint returned error');
      }
      
    } catch (error) {
      event.status = 'failed';
      event.error_message = error instanceof Error ? error.message : String(error);
      event.response_status = 500;
      
      webhook.failure_count++;
      
      // Queue for retry if within limits
      if (event.retry_count < webhook.retry_attempts) {
        setTimeout(() => {
          if (event.status === 'failed') { // Check if still failed
            this.retryEvent(event.id);
          }
        }, webhook.retry_delay * Math.pow(2, event.retry_count)); // Exponential backoff
      }
      `;
        this.logger.error(`
        `, Webhook, event, failed, $, { event, : .id } `,
        error instanceof Error ? error : new Error(String(error)),
        'WebhookManagerService'
      );
    }
  }

  async destroy(): Promise<void> {
    if (this.processing_interval) {
      clearInterval(this.processing_interval);
    }
    this.logger.log('WebhookManagerService destroyed', 'WebhookManagerService');
  }
}

export default WebhookManagerService;);
    }
};
exports.WebhookManagerService = WebhookManagerService;
exports.WebhookManagerService = WebhookManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService])
], WebhookManagerService);
//# sourceMappingURL=WebhookManagerService.js.map