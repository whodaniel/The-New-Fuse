export interface ConfigOptions {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  environment: string;
}

export interface DatabaseConfig {
  url: string;
  type: 'postgres' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}