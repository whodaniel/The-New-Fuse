"use strict";
/**
 * Comprehensive Test Suite for MonitoringAnalyticsEngine
 *
 * This file contains unit tests, integration tests, and performance tests
 * for the MonitoringAnalyticsEngine component.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const MonitoringAnalytics_1 = require("../MonitoringAnalytics");
// Mock performance API
const mockPerformance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
};
// Mock process for Node.js metrics
const mockProcess = {
    memoryUsage: jest.fn(() => ({
        rss: 50 * 1024 * 1024, // 50MB
        heapTotal: 30 * 1024 * 1024, // 30MB
        heapUsed: 20 * 1024 * 1024, // 20MB
        external: 5 * 1024 * 1024 // 5MB
    })),
    cpuUsage: jest.fn(() => ({
        user: 100000, // microseconds
        system: 50000
    })),
    uptime: jest.fn(() => 3600) // 1 hour
};
// Setup global mocks
global.performance = mockPerformance;
global.process = mockProcess;
describe('MonitoringAnalyticsEngine', () => {
    let engine;
    beforeEach(() => {
        engine = new MonitoringAnalytics_1.MonitoringAnalyticsEngine();
        jest.clearAllMocks();
    });
    afterEach(async () => {
        await engine.cleanup();
    });
    describe('Metrics Collection', () => {
        it('should collect agent performance metrics', async () => {
            const agentId = 'test-agent-1';
            // Simulate agent activity
            await engine.recordAgentMetric(agentId, {
                type: 'task_completion',
                value: 1,
                duration: 1500,
                success: true,
                timestamp: new Date()
            });
            await engine.recordAgentMetric(agentId, {
                type: 'api_call',
                value: 1,
                duration: 250,
                success: true,
                timestamp: new Date()
            });
            const metrics = await engine.getAgentMetrics(agentId, {
                timeRange: { start: new Date(Date.now() - 3600000), end: new Date() }
            });
            expect(metrics.taskCompletionRate).toBeGreaterThan(0);
            expect(metrics.averageResponseTime).toBeGreaterThan(0);
            expect(metrics.totalRequests).toBe(2);
            expect(metrics.successRate).toBe(1.0);
        });
        it('should collect system performance metrics', async () => {
            const systemMetrics = await engine.collectSystemMetrics();
            expect(systemMetrics.memory).toBeDefined();
            expect(systemMetrics.memory.used).toBe(20 * 1024 * 1024);
            expect(systemMetrics.memory.total).toBe(30 * 1024 * 1024);
            expect(systemMetrics.memory.usage).toBeCloseTo(0.67, 2);
            expect(systemMetrics.cpu).toBeDefined();
            expect(systemMetrics.cpu.usage).toBeGreaterThanOrEqual(0);
            expect(systemMetrics.cpu.usage).toBeLessThanOrEqual(1);
            expect(systemMetrics.uptime).toBe(3600);
            expect(mockProcess.memoryUsage).toHaveBeenCalled();
            expect(mockProcess.cpuUsage).toHaveBeenCalled();
        });
        it('should track custom metrics', async () => {
            const customMetrics = [
                { name: 'custom_counter', value: 10, type: 'counter' },
                { name: 'custom_gauge', value: 75.5, type: 'gauge' },
                { name: 'custom_histogram', value: 123, type: 'histogram' }
            ];
            for (const metric of customMetrics) {
                await engine.recordCustomMetric(metric.name, metric.value, {
                    type: metric.type,
                    tags: { environment: 'test', service: 'mcp' }
                });
            }
            const retrievedMetrics = await engine.getCustomMetrics({
                names: ['custom_counter', 'custom_gauge', 'custom_histogram'],
                timeRange: { start: new Date(Date.now() - 3600000), end: new Date() }
            });
            expect(retrievedMetrics).toHaveLength(3);
            expect(retrievedMetrics.find(m => m.name === 'custom_counter')?.value).toBe(10);
            expect(retrievedMetrics.find(m => m.name === 'custom_gauge')?.value).toBe(75.5);
        });
        it('should aggregate metrics over time windows', async () => {
            const agentId = 'aggregation-test-agent';
            const baseTime = Date.now();
            // Record metrics over different time periods
            for (let i = 0; i < 10; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 100 + i * 10,
                    success: i < 8, // 80% success rate
                    timestamp: new Date(baseTime - i * 60000) // 1 minute intervals
                });
            }
            const hourlyAggregation = await engine.getAggregatedMetrics(agentId, {
                timeWindow: '1h',
                aggregation: 'avg',
                timeRange: { start: new Date(baseTime - 3600000), end: new Date(baseTime) }
            });
            expect(hourlyAggregation.averageResponseTime).toBeGreaterThan(100);
            expect(hourlyAggregation.successRate).toBe(0.8);
            expect(hourlyAggregation.totalRequests).toBe(10);
            const minutelyAggregation = await engine.getAggregatedMetrics(agentId, {
                timeWindow: '1m',
                aggregation: 'sum',
                timeRange: { start: new Date(baseTime - 600000), end: new Date(baseTime) }
            });
            expect(minutelyAggregation.dataPoints).toHaveLength(10);
        });
        it('should handle metric collection errors gracefully', async () => {
            // Mock system metric collection failure
            mockProcess.memoryUsage.mockImplementationOnce(() => {
                throw new Error('Memory collection failed');
            });
            const systemMetrics = await engine.collectSystemMetrics();
            expect(systemMetrics.memory).toBeUndefined();
            expect(systemMetrics.error).toContain('Memory collection failed');
            expect(systemMetrics.cpu).toBeDefined(); // Other metrics should still work
        });
    });
    describe('Real-time Analytics', () => {
        it('should provide real-time insights', async () => {
            const agentId = 'realtime-test-agent';
            // Generate some activity
            for (let i = 0; i < 20; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'task_completion',
                    value: 1,
                    duration: Math.random() * 1000 + 500,
                    success: Math.random() > 0.1, // 90% success rate
                    timestamp: new Date()
                });
            }
            const insights = await engine.getRealtimeInsights(agentId);
            expect(insights.currentThroughput).toBeGreaterThan(0);
            expect(insights.averageLatency).toBeGreaterThan(0);
            expect(insights.errorRate).toBeLessThan(0.2); // Less than 20%
            expect(insights.trends).toBeDefined();
            expect(insights.anomalies).toBeDefined();
        });
        it('should detect performance anomalies', async () => {
            const agentId = 'anomaly-test-agent';
            // Record normal performance
            for (let i = 0; i < 50; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 200 + Math.random() * 50, // Normal: 200-250ms
                    success: true,
                    timestamp: new Date(Date.now() - i * 1000)
                });
            }
            // Record anomalous performance
            await engine.recordAgentMetric(agentId, {
                type: 'api_call',
                value: 1,
                duration: 5000, // Anomalous: 5 seconds
                success: true,
                timestamp: new Date()
            });
            const anomalies = await engine.detectAnomalies(agentId, {
                metrics: ['response_time'],
                sensitivity: 0.8,
                timeWindow: '5m'
            });
            expect(anomalies.detected).toBe(true);
            expect(anomalies.anomalies).toHaveLength(1);
            expect(anomalies.anomalies[0].metric).toBe('response_time');
            expect(anomalies.anomalies[0].severity).toBe('high');
        });
        it('should track performance trends', async () => {
            const agentId = 'trend-test-agent';
            const baseTime = Date.now();
            // Simulate degrading performance over time
            for (let i = 0; i < 100; i++) {
                const degradationFactor = 1 + (i / 100); // Performance gets worse
                await engine.recordAgentMetric(agentId, {
                    type: 'task_completion',
                    value: 1,
                    duration: 500 * degradationFactor,
                    success: Math.random() > (i / 200), // Success rate decreases
                    timestamp: new Date(baseTime - (100 - i) * 60000) // 1 minute intervals
                });
            }
            const trends = await engine.analyzeTrends(agentId, {
                metrics: ['response_time', 'success_rate'],
                timeRange: { start: new Date(baseTime - 6000000), end: new Date(baseTime) }
            });
            expect(trends.responseTime.direction).toBe('increasing');
            expect(trends.responseTime.confidence).toBeGreaterThan(0.8);
            expect(trends.successRate.direction).toBe('decreasing');
        });
        it('should generate performance predictions', async () => {
            const agentId = 'prediction-test-agent';
            const baseTime = Date.now();
            // Generate historical data with a clear pattern
            for (let i = 0; i < 200; i++) {
                const cyclicalPattern = Math.sin(i / 20) * 100 + 500; // Cyclical response times
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: cyclicalPattern + Math.random() * 50,
                    success: true,
                    timestamp: new Date(baseTime - (200 - i) * 60000)
                });
            }
            const predictions = await engine.generatePredictions(agentId, {
                metrics: ['response_time'],
                horizon: '1h',
                confidence: 0.95
            });
            expect(predictions.responseTime).toBeDefined();
            expect(predictions.responseTime.forecast).toHaveLength(60); // 1 hour = 60 minutes
            expect(predictions.responseTime.confidence).toBeGreaterThan(0.8);
            expect(predictions.responseTime.accuracy).toBeDefined();
        });
        it('should provide comparative analytics', async () => {
            const agents = ['agent-1', 'agent-2', 'agent-3'];
            // Generate different performance profiles for each agent
            for (const [index, agentId] of agents.entries()) {
                const basePerformance = (index + 1) * 200; // Different base performance
                for (let i = 0; i < 50; i++) {
                    await engine.recordAgentMetric(agentId, {
                        type: 'task_completion',
                        value: 1,
                        duration: basePerformance + Math.random() * 100,
                        success: Math.random() > (index * 0.1), // Different success rates
                        timestamp: new Date()
                    });
                }
            }
            const comparison = await engine.compareAgents(agents, {
                metrics: ['response_time', 'success_rate', 'throughput'],
                timeRange: { start: new Date(Date.now() - 3600000), end: new Date() }
            });
            expect(comparison.agents).toHaveLength(3);
            expect(comparison.ranking.responseTime[0]).toBe('agent-1'); // Best performance
            expect(comparison.ranking.responseTime[2]).toBe('agent-3'); // Worst performance
            expect(comparison.insights).toBeDefined();
        });
    });
    describe('Alert Management', () => {
        it('should create and manage performance thresholds', async () => {
            const threshold = {
                id: 'response-time-threshold',
                metric: 'response_time',
                condition: 'greater_than',
                value: 1000,
                duration: 300, // 5 minutes
                severity: 'warning',
                enabled: true
            };
            const createResult = await engine.createThreshold(threshold);
            expect(createResult.success).toBe(true);
            expect(createResult.thresholdId).toBe('response-time-threshold');
            const thresholds = await engine.listThresholds();
            expect(thresholds.find(t => t.id === 'response-time-threshold')).toBeDefined();
        });
        it('should trigger alerts when thresholds are exceeded', async () => {
            const agentId = 'alert-test-agent';
            // Create threshold
            await engine.createThreshold({
                id: 'high-response-time',
                metric: 'response_time',
                condition: 'greater_than',
                value: 500,
                duration: 60, // 1 minute
                severity: 'critical',
                enabled: true
            });
            // Record metrics that exceed threshold
            for (let i = 0; i < 10; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 800, // Exceeds 500ms threshold
                    success: true,
                    timestamp: new Date()
                });
            }
            // Wait for alert processing
            await new Promise(resolve => setTimeout(resolve, 100));
            const alerts = await engine.getActiveAlerts();
            const responseTimeAlert = alerts.find(a => a.thresholdId === 'high-response-time');
            expect(responseTimeAlert).toBeDefined();
            expect(responseTimeAlert?.severity).toBe('critical');
            expect(responseTimeAlert?.agentId).toBe(agentId);
        });
        it('should implement alert escalation', async () => {
            const agentId = 'escalation-test-agent';
            await engine.createThreshold({
                id: 'escalating-threshold',
                metric: 'error_rate',
                condition: 'greater_than',
                value: 0.1, // 10% error rate
                duration: 60,
                severity: 'warning',
                escalation: {
                    enabled: true,
                    levels: [
                        { duration: 300, severity: 'critical' }, // Escalate to critical after 5 minutes
                        { duration: 900, severity: 'emergency' } // Escalate to emergency after 15 minutes
                    ]
                },
                enabled: true
            });
            // Generate high error rate
            for (let i = 0; i < 20; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 200,
                    success: i < 15, // 25% error rate
                    timestamp: new Date()
                });
            }
            // Simulate time passing for escalation
            await engine.processAlertEscalation();
            const alerts = await engine.getActiveAlerts();
            const escalatedAlert = alerts.find(a => a.thresholdId === 'escalating-threshold');
            expect(escalatedAlert).toBeDefined();
            expect(escalatedAlert?.currentSeverity).toBe('critical');
        });
        it('should support alert suppression and grouping', async () => {
            const agentIds = ['agent-1', 'agent-2', 'agent-3'];
            await engine.createThreshold({
                id: 'grouped-threshold',
                metric: 'response_time',
                condition: 'greater_than',
                value: 1000,
                duration: 60,
                severity: 'warning',
                grouping: {
                    enabled: true,
                    key: 'agent_group',
                    maxAlerts: 1 // Only one alert per group
                },
                enabled: true
            });
            // Generate alerts for all agents
            for (const agentId of agentIds) {
                for (let i = 0; i < 5; i++) {
                    await engine.recordAgentMetric(agentId, {
                        type: 'api_call',
                        value: 1,
                        duration: 1500, // Exceeds threshold
                        success: true,
                        timestamp: new Date(),
                        tags: { agent_group: 'web_agents' }
                    });
                }
            }
            const alerts = await engine.getActiveAlerts();
            const groupedAlerts = alerts.filter(a => a.thresholdId === 'grouped-threshold');
            expect(groupedAlerts).toHaveLength(1); // Only one alert due to grouping
            expect(groupedAlerts[0].affectedAgents).toHaveLength(3);
        });
        it('should implement alert notifications', async () => {
            const mockNotificationHandler = jest.fn();
            await engine.configureNotifications({
                handlers: [
                    {
                        type: 'webhook',
                        config: { url: 'https://alerts.example.com/webhook' },
                        handler: mockNotificationHandler
                    }
                ],
                rules: [
                    {
                        severity: ['critical', 'emergency'],
                        channels: ['webhook']
                    }
                ]
            });
            await engine.createThreshold({
                id: 'notification-threshold',
                metric: 'success_rate',
                condition: 'less_than',
                value: 0.5, // 50% success rate
                duration: 60,
                severity: 'critical',
                enabled: true
            });
            const agentId = 'notification-test-agent';
            // Generate low success rate
            for (let i = 0; i < 10; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'task_completion',
                    value: 1,
                    duration: 500,
                    success: i < 3, // 30% success rate
                    timestamp: new Date()
                });
            }
            // Wait for notification processing
            await new Promise(resolve => setTimeout(resolve, 200));
            expect(mockNotificationHandler).toHaveBeenCalled();
            const notificationCall = mockNotificationHandler.mock.calls[0][0];
            expect(notificationCall.severity).toBe('critical');
            expect(notificationCall.agentId).toBe(agentId);
        });
        it('should handle alert resolution', async () => {
            const agentId = 'resolution-test-agent';
            await engine.createThreshold({
                id: 'resolution-threshold',
                metric: 'response_time',
                condition: 'greater_than',
                value: 800,
                duration: 60,
                severity: 'warning',
                resolution: {
                    condition: 'less_than',
                    value: 400,
                    duration: 120 // 2 minutes of good performance to resolve
                },
                enabled: true
            });
            // Generate high response times (trigger alert)
            for (let i = 0; i < 10; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 1000,
                    success: true,
                    timestamp: new Date()
                });
            }
            let alerts = await engine.getActiveAlerts();
            expect(alerts.find(a => a.thresholdId === 'resolution-threshold')).toBeDefined();
            // Generate good response times (resolve alert)
            for (let i = 0; i < 15; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 300,
                    success: true,
                    timestamp: new Date()
                });
            }
            // Process alert resolution
            await engine.processAlertResolution();
            alerts = await engine.getActiveAlerts();
            expect(alerts.find(a => a.thresholdId === 'resolution-threshold')).toBeUndefined();
            const resolvedAlerts = await engine.getResolvedAlerts({ limit: 10 });
            expect(resolvedAlerts.find(a => a.thresholdId === 'resolution-threshold')).toBeDefined();
        });
    });
    describe('Performance Optimization', () => {
        it('should handle high-volume metric ingestion', async () => {
            const agentCount = 100;
            const metricsPerAgent = 1000;
            const totalMetrics = agentCount * metricsPerAgent;
            const startTime = Date.now();
            const promises = [];
            for (let agentIndex = 0; agentIndex < agentCount; agentIndex++) {
                const agentId = `load-test-agent-${agentIndex}`;
                for (let metricIndex = 0; metricIndex < metricsPerAgent; metricIndex++) {
                    promises.push(engine.recordAgentMetric(agentId, {
                        type: 'api_call',
                        value: 1,
                        duration: Math.random() * 1000,
                        success: Math.random() > 0.05, // 95% success rate
                        timestamp: new Date()
                    }));
                }
            }
            await Promise.all(promises);
            const endTime = Date.now();
            const metricsPerSecond = totalMetrics / ((endTime - startTime) / 1000);
            expect(metricsPerSecond).toBeGreaterThan(1000); // At least 1000 metrics/second
            console.log(`Metric ingestion rate: ${metricsPerSecond.toFixed(0)} metrics/second`);
        });
        it('should efficiently query large datasets', async () => {
            const agentId = 'query-performance-agent';
            const metricCount = 10000;
            // Insert large dataset
            const insertPromises = [];
            for (let i = 0; i < metricCount; i++) {
                insertPromises.push(engine.recordAgentMetric(agentId, {
                    type: 'task_completion',
                    value: 1,
                    duration: Math.random() * 2000,
                    success: Math.random() > 0.1,
                    timestamp: new Date(Date.now() - i * 1000) // 1 second intervals
                }));
            }
            await Promise.all(insertPromises);
            // Test query performance
            const queryStart = Date.now();
            const metrics = await engine.getAgentMetrics(agentId, {
                timeRange: {
                    start: new Date(Date.now() - 3600000), // 1 hour ago
                    end: new Date()
                },
                aggregation: '1m' // 1-minute aggregation
            });
            const queryEnd = Date.now();
            const queryTime = queryEnd - queryStart;
            expect(queryTime).toBeLessThan(1000); // Query should complete in under 1 second
            expect(metrics.totalRequests).toBe(metricCount);
            console.log(`Query performance: ${queryTime}ms for ${metricCount} metrics`);
        });
        it('should implement efficient data retention', async () => {
            const agentId = 'retention-test-agent';
            // Configure retention policy
            await engine.configureRetention({
                policies: [
                    {
                        metric: 'api_call',
                        retention: '7d', // 7 days
                        aggregation: '1h' // Aggregate to hourly after 1 day
                    },
                    {
                        metric: 'task_completion',
                        retention: '30d', // 30 days
                        aggregation: '1d' // Aggregate to daily after 7 days
                    }
                ]
            });
            // Insert old data
            const oldTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
            for (let i = 0; i < 100; i++) {
                await engine.recordAgentMetric(agentId, {
                    type: 'api_call',
                    value: 1,
                    duration: 500,
                    success: true,
                    timestamp: new Date(oldTimestamp.getTime() + i * 60000) // 1 minute intervals
                });
            }
            // Run retention cleanup
            const cleanupResult = await engine.runRetentionCleanup();
            expect(cleanupResult.success).toBe(true);
            expect(cleanupResult.deletedRecords).toBeGreaterThan(0);
            expect(cleanupResult.aggregatedRecords).toBeGreaterThan(0);
            // Verify old data is cleaned up
            const oldMetrics = await engine.getAgentMetrics(agentId, {
                timeRange: {
                    start: new Date(oldTimestamp.getTime() - 3600000),
                    end: new Date(oldTimestamp.getTime() + 3600000)
                }
            });
            expect(oldMetrics.totalRequests).toBe(0); // Should be cleaned up
        });
        it('should optimize memory usage', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            // Generate large amount of data
            const agentCount = 50;
            const metricsPerAgent = 2000;
            for (let agentIndex = 0; agentIndex < agentCount; agentIndex++) {
                const agentId = `memory-test-agent-${agentIndex}`;
                const promises = [];
                for (let metricIndex = 0; metricIndex < metricsPerAgent; metricIndex++) {
                    promises.push(engine.recordAgentMetric(agentId, {
                        type: 'memory_test',
                        value: Math.random() * 100,
                        duration: Math.random() * 1000,
                        success: true,
                        timestamp: new Date(),
                        metadata: {
                            // Add some metadata to increase memory usage
                            requestId: `req-${agentIndex}-${metricIndex}`,
                            userAgent: 'test-agent/1.0',
                            tags: ['test', 'memory', 'performance']
                        }
                    }));
                }
                await Promise.all(promises);
            }
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            const peakMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = peakMemory - initialMemory;
            const memoryPerMetric = memoryIncrease / (agentCount * metricsPerAgent);
            expect(memoryPerMetric).toBeLessThan(1024); // Less than 1KB per metric
            console.log(`Memory usage: ${memoryPerMetric.toFixed(0)} bytes per metric`);
            // Test memory cleanup
            await engine.optimizeMemory();
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryReduction = peakMemory - finalMemory;
            expect(memoryReduction).toBeGreaterThan(0);
            console.log(`Memory optimization: ${(memoryReduction / 1024 / 1024).toFixed(2)}MB freed`);
        });
    });
});
//# sourceMappingURL=monitoring-analytics.test.js.map