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
export declare class HealthController {
    private readonly db;
    /**
     * Constructor for HealthController
     *
     * @param drizzle - Drizzle service for database connectivity testing
     *
     * @example
     * const controller = new HealthController(drizzle);
     */
    constructor(db: DatabaseService);
    getErrors(hours?: string): Promise<{
        count: number;
        hours: number;
        errors: any[];
        timestamp: string;
        error?: undefined;
    } | {
        count: number;
        hours: number;
        errors: never[];
        error: string;
        timestamp: string;
    }>;
    check(): Promise<{
        status: string;
        database: string;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        database: string;
        error: string;
        timestamp: string;
    }>;
}
//# sourceMappingURL=health.controller.d.ts.map