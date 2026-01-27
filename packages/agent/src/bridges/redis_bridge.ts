/**
 * Redis Transport Adapter for UniversalBridge
 *
 * Provides Redis pub/sub transport for distributed agent communication.
 *
 * CONNECTS TO:
 * - UniversalBridge: Parent bridge system
 * - Redis: Via ioredis for pub/sub
 * - EventEmitter: For local event handling
 */

import { EventEmitter } from 'events';

import type { TransportAdapter, TransportType, UniversalMessage } from './universal_bridge';

// Redis client interface (compatible with ioredis)
interface RedisClient {
  publish(channel: string, message: string): Promise<number>;
  subscribe(...channels: string[]): Promise<number>;
  unsubscribe(...channels: string[]): void;
  on(event: 'message', handler: (channel: string, message: string) => void): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  quit(): Promise<'OK'>;
  duplicate(): RedisClient;
}

export interface RedisTransportConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  channelPrefix?: string;
  retryStrategy?: (times: number) => number | null;
}

/**
 * Redis Transport Adapter
 * Uses Redis pub/sub for distributed agent messaging
 */
export class RedisTransportAdapter extends EventEmitter implements TransportAdapter {
  type: TransportType = 'redis';

  private publisher: RedisClient | null = null;
  private subscriber: RedisClient | null = null;
  private config: RedisTransportConfig;
  private subscriptions: Map<string, (message: UniversalMessage) => void> = new Map();
  private connected = false;
  private channelPrefix: string;

  constructor(config: RedisTransportConfig = {}) {
    super();
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'tnf:',
      channelPrefix: config.channelPrefix || 'tnf:agent:',
      ...config,
    };
    this.channelPrefix = this.config.channelPrefix || 'tnf:agent:';
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Dynamic import for ioredis (may not be available)
      const Redis = await this.loadRedisClient();

      if (!Redis) {
        this.emit('warning', 'Redis client not available, falling back to memory transport');
        this.connected = true;
        this.emit('connected');
        return;
      }

      // Create publisher connection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RedisClass = Redis as any;
      this.publisher = new RedisClass({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        retryStrategy:
          this.config.retryStrategy ||
          ((times: number) => {
            if (times > 10) {
              return null;
            }
            return Math.min(times * 100, 3000);
          }),
      }) as unknown as RedisClient;

      // Create subscriber connection (separate connection required for pub/sub)
      this.subscriber = this.publisher.duplicate();

      // Setup message handler
      this.subscriber.on('message', (channel: string, messageStr: string) => {
        this.handleRedisMessage(channel, messageStr);
      });

      // Setup error handlers
      this.publisher.on('error', (err: unknown) => {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      });

      this.subscriber.on('error', (err: unknown) => {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      });

      this.connected = true;
      this.emit('connected');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      if (this.subscriber) {
        await this.subscriber.quit();
        this.subscriber = null;
      }

      if (this.publisher) {
        await this.publisher.quit();
        this.publisher = null;
      }

      this.subscriptions.clear();
      this.connected = false;
      this.emit('disconnected');
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Send a message via Redis pub/sub
   */
  async send(message: UniversalMessage): Promise<void> {
    if (!this.connected || !this.publisher) {
      // Fallback: emit locally if Redis not available
      this.emit(`message:${message.target.agentId}`, message);
      return;
    }

    const channel = this.getChannel(message.target.agentId);
    const messageStr = JSON.stringify(message);

    await this.publisher.publish(channel, messageStr);

    // Also publish to broadcast channel if specified
    if (message.target.broadcastGroup) {
      const broadcastChannel = `${this.channelPrefix}broadcast:${message.target.broadcastGroup}`;
      await this.publisher.publish(broadcastChannel, messageStr);
    }
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribe(pattern: string, handler: (message: UniversalMessage) => void): void {
    this.subscriptions.set(pattern, handler);

    if (this.subscriber) {
      const channel = this.getChannel(pattern);
      void this.subscriber.subscribe(channel);

      // Also subscribe to broadcast pattern
      const broadcastChannel = `${this.channelPrefix}broadcast:${pattern}`;
      void this.subscriber.subscribe(broadcastChannel);
    }

    // Also handle local events
    this.on(`message:${pattern}`, handler);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(pattern: string): void {
    const handler = this.subscriptions.get(pattern);
    if (handler) {
      this.off(`message:${pattern}`, handler);
      this.subscriptions.delete(pattern);
    }

    if (this.subscriber) {
      const channel = this.getChannel(pattern);
      this.subscriber.unsubscribe(channel);

      const broadcastChannel = `${this.channelPrefix}broadcast:${pattern}`;
      this.subscriber.unsubscribe(broadcastChannel);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Handle incoming Redis messages
   */
  private handleRedisMessage(channel: string, messageStr: string): void {
    try {
      const message = JSON.parse(messageStr) as UniversalMessage;

      // Extract agent ID from channel
      const agentId = channel.replace(this.channelPrefix, '').replace('broadcast:', '');

      // Find matching handler
      const handler = this.subscriptions.get(agentId);
      if (handler) {
        handler(message);
      }

      // Also emit for general handlers
      this.emit('message', message);
    } catch (error) {
      this.emit('error', new Error(`Failed to parse Redis message: ${error}`));
    }
  }

  /**
   * Get Redis channel name for an agent
   */
  private getChannel(agentId: string): string {
    return `${this.channelPrefix}${agentId}`;
  }

  /**
   * Attempt to load Redis client dynamically
   */
  private async loadRedisClient(): Promise<unknown> {
    try {
      // Try to import ioredis
      const module = await import('ioredis');
      return module.default || module;
    } catch {
      // ioredis not available
      return null;
    }
  }

  /**
   * Get transport statistics
   */
  getStats(): {
    connected: boolean;
    subscriptionCount: number;
    channelPrefix: string;
  } {
    return {
      connected: this.connected,
      subscriptionCount: this.subscriptions.size,
      channelPrefix: this.channelPrefix,
    };
  }
}

export default RedisTransportAdapter;
