export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  username?: string;
  db?: number;
  tls?: boolean;
}
export interface RedisMessage {
  id: string;
  timestamp: number;
  channel: string;
  data: Record<string, unknown>;
}
