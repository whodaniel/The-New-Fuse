"use strict";
// Test Runner Controller - REST API endpoints for automated testing
// Provides endpoints for running tests, viewing results, and managing test schedules
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunnerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
// Mock guard and decorators since api-core services are not available
class JwtAuthGuard {
}
// Mock service class
class TestRunnerService {
    async runAgentWorkflowTests(config) {
        return { id: 'mock-run', name: 'Mock Test Run', status: 'running', startTime: Date.now() };
    }
    async runSingleTest(name, config) {
        return { name, status: 'passed' };
    }
    async getAllTestRuns(limit) {
        return [];
    }
    async getTestRunsByStatus(status) {
        return [];
    }
    async getTestRun(id) {
        return null;
    }
    async generateTestReport(id) {
        return { summary: '', details: '', recommendations: [] };
    }
    async scheduleTests(request) {
        return 'mock-schedule-id';
    }
    async getTestSchedules() {
        return [];
    }
    async updateSchedule(id, request) {
        return true;
    }
    async deleteSchedule(id) {
        return true;
    }
    async getTestAnalytics(days) {
        return { totalRuns: 0, successRate: 0, averageDuration: 0, trends: { daily: [], testCases: [] }, topFailures: [] };
    }
    async getHealthStatus() {
        return { status: 'healthy', runningTests: 0, totalRuns: 0 };
    }
}
let TestRunnerController = class TestRunnerController {
    constructor(testRunnerService) {
        this.testRunnerService = testRunnerService;
    }
    // Test execution endpoints
    async runAgentWorkflowTests(request) {
        const user = { id: 'mock-user-id' }; // Mock user for compilation
        const testRun = await this.testRunnerService.runAgentWorkflowTests(request.config);
        return {
            runId: testRun.id,
            status: testRun.status,
            message: `Agent workflow test suite started with ID: ${testRun.id}`,
        };
    }
    async runSingleTest(testName, request) {
        const user = { id: 'mock-user-id' }; // Mock user for compilation
        return this.testRunnerService.runSingleTest(testName, request.config);
    }
    // Test result endpoints
    async getTestRuns(limit, status) {
        if (status) {
            return this.testRunnerService.getTestRunsByStatus(status);
        }
        return this.testRunnerService.getAllTestRuns(limit);
    }
    async getTestRun(runId) {
        const testRun = await this.testRunnerService.getTestRun(runId);
        if (!testRun) {
            throw new Error(`Test run not found: ${runId}`);
        }
        return testRun;
    }
    async getTestReport(runId) {
        return this.testRunnerService.generateTestReport(runId);
    }
    // Test scheduling endpoints
    async createSchedule(request) {
        const user = { id: 'mock-user-id' }; // Mock user for compilation
        const scheduleId = await this.testRunnerService.scheduleTests(request);
        return {
            scheduleId,
            message: `Test schedule created successfully: ${request.name}`,
        };
    }
    async getSchedules() {
        return this.testRunnerService.getTestSchedules();
    }
    async updateSchedule(scheduleId, request) {
        const updated = await this.testRunnerService.updateSchedule(scheduleId, request);
        return {
            success: updated,
            message: updated ? 'Schedule updated successfully' : 'Schedule not found',
        };
    }
    async deleteSchedule(scheduleId) {
        const deleted = await this.testRunnerService.deleteSchedule(scheduleId);
        return {
            success: deleted,
            message: deleted ? 'Schedule deleted successfully' : 'Schedule not found',
        };
    }
    // Analytics and reporting endpoints
    async getTestAnalytics(days = 30) {
        return this.testRunnerService.getTestAnalytics(days);
    }
    async getHealth() {
        return this.testRunnerService.getHealthStatus();
    }
    // Test management endpoints
    async getAvailableTests() {
        // Return available test cases
        return {
            testSuites: [
                {
                    name: 'Agent Workflow Tests',
                    description: 'Comprehensive integration tests for agent workflow pipeline',
                    testCases: [
                        {
                            name: 'Agent Registration and Discovery',
                            description: 'Test agent registration, capability announcement, and discovery',
                            estimatedDuration: 5000,
                            tags: ['integration', 'agent', 'discovery'],
                        },
                        {
                            name: 'Simple Workflow Execution',
                            description: 'Test creation and execution of a simple linear workflow',
                            estimatedDuration: 15000,
                            tags: ['integration', 'workflow', 'execution'],
                        },
                        {
                            name: 'Parallel Task Execution',
                            description: 'Test parallel execution of multiple tasks within a workflow',
                            estimatedDuration: 20000,
                            tags: ['integration', 'parallel', 'performance'],
                        },
                        {
                            name: 'Agent Communication Test',
                            description: 'Test A2A communication between agents during workflow execution',
                            estimatedDuration: 10000,
                            tags: ['integration', 'communication', 'a2a'],
                        },
                        {
                            name: 'Error Handling and Recovery',
                            description: 'Test error handling, retries, and recovery mechanisms',
                            estimatedDuration: 25000,
                            tags: ['integration', 'error-handling', 'resilience'],
                        },
                        {
                            name: 'Load and Performance Test',
                            description: 'Test system performance under load with multiple concurrent workflows',
                            estimatedDuration: 60000,
                            tags: ['performance', 'load', 'stress'],
                        },
                    ],
                },
            ],
        };
    }
    async validateConfig(request) {
        const { config } = request;
        const errors = [];
        const warnings = [];
        const recommendations = [];
        // Validate timeout
        if (config.timeout && config.timeout < 1000) {
            errors.push('Timeout must be at least 1000ms');
        }
        if (config.timeout && config.timeout > 600000) {
            warnings.push('Timeout is very high (>10 minutes)');
        }
        // Validate retry attempts
        if (config.retryAttempts && config.retryAttempts < 0) {
            errors.push('Retry attempts cannot be negative');
        }
        if (config.retryAttempts && config.retryAttempts > 5) {
            warnings.push('High retry attempts may cause long test durations');
        }
        // Validate concurrency
        if (config.maxConcurrentTests && config.maxConcurrentTests < 1) {
            errors.push('Max concurrent tests must be at least 1');
        }
        if (config.maxConcurrentTests && config.maxConcurrentTests > 10) {
            warnings.push('High concurrency may impact system performance');
        }
        // Recommendations
        if (config.environment === 'production') {
            recommendations.push('Consider using staging environment for regular testing');
        }
        if (!config.cleanup) {
            recommendations.push('Enable cleanup to prevent test data accumulation');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            recommendations,
        };
    }
    async getCurrentStatus() {
        // Get currently running tests
        const runningTests = await this.testRunnerService.getTestRunsByStatus('running');
        return {
            runningTests: runningTests.map(test => ({
                runId: test.id,
                name: test.name,
                startTime: test.startTime,
                estimatedTimeRemaining: test.duration ? undefined : 30000, // Estimate if not completed
            })),
            queuedTests: 0, // Would be implemented with actual queue
            systemLoad: {
                cpu: 45, // Mock values - would get from system monitoring
                memory: 60,
                activeConnections: 25,
            },
        };
    }
};
exports.TestRunnerController = TestRunnerController;
__decorate([
    (0, common_1.Post)('run/agent-workflows'),
    (0, swagger_1.ApiOperation)({
        summary: 'Run complete agent workflow test suite',
        description: 'Executes all agent workflow integration tests and returns comprehensive results',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                config: {
                    type: 'object',
                    properties: {
                        timeout: { type: 'number', description: 'Test timeout in milliseconds' },
                        retryAttempts: { type: 'number', description: 'Number of retry attempts for failed tests' },
                        parallel: { type: 'boolean', description: 'Run tests in parallel' },
                        maxConcurrentTests: { type: 'number', description: 'Maximum concurrent test executions' },
                        environment: { type: 'string', enum: ['development', 'staging', 'production'] },
                        cleanup: { type: 'boolean', description: 'Clean up test data after execution' },
                        verbose: { type: 'boolean', description: 'Enable verbose logging' },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test execution started successfully',
        schema: {
            type: 'object',
            properties: {
                runId: { type: 'string' },
                status: { type: 'string' },
                message: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "runAgentWorkflowTests", null);
__decorate([
    (0, common_1.Post)('run/single/:testName'),
    (0, swagger_1.ApiOperation)({
        summary: 'Run a single test case',
        description: 'Executes a specific test case by name and returns the result',
    }),
    (0, swagger_1.ApiParam)({
        name: 'testName',
        description: 'Name of the test case to run',
        example: 'Agent Registration and Discovery',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                config: {
                    type: 'object',
                    description: 'Test configuration overrides',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Single test executed successfully',
    }),
    __param(0, (0, common_1.Param)('testName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "runSingleTest", null);
__decorate([
    (0, common_1.Get)('runs'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all test runs',
        description: 'Returns a list of all test runs with pagination',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: 'number',
        description: 'Maximum number of test runs to return',
        example: 50,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['running', 'completed', 'failed'],
        description: 'Filter by test run status',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test runs retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getTestRuns", null);
__decorate([
    (0, common_1.Get)('runs/:runId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get specific test run details',
        description: 'Returns detailed information about a specific test run',
    }),
    (0, swagger_1.ApiParam)({
        name: 'runId',
        description: 'Unique identifier of the test run',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test run details retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Test run not found',
    }),
    __param(0, (0, common_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getTestRun", null);
__decorate([
    (0, common_1.Get)('runs/:runId/report'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate test run report',
        description: 'Generates a comprehensive report for a specific test run',
    }),
    (0, swagger_1.ApiParam)({
        name: 'runId',
        description: 'Unique identifier of the test run',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test report generated successfully',
    }),
    __param(0, (0, common_1.Param)('runId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getTestReport", null);
__decorate([
    (0, common_1.Post)('schedules'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create test schedule',
        description: 'Creates a new scheduled test execution',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['name', 'cron', 'testSuites'],
            properties: {
                name: { type: 'string', description: 'Schedule name' },
                cron: { type: 'string', description: 'Cron expression for scheduling' },
                enabled: { type: 'boolean', description: 'Whether the schedule is enabled' },
                testSuites: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of test suites to run',
                },
                description: { type: 'string', description: 'Schedule description' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Test schedule created successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Get)('schedules'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all test schedules',
        description: 'Returns a list of all configured test schedules',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test schedules retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getSchedules", null);
__decorate([
    (0, common_1.Put)('schedules/:scheduleId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update test schedule',
        description: 'Updates an existing test schedule configuration',
    }),
    (0, swagger_1.ApiParam)({
        name: 'scheduleId',
        description: 'Unique identifier of the test schedule',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                cron: { type: 'string' },
                enabled: { type: 'boolean' },
                testSuites: { type: 'array', items: { type: 'string' } },
                description: { type: 'string' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test schedule updated successfully',
    }),
    __param(0, (0, common_1.Param)('scheduleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "updateSchedule", null);
__decorate([
    (0, common_1.Delete)('schedules/:scheduleId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete test schedule',
        description: 'Removes a test schedule from the system',
    }),
    (0, swagger_1.ApiParam)({
        name: 'scheduleId',
        description: 'Unique identifier of the test schedule',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test schedule deleted successfully',
    }),
    __param(0, (0, common_1.Param)('scheduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "deleteSchedule", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get test analytics',
        description: 'Returns comprehensive test analytics and trends',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'days',
        required: false,
        type: 'number',
        description: 'Number of days to include in analytics',
        example: 30,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test analytics retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getTestAnalytics", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get test runner health status',
        description: 'Returns the health status of the test runner service',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Test runner health status retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('available-tests'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get available test cases',
        description: 'Returns a list of all available test cases that can be executed',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Available test cases retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getAvailableTests", null);
__decorate([
    (0, common_1.Post)('validate-config'),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate test configuration',
        description: 'Validates a test configuration before execution',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                config: {
                    type: 'object',
                    description: 'Test configuration to validate',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Configuration validation result',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "validateConfig", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current test execution status',
        description: 'Returns information about currently running tests',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current test status retrieved successfully',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestRunnerController.prototype, "getCurrentStatus", null);
exports.TestRunnerController = TestRunnerController = __decorate([
    (0, swagger_1.ApiTags)('Test Runner'),
    (0, common_1.Controller)('api/testing'),
    (0, common_1.UseGuards)(JwtAuthGuard)
    // @UseInterceptors(PerformanceInterceptor)
    ,
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [TestRunnerService])
], TestRunnerController);
//# sourceMappingURL=test-runner.controller.js.map