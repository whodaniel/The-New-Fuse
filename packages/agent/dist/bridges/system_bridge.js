"use strict";
/**
 * System Bridge - System-level communication and monitoring
 *
 * Provides bridge functionality for system-level operations:
 * - Process management
 * - System metrics collection
 * - Resource monitoring
 * - Health checks
 * - Environment management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemBridge = void 0;
const index_js_1 = require("./index.js");
// ============================================================
// SYSTEM BRIDGE
// ============================================================
class SystemBridge extends index_js_1.BaseBridge {
    constructor() {
        super('system-bridge');
        this.healthChecks = new Map();
        this.metricsInterval = null;
        this.eventLog = [];
        this.maxEventLogSize = 1000;
        this.metricsCollectionInterval = 10000;
        this.registerDefaultHealthChecks();
    }
    async connect() {
        this.emit('connecting');
        // Start metrics collection
        this.startMetricsCollection();
        // Log startup event
        this.logEvent({
            type: 'startup',
            source: 'system-bridge',
            message: 'System bridge connected',
            timestamp: new Date(),
        });
        this.isConnected = true;
        this.emit('connected');
    }
    async disconnect() {
        this.stopMetricsCollection();
        this.logEvent({
            type: 'shutdown',
            source: 'system-bridge',
            message: 'System bridge disconnecting',
            timestamp: new Date(),
        });
        this.isConnected = false;
        this.emit('disconnected');
    }
    async sendMessage(message, messageType = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const action = message.action;
        switch (action) {
            case 'get-metrics':
                const metrics = await this.collectMetrics();
                this.emit('metrics', metrics);
                break;
            case 'health-check':
                const health = await this.runHealthChecks();
                this.emit('health', health);
                break;
            case 'get-events':
                this.emit('events', this.getRecentEvents(message.count));
                break;
            default:
                this.emit('message', { action, message });
        }
    }
    // ============================================================
    // METRICS COLLECTION
    // ============================================================
    /**
     * Collect system metrics
     */
    async collectMetrics() {
        const startTime = Date.now();
        // Simulate metrics collection (in production, use os module or system calls)
        const metrics = {
            cpu: {
                usage: Math.random() * 100,
                cores: 8,
            },
            memory: {
                total: 16 * 1024 * 1024 * 1024, // 16GB
                used: Math.random() * 8 * 1024 * 1024 * 1024,
                free: 8 * 1024 * 1024 * 1024,
                percentage: Math.random() * 100,
            },
            uptime: process.uptime(),
            loadAverage: [Math.random() * 4, Math.random() * 4, Math.random() * 4],
            processCount: 100 + Math.floor(Math.random() * 50),
        };
        // Calculate free memory
        metrics.memory.free = metrics.memory.total - metrics.memory.used;
        metrics.memory.percentage = (metrics.memory.used / metrics.memory.total) * 100;
        this.emit('metrics:collected', {
            metrics,
            duration: Date.now() - startTime,
        });
        return metrics;
    }
    /**
     * Start periodic metrics collection
     */
    startMetricsCollection() {
        if (this.metricsInterval) {
            return;
        }
        this.metricsInterval = setInterval(async () => {
            try {
                const metrics = await this.collectMetrics();
                this.emit('metrics:periodic', metrics);
            }
            catch (error) {
                this.emit('error', error);
            }
        }, this.metricsCollectionInterval);
    }
    /**
     * Stop periodic metrics collection
     */
    stopMetricsCollection() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
    }
    // ============================================================
    // HEALTH CHECKS
    // ============================================================
    /**
     * Register a health check
     */
    registerHealthCheck(name, check) {
        this.healthChecks.set(name, check);
        this.emit('healthcheck:registered', { name });
    }
    /**
     * Unregister a health check
     */
    unregisterHealthCheck(name) {
        this.healthChecks.delete(name);
        this.emit('healthcheck:unregistered', { name });
    }
    /**
     * Run all health checks
     */
    async runHealthChecks() {
        const results = new Map();
        for (const [name, check] of this.healthChecks) {
            try {
                const result = await check();
                results.set(name, result);
            }
            catch (error) {
                results.set(name, {
                    name,
                    status: 'unhealthy',
                    message: error instanceof Error ? error.message : String(error),
                    lastCheck: new Date(),
                });
            }
        }
        this.emit('healthchecks:complete', results);
        return results;
    }
    /**
     * Register default health checks
     */
    registerDefaultHealthChecks() {
        // Process health check
        this.registerHealthCheck('process', async () => ({
            name: 'process',
            status: 'healthy',
            message: `PID: ${process.pid}, Uptime: ${process.uptime()}s`,
            lastCheck: new Date(),
        }));
        // Memory health check
        this.registerHealthCheck('memory', async () => {
            const used = process.memoryUsage();
            const heapUsagePercent = (used.heapUsed / used.heapTotal) * 100;
            return {
                name: 'memory',
                status: heapUsagePercent > 90 ? 'degraded' : 'healthy',
                message: `Heap: ${Math.round(heapUsagePercent)}% used`,
                lastCheck: new Date(),
            };
        });
        // Event loop health check
        this.registerHealthCheck('event-loop', async () => {
            const start = Date.now();
            await new Promise((resolve) => setImmediate(resolve));
            const latency = Date.now() - start;
            return {
                name: 'event-loop',
                status: latency > 100 ? 'degraded' : 'healthy',
                latency,
                message: `Event loop latency: ${latency}ms`,
                lastCheck: new Date(),
            };
        });
    }
    // ============================================================
    // EVENT LOGGING
    // ============================================================
    /**
     * Log a system event
     */
    logEvent(event) {
        this.eventLog.push(event);
        // Trim log if too large
        if (this.eventLog.length > this.maxEventLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxEventLogSize / 2);
        }
        this.emit('event', event);
    }
    /**
     * Get recent events
     */
    getRecentEvents(count = 100) {
        return this.eventLog.slice(-count);
    }
    /**
     * Get events by type
     */
    getEventsByType(type) {
        return this.eventLog.filter((e) => e.type === type);
    }
    /**
     * Clear event log
     */
    clearEventLog() {
        this.eventLog = [];
        this.emit('events:cleared');
    }
    // ============================================================
    // PROCESS MANAGEMENT
    // ============================================================
    /**
     * Get current process info
     */
    getProcessInfo() {
        const memUsage = process.memoryUsage();
        return {
            pid: process.pid,
            name: process.title,
            memory: memUsage.heapUsed,
            cpu: 0, // Would need to calculate over time
            status: 'running',
            startTime: new Date(Date.now() - process.uptime() * 1000),
        };
    }
    /**
     * Get environment info
     */
    getEnvironmentInfo() {
        return {
            NODE_ENV: process.env.NODE_ENV,
            NODE_VERSION: process.version,
            PLATFORM: process.platform,
            ARCH: process.arch,
        };
    }
    // ============================================================
    // STATISTICS
    // ============================================================
    getStatistics() {
        return {
            connected: this.isConnected,
            healthChecks: this.healthChecks.size,
            eventLogSize: this.eventLog.length,
            uptime: process.uptime(),
            processInfo: this.getProcessInfo(),
        };
    }
}
exports.SystemBridge = SystemBridge;
exports.default = SystemBridge;
//# sourceMappingURL=system_bridge.js.map