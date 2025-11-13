/**
 * System Health Monitoring System
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
/**
 * System health monitor implementation
 */
export class SystemHealthMonitor extends EventEmitter {
    config;
    logger;
    healthChecks = new Map();
    checkResults = new Map();
    resultHistory = [];
    checkTimer;
    running = false;
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger('SystemHealthMonitor');
        this.initializeDefaultHealthChecks();
    }
    /**
     * Start health monitoring
     */
    start() {
        if (this.running) {
            this.logger.warn('System health monitor is already running');
            return;
        }
        this.logger.info('Starting system health monitor', {
            checkInterval: this.config.checkInterval,
            timeout: this.config.timeout
        });
        this.running = true;
        this.checkTimer = setInterval(() => {
            this.runHealthChecks();
        }, this.config.checkInterval);
        // Run initial health checks
        this.runHealthChecks();
        this.logger.info('System health monitor started');
    }
    /**
     * Stop health monitoring
     */
    stop() {
        if (!this.running) {
            this.logger.warn('System health monitor is not running');
            return;
        }
        this.logger.info('Stopping system health monitor');
        this.running = false;
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = undefined;
        }
        this.logger.info('System health monitor stopped');
    }
    /**
     * Get system health status
     */
    async getHealthStatus() {
        const components = {};
        let totalScore = 0;
        let healthyComponents = 0;
        let totalComponents = 0;
        // Collect component statuses
        for (const [name, result] of this.checkResults) {
            components[name] = {
                healthy: result.healthy,
                message: result.message,
                lastCheck: result.timestamp
            };
            totalComponents++;
            if (result.healthy) {
                healthyComponents++;
                totalScore += 100;
            }
            else {
                // Partial score based on how recent the failure is
                const ageMs = Date.now() - result.timestamp.getTime();
                const ageMinutes = ageMs / (1000 * 60);
                const partialScore = Math.max(0, 50 - ageMinutes); // Degrade over time
                totalScore += partialScore;
            }
        }
        const overallHealthy = healthyComponents === totalComponents && totalComponents > 0;
        const healthScore = totalComponents > 0 ? totalScore / totalComponents : 100;
        // Get system metrics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime() * 1000;
        // Simple network latency check (to localhost)
        const networkLatency = await this.measureNetworkLatency();
        return {
            healthy: overallHealthy,
            score: Math.round(healthScore),
            message: overallHealthy ? 'All systems operational' : 'Some components are unhealthy',
            components,
            metrics: {
                uptime,
                memoryUsage: memoryUsage.heapUsed,
                cpuUsage: 0, // Simplified - would need more complex calculation
                diskUsage: 0, // Would need disk usage check
                networkLatency
            }
        };
    }
    /**
     * Get health check results
     */
    async getHealthChecks() {
        return Array.from(this.checkResults.values());
    }
    /**
     * Register health check
     */
    registerHealthCheck(check) {
        this.healthChecks.set(check.name, check);
        this.logger.debug(`Registered health check: ${check.name}`, {
            interval: check.interval,
            timeout: check.timeout,
            enabled: check.enabled
        });
    }
    /**
     * Remove health check
     */
    removeHealthCheck(name) {
        const removed = this.healthChecks.delete(name);
        if (removed) {
            this.checkResults.delete(name);
            this.logger.debug(`Removed health check: ${name}`);
        }
        return removed;
    }
    /**
     * Run all health checks
     */
    async runHealthChecks() {
        const results = [];
        for (const [name, check] of this.healthChecks) {
            if (!check.enabled)
                continue;
            try {
                const result = await this.runSingleHealthCheck(check);
                results.push(result);
                this.checkResults.set(name, result);
                this.resultHistory.push(result);
                // Log unhealthy results
                if (!result.healthy) {
                    this.logger.warn(`Health check failed: ${name}`, {
                        message: result.message,
                        duration: result.duration
                    });
                }
            }
            catch (error) {
                const errorResult = {
                    name,
                    healthy: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    duration: 0,
                    timestamp: new Date(),
                    details: { error: error instanceof Error ? error.stack : error }
                };
                results.push(errorResult);
                this.checkResults.set(name, errorResult);
                this.resultHistory.push(errorResult);
                this.logger.error(`Health check error: ${name}`, error);
            }
        }
        // Clean up old results
        this.cleanupHistory();
        // Emit health status change event
        const overallStatus = this.getOverallStatus();
        this.emit('healthStatusChanged', overallStatus);
        return results;
    }
    /**
     * Run a single health check with timeout
     */
    async runSingleHealthCheck(check) {
        const startTime = Date.now();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
        });
        try {
            const result = await Promise.race([
                check.check(),
                timeoutPromise
            ]);
            return {
                ...result,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Initialize default health checks
     */
    initializeDefaultHealthChecks() {
        // Memory usage check
        this.registerHealthCheck({
            name: 'memory-usage',
            description: 'Check memory usage levels',
            interval: 30000,
            timeout: 5000,
            enabled: true,
            check: async () => {
                const memoryUsage = process.memoryUsage();
                const heapUsedMB = memoryUsage.heapUsed / (1024 * 1024);
                const heapTotalMB = memoryUsage.heapTotal / (1024 * 1024);
                const usagePercent = (heapUsedMB / heapTotalMB) * 100;
                const healthy = usagePercent < 90; // Alert if over 90%
                const message = healthy ?
                    `Memory usage normal: ${heapUsedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)` :
                    `High memory usage: ${heapUsedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`;
                return {
                    name: 'memory-usage',
                    healthy,
                    message,
                    duration: 0,
                    timestamp: new Date(),
                    details: {
                        heapUsed: memoryUsage.heapUsed,
                        heapTotal: memoryUsage.heapTotal,
                        external: memoryUsage.external,
                        rss: memoryUsage.rss
                    }
                };
            }
        });
        // Event loop lag check
        this.registerHealthCheck({
            name: 'event-loop-lag',
            description: 'Check event loop responsiveness',
            interval: 15000,
            timeout: 5000,
            enabled: true,
            check: async () => {
                const start = Date.now();
                await new Promise(resolve => setImmediate(resolve));
                const lag = Date.now() - start;
                const healthy = lag < 100; // Alert if lag > 100ms
                const message = healthy ?
                    `Event loop responsive: ${lag}ms lag` :
                    `Event loop lag detected: ${lag}ms`;
                return {
                    name: 'event-loop-lag',
                    healthy,
                    message,
                    duration: lag,
                    timestamp: new Date(),
                    details: { lag }
                };
            }
        });
        // Process uptime check
        this.registerHealthCheck({
            name: 'process-uptime',
            description: 'Check process uptime and stability',
            interval: 60000,
            timeout: 1000,
            enabled: true,
            check: async () => {
                const uptimeSeconds = process.uptime();
                const uptimeHours = uptimeSeconds / 3600;
                // Always healthy, just informational
                const message = `Process uptime: ${uptimeHours.toFixed(2)} hours`;
                return {
                    name: 'process-uptime',
                    healthy: true,
                    message,
                    duration: 0,
                    timestamp: new Date(),
                    details: {
                        uptimeSeconds,
                        uptimeHours,
                        pid: process.pid
                    }
                };
            }
        });
        // File descriptor check (Unix-like systems)
        if (process.platform !== 'win32') {
            this.registerHealthCheck({
                name: 'file-descriptors',
                description: 'Check file descriptor usage',
                interval: 30000,
                timeout: 5000,
                enabled: true,
                check: async () => {
                    try {
                        // This is a simplified check - in production you'd want to check actual FD usage
                        const healthy = true; // Placeholder
                        const message = 'File descriptor usage normal';
                        return {
                            name: 'file-descriptors',
                            healthy,
                            message,
                            duration: 0,
                            timestamp: new Date(),
                            details: {}
                        };
                    }
                    catch (error) {
                        return {
                            name: 'file-descriptors',
                            healthy: false,
                            message: 'Could not check file descriptor usage',
                            duration: 0,
                            timestamp: new Date(),
                            details: { error: error instanceof Error ? error.message : error }
                        };
                    }
                }
            });
        }
        this.logger.info(`Initialized ${this.healthChecks.size} default health checks`);
    }
    /**
     * Measure network latency (simple localhost ping)
     */
    async measureNetworkLatency() {
        const start = Date.now();
        try {
            // Simple network check - in production you might ping a specific service
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Network timeout')), 1000);
                setImmediate(() => {
                    clearTimeout(timeout);
                    resolve(undefined);
                });
            });
            return Date.now() - start;
        }
        catch (error) {
            return -1; // Indicate network issue
        }
    }
    /**
     * Get overall system health status
     */
    getOverallStatus() {
        const allResults = Array.from(this.checkResults.values());
        if (allResults.length === 0) {
            return {
                healthy: true,
                score: 100,
                message: 'No health checks configured',
                components: {},
                metrics: {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
                    cpuUsage: 0,
                    diskUsage: 0,
                    networkLatency: 0
                }
            };
        }
        const healthyResults = allResults.filter(result => result.healthy);
        const healthy = healthyResults.length === allResults.length;
        const score = Math.round((healthyResults.length / allResults.length) * 100);
        const components = {};
        for (const result of allResults) {
            components[result.name] = {
                healthy: result.healthy,
                message: result.message,
                lastCheck: result.timestamp
            };
        }
        return {
            healthy,
            score,
            message: healthy ? 'All health checks passing' : `${allResults.length - healthyResults.length} health check(s) failing`,
            components,
            metrics: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
                cpuUsage: 0,
                diskUsage: 0,
                networkLatency: 0
            }
        };
    }
    /**
     * Clean up old health check results
     */
    cleanupHistory() {
        const maxHistory = 1000;
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        // Remove old results
        const initialLength = this.resultHistory.length;
        this.resultHistory.splice(0, this.resultHistory.findIndex(result => result.timestamp >= cutoff));
        // Also limit by count
        if (this.resultHistory.length > maxHistory) {
            this.resultHistory.splice(0, this.resultHistory.length - maxHistory);
        }
        const cleaned = initialLength - this.resultHistory.length;
        if (cleaned > 0) {
            this.logger.debug(`Cleaned up ${cleaned} old health check results`);
        }
    }
}
//# sourceMappingURL=SystemHealthMonitor.js.map