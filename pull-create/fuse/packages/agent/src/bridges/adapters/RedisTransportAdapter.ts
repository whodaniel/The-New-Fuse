/**
 * Redis Pub/Sub Transport Adapter
 *
 * ORCHESTRATOR IMPROVEMENT: Architecture enhancement from federated intelligence
 * - Enables true distributed agent federation across containers/servers
 * - Replaces ad-hoc file-based queues with scalable event bus
 * - Supports horizontal scaling of relay servers
 */

import { EventEmitter } from 'events';
import Redis, { Redis as RedisClient } from 'ioredis';
import { TransportAdapter, TransportType, UniversalMessage } from '../universal_bridge.js';

export interface RedisTransportConfig {
  redisUrl?: string;
  serialization?: 'json' | 'msgpack';
  reconnectOnError?: boolean;
  maxReconnectAttempts?: number;
}

export class RedisTransportAdapter extends EventEmitter implements TransportAdapter {
  type: TransportType = 'redis';
  private publisher: RedisClient;
  private subscriber: RedisClient;
  private messageHandlers = new Map<string, (msg: UniversalMessage) => void>();
  private config: Required<RedisTransportConfig>;
  private reconnectAttempts = 0;
  private connected = false;

  constructor(config: RedisTransportConfig = {}) {
    super();
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6380',
      serialization: config.serialization || 'json',
      reconnectOnError: config.reconnectOnError ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
    };

    console.log('[RedisTransport] Initializing...', {
      url: this.config.redisUrl,
      serialization: this.config.serialization,
    });

    this.publisher = this.createRedisClient('publisher');
    this.subscriber = this.createRedisClient('subscriber');

    this.setupSubscriberHandlers();
  }

  async connect(): Promise<void> {
    // Clients connect automatically, but we can wait for ready
    if (this.publisher.status === 'ready' && this.subscriber.status === 'ready') {
      this.connected = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 10000);

      const checkReady = () => {
        if (this.publisher.status === 'ready' && this.subscriber.status === 'ready') {
          clearTimeout(timeout);
          this.connected = true;
          resolve();
        }
      };

      this.publisher.on('ready', checkReady);
      this.subscriber.on('ready', checkReady);
    });
  }

  private createRedisClient(role: 'publisher' | 'subscriber'): RedisClient {
    const client = new Redis(this.config.redisUrl, {
      retryStrategy: (times) => {
        if (!this.config.reconnectOnError) return null;
        if (times > this.config.maxReconnectAttempts) {
          console.error(`[RedisTransport:${role}] Max reconnect attempts reached`);
          return null;
        }
        const delay = Math.min(times * 500, 3000);
        console.log(`[RedisTransport:${role}] Reconnecting in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    client.on('connect', () => {
      console.log(`[RedisTransport:${role}] ✅ Connected to Redis`);
      this.reconnectAttempts = 0;
    });

    client.on('error', (error) => {
      console.error(`[RedisTransport:${role}] ❌ Error:`, error.message);
    });

    client.on('close', () => {
      console.warn(`[RedisTransport:${role}] 🔌 Connection closed`);
      if (this.publisher.status !== 'ready' || this.subscriber.status !== 'ready') {
        this.connected = false;
        this.emit('disconnected');
      }
    });

    client.on('ready', () => {
      if (this.publisher.status === 'ready' && this.subscriber.status === 'ready') {
        this.connected = true;
        this.emit('connected');
      }
    });

    return client;
  }

  private setupSubscriberHandlers(): void {
    this.subscriber.on('message', (channel, message) => {
      const handler = this.messageHandlers.get(channel);
      if (!handler) {
        // Also check for broadcast pattern
        const broadcastHandler = this.messageHandlers.get('broadcast');
        if (broadcastHandler) {
          try {
            const parsed = this.deserialize(message);
            broadcastHandler(parsed);
          } catch (error) {
            console.error('[RedisTransport] Broadcast message parse error:', error);
          }
        }
        return;
      }

      try {
        const parsed = this.deserialize(message);
        handler(parsed);
      } catch (error) {
        console.error('[RedisTransport] Message parse error:', error);
      }
    });

    this.subscriber.on('subscribe', (channel, count) => {
      console.log(`[RedisTransport] ✅ Subscribed to channel: ${channel} (total: ${count})`);
    });

    this.subscriber.on('unsubscribe', (channel, count) => {
      console.log(
        `[RedisTransport] 🔕 Unsubscribed from channel: ${channel} (remaining: ${count})`
      );
    });
  }

  /**
   * Send a message
   */
  async send(message: UniversalMessage): Promise<void> {
    try {
      const channel = message.target.broadcastGroup || message.target.agentId;
      const serialized = this.serialize(message);
      const recipientCount = await this.publisher.publish(channel, serialized);

      console.log('[RedisTransport] Message published', {
        channel,
        messageId: message.id,
        recipients: recipientCount,
      });
    } catch (error) {
      console.error('[RedisTransport] Send error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a pattern
   */
  subscribe(pattern: string, handler: (msg: UniversalMessage) => void): void {
    try {
      this.messageHandlers.set(pattern, handler);
      this.subscriber.subscribe(pattern).catch((error) => {
        console.error(`[RedisTransport] Subscribe error for ${pattern}:`, error);
        this.messageHandlers.delete(pattern);
      });
    } catch (error) {
      console.error('[RedisTransport] Subscribe error:', error);
      this.messageHandlers.delete(pattern);
      throw error;
    }
  }

  /**
   * Unsubscribe from a pattern
   */
  unsubscribe(pattern: string): void {
    try {
      this.messageHandlers.delete(pattern);
      this.subscriber.unsubscribe(pattern).catch((error) => {
        console.error(`[RedisTransport] Unsubscribe error for ${pattern}:`, error);
      });
    } catch (error) {
      console.error('[RedisTransport] Unsubscribe error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    console.log('[RedisTransport] Disconnecting...');

    try {
      this.connected = false;
      await this.subscriber.quit();
      await this.publisher.quit();
      console.log('[RedisTransport] ✅ Disconnected successfully');
    } catch (error) {
      console.error('[RedisTransport] Disconnect error:', error);
      // Force disconnect
      this.subscriber.disconnect();
      this.publisher.disconnect();
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get subscribed channels
   */
  getSubscribedChannels(): string[] {
    return Array.from(this.messageHandlers.keys());
  }

  /**
   * Serialize message based on config
   */
  private serialize(message: UniversalMessage): string {
    switch (this.config.serialization) {
      case 'msgpack':
        // TODO: Implement msgpack serialization
        // For now, fall back to JSON
        console.warn('[RedisTransport] MsgPack not yet implemented, using JSON');
        return JSON.stringify(message);
      case 'json':
      default:
        return JSON.stringify(message);
    }
  }

  /**
   * Deserialize message based on config
   */
  private deserialize(data: string): UniversalMessage {
    switch (this.config.serialization) {
      case 'msgpack':
        // TODO: Implement msgpack deserialization
        // For now, fall back to JSON
        return JSON.parse(data);
      case 'json':
      default:
        return JSON.parse(data);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.publisher.ping();
      await this.subscriber.ping();
      return true;
    } catch (error) {
      console.error('[RedisTransport] Health check failed:', error);
      return false;
    }
  }
}
