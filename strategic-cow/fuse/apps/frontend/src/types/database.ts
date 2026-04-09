export interface DatabaseStats {
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    failed: number;
    avgDuration: number;
  };
  migrations: {
    pending: number;
    executed: number;
    failed: number;
  };
  tables: {
    count: number;
    totalRows: number;
    size: number;
  };
}

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  schema?: string;
  ssl?: boolean;
}

export interface QueryLogEntry {
  query: string;
  duration: number;
  timestamp: number;
  error?: Error;
}

export interface ConnectionPoolStats {
  total: number;
  active: number;
  idle: number;
}