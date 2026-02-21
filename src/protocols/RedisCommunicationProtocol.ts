import * as IoRedis from 'ioredis'; // Import the ioredis module as a namespace
import { ConfigService } from '../config/ConfigService.js'; // Standard class import
import type { BaseMessage } from '../services/RooCodeCommunication.js'; // Standard type import for interface

/**
 * Adapter for Redis pub/sub communication.
 * Extracted low‑level Redis logic into protocol adapter.
 */
export class RedisCommunicationProtocol {
  private pub: IoRedis.Redis; // Type is IoRedis.Redis (class Redis within IoRedis namespace)
  private sub: IoRedis.Redis; // Type is IoRedis.Redis
  private reconnectAttempts = 0;

  constructor(
    private config: ConfigService,
    private logger: Console = console
  ) {
    const url = this.config.get('redis.url');
    // Instantiate using the Redis class constructor
    // Try instantiating using IoRedis.default if 'ioredis' default exports the class
    // or IoRedis.Redis if Redis is a named export class within the module
    // Given the previous errors, IoRedis.Redis seems more likely if IoRedis is the namespace
    this.pub = new IoRedis.Redis(url);
    this.sub = new IoRedis.Redis(url);
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    const onError = (ctx: string) => (err: Error) => {
      this.logger.error(`[RedisProtocol][${ctx}]`, err);
      this.tryReconnect();
    };
    this.pub.on('error', onError('PUB'));
    this.sub.on('error', onError('SUB'));
  }

  private tryReconnect(): void {
    const max = this.config.get('redis.maxRetries') ?? 5;
    if (this.reconnectAttempts++ >= max) {
      this.logger.error('[RedisProtocol] Max reconnect attempts exceeded');
      return;
    }
    const delay = (this.config.get('redis.initialDelay') ?? 500) * Math.pow(this.config.get('redis.backoffMultiplier') ?? 2, this.reconnectAttempts);
    setTimeout(() => {
      this.logger.info(`[RedisProtocol] Reconnecting attempt #${this.reconnectAttempts}`);
      this.pub.connect().catch(err => this.logger.error('[RedisProtocol] PUB reconnect failed', err));
      this.sub.connect().catch(err => this.logger.error('[RedisProtocol] SUB reconnect failed', err));
    }, delay);
  }

  async subscribe(channel: string, handler: (message: BaseMessage) => void): Promise<void> {
    await this.sub.subscribe(channel);
    this.sub.on('message', (_ch, payload) => {
      try {
        const msg = JSON.parse(payload);
        if (this.isValid(msg)) {
          handler(msg);
        } else {
          this.logger.warn('[RedisProtocol] Dropped invalid message', payload);
        }
      } catch (err) {
        this.logger.error('[RedisProtocol] Failed to parse message', err);
      }
    });
    this.logger.info(`[RedisProtocol] Subscribed to ${channel}`);
  }

  async publish(channel: string, message: BaseMessage): Promise<void> {
    const payload = JSON.stringify(message);
    await this.pub.publish(channel, payload);
    this.logger.info(`[RedisProtocol] Published to ${channel}`);
  }

  onMessage(callback: (message: BaseMessage) => void): void {
    this.sub.on('message', (_ch, payload) => {
      try {
        const msg = JSON.parse(payload);
        if (this.isValid(msg)) {
          callback(msg);
        }
      } catch {
        // ignore
      }
    });
  }

  private isValid(msg: any): msg is BaseMessage {
    // Accept either 'source' or 'sender' for compatibility
    const hasSourceOrSender = typeof msg?.source === 'string' || typeof msg?.sender === 'string';
    if (typeof msg?.sender === 'string' && typeof msg?.source === 'undefined') {
      // If 'sender' exists and 'source' doesn't, map 'sender' to 'source'
      // This is a mutable operation, ensure this is intended or clone the object first if needed.
      // For now, we'll assume direct modification is acceptable for this protocol adapter.
      msg.source = msg.sender;
    }
    return typeof msg?.type === 'string'
      && hasSourceOrSender
      && typeof msg?.timestamp === 'string'
      && 'content' in msg;
  }
}