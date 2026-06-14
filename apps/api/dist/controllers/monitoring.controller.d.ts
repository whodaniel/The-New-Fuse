export declare class MonitoringController {
    private readonly memoryTrendBaselines;
    /**
     * Constructor for MonitoringController
     *
     * Initializes the monitoring controller with performance tracking capabilities.
     * This controller provides real-time system and application metrics.
     *
     * @example
     * const controller = new MonitoringController();
     */
    constructor();
    /**
     * Get real-time system performance metrics
     *
     * Collects and returns comprehensive performance metrics including CPU usage,
     * memory consumption, event loop latency, and system resource utilization.
     * This endpoint is optimized for high-frequency monitoring and dashboard updates.
     *
     * @returns Promise containing performance metrics
     * @returns.cpu - CPU usage statistics and load averages
     * @returns.memory - Memory usage and garbage collection metrics
     * @returns.eventLoop - Event loop delay and lag statistics
     * @returns.uptime - System and process uptime information
     * @returns.connections - Active connection counts
     * @returns.timestamp - Metrics collection timestamp
     *
     * @api
     * GET /monitoring/metrics
     *
     * @example
     * // Performance metrics response
     * {
     *   "cpu": {
     *     "usage": 25.5,
     *     "loadAverage": [1.2, 0.8, 0.6],
     *     "cores": 8,
     *     "model": "Intel(R) Core(TM) i7-9700K"
     *   },
     *   "memory": {
     *     "used": 2147483648,
     *     "total": 8589934592,
     *     "percentage": 25.0,
     *     "heapUsed": 104857600,
     *     "heapTotal": 157286400
     *   },
     *   "eventLoop": {
     *     "lag": 5.2,
     *     "delay": 1.8
     *   },
     *   "uptime": {
     *     "system": 86400,
     *     "process": 43200
     *   },
     *   "connections": {
     *     "active": 142,
     *     "total": 1200
     *   },
     *   "timestamp": "2025-11-05T02:17:55.000Z"
     * }
     */
    getMetrics(): Promise<{
        timestamp: string;
        cpu: {
            usage: number;
            loadAverage: number[];
            cores: number;
            model: string;
        };
        memory: {
            used: number;
            total: number;
            percentage: number;
            heapUsed: number;
            heapTotal: number;
            heapPercentage: number;
        };
        eventLoop: {
            lag: number;
            delay: number;
        };
        uptime: {
            system: number;
            process: number;
        };
        connections: {
            active: number;
            total: number;
        };
    }>;
    /**
     * Get memory usage and garbage collection statistics
     *
     * Provides detailed memory analysis including heap usage, garbage collection
     * frequency, and memory growth trends. This information is crucial for
     * identifying memory leaks and optimizing memory usage.
     *
     * @returns Promise containing memory statistics
     * @returns.heap - V8 heap memory usage details
     * @returns.external - External memory usage
     * @returns.arrayBuffers - Array buffer memory usage
     * @returns.gc - Garbage collection statistics
     * @returns.trends - Memory usage trends over time
     *
     * @api
     * GET /monitoring/memory
     *
     * @example
     * // Memory statistics response
     * {
     *   "heap": {
     *     "used": 104857600,
     *     "total": 157286400,
     *     "percentage": 66.7,
     *     "segments": 5
     *   },
     *   "external": 5242880,
     *   "arrayBuffers": 2097152,
     *   "gc": {
     *     "collections": 45,
     *     "totalTime": 1230,
     *     "avgTime": 27.3
     *   },
     *   "trends": {
     *     "growth": "stable",
     *     "lastHour": "+2.5MB",
     *     "lastDay": "+15.2MB"
     *   }
     * }
     */
    getMemory(): Promise<{
        timestamp: string;
        heap: {
            used: number;
            total: number;
            percentage: number;
            segments: number;
        };
        external: number;
        arrayBuffers: number;
        gc: {
            collections: number;
            totalTime: number;
            avgTime: number;
        };
        trends: {
            growth: string;
            lastHour: string;
            lastDay: string;
        };
    }>;
    /**
     * Get application-specific monitoring metrics
     *
     * Collects application-level metrics including request rates, response times,
     * error rates, and business logic performance. These metrics are essential
     * for understanding application health from a user perspective.
     *
     * @returns Promise containing application metrics
     * @returns.requests - HTTP request statistics
     * @returns.responses - Response time and status metrics
     * @returns.errors - Error tracking and analysis
     * @returns.throughput - Requests per second and data transfer rates
     * @returns.businessLogic - Application-specific business metrics
     *
     * @api
     * GET /monitoring/app-metrics
     *
     * @example
     * // Application metrics response
     * {
     *   "requests": {
     *     "total": 15420,
     *     "rate": 12.5,
     *     "peakRate": 45.2
     *   },
     *   "responses": {
     *     "avgTime": 245,
     *     "p50": 180,
     *     "p95": 890,
     *     "p99": 1450
     *   },
     *   "errors": {
     *     "total": 23,
     *     "rate": 0.02,
     *     "types": {
     *       "4xx": 15,
     *       "5xx": 8
     *     }
     *   },
     *   "throughput": {
     *     "requestsPerSec": 12.5,
     *     "dataInMB": 245.8,
     *     "dataOutMB": 892.3
     *   },
     *   "businessLogic": {
     *     "agentsActive": 38,
     *     "workflowsRunning": 12,
     *     "chatSessions": 25
     *   }
     * }
     */
    getAppMetrics(): Promise<void>;
    /**
     * Get comprehensive system health overview
     *
     * Provides a consolidated health check that combines multiple monitoring
     * perspectives. This endpoint is designed for health monitoring systems,
     * load balancers, and status page aggregators.
     *
     * @returns Promise containing health status
     * @returns.status - Overall system health status
     * @returns.score - Health score (0-100)
     * @returns.checks - Individual health check results
     * @returns.alerts - Active alerts or warnings
     * @returns.summary - Brief health summary
     *
     * @api
     * GET /monitoring/health
     *
     * @example
     * // Health overview response
     * {
     *   "status": "healthy",
     *   "score": 92,
     *   "checks": {
     *     "memory": "healthy",
     *     "cpu": "healthy",
     *     "database": "healthy",
     *     "services": "warning"
     *   },
     *   "alerts": [
     *     {
     *       "type": "warning",
     *       "message": "High memory usage detected",
     *       "metric": "memory",
     *       "value": 85
     *     }
     *   ],
     *   "summary": "System is healthy with minor memory usage concern"
     * }
     */
    getHealth(): Promise<{
        timestamp: string;
        status: string;
        score: number;
        checks: {
            memory: string;
            cpu: string;
            database: "healthy" | "unknown";
            services: "healthy" | "unknown";
        };
        alerts: {
            type: string;
            message: string;
            metric: string;
            value: number;
        }[];
        summary: string;
    }>;
    /**
     * Measure event loop lag
     *
     * Measures the delay in the Node.js event loop to identify performance
     * issues and blocking operations.
     *
     * @returns Promise resolving to event loop lag in milliseconds
     */
    private measureEventLoopLag;
    /**
     * Measure event loop delay
     *
     * Calculates the current event loop delay based on the time since
     * the last tick.
     *
     * @returns Event loop delay in milliseconds
     */
    private measureEventLoopDelay;
    /**
     * Get current CPU usage percentage
     *
     * Calculates the current CPU usage percentage using a sample-based approach.
     *
     * @returns Promise resolving to CPU usage percentage
     */
    private getCPUUsage;
    /**
     * Get garbage collection statistics
     *
     * Collects V8 garbage collection metrics including collection count
     * and timing information.
     *
     * @returns Promise resolving to GC statistics
     */
    private getGCStatistics;
    /**
     * Estimate heap segments
     *
     * Provides an estimate of V8 heap segments based on memory usage patterns.
     *
     * @returns Estimated number of heap segments
     */
    private estimateHeapSegments;
    /**
     * Analyze memory growth trend
     *
     * Analyzes recent memory usage patterns to identify growth trends.
     *
     * @returns Memory growth trend description
     */
    private analyzeMemoryGrowth;
    /**
     * Get memory trend for specific time period
     *
     * Calculates memory usage change over a specified time period.
     *
     * @param seconds - Time period in seconds
     * @returns Memory trend string
     */
    private getMemoryTrend;
    private getConnectionStats;
    /**
     * Calculate overall health score
     *
     * Calculates a composite health score based on individual check results.
     *
     * @param checks - Individual health check results
     * @returns Health score (0-100)
     */
    private calculateHealthScore;
    private getDatabaseHealthSignal;
    private getServiceHealthSignal;
    /**
     * Generate health summary
     *
     * Creates a human-readable summary of the overall system health.
     *
     * @param status - Overall health status
     * @param alerts - Array of active alerts
     * @returns Health summary string
     */
    private generateHealthSummary;
}
//# sourceMappingURL=monitoring.controller.d.ts.map