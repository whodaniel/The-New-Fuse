import { Injectable } from '@nestjs/common';

export interface NotificationPayload {
  componentId: string;
  analysisType: string;
  status: 'started' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class ComponentAnalysisNotifier {
  private webhooks: string[] = [];

  registerWebhook(url: string): void {
    if (!this.webhooks.includes(url)) {
      this.webhooks.push(url);
    }
  }

  unregisterWebhook(url: string): void {
    const index = this.webhooks.indexOf(url);
    if (index > -1) {
      this.webhooks.splice(index, 1);
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const promises = this.webhooks.map(webhook =>
      this.sendNotification(webhook, payload)
    );

    await Promise.allSettled(promises);
  }

  private async sendNotification(webhook: string, payload: NotificationPayload): Promise<void> {
    try {
      // Stub implementation - would normally use HTTP client
      console.log(`Sending notification to ${webhook}:`, payload);
    } catch (error) {
      console.error(`Failed to send notification to ${webhook}:`, error);
    }
  }

  getWebhooks(): string[] {
    return [...this.webhooks];
  }
}
