/**
 * Load Testing Utilities for MCP System
 *
 * These utilities provide comprehensive load testing capabilities
 * for MCP servers, clients, and the overall system performance
 * under various stress conditions.
 */
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
export class LoadTestRunner extends EventEmitter {
    constructor(server) {
        super();
        this.activeClients = new Set();
        this.metrics = {};
        this.responseTimes = [];
        this.errorCounts = new Map();
        this.memorySnapshots = [];
        this.isRunning = false;
        this.server = server;
    }
    async runLoadTest(config) {
        this.emit('testStarted', { config });
        try {
            const result = await this.executeLoadTest(config);
            this.emit('testCompleted', { result });
            return result;
        }
        catch (error) {
            this.emit('testFailed', { error });
            throw error;
        }
        finally {
            this.cleanup();
        }
    }
    async executeLoadTest(config) {
        this.isRunning = true;
        this.resetMetrics();
        const startTime = performance.now();
        const initialMemory = process.memoryUsage();
        const initialCpu = process.cpuUsage();
        // Record initial metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            memoryUsage: {
                initial: initialMemory,
                final: initialMemory,
                peak: initialMemory
            },
            cpuUsage: {
                initial: initialCpu,
                final: initialCpu
            },
            errorBreakdown: new Map(),
            latencyDistribution: []
        };
        // Start memory monitoring
        const memoryMonitor = this.startMemoryMonitoring();
        try {
            // Warmup phase
            if (config.warmupRequests && config.warmupRequests > 0) {
                await this.runWarmup(config);
            }
            // Main load test execution
            await this.executeMainLoadTest(config, startTime);
            // Calculate final metrics
            const endTime = performance.now();
            const finalMemory = process.memoryUsage();
            const finalCpu = process.cpuUsage(initialCpu);
            this.calculateFinalMetrics(endTime - startTime, finalMemory, finalCpu);
            clearInterval(memoryMonitor);
            return this.generateResult(config);
        }
        catch (error) {
            clearInterval(memoryMonitor);
            throw error;
        }
    }
    async runWarmup(config) {
        this.emit('warmupStarted', { requests: config.warmupRequests });
        const warmupScenario = config.mixedLoad?.[0] || {
            name: 'default-warmup',
            weight: 1,
            requestGenerator: () => ({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'resources/list',
                params: {}
            })
        };
        const warmupPromises = [];
        for (let i = 0; i < (config.warmupRequests || 0); i++) {
            warmupPromises.push(this.executeRequest(warmupScenario.requestGenerator(), false));
        }
        await Promise.all(warmupPromises);
        // Reset metrics after warmup
        this.resetMetrics();
        this.emit('warmupCompleted');
    }
    async executeMainLoadTest(config, startTime) {
        const clients = await this.createClients(config);
        // Ramp up phase
        if (config.rampUpTime && config.rampUpTime > 0) {
            await this.rampUpClients(clients, config.rampUpTime);
        }
        else {
            // Start all clients immediately
            await Promise.all(clients.map(client => client.start()));
        }
        // Main load phase
        const mainLoadDuration = config.duration - (config.rampUpTime || 0) - (config.rampDownTime || 0);
        await this.waitForDuration(mainLoadDuration);
        // Ramp down phase
        if (config.rampDownTime && config.rampDownTime > 0) {
            await this.rampDownClients(clients, config.rampDownTime);
        }
        else {
            // Stop all clients immediately
            await Promise.all(clients.map(client => client.stop()));
        }
    }
    async createClients(config) {
        const clients = [];
        for (let i = 0; i < config.concurrency; i++) {
            const client = new LoadTestClient(this.server, config.mixedLoad || this.getDefaultScenarios(), config.requestsPerSecond ? config.requestsPerSecond / config.concurrency : undefined);
            client.on('response', (data) => this.recordResponse(data.responseTime, null));
            client.on('error', (data) => this.recordResponse(data.responseTime || 0, data.error));
            clients.push(client);
            this.activeClients.add(client);
        }
        return clients;
    }
    getDefaultScenarios() {
        return [
            {
                name: 'list-resources',
                weight: 0.3,
                requestGenerator: () => ({
                    jsonrpc: '2.0',
                    id: `list-${Date.now()}-${Math.random()}`,
                    method: 'resources/list',
                    params: {}
                })
            },
            {
                name: 'read-resource',
                weight: 0.4,
                requestGenerator: () => ({
                    jsonrpc: '2.0',
                    id: `read-${Date.now()}-${Math.random()}`,
                    method: 'resources/read',
                    params: { uri: 'file:///test/document.txt' }
                })
            },
            {
                name: 'call-tool',
                weight: 0.3,
                requestGenerator: () => ({
                    jsonrpc: '2.0',
                    id: `tool-${Date.now()}-${Math.random()}`,
                    method: 'tools/call',
                    params: {
                        name: 'calculator',
                        arguments: { expression: `${Math.floor(Math.random() * 100)} + ${Math.floor(Math.random() * 100)}` }
                    }
                })
            }
        ];
    }
    async rampUpClients(clients, rampUpTime) {
        this.emit('rampUpStarted', { duration: rampUpTime });
        const interval = rampUpTime / clients.length;
        for (let i = 0; i < clients.length; i++) {
            await new Promise(resolve => setTimeout(resolve, interval));
            await clients[i].start();
            this.emit('clientStarted', {
                clientIndex: i,
                totalClients: clients.length,
                progress: (i + 1) / clients.length
            });
        }
        this.emit('rampUpCompleted');
    }
    async rampDownClients(clients, rampDownTime) {
        this.emit('rampDownStarted', { duration: rampDownTime });
        const interval = rampDownTime / clients.length;
        for (let i = 0; i < clients.length; i++) {
            await clients[i].stop();
            await new Promise(resolve => setTimeout(resolve, interval));
            this.emit('clientStopped', {
                clientIndex: i,
                totalClients: clients.length,
                progress: (i + 1) / clients.length
            });
        }
        this.emit('rampDownCompleted');
    }
    async waitForDuration(duration) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                this.emit('progress', {
                    elapsed,
                    remaining: duration - elapsed,
                    progress: Math.min(progress, 1),
                    metrics: this.getCurrentMetrics()
                });
                if (elapsed >= duration) {
                    clearInterval(progressInterval);
                    resolve();
                }
            }, 1000); // Update every second
        });
    }
    startMemoryMonitoring() {
        return setInterval(() => {
            const currentMemory = process.memoryUsage();
            this.memorySnapshots.push(currentMemory);
            // Update peak memory usage
            if (this.metrics.memoryUsage && currentMemory.heapUsed > this.metrics.memoryUsage.peak.heapUsed) {
                this.metrics.memoryUsage.peak = currentMemory;
            }
        }, 1000);
    }
    recordResponse(responseTime, error) {
        this.metrics.totalRequests = (this.metrics.totalRequests || 0) + 1;
        this.responseTimes.push(responseTime);
        if (error) {
            this.metrics.failedRequests = (this.metrics.failedRequests || 0) + 1;
            const errorType = error.name || 'UnknownError';
            const currentCount = this.errorCounts.get(errorType) || 0;
            this.errorCounts.set(errorType, currentCount + 1);
        }
        else {
            this.metrics.successfulRequests = (this.metrics.successfulRequests || 0) + 1;
        }
        this.emit('requestCompleted', {
            responseTime,
            error,
            totalRequests: this.metrics.totalRequests,
            successRate: (this.metrics.successfulRequests || 0) / this.metrics.totalRequests
        });
    }
    calculateFinalMetrics(totalDuration, finalMemory, finalCpu) {
        this.responseTimes.sort((a, b) => a - b);
        this.metrics.totalDuration = totalDuration;
        this.metrics.avgResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length || 0;
        this.metrics.minResponseTime = this.responseTimes[0] || 0;
        this.metrics.maxResponseTime = this.responseTimes[this.responseTimes.length - 1] || 0;
        this.metrics.p50ResponseTime = this.calculatePercentile(this.responseTimes, 0.5);
        this.metrics.p95ResponseTime = this.calculatePercentile(this.responseTimes, 0.95);
        this.metrics.p99ResponseTime = this.calculatePercentile(this.responseTimes, 0.99);
        this.metrics.requestsPerSecond = (this.metrics.totalRequests || 0) / (totalDuration / 1000);
        this.metrics.errorsPerSecond = (this.metrics.failedRequests || 0) / (totalDuration / 1000);
        this.metrics.errorBreakdown = this.errorCounts;
        this.metrics.latencyDistribution = this.responseTimes;
        if (this.metrics.memoryUsage) {
            this.metrics.memoryUsage.final = finalMemory;
        }
        if (this.metrics.cpuUsage) {
            this.metrics.cpuUsage.final = finalCpu;
        }
    }
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = Math.ceil(sortedArray.length * percentile) - 1;
        return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
    }
    getCurrentMetrics() {
        const currentTime = performance.now();
        return {
            totalRequests: this.metrics.totalRequests,
            successfulRequests: this.metrics.successfulRequests,
            failedRequests: this.metrics.failedRequests,
            avgResponseTime: this.responseTimes.length > 0
                ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
                : 0
        };
    }
    generateResult(config) {
        const successRate = (this.metrics.successfulRequests || 0) / (this.metrics.totalRequests || 1);
        const errors = [];
        const recommendations = [];
        // Analyze results and generate recommendations
        if (successRate < 0.99) {
            errors.push(`Low success rate: ${(successRate * 100).toFixed(2)}%`);
            recommendations.push('Investigate error causes and improve error handling');
        }
        if ((this.metrics.avgResponseTime || 0) > 1000) {
            recommendations.push('Average response time is high - consider optimizing request processing');
        }
        if ((this.metrics.p95ResponseTime || 0) > 5000) {
            recommendations.push('95th percentile response time is very high - investigate performance bottlenecks');
        }
        const memoryIncrease = this.metrics.memoryUsage
            ? this.metrics.memoryUsage.final.heapUsed - this.metrics.memoryUsage.initial.heapUsed
            : 0;
        if (memoryIncrease > 100 * 1024 * 1024) { // 100MB
            recommendations.push('Significant memory usage increase detected - check for memory leaks');
        }
        if ((this.metrics.requestsPerSecond || 0) < config.requestsPerSecond * 0.8) {
            recommendations.push('Actual throughput is significantly lower than target - system may be overloaded');
        }
        return {
            config,
            metrics: this.metrics,
            success: errors.length === 0 && successRate >= 0.95,
            errors,
            recommendations
        };
    }
    resetMetrics() {
        this.responseTimes = [];
        this.errorCounts.clear();
        this.memorySnapshots = [];
    }
    cleanup() {
        this.isRunning = false;
        // Stop all active clients
        for (const client of this.activeClients) {
            client.stop().catch(() => { }); // Ignore errors during cleanup
        }
        this.activeClients.clear();
    }
    async executeRequest(request, recordMetrics = true) {
        const startTime = performance.now();
        try {
            await this.server.handleRequest(request);
            const responseTime = performance.now() - startTime;
            if (recordMetrics) {
                this.recordResponse(responseTime, null);
            }
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            if (recordMetrics) {
                this.recordResponse(responseTime, error);
            }
        }
    }
}
class LoadTestClient extends EventEmitter {
    constructor(server, scenarios, targetRps) {
        super();
        this.isRunning = false;
        this.server = server;
        this.scenarios = scenarios;
        this.targetRps = targetRps;
    }
    async start() {
        this.isRunning = true;
        if (this.targetRps) {
            // Fixed rate execution
            const intervalMs = 1000 / this.targetRps;
            this.requestInterval = setInterval(() => {
                if (this.isRunning) {
                    this.executeRandomRequest();
                }
            }, intervalMs);
        }
        else {
            // Continuous execution
            this.continuousExecution();
        }
    }
    async stop() {
        this.isRunning = false;
        if (this.requestInterval) {
            clearInterval(this.requestInterval);
        }
    }
    async continuousExecution() {
        while (this.isRunning) {
            await this.executeRandomRequest();
            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    async executeRandomRequest() {
        const scenario = this.selectRandomScenario();
        const request = scenario.requestGenerator();
        const startTime = performance.now();
        try {
            await this.server.handleRequest(request);
            const responseTime = performance.now() - startTime;
            this.emit('response', { responseTime, scenario: scenario.name });
        }
        catch (error) {
            const responseTime = performance.now() - startTime;
            this.emit('error', { error, responseTime, scenario: scenario.name });
        }
    }
    selectRandomScenario() {
        const totalWeight = this.scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
        let random = Math.random() * totalWeight;
        for (const scenario of this.scenarios) {
            random -= scenario.weight;
            if (random <= 0) {
                return scenario;
            }
        }
        return this.scenarios[0]; // Fallback
    }
}
// Utility functions for creating load test scenarios
export class LoadTestScenarios {
    static createResourceLoadScenarios(resourceUris) {
        return [
            {
                name: 'list-resources',
                weight: 0.2,
                requestGenerator: () => ({
                    jsonrpc: '2.0',
                    id: `list-${Date.now()}-${Math.random()}`,
                    method: 'resources/list',
                    params: {}
                })
            },
            {
                name: 'read-specific-resources',
                weight: 0.6,
                requestGenerator: () => {
                    const uri = resourceUris[Math.floor(Math.random() * resourceUris.length)];
                    return {
                        jsonrpc: '2.0',
                        id: `read-${Date.now()}-${Math.random()}`,
                        method: 'resources/read',
                        params: { uri }
                    };
                }
            },
            {
                name: 'subscribe-to-resources',
                weight: 0.1,
                requestGenerator: () => {
                    const uri = resourceUris[Math.floor(Math.random() * resourceUris.length)];
                    return {
                        jsonrpc: '2.0',
                        id: `subscribe-${Date.now()}-${Math.random()}`,
                        method: 'resources/subscribe',
                        params: { uri }
                    };
                }
            },
            {
                name: 'filter-resources',
                weight: 0.1,
                requestGenerator: () => ({
                    jsonrpc: '2.0',
                    id: `filter-${Date.now()}-${Math.random()}`,
                    method: 'resources/list',
                    params: { pattern: '*.txt' }
                })
            }
        ];
    }
    static createToolLoadScenarios(tools) {
        return tools.map(tool => ({
            name: `call-${tool.name}`,
            weight: 1 / tools.length,
            requestGenerator: () => ({
                jsonrpc: '2.0',
                id: `tool-${tool.name}-${Date.now()}-${Math.random()}`,
                method: 'tools/call',
                params: {
                    name: tool.name,
                    arguments: tool.testParams
                }
            })
        }));
    }
    static createMixedLoadScenarios(resourceUris, tools) {
        const resourceScenarios = this.createResourceLoadScenarios(resourceUris);
        const toolScenarios = this.createToolLoadScenarios(tools);
        // Reweight to balance resources and tools
        resourceScenarios.forEach(scenario => scenario.weight *= 0.5);
        toolScenarios.forEach(scenario => scenario.weight *= 0.5);
        return [...resourceScenarios, ...toolScenarios];
    }
}
// Load test report generator
export class LoadTestReporter {
    static generateReport(result) {
        const { config, metrics, success, errors, recommendations } = result;
        let report = '';
        report += '═══════════════════════════════════════════════════════════════\n';
        report += '                      LOAD TEST REPORT                        \n';
        report += '═══════════════════════════════════════════════════════════════\n\n';
        // Test Configuration
        report += 'TEST CONFIGURATION:\n';
        report += `  Duration: ${config.duration}ms\n`;
        report += `  Concurrency: ${config.concurrency}\n`;
        report += `  Target RPS: ${config.requestsPerSecond || 'unlimited'}\n`;
        report += `  Ramp Up: ${config.rampUpTime || 0}ms\n`;
        report += `  Ramp Down: ${config.rampDownTime || 0}ms\n`;
        report += `  Scenarios: ${config.mixedLoad?.length || 0}\n\n`;
        // Overall Results
        report += 'OVERALL RESULTS:\n';
        report += `  Status: ${success ? '✅ PASSED' : '❌ FAILED'}\n`;
        report += `  Total Requests: ${metrics.totalRequests}\n`;
        report += `  Successful: ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%)\n`;
        report += `  Failed: ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(2)}%)\n`;
        report += `  Actual RPS: ${metrics.requestsPerSecond.toFixed(2)}\n`;
        report += `  Error Rate: ${metrics.errorsPerSecond.toFixed(2)} errors/sec\n\n`;
        // Performance Metrics
        report += 'PERFORMANCE METRICS:\n';
        report += `  Average Response Time: ${metrics.avgResponseTime.toFixed(2)}ms\n`;
        report += `  Min Response Time: ${metrics.minResponseTime.toFixed(2)}ms\n`;
        report += `  Max Response Time: ${metrics.maxResponseTime.toFixed(2)}ms\n`;
        report += `  50th Percentile: ${metrics.p50ResponseTime.toFixed(2)}ms\n`;
        report += `  95th Percentile: ${metrics.p95ResponseTime.toFixed(2)}ms\n`;
        report += `  99th Percentile: ${metrics.p99ResponseTime.toFixed(2)}ms\n\n`;
        // Memory Usage
        report += 'MEMORY USAGE:\n';
        report += `  Initial Heap: ${(metrics.memoryUsage.initial.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
        report += `  Final Heap: ${(metrics.memoryUsage.final.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
        report += `  Peak Heap: ${(metrics.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
        report += `  Heap Growth: ${((metrics.memoryUsage.final.heapUsed - metrics.memoryUsage.initial.heapUsed) / 1024 / 1024).toFixed(2)}MB\n\n`;
        // Error Breakdown
        if (metrics.errorBreakdown.size > 0) {
            report += 'ERROR BREAKDOWN:\n';
            for (const [errorType, count] of metrics.errorBreakdown) {
                report += `  ${errorType}: ${count}\n`;
            }
            report += '\n';
        }
        // Issues
        if (errors.length > 0) {
            report += 'ISSUES DETECTED:\n';
            errors.forEach(error => {
                report += `  ❌ ${error}\n`;
            });
            report += '\n';
        }
        // Recommendations
        if (recommendations.length > 0) {
            report += 'RECOMMENDATIONS:\n';
            recommendations.forEach(recommendation => {
                report += `  💡 ${recommendation}\n`;
            });
            report += '\n';
        }
        report += '═══════════════════════════════════════════════════════════════\n';
        return report;
    }
    static generateCSVReport(result) {
        let csv = 'metric,value,unit\n';
        const m = result.metrics;
        csv += `total_requests,${m.totalRequests},count\n`;
        csv += `successful_requests,${m.successfulRequests},count\n`;
        csv += `failed_requests,${m.failedRequests},count\n`;
        csv += `requests_per_second,${m.requestsPerSecond.toFixed(2)},req/sec\n`;
        csv += `avg_response_time,${m.avgResponseTime.toFixed(2)},ms\n`;
        csv += `min_response_time,${m.minResponseTime.toFixed(2)},ms\n`;
        csv += `max_response_time,${m.maxResponseTime.toFixed(2)},ms\n`;
        csv += `p50_response_time,${m.p50ResponseTime.toFixed(2)},ms\n`;
        csv += `p95_response_time,${m.p95ResponseTime.toFixed(2)},ms\n`;
        csv += `p99_response_time,${m.p99ResponseTime.toFixed(2)},ms\n`;
        csv += `initial_heap_mb,${(m.memoryUsage.initial.heapUsed / 1024 / 1024).toFixed(2)},MB\n`;
        csv += `final_heap_mb,${(m.memoryUsage.final.heapUsed / 1024 / 1024).toFixed(2)},MB\n`;
        csv += `peak_heap_mb,${(m.memoryUsage.peak.heapUsed / 1024 / 1024).toFixed(2)},MB\n`;
        return csv;
    }
}
//# sourceMappingURL=load-test.js.map