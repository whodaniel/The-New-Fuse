import { createClient, RedisClientType } from 'redis';
import { EventEmitter } from 'node:events';

export interface RedisConfig {
  url: string;
  ingressChannel: string;
  egressPrefix: string;
}

export class CloudRedisClient extends EventEmitter {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private connected = false;
  private config: RedisConfig;

  constructor(config: Partial<RedisConfig> = {}) {
    super();
    this.config = {
      url: process.env.CLOUD_REDIS_URL || 'redis://localhost:6379',
      ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
      egressPrefix: config.egressPrefix || 'tnf:bus:egress',
    };

    this.publisher = createClient({ url: this.config.url });
    this.subscriber = createClient({ url: this.config.url });

    this.publisher.on('error', (err) => this.emit('error', `Publisher: ${err.message}`));
    this.subscriber.on('error', (err) => this.emit('error', `Subscriber: ${err.message}`));
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect()
    ]);
    this.connected = true;
    this.emit('ready');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit()
    ]);
    this.connected = false;
  }

  async publish(channel: string, message: string): Promise<number> {
    await this.ensureConnected();
    return await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.ensureConnected();
    await this.subscriber.subscribe(channel, callback);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    await this.ensureConnected();
    return await this.publisher.hGetAll(key);
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
