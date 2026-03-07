/**
 * Server-Sent Events (SSE) Broadcaster
 * Handles real-time streaming of business events to connected clients
 */

import type { Env } from '../types/env';
import type { BusinessEvent } from '../types/business-events';
import { Logger } from '../utils/Logger';

interface SSEConnection {
  id: string;
  organizationId: string;
  userId?: string;
  subscriptions: string[];
  lastActivity: Date;
  connectionTime: Date;
}

interface SSEMessage {
  id: string;
  event: string;
  data: any;
  timestamp: string;
}

export class SSEBroadcaster {
  constructor(private env: Env, private logger: Logger) {}

  async broadcastEvent(businessEvent: BusinessEvent): Promise<void> {
    try {
      this.logger.info(`Broadcasting SSE event: ${businessEvent.type}`, {
        eventId: businessEvent.id,
        source: businessEvent.source,
        organizationId: businessEvent.metadata.organization_id
      });

      // Get active connections for the organization
      const connections = await this.getActiveConnections(businessEvent.metadata.organization_id);
      
      if (connections.length === 0) {
        this.logger.debug('No active SSE connections found for organization', {
          organizationId: businessEvent.metadata.organization_id
        });
        return;
      }

      // Create SSE message
      const sseMessage = this.createSSEMessage(businessEvent);

      // Broadcast to all relevant connections
      const broadcastPromises = connections
        .filter(conn => this.shouldSendToConnection(conn, businessEvent))
        .map(conn => this.sendToConnection(conn, sseMessage));

      await Promise.allSettled(broadcastPromises);

      // Store event in Redis for replay functionality
      await this.storeEventForReplay(businessEvent);

      this.logger.info(`Successfully broadcasted to ${broadcastPromises.length} SSE connections`);

    } catch (error) {
      this.logger.error('Failed to broadcast SSE event:', error, {
        eventId: businessEvent.id,
        eventType: businessEvent.type
      });
    }
  }

  private async getActiveConnections(organizationId: string): Promise<SSEConnection[]> {
    try {
      // In a real implementation, this would query Redis or a database
      // For now, we'll simulate getting connections from KV storage
      const connectionsKey = `sse_connections:${organizationId}`;
      const connectionsData = await this.env.KV.get(connectionsKey);
      
      if (!connectionsData) return [];

      const connections: SSEConnection[] = JSON.parse(connectionsData);
      
      // Filter out expired connections (older than 1 hour)
      const now = new Date();
      const activeConnections = connections.filter(conn => {
        const timeDiff = now.getTime() - new Date(conn.lastActivity).getTime();
        return timeDiff < 3600000; // 1 hour
      });

      // Update the stored connections if we filtered any out
      if (activeConnections.length !== connections.length) {
        await this.env.KV.put(connectionsKey, JSON.stringify(activeConnections));
      }

      return activeConnections;

    } catch (error) {
      this.logger.error('Failed to get active SSE connections:', error);
      return [];
    }
  }

