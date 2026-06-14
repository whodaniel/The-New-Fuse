/**
 * Database Service
 * Handles database connections using Drizzle ORM
 * This replaces the legacy DrizzleService
 */
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
var DatabaseService_1;
import { Injectable, Logger, Inject } from '@nestjs/common';
import { DRIZZLE_CLIENT, sql } from '@the-new-fuse/database';
let DatabaseService = DatabaseService_1 = class DatabaseService {
    constructor(db) {
        this.db = db;
        this.logger = new Logger(DatabaseService_1.name);
    }
    /**
     * Get the database client instance
     */
    get client() {
        return this.db;
    }
    /**
     * Initialize connection when module starts
     */
    async onModuleInit() {
        this.logger.log('Initializing database connection...');
        try {
            // Test the connection
            await this.healthCheck();
            this.logger.log('Database connection established');
        }
        catch (error) {
            const err = error;
            this.logger.error(`Failed to connect to database: ${err.message}`, err.stack);
            throw error;
        }
    }
    /**
     * Close connection when module shuts down
     */
    async onModuleDestroy() {
        this.logger.log('Database service shutting down...');
        // postgres.js handles cleanup automatically
    }
    /**
     * Execute a raw SQL query
     */
    async executeRaw(query) {
        return this.db.execute(sql.raw(query));
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
     * Enable shutdown hooks for graceful shutdown
     */
    async enableShutdownHooks(app) {
        this.logger.log('Enabling shutdown hooks...');
        // Handle SIGINT
        process.on('SIGINT', async () => {
            this.logger.log('Received SIGINT, shutting down...');
            await app.close();
        });
        // Handle SIGTERM
        process.on('SIGTERM', async () => {
            this.logger.log('Received SIGTERM, shutting down...');
            await app.close();
        });
    }
};
DatabaseService = DatabaseService_1 = __decorate([
    Injectable(),
    __param(0, Inject(DRIZZLE_CLIENT)),
    __metadata("design:paramtypes", [Object])
], DatabaseService);
export { DatabaseService };
// Export the service class as default as well
export default DatabaseService;
//# sourceMappingURL=database.service.js.map