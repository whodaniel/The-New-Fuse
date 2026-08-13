/**
 * Redis Pub/Sub Transport Adapter
 *
 * ORCHESTRATOR IMPROVEMENT: Architecture enhancement from federated intelligence
 * - Enables true distributed agent federation across containers/servers
 * - Replaces ad-hoc file-based queues with scalable event bus
 * - Supports horizontal scaling of relay servers
 */

import { EventEmitter } from 'events';
import {
  createStandaloneRedisClient,
  createUpstashRestClient,
} from '@the-new-fuse/infrastructure';
import { Redis as UpstashRedis } from '@upstash/redis';
import Redis, { Cluster } from 'ioredis';
import { TransportAdapter, TransportType, UniversalMessage } from '../universal_bridge.js';

export interface RedisTransportConfig {
  redisUrl?: string;
  serialization?: 'json' | 'msgpack';
  reconnectOnError?: boolean;
  maxReconnectAttempts?: number;
}

export class RedisTransportAdapter extends EventEmitter implements TransportAdapter {
  type: TransportType = 'redis';
  private publisher: Redis | Cluster | null = null;
  private subscriber: Redis | Cluster | null = null;
  private upstash: UpstashRedis | null = null;
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
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.publisher = createStandaloneRedisClient({ redisUrl: this.config.redisUrl, lazyConnect: true } as any);
      this.subscriber = createStandaloneRedisClient({ redisUrl: this.config.redisUrl, lazyConnect: true } as any);
      this.upstash = createUpstashRestClient();

      if (this.publisher instanceof Redis) {
        await this.publisher.connect().catch(() => {});
      }
      if (this.subscriber instanceof Redis) {
        await this.subscriber.connect().catch(() => {});
        this.setupSubscriberHandlers();
      }

      this.connected = true;
      this.emit('connected');
    } catch (error: any) {
      console.error(`[RedisTransport] Initialization failed: ${error.message}`);
      throw error;
    }
  }

  private createRedisClient(role: 'publisher' | 'subscriber'): any {
    // This is no longer used but kept for structural integrity during refactor
    return null;
  }

  private setupSubscriberHandlers(): void {
    if (!this.subscriber) return;

    this.subscriber.on('message', (channel, message) => {
      const handler = this.messageHandlers.get(channel);
      if (!handler) {
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
  }

  /**
   * Send a message
   */
  async send(message: UniversalMessage): Promise<void> {
    try {
      const channel = message.target.broadcastGroup || message.target.agentId;
      const serialized = this.serialize(message);
      
      let recipientCount = 0;
      if (this.upstash) {
        recipientCount = await this.upstash.publish(channel, serialized);
      } else if (this.publisher) {
        recipientCount = await this.publisher.publish(channel, serialized);
      }

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
  async subscribe(pattern: string, handler: (msg: UniversalMessage) => void): Promise<void> {
    try {
      this.messageHandlers.set(pattern, handler);
      if (this.subscriber) {
        await this.subscriber.subscribe(pattern);
      }
    } catch (error) {
      console.error('[RedisTransport] Subscribe error:', error);
      this.messageHandlers.delete(pattern);
      throw error;
    }
  }

  /**
   * Unsubscribe from a pattern
   */
  async unsubscribe(pattern: string): Promise<void> {
    try {
      this.messageHandlers.delete(pattern);
      if (this.subscriber) {
        await this.subscriber.unsubscribe(pattern);
      }
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
      if (this.subscriber) await this.subscriber.quit();
      if (this.publisher) await this.publisher.quit();
      this.upstash = null;
      console.log('[RedisTransport] ✅ Disconnected successfully');
    } catch (error) {
      console.error('[RedisTransport] Disconnect error:', error);
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
      if (this.upstash) {
        await this.upstash.ping();
      }
      if (this.publisher) {
        await this.publisher.ping();
      }
      return true;
    } catch (error) {
      console.error('[RedisTransport] Health check failed:', error);
      return false;
    }
  }
}
