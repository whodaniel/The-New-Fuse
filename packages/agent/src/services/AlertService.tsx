import { BaseService } from '../core/BaseService.js'; // Corrected import path assuming BaseService is in core
import { Logger } from '@packages/utils'; // Assuming Logger is available

// TODO: Define specific alert types/interfaces if needed
export interface AlertPayload {
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source?: string; // e.g., 'AgentX', 'TaskProcessor'
  details?: Record<string, unknown>;
}

export interface AlertChannel {
  send(payload: AlertPayload): Promise<void>;
}

/**
 * Service responsible for handling and dispatching alerts.
 */
export class AlertService extends BaseService {
  private channels: AlertChannel[] = [];
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('AlertService');
    // TODO: Initialize alert channels (e.g., email, Slack, PagerDuty) based on config
    this.logger.info('AlertService initialized.');
  }

  registerChannel(channel: AlertChannel) {
    this.channels.push(channel);
    this.logger.info(`Registered alert channel: ${channel.constructor.name}`);
  }

  async dispatchAlert(payload: AlertPayload): Promise<void> {
    this.logger.log(
      payload.severity === 'info' ? 'info' :
      payload.severity === 'warning' ? 'warn' : 'error',
      `Dispatching alert: ${payload.message}`,
      { source: payload.source, details: payload.details }
    );

    const dispatchPromises = this.channels.map(channel =>
      channel.send(payload).catch(error => {
        this.logger.error(`Failed to send alert via ${channel.constructor.name}: ${error.message}`, error);
        // Optionally, implement retry logic or fallback channels
      })
    );

    await Promise.all(dispatchPromises);
  }

  // Example usage methods
  info(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'info', message, source, details });
  }

  warn(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'warning', message, source, details });
  }

  error(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'error', message, source, details });
  }

  critical(message: string, source?: string, details?: Record<string, unknown>): Promise<void> {
    return this.dispatchAlert({ severity: 'critical', message, source, details });
  }
}

// Example simple console alert channel
export class ConsoleAlertChannel implements AlertChannel {
  async send(payload: AlertPayload): Promise<void> {
    console.log(`[ALERT][${payload.severity.toUpperCase()}]${payload.source ? `[${payload.source}]` : ''}: ${payload.message}`, payload.details || '');
  }
}
