'use strict';
/**
 * Health Check System
 * Provides comprehensive health checking for all service dependencies
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CommonHealthChecks = exports.HealthCheckService = void 0;
const events_1 = require('events');
/**
 * Health Check Service
 */
class HealthCheckService extends events_1.EventEmitter {
  checks = new Map();
  results = new Map();
  startTime;
  intervalId;
  config;
  constructor(config) {
    super();
    this.startTime = new Date();
    this.config = {
      checkInterval: config?.checkInterval || 30000, // 30 seconds
      timeout: config?.timeout || 5000, // 5 seconds
    };
  }
  /**
   * Register a health check
   */
  register(name, check) {
    this.checks.set(name, check);
    this.emit('checkRegistered', name);
  }
  /**
   * Unregister a health check
   */
  unregister(name) {
    this.checks.delete(name);
    this.results.delete(name);
    this.emit('checkUnregistered', name);
  }
  /**
   * Run all health checks
   */
  async check() {
    const checkPromises = [];
    for (const [name, checkFn] of this.checks.entries()) {
      checkPromises.push(this.runCheck(name, checkFn));
    }
    const checkResults = await Promise.all(checkPromises);
    // Update results
    checkResults.forEach(([name, result]) => {
      this.results.set(name, result);
    });
    // Calculate overall status
    const services = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;
    let totalResponseTime = 0;
    for (const [name, result] of this.results.entries()) {
      services[name] = result;
      totalResponseTime += result.responseTime;
      switch (result.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'unhealthy':
          unhealthyCount++;
          break;
      }
    }
    const totalChecks = this.results.size;
    const averageResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0;
    // Determine overall status
    let overallStatus = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }
    const status = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      metrics: {
        totalChecks,
        healthyChecks: healthyCount,
        degradedChecks: degradedCount,
        unhealthyChecks: unhealthyCount,
        averageResponseTime,
      },
    };
    this.emit('healthCheck', status);
    // Emit alerts for unhealthy services
    if (overallStatus !== 'healthy') {
      this.emit('healthAlert', status);
    }
    return status;
  }
  /**
   * Run a single health check with timeout
   */
  async runCheck(name, checkFn) {
    const startTime = Date.now();
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout);
      });
      const result = await Promise.race([checkFn(), timeoutPromise]);
      const serviceHealth = {
        name,
        status: result.status,
        timestamp: result.timestamp,
        responseTime: Date.now() - startTime,
        message: result.message,
        details: result.details,
      };
      return [name, serviceHealth];
    } catch (error) {
      const serviceHealth = {
        name,
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        message: 'Health check failed',
        error: error.message,
      };
      return [name, serviceHealth];
    }
  }
  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    if (this.intervalId) {
      return;
    }
    this.intervalId = setInterval(async () => {
      try {
        await this.check();
      } catch (error) {
        console.error('Error during periodic health check:', error);
      }
    }, this.config.checkInterval);
    this.emit('periodicChecksStarted');
  }
  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.emit('periodicChecksStopped');
    }
  }
  /**
   * Get current health status
   */
  getStatus() {
    if (this.results.size === 0) {
      return null;
    }
    const services = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;
    let totalResponseTime = 0;
    for (const [name, result] of this.results.entries()) {
      services[name] = result;
      totalResponseTime += result.responseTime;
      switch (result.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'unhealthy':
          unhealthyCount++;
          break;
      }
    }
    const totalChecks = this.results.size;
    const averageResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0;
    let overallStatus = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }
    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      metrics: {
        totalChecks,
        healthyChecks: healthyCount,
        degradedChecks: degradedCount,
        unhealthyChecks: unhealthyCount,
        averageResponseTime,
      },
    };
  }
}
exports.HealthCheckService = HealthCheckService;
/**
 * Common health check implementations
 */
class CommonHealthChecks {
  /**
   * Database health check
   */
  static database(client, queryFn) {
    return async () => {
      const startTime = Date.now();
      try {
        if (queryFn) {
          await queryFn();
        } else if (client.$queryRaw) {
          // Drizzle
          await client.$queryRaw`SELECT 1`;
        } else if (client.query) {
          // pg, mysql2
          await client.query('SELECT 1');
        } else {
          throw new Error('Unsupported database client');
        }
        return {
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: 'Database connection is healthy',
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `Database connection failed: ${error.message}`,
        };
      }
    };
  }
  /**
   * Redis health check
   */
  static redis(client) {
    return async () => {
      const startTime = Date.now();
      try {
        await client.ping();
        return {
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: 'Redis connection is healthy',
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `Redis connection failed: ${error.message}`,
        };
      }
    };
  }
  /**
   * HTTP service health check
   */
  static httpService(url, timeout = 5000) {
    return async () => {
      const startTime = Date.now();
      try {
        const axios = await import('axios');
        const response = await axios.default.get(url, { timeout });
        const duration = Date.now() - startTime;
        const status = response.status === 200 ? 'healthy' : 'degraded';
        return {
          status,
          timestamp: new Date(),
          duration,
          message: `HTTP service responded with status ${response.status}`,
          details: {
            statusCode: response.status,
            responseTime: duration,
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `HTTP service check failed: ${error.message}`,
        };
      }
    };
  }
  /**
   * Memory usage health check
   */
  static memory(thresholdPercent = 90) {
    return async () => {
      const startTime = Date.now();
      try {
        const usage = process.memoryUsage();
        const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
        let status = 'healthy';
        if (heapUsedPercent >= thresholdPercent) {
          status = 'unhealthy';
        } else if (heapUsedPercent >= thresholdPercent * 0.8) {
          status = 'degraded';
        }
        return {
          status,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `Memory usage: ${heapUsedPercent.toFixed(2)}%`,
          details: {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss,
            heapUsedPercent,
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `Memory check failed: ${error.message}`,
        };
      }
    };
  }
  /**
   * Disk space health check
   */
  static diskSpace(path = '/', thresholdPercent = 90) {
    return async () => {
      const startTime = Date.now();
      try {
        // Note: This requires 'check-disk-space' package
        // @ts-ignore
        const checkDiskSpaceModule = await import('check-disk-space').catch(() => null);
        if (!checkDiskSpaceModule) {
          return {
            status: 'degraded',
            timestamp: new Date(),
            duration: Date.now() - startTime,
            message: 'Disk space check not available (install check-disk-space)',
          };
        }
        // Handle module resolution differences
        // Cast to any to avoid TS issue where it thinks default export is the namespace
        const checkDiskSpace = checkDiskSpaceModule.default;
        const diskSpace = await checkDiskSpace(path);
        const usedPercent = ((diskSpace.size - diskSpace.free) / diskSpace.size) * 100;
        let status = 'healthy';
        if (usedPercent >= thresholdPercent) {
          status = 'unhealthy';
        } else if (usedPercent >= thresholdPercent * 0.8) {
          status = 'degraded';
        }
        return {
          status,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `Disk usage: ${usedPercent.toFixed(2)}%`,
          details: {
            size: diskSpace.size,
            free: diskSpace.free,
            usedPercent,
          },
        };
      } catch (error) {
        return {
          status: 'degraded',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: `Disk space check failed: ${error.message}`,
        };
      }
    };
  }
}
exports.CommonHealthChecks = CommonHealthChecks;
//# sourceMappingURL=health-check.js.map
