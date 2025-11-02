import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// Interface from Incoming change
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
  private readonly logger = new Logger(ComponentAnalysisNotifier.name); // From Current
  private webhooks: string[] = []; // From Incoming

  constructor(
    private readonly eventEmitter: EventEmitter2, // From Current
    private readonly httpService: HttpService, // Added to make webhooks work
  ) {}

  // From Incoming
  registerWebhook(url: string): void {
    if (!this.webhooks.includes(url)) {
      this.webhooks.push(url);
      this.logger.log(`Registered new webhook: ${url}`);
    }
  }

  // Merged notify method
  async notify(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `Notifying component analysis ${payload.status} for ${payload.componentId}`,
    );

    // 1. Emit internal event (from Current change)
    this.eventEmitter.emit('component.analysis', payload);

    // 2. Send external webhooks (from Incoming change)
    if (this.webhooks.length > 0) {
      this.logger.log(`Sending ${this.webhooks.length} webhook(s)...`);
      const promises = this.webhooks.map((url) =>
        this.sendWebhook(url, payload),
      );
      await Promise.allSettled(promises);
    }
  }

  private async sendWebhook(
    url: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      // Use HttpService to POST the payload
      await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000, // 5 second timeout
        }),
      );
      this.logger.log(`Successfully sent webhook to ${url}`);
    } catch (error) {
      this.logger.error(
        `Failed to send webhook to ${url}: ${error.message}`,
        error.stack,
      );
    }
  }
}