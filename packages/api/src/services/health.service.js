/**
 * Health check service
 * Monitors the health of application dependencies
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
import { PrismaService } from './prisma.service';
import { HealthIndicator } from '@nestjs/terminus';
class HealthCheckError extends Error {
    causes;
    constructor(message, causes) {
        super(message);
        this.causes = causes;
    }
}
let HealthService = HealthService_1 = class HealthService extends HealthIndicator {
    prisma;
    logger = new Logger(HealthService_1.name);
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async isHealthy(key) {
        try {
            // Check database connection
            await this.prisma.$queryRaw `SELECT 1;
      this.logger.log('Database health check successful');
      return this.getStatus(key, true);
    } catch (error) { // Change to unknown
      const err = toError(error); // Use helper
      this.logger.error('Database health check failed', err.stack); // Use err.stack
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, { message: Database connection failed: ${err.message}`;
        }
        finally { // Use err.message
         } // Use err.message
        ;
    }
};
HealthService = HealthService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], HealthService);
export { HealthService };
//# sourceMappingURL=health.service.js.map