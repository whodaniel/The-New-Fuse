"use strict";
/**
 * Performance Test Suite for Advanced MCP Capabilities
 *
 * This file contains performance tests that validate system performance,
 * scalability, and resource efficiency under various load conditions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const MCPIntegrationLayer_1 = require("../MCPIntegrationLayer");
// Performance test utilities
class PerformanceProfiler {
    measurements = new Map();
    startTimes = new Map();
    start(label) {
        this.startTimes.set(label, performance.now());
    }
    end(label) {
        const startTime = this.startTimes.get(label);
        if (!startTime) {
            throw new Error(`No start time found for label: ${label}`);
        }
        const duration = performance.now() - startTime;
        if (!this.measurements.has(label)) {
            this.measurements.set(label, []);
        }
        this.measurements.get(label).push(duration);
        this.startTimes.delete(label);
        return duration;
    }
    getStats(label) {
        const measurements = this.measurements.get(label) || [];
        if (measurements.length === 0) {
            return null;
        }
        const sorted = [...measurements].sort((a, b) => a - b);
        const sum = measurements.reduce((a, b) => a + b, 0);
        return {
            count: measurements.length,
            min: Math.min(...measurements),
            max: Math.max(...measurements),
            mean: sum / measurements.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }
    getAllStats() {
        const stats = {};
        for (const [label] of this.measurements) {
            stats[label] = this.getStats(label);
        }
        return stats;
    }
    reset() {
        this.measurements.clear();
        this.startTimes.clear();
    }
}
// Mock WebSocket for performance testing
class PerformanceWebSocket {
    url;
    readyState = 1;
    onopen = null;
    onclose = null;
    onmessage = null;
    onerror = null;
    constructor(url) {
        this.url = url;
        // Simulate connection delay
        setTimeout(() => {
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, Math.random() * 10);
    }
    send(data) {
        // Simulate network latency
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage(new MessageEvent('message', {
                    data: JSON.stringify({
                        id: Date.now(),
                        response: 'success',
                        timestamp: Date.now()
                    })
                }));
            }
        }, Math.random() * 50);
    }
    close() {
        this.readyState = 3;
        if (this.onclose) {
            this.onclose(new CloseEvent('close'));
        }
    }
}
global.WebSocket = PerformanceWebSocket;
// Mock performance monitoring
const mockPerformance = {
    memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
    }
};
global.performance = {
    ...performance,
    ...mockPerformance
};
describe('Advanced MCP Performance Tests', () => {
    let integrationLayer;
    let profiler;
    beforeEach(async () => {
        profiler = new PerformanceProfiler();
        integrationLayer = new MCPIntegrationLayer_1.MCPIntegrationLayer({
            orchestrator: {
                maxAgents: 100,
                taskTimeout: 30000,
                collaborationEnabled: true
            },
            browserAutomation: {
                headless: true,
                defaultTimeout: 10000,
                maxConcurrentBrowsers: 10
            },
            security: {
                encryptionKey: 'test-key-32-characters-long-123',
                jwtSecret: 'test-jwt-secret',
                sessionTimeout: 3600000
            },
            realtimeCommunication: {
                port: 8080,
                maxConnections: 1000,
                messageTimeout: 5000
            },
            monitoring: {
                metricsRetention: 86400000,
                alertThresholds: {
                    responseTime: 1000,
                    errorRate: 0.05,
                    memoryUsage: 0.8
                }
            },
            pluginEcosystem: {
                pluginDirectory: '/test/plugins',
                sandboxing: { enabled: true, timeout: 5000 },
                security: { requireSignature: false }
            }
        });
        await integrationLayer.initialize();
    });
    afterEach(async () => {
        await integrationLayer.cleanup();
        profiler.reset();
    });
    describe('Initialization Performance', () => {
        it('should initialize all components within acceptable time', async () => {
            const freshLayer = new MCPIntegrationLayer_1.MCPIntegrationLayer({
                orchestrator: { maxAgents: 50 },
                browserAutomation: { headless: true },
                security: { encryptionKey: 'test-key-32-characters-long-123' },
                realtimeCommunication: { port: 8081 },
                monitoring: { metricsRetention: 3600000 },
                pluginEcosystem: { pluginDirectory: '/test' }
            });
            profiler.start('full-initialization');
            const result = await freshLayer.initialize();
            const initTime = profiler.end('full-initialization');
            expect(result.success).toBe(true);
            expect(initTime).toBeLessThan(5000); // Should initialize within 5 seconds
            await freshLayer.cleanup();
            console.log(`Full initialization time: ${initTime.toFixed(2)}ms`);
        });
        it('should handle concurrent initializations efficiently', async () => {
            const concurrentCount = 10;
            const initPromises = [];
            profiler.start('concurrent-initialization');
            for (let i = 0; i < concurrentCount; i++) {
                const layer = new MCPIntegrationLayer_1.MCPIntegrationLayer({
                    orchestrator: { maxAgents: 10 },
                    browserAutomation: { headless: true },
                    security: { encryptionKey: 'test-key-32-characters-long-123' },
                    realtimeCommunication: { port: 8090 + i },
                    monitoring: { metricsRetention: 3600000 },
                    pluginEcosystem: { pluginDirectory: '/test' }
                });
                initPromises.push(layer.initialize().then(result => ({ layer, result })));
            }
            const results = await Promise.all(initPromises);
            const totalTime = profiler.end('concurrent-initialization');
            // Cleanup
            await Promise.all(results.map(({ layer }) => layer.cleanup()));
            expect(results.every(({ result }) => result.success)).toBe(true);
            expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
            console.log(`Concurrent initialization (${concurrentCount}): ${totalTime.toFixed(2)}ms`);
            console.log(`Average per instance: ${(totalTime / concurrentCount).toFixed(2)}ms`);
        });
    });
    describe('Agent Registration Performance', () => {
        it('should register agents efficiently at scale', async () => {
            const agentCount = 100;
            const registrationTimes = [];
            for (let i = 0; i < agentCount; i++) {
                const agent = {
                    id: `perf-agent-${i}`,
                    name: `Performance Agent ${i}`,
                    capabilities: ['test-operations'],
                    endpoint: `ws://localhost:${8100 + i}`
                };
                profiler.start(`register-agent-${i}`);
                const result = await integrationLayer.registerAgent(agent);
                const regTime = profiler.end(`register-agent-${i}`);
                expect(result.success).toBe(true);
                registrationTimes.push(regTime);
            }
            const avgRegistrationTime = registrationTimes.reduce((a, b) => a + b, 0) / agentCount;
            const maxRegistrationTime = Math.max(...registrationTimes);
            const minRegistrationTime = Math.min(...registrationTimes);
            expect(avgRegistrationTime).toBeLessThan(100); // Average under 100ms
            expect(maxRegistrationTime).toBeLessThan(500); // Max under 500ms
            console.log(`Agent registration performance (${agentCount} agents):`);
            console.log(`- Average: ${avgRegistrationTime.toFixed(2)}ms`);
            console.log(`- Min: ${minRegistrationTime.toFixed(2)}ms`);
            console.log(`- Max: ${maxRegistrationTime.toFixed(2)}ms`);
        });
        it('should handle concurrent agent registrations', async () => {
            const concurrentCount = 50;
            const registrationPromises = [];
            profiler.start('concurrent-registrations');
            for (let i = 0; i < concurrentCount; i++) {
                const agent = {
                    id: `concurrent-agent-${i}`,
                    name: `Concurrent Agent ${i}`,
                    capabilities: ['concurrent-test'],
                    endpoint: `ws://localhost:${8200 + i}`
                };
                registrationPromises.push(integrationLayer.registerAgent(agent));
            }
            const results = await Promise.all(registrationPromises);
            const totalTime = profiler.end('concurrent-registrations');
            expect(results.every(r => r.success)).toBe(true);
            expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
            console.log(`Concurrent registrations (${concurrentCount}): ${totalTime.toFixed(2)}ms`);
            console.log(`Throughput: ${(concurrentCount / (totalTime / 1000)).toFixed(2)} registrations/sec`);
        });
    });
    describe('Task Execution Performance', () => {
        beforeEach(async () => {
            // Register test agent
            await integrationLayer.registerAgent({
                id: 'perf-test-agent',
                name: 'Performance Test Agent',
                capabilities: ['performance-testing'],
                endpoint: 'ws://localhost:8300'
            });
        });
        it('should execute tasks with low latency', async () => {
            const taskCount = 100;
            const executionTimes = [];
            for (let i = 0; i < taskCount; i++) {
                profiler.start(`task-execution-${i}`);
                const result = await integrationLayer.executeAgentTask('perf-test-agent', {
                    action: 'performance-test',
                    parameters: {
                        taskId: i,
                        complexity: 'low'
                    }
                });
                const execTime = profiler.end(`task-execution-${i}`);
                expect(result.success).toBe(true);
                executionTimes.push(execTime);
            }
            const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / taskCount;
            const p95ExecutionTime = executionTimes.sort((a, b) => a - b)[Math.floor(taskCount * 0.95)];
            expect(avgExecutionTime).toBeLessThan(200); // Average under 200ms
            expect(p95ExecutionTime).toBeLessThan(500); // P95 under 500ms
            console.log(`Task execution performance (${taskCount} tasks):`);
            console.log(`- Average: ${avgExecutionTime.toFixed(2)}ms`);
            console.log(`- P95: ${p95ExecutionTime.toFixed(2)}ms`);
        });
        it('should maintain performance under high concurrency', async () => {
            const concurrentTasks = 200;
            const taskPromises = [];
            profiler.start('concurrent-task-execution');
            for (let i = 0; i < concurrentTasks; i++) {
                const promise = integrationLayer.executeAgentTask('perf-test-agent', {
                    action: 'concurrent-test',
                    parameters: {
                        taskId: i,
                        delay: Math.random() * 100
                    }
                });
                taskPromises.push(promise);
            }
            const results = await Promise.all(taskPromises);
            const totalTime = profiler.end('concurrent-task-execution');
            const successfulTasks = results.filter(r => r.success).length;
            const throughput = successfulTasks / (totalTime / 1000);
            expect(successfulTasks).toBeGreaterThan(concurrentTasks * 0.95); // 95% success rate
            expect(throughput).toBeGreaterThan(50); // At least 50 tasks/sec
            console.log(`Concurrent task execution (${concurrentTasks} tasks):`);
            console.log(`- Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`- Successful: ${successfulTasks}/${concurrentTasks}`);
            console.log(`- Throughput: ${throughput.toFixed(2)} tasks/sec`);
        });
        it('should handle workflow execution efficiently', async () => {
            const workflowSteps = 20;
            const workflow = {
                id: 'performance-workflow',
                name: 'Performance Test Workflow',
                steps: Array.from({ length: workflowSteps }, (_, i) => ({
                    id: `step-${i}`,
                    agentId: 'perf-test-agent',
                    action: 'workflow-step',
                    parameters: { stepNumber: i },
                    dependencies: i > 0 ? [`step-${i - 1}`] : []
                }))
            };
            profiler.start('workflow-execution');
            const executionResult = await integrationLayer.executeWorkflow(workflow);
            expect(executionResult.success).toBe(true);
            // Monitor workflow completion
            let workflowStatus;
            let attempts = 0;
            do {
                await new Promise(resolve => setTimeout(resolve, 100));
                workflowStatus = await integrationLayer.getWorkflowStatus(executionResult.workflowId);
                attempts++;
            } while (workflowStatus.status === 'running' && attempts < 100);
            const totalTime = profiler.end('workflow-execution');
            expect(workflowStatus.status).toBe('completed');
            expect(workflowStatus.completedSteps).toBe(workflowSteps);
            expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
            console.log(`Workflow execution (${workflowSteps} steps): ${totalTime.toFixed(2)}ms`);
            console.log(`Average per step: ${(totalTime / workflowSteps).toFixed(2)}ms`);
        });
    });
    describe('Memory and Resource Performance', () => {
        it('should maintain stable memory usage under load', async () => {
            const initialMemory = process.memoryUsage();
            const memorySnapshots = [initialMemory];
            // Register multiple agents
            for (let i = 0; i < 50; i++) {
                await integrationLayer.registerAgent({
                    id: `memory-test-agent-${i}`,
                    name: `Memory Test Agent ${i}`,
                    capabilities: ['memory-test'],
                    endpoint: `ws://localhost:${8400 + i}`
                });
                if (i % 10 === 0) {
                    memorySnapshots.push(process.memoryUsage());
                }
            }
            // Execute many tasks
            const taskPromises = [];
            for (let i = 0; i < 200; i++) {
                const agentId = `memory-test-agent-${i % 50}`;
                taskPromises.push(integrationLayer.executeAgentTask(agentId, {
                    action: 'memory-intensive-task',
                    parameters: { size: 1024 * 1024 } // 1MB data
                }));
            }
            await Promise.all(taskPromises);
            const finalMemory = process.memoryUsage();
            memorySnapshots.push(finalMemory);
            // Analyze memory growth
            const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
            const memoryGrowthMB = memoryGrowth / (1024 * 1024);
            expect(memoryGrowthMB).toBeLessThan(100); // Should not grow more than 100MB
            console.log('Memory usage analysis:');
            console.log(`- Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`- Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`- Growth: ${memoryGrowthMB.toFixed(2)}MB`);
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                const afterGCMemory = process.memoryUsage();
                console.log(`- After GC: ${(afterGCMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            }
        });
        it('should handle resource cleanup efficiently', async () => {
            const resourceCount = 100;
            const cleanupTimes = [];
            // Create resources
            for (let i = 0; i < resourceCount; i++) {
                await integrationLayer.registerAgent({
                    id: `cleanup-agent-${i}`,
                    name: `Cleanup Agent ${i}`,
                    capabilities: ['cleanup-test'],
                    endpoint: `ws://localhost:${8500 + i}`
                });
            }
            // Execute tasks to create more resources
            const taskPromises = [];
            for (let i = 0; i < resourceCount; i++) {
                taskPromises.push(integrationLayer.executeAgentTask(`cleanup-agent-${i}`, {
                    action: 'create-resources',
                    parameters: { count: 10 }
                }));
            }
            await Promise.all(taskPromises);
            // Measure cleanup performance
            profiler.start('resource-cleanup');
            await integrationLayer.cleanup();
            const cleanupTime = profiler.end('resource-cleanup');
            expect(cleanupTime).toBeLessThan(5000); // Should cleanup within 5 seconds
            console.log(`Resource cleanup (${resourceCount} agents): ${cleanupTime.toFixed(2)}ms`);
        });
    });
    describe('Scalability Performance', () => {
        it('should scale linearly with agent count', async () => {
            const agentCounts = [10, 25, 50, 100];
            const scalabilityResults = [];
            for (const agentCount of agentCounts) {
                // Create fresh integration layer for each test
                const testLayer = new MCPIntegrationLayer_1.MCPIntegrationLayer({
                    orchestrator: { maxAgents: agentCount * 2 },
                    browserAutomation: { headless: true },
                    security: { encryptionKey: 'test-key-32-characters-long-123' },
                    realtimeCommunication: { port: 8600 + agentCount },
                    monitoring: { metricsRetention: 3600000 },
                    pluginEcosystem: { pluginDirectory: '/test' }
                });
                await testLayer.initialize();
                // Measure agent registration time
                profiler.start(`scale-registration-${agentCount}`);
                const registrationPromises = [];
                for (let i = 0; i < agentCount; i++) {
                    registrationPromises.push(testLayer.registerAgent({
                        id: `scale-agent-${agentCount}-${i}`,
                        name: `Scale Agent ${i}`,
                        capabilities: ['scale-test'],
                        endpoint: `ws://localhost:${9000 + agentCount * 100 + i}`
                    }));
                }
                await Promise.all(registrationPromises);
                const registrationTime = profiler.end(`scale-registration-${agentCount}`);
                // Measure task execution time
                profiler.start(`scale-execution-${agentCount}`);
                const executionPromises = [];
                for (let i = 0; i < agentCount; i++) {
                    executionPromises.push(testLayer.executeAgentTask(`scale-agent-${agentCount}-${i}`, {
                        action: 'scale-test-task',
                        parameters: { agentIndex: i }
                    }));
                }
                const executionResults = await Promise.all(executionPromises);
                const executionTime = profiler.end(`scale-execution-${agentCount}`);
                const successfulExecutions = executionResults.filter(r => r.success).length;
                const throughput = successfulExecutions / (executionTime / 1000);
                scalabilityResults.push({
                    agentCount,
                    registrationTime,
                    executionTime,
                    throughput
                });
                await testLayer.cleanup();
                console.log(`Scalability test (${agentCount} agents):`);
                console.log(`- Registration: ${registrationTime.toFixed(2)}ms`);
                console.log(`- Execution: ${executionTime.toFixed(2)}ms`);
                console.log(`- Throughput: ${throughput.toFixed(2)} tasks/sec`);
            }
            // Analyze scalability
            const throughputs = scalabilityResults.map(r => r.throughput);
            const registrationTimes = scalabilityResults.map(r => r.registrationTime);
            // Throughput should not degrade significantly
            const throughputRatio = throughputs[throughputs.length - 1] / throughputs[0];
            expect(throughputRatio).toBeGreaterThan(0.5); // Should maintain at least 50% of initial throughput
            // Registration time should scale sub-linearly
            const registrationRatio = registrationTimes[registrationTimes.length - 1] / registrationTimes[0];
            const agentRatio = agentCounts[agentCounts.length - 1] / agentCounts[0];
            expect(registrationRatio).toBeLessThan(agentRatio * 2); // Should not scale worse than 2x linear
            console.log('\nScalability Analysis:');
            console.log(`- Throughput ratio (100/10 agents): ${throughputRatio.toFixed(2)}`);
            console.log(`- Registration time ratio: ${registrationRatio.toFixed(2)}`);
            console.log(`- Agent count ratio: ${agentRatio.toFixed(2)}`);
        });
        it('should handle burst traffic efficiently', async () => {
            // Register agents for burst test
            const agentCount = 20;
            for (let i = 0; i < agentCount; i++) {
                await integrationLayer.registerAgent({
                    id: `burst-agent-${i}`,
                    name: `Burst Agent ${i}`,
                    capabilities: ['burst-test'],
                    endpoint: `ws://localhost:${8700 + i}`
                });
            }
            // Simulate burst traffic patterns
            const burstSizes = [10, 50, 100, 200, 100, 50, 10];
            const burstResults = [];
            for (const burstSize of burstSizes) {
                profiler.start(`burst-${burstSize}`);
                const burstPromises = [];
                for (let i = 0; i < burstSize; i++) {
                    const agentId = `burst-agent-${i % agentCount}`;
                    burstPromises.push(integrationLayer.executeAgentTask(agentId, {
                        action: 'burst-task',
                        parameters: {
                            burstSize,
                            taskIndex: i
                        }
                    }));
                }
                const results = await Promise.all(burstPromises);
                const responseTime = profiler.end(`burst-${burstSize}`);
                const successfulTasks = results.filter(r => r.success).length;
                const successRate = successfulTasks / burstSize;
                burstResults.push({
                    burstSize,
                    responseTime,
                    successRate
                });
                console.log(`Burst test (${burstSize} tasks): ${responseTime.toFixed(2)}ms, ${(successRate * 100).toFixed(1)}% success`);
                // Brief pause between bursts
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Verify burst handling
            const avgSuccessRate = burstResults.reduce((sum, r) => sum + r.successRate, 0) / burstResults.length;
            expect(avgSuccessRate).toBeGreaterThan(0.9); // 90% average success rate
            const maxResponseTime = Math.max(...burstResults.map(r => r.responseTime));
            expect(maxResponseTime).toBeLessThan(10000); // Max 10 seconds for largest burst
        });
    });
    describe('Real-time Performance', () => {
        it('should maintain low latency for real-time operations', async () => {
            const messageCount = 1000;
            const latencies = [];
            // Setup real-time communication test
            for (let i = 0; i < messageCount; i++) {
                const startTime = performance.now();
                await integrationLayer.sendRealtimeMessage({
                    channel: 'performance-test',
                    message: {
                        id: i,
                        timestamp: startTime,
                        data: `Test message ${i}`
                    }
                });
                const endTime = performance.now();
                latencies.push(endTime - startTime);
            }
            const avgLatency = latencies.reduce((a, b) => a + b, 0) / messageCount;
            const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(messageCount * 0.95)];
            const maxLatency = Math.max(...latencies);
            expect(avgLatency).toBeLessThan(10); // Average under 10ms
            expect(p95Latency).toBeLessThan(50); // P95 under 50ms
            expect(maxLatency).toBeLessThan(200); // Max under 200ms
            console.log(`Real-time messaging performance (${messageCount} messages):`);
            console.log(`- Average latency: ${avgLatency.toFixed(2)}ms`);
            console.log(`- P95 latency: ${p95Latency.toFixed(2)}ms`);
            console.log(`- Max latency: ${maxLatency.toFixed(2)}ms`);
        });
        it('should handle high-frequency updates efficiently', async () => {
            const updateFrequency = 100; // Updates per second
            const testDuration = 5000; // 5 seconds
            const expectedUpdates = (testDuration / 1000) * updateFrequency;
            let updateCount = 0;
            const updateLatencies = [];
            const updateInterval = setInterval(async () => {
                const startTime = performance.now();
                await integrationLayer.updateMetrics({
                    timestamp: Date.now(),
                    metrics: {
                        updateCount: ++updateCount,
                        frequency: updateFrequency
                    }
                });
                const latency = performance.now() - startTime;
                updateLatencies.push(latency);
            }, 1000 / updateFrequency);
            // Wait for test duration
            await new Promise(resolve => setTimeout(resolve, testDuration));
            clearInterval(updateInterval);
            const avgUpdateLatency = updateLatencies.reduce((a, b) => a + b, 0) / updateLatencies.length;
            const updateRate = updateCount / (testDuration / 1000);
            expect(updateCount).toBeGreaterThan(expectedUpdates * 0.9); // At least 90% of expected updates
            expect(avgUpdateLatency).toBeLessThan(20); // Average under 20ms
            expect(updateRate).toBeGreaterThan(updateFrequency * 0.9); // At least 90% of target frequency
            console.log(`High-frequency updates (${updateFrequency}Hz for ${testDuration}ms):`);
            console.log(`- Expected updates: ${expectedUpdates}`);
            console.log(`- Actual updates: ${updateCount}`);
            console.log(`- Update rate: ${updateRate.toFixed(2)}Hz`);
            console.log(`- Average latency: ${avgUpdateLatency.toFixed(2)}ms`);
        });
    });
    afterAll(() => {
        // Print final performance summary
        const allStats = profiler.getAllStats();
        console.log('\n=== Performance Test Summary ===');
        Object.entries(allStats).forEach(([label, stats]) => {
            if (stats && stats.count > 1) {
                console.log(`${label}:`);
                console.log(`  Count: ${stats.count}`);
                console.log(`  Mean: ${stats.mean.toFixed(2)}ms`);
                console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
                console.log(`  Max: ${stats.max.toFixed(2)}ms`);
            }
        });
    });
});
//# sourceMappingURL=performance.test.js.map