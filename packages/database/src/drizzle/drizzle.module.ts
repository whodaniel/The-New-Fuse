/**
 * Drizzle ORM NestJS Module
 * Provides dependency injection for the Drizzle database client
 */
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DatabaseService } from './database.service';

// Injection token for the Drizzle client
export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');

// Type for the database instance
export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

export interface DrizzleModuleOptions {
  connectionString?: string;
  maxConnections?: number;
  idleTimeout?: number;
  connectTimeout?: number;
}

/**
 * Drizzle Database Module for NestJS
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [DrizzleModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 *
 * Then inject the client:
 * ```typescript
 * constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleClient) {}
 * // OR use DatabaseService (also available as DrizzleService alias):
 * constructor(private db: DatabaseService) {}
 * ```
 */
@Global()
@Module({})
export class DrizzleModule {
  /**
   * Register the module with default configuration (uses DATABASE_URL env var)
   */
  static forRoot(options?: DrizzleModuleOptions): DynamicModule {
    const drizzleProvider: Provider = {
      provide: DRIZZLE_CLIENT,
      useFactory: () => {
        const connectionString =
          options?.connectionString ??
          process.env.DATABASE_URL ??
          'postgresql://localhost:5432/fuse';

        const queryClient = postgres(connectionString, {
          max: options?.maxConnections ?? 10,
          idle_timeout: options?.idleTimeout ?? 20,
          connect_timeout: options?.connectTimeout ?? 10,
        });

        return drizzle(queryClient, { schema });
      },
    };

    return {
      module: DrizzleModule,
      providers: [drizzleProvider, DatabaseService],
      exports: [DRIZZLE_CLIENT, DatabaseService],
    };
  }

  /**
   * Register the module with async configuration (uses ConfigService)
   */
  static forRootAsync(): DynamicModule {
    const drizzleProvider: Provider = {
      provide: DRIZZLE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString =
          configService.get<string>('DATABASE_URL') ?? 'postgresql://localhost:5432/fuse';

        const maxConnections = configService.get<number>('DB_MAX_CONNECTIONS') ?? 10;
        const idleTimeout = configService.get<number>('DB_IDLE_TIMEOUT') ?? 20;
        const connectTimeout = configService.get<number>('DB_CONNECT_TIMEOUT') ?? 10;

        const queryClient = postgres(connectionString, {
          max: maxConnections,
          idle_timeout: idleTimeout,
          connect_timeout: connectTimeout,
        });

        return drizzle(queryClient, { schema });
      },
    };

    return {
      module: DrizzleModule,
      imports: [ConfigModule],
      providers: [drizzleProvider, DatabaseService],
      exports: [DRIZZLE_CLIENT, DatabaseService],
    };
  }
}

/**
 * Drizzle Service - Alternative injectable wrapper
 */
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { sql } from 'drizzle-orm';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  /**
   * Get the database client instance
   */
  get client(): DrizzleClient {
    return this.db;
  }

  /**
   * Execute a raw SQL query
   */
  async executeRaw<T = unknown>(query: string, params?: unknown[]): Promise<T[]> {
    const result = await this.db.execute(sql.raw(query));
    return result as T[];
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    // postgres.js handles cleanup automatically
    console.log('Drizzle module shutting down');
  }
}
