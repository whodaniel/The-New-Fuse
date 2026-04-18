/**
 * SSE Service - Migrated to Drizzle ORM
 * Handles Server-Sent Events for real-time event streaming
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { Response } from 'express';

interface SSEClient {
  id: string;
  organizationId: string;
  userId?: string;
  response: Response;
  eventTypes: string[];
  filters: Record<string, any>;
  connectedAt: Date;
}

interface SSEEvent {
  type: string;
  data: any;
  id?: string;
  retry?: number;
}

@Injectable()
export class SSEService implements OnModuleDestroy {
  private readonly logger = new Logger(SSEService.name);
  private readonly clients = new Map<string, SSEClient>();
  private readonly heartbeatInterval = 30000;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(private readonly db: DatabaseService) {
    this.startHeartbeatTimer();
  }

  async addClient(client: SSEClient): Promise<void> {
    this.clients.set(client.id, client);

    // Store subscription in database
    try {
      await this.db.webhooks.createSseSubscription({
        organizationId: client.organizationId,
        userId: client.userId,
        eventTypes: client.eventTypes,
        filters: client.filters,
        isActive: true,
      });
    } catch (error) {
      this.logger.error(`Failed to save SSE subscription: ${error}`);
    }

    // Setup connection headers
    client.response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection message
    this.sendEvent(client.response, {
      type: 'connected',
      data: { clientId: client.id, timestamp: new Date().toISOString() },
    });

    this.logger.log(`SSE client connected: ${client.id} (org: ${client.organizationId})`);
  }

  async removeClient(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      this.logger.log(`SSE client disconnected: ${clientId}`);
    }
  }

  async broadcastEvent(
    organizationId: string,
    event: { type: string; payload: any }
  ): Promise<void> {
    const sseEvent: SSEEvent = {
      type: event.type,
      data: event.payload,
      id: Date.now().toString(),
    };

    let sentCount = 0;

    for (const [clientId, client] of this.clients) {
      if (client.organizationId !== organizationId) continue;

      // Check if client should receive this event
      if (client.eventTypes.length > 0 && !client.eventTypes.includes(event.type)) {
        continue;
      }

      try {
        this.sendEvent(client.response, sseEvent);
        sentCount++;
      } catch (error) {
        this.logger.error(`Failed to send event to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }

    if (sentCount > 0) {
      this.logger.debug(
        `Broadcast event "${event.type}" to ${sentCount} clients in org ${organizationId}`
      );
    }
  }

  async sendToClient(clientId: string, event: SSEEvent): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    try {
      this.sendEvent(client.response, event);
    } catch (error) {
      this.logger.error(`Failed to send event to client ${clientId}:`, error);
      this.clients.delete(clientId);
      throw error;
    }
  }

  async sendHeartbeat(): Promise<void> {
    const heartbeatEvent: SSEEvent = {
      type: 'heartbeat',
      data: { timestamp: new Date().toISOString() },
    };

    for (const [clientId, client] of this.clients) {
      try {
        this.sendEvent(client.response, heartbeatEvent);
      } catch (error) {
        this.logger.error(`Heartbeat failed for client ${clientId}, removing`);
        this.clients.delete(clientId);
      }
    }
  }

  async sendCustomEvent(
    organizationId: string,
    eventType: string,
    data: any,
    filters?: Record<string, any>
  ): Promise<void> {
    const sseEvent: SSEEvent = {
      type: eventType,
      data,
      id: Date.now().toString(),
    };

    for (const [clientId, client] of this.clients) {
      if (client.organizationId !== organizationId) continue;

      // Check event type filter
      if (client.eventTypes.length > 0 && !client.eventTypes.includes(eventType)) {
        continue;
      }

      // Check custom filters
      if (filters && Object.keys(client.filters).length > 0) {
        if (!this.matchesFilters(data, client.filters)) {
          continue;
        }
      }

      try {
        this.sendEvent(client.response, sseEvent);
      } catch (error) {
        this.logger.error(`Failed to send custom event to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  getConnectedClients(): {
    total: number;
    byOrganization: Record<string, number>;
    byUser: Record<string, number>;
  } {
    const byOrganization: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    for (const [, client] of this.clients) {
      byOrganization[client.organizationId] = (byOrganization[client.organizationId] || 0) + 1;
      if (client.userId) {
        byUser[client.userId] = (byUser[client.userId] || 0) + 1;
      }
    }

    return {
      total: this.clients.size,
      byOrganization,
      byUser,
    };
  }

  async getSubscriptionStats(organizationId: string): Promise<{
    activeConnections: number;
    totalSubscriptions: number;
    subscriptionsByType: Record<string, number>;
  }> {
    let activeConnections = 0;
    const subscriptionsByType: Record<string, number> = {};

    for (const [, client] of this.clients) {
      if (client.organizationId === organizationId) {
        activeConnections++;
        for (const eventType of client.eventTypes) {
          subscriptionsByType[eventType] = (subscriptionsByType[eventType] || 0) + 1;
        }
      }
    }

    // Get total subscriptions from database
    const subscriptions = await this.db.webhooks.findSseSubscriptionsByOrganization(organizationId);

    return {
      activeConnections,
      totalSubscriptions: subscriptions.length,
      subscriptionsByType,
    };
  }

  private sendEvent(response: Response, event: SSEEvent): void {
    const lines: string[] = [];

    if (event.id) {
      lines.push(`id: ${event.id}`);
    }
    if (event.type) {
      lines.push(`event: ${event.type}`);
    }
    if (event.retry) {
      lines.push(`retry: ${event.retry}`);
    }

    lines.push(`data: ${JSON.stringify(event.data)}`);
    lines.push('');
    lines.push('');

    response.write(lines.join('\n'));
  }

  private matchesFilters(eventData: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (eventData[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private startHeartbeatTimer(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat().catch((error) => {
        this.logger.error('Heartbeat error:', error);
      });
      this.cleanupStaleClients().catch((error) => {
        this.logger.error('Cleanup error:', error);
      });
    }, this.heartbeatInterval);
  }

  private async cleanupStaleClients(): Promise<void> {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    for (const [clientId, client] of this.clients) {
      if (now - client.connectedAt.getTime() > staleThreshold) {
        try {
          // Try to send a test event
          this.sendEvent(client.response, { type: 'ping', data: {} });
        } catch {
          this.logger.log(`Removing stale client: ${clientId}`);
          this.clients.delete(clientId);
        }
      }
    }
  }

  onModuleDestroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all connections
    for (const [clientId, client] of this.clients) {
      try {
        this.sendEvent(client.response, {
          type: 'disconnect',
          data: { reason: 'Server shutting down' },
        });
        client.response.end();
      } catch {
        // Ignore errors during shutdown
      }
    }

    this.clients.clear();
    this.logger.log('SSE service destroyed');
  }
}
