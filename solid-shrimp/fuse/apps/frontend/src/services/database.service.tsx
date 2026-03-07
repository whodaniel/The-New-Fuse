// NOTE: @/core/database and @/core/services modules do not exist in this Vite frontend
// The frontend only makes API calls to the backend, it doesn't directly access databases
import { DatabaseConfig, DatabaseStats } from '@/types/database';
import { handleApiResponse } from '@/utils/api';

const API_BASE = '/api/database';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Simple logger for browser environment
const logger = {
  error: (msg: string, data?: unknown) => console.error(`[DatabaseService] ${msg}`, data),
  info: (msg: string, data?: unknown) => console.info(`[DatabaseService] ${msg}`, data),
};

// Simple metrics stub for browser environment
const metrics = {
  recordDbOperation: (_status: string, _duration?: number, _success?: boolean) => {},
};

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {
    // No longer instantiates non-existent services
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;

        metrics.recordDbOperation('success', duration);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.error('Database operation failed', { error, attempt });
        metrics.recordDbOperation('error');

        if (attempt < RETRY_ATTEMPTS) {
          await new Promise((resolve: any) => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }

    throw lastError!;
  }

  static async getStats(): Promise<DatabaseStats> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/stats`);
      return handleApiResponse<DatabaseStats>(response);
    });
  }

  static async getConfigurations(): Promise<DatabaseConfig[]> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/configurations`);
      return handleApiResponse<DatabaseConfig[]>(response);
    });
  }

  static async createBackup(): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/backup`, {
        method: 'POST',
      });
      return handleApiResponse(response);
    });
  }

  static async restoreFromBackup(formData: FormData): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/restore`, {
        method: 'POST',
        body: formData,
      });
      return handleApiResponse(response);
    });
  }

  static async runMigrations(): Promise<void> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/migrations/run`, {
        method: 'POST',
      });
      return handleApiResponse(response);
    });
  }

  static async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/check`);
      const result = await handleApiResponse<{ connected: boolean }>(response);
      metrics.recordDbOperation('connection_check', undefined, result.connected);
      return result.connected;
    } catch (error) {
      logger.error('Database connection check failed:', { error });
      metrics.recordDbOperation('connection_check', undefined, false);
      return false;
    }
  }

  static async getQueryStats(): Promise<{
    totalQueries: number;
    averageTime: number;
    errorRate: number;
  }> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/query-stats`);
      return handleApiResponse(response);
    });
  }

  static async getLogs(limit: number = 100): Promise<
    Array<{
      timestamp: string;
      level: string;
      message: string;
    }>
  > {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/logs?limit=${limit}`);
      return handleApiResponse(response);
    });
  }
}
