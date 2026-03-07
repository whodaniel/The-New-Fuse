import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { WebSocketAdapter, WebSocketMetrics } from '../types';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

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
  private pubClient?: Redis;
  private subClient?: Redis;
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

  constructor(config: RedisConfig) {
    this.config = {
      keyPrefix: 'ws:',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    try {
      // Create Redis clients for pub/sub
      this.pubClient = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.warn(`Retrying Redis connection (${times}), delay: ${delay}ms`);
          return delay;
        },
      });

      this.subClient = this.pubClient.duplicate();

      // Setup error handlers
      this.pubClient.on('error', (err) => {
        this.logger.error(`Redis pub client error: ${err.message}`);
        this.metrics.errors++;
      });

      this.subClient.on('error', (err) => {
        this.logger.error(`Redis sub client error: ${err.message}`);
        this.metrics.errors++;
      });

      // Setup reconnect handlers
      this.pubClient.on('reconnecting', () => {
        this.logger.log('Redis pub client reconnecting...');
        this.metrics.reconnections++;
      });

      this.subClient.on('reconnecting', () => {
        this.logger.log('Redis sub client reconnecting...');
        this.metrics.reconnections++;
      });

      // Wait for connections
      await Promise.all([
        this.waitForConnection(this.pubClient, 'pub'),
        this.waitForConnection(this.subClient, 'sub'),
      ]);

      this.logger.log('Redis adapter initialized successfully');
      this.startMetricsCollection();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis adapter: ${error}`);
      throw error;
    }
  }

  private async waitForConnection(client: Redis, name: string): Promise<void> {
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
    if (!this.pubClient) {
      throw new Error('Redis pub client not initialized');
    }

    const data = JSON.stringify(message);
    await this.pubClient.publish(`${this.config.keyPrefix}${channel}`, data);
    this.metrics.totalMessages++;
  }

  /**
   * Subscribe to Redis channel
   */
  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    if (!this.subClient) {
      throw new Error('Redis sub client not initialized');
    }

    await this.subClient.subscribe(`${this.config.keyPrefix}${channel}`);

    this.subClient.on('message', (ch: string, message: string) => {
      if (ch === `${this.config.keyPrefix}${channel}`) {
        try {
          const data = JSON.parse(message);
          handler(data);
        } catch (error) {
          this.logger.error(`Error parsing message from ${channel}: ${error}`);
          this.metrics.errors++;
        }
      }
    });

    this.logger.log(`Subscribed to Redis channel: ${channel}`);
  }

  /**
   * Unsubscribe from Redis channel
   */
  async unsubscribe(channel: string): Promise<void> {
    if (!this.subClient) {
      throw new Error('Redis sub client not initialized');
    }

    await this.subClient.unsubscribe(`${this.config.keyPrefix}${channel}`);
    this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
  }

  /**
   * Store data in Redis
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.pubClient) {
      throw new Error('Redis pub client not initialized');
    }

    const data = JSON.stringify(value);
    const fullKey = `${this.config.keyPrefix}${key}`;

    if (ttl) {
      await this.pubClient.setex(fullKey, ttl, data);
    } else {
      await this.pubClient.set(fullKey, data);
    }
  }

  /**
   * Get data from Redis
   */
  async get(key: string): Promise<any | null> {
    if (!this.pubClient) {
      throw new Error('Redis pub client not initialized');
    }

    const data = await this.pubClient.get(`${this.config.keyPrefix}${key}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete data from Redis
   */
  async delete(key: string): Promise<void> {
    if (!this.pubClient) {
      throw new Error('Redis pub client not initialized');
    }

    await this.pubClient.del(`${this.config.keyPrefix}${key}`);
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

    if (this.pubClient) {
      await this.pubClient.quit();
    }

    if (this.subClient) {
      await this.subClient.quit();
    }

    this.logger.log('Redis adapter destroyed');
  }
}
