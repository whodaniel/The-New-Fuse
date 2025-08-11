export interface ConfigOptions {
  // Implementation needed
}
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  environment: string;
}

export interface DatabaseConfig {
  // Implementation needed
}
  url: string;
  type: 'postgres' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}