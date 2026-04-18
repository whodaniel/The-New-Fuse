import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { WebSocketAdapter, WebSocketMetrics } from '../types';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

@Injectable()
export class RedisWebSocketAdapter implements WebSocketAdapter, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisWebSocketAdapter.name);
  private pubClient?: any;
  private subClient?: any;
  private io?: Server;
  private readonly config: RedisConfig;
  private metrics: WebSocketMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errors: 0,
    reconnections: 0,
  };
  private metricsInterval?: NodeJS.Timeout;

  constructor(
    config: RedisConfig,
    private readonly redisService: UnifiedRedisService
  ) {
    this.config = {
      keyPrefix: 'ws:',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      // Use raw clients for Socket.IO adapter compatibility
      this.pubClient = this.redisService.getClient();
      this.subClient = (this.pubClient as any).duplicate
        ? (this.pubClient as any).duplicate()
        : this.pubClient;

      if (this.subClient.connect && this.subClient.status !== 'ready') {
        await this.subClient.connect().catch(() => {});
      }

      this.logger.log('Redis adapter initialized successfully');
      this.startMetricsCollection();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis adapter: ${error}`);
      throw error;
    }
  }

  private async waitForConnection(client: any, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Redis ${name} client connection timeout`));
      }, 10000);

      if (client.status === 'ready') {
        clearTimeout(timeout);
        resolve();
      } else {
        client.once('ready', () => {
          clearTimeout(timeout);
          this.logger.log(`Redis ${name} client connected`);
          resolve();
        });
      }
    });
  }

  /**
   * Setup Socket.IO with Redis adapter
   */
  public setupSocketIO(io: Server): void {
    if (!this.pubClient || !this.subClient) {
      throw new Error('Redis clients not initialized');
    }

    // Use Socket.IO Redis adapter for horizontal scaling
    io.adapter(createAdapter(this.pubClient, this.subClient));
    this.io = io;

    this.logger.log('Socket.IO configured with Redis adapter');
  }

  /**
   * Broadcast message to all connected clients across all servers
   */
  broadcast(channel: string, data: any): void {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }

    this.io.emit(channel, data);
    this.metrics.totalMessages++;
    this.logger.debug(`Broadcast to channel: ${channel}`);
  }

  /**
   * Send message to specific user across all servers
   */
  sendToUser(userId: string, data: any): void {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }

    // Use rooms to target specific users
    this.io.to(`user:${userId}`).emit('message', data);
    this.metrics.totalMessages++;
    this.logger.debug(`Sent message to user: ${userId}`);
  }

  /**
   * Disconnect a socket
   */
  disconnect(socketId: string, reason?: string): void {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      this.logger.debug(`Disconnected socket: ${socketId}${reason ? ` (${reason})` : ''}`);
    }
  }

  /**
   * Publish message to Redis channel
   */
  async publish(channel: string, message: any): Promise<void> {
    const data = JSON.stringify(message);
    await this.redisService.publish(`${this.config.keyPrefix}${channel}`, data);
    this.metrics.totalMessages++;
  }

  /**
   * Subscribe to Redis channel
   */
  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    const fullChannel = `${this.config.keyPrefix}${channel}`;
    await this.redisService.subscribe(fullChannel, (message) => {
      try {
        const data =
          typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
        handler(data);
      } catch (error) {
        this.logger.error(`Error parsing message from ${channel}: ${error}`);
        this.metrics.errors++;
      }
    });

    this.logger.log(`Subscribed to Redis channel: ${channel}`);
  }

  /**
   * Unsubscribe from Redis channel
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.redisService.unsubscribe(`${this.config.keyPrefix}${channel}`);
    this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
  }

  /**
   * Store data in Redis
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    const fullKey = `${this.config.keyPrefix}${key}`;
    await this.redisService.set(fullKey, data, ttl);
  }

  /**
   * Get data from Redis
   */
  async get(key: string): Promise<any | null> {
    const data = await this.redisService.get(`${this.config.keyPrefix}${key}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete data from Redis
   */
  async delete(key: string): Promise<void> {
    await this.redisService.del(`${this.config.keyPrefix}${key}`);
  }

  /**
   * Get metrics
   */
  getMetrics(): WebSocketMetrics {
    return { ...this.metrics };
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    let lastMessageCount = 0;

    this.metricsInterval = setInterval(() => {
      // Calculate messages per second
      const currentMessages = this.metrics.totalMessages;
      this.metrics.messagesPerSecond = currentMessages - lastMessageCount;
      lastMessageCount = currentMessages;

      // Update active connections if Socket.IO is available
      if (this.io) {
        this.metrics.activeConnections = this.io.sockets.sockets.size;
      }
    }, 1000);
  }

  /**
   * Module initialization
   */
  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  /**
   * Module cleanup
   */
  async onModuleDestroy(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.subClient && this.subClient.quit) {
      await this.subClient.quit();
    }

    this.logger.log('Redis adapter destroyed');
  }
}
