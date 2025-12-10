import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@the-new-fuse/database';

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
   * @param prisma - Prisma service for database connectivity testing
   * 
   * @example
   * const controller = new HealthController(prisma);
   */
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
      // Test database connectivity with a simple Prisma query
      // This validates that the database is reachable and responsive
      await this.prisma.$queryRaw`SELECT 1`;
      
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
