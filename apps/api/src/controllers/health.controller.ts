import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@the-new-fuse/database';

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
@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Constructor for HealthController
   *
   * @param drizzle - Drizzle service for database connectivity testing
   *
   * @example
   * const controller = new HealthController(drizzle);
   */
  constructor(private readonly db: DatabaseService) {}

  @Get('errors')
  @ApiOperation({ summary: 'Get recent system errors for monitoring dashboard' })
  async getErrors(@Query('hours') hours?: string) {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000).toISOString();

    try {
      const errors = await this.db.executeRaw<any>(
        `SELECT id, action, "userId", "resourceType", status, "errorMessage", "createdAt"
         FROM "auditLogs"
         WHERE "createdAt" >= '${since}'
           AND (status = 'error' OR status = 'failed' OR action LIKE '%error%')
         ORDER BY "createdAt" DESC
         LIMIT 20`
      );
      return {
        count: errors.length,
        hours: hoursNum,
        errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        count: 0,
        hours: hoursNum,
        errors: [],
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
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
    } catch (error) {
      // Log error for debugging but don't throw exception
      // This allows the health endpoint to always respond
      console.error('Health check failed:', error);

      return {
        status: 'error',
        database: 'disconnected',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
