import { v4 as uuidv4 } from 'uuid';

import { BaseService } from '../core/BaseService';
import { Logger } from '../types/core';

export interface AlertPayload {
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source?: string;
  details?: Record<string, unknown>;
}

export interface Alert extends AlertPayload {
  id: string;
  timestamp: Date;
}

export interface AlertChannel {
  send(alert: Alert): Promise<void>;
}

export class AlertService extends BaseService {
  private channels: AlertChannel[] = [];
  private logger: Logger;

  constructor() {
    super({ name: 'AlertService' });
    this.logger = new Logger('AlertService');
    this.registerChannel(new ConsoleAlertChannel());
    this.logger.info('AlertService initialized.');
  }

  registerChannel(channel: AlertChannel) {
    this.channels.push(channel);
    this.logger.info(`Registered alert channel: ${channel.constructor.name}`);
  }

  async dispatchAlert(payload: AlertPayload): Promise<void> {
    const alert: Alert = {
      ...payload,
      id: uuidv4(),
      timestamp: new Date(),
    };

    if (alert.severity === 'info') {
      this.logger.info(`Dispatching alert: ${alert.message}`);
    } else if (alert.severity === 'warning') {
      this.logger.warn(`Dispatching alert: ${alert.message}`);
    } else {
      this.logger.error(`Dispatching alert: ${alert.message}`);
    }

    const dispatchPromises = this.channels.map((channel) =>
      channel.send(alert).catch((error) => {
        this.logger.error(`Failed to send alert via ${channel.constructor.name}: ${error.message}`);
      })
    );

    await Promise.all(dispatchPromises);
  }

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

export class ConsoleAlertChannel implements AlertChannel {
  private readonly logger = new Logger(ConsoleAlertChannel.name);

  async send(alert: Alert): Promise<void> {
    const logMessage = `[${alert.severity.toUpperCase()}] - ${alert.message} - Source: ${alert.source || 'Unknown'}`;
    this.logger.log(logMessage, alert.details);
  }
}
