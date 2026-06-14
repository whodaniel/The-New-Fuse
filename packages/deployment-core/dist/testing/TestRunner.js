"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = exports.ReportFormat = exports.TestFramework = exports.TestStatus = exports.TestType = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
var TestType;
(function (TestType) {
    TestType["UNIT"] = "unit";
    TestType["INTEGRATION"] = "integration";
    TestType["E2E"] = "e2e";
    TestType["PERFORMANCE"] = "performance";
    TestType["SECURITY"] = "security";
    TestType["ACCESSIBILITY"] = "accessibility";
})(TestType || (exports.TestType = TestType = {}));
var TestStatus;
(function (TestStatus) {
    TestStatus["PENDING"] = "pending";
    TestStatus["RUNNING"] = "running";
    TestStatus["PASSED"] = "passed";
    TestStatus["FAILED"] = "failed";
    TestStatus["SKIPPED"] = "skipped";
    TestStatus["CANCELLED"] = "cancelled";
})(TestStatus || (exports.TestStatus = TestStatus = {}));
var TestFramework;
(function (TestFramework) {
    TestFramework["JEST"] = "jest";
    TestFramework["VITEST"] = "vitest";
    TestFramework["MOCHA"] = "mocha";
    TestFramework["PLAYWRIGHT"] = "playwright";
    TestFramework["CYPRESS"] = "cypress";
    TestFramework["PUPPETEER"] = "puppeteer";
    TestFramework["SELENIUM"] = "selenium";
})(TestFramework || (exports.TestFramework = TestFramework = {}));
var ReportFormat;
(function (ReportFormat) {
    ReportFormat["JUNIT"] = "junit";
    ReportFormat["JSON"] = "json";
    ReportFormat["HTML"] = "html";
    ReportFormat["LCOV"] = "lcov";
    ReportFormat["COBERTURA"] = "cobertura";
    ReportFormat["ALLURE"] = "allure";
})(ReportFormat || (exports.ReportFormat = ReportFormat = {}));
/**
 * TestRunner handles execution of different types of tests with comprehensive reporting
 */
