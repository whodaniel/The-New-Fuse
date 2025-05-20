import { EnhancedDatabaseService } from '@/core/database/enhanced-database.service';
import { DatabaseStats, DatabaseConfig } from '@/types/database';
import { handleApiResponse } from '@/utils/api';
import { LoggingService } from '@/core/services/LoggingService.ts';
import { MetricsService } from '@/core/services/MetricsService.ts';

const API_BASE = '/api/database';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export class DatabaseService {
  private static instance: DatabaseService;
  private enhancedDb: EnhancedDatabaseService;
  private logger: LoggingService;
  private metrics: MetricsService;

  private constructor() {
    this.logger = new LoggingService('DatabaseService');
    this.metrics = new MetricsService();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        
        DatabaseService.getInstance().metrics.recordDbOperation('success', duration);
        return result;
      } catch (error) {
        lastError = error as Error;
        DatabaseService.getInstance().logger.error('Database operation failed', { 
          error,
          attempt 
        });
        DatabaseService.getInstance().metrics.recordDbOperation('error');
        
        if (attempt < RETRY_ATTEMPTS) {
          await new Promise(resolv(e: any) => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError;
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
      const result = await handleApiResponse<{connected: boolean}>(response);
      DatabaseService.getInstance().metrics.recordDbOperation('connection_check', undefined, result.connected);
      return result.connected;
    } catch (error) {
      DatabaseService.getInstance().logger.error('Database connection check failed:', { error });
      DatabaseService.getInstance().metrics.recordDbOperation('connection_check', undefined, false);
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

  static async getLogs(limit: number = 100): Promise<Array<{
    timestamp: string;
    level: string;
    message: string;
  }>> {
    return this.withRetry(async () => {
      const response = await fetch(`${API_BASE}/logs?limit=${limit}`);
      return handleApiResponse(response);
    });
  }
}