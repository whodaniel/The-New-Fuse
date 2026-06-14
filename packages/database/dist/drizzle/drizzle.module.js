var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DrizzleModule_1;
/**
 * Drizzle ORM NestJS Module
 * Provides dependency injection for the Drizzle database client
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { DatabaseService } from './database.service.js';
// Injection token for the Drizzle client
export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');
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
let DrizzleModule = DrizzleModule_1 = class DrizzleModule {
    /**
     * Register the module with default configuration (uses DATABASE_URL env var)
     */
    static forRoot(options) {
        const drizzleProvider = {
            provide: DRIZZLE_CLIENT,
            useFactory: () => {
                const connectionString = options?.connectionString ?? process.env.DATABASE_URL;
                if (!connectionString) {
                    console.warn('DrizzleModule: No DATABASE_URL configured. Database features will be unavailable.');
                    return null;
                }
                try {
                    const queryClient = postgres(connectionString, {
                        max: options?.maxConnections ?? 10,
                        idle_timeout: options?.idleTimeout ?? 20,
                        connect_timeout: options?.connectTimeout ?? 10,
                    });
                    return drizzle(queryClient, { schema });
                }
                catch (error) {
                    console.error('DrizzleModule: Failed to create database connection.', error);
                    return null;
                }
            },
        };
        return {
            module: DrizzleModule_1,
            providers: [drizzleProvider, DatabaseService],
            exports: [DRIZZLE_CLIENT, DatabaseService],
        };
    }
    /**
     * Register the module with async configuration (uses ConfigService)
     */
    static forRootAsync() {
        const drizzleProvider = {
            provide: DRIZZLE_CLIENT,
            inject: [ConfigService],
            useFactory: (configService) => {
                const connectionString = configService.get('DATABASE_URL');
                if (!connectionString) {
                    console.warn('DrizzleModule: No DATABASE_URL configured. Database features will be unavailable.');
                    return null;
                }
                const maxConnections = configService.get('DB_MAX_CONNECTIONS') ?? 10;
                const idleTimeout = configService.get('DB_IDLE_TIMEOUT') ?? 20;
                const connectTimeout = configService.get('DB_CONNECT_TIMEOUT') ?? 10;
                try {
                    const queryClient = postgres(connectionString, {
                        max: maxConnections,
                        idle_timeout: idleTimeout,
                        connect_timeout: connectTimeout,
                    });
                    return drizzle(queryClient, { schema });
                }
                catch (error) {
                    console.error('DrizzleModule: Failed to create database connection.', error);
                    return null;
                }
            },
        };
        return {
            module: DrizzleModule_1,
            imports: [ConfigModule],
            providers: [drizzleProvider, DatabaseService],
            exports: [DRIZZLE_CLIENT, DatabaseService],
        };
    }
};
DrizzleModule = DrizzleModule_1 = __decorate([
    Global(),
    Module({})
], DrizzleModule);
export { DrizzleModule };
/**
 * Drizzle Service - Alternative injectable wrapper
 */
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
let DrizzleService = class DrizzleService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Get the database client instance
     */
    get client() {
        return this.db;
    }
    /**
     * Execute a raw SQL query
     */
    async executeRaw(query, params) {
        const result = await this.db.execute(sql.raw(query));
        return result;
    }
    /**
     * Health check - verify database connectivity
     */
    async healthCheck() {
        try {
            await this.db.execute(sql `SELECT 1`);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Cleanup on module destroy
     */
    async onModuleDestroy() {
        // postgres.js handles cleanup automatically
        console.log('Drizzle module shutting down');
    }
};
DrizzleService = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], DrizzleService);
export { DrizzleService };
//# sourceMappingURL=drizzle.module.js.map