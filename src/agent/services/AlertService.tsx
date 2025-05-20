import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { AlertLevel, AlertPayload, AlertOptions } from '../../types/alert.types.js';

@Injectable()
@WebSocketGateway({ namespace: 'alerts' })
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly subscribers = new Map<string, Set<Socket>>();

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('agent.error', (error) => {
      this.sendAlert({
        level: 'error',
        message: `Agent error: ${error.message}`,
        source: 'agent',
        metadata: error.metadata,
      });
    });

    this.eventEmitter.on('system.warning', (warning) => {
      this.sendAlert({
        level: 'warning',
        message: warning.message,
        source: 'system',
        metadata: warning.metadata,
      });
    });
  }

  async sendAlert(payload: AlertPayload, options: AlertOptions = {}): Promise<void> {
    try {
      await this.validateAlertPayload(payload);
      await this.processAlert(payload, options);
      await this.notifySubscribers(payload);
      
      this.logger.debug(`Alert sent: ${JSON.stringify(payload)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send alert: ${errorMessage}`);
      throw error;
    }
  }

  subscribe(channelId: string, client: Socket): void {
    if (!this.subscribers.has(channelId)) {
      this.subscribers.set(channelId, new Set());
    }
    this.subscribers.get(channelId)?.add(client);
    
    this.logger.debug(`Client ${client.id} subscribed to alerts on channel ${channelId}`);
  }

  unsubscribe(channelId: string, client: Socket): void {
    const subscribers = this.subscribers.get(channelId);
    if (subscribers) {
      subscribers.delete(client);
      if (subscribers.size === 0) {
        this.subscribers.delete(channelId);
      }
      this.logger.debug(`Client ${client.id} unsubscribed from alerts on channel ${channelId}`);
    }
  }

  private async validateAlertPayload(payload: AlertPayload): Promise<void> {
    if (!payload.message) {
      throw new Error('Alert message is required');
    }

    if (!this.isValidAlertLevel(payload.level)) {
      throw new Error(`Invalid alert level: ${payload.level}`);
    }
  }

  private isValidAlertLevel(level: string): level is AlertLevel {
    return ['info', 'warning', 'error', 'critical'].includes(level);
  }

  private async processAlert(
    payload: AlertPayload,
    options: AlertOptions
  ): Promise<void> {
    // Add timestamp if not provided
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    // Apply alert enrichment based on options
    if (options.enrich) {
      await this.enrichAlertPayload(payload);
    }

    // Handle persistence if enabled
    if (options.persist) {
      await this.persistAlert(payload);
    }
  }

  private async notifySubscribers(payload: AlertPayload): Promise<void> {
    const { channel = 'default' } = payload;
    const subscribers = this.subscribers.get(channel);

    if (subscribers) {
      const failedClients: Socket[] = [];

      for (const client of subscribers) {
        try {
          await client.emit('alert', payload);
        } catch (error) {
          failedClients.push(client);
          this.logger.warn(`Failed to send alert to client ${client.id}`);
        }
      }

      // Cleanup failed clients
      failedClients.forEach(client => {
        this.unsubscribe(channel, client);
      });
    }
  }

  private async enrichAlertPayload(payload: AlertPayload): Promise<void> {
    // Add additional context or metadata to the alert
    // This could involve looking up related information
    // or aggregating data from other services
  }

  private async persistAlert(payload: AlertPayload): Promise<void> {
    // Implement alert persistence logic
    // This could involve saving to a database or external service
  }
}
