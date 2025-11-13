"use strict";
/**
 * Monitoring System Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MonitoringSystem_1 = require("./MonitoringSystem");
const Logger_1 = require("../utils/Logger");
(0, vitest_1.describe)('MonitoringSystem', () => {
    let monitoringSystem;
    let logger;
    (0, vitest_1.beforeEach)(() => {
        logger = new Logger_1.Logger('TestMonitoringSystem');
        monitoringSystem = new MonitoringSystem_1.MonitoringSystem(logger);
    });
    (0, vitest_1.afterEach)(async () => {
        if (monitoringSystem) {
            await monitoringSystem.shutdown();
        }
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize with default configuration', async () => {
            const config = {
                enabled: true,
                metricsInterval: 30000,
                retentionPeriod: 24 * 60 * 60 * 1000,
                enableAlerting: true,
                alertInterval: 60000,
                enableDashboards: true,
                dashboardRefreshInterval: 30000,
                storage: {
                    type: 'memory',
                    await: monitoringSystem.initialize(config),
                    const: status = await monitoringSystem.getStatus(),
                    expect(status) { }, : .running
                }
            };
        }).toBe(true);
        (0, vitest_1.expect)(status.components.metricsCollector).toBe(true);
        (0, vitest_1.expect)(status.components.alertManager).toBe(true);
        (0, vitest_1.expect)(status.components.dashboardManager).toBe(true);
    });
    (0, vitest_1.it)('should handle disabled monitoring', async () => {
        const config = {
            enabled: false,
            metricsInterval: 30000,
            retentionPeriod: 24 * 60 * 60 * 1000,
            enableAlerting: false,
            alertInterval: 60000,
            enableDashboards: false,
            dashboardRefreshInterval: 30000,
            storage: {
                type: 'memory',
                await: monitoringSystem.initialize(config),
                const: status = await monitoringSystem.getStatus(),
                expect(status) { }, : .running
            }
        };
    }).toBe(false);
});
(0, vitest_1.it)('should throw error when accessing components before initialization', () => {
    (0, vitest_1.expect)(() => monitoringSystem.getMetricsCollector()).toThrow('Monitoring system not initialized');
    (0, vitest_1.expect)(() => monitoringSystem.getAlertManager()).toThrow('Monitoring system not initialized');
    (0, vitest_1.expect)(() => monitoringSystem.getDashboardManager()).toThrow('Monitoring system not initialized');
});
;
(0, vitest_1.describe)('Component Access', () => {
    (0, vitest_1.beforeEach)(async () => {
        const config = {
            enabled: true,
            metricsInterval: 30000,
            retentionPeriod: 24 * 60 * 60 * 1000,
            enableAlerting: true,
            alertInterval: 60000,
            enableDashboards: true,
            dashboardRefreshInterval: 30000,
            storage: {
                type: 'memory',
                await: monitoringSystem.initialize(config)
            }
        };
    });
    (0, vitest_1.it)('should provide access to metrics collector', () => {
        const metricsCollector = monitoringSystem.getMetricsCollector();
        (0, vitest_1.expect)(metricsCollector).toBeDefined();
        (0, vitest_1.expect)(typeof metricsCollector.getCurrentMetrics).toBe('function');
    });
    (0, vitest_1.it)('should provide access to alert manager', () => {
        const alertManager = monitoringSystem.getAlertManager();
        (0, vitest_1.expect)(alertManager).toBeDefined();
        (0, vitest_1.expect)(typeof alertManager.getActiveAlerts).toBe('function');
    });
    (0, vitest_1.it)('should provide access to dashboard manager', () => {
        const dashboardManager = monitoringSystem.getDashboardManager();
        (0, vitest_1.expect)(dashboardManager).toBeDefined();
        (0, vitest_1.expect)(typeof dashboardManager.listDashboards).toBe('function');
    });
    (0, vitest_1.it)('should provide access to performance monitor', () => {
        const performanceMonitor = monitoringSystem.getPerformanceMonitor();
        (0, vitest_1.expect)(performanceMonitor).toBeDefined();
        (0, vitest_1.expect)(typeof performanceMonitor.getCurrentMetrics).toBe('function');
    });
    (0, vitest_1.it)('should provide access to load tester', () => {
        const loadTester = monitoringSystem.getLoadTester();
        (0, vitest_1.expect)(loadTester).toBeDefined();
        (0, vitest_1.expect)(typeof loadTester.runLoadTest).toBe('function');
    });
    (0, vitest_1.it)('should provide access to cache monitor', () => {
        const cacheMonitor = monitoringSystem.getCacheMonitor();
        (0, vitest_1.expect)(cacheMonitor).toBeDefined();
        (0, vitest_1.expect)(typeof cacheMonitor.getCacheMetrics).toBe('function');
    });
    (0, vitest_1.it)('should provide access to connection pool monitor', () => {
        const connectionPoolMonitor = monitoringSystem.getConnectionPoolMonitor();
        (0, vitest_1.expect)(connectionPoolMonitor).toBeDefined();
        (0, vitest_1.expect)(typeof connectionPoolMonitor.getPoolMetrics).toBe('function');
    });
    (0, vitest_1.it)('should provide access to system health monitor', () => {
        const systemHealthMonitor = monitoringSystem.getSystemHealthMonitor();
        (0, vitest_1.expect)(systemHealthMonitor).toBeDefined();
        (0, vitest_1.expect)(typeof systemHealthMonitor.getHealthStatus).toBe('function');
    });
});
(0, vitest_1.describe)('Metrics Export', () => {
    (0, vitest_1.beforeEach)(async () => {
        const config = {
            enabled: true,
            metricsInterval: 30000,
            retentionPeriod: 24 * 60 * 60 * 1000,
            enableAlerting: true,
            alertInterval: 60000,
            enableDashboards: true,
            dashboardRefreshInterval: 30000,
            storage: {
                type: 'memory',
                await: monitoringSystem.initialize(config)
            }
        };
    });
    (0, vitest_1.it)('should export metrics in JSON format', async () => {
        const jsonMetrics = await monitoringSystem.exportMetrics('json');
        (0, vitest_1.expect)(jsonMetrics).toBeDefined();
        const parsed = JSON.parse(jsonMetrics);
        (0, vitest_1.expect)(parsed).toHaveProperty('requests');
        (0, vitest_1.expect)(parsed).toHaveProperty('connections');
        (0, vitest_1.expect)(parsed).toHaveProperty('resources');
        (0, vitest_1.expect)(parsed).toHaveProperty('tools');
        (0, vitest_1.expect)(parsed).toHaveProperty('system');
    });
    (0, vitest_1.it)('should export metrics in Prometheus format', async () => {
        const prometheusMetrics = await monitoringSystem.exportMetrics('prometheus');
        (0, vitest_1.expect)(prometheusMetrics).toBeDefined();
        (0, vitest_1.expect)(prometheusMetrics).toContain('mcp_requests_total');
        (0, vitest_1.expect)(prometheusMetrics).toContain('mcp_connections_active');
        (0, vitest_1.expect)(prometheusMetrics).toContain('mcp_health_score');
    });
    (0, vitest_1.it)('should throw error for unsupported export format', async () => {
        await (0, vitest_1.expect)(monitoringSystem.exportMetrics('xml')).rejects.toThrow('Unsupported export format: xml');
    });
});
(0, vitest_1.describe)('Event Forwarding', () => {
    (0, vitest_1.beforeEach)(async () => {
        const config = {
            enabled: true,
            metricsInterval: 30000,
            retentionPeriod: 24 * 60 * 60 * 1000,
            enableAlerting: true,
            alertInterval: 60000,
            enableDashboards: true,
            dashboardRefreshInterval: 30000,
            storage: {
                type: 'memory',
                await: monitoringSystem.initialize(config)
            }
        };
    });
    (0, vitest_1.it)('should forward metrics collected events', (done) => {
        monitoringSystem.on('metricsCollected', (metrics) => {
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics).toHaveProperty('requests');
            done();
        });
        // Trigger metrics collection
        const metricsCollector = monitoringSystem.getMetricsCollector();
        metricsCollector.emit('metricsCollected', {
            requests: { total: 0, successful: 0, failed: 0, rps: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0 },
            connections: { active: 0, total: 0, failed: 0, avgConnectionTime: 0 },
            resources: { total: 0, accessCount: 0, cacheHitRate: 0, avgReadTime: 0 },
            tools: { total: 0, executionCount: 0, avgExecutionTime: 0, successRate: 0 },
            system: { memoryUsage: 0, cpuUsage: 0, uptime: 0, healthScore: 100 }
        });
    });
    (0, vitest_1.it)('should forward performance update events', (done) => {
        monitoringSystem.on('performanceUpdate', (metrics) => {
            (0, vitest_1.expect)(metrics).toBeDefined();
            done();
        });
        // Trigger performance update
        const performanceMonitor = monitoringSystem.getPerformanceMonitor();
        performanceMonitor.emit('performanceUpdate', {});
    });
});
(0, vitest_1.describe)('Shutdown', () => {
    (0, vitest_1.it)('should shutdown gracefully', async () => {
        const config = {
            enabled: true,
            metricsInterval: 30000,
            retentionPeriod: 24 * 60 * 60 * 1000,
            enableAlerting: true,
            alertInterval: 60000,
            enableDashboards: true,
            dashboardRefreshInterval: 30000,
            storage: {
                type: 'memory',
                await: monitoringSystem.initialize(config),
                let, shutdownEventEmitted = false,
                monitoringSystem, : .on('shutdown', () => {
                    shutdownEventEmitted = true;
                }),
                await: monitoringSystem.shutdown(),
                const: status = await monitoringSystem.getStatus(),
                expect(status) { }, : .running
            }
        };
    }).toBe(false);
    (0, vitest_1.expect)(shutdownEventEmitted).toBe(true);
});
(0, vitest_1.it)('should handle shutdown when not running', async () => {
    // Should not throw error
    await (0, vitest_1.expect)(monitoringSystem.shutdown()).resolves.not.toThrow();
});
;
(0, vitest_1.describe)('Status Reporting', () => {
    (0, vitest_1.it)('should report correct status when not initialized', async () => {
        const status = await monitoringSystem.getStatus();
        (0, vitest_1.expect)(status.running).toBe(false);
        (0, vitest_1.expect)(status.uptime).toBe(0);
        (0, vitest_1.expect)(Object.values(status.components).every(c => c === false)).toBe(true);
    });
    (0, vitest_1.it)('should report correct status when initialized', async () => {
        const config = {
            enabled: true,
            metricsInterval: 30000,
            retentionPeriod: 24 * 60 * 60 * 1000,
            enableAlerting: true,
            alertInterval: 60000,
            enableDashboards: true,
            dashboardRefreshInterval: 30000,
            storage: {
                type: 'memory',
                await: monitoringSystem.initialize(config),
                const: status = await monitoringSystem.getStatus(),
                expect(status) { }, : .running
            }
        };
    }).toBe(true);
    (0, vitest_1.expect)(status.uptime).toBeGreaterThan(0);
    (0, vitest_1.expect)(status.components.metricsCollector).toBe(true);
    (0, vitest_1.expect)(status.components.alertManager).toBe(true);
    (0, vitest_1.expect)(status.components.dashboardManager).toBe(true);
});
;
;
//# sourceMappingURL=MonitoringSystem.test.js.map