  private createSSEMessage(businessEvent: BusinessEvent): SSEMessage {
    return {
      id: businessEvent.id,
      event: businessEvent.type,
      data: {
        id: businessEvent.id,
        type: businessEvent.type,
        source: businessEvent.source,
        timestamp: businessEvent.timestamp,
        data: businessEvent.data,
        metadata: {
          priority: businessEvent.metadata.priority,
          organization_id: businessEvent.metadata.organization_id
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  private shouldSendToConnection(connection: SSEConnection, businessEvent: BusinessEvent): boolean {
    // Check if connection is subscribed to this event type
    if (connection.subscriptions.length > 0) {
      const isSubscribed = connection.subscriptions.some(subscription => {
        // Support wildcard subscriptions
        if (subscription === '*') return true;
        if (subscription === businessEvent.type) return true;
        if (subscription === businessEvent.source) return true;
        
        // Support pattern matching (e.g., "payment_*")
        if (subscription.includes('*')) {
          const pattern = subscription.replace('*', '.*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(businessEvent.type) || regex.test(businessEvent.source);
        }
        
        return false;
      });
      
      if (!isSubscribed) return false;
    }

    // Check organization access
    if (connection.organizationId !== businessEvent.metadata.organization_id) {
      return false;
    }

    return true;
  }

  private async sendToConnection(connection: SSEConnection, message: SSEMessage): Promise<void> {
    try {
      // In a real implementation, this would send via WebSocket or SSE endpoint
      // For this example, we'll store the message in Redis for the connection to pick up
      const messageKey = `sse_message:${connection.id}:${message.id}`;
      
      await this.env.KV.put(messageKey, JSON.stringify(message), {
        expirationTtl: 300 // 5 minutes
      });

      // Notify via Redis pub/sub if available
      if (this.env.SSE_REDIS_CHANNEL) {
        const notificationMessage = {
          connectionId: connection.id,
          messageId: message.id,
          event: message.event
        };

        // In a real implementation, you'd publish to Redis
        // await redis.publish(this.env.SSE_REDIS_CHANNEL, JSON.stringify(notificationMessage));
      }

      this.logger.sseMessage(connection.id, message.event, JSON.stringify(message).length);

    } catch (error) {
      this.logger.error(`Failed to send SSE message to connection ${connection.id}:`, error);
    }
  }

  private async storeEventForReplay(businessEvent: BusinessEvent): Promise<void> {
    try {
      // Store recent events for replay when clients reconnect
      const replayKey = `sse_replay:${businessEvent.metadata.organization_id}`;
      const replayData = await this.env.KV.get(replayKey);
      
      let events: BusinessEvent[] = replayData ? JSON.parse(replayData) : [];
      
      // Add new event
      events.push(businessEvent);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events = events.slice(-100);
      }
      
      await this.env.KV.put(replayKey, JSON.stringify(events), {
        expirationTtl: 86400 // 24 hours
      });

    } catch (error) {
      this.logger.error('Failed to store event for replay:', error);
    }
  }

  // Connection management methods
  async registerConnection(
    connectionId: string, 
    organizationId: string, 
    userId?: string, 
    subscriptions: string[] = ['*']
  ): Promise<void> {
    try {
      const connection: SSEConnection = {
        id: connectionId,
        organizationId,
        userId,
        subscriptions,
        lastActivity: new Date(),
        connectionTime: new Date()
      };

      const connectionsKey = `sse_connections:${organizationId}`;
      const connectionsData = await this.env.KV.get(connectionsKey);
      const connections: SSEConnection[] = connectionsData ? JSON.parse(connectionsData) : [];
      
      // Remove existing connection with same ID
      const filteredConnections = connections.filter(conn => conn.id !== connectionId);
      filteredConnections.push(connection);

      await this.env.KV.put(connectionsKey, JSON.stringify(filteredConnections));

      this.logger.info('SSE connection registered', {
        connectionId,
        organizationId,
        userId,
        subscriptions
      });

      // Send recent events to new connection
      await this.sendReplayEvents(connection);

    } catch (error) {
      this.logger.error('Failed to register SSE connection:', error);
    }
  }

  async unregisterConnection(connectionId: string, organizationId: string): Promise<void> {
    try {
      const connectionsKey = `sse_connections:${organizationId}`;
      const connectionsData = await this.env.KV.get(connectionsKey);
      
      if (!connectionsData) return;

      const connections: SSEConnection[] = JSON.parse(connectionsData);
      const filteredConnections = connections.filter(conn => conn.id !== connectionId);

      if (filteredConnections.length !== connections.length) {
        await this.env.KV.put(connectionsKey, JSON.stringify(filteredConnections));
        
        this.logger.info('SSE connection unregistered', {
          connectionId,
          organizationId
        });
      }

    } catch (error) {
      this.logger.error('Failed to unregister SSE connection:', error);
    }
  }

  async updateConnectionActivity(connectionId: string, organizationId: string): Promise<void> {
    try {
      const connectionsKey = `sse_connections:${organizationId}`;
      const connectionsData = await this.env.KV.get(connectionsKey);
      
      if (!connectionsData) return;

      const connections: SSEConnection[] = JSON.parse(connectionsData);
      const connection = connections.find(conn => conn.id === connectionId);
      
      if (connection) {
        connection.lastActivity = new Date();
        await this.env.KV.put(connectionsKey, JSON.stringify(connections));
      }

    } catch (error) {
      this.logger.error('Failed to update connection activity:', error);
    }
  }

  private async sendReplayEvents(connection: SSEConnection): Promise<void> {
    try {
      const replayKey = `sse_replay:${connection.organizationId}`;
      const replayData = await this.env.KV.get(replayKey);
      
      if (!replayData) return;

      const events: BusinessEvent[] = JSON.parse(replayData);
      
      // Send last 10 events
      const recentEvents = events.slice(-10);
      
      for (const event of recentEvents) {
        if (this.shouldSendToConnection(connection, event)) {
          const message = this.createSSEMessage(event);
          await this.sendToConnection(connection, message);
        }
      }

      this.logger.info(`Sent ${recentEvents.length} replay events to connection ${connection.id}`);

    } catch (error) {
      this.logger.error('Failed to send replay events:', error);
    }
  }

  // Health check for SSE system
  async getSystemHealth(): Promise<any> {
    try {
      // Get total connections across all organizations
      let totalConnections = 0;
      const organizations = ['org1', 'org2']; // In real implementation, get from database
      
      for (const orgId of organizations) {
        const connections = await this.getActiveConnections(orgId);
        totalConnections += connections.length;
      }

      return {
        status: 'healthy',
        totalConnections,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to get SSE system health:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get messages for a specific connection (polling endpoint)
  async getMessagesForConnection(connectionId: string): Promise<SSEMessage[]> {
    try {
      // Get all messages for this connection
      const { keys } = await this.env.KV.list({ prefix: `sse_message:${connectionId}:` });
      
      const messages: SSEMessage[] = [];
      
      for (const key of keys) {
        const messageData = await this.env.KV.get(key.name);
        if (messageData) {
          messages.push(JSON.parse(messageData));
          // Delete message after retrieval
          await this.env.KV.delete(key.name);
        }
      }

      // Sort by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return messages;

    } catch (error) {
      this.logger.error(`Failed to get messages for connection ${connectionId}:`, error);
      return [];
    }
  }
}