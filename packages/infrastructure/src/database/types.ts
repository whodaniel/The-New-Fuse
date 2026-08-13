export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeout: number;
  connectTimeout: number;
}

export const DEFAULT_DB_CONFIG: Partial<DatabaseConfig> = {
  host: 'localhost',
  port: 5432,
  database: 'fuse',
  ssl: false,
  maxConnections: 10,
  idleTimeout: 20,
  connectTimeout: 10,
};
