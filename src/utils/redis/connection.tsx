import { Redis } from "ioredis";

// Standardize Redis connection options type
export interface RedisConfig {
  host: string;
  port: number;
  password: string;
}

export class RedisConnection {
  private client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
    });
  }

  async initialize(): Promise<void> {
    await this.client.connect();
  }
}
