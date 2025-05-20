// filepath: src/config/types/config.types.ts
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: boolean;
}

export interface LoggingConfig {
  level: string;
  format: string;
  file?: string;
}

export interface ApiConfig {
  port: number;
  host: string;
  cors: {
    origins: string[];
    methods: string[];
  };
  rateLimit: {
    max: number;
    windowMs: number;
  };
}

export interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
  bcrypt: {
    saltRounds: number;
  };
}

export interface AppConfig {
  env: string;
  debug: boolean;
  name: string;
  version: string;
}

export interface Config {
  app: AppConfig;
  api: ApiConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  [key: string]: unknown;
}
