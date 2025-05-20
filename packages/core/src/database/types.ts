export interface DatabaseConfig {
    type: 'postgres' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    schema?: string;
    ssl?: boolean;
    migrations?: string[];
    entities?: string[];
    synchronize?: boolean;
    logging?: boolean;
    poolSize?: number;
    timeout?: number;
    metricsInterval?: number;
}

export interface DatabaseStats {
    timestamp: number;
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

export interface QueryLogEntry {
    query: string;
    duration: number;
    timestamp: number;
    error?: Error;
}

export interface ConnectionPoolConfig {
    poolSize: number;
    timeout: number;
    databasePath: string;
}

export interface DatabaseError extends Error {
    code?: string;
    errno?: number;
    sqlState?: string;
    sqlMessage?: string;
    query?: string;
    parameters?: unknown[];
}

// Correcting syntax issues in type definitions
export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
