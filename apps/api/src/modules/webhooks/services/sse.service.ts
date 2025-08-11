import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import {
  SSEClient,
  SSEEvent,
  BusinessEvent,
  EventSubscription,
} from '@the-new-fuse/types';
import { SseSubscription } from '../entities/sse-subscription.entity';

@Injectable()
export class SSEService {
  private readonly logger = new Logger(SSEService.name);
  private readonly clients = new Map<string, SSEClient>();
  private readonly heartbeatInterval = 30000; // 30 seconds
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(SseSubscription)
    private readonly sseSubscriptionRepo: Repository<SseSubscription>,
  ) {
    this.startHeartbeatTimer();
  }

  async addClient(client: SSEClient): Promise<void> {
    try {
      // Store client in memory
      this.clients.set(client.id, client);

      // Store subscription in database
      const subscription = this.sseSubscriptionRepo.create({
        clientId: client.id,
        userId: client.userId,
        organizationId: client.organizationId,
        eventTypes: client.subscriptions.flatMap(sub => sub.eventTypes),
        filters: client.subscriptions.reduce((acc, sub) => ({ ...acc, ...sub.filters }), {}),
      });

      await this.sseSubscriptionRepo.save(subscription);

      this.logger.log(`SSE client connected: ${client.id} (user: ${client.userId})`);

      // Send welcome message
      await this.sendToClient(client.id, {
        type: 'welcome',
        data: {
          clientId: client.id,
          timestamp: new Date().toISOString(),
          subscriptions: client.subscriptions,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to add SSE client ${client.id}`, error);
      throw error;
    }
  }

  async removeClient(clientId: string): Promise<void> {
    try {
      // Remove from memory
      this.clients.delete(clientId);

      // Remove from database
      await this.sseSubscriptionRepo.delete({ clientId });

      this.logger.log(`SSE client disconnected: ${clientId}`);
    } catch (error) {
      this.logger.error(`Failed to remove SSE client ${clientId}`, error);
    }
  }

  async broadcastEvent(event: BusinessEvent): Promise<void> {
    try {
      const eventMessage: SSEEvent = {
        type: 'business_event',
        data: {
          id: event.id,
          type: event.type,
          source: event.source,
          timestamp: event.timestamp,
          organizationId: event.metadata.organization_id,
          data: event.data,
        },
      };

      // Get all clients that should receive this event
      const targetClients = Array.from(this.clients.values()).filter(client => 
        this.shouldReceiveEvent(client, event)
      );

      // Send to all matching clients
      const sendPromises = targetClients.map(client => 
        this.sendToClient(client.id, eventMessage)
      );

      await Promise.allSettled(sendPromises);

      this.logger.debug(`Event broadcasted to ${targetClients.length} clients: ${event.id}`);
    } catch (error) {
      this.logger.error('Failed to broadcast event', error);
    }
  }

  async sendToClient(clientId: string, event: SSEEvent): Promise<void> {
    try {
      const client = this.clients.get(clientId);
      if (!client) {
        this.logger.warn(`Client not found: ${clientId}`);
        return;
      }

      const eventData = JSON.stringify(event);
      (client.response as any).write(`data: ${eventData}\n\n`);

      // Update last heartbeat
      client.lastHeartbeat = new Date();
    } catch (error) {
      this.logger.error(`Failed to send event to client ${clientId}`, error);
      // Remove client if connection is broken
      await this.removeClient(clientId);
    }
  }

  async sendHeartbeat(): Promise<void> {
    const heartbeatEvent: SSEEvent = {
      type: 'heartbeat',
      data: { timestamp: new Date().toISOString() },
    };

    const clients = Array.from(this.clients.keys());
    const sendPromises = clients.map(clientId => 
      this.sendToClient(clientId, heartbeatEvent)
    );

    await Promise.allSettled(sendPromises);
  }

  async sendCustomEvent(
    organizationId: string,
    eventType: string,
    data: any,
    filters?: Record<string, any>,
  ): Promise<void> {
    try {
      const customEvent: SSEEvent = {
        type: eventType,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          organizationId,
        },
      };

      // Get matching clients
      const targetClients = Array.from(this.clients.values()).filter(client => {
        if (client.organizationId !== organizationId) {
          return false;
        }

        // Check if client is subscribed to this event type
        const hasSubscription = client.subscriptions.some(sub => 
          sub.eventTypes.includes(eventType as any) || sub.eventTypes.length === 0
        );

        if (!hasSubscription) {
          return false;
        }

        // Check filters if provided
        if (filters && Object.keys(filters).length > 0) {
          return client.subscriptions.some(sub => 
            this.matchesFilters(filters, sub.filters || {})
          );
        }

        return true;
      });

      // Send to matching clients
      const sendPromises = targetClients.map(client => 
        this.sendToClient(client.id, customEvent)
      );

      await Promise.allSettled(sendPromises);

      this.logger.debug(`Custom event sent to ${targetClients.length} clients: ${eventType}`);
    } catch (error) {
      this.logger.error('Failed to send custom event', error);
    }
  }

  getConnectedClients(): {
    total: number;
    byOrganization: Record<string, number>;
    byUser: Record<string, number>;
  } {
    const clients = Array.from(this.clients.values());
    
    const byOrganization: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    clients.forEach(client => {
      byOrganization[client.organizationId] = (byOrganization[client.organizationId] || 0) + 1;
      byUser[client.userId] = (byUser[client.userId] || 0) + 1;
    });

    return {
      total: clients.length,
      byOrganization,
      byUser,
    };
  }

  async getSubscriptionStats(organizationId: string): Promise<{
    activeConnections: number;
    totalSubscriptions: number;
    subscriptionsByType: Record<string, number>;
  }> {
    const activeConnections = Array.from(this.clients.values())
      .filter(client => client.organizationId === organizationId).length;

    const subscriptions = await this.sseSubscriptionRepo.find({
      where: { organizationId },
    });

    const subscriptionsByType: Record<string, number> = {};
    
    subscriptions.forEach(sub => {
      sub.eventTypes.forEach(type => {
        subscriptionsByType[type] = (subscriptionsByType[type] || 0) + 1;
      });
    });

    return {
      activeConnections,
      totalSubscriptions: subscriptions.length,
      subscriptionsByType,
    };
  }

  private shouldReceiveEvent(client: SSEClient, event: BusinessEvent): boolean {
    // Check organization match
    if (client.organizationId !== event.metadata.organization_id) {
      return false;
    }

    // Check if client has any subscriptions for this event type
    return client.subscriptions.some(subscription => {
      // If no specific event types, receive all
      if (subscription.eventTypes.length === 0) {
        return true;
      }

      // Check if subscribed to this event type
      if (!subscription.eventTypes.includes(event.type)) {
        return false;
      }

      // Check filters if any
      if (subscription.filters && Object.keys(subscription.filters).length > 0) {
        return this.matchesFilters(event.data, subscription.filters);
      }

      return true;
    });
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
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.sendHeartbeat();
        await this.cleanupStaleClients();
      } catch (error) {
        this.logger.error('Heartbeat timer error', error);
      }
    }, this.heartbeatInterval);
  }

  private async cleanupStaleClients(): Promise<void> {
    const now = new Date();
    const staleThreshold = 60000; // 1 minute

    const staleClients = Array.from(this.clients.entries()).filter(([_, client]) => {
      const timeSinceLastHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
      return timeSinceLastHeartbeat > staleThreshold;
    });

    for (const [clientId] of staleClients) {
      this.logger.warn(`Removing stale SSE client: ${clientId}`);
      await this.removeClient(clientId);
    }

    if (staleClients.length > 0) {
      this.logger.log(`Cleaned up ${staleClients.length} stale SSE clients`);
    }
  }

  onModuleDestroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer as NodeJS.Timeout);
    }
    
    // Close all client connections
    for (const client of this.clients.values()) {
      try {
        (client.response as any).end();
      } catch (error) {
        this.logger.error('Error closing SSE client connection', error);
      }
    }
    
    this.clients.clear();
    this.logger.log('SSE service shutdown complete');
  }
}