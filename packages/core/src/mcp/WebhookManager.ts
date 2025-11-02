import { Injectable, Logger, HttpService } from '@nestjs/common';
import { createHmac } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[]; // e.g., ['task.completed', 'pipeline.failed']
}

@Injectable()
export class WebhookManager {
  private readonly logger = new Logger(WebhookManager.name);
  private webhooks: Webhook[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // in ms

  constructor(private readonly httpService: HttpService) {}

  registerWebhook(url: string, secret: string, events: string[]): Webhook {
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid webhook URL');
    }

    const newWebhook: Webhook = { id: uuidv4(), url, secret, events };
    this.webhooks.push(newWebhook);
    this.logger.log(`Registered new webhook for URL: ${url} and events: ${events.join(', ')}`);
    return newWebhook;
  }

  unregisterWebhook(id: string): boolean {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index !== -1) {
      this.webhooks.splice(index, 1);
      this.logger.log(`Unregistered webhook with ID: ${id}`);
      return true;
    }
    return false;
  }

  async dispatch(eventType: string, payload: any): Promise<void> {
    const relevantWebhooks = this.webhooks.filter(
      webhook => webhook.events.includes(eventType) || webhook.events.includes('*'),
    );

    this.logger.log(`Dispatching event '${eventType}' to ${relevantWebhooks.length} webhooks.`);

    for (const webhook of relevantWebhooks) {
      this.sendWebhook(webhook, eventType, payload).catch(error => {
        this.logger.error(`Failed to send webhook to ${webhook.url} for event ${eventType}`, error.stack);
      });
    }
  }

  private async sendWebhook(webhook: Webhook, eventType: string, payload: any, attempt: number = 1): Promise<void> {
    const signature = this.generateSignature(payload, webhook.secret);
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': eventType,
      'X-Webhook-Signature': signature,
    };

    try {
      this.logger.debug(`Sending webhook to ${webhook.url} (Attempt ${attempt})`);
      await firstValueFrom(
        this.httpService.post(webhook.url, payload, { headers })
      );
      this.logger.log(`Successfully sent webhook to ${webhook.url} for event ${eventType}`);
    } catch (error) {
      this.logger.warn(`Attempt ${attempt} failed for webhook to ${webhook.url}. Error: ${error.message}`);
      if (attempt < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        return this.sendWebhook(webhook, eventType, payload, attempt + 1);
      } else {
        throw new Error(`Failed to send webhook to ${webhook.url} after ${this.MAX_RETRIES} attempts.`);
      }
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const hmac = createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}
