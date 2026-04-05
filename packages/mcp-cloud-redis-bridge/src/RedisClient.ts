import { EventEmitter } from 'node:events';
import {
  createStandaloneRedisClient,
  createUpstashRestClient,
} from '@the-new-fuse/infrastructure';
import { Redis as UpstashRedis } from '@upstash/redis';
import Redis, { Cluster } from 'ioredis';

export interface RedisConfig {
...
export class CloudRedisClient extends EventEmitter {
  private publisher: Redis | Cluster | null = null;
  private subscriber: Redis | Cluster | null = null;
  private upstash: UpstashRedis | null = null;
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
      this.publisher = createStandaloneRedisClient({ redisUrl: this.config.url, lazyConnect: true } as any);
      this.subscriber = createStandaloneRedisClient({ redisUrl: this.config.url, lazyConnect: true } as any);
      this.upstash = createUpstashRestClient();

      if (this.publisher instanceof Redis) {
        await this.publisher.connect().catch(() => {});
      }
      if (this.subscriber instanceof Redis) {
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
      this.subscriber.on('message', (ch, msg) => {
        if (ch === channel) callback(msg);
      });
    }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    await this.ensureConnected();
    if (this.upstash) {
      const result = await this.upstash.hgetall<Record<string, string>>(key);
      return result || {};
    }
    if (this.publisher) {
      return await this.publisher.hgetall(key);
    }
    return {};
  }
...


  private async ensureConnected() {
    if (!this.connected) {
      await this.connect();
    }
  }

  getIngressChannel(): string {
    return this.config.ingressChannel;
  }
}
