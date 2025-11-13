"use strict";
/**
 * Performance Validator Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PerformanceValidator_1 = require("./PerformanceValidator");
(0, vitest_1.describe)('PerformanceValidator', () => {
    let validator;
    (0, vitest_1.beforeEach)(() => {
        validator = new PerformanceValidator_1.PerformanceValidator();
    });
    (0, vitest_1.describe)('Performance Validation', () => {
        (0, vitest_1.it)('should validate performance against targets', async () => {
            const scenario = {
                name: 'Basic Performance Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 1000,
                        users: { start: 1, end: 5, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const targets = {
                maxAvgResponseTime: 1000,
                maxP95ResponseTime: 2000,
                maxP99ResponseTime: 5000,
                minRPS: 1,
                minSuccessRate: 0.9,
                maxErrorRate: 0.1,
                maxMemoryUsage: 1024 * 1024 * 1024,
                maxCPUUsage: 80,
                minConcurrentConnections: 1
            };
            const result = await validator.validatePerformance(scenario, targets);
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result).toHaveProperty('passed');
            (0, vitest_1.expect)(result).toHaveProperty('score');
            (0, vitest_1.expect)(result).toHaveProperty('validations');
            (0, vitest_1.expect)(result).toHaveProperty('metrics');
            (0, vitest_1.expect)(result).toHaveProperty('recommendations');
            (0, vitest_1.expect)(typeof result.passed).toBe('boolean');
            (0, vitest_1.expect)(typeof result.score).toBe('number');
            (0, vitest_1.expect)(result.score).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(result.score).toBeLessThanOrEqual(100);
            (0, vitest_1.expect)(Array.isArray(result.validations)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(result.recommendations)).toBe(true);
        });
        (0, vitest_1.it)('should identify failed validations', async () => {
            const scenario = {
                name: 'Strict Performance Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 500,
                        users: { start: 1, end: 2, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            // Very strict targets that are likely to fail
            const strictTargets = {
                maxAvgResponseTime: 1, // 1ms - very strict
                maxP95ResponseTime: 2,
                maxP99ResponseTime: 5,
                minRPS: 10000, // Very high RPS requirement
                minSuccessRate: 0.99,
                maxErrorRate: 0.001,
                maxMemoryUsage: 1024, // Very low memory limit
                maxCPUUsage: 1,
                minConcurrentConnections: 1000
            };
            const result = await validator.validatePerformance(scenario, strictTargets);
            (0, vitest_1.expect)(result.passed).toBe(false);
            (0, vitest_1.expect)(result.score).toBeLessThan(100);
            const failedValidations = result.validations.filter(v => !v.passed);
            (0, vitest_1.expect)(failedValidations.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(result.recommendations.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should provide meaningful recommendations', async () => {
            const scenario = {
                name: 'Recommendation Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 500,
                        users: { start: 1, end: 2, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const targets = {
                maxAvgResponseTime: 10, // Low threshold to trigger recommendation
                maxP95ResponseTime: 20,
                maxP99ResponseTime: 50,
                minRPS: 1000, // High threshold to trigger recommendation
                minSuccessRate: 0.99,
                maxErrorRate: 0.001, // Low threshold to trigger recommendation
                maxMemoryUsage: 1024 * 1024, // Low threshold to trigger recommendation
                maxCPUUsage: 10, // Low threshold to trigger recommendation
                minConcurrentConnections: 1
            };
            const result = await validator.validatePerformance(scenario, targets);
            (0, vitest_1.expect)(result.recommendations.length).toBeGreaterThan(0);
            // Check for specific recommendation types
            const hasResponseTimeRec = result.recommendations.some(rec => rec.includes('caching') || rec.includes('optimize'));
            const hasThroughputRec = result.recommendations.some(rec => rec.includes('scaling') || rec.includes('load balancing'));
            (0, vitest_1.expect)(hasResponseTimeRec || hasThroughputRec).toBe(true);
        });
    });
    (0, vitest_1.describe)('Scalability Testing', () => {
        (0, vitest_1.it)('should run scalability test with increasing load', async () => {
            const baseScenario = {
                name: 'Scalability Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 500,
                        users: { start: 1, end: 1, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const { results, scalabilityAnalysis } = await validator.runScalabilityTest(baseScenario);
            (0, vitest_1.expect)(Array.isArray(results)).toBe(true);
            (0, vitest_1.expect)(results.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(scalabilityAnalysis).toBeDefined();
            (0, vitest_1.expect)(scalabilityAnalysis).toHaveProperty('linearScaling');
            (0, vitest_1.expect)(scalabilityAnalysis).toHaveProperty('optimalUserCount');
            (0, vitest_1.expect)(scalabilityAnalysis).toHaveProperty('bottlenecks');
            (0, vitest_1.expect)(scalabilityAnalysis).toHaveProperty('throughputData');
            (0, vitest_1.expect)(scalabilityAnalysis).toHaveProperty('scalabilityScore');
            (0, vitest_1.expect)(typeof scalabilityAnalysis.linearScaling).toBe('boolean');
            (0, vitest_1.expect)(typeof scalabilityAnalysis.optimalUserCount).toBe('number');
            (0, vitest_1.expect)(Array.isArray(scalabilityAnalysis.bottlenecks)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(scalabilityAnalysis.throughputData)).toBe(true);
            (0, vitest_1.expect)(typeof scalabilityAnalysis.scalabilityScore).toBe('number');
        });
        (0, vitest_1.it)('should identify optimal user count', async () => {
            const baseScenario = {
                name: 'Optimal Load Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 300,
                        users: { start: 1, end: 1, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const { scalabilityAnalysis } = await validator.runScalabilityTest(baseScenario);
            (0, vitest_1.expect)(scalabilityAnalysis.optimalUserCount).toBeGreaterThan(0);
            (0, vitest_1.expect)(scalabilityAnalysis.scalabilityScore).toBeGreaterThanOrEqual(0);
            (0, vitest_1.expect)(scalabilityAnalysis.scalabilityScore).toBeLessThanOrEqual(100);
        });
    });
    (0, vitest_1.describe)('Stress Testing', () => {
        (0, vitest_1.it)('should run stress test to find breaking point', async () => {
            const baseScenario = {
                name: 'Stress Test',
                phases: [{
                        name: 'Stress Phase',
                        duration: 200, // Short duration for testing
                        users: { start: 1, end: 1, rampUp: 'linear' },
                        operations: [{
                                name: 'stress-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/stress'
                                }
                            }]
                    }]
            };
            const stressResult = await validator.runStressTest(baseScenario);
            (0, vitest_1.expect)(stressResult).toBeDefined();
            (0, vitest_1.expect)(stressResult).toHaveProperty('breakingPoint');
            (0, vitest_1.expect)(stressResult).toHaveProperty('degradationPoint');
            (0, vitest_1.expect)(stressResult).toHaveProperty('recoveryTime');
            (0, vitest_1.expect)(stressResult).toHaveProperty('stressMetrics');
            (0, vitest_1.expect)(typeof stressResult.breakingPoint).toBe('number');
            (0, vitest_1.expect)(typeof stressResult.degradationPoint).toBe('number');
            (0, vitest_1.expect)(typeof stressResult.recoveryTime).toBe('number');
            (0, vitest_1.expect)(Array.isArray(stressResult.stressMetrics)).toBe(true);
            (0, vitest_1.expect)(stressResult.breakingPoint).toBeGreaterThan(0);
            (0, vitest_1.expect)(stressResult.recoveryTime).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should identify degradation before breaking point', async () => {
            const baseScenario = {
                name: 'Degradation Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 100,
                        users: { start: 1, end: 1, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const stressResult = await validator.runStressTest(baseScenario);
            // Degradation point should be less than or equal to breaking point
            (0, vitest_1.expect)(stressResult.degradationPoint).toBeLessThanOrEqual(stressResult.breakingPoint);
        });
    });
    (0, vitest_1.describe)('Metrics Extraction', () => {
        (0, vitest_1.it)('should extract comprehensive metrics from test results', async () => {
            const scenario = {
                name: 'Metrics Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 500,
                        users: { start: 1, end: 2, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const targets = {
                maxAvgResponseTime: 1000,
                maxP95ResponseTime: 2000,
                maxP99ResponseTime: 5000,
                minRPS: 1,
                minSuccessRate: 0.9,
                maxErrorRate: 0.1,
                maxMemoryUsage: 1024 * 1024 * 1024,
                maxCPUUsage: 80,
                minConcurrentConnections: 1
            };
            const result = await validator.validatePerformance(scenario, targets);
            // Verify metrics structure
            (0, vitest_1.expect)(result.metrics).toHaveProperty('responseTime');
            (0, vitest_1.expect)(result.metrics).toHaveProperty('throughput');
            (0, vitest_1.expect)(result.metrics).toHaveProperty('errors');
            (0, vitest_1.expect)(result.metrics).toHaveProperty('resources');
            (0, vitest_1.expect)(result.metrics).toHaveProperty('scalability');
            // Response time metrics
            (0, vitest_1.expect)(result.metrics.responseTime).toHaveProperty('avg');
            (0, vitest_1.expect)(result.metrics.responseTime).toHaveProperty('p50');
            (0, vitest_1.expect)(result.metrics.responseTime).toHaveProperty('p95');
            (0, vitest_1.expect)(result.metrics.responseTime).toHaveProperty('p99');
            (0, vitest_1.expect)(result.metrics.responseTime).toHaveProperty('min');
            (0, vitest_1.expect)(result.metrics.responseTime).toHaveProperty('max');
            // Throughput metrics
            (0, vitest_1.expect)(result.metrics.throughput).toHaveProperty('rps');
            (0, vitest_1.expect)(result.metrics.throughput).toHaveProperty('bytesPerSecond');
            // Error metrics
            (0, vitest_1.expect)(result.metrics.errors).toHaveProperty('rate');
            (0, vitest_1.expect)(result.metrics.errors).toHaveProperty('count');
            (0, vitest_1.expect)(result.metrics.errors).toHaveProperty('types');
            // Resource metrics
            (0, vitest_1.expect)(result.metrics.resources).toHaveProperty('memoryUsage');
            (0, vitest_1.expect)(result.metrics.resources).toHaveProperty('cpuUsage');
            (0, vitest_1.expect)(result.metrics.resources).toHaveProperty('connections');
            // Scalability metrics
            (0, vitest_1.expect)(result.metrics.scalability).toHaveProperty('concurrentUsers');
            (0, vitest_1.expect)(result.metrics.scalability).toHaveProperty('linearScaling');
            (0, vitest_1.expect)(result.metrics.scalability).toHaveProperty('bottlenecks');
        });
    });
    (0, vitest_1.describe)('Target Validation', () => {
        (0, vitest_1.it)('should validate all target types correctly', async () => {
            const scenario = {
                name: 'Target Validation Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 300,
                        users: { start: 1, end: 1, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const targets = {
                maxAvgResponseTime: 1000,
                maxP95ResponseTime: 2000,
                maxP99ResponseTime: 5000,
                minRPS: 1,
                minSuccessRate: 0.9,
                maxErrorRate: 0.1,
                maxMemoryUsage: 1024 * 1024 * 1024,
                maxCPUUsage: 80,
                minConcurrentConnections: 1
            };
            const result = await validator.validatePerformance(scenario, targets);
            // Check that all target types are validated
            const targetNames = result.validations.map(v => v.target);
            (0, vitest_1.expect)(targetNames).toContain('Average Response Time');
            (0, vitest_1.expect)(targetNames).toContain('P95 Response Time');
            (0, vitest_1.expect)(targetNames).toContain('P99 Response Time');
            (0, vitest_1.expect)(targetNames).toContain('Requests per Second');
            (0, vitest_1.expect)(targetNames).toContain('Success Rate');
            (0, vitest_1.expect)(targetNames).toContain('Error Rate');
            (0, vitest_1.expect)(targetNames).toContain('Memory Usage');
            (0, vitest_1.expect)(targetNames).toContain('CPU Usage');
            // Each validation should have required properties
            result.validations.forEach(validation => {
                (0, vitest_1.expect)(validation).toHaveProperty('target');
                (0, vitest_1.expect)(validation).toHaveProperty('expected');
                (0, vitest_1.expect)(validation).toHaveProperty('actual');
                (0, vitest_1.expect)(validation).toHaveProperty('passed');
                (0, vitest_1.expect)(validation).toHaveProperty('deviation');
                (0, vitest_1.expect)(typeof validation.target).toBe('string');
                (0, vitest_1.expect)(typeof validation.expected).toBe('number');
                (0, vitest_1.expect)(typeof validation.actual).toBe('number');
                (0, vitest_1.expect)(typeof validation.passed).toBe('boolean');
                (0, vitest_1.expect)(typeof validation.deviation).toBe('number');
            });
        });
        (0, vitest_1.it)('should calculate deviation correctly', async () => {
            const scenario = {
                name: 'Deviation Test',
                phases: [{
                        name: 'Load Phase',
                        duration: 200,
                        users: { start: 1, end: 1, rampUp: 'linear' },
                        operations: [{
                                name: 'test-operation',
                                weight: 1,
                                request: {
                                    method: 'GET',
                                    path: '/test'
                                }
                            }]
                    }]
            };
            const targets = {
                maxAvgResponseTime: 100, // Likely to be exceeded
                maxP95ResponseTime: 200,
                maxP99ResponseTime: 500,
                minRPS: 1,
                minSuccessRate: 0.9,
                maxErrorRate: 0.1,
                maxMemoryUsage: 1024 * 1024 * 1024,
                maxCPUUsage: 80,
                minConcurrentConnections: 1
            };
            const result = await validator.validatePerformance(scenario, targets);
            // Find response time validation
            const responseTimeValidation = result.validations.find(v => v.target === 'Average Response Time');
            if (responseTimeValidation && !responseTimeValidation.passed) {
                (0, vitest_1.expect)(Math.abs(responseTimeValidation.deviation)).toBeGreaterThan(0);
            }
        });
    });
});
//# sourceMappingURL=PerformanceValidator.test.js.map