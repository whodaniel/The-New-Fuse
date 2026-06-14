"use strict";
// Test Runner Service - Orchestrates automated testing for agent workflows
// Provides REST API endpoints for running tests and viewing results
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TestRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunnerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const agent_workflow_test_suite_1 = require("./agent-workflow.test-suite");
let TestRunnerService = TestRunnerService_1 = class TestRunnerService {
    constructor(configService, queueService, cacheService, websocketService, a2aService) {
        this.configService = configService;
        this.queueService = queueService;
        this.cacheService = cacheService;
        this.websocketService = websocketService;
        this.a2aService = a2aService;
        this.logger = new common_1.Logger(TestRunnerService_1.name);
        this.testRuns = new Map();
        this.testSchedules = new Map();
        this.currentlyRunning = new Set();
        this.defaultConfig = {
            timeout: 300000, // 5 minutes
            retryAttempts: 3,
            parallel: true,
            maxConcurrentTests: 3,
            environment: 'development',
            cleanup: true,
            verbose: false,
        };
        this.initializeDefaultSchedules();
    }
    // Main test execution methods
    async runAgentWorkflowTests(config) {
        const runId = this.generateRunId();
        const testConfig = { ...this.defaultConfig, ...config };
        const testRun = {
            id: runId,
            name: 'Agent Workflow Test Suite',
            status: 'running',
            startTime: Date.now(),
            passed: 0,
            failed: 0,
            total: 0,
            results: [],
        };
        this.testRuns.set(runId, testRun);
        this.currentlyRunning.add(runId);
        this.logger.log(`Starting test run: ${runId}`);
        try {
            // Create test suite instance
            const testSuite = new agent_workflow_test_suite_1.AgentWorkflowTestSuite(null, // app instance would be injected in real implementation
            this.queueService, this.cacheService, this.websocketService, this.a2aService);
            // Run tests
            const results = await testSuite.runAllTests();
            // Update test run with results
            testRun.status = 'completed';
            testRun.endTime = Date.now();
            testRun.duration = testRun.endTime - testRun.startTime;
            testRun.passed = results.passed;
            testRun.failed = results.failed;
            testRun.total = results.results.length;
            testRun.results = results.results.map(result => ({
                name: result.name,
                status: result.status,
                duration: result.duration || 0,
                description: result.description,
                error: result.error,
                metrics: {
                    assertions: 1,
                    performance: {
                        memoryUsage: process.memoryUsage().heapUsed,
                        cpuTime: result.duration || 0,
                        networkRequests: 0,
                    },
                },
            }));
            testRun.summary = this.generateTestSummary(testRun);
            this.logger.log(`Test run completed: ${runId} - ${results.passed}/${results.results.length} passed`);
        }
        catch (error) {
            testRun.status = 'failed';
            testRun.endTime = Date.now();
            testRun.duration = testRun.endTime - testRun.startTime;
            testRun.error = error?.message || 'Unknown error';
            this.logger.error(`Test run failed: ${runId}`, error);
        }
        finally {
            this.currentlyRunning.delete(runId);
            // Cache test results
            if (this.cacheService) {
                await this.cacheService.set(`test_run:${runId}`, testRun, { ttl: 86400 }); // 24 hours
            }
        }
        return testRun;
    }
    async runSingleTest(testName, config) {
        const testConfig = { ...this.defaultConfig, ...config };
        this.logger.log(`Running single test: ${testName}`);
        try {
            const testSuite = new agent_workflow_test_suite_1.AgentWorkflowTestSuite(null, this.queueService, this.cacheService, this.websocketService, this.a2aService);
            const startTime = Date.now();
            const result = await testSuite.runSingleTest(testName);
            const duration = Date.now() - startTime;
            return {
                name: testName,
                status: result.status,
                duration,
                description: `Single test execution: ${testName}`,
                error: result.error,
                metrics: {
                    assertions: 1,
                    performance: {
                        memoryUsage: process.memoryUsage().heapUsed,
                        cpuTime: duration,
                        networkRequests: 0,
                    },
                },
            };
        }
        catch (error) {
            this.logger.error(`Single test failed: ${testName}`, error);
            return {
                name: testName,
                status: 'FAILED',
                duration: 0,
                description: `Single test execution: ${testName}`,
                error: error?.message || 'Unknown error',
            };
        }
    }
    // Test scheduling methods
    async scheduleTests(schedule) {
        const scheduleId = this.generateScheduleId();
        const newSchedule = {
            id: scheduleId,
            ...schedule,
            nextRun: this.calculateNextRun(schedule.cron),
        };
        this.testSchedules.set(scheduleId, newSchedule);
        // Cache schedule
        if (this.cacheService) {
            await this.cacheService.set(`test_schedule:${scheduleId}`, newSchedule, { ttl: 86400 * 7 }); // 7 days
        }
        this.logger.log(`Test schedule created: ${scheduleId} - ${schedule.name}`);
        return scheduleId;
    }
    async updateSchedule(scheduleId, updates) {
        const schedule = this.testSchedules.get(scheduleId);
        if (!schedule) {
            return false;
        }
        Object.assign(schedule, updates);
        if (updates.cron) {
            schedule.nextRun = this.calculateNextRun(updates.cron);
        }
        if (this.cacheService) {
            await this.cacheService.set(`test_schedule:${scheduleId}`, schedule, { ttl: 86400 * 7 });
        }
        this.logger.log(`Test schedule updated: ${scheduleId}`);
        return true;
    }
    async deleteSchedule(scheduleId) {
        const deleted = this.testSchedules.delete(scheduleId);
        if (deleted) {
            if (this.cacheService) {
                await this.cacheService.delete(`test_schedule:${scheduleId}`);
            }
            this.logger.log(`Test schedule deleted: ${scheduleId}`);
        }
        return deleted;
    }
    // Test result retrieval methods
    async getTestRun(runId) {
        let testRun = this.testRuns.get(runId);
        if (!testRun && this.cacheService) {
            // Try to load from cache
            testRun = await this.cacheService.get(`test_run:${runId}`);
        }
        return testRun || null;
    }
    async getAllTestRuns(limit = 50) {
        const recentRuns = Array.from(this.testRuns.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
        return recentRuns;
    }
    async getTestRunsByStatus(status) {
        return Array.from(this.testRuns.values())
            .filter(run => run.status === status)
            .sort((a, b) => b.startTime - a.startTime);
    }
    async getTestSchedules() {
        return Array.from(this.testSchedules.values())
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    // Test analytics and reporting
    async getTestAnalytics(days = 30) {
        const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentRuns = Array.from(this.testRuns.values())
            .filter(run => run.startTime > cutoffDate);
        const totalRuns = recentRuns.length;
        const completedRuns = recentRuns.filter(run => run.status === 'completed');
        const successRate = totalRuns > 0 ? (completedRuns.length / totalRuns) * 100 : 0;
        const averageDuration = completedRuns.length > 0
            ? completedRuns.reduce((sum, run) => sum + (run.duration || 0), 0) / completedRuns.length
            : 0;
        // Generate daily trends
        const dailyTrends = this.generateDailyTrends(recentRuns, days);
        // Generate test case analytics
        const testCaseAnalytics = this.generateTestCaseAnalytics(recentRuns);
        // Find top failures
        const topFailures = this.getTopFailures(recentRuns);
        return {
            totalRuns,
            successRate: Math.round(successRate * 100) / 100,
            averageDuration: Math.round(averageDuration),
            trends: {
                daily: dailyTrends,
                testCases: testCaseAnalytics,
            },
            topFailures,
        };
    }
    async generateTestReport(runId) {
        const testRun = await this.getTestRun(runId);
        if (!testRun) {
            throw new Error(`Test run not found: ${runId}`);
        }
        const summary = this.generateTestSummary(testRun);
        const details = this.generateTestDetails(testRun);
        const recommendations = this.generateRecommendations(testRun);
        return {
            summary,
            details,
            recommendations,
        };
    }
    // Utility methods
    generateRunId() {
        return `test_run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateScheduleId() {
        return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateNextRun(cron) {
        // Simple cron calculation - in production, use a proper cron library
        // For now, return next hour
        return Date.now() + (60 * 60 * 1000);
    }
    generateTestSummary(testRun) {
        const successRate = testRun.total > 0 ? (testRun.passed / testRun.total) * 100 : 0;
        const duration = testRun.duration ? Math.round(testRun.duration / 1000) : 0;
        return `Test run completed in ${duration}s with ${successRate.toFixed(1)}% success rate (${testRun.passed}/${testRun.total} passed)`;
    }
    generateTestDetails(testRun) {
        let details = `Test Run: ${testRun.name}\n`;
        details += `ID: ${testRun.id}\n`;
        details += `Status: ${testRun.status}\n`;
        details += `Duration: ${testRun.duration ? Math.round(testRun.duration / 1000) : 0}s\n`;
        details += `Results: ${testRun.passed} passed, ${testRun.failed} failed\n\n`;
        details += 'Test Cases:\n';
        testRun.results.forEach(result => {
            details += `- ${result.name}: ${result.status}`;
            if (result.duration) {
                details += ` (${Math.round(result.duration)}ms)`;
            }
            if (result.error) {
                details += ` - ${result.error}`;
            }
            details += '\n';
        });
        return details;
    }
    generateRecommendations(testRun) {
        const recommendations = [];
        if (testRun.failed > 0) {
            recommendations.push('Review and fix failing test cases');
        }
        if (testRun.duration && testRun.duration > 300000) { // 5 minutes
            recommendations.push('Consider optimizing test execution time');
        }
        const longRunningTests = testRun.results.filter(r => r.duration > 30000); // 30 seconds
        if (longRunningTests.length > 0) {
            recommendations.push('Optimize long-running test cases: ' + longRunningTests.map(t => t.name).join(', '));
        }
        return recommendations;
    }
    generateDailyTrends(runs, days) {
        const trends = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayRuns = runs.filter(run => {
                const runDate = new Date(run.startTime).toISOString().split('T')[0];
                return runDate === dateStr;
            });
            trends.push({
                date: dateStr,
                runs: dayRuns.length,
                passed: dayRuns.reduce((sum, run) => sum + run.passed, 0),
                failed: dayRuns.reduce((sum, run) => sum + run.failed, 0),
            });
        }
        return trends;
    }
    generateTestCaseAnalytics(runs) {
        const testCaseStats = new Map();
        runs.forEach(run => {
            run.results.forEach(result => {
                const stats = testCaseStats.get(result.name) || { total: 0, passed: 0, totalDuration: 0 };
                stats.total++;
                if (result.status === 'PASSED') {
                    stats.passed++;
                }
                stats.totalDuration += result.duration;
                testCaseStats.set(result.name, stats);
            });
        });
        return Array.from(testCaseStats.entries()).map(([name, stats]) => ({
            name,
            successRate: (stats.passed / stats.total) * 100,
            averageDuration: stats.totalDuration / stats.total,
        }));
    }
    getTopFailures(runs) {
        const failureStats = new Map();
        runs.forEach(run => {
            run.results.forEach(result => {
                if (result.status === 'FAILED') {
                    const stats = failureStats.get(result.name) || { failures: 0, lastFailure: 0 };
                    stats.failures++;
                    stats.lastFailure = Math.max(stats.lastFailure, run.startTime);
                    failureStats.set(result.name, stats);
                }
            });
        });
        return Array.from(failureStats.entries())
            .map(([testCase, stats]) => ({ testCase, ...stats }))
            .sort((a, b) => b.failures - a.failures)
            .slice(0, 10);
    }
    initializeDefaultSchedules() {
        // Initialize some default test schedules
        const defaultSchedules = [
            {
                name: 'Daily Agent Workflow Tests',
                cron: '0 2 * * *', // 2 AM daily
                enabled: true,
                testSuites: ['agent_workflow'],
            },
            {
                name: 'Hourly Smoke Tests',
                cron: '0 * * * *', // Every hour
                enabled: false,
                testSuites: ['agent_registration', 'simple_workflow'],
            },
        ];
        defaultSchedules.forEach(schedule => {
            const id = this.generateScheduleId();
            this.testSchedules.set(id, {
                id,
                ...schedule,
                nextRun: this.calculateNextRun(schedule.cron),
            });
        });
    }
    // Health check for test runner
    async getHealthStatus() {
        const runningTests = this.currentlyRunning.size;
        const totalRuns = this.testRuns.size;
        const recentRuns = Array.from(this.testRuns.values())
            .filter(run => run.startTime > Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours
        const lastSuccessfulRun = recentRuns
            .filter(run => run.status === 'completed' && run.failed === 0)
            .sort((a, b) => b.startTime - a.startTime)[0]?.startTime;
        let status = 'healthy';
        if (runningTests > 5) {
            status = 'degraded';
        }
        if (!lastSuccessfulRun || Date.now() - lastSuccessfulRun > (48 * 60 * 60 * 1000)) {
            status = 'unhealthy';
        }
        return {
            status,
            runningTests,
            totalRuns,
            lastSuccessfulRun,
        };
    }
};
exports.TestRunnerService = TestRunnerService;
exports.TestRunnerService = TestRunnerService = TestRunnerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, Object, Object, Object, Object])
], TestRunnerService);
//# sourceMappingURL=test-runner.service.js.map