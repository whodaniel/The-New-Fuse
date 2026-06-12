// Optimized WebSocket Service - Connection pooling, message batching, and performance optimization
// Handles real-time communication for multi-agent systems with intelligent load balancing

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as crypto from 'crypto';
import { Server, Socket } from 'socket.io';
import { AgentAuthService } from '../../auth/src/jwt/AgentAuthService';
import { RedisCacheService } from '../../cache/src/redis-cache.service';

export interface WebSocketMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  agentId?: string;
  priority?: MessagePriority;
  requiresAck?: boolean;
  retryCount?: number;
}

export interface BatchedMessage {
  messages: WebSocketMessage[];
  totalSize: number;
  batchId: string;
  timestamp: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
  bandwidthUsage: number;
}

export interface ConnectionPool {
  userId: string;
  connections: Set<Socket>;
  lastActivity: number;
  messageQueue: WebSocketMessage[];
  isActive: boolean;
}

export enum MessagePriority {
  CRITICAL = 1, // System alerts, errors
  HIGH = 2, // Real-time agent communication
  MEDIUM = 3, // Status updates, notifications
  LOW = 4, // Analytics, logs
  BATCH = 5, // Bulk data transfers
}

export enum MessageType {
  AGENT_STATUS = 'agent_status',
  WORKFLOW_UPDATE = 'workflow_update',
  TASK_PROGRESS = 'task_progress',
  NOTIFICATION = 'notification',
  SYSTEM_ALERT = 'system_alert',
  CHAT_MESSAGE = 'chat_message',
  ANALYTICS_DATA = 'analytics_data',
  HEARTBEAT = 'heartbeat',
  BATCH_DATA = 'batch_data',
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class OptimizedWebSocketService
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OptimizedWebSocketService.name);
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private messageBatches: Map<string, BatchedMessage> = new Map();
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0,
    bandwidthUsage: 0,
  };

  // Configuration for message batching and optimization
  private readonly config = {
    batchSize: 50, // Maximum messages per batch
    batchTimeout: 100, // Batch timeout in milliseconds
    maxMessageQueueSize: 1000, // Max queued messages per user
    connectionPoolTimeout: 300000, // 5 minutes idle timeout
    heartbeatInterval: 30000, // 30 seconds
    maxConnectionsPerUser: 5, // Connection limit per user
    compressionThreshold: 1024, // Compress messages larger than 1KB
    rateLimitWindow: 60000, // 1 minute rate limit window
    rateLimitMax: 100, // Max messages per window
  };

  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private metricsInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private cacheService: RedisCacheService,
    private authService: AgentAuthService
  ) {}

  async onModuleInit(): Promise<void> {
    this.startHeartbeat();
    this.startMetricsCollection();
    this.startConnectionPoolCleanup();
    this.logger.log('Optimized WebSocket Service initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = await this.authenticateConnection(client);
      if (!userId) {
        client.disconnect();
        return;
      }

      // Add to connection pool
      await this.addToConnectionPool(userId, client);

      // Set up client event handlers
      this.setupClientHandlers(client, userId);

      this.metrics.totalConnections++;
      this.metrics.activeConnections++;

      this.logger.log(`Client connected: ${client.id} for user: ${userId}`);

      // Send connection acknowledgment
      await this.sendMessage(client, {
        id: this.generateMessageId(),
        type: MessageType.SYSTEM_ALERT,
        payload: { status: 'connected', userId },
        timestamp: Date.now(),
        priority: MessagePriority.HIGH,
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data.userId;

    if (userId) {
      await this.removeFromConnectionPool(userId, client);
      this.logger.log(`Client disconnected: ${client.id} for user: ${userId}`);
    }

    this.metrics.activeConnections--;
  }

  private async authenticateConnection(client: Socket): Promise<string | null> {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      if (!token) {
        this.logger.warn(`Connection attempt without token: ${client.id}`);
        return null;
      }

      // Implement your JWT verification logic here
      const { valid, userId } = await this.authService.validateToken(token);
      if (!valid || !userId) {
        this.logger.warn(`Invalid token for connection: ${client.id}`);
        return null;
      }

      client.data.userId = userId;
      return userId;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  private async addToConnectionPool(userId: string, client: Socket): Promise<void> {
    let pool = this.connectionPools.get(userId);

    if (!pool) {
      pool = {
        userId,
        connections: new Set(),
        lastActivity: Date.now(),
        messageQueue: [],
        isActive: true,
      };
      this.connectionPools.set(userId, pool);
    }

    // Enforce connection limit per user
    if (pool.connections.size >= this.config.maxConnectionsPerUser) {
      const oldestConnection = Array.from(pool.connections)[0];
      oldestConnection.disconnect();
      pool.connections.delete(oldestConnection);
    }

    pool.connections.add(client);
    pool.lastActivity = Date.now();
    pool.isActive = true;

    // Process any queued messages
    if (pool.messageQueue.length > 0) {
      await this.flushMessageQueue(userId);
    }
  }

  private async removeFromConnectionPool(userId: string, client: Socket): Promise<void> {
    const pool = this.connectionPools.get(userId);
    if (pool) {
      pool.connections.delete(client);

      if (pool.connections.size === 0) {
        pool.isActive = false;
        pool.lastActivity = Date.now();
      }
    }
  }

  private setupClientHandlers(client: Socket, userId: string): void {
    // Handle incoming messages from client
    client.on('message', async (data: any) => {
      try {
        await this.handleClientMessage(client, userId, data);
      } catch (error) {
        this.logger.error('Error handling client message:', error);
      }
    });

    // Handle ping/pong for connection health
    client.on('ping', () => {
      client.emit('pong');
      this.updateConnectionActivity(userId);
    });

    // Handle client errors
    client.on('error', (error) => {
      this.logger.error(`Client error for user ${userId}:`, error);
    });
  }

  private async handleClientMessage(client: Socket, userId: string, data: any): Promise<void> {
    this.updateConnectionActivity(userId);

    // Implement rate limiting
    const rateLimit = await this.checkRateLimit(userId);
    if (!rateLimit.allowed) {
      client.emit('error', { message: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter });
      return;
    }

    // Process the message based on type
    switch (data.type) {
      case 'agent_command':
        await this.handleAgentCommand(userId, data.payload);
        break;
      case 'workflow_action':
        await this.handleWorkflowAction(userId, data.payload);
        break;
      case 'chat_message':
        await this.handleChatMessage(userId, data.payload);
        break;
      default:
        this.logger.warn(`Unknown message type from client: ${data.type}`);
    }
  }

  // Send message with intelligent batching and optimization
  async sendMessage(target: Socket | string, message: WebSocketMessage): Promise<boolean> {
    try {
      if (typeof target === 'string') {
        // Send to user ID
        return await this.sendToUser(target, message);
      } else {
        // Send to specific socket
        return await this.sendToSocket(target, message);
      }
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return false;
    }
  }

  private async sendToUser(userId: string, message: WebSocketMessage): Promise<boolean> {
    const pool = this.connectionPools.get(userId);

    if (!pool || pool.connections.size === 0) {
      // Queue message if user is offline
      await this.queueMessage(userId, message);
      return false;
    }

    // Determine if message should be batched
    if (this.shouldBatchMessage(message)) {
      await this.addToBatch(userId, message);
      return true;
    }

    // Send immediately for high-priority messages
    let sent = false;
    for (const connection of pool.connections) {
      if (connection.connected) {
        await this.sendToSocket(connection, message);
        sent = true;
      }
    }

    return sent;
  }

  private async sendToSocket(socket: Socket, message: WebSocketMessage): Promise<boolean> {
    try {
      if (!socket.connected) {
        return false;
      }

      // Compress large messages
      let payload = message;
      if (JSON.stringify(message).length > this.config.compressionThreshold) {
        payload = await this.compressMessage(message);
      }

      socket.emit('message', payload);
      this.updateMetrics('messageSent');
      return true;
    } catch (error) {
      this.logger.error('Error sending to socket:', error);
      return false;
    }
  }

  // Message batching logic
  private shouldBatchMessage(message: WebSocketMessage): boolean {
    return message.priority >= MessagePriority.MEDIUM && !message.requiresAck;
  }

  private async addToBatch(userId: string, message: WebSocketMessage): Promise<void> {
    const batchKey = `${userId}_batch`;
    let batch = this.messageBatches.get(batchKey);

    if (!batch) {
      batch = {
        messages: [],
        totalSize: 0,
        batchId: this.generateMessageId(),
        timestamp: Date.now(),
      };
      this.messageBatches.set(batchKey, batch);
    }

    batch.messages.push(message);
    batch.totalSize += JSON.stringify(message).length;

    // Send batch if it reaches size limit or timeout
    if (
      batch.messages.length >= this.config.batchSize ||
      batch.totalSize > this.config.compressionThreshold
    ) {
      await this.flushBatch(userId);
    } else {
      // Set or reset batch timer
      this.setBatchTimer(userId);
    }
  }

  private setBatchTimer(userId: string): void {
    const batchKey = `${userId}_batch`;
    const existingTimer = this.batchTimers.get(batchKey);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      await this.flushBatch(userId);
    }, this.config.batchTimeout);

    this.batchTimers.set(batchKey, timer);
  }

  private async flushBatch(userId: string): Promise<void> {
    const batchKey = `${userId}_batch`;
    const batch = this.messageBatches.get(batchKey);

    if (!batch || batch.messages.length === 0) {
      return;
    }

    const batchMessage: WebSocketMessage = {
      id: batch.batchId,
      type: MessageType.BATCH_DATA,
      payload: {
        messages: batch.messages,
        batchId: batch.batchId,
        count: batch.messages.length,
      },
      timestamp: Date.now(),
      priority: MessagePriority.MEDIUM,
    };

    await this.sendToUser(userId, batchMessage);

    // Clean up
    this.messageBatches.delete(batchKey);
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    this.logger.debug(`Flushed batch of ${batch.messages.length} messages for user: ${userId}`);
  }

  // Broadcast methods
  async broadcastToAllUsers(message: WebSocketMessage): Promise<number> {
    let sentCount = 0;
    for (const [userId] of this.connectionPools) {
      const sent = await this.sendToUser(userId, message);
      if (sent) sentCount++;
    }
    return sentCount;
  }

  async broadcastToAgents(agentIds: string[], message: WebSocketMessage): Promise<number> {
    // Implementation for broadcasting to specific agents
    // This would lookup users associated with agents and send messages
    return 0; // Placeholder
  }

  // Message queue management
  private async queueMessage(userId: string, message: WebSocketMessage): Promise<void> {
    let pool = this.connectionPools.get(userId);

    if (!pool) {
      pool = {
        userId,
        connections: new Set(),
        lastActivity: Date.now(),
        messageQueue: [],
        isActive: false,
      };
      this.connectionPools.set(userId, pool);
    }

    // Enforce queue size limit
    if (pool.messageQueue.length >= this.config.maxMessageQueueSize) {
      pool.messageQueue.shift(); // Remove oldest message
    }

    pool.messageQueue.push(message);

    // Cache important messages
    if (message.priority <= MessagePriority.HIGH) {
      await this.cacheService.set(`queued_message:${userId}:${message.id}`, message, { ttl: 3600 });
    }
  }

  private async flushMessageQueue(userId: string): Promise<void> {
    const pool = this.connectionPools.get(userId);
    if (!pool || pool.messageQueue.length === 0) {
      return;
    }

    const messages = [...pool.messageQueue];
    pool.messageQueue = [];

    for (const message of messages) {
      await this.sendToUser(userId, message);
    }

    this.logger.debug(`Flushed ${messages.length} queued messages for user: ${userId}`);
  }

  // Utility methods
  private async checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `rate_limit:${userId}`;
    const current = (await this.cacheService.get(key)) || 0;

    if (current >= this.config.rateLimitMax) {
      return { allowed: false, retryAfter: this.config.rateLimitWindow };
    }

    await this.cacheService.set(key, current + 1, { ttl: this.config.rateLimitWindow / 1000 });
    return { allowed: true };
  }

  private async compressMessage(message: WebSocketMessage): Promise<WebSocketMessage> {
    // Simple compression placeholder - implement actual compression if needed
    return {
      ...message,
      payload: {
        compressed: true,
        data: JSON.stringify(message.payload),
      },
    };
  }

  private updateConnectionActivity(userId: string): void {
    const pool = this.connectionPools.get(userId);
    if (pool) {
      pool.lastActivity = Date.now();
    }
  }

  private updateMetrics(event: string): void {
    // Update internal metrics based on events
    switch (event) {
      case 'messageSent':
        // Increment message counter
        break;
      case 'messageReceived':
        // Increment received counter
        break;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const heartbeatMessage: WebSocketMessage = {
        id: this.generateMessageId(),
        type: MessageType.HEARTBEAT,
        payload: { timestamp: Date.now() },
        timestamp: Date.now(),
        priority: MessagePriority.LOW,
      };

      for (const [userId, pool] of this.connectionPools) {
        if (pool.isActive && pool.connections.size > 0) {
          await this.sendToUser(userId, heartbeatMessage);
        }
      }
    }, this.config.heartbeatInterval);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect metrics every minute
  }

  private startConnectionPoolCleanup(): void {
    setInterval(() => {
      this.cleanupInactivePools();
    }, this.config.connectionPoolTimeout);
  }

  private collectMetrics(): void {
    this.metrics.totalConnections = Array.from(this.connectionPools.values()).reduce(
      (sum, pool) => sum + pool.connections.size,
      0
    );

    this.metrics.activeConnections = Array.from(this.connectionPools.values())
      .filter((pool) => pool.isActive)
      .reduce((sum, pool) => sum + pool.connections.size, 0);
  }

  private cleanupInactivePools(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [userId, pool] of this.connectionPools) {
      if (!pool.isActive && now - pool.lastActivity > this.config.connectionPoolTimeout) {
        toRemove.push(userId);
      }
    }

    toRemove.forEach((userId) => {
      this.connectionPools.delete(userId);
      this.logger.debug(`Cleaned up inactive pool for user: ${userId}`);
    });
  }

  // Handler implementations
  private async handleAgentCommand(userId: string, payload: any): Promise<void> {
    // Implement agent command handling
  }

  private async handleWorkflowAction(userId: string, payload: any): Promise<void> {
    // Implement workflow action handling
  }

  private async handleChatMessage(userId: string, payload: any): Promise<void> {
    // Implement chat message handling
  }

  private generateMessageId(): string {
    // SECURITY: Use cryptographically secure random values instead of Math.random()
    return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  async getConnectionMetrics(): Promise<ConnectionMetrics> {
    return this.metrics;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Clear all batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.logger.log('WebSocket service shutdown complete');
  }
}