class TestRunner extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.runningTests = new Map();
        this.testResults = new Map();
        this.logger = logger;
    }
    /**
     * Execute tests based on configuration
     */
    async executeTests(config) {
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const startTime = new Date();
        this.logger.info(`Starting ${config.type} tests`, {
            testId,
            framework: config.framework,
            command: config.command
        });
        try {
            // Prepare test environment
            await this.prepareTestEnvironment(config);
            // Execute tests based on framework
            const result = await this.runTestFramework(testId, config, startTime);
            // Process test results
            await this.processTestResults(result, config);
            // Generate coverage report if enabled
            if (config.coverage) {
                result.coverage = await this.generateCoverageReport(config);
            }
            // Collect artifacts
            result.artifacts = await this.collectArtifacts(config);
            // Store result
            this.testResults.set(testId, result);
            // Emit completion event
            this.emit('test:complete', { testId, result });
            this.logger.info(`${config.type} tests completed`, {
                testId,
                status: result.status,
                duration: result.duration,
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                failedTests: result.failedTests
            });
            return result;
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            const failedResult = {
                id: testId,
                type: config.type,
                status: TestStatus.FAILED,
                startTime,
                endTime,
                duration,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                skippedTests: 0,
                failures: [{
                        testName: 'Test Execution',
                        testFile: 'unknown',
                        error: error.message,
                        stackTrace: error.stack
                    }],
                logs: [error.message],
                artifacts: [],
                metadata: { error: error.message }
            };
            this.testResults.set(testId, failedResult);
            this.emit('test:failed', { testId, result: failedResult, error });
            this.logger.error(`${config.type} tests failed`, {
                testId,
                error: error.message,
                stack: error.stack
            });
            return failedResult;
        }
    }
    /**
     * Cancel running tests
     */
    async cancelTests(testId) {
        const process = this.runningTests.get(testId);
        if (!process) {
            return false;
        }
        try {
            process.kill('SIGTERM');
            this.runningTests.delete(testId);
            // Update test result
            const result = this.testResults.get(testId);
            if (result) {
                result.status = TestStatus.CANCELLED;
                result.endTime = new Date();
                result.duration = result.endTime.getTime() - result.startTime.getTime();
            }
            this.logger.info(`Tests cancelled: ${testId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to cancel tests: ${testId}`, {
                error: error.message
            });
            return false;
        }
    }
    /**
     * Get test result by ID
     */
    getTestResult(testId) {
        return this.testResults.get(testId) || null;
    }
    /**
     * Get all test results
     */
    getAllTestResults() {
        return Array.from(this.testResults.values());
    }
    /**
     * Generate test summary report
     */
    generateTestSummary(results) {
        const summary = {
            totalSuites: results.length,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            totalDuration: 0,
            successRate: 0,
            coverage: null,
            byType: {},
            trends: this.calculateTestTrends(results)
        };
        results.forEach(result => {
            summary.totalTests += result.totalTests;
            summary.passedTests += result.passedTests;
            summary.failedTests += result.failedTests;
            summary.skippedTests += result.skippedTests;
            summary.totalDuration += result.duration;
            // Group by test type
            if (!summary.byType[result.type]) {
                summary.byType[result.type] = {
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 0,
                    skippedTests: 0,
                    duration: 0,
                    successRate: 0
                };
            }
            const typeStats = summary.byType[result.type];
            typeStats.totalTests += result.totalTests;
            typeStats.passedTests += result.passedTests;
            typeStats.failedTests += result.failedTests;
            typeStats.skippedTests += result.skippedTests;
            typeStats.duration += result.duration;
        });
        // Calculate success rates
        summary.successRate = summary.totalTests > 0 ?
            summary.passedTests / summary.totalTests : 0;
        Object.values(summary.byType).forEach(typeStats => {
            typeStats.successRate = typeStats.totalTests > 0 ?
                typeStats.passedTests / typeStats.totalTests : 0;
        });
        // Aggregate coverage if available
        const coverageResults = results.filter(r => r.coverage);
        if (coverageResults.length > 0) {
            summary.coverage = this.aggregateCoverage(coverageResults.map(r => r.coverage));
        }
        return summary;
    }
    // Private helper methods
    async prepareTestEnvironment(config) {
        // Ensure working directory exists
        try {
            await fs.access(config.workingDirectory);
        }
        catch {
            await fs.mkdir(config.workingDirectory, { recursive: true });
        }
        // Create output directories for reports and artifacts
        const outputDir = path.join(config.workingDirectory, 'test-output');
        await fs.mkdir(outputDir, { recursive: true });
        // Set up environment variables
        Object.assign(process.env, config.environment);
    }
    async runTestFramework(testId, config, startTime) {
        switch (config.framework) {
            case TestFramework.JEST:
                return await this.runJestTests(testId, config, startTime);
            case TestFramework.VITEST:
                return await this.runVitestTests(testId, config, startTime);
            case TestFramework.PLAYWRIGHT:
                return await this.runPlaywrightTests(testId, config, startTime);
            case TestFramework.CYPRESS:
                return await this.runCypressTests(testId, config, startTime);
            default:
                return await this.runGenericTests(testId, config, startTime);
        }
    }
    async runJestTests(testId, config, startTime) {
        return new Promise((resolve, reject) => {
            const args = [
                '--json',
                '--outputFile=test-results.json'
            ];
            if (config.coverage) {
                args.push('--coverage', '--coverageReporters=json', '--coverageReporters=lcov');
            }
            if (config.parallel) {
                args.push('--maxWorkers=50%');
            }
            const jestProcess = (0, child_process_1.spawn)('npx', ['jest', ...args], {
                cwd: config.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...config.environment }
            });
            this.runningTests.set(testId, jestProcess);
            const logs = [];
            jestProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            jestProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            jestProcess.on('close', async (code) => {
                this.runningTests.delete(testId);
                const endTime = new Date();
                const duration = endTime.getTime() - startTime.getTime();
                try {
                    // Parse Jest results
                    const resultsPath = path.join(config.workingDirectory, 'test-results.json');
                    const jestResults = await this.parseJestResults(resultsPath);
                    const result = {
                        id: testId,
                        type: config.type,
                        status: code === 0 ? TestStatus.PASSED : TestStatus.FAILED,
                        startTime,
                        endTime,
                        duration,
                        totalTests: jestResults.numTotalTests,
                        passedTests: jestResults.numPassedTests,
                        failedTests: jestResults.numFailedTests,
                        skippedTests: jestResults.numPendingTests,
                        failures: jestResults.testResults.flatMap((suite) => suite.assertionResults
                            .filter((test) => test.status === 'failed')
                            .map((test) => ({
                            testName: test.title,
                            testFile: suite.name,
                            error: test.failureMessages.join('\n'),
                            stackTrace: test.failureMessages.join('\n')
                        }))),
                        logs,
                        artifacts: [],
                        metadata: {
                            exitCode: code,
                            jestVersion: jestResults.jestVersion
                        }
                    };
                    resolve(result);
                }
                catch (error) {
                    reject(new Error(`Failed to parse Jest results: ${error instanceof Error ? error.message : String(error)}`));
                }
            });
            jestProcess.on('error', (_error) => {
                this.runningTests.delete(testId);
                reject(_error);
            });
            // Set timeout
            setTimeout(() => {
                if (this.runningTests.has(testId)) {
                    jestProcess.kill('SIGTERM');
                    reject(new Error(`Test execution timed out after ${config.timeout}ms`));
                }
            }, config.timeout);
        });
    }
    async runVitestTests(testId, config, startTime) {
        return new Promise((resolve, reject) => {
            const args = [
                'run',
                '--reporter=json',
                '--outputFile=test-results.json'
            ];
            if (config.coverage) {
                args.push('--coverage');
            }
            const childProcess = (0, child_process_1.spawn)('npx', ['vitest', ...args], {
                cwd: config.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...config.environment }
            });
            this.runningTests.set(testId, childProcess);
            const logs = [];
            childProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            childProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            childProcess.on('close', async (code) => {
                this.runningTests.delete(testId);
                const endTime = new Date();
                const duration = endTime.getTime() - startTime.getTime();
                try {
                    // Parse Vitest results
                    const resultsPath = path.join(config.workingDirectory, 'test-results.json');
                    const vitestResults = await this.parseVitestResults(resultsPath);
                    const result = {
                        id: testId,
                        type: config.type,
                        status: code === 0 ? TestStatus.PASSED : TestStatus.FAILED,
                        startTime,
                        endTime,
                        duration,
                        totalTests: vitestResults.numTotalTests || 0,
                        passedTests: vitestResults.numPassedTests || 0,
                        failedTests: vitestResults.numFailedTests || 0,
                        skippedTests: vitestResults.numSkippedTests || 0,
                        failures: [],
                        logs,
                        artifacts: [],
                        metadata: {
                            exitCode: code,
                            vitestVersion: vitestResults.version
                        }
                    };
                    resolve(result);
                }
                catch (error) {
                    // If parsing fails, create a basic result
                    const result = {
                        id: testId,
                        type: config.type,
                        status: code === 0 ? TestStatus.PASSED : TestStatus.FAILED,
                        startTime,
                        endTime,
                        duration,
                        totalTests: 0,
                        passedTests: code === 0 ? 1 : 0,
                        failedTests: code === 0 ? 0 : 1,
                        skippedTests: 0,
                        failures: code !== 0 ? [{
                                testName: 'Test execution',
                                testFile: 'unknown',
                                error: `Process exited with code ${code}`
                            }] : [],
                        logs,
                        artifacts: [],
                        metadata: { exitCode: code }
                    };
                    resolve(result);
                }
            });
            childProcess.on('error', (_error) => {
                this.runningTests.delete(testId);
                reject(_error);
            });
            // Set timeout
            setTimeout(() => {
                if (this.runningTests.has(testId)) {
                    childProcess.kill('SIGTERM');
                    reject(new Error(`Test execution timed out after ${config.timeout}ms`));
                }
            }, config.timeout);
        });
    }
    async runPlaywrightTests(testId, config, startTime) {
        return new Promise((resolve, reject) => {
            const args = [
                'test',
                '--reporter=json'
            ];
            const playwrightProcess = (0, child_process_1.spawn)('npx', ['playwright', ...args], {
                cwd: config.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...config.environment }
            });
            this.runningTests.set(testId, playwrightProcess);
            const logs = [];
            let stdout = '';
            playwrightProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                logs.push(output);
            });
            playwrightProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            playwrightProcess.on('close', async (code) => {
                this.runningTests.delete(testId);
                const endTime = new Date();
                const duration = endTime.getTime() - startTime.getTime();
                try {
                    // Parse Playwright results from stdout
                    const playwrightResults = this.parsePlaywrightResults(stdout);
                    const result = {
                        id: testId,
                        type: config.type,
                        status: code === 0 ? TestStatus.PASSED : TestStatus.FAILED,
                        startTime,
                        endTime,
                        duration,
                        totalTests: playwrightResults.totalTests,
                        passedTests: playwrightResults.passedTests,
                        failedTests: playwrightResults.failedTests,
                        skippedTests: playwrightResults.skippedTests,
                        failures: playwrightResults.failures,
                        logs,
                        artifacts: [],
                        metadata: {
                            exitCode: code,
                            browser: config.environment.BROWSER || 'chromium'
                        }
                    };
                    resolve(result);
                }
                catch (error) {
                    reject(new Error(`Failed to parse Playwright results: ${error instanceof Error ? error.message : String(error)}`));
                }
            });
            playwrightProcess.on('error', (error) => {
                this.runningTests.delete(testId);
                reject(error);
            });
            // Set timeout
            setTimeout(() => {
                if (this.runningTests.has(testId)) {
                    playwrightProcess.kill('SIGTERM');
                    reject(new Error(`Test execution timed out after ${config.timeout}ms`));
                }
            }, config.timeout);
        });
    }
    async runCypressTests(testId, config, startTime) {
        // Similar implementation for Cypress
        return this.runGenericTests(testId, config, startTime);
    }
    async runGenericTests(testId, config, startTime) {
        return new Promise((resolve, reject) => {
            const [command, ...args] = config.command.split(' ');
            const cypressProcess = (0, child_process_1.spawn)(command, args, {
                cwd: config.workingDirectory,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...config.environment }
            });
            this.runningTests.set(testId, cypressProcess);
            const logs = [];
            cypressProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            cypressProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                logs.push(output);
            });
            cypressProcess.on('close', (code) => {
                this.runningTests.delete(testId);
                const endTime = new Date();
                const duration = endTime.getTime() - startTime.getTime();
                const result = {
                    id: testId,
                    type: config.type,
                    status: code === 0 ? TestStatus.PASSED : TestStatus.FAILED,
                    startTime,
                    endTime,
                    duration,
                    totalTests: 1,
                    passedTests: code === 0 ? 1 : 0,
                    failedTests: code === 0 ? 0 : 1,
                    skippedTests: 0,
                    failures: code !== 0 ? [{
                            testName: 'Generic test execution',
                            testFile: 'unknown',
                            error: `Process exited with code ${code}`
                        }] : [],
                    logs,
                    artifacts: [],
                    metadata: { exitCode: code }
                };
                resolve(result);
            });
            cypressProcess.on('error', (error) => {
                this.runningTests.delete(testId);
                reject(error);
            });
            // Set timeout
            setTimeout(() => {
                if (this.runningTests.has(testId)) {
                    cypressProcess.kill('SIGTERM');
                    reject(new Error(`Test execution timed out after ${config.timeout}ms`));
                }
            }, config.timeout);
        });
    }
    async processTestResults(result, config) {
        // Apply test filters if configured
        if (config.filters && config.filters.length > 0) {
            // Filter logic would be implemented here
        }
        // Check coverage thresholds
        if (config.coverage && config.coverageThreshold && result.coverage) {
            const coverage = result.coverage.summary;
            const threshold = config.coverageThreshold;
            if (coverage.percentage < threshold.lines) {
                result.failures.push({
                    testName: 'Coverage Threshold',
                    testFile: 'coverage',
                    error: `Line coverage ${coverage.percentage}% is below threshold ${threshold.lines}%`
                });
                result.status = TestStatus.FAILED;
            }
        }
    }
    async generateCoverageReport(config) {
        try {
            const coveragePath = path.join(config.workingDirectory, 'coverage/coverage-final.json');
            const coverageData = await fs.readFile(coveragePath, 'utf-8');
            const coverage = JSON.parse(coverageData);
            return this.parseCoverageData(coverage);
        }
        catch (error) {
            this.logger.warn(`Failed to generate coverage report: ${error.message}`);
            return undefined;
        }
    }
    async collectArtifacts(config) {
        const artifacts = [];
        for (const artifactConfig of config.artifacts) {
            if (!artifactConfig.enabled)
                continue;
            try {
                const artifactPath = path.join(config.workingDirectory, artifactConfig.path);
                const stats = await fs.stat(artifactPath);
                artifacts.push({
                    name: artifactConfig.name,
                    path: artifactPath,
                    type: artifactConfig.type,
                    size: stats.size,
                    mimeType: this.getMimeType(artifactConfig.type)
                });
            }
            catch (error) {
                this.logger.warn(`Failed to collect artifact ${artifactConfig.name}: ${error.message}`);
            }
        }
        return artifacts;
    }
    async parseJestResults(resultsPath) {
        const data = await fs.readFile(resultsPath, 'utf-8');
        return JSON.parse(data);
    }
    async parseVitestResults(resultsPath) {
        const data = await fs.readFile(resultsPath, 'utf-8');
        return JSON.parse(data);
    }
    parsePlaywrightResults(stdout) {
        // Parse Playwright output - this is a simplified version
        const lines = stdout.split('\n');
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;
        const failures = [];
        lines.forEach(line => {
            if (line.includes('passed')) {
                const match = line.match(/(\d+) passed/);
                if (match)
                    passedTests = parseInt(match[1]);
            }
            if (line.includes('failed')) {
                const match = line.match(/(\d+) failed/);
                if (match)
                    failedTests = parseInt(match[1]);
            }
            if (line.includes('skipped')) {
                const match = line.match(/(\d+) skipped/);
                if (match)
                    skippedTests = parseInt(match[1]);
            }
        });
        totalTests = passedTests + failedTests + skippedTests;
        return {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            failures
        };
    }
    parseCoverageData(coverage) {
        // Parse coverage data from Istanbul/NYC format
        let totalLines = 0;
        let coveredLines = 0;
        let totalFunctions = 0;
        let coveredFunctions = 0;
        let totalBranches = 0;
        let coveredBranches = 0;
        let totalStatements = 0;
        let coveredStatements = 0;
        const files = [];
        Object.entries(coverage).forEach(([filePath, fileData]) => {
            const lineCoverage = fileData.l || {};
            const functionCoverage = fileData.f || {};
            const branchCoverage = fileData.b || {};
            const statementCoverage = fileData.s || {};
            const fileLines = Object.keys(lineCoverage).length;
            const fileCoveredLines = Object.values(lineCoverage).filter((count) => count > 0).length;
            const fileFunctions = Object.keys(functionCoverage).length;
            const fileCoveredFunctions = Object.values(functionCoverage).filter((count) => count > 0).length;
            const fileBranches = Object.keys(branchCoverage).length;
            const fileCoveredBranches = Object.values(branchCoverage).filter((branches) => branches.some((count) => count > 0)).length;
            const fileStatements = Object.keys(statementCoverage).length;
            const fileCoveredStatements = Object.values(statementCoverage).filter((count) => count > 0).length;
            totalLines += fileLines;
            coveredLines += fileCoveredLines;
            totalFunctions += fileFunctions;
            coveredFunctions += fileCoveredFunctions;
            totalBranches += fileBranches;
            coveredBranches += fileCoveredBranches;
            totalStatements += fileStatements;
            coveredStatements += fileCoveredStatements;
            files.push({
                path: filePath,
                lines: {
                    total: fileLines,
                    covered: fileCoveredLines,
                    percentage: fileLines > 0 ? (fileCoveredLines / fileLines) * 100 : 0
                },
                functions: {
                    total: fileFunctions,
                    covered: fileCoveredFunctions,
                    percentage: fileFunctions > 0 ? (fileCoveredFunctions / fileFunctions) * 100 : 0
                },
                branches: {
                    total: fileBranches,
                    covered: fileCoveredBranches,
                    percentage: fileBranches > 0 ? (fileCoveredBranches / fileBranches) * 100 : 0
                },
                statements: {
                    total: fileStatements,
                    covered: fileCoveredStatements,
                    percentage: fileStatements > 0 ? (fileCoveredStatements / fileStatements) * 100 : 0
                }
            });
        });
        return {
            lines: {
                total: totalLines,
                covered: coveredLines,
                percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
            },
            functions: {
                total: totalFunctions,
                covered: coveredFunctions,
                percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
            },
            branches: {
                total: totalBranches,
                covered: coveredBranches,
                percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
            },
            statements: {
                total: totalStatements,
                covered: coveredStatements,
                percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
            },
            files,
            summary: {
                total: totalLines + totalFunctions + totalBranches + totalStatements,
                covered: coveredLines + coveredFunctions + coveredBranches + coveredStatements,
                percentage: 0 // Will be calculated below
            }
        };
    }
    calculateTestTrends(results) {
        if (results.length < 2) {
            return {
                successRate: 'stable',
                duration: 'stable',
                coverage: 'stable'
            };
        }
        const recent = results.slice(-5);
        const older = results.slice(-10, -5);
        const recentSuccessRate = recent.reduce((sum, r) => sum + (r.passedTests / Math.max(r.totalTests, 1)), 0) / recent.length;
        const olderSuccessRate = older.length > 0 ?
            older.reduce((sum, r) => sum + (r.passedTests / Math.max(r.totalTests, 1)), 0) / older.length :
            recentSuccessRate;
        const recentDuration = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
        const olderDuration = older.length > 0 ?
            older.reduce((sum, r) => sum + r.duration, 0) / older.length :
            recentDuration;
        return {
            successRate: recentSuccessRate > olderSuccessRate * 1.05 ? 'improving' :
                recentSuccessRate < olderSuccessRate * 0.95 ? 'declining' : 'stable',
            duration: recentDuration < olderDuration * 0.95 ? 'improving' :
                recentDuration > olderDuration * 1.05 ? 'declining' : 'stable',
            coverage: 'stable' // Would need coverage data to calculate
        };
    }
    aggregateCoverage(coverageReports) {
        // Aggregate multiple coverage reports
        // This is a simplified implementation
        const first = coverageReports[0];
        return {
            ...first,
            summary: {
                total: coverageReports.reduce((sum, c) => sum + c.summary.total, 0),
                covered: coverageReports.reduce((sum, c) => sum + c.summary.covered, 0),
                percentage: 0 // Would be calculated based on aggregated data
            }
        };
    }
    getMimeType(type) {
        switch (type) {
            case 'report':
                return 'application/json';
            case 'screenshot':
                return 'image/png';
            case 'video':
                return 'video/mp4';
            case 'log':
                return 'text/plain';
            case 'coverage':
                return 'application/json';
            default:
                return 'application/octet-stream';
        }
    }
}
exports.TestRunner = TestRunner;
//# sourceMappingURL=TestRunner.js.map