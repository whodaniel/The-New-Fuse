/**
 * Advanced Load Testing System
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
/**
 * Virtual user
 */
class VirtualUser extends EventEmitter {
    id;
    scenario;
    logger;
    running = false;
    currentPhase;
    constructor(id, scenario, logger) {
        super();
        this.id = id;
        this.scenario = scenario;
        this.logger = logger;
    }
    /**
     * Start virtual user
     */
    async start(phase) {
        this.running = true;
        this.currentPhase = phase;
        while (this.running && this.currentPhase === phase) {
            try {
                await this.executeOperation();
            }
            catch (error) {
                this.emit('error', error);
            }
        }
    }
    /**
     * Stop virtual user
     */
    stop() {
        this.running = false;
    }
    /**
     * Execute a random operation
     */
    async executeOperation() {
        if (!this.currentPhase)
            return;
        const operation = this.selectOperation(this.currentPhase.operations);
        const startTime = Date.now();
        try {
            const result = await this.performRequest(operation);
            const responseTime = Date.now() - startTime;
            // Validate response
            const isValid = this.validateResponse(operation, result, responseTime);
            this.emit('operationComplete', {
                userId: this.id,
                operation: operation.name,
                responseTime,
                success: isValid,
                result
            });
            // Think time
            if (operation.thinkTime) {
                await new Promise(resolve => setTimeout(resolve, operation.thinkTime));
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.emit('operationComplete', {
                userId: this.id,
                operation: operation.name,
                responseTime,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Select operation based on weights
     */
    selectOperation(operations) {
        const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        for (const operation of operations) {
            currentWeight += operation.weight;
            if (random <= currentWeight) {
                return operation;
            }
        }
        return operations[0]; // Fallback
    }
    /**
     * Perform HTTP request (mock implementation)
     */
    async performRequest(operation) {
        // Mock HTTP request - in real implementation, use actual HTTP client
        const delay = 50 + Math.random() * 200; // 50-250ms response time
        await new Promise(resolve => setTimeout(resolve, delay));
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
            throw new Error('Simulated request failure');
        }
        return {
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: { success: true, data: 'mock response' },
            size: 1024
        };
    }
    /**
     * Validate response
     */
    validateResponse(operation, result, responseTime) {
        const validation = operation.validation;
        if (!validation)
            return true;
        // Check status code
        if (validation.statusCodes && !validation.statusCodes.includes(result.status)) {
            return false;
        }
        // Check response time
        if (validation.maxResponseTime && responseTime > validation.maxResponseTime) {
            return false;
        }
        // Check body validation
        if (validation.bodyValidation && !validation.bodyValidation(result.body)) {
            return false;
        }
        return true;
    }
}
/**
 * Advanced load test runner
 */
export class LoadTestRunner extends EventEmitter {
    logger;
    running = false;
    virtualUsers = [];
    results = [];
    timeline = [];
    errors = new Map();
    constructor(logger) {
        super();
        this.logger = logger || new Logger('LoadTestRunner');
    }
    /**
     * Run load test scenario
     */
    async runScenario(scenario) {
        this.logger.info(`Starting load test scenario: ${scenario.name}`);
        const startTime = new Date();
        this.running = true;
        this.results = [];
        this.timeline = [];
        this.errors.clear();
        // Start timeline monitoring
        const timelineInterval = setInterval(() => {
            this.captureTimelinePoint();
        }, 1000); // Every second
        const phaseResults = [];
        try {
            // Execute each phase
            for (const phase of scenario.phases) {
                if (!this.running)
                    break;
                this.logger.info(`Starting phase: ${phase.name}`);
                const phaseResult = await this.runPhase(scenario, phase);
                phaseResults.push(phaseResult);
            }
        }
        finally {
            clearInterval(timelineInterval);
            this.cleanup();
        }
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        // Calculate overall statistics
        const overall = this.calculateOverallStatistics();
        const result = {
            scenario,
            startTime,
            endTime,
            duration,
            phases: phaseResults,
            overall,
            timeline: this.timeline,
            errors: Array.from(this.errors.values())
        };
        this.logger.info(`Load test completed: ${scenario.name}`, {
            duration,
            totalRequests: overall.totalRequests,
            successRate: overall.successRate
        });
        this.emit('testComplete', result);
        return result;
    }
    /**
     * Stop running test
     */
    stop() {
        this.logger.info('Stopping load test');
        this.running = false;
        this.cleanup();
    }
    /**
     * Run a single phase
     */
    async runPhase(scenario, phase) {
        const phaseStartTime = Date.now();
        const phaseResults = [];
        // Create virtual users
        const maxUsers = Math.max(phase.users.start, phase.users.end);
        this.virtualUsers = [];
        for (let i = 0; i < maxUsers; i++) {
            const user = new VirtualUser(`user-${i}`, scenario, this.logger);
            user.on('operationComplete', (result) => {
                phaseResults.push(result);
                this.results.push(result);
            });
            user.on('error', (error) => {
                this.recordError(error);
            });
            this.virtualUsers.push(user);
        }
        // Ramp up users
        await this.rampUpUsers(phase);
        // Wait for phase duration
        await new Promise(resolve => setTimeout(resolve, phase.duration));
        // Stop all users
        this.virtualUsers.forEach(user => user.stop());
        const phaseDuration = Date.now() - phaseStartTime;
        // Calculate phase statistics
        const statistics = this.calculatePhaseStatistics(phaseResults);
        const operations = this.calculateOperationResults(phaseResults);
        return {
            name: phase.name,
            duration: phaseDuration,
            statistics,
            operations
        };
    }
    /**
     * Ramp up virtual users
     */
    async rampUpUsers(phase) {
        const { start, end, rampUp } = phase.users;
        const rampDuration = Math.min(phase.duration * 0.1, 30000); // 10% of phase or 30s max
        if (start === end) {
            // Start all users immediately
            for (let i = 0; i < start; i++) {
                this.virtualUsers[i].start(phase);
            }
            return;
        }
        const userDiff = end - start;
        const steps = Math.abs(userDiff);
        const stepDuration = rampDuration / steps;
        if (rampUp === 'linear') {
            for (let i = 0; i < steps; i++) {
                if (!this.running)
                    break;
                const userIndex = start + (userDiff > 0 ? i : -i);
                if (userIndex >= 0 && userIndex < this.virtualUsers.length) {
                    if (userDiff > 0) {
                        this.virtualUsers[userIndex].start(phase);
                    }
                    else {
                        this.virtualUsers[userIndex].stop();
                    }
                }
                await new Promise(resolve => setTimeout(resolve, stepDuration));
            }
        }
        else if (rampUp === 'exponential') {
            // Exponential ramp-up implementation
            for (let i = 0; i < steps; i++) {
                if (!this.running)
                    break;
                const progress = i / steps;
                const exponentialProgress = Math.pow(progress, 2);
                const userIndex = start + Math.floor(exponentialProgress * userDiff);
                if (userIndex >= 0 && userIndex < this.virtualUsers.length) {
                    this.virtualUsers[userIndex].start(phase);
                }
                await new Promise(resolve => setTimeout(resolve, stepDuration));
            }
        }
        else if (rampUp === 'step') {
            // Step ramp-up implementation
            const stepSize = Math.ceil(steps / 5); // 5 steps
            for (let step = 0; step < 5; step++) {
                if (!this.running)
                    break;
                const stepStart = start + step * stepSize;
                const stepEnd = Math.min(start + (step + 1) * stepSize, end);
                for (let i = stepStart; i < stepEnd; i++) {
                    if (i >= 0 && i < this.virtualUsers.length) {
                        this.virtualUsers[i].start(phase);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, rampDuration / 5));
            }
        }
    }
    /**
     * Capture timeline point
     */
    captureTimelinePoint() {
        const activeUsers = this.virtualUsers.filter(user => user.listenerCount('operationComplete') > 0).length;
        const recentResults = this.results.filter(r => Date.now() - new Date(r.timestamp || Date.now()).getTime() < 1000);
        const rps = recentResults.length;
        const avgResponseTime = recentResults.length > 0 ?
            recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length : 0;
        const errorRate = recentResults.length > 0 ?
            recentResults.filter(r => !r.success).length / recentResults.length : 0;
        this.timeline.push({
            timestamp: new Date(),
            activeUsers,
            rps,
            avgResponseTime,
            errorRate
        });
    }
    /**
     * Record error
     */
    recordError(error) {
        const key = `${error.constructor.name}: ${error.message}`;
        const existing = this.errors.get(key);
        if (existing) {
            existing.count++;
            existing.lastOccurrence = new Date();
        }
        else {
            this.errors.set(key, {
                type: error.constructor.name,
                message: error.message,
                count: 1,
                firstOccurrence: new Date(),
                lastOccurrence: new Date()
            });
        }
    }
    /**
     * Calculate overall statistics
     */
    calculateOverallStatistics() {
        return this.calculatePhaseStatistics(this.results);
    }
    /**
     * Calculate phase statistics
     */
    calculatePhaseStatistics(results) {
        if (results.length === 0) {
            return {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                successRate: 0,
                rps: 0,
                responseTime: { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 },
                throughput: 0
            };
        }
        const totalRequests = results.length;
        const successfulRequests = results.filter(r => r.success).length;
        const failedRequests = totalRequests - successfulRequests;
        const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
        const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
        const responseTime = {
            min: responseTimes[0] || 0,
            max: responseTimes[responseTimes.length - 1] || 0,
            avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            p50: this.percentile(responseTimes, 0.5),
            p95: this.percentile(responseTimes, 0.95),
            p99: this.percentile(responseTimes, 0.99)
        };
        // Calculate RPS based on timeline
        const rps = this.timeline.length > 0 ?
            this.timeline.reduce((sum, point) => sum + point.rps, 0) / this.timeline.length : 0;
        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            successRate,
            rps,
            responseTime,
            throughput: 0 // Would calculate based on response sizes
        };
    }
    /**
     * Calculate operation results
     */
    calculateOperationResults(results) {
        const operationMap = new Map();
        results.forEach(result => {
            const operation = result.operation;
            if (!operationMap.has(operation)) {
                operationMap.set(operation, []);
            }
            operationMap.get(operation).push(result);
        });
        return Array.from(operationMap.entries()).map(([name, opResults]) => {
            const executions = opResults.length;
            const successes = opResults.filter(r => r.success).length;
            const failures = executions - successes;
            const successRate = executions > 0 ? successes / executions : 0;
            const responseTimes = opResults.map(r => r.responseTime).sort((a, b) => a - b);
            const responseTime = {
                min: responseTimes[0] || 0,
                max: responseTimes[responseTimes.length - 1] || 0,
                avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
                p50: this.percentile(responseTimes, 0.5),
                p95: this.percentile(responseTimes, 0.95),
                p99: this.percentile(responseTimes, 0.99)
            };
            return {
                name,
                executions,
                successes,
                failures,
                successRate,
                responseTime
            };
        });
    }
    /**
     * Calculate percentile
     */
    percentile(values, p) {
        if (values.length === 0)
            return 0;
        const index = Math.ceil(values.length * p) - 1;
        return values[Math.max(0, index)];
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.virtualUsers.forEach(user => user.stop());
        this.virtualUsers = [];
    }
}
//# sourceMappingURL=LoadTestRunner.js.map