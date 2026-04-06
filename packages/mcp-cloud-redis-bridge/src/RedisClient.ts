import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'node:events';

export interface RedisConfig {
  url: string;
  ingressChannel: string;
  egressPrefix: string;
}

export class CloudRedisClient extends EventEmitter {
  private publisher: any = null;
  private subscriber: any = null;
  private upstash: any = null;
  private connected = false;
  private config: RedisConfig;

  constructor(config: Partial<RedisConfig> = {}) {
    super();
    this.config = {
      url: process.env.CLOUD_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
      ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
      egressPrefix: config.egressPrefix || 'tnf:bus:egress',
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.publisher = createStandaloneRedisClient({
        redisUrl: this.config.url,
        lazyConnect: true,
      } as any);
      this.subscriber = createStandaloneRedisClient({
        redisUrl: this.config.url,
        lazyConnect: true,
      } as any);
      this.upstash = createUpstashRestClient();

      if (this.publisher && typeof this.publisher.connect === 'function') {
        await this.publisher.connect().catch(() => {});
      }
      if (this.subscriber && typeof this.subscriber.connect === 'function') {
        await this.subscriber.connect().catch(() => {});
      }

      this.connected = true;
      this.emit('ready');
    } catch (error: any) {
      this.emit('error', `Initialization failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    if (this.publisher) await this.publisher.quit();
    if (this.subscriber) await this.subscriber.quit();
    this.upstash = null;

    this.connected = false;
  }

  async publish(channel: string, message: string): Promise<number> {
    await this.ensureConnected();
    if (this.upstash) {
      return await this.upstash.publish(channel, message);
    }
    if (this.publisher) {
      return await this.publisher.publish(channel, message);
    }
    return 0;
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.ensureConnected();
    if (this.subscriber) {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch: string, msg: string) => {
        if (ch === channel) callback(msg);
      });
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    await this.ensureConnected();
    if (this.upstash) {
      const result = await this.upstash.hgetall(key);
      return (result as Record<string, string>) || {};
    }
    if (this.publisher) {
      return await this.publisher.hgetall(key);
    }
    return {};
  }

  private async ensureConnected() {
    if (!this.connected) {
      await this.connect();
    }
  }

  getIngressChannel(): string {
    return this.config.ingressChannel;
  }
}
