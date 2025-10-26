/**
 * Theia Database Connection Module
 * 
 * Handles database connections for Theia IDE in its isolated environment.
 * Connects to the main application's consolidated PostgreSQL database.
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load Theia-specific environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.theia') });

export interface TheiaDbConfig {
  databaseUrl: string;
  poolMin: number;
  poolMax: number;
  timeout: number;
  ssl: boolean;
  logging: boolean;
}

export class TheiaDbConnection {
  private static instance: TheiaDbConnection;
  private prisma: PrismaClient | null = null;
  private config: TheiaDbConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): TheiaDbConnection {
    if (!TheiaDbConnection.instance) {
      TheiaDbConnection.instance = new TheiaDbConnection();
    }
    return TheiaDbConnection.instance;
  }

  private loadConfig(): TheiaDbConfig {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not configured. Please ensure .env.theia is properly set up.'
      );
    }

    return {
      databaseUrl,
      poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
      poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
      timeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
      ssl: process.env.DB_SSL === 'true',
      logging: process.env.NODE_ENV === 'development',
    };
  }

  public async connect(): Promise<PrismaClient> {
    if (this.prisma) {
      return this.prisma;
    }

    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.databaseUrl,
          },
        },
        log: this.config.logging ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      // Test the connection
      await this.prisma.$connect();
      
      console.log('✅ Theia database connection established');
      console.log(`📊 Database: ${this.maskDatabaseUrl(this.config.databaseUrl)}`);
      
      return this.prisma;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
      console.log('🔌 Theia database connection closed');
    }
  }

  public getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.prisma;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.prisma) {
        return false;
      }
      
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public getConfig(): TheiaDbConfig {
    return { ...this.config };
  }

  private maskDatabaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      return urlObj.toString();
    } catch {
      return 'postgresql://***:***@localhost:5432/fuse';
    }
  }

  // Graceful shutdown handler
  public setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`🛑 Received ${signal}, closing database connection...`);
      await this.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }
}

// Export singleton instance
export const theiaDb = TheiaDbConnection.getInstance();

// Auto-setup graceful shutdown
theiaDb.setupGracefulShutdown();

/**
 * Utility function to get a connected Prisma client
 */
export async function getTheiaDbClient(): Promise<PrismaClient> {
  return await theiaDb.connect();
}

/**
 * Utility function for database health checks
 */
export async function checkTheiaDbHealth(): Promise<boolean> {
  return await theiaDb.healthCheck();
}

/**
 * Environment validation utility
 */
export function validateTheiaDbEnvironment(): void {
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure .env.theia is properly configured.'
    );
  }

  // Validate DATABASE_URL format
  try {
    new URL(process.env.DATABASE_URL!);
  } catch {
    throw new Error(
      'Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database'
    );
  }

  console.log('✅ Theia database environment validation passed');
}

// Validate environment on module load
try {
  validateTheiaDbEnvironment();
} catch (error) {
  console.error('❌ Theia database environment validation failed:', error.message);
  process.exit(1);
}
