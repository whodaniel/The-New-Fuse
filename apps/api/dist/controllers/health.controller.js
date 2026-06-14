"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const database_1 = require("@the-new-fuse/database");
/**
 * Health Controller
 *
 * Provides system health monitoring and status checking capabilities.
 * This controller offers lightweight health checks that are optimized
 * for high-frequency monitoring by load balancers, container orchestrators,
 * and monitoring systems.
 *
 * The health endpoint is designed for:
 * - Load balancer health checks
 * - Container orchestration health monitoring
 * - Service mesh health verification
 * - Basic system status reporting
 * - Quick connectivity validation
 *
 * Health check features:
 * - Database connectivity validation
 * - Fast response times for monitoring systems
 * - Minimal resource usage
 * - Comprehensive error reporting
 * - Time-based status tracking
 *
 * @security PUBLIC - No authentication required
 * @rateLimiting Minimal rate limiting to allow frequent health checks
 *
 * @optimization This endpoint is optimized for minimal latency and
 * resource usage to support frequent health checks without impacting
 * system performance.
 *
 * @example
 * // Basic health check
 * GET /health
 *
 * @example
 * // Kubernetes liveness probe
 * httpGet:
 *   path: /health
 *   port: 3000
 *   scheme: HTTP
 *   initialDelaySeconds: 30
 *   periodSeconds: 10
 */
let HealthController = class HealthController {
    /**
     * Constructor for HealthController
     *
     * @param drizzle - Drizzle service for database connectivity testing
     *
     * @example
     * const controller = new HealthController(drizzle);
     */
    constructor(db) {
        this.db = db;
    }
    async getErrors(hours) {
        const hoursNum = hours ? parseInt(hours, 10) : 24;
        const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000).toISOString();
        try {
            const errors = await this.db.executeRaw(`SELECT id, action, "userId", "resourceType", status, "errorMessage", "createdAt"
         FROM "auditLogs"
         WHERE "createdAt" >= '${since}'
           AND (status = 'error' OR status = 'failed' OR action LIKE '%error%')
         ORDER BY "createdAt" DESC
         LIMIT 20`);
            return {
                count: errors.length,
                hours: hoursNum,
                errors,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                count: 0,
                hours: hoursNum,
                errors: [],
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
    /**
     * Check system health status
     *
     * Performs a comprehensive but lightweight health check including
     * database connectivity validation. This endpoint is designed to be
     * called frequently by monitoring systems and should respond quickly
     * even under high load.
     *
     * Health checks performed:
     * - Database connectivity test (SELECT 1 query)
     * - Service availability validation
     * - Error condition reporting
     *
     * @returns Promise containing health status information
     * @returns.status - Overall health status ('ok' or 'error')
     * @returns.database - Database connection status ('connected' or 'disconnected')
     * @returns.timestamp - Health check execution timestamp
     * @returns.error - Error message if health check failed
     *
     * @throws No exceptions thrown - all errors are reported in response
     *
     * @api
     * GET /health
     * @security PUBLIC - No authentication required
     * @rateLimit - High frequency allowed (unlimited for monitoring)
     *
     * @monitoring This endpoint is designed for high-frequency monitoring.
     * Response time should be under 100ms for optimal monitoring performance.
     *
     * @example
     * // Successful health check response
     * {
     *   "status": "ok",
     *   "database": "connected",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     *
     * @example
     * // Failed health check response
     * {
     *   "status": "error",
     *   "database": "disconnected",
     *   "error": "Connection refused",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    async check() {
        try {
            // Test database connectivity with a simple query
            // This validates that the database is reachable and responsive
            await this.db.executeRaw('SELECT 1');
            return {
                status: 'ok',
                database: 'connected',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            // Log error for debugging but don't throw exception
            // This allows the health endpoint to always respond
            console.error('Health check failed:', error);
            return {
                status: 'error',
                database: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('errors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent system errors for monitoring dashboard' }),
    __param(0, (0, common_1.Query)('hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getErrors", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' })
    /**
     * Check system health status
     *
     * Performs a comprehensive but lightweight health check including
     * database connectivity validation. This endpoint is designed to be
     * called frequently by monitoring systems and should respond quickly
     * even under high load.
     *
     * Health checks performed:
     * - Database connectivity test (SELECT 1 query)
     * - Service availability validation
     * - Error condition reporting
     *
     * @returns Promise containing health status information
     * @returns.status - Overall health status ('ok' or 'error')
     * @returns.database - Database connection status ('connected' or 'disconnected')
     * @returns.timestamp - Health check execution timestamp
     * @returns.error - Error message if health check failed
     *
     * @throws No exceptions thrown - all errors are reported in response
     *
     * @api
     * GET /health
     * @security PUBLIC - No authentication required
     * @rateLimit - High frequency allowed (unlimited for monitoring)
     *
     * @monitoring This endpoint is designed for high-frequency monitoring.
     * Response time should be under 100ms for optimal monitoring performance.
     *
     * @example
     * // Successful health check response
     * {
     *   "status": "ok",
     *   "database": "connected",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     *
     * @example
     * // Failed health check response
     * {
     *   "status": "error",
     *   "database": "disconnected",
     *   "error": "Connection refused",
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], HealthController);
//# sourceMappingURL=health.controller.js.map