export interface RedisConfig {
  host: string;
  port: number;
  password: string;
}
export declare class RedisConnection {
  private client;
  constructor(config: RedisConfig);
  connect(): Promise<void>;
}
