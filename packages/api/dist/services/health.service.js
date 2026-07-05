/**
 * Health check service
 * Monitors the health of application dependencies
 * Updated to use Drizzle ORM instead of Drizzle
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
var HealthService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { HealthIndicator } from '@nestjs/terminus';
import { toError } from '../utils/error.js';
class HealthCheckError extends Error {
    constructor(message, causes) {
        super(message);
        this.causes = causes;
    }
}
let HealthService = HealthService_1 = class HealthService extends HealthIndicator {
    constructor(database) {
        super();
        this.database = database;
        this.logger = new Logger(HealthService_1.name);
    }
    async isHealthy(key) {
        try {
            // Check database connection using Drizzle
            const isHealthy = await this.database.healthCheck();
            if (!isHealthy) {
                throw new Error('Database connection check failed');
            }
            this.logger.log('Database health check successful');
            return this.getStatus(key, true);
        }
        catch (error) {
            const err = toError(error);
            this.logger.error('Database health check failed', err.stack);
            throw new HealthCheckError('Database health check failed', this.getStatus(key, false, { message: `Database connection failed: ${err.message}` }));
        }
    }
};
HealthService = HealthService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof DatabaseService !== "undefined" && DatabaseService) === "function" ? _a : Object])
], HealthService);
export { HealthService };
//# sourceMappingURL=health.service.js.map