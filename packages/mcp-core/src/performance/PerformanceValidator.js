/**
 * Performance Validation System
 */
import { Logger } from '../utils/Logger';
import { LoadTestRunner } from './LoadTestRunner';
/**
 * Performance validator
 */
export class PerformanceValidator {
    logger;
    loadTestRunner;
    constructor(logger) {
        this.logger = logger || new Logger('PerformanceValidator');
        this.loadTestRunner = new LoadTestRunner(this.logger);
    }
    /**
     * Validate performance against targets
     */
    async validatePerformance(scenario, targets) {
        this.logger.info('Starting performance validation', {
            scenario: scenario.name,
            targets
        });
        // Run load test
        const testResult = await this.loadTestRunner.runScenario(scenario);
        // Extract metrics
        const metrics = this.extractMetrics(testResult);
        // Validate against targets
        const validations = this.validateTargets(metrics, targets);
        // Calculate score
        const score = this.calculateScore(validations);
        // Generate recommendations
        const recommendations = this.generateRecommendations(validations, metrics);
        const result = {
            passed: validations.every(v => v.passed),
            score,
            validations,
            metrics,
            recommendations
        };
        this.logger.info('Performance validation completed', {
            passed: result.passed,
            score: result.score,
            failedTargets: validations.filter(v => !v.passed).length
        });
        return result;
    }
    /**
     * Run scalability test
     */
    async runScalabilityTest(baseScenario) {
        this.logger.info('Starting scalability test');
        const userCounts = [10, 50, 100, 500, 1000];
        const results = [];
        // Default targets for scalability testing
        const targets = {
            maxAvgResponseTime: 1000,
            maxP95ResponseTime: 2000,
            maxP99ResponseTime: 5000,
            minRPS: 10,
            minSuccessRate: 0.95,
            maxErrorRate: 0.05,
            maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
            maxCPUUsage: 80,
            minConcurrentConnections: 10
        };
        // Run tests with increasing load
        for (const userCount of userCounts) {
            const scaledScenario = this.scaleScenario(baseScenario, userCount);
            const result = await this.validatePerformance(scaledScenario, targets);
            results.push(result);
            // Stop if performance degrades significantly
            if (!result.passed && result.score < 50) {
                this.logger.warn(`Stopping scalability test at ${userCount} users due to poor performance`);
                break;
            }
        }
        // Analyze scalability
        const scalabilityAnalysis = this.analyzeScalability(results, userCounts);
        return { results, scalabilityAnalysis };
    }
    /**
     * Run stress test
     */
    async runStressTest(baseScenario) {
        this.logger.info('Starting stress test');
        let currentUsers = 100;
        const increment = 100;
        const maxUsers = 5000;
        const stressMetrics = [];
        let breakingPoint = 0;
        let degradationPoint = 0;
        while (currentUsers <= maxUsers) {
            this.logger.info(`Testing with ${currentUsers} users`);
            const stressScenario = this.scaleScenario(baseScenario, currentUsers);
            const testResult = await this.loadTestRunner.runScenario(stressScenario);
            const metrics = this.extractMetrics(testResult);
            stressMetrics.push(metrics);
            // Check for degradation
            if (degradationPoint === 0 && (metrics.responseTime.avg > 2000 ||
                metrics.errors.rate > 0.1 ||
                metrics.throughput.rps < currentUsers * 0.1)) {
                degradationPoint = currentUsers;
                this.logger.info(`Performance degradation detected at ${currentUsers} users`);
            }
            // Check for breaking point
            if (breakingPoint === 0 && (metrics.responseTime.avg > 10000 ||
                metrics.errors.rate > 0.5 ||
                metrics.throughput.rps < currentUsers * 0.05)) {
                breakingPoint = currentUsers;
                this.logger.info(`Breaking point reached at ${currentUsers} users`);
                break;
            }
            currentUsers += increment;
        }
        // Test recovery
        const recoveryStartTime = Date.now();
        const recoveryScenario = this.scaleScenario(baseScenario, 50); // Low load
        await this.loadTestRunner.runScenario(recoveryScenario);
        const recoveryTime = Date.now() - recoveryStartTime;
        return {
            breakingPoint: breakingPoint || maxUsers,
            degradationPoint: degradationPoint || maxUsers,
            recoveryTime,
            stressMetrics
        };
    }
    /**
     * Extract metrics from test result
     */
    extractMetrics(testResult) {
        const overall = testResult.overall;
        return {
            responseTime: {
                avg: overall.responseTime.avg,
                p50: overall.responseTime.p50,
                p95: overall.responseTime.p95,
                p99: overall.responseTime.p99,
                min: overall.responseTime.min,
                max: overall.responseTime.max
            },
            throughput: {
                rps: overall.rps,
                bytesPerSecond: overall.throughput
            },
            errors: {
                rate: 1 - overall.successRate,
                count: overall.failedRequests,
                types: this.extractErrorTypes(testResult.errors)
            },
            resources: {
                memoryUsage: process.memoryUsage().heapUsed,
                cpuUsage: this.getCurrentCPUUsage(),
                connections: this.getCurrentConnectionCount()
            },
            scalability: {
                concurrentUsers: this.extractConcurrentUsers(testResult),
                linearScaling: this.checkLinearScaling(testResult),
                bottlenecks: this.identifyBottlenecks(testResult)
            }
        };
    }
    /**
     * Validate metrics against targets
     */
    validateTargets(metrics, targets) {
        const validations = [];
        // Response time validations
        validations.push(this.createValidation('Average Response Time', targets.maxAvgResponseTime, metrics.responseTime.avg, (actual, expected) => actual <= expected));
        validations.push(this.createValidation('P95 Response Time', targets.maxP95ResponseTime, metrics.responseTime.p95, (actual, expected) => actual <= expected));
        validations.push(this.createValidation('P99 Response Time', targets.maxP99ResponseTime, metrics.responseTime.p99, (actual, expected) => actual <= expected));
        // Throughput validations
        validations.push(this.createValidation('Requests per Second', targets.minRPS, metrics.throughput.rps, (actual, expected) => actual >= expected));
        // Error rate validations
        validations.push(this.createValidation('Success Rate', targets.minSuccessRate, 1 - metrics.errors.rate, (actual, expected) => actual >= expected));
        validations.push(this.createValidation('Error Rate', targets.maxErrorRate, metrics.errors.rate, (actual, expected) => actual <= expected));
        // Resource validations
        validations.push(this.createValidation('Memory Usage', targets.maxMemoryUsage, metrics.resources.memoryUsage, (actual, expected) => actual <= expected));
        validations.push(this.createValidation('CPU Usage', targets.maxCPUUsage, metrics.resources.cpuUsage, (actual, expected) => actual <= expected));
        return validations;
    }
    /**
     * Create target validation
     */
    createValidation(target, expected, actual, validator) {
        const passed = validator(actual, expected);
        const deviation = expected !== 0 ? ((actual - expected) / expected) * 100 : 0;
        return {
            target,
            expected,
            actual,
            passed,
            deviation
        };
    }
    /**
     * Calculate overall score
     */
    calculateScore(validations) {
        if (validations.length === 0)
            return 0;
        let totalScore = 0;
        for (const validation of validations) {
            if (validation.passed) {
                totalScore += 100;
            }
            else {
                // Partial score based on how close we are
                const deviationPenalty = Math.min(Math.abs(validation.deviation), 100);
                totalScore += Math.max(0, 100 - deviationPenalty);
            }
        }
        return totalScore / validations.length;
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(validations, metrics) {
        const recommendations = [];
        // Response time recommendations
        const avgResponseTimeValidation = validations.find(v => v.target === 'Average Response Time');
        if (avgResponseTimeValidation && !avgResponseTimeValidation.passed) {
            recommendations.push('Consider optimizing slow operations and implementing caching');
            recommendations.push('Review database queries and add appropriate indexes');
        }
        // Throughput recommendations
        const rpsValidation = validations.find(v => v.target === 'Requests per Second');
        if (rpsValidation && !rpsValidation.passed) {
            recommendations.push('Consider horizontal scaling or load balancing');
            recommendations.push('Optimize request processing pipeline');
        }
        // Error rate recommendations
        const errorRateValidation = validations.find(v => v.target === 'Error Rate');
        if (errorRateValidation && !errorRateValidation.passed) {
            recommendations.push('Investigate and fix sources of errors');
            recommendations.push('Implement better error handling and retry mechanisms');
        }
        // Memory recommendations
        const memoryValidation = validations.find(v => v.target === 'Memory Usage');
        if (memoryValidation && !memoryValidation.passed) {
            recommendations.push('Investigate memory leaks and optimize memory usage');
            recommendations.push('Consider implementing memory-efficient data structures');
        }
        // CPU recommendations
        const cpuValidation = validations.find(v => v.target === 'CPU Usage');
        if (cpuValidation && !cpuValidation.passed) {
            recommendations.push('Optimize CPU-intensive operations');
            recommendations.push('Consider using worker threads for heavy computations');
        }
        // Bottleneck recommendations
        if (metrics.scalability.bottlenecks.length > 0) {
            recommendations.push(`Address identified bottlenecks: ${metrics.scalability.bottlenecks.join(', ')}`);
        }
        return recommendations;
    }
    /**
     * Scale scenario for different user counts
     */
    scaleScenario(baseScenario, userCount) {
        const scaledScenario = JSON.parse(JSON.stringify(baseScenario));
        // Scale each phase
        scaledScenario.phases.forEach((phase) => {
            const scaleFactor = userCount / Math.max(phase.users.end, 1);
            phase.users.start = Math.ceil(phase.users.start * scaleFactor);
            phase.users.end = Math.ceil(phase.users.end * scaleFactor);
        });
        scaledScenario.name = `${baseScenario.name} (${userCount} users)`;
        return scaledScenario;
    }
    /**
     * Analyze scalability from test results
     */
    analyzeScalability(results, userCounts) {
        const throughputData = results.map((result, index) => ({
            users: userCounts[index],
            rps: result.metrics.throughput.rps,
            responseTime: result.metrics.responseTime.avg
        }));
        // Check for linear scaling
        const linearScaling = this.checkLinearScalingFromData(throughputData);
        // Find optimal user count
        const optimalUserCount = this.findOptimalUserCount(results, userCounts);
        // Identify scaling bottlenecks
        const bottlenecks = this.identifyScalingBottlenecks(results);
        return {
            linearScaling,
            optimalUserCount,
            bottlenecks,
            throughputData,
            scalabilityScore: this.calculateScalabilityScore(results)
        };
    }
    /**
     * Helper methods (simplified implementations)
     */
    extractErrorTypes(errors) {
        const types = {};
        errors.forEach(error => {
            types[error.type] = (types[error.type] || 0) + error.count;
        });
        return types;
    }
    getCurrentCPUUsage() {
        // Simplified CPU usage calculation
        const usage = process.cpuUsage();
        return (usage.user + usage.system) / 1000000; // Convert to percentage
    }
    getCurrentConnectionCount() {
        // This would be injected from connection pool in real implementation
        return 0;
    }
    extractConcurrentUsers(testResult) {
        return testResult.timeline.reduce((max, point) => Math.max(max, point.activeUsers), 0);
    }
    checkLinearScaling(testResult) {
        // Simplified linear scaling check
        return testResult.overall.successRate > 0.9;
    }
    identifyBottlenecks(testResult) {
        const bottlenecks = [];
        if (testResult.overall.responseTime.avg > 1000) {
            bottlenecks.push('High response time');
        }
        if (testResult.overall.successRate < 0.95) {
            bottlenecks.push('High error rate');
        }
        return bottlenecks;
    }
    checkLinearScalingFromData(data) {
        // Check if throughput scales linearly with users
        if (data.length < 2)
            return true;
        const firstPoint = data[0];
        const lastPoint = data[data.length - 1];
        const expectedRPS = (lastPoint.users / firstPoint.users) * firstPoint.rps;
        const actualRPS = lastPoint.rps;
        return actualRPS >= expectedRPS * 0.8; // 80% of linear scaling
    }
    findOptimalUserCount(results, userCounts) {
        let optimalIndex = 0;
        let bestScore = 0;
        results.forEach((result, index) => {
            if (result.score > bestScore) {
                bestScore = result.score;
                optimalIndex = index;
            }
        });
        return userCounts[optimalIndex];
    }
    identifyScalingBottlenecks(results) {
        const bottlenecks = [];
        // Check for degrading performance
        for (let i = 1; i < results.length; i++) {
            const prev = results[i - 1];
            const curr = results[i];
            if (curr.metrics.responseTime.avg > prev.metrics.responseTime.avg * 1.5) {
                bottlenecks.push('Response time degradation');
                break;
            }
            if (curr.metrics.errors.rate > prev.metrics.errors.rate * 2) {
                bottlenecks.push('Error rate increase');
                break;
            }
        }
        return bottlenecks;
    }
    calculateScalabilityScore(results) {
        if (results.length === 0)
            return 0;
        return results.reduce((sum, result) => sum + result.score, 0) / results.length;
    }
}
//# sourceMappingURL=PerformanceValidator.js.map