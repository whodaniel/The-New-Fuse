import { createClient } from 'redis';

const REDIS_URL =
  process.env.REDIS_URL ||
  'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570';

class RedisClient {
  private static instance: RedisClient;
  private client;

  private constructor() {
    this.client = createClient({
      url: REDIS_URL,
    });

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  public async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }
}

export const redisClient = RedisClient.getInstance();
