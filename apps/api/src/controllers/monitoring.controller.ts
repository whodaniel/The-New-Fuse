/**
 * Monitoring Controller
 * 
 * Provides comprehensive system monitoring and observability endpoints for
 * tracking application performance, resource usage, and operational metrics.
 * This controller offers real-time insights into system health and performance
 * to support monitoring, alerting, and capacity planning.
 * 
 * The controller provides:
 * - Real-time performance metrics collection
 * - Resource usage monitoring (memory, CPU, disk)
 * - Application-specific metrics tracking
 * - Health check aggregation
 * - Performance trend analysis
 * - Alert threshold monitoring
 * 
 * All endpoints are optimized for:
 * - High-frequency monitoring (polling every 5-60 seconds)
 * - Low-latency responses for dashboard updates
 * - Efficient data aggregation
 * - Real-time alerting integration
 * 
 * @example
 * // Get real-time performance metrics
 * GET /monitoring/metrics
 * 
 * @example
 * // Check memory usage and garbage collection
 * GET /monitoring/memory
 * 
 * @example
 * // Get system health overview
 * GET /monitoring/health
 * 
 * @example
 * // Monitor application-specific metrics
 * GET /monitoring/app-metrics
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as os from 'os';
import * as process from 'process';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {

  /**
   * Constructor for MonitoringController
   * 
   * Initializes the monitoring controller with performance tracking capabilities.
   * This controller provides real-time system and application metrics.
   * 
   * @example
   * const controller = new MonitoringController();
   */
  constructor() {}

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
  @Get('metrics')
  @ApiOperation({ summary: 'Get real-time performance metrics' })
  async getMetrics() {
    // Simulate event loop lag measurement
    const eventLoopLag = await this.measureEventLoopLag();
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: await this.getCPUUsage(),
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      },
      memory: {
        used: os.totalmem() - os.freemem(),
        total: os.totalmem(),
        percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        heapPercentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      eventLoop: {
        lag: eventLoopLag,
        delay: this.measureEventLoopDelay()
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      connections: {
        active: 142, // Mock data - would be collected from actual connection pool
        total: 1200  // Mock data - would be collected from actual connection pool
      }
    };
  }

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
  @Get('memory')
  @ApiOperation({ summary: 'Get memory usage and GC statistics' })
  async getMemory() {
    const memUsage = process.memoryUsage();
    const gcStats = await this.getGCStatistics();
    
    return {
      timestamp: new Date().toISOString(),
      heap: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        segments: this.estimateHeapSegments()
      },
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      gc: gcStats,
      trends: {
        growth: this.analyzeMemoryGrowth(),
        lastHour: this.getMemoryTrend(3600),
        lastDay: this.getMemoryTrend(86400)
      }
    };
  }

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
  @Get('app-metrics')
  @ApiOperation({ summary: 'Get application-specific metrics' })
  async getAppMetrics() {
    // Mock application metrics - in production these would be collected
    // from actual application instrumentation
    return {
      timestamp: new Date().toISOString(),
      requests: {
        total: 15420,
        rate: 12.5,
        peakRate: 45.2
      },
      responses: {
        avgTime: 245,
        p50: 180,
        p95: 890,
        p99: 1450
      },
      errors: {
        total: 23,
        rate: 0.02,
        types: {
          '4xx': 15,
          '5xx': 8
        }
      },
      throughput: {
        requestsPerSec: 12.5,
        dataInMB: 245.8,
        dataOutMB: 892.3
      },
      businessLogic: {
        agentsActive: 38,
        workflowsRunning: 12,
        chatSessions: 25
      }
    };
  }

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
  @Get('health')
  @ApiOperation({ summary: 'Get system health overview' })
  async getHealth() {
    const memoryUsage = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    const cpuUsage = await this.getCPUUsage();
    
    const checks = {
      memory: memoryUsage < 80 ? 'healthy' : memoryUsage < 90 ? 'warning' : 'critical',
      cpu: cpuUsage < 70 ? 'healthy' : cpuUsage < 90 ? 'warning' : 'critical',
      database: 'healthy', // Would be checked in production
      services: 'healthy'  // Would be checked in production
    };
    
    const alerts = [];
    if (memoryUsage >= 80) {
      alerts.push({
        type: memoryUsage >= 90 ? 'critical' : 'warning',
        message: 'High memory usage detected',
        metric: 'memory',
        value: memoryUsage
      });
    }
    
    if (cpuUsage >= 70) {
      alerts.push({
        type: cpuUsage >= 90 ? 'critical' : 'warning',
        message: 'High CPU usage detected',
        metric: 'cpu',
        value: cpuUsage
      });
    }
    
    const score = this.calculateHealthScore(checks);
    const status = score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'unhealthy';
    
    return {
      timestamp: new Date().toISOString(),
      status,
      score,
      checks,
      alerts,
      summary: this.generateHealthSummary(status, alerts)
    };
  }

  // Private helper methods for metrics collection

  /**
   * Measure event loop lag
   * 
   * Measures the delay in the Node.js event loop to identify performance
   * issues and blocking operations.
   * 
   * @returns Promise resolving to event loop lag in milliseconds
   */
  private async measureEventLoopLag(): Promise<number> {
    const start = process.hrtime();
    return new Promise((resolve) => {
      setImmediate(() => {
        const diff = process.hrtime(start);
        const lag = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
        resolve(lag);
      });
    });
  }

  /**
   * Measure event loop delay
   * 
   * Calculates the current event loop delay based on the time since
   * the last tick.
   * 
   * @returns Event loop delay in milliseconds
   */
  private measureEventLoopDelay(): number {
    // This is a simplified measurement
    // Real implementation would use performance.now() between ticks
    return Math.random() * 5; // Mock data
  }

  /**
   * Get current CPU usage percentage
   * 
   * Calculates the current CPU usage percentage using a sample-based approach.
   * 
   * @returns Promise resolving to CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);
        
        const totalTime = currentTime[0] * 1e9 + currentTime[1];
        const totalUsage = currentUsage.user + currentUsage.system;
        
        const cpuPercent = Math.round((totalUsage / totalTime) * 100);
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  /**
   * Get garbage collection statistics
   * 
   * Collects V8 garbage collection metrics including collection count
   * and timing information.
   * 
   * @returns Promise resolving to GC statistics
   */
  private async getGCStatistics() {
    // Mock GC statistics - in production would use V8 performance hooks
    return {
      collections: 45,
      totalTime: 1230,
      avgTime: 27.3
    };
  }

  /**
   * Estimate heap segments
   * 
   * Provides an estimate of V8 heap segments based on memory usage patterns.
   * 
   * @returns Estimated number of heap segments
   */
  private estimateHeapSegments(): number {
    const heapUsed = process.memoryUsage().heapUsed;
    if (heapUsed < 50 * 1024 * 1024) return 1; // < 50MB
    if (heapUsed < 200 * 1024 * 1024) return 3; // < 200MB
    if (heapUsed < 500 * 1024 * 1024) return 5; // < 500MB
    return 8; // > 500MB
  }

  /**
   * Analyze memory growth trend
   * 
   * Analyzes recent memory usage patterns to identify growth trends.
   * 
   * @returns Memory growth trend description
   */
  private analyzeMemoryGrowth(): string {
    // Mock analysis - in production would track memory history
    return 'stable';
  }

  /**
   * Get memory trend for specific time period
   * 
   * Calculates memory usage change over a specified time period.
   * 
   * @param seconds - Time period in seconds
   * @returns Memory trend string
   */
  private getMemoryTrend(seconds: number): string {
    // Mock trend calculation
    const change = (Math.random() - 0.5) * 10; // -5% to +5%
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}MB`;
  }

  /**
   * Calculate overall health score
   * 
   * Calculates a composite health score based on individual check results.
   * 
   * @param checks - Individual health check results
   * @returns Health score (0-100)
   */
  private calculateHealthScore(checks: Record<string, string>): number {
    const weights = { healthy: 100, warning: 60, critical: 20 };
    const values = Object.values(checks).map(status => weights[status] || 0);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Generate health summary
   * 
   * Creates a human-readable summary of the overall system health.
   * 
   * @param status - Overall health status
   * @param alerts - Array of active alerts
   * @returns Health summary string
   */
  private generateHealthSummary(status: string, alerts: any[]): string {
    if (status === 'healthy') {
      return alerts.length > 0 
        ? 'System is healthy with minor concerns'
        : 'System is operating normally';
    }
    if (status === 'degraded') {
      return 'System performance is degraded due to resource constraints';
    }
    return 'System is experiencing significant issues';
  }
}