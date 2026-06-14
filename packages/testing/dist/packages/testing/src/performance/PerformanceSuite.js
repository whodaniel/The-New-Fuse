"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceSuite = void 0;
const measurePerformance_1 = require("./utils/measurePerformance");
const memoryLeakDetector_1 = require("./utils/memoryLeakDetector");
const regressionDetector_1 = require("./regression/regressionDetector");
const reportGenerator_1 = require("./reporting/reportGenerator");
class PerformanceSuite {
    constructor(options = {}) {
        this.options = options;
        this.testResults = new Map();
        this.regressionDetector = new regressionDetector_1.RegressionDetector(options.baselinePath, options.defaultThresholds?.regression);
        this.reportGenerator = new reportGenerator_1.PerformanceReportGenerator(options.reportOptions);
    }
    /**
     * Run a performance test with the specified options
     */
    async test(fn, options) {
        const { name, iterations = 100, warmupIterations = 5, performanceThresholds = this.options.defaultThresholds?.performance, leakDetectionOptions = this.options.defaultThresholds?.leakDetection } = options;
        // Run performance measurements
        const perfResults = await (0, measurePerformance_1.measurePerformance)(fn, {
            iterations,
            warmupIterations,
            thresholds: performanceThresholds,
            label: name
        });
        // Run memory leak detection
        const leakResults = await (0, memoryLeakDetector_1.detectMemoryLeak)(fn, leakDetectionOptions);
        // Check for regressions
        const regressionAnalysis = await this.regressionDetector.detectRegression(name, perfResults, process.env.NODE_ENV || 'development').catch(() => undefined); // Handle case where no baseline exists yet
        const testResult = {
            name,
            timestamp: Date.now(),
            environment: process.env.NODE_ENV || 'development',
            results: perfResults.results,
            stats: perfResults.stats,
            regressionAnalysis,
            leakDetection: leakResults
        };
        this.testResults.set(name, testResult);
        return testResult;
    }
    /**
     * Save current test results as the new baseline
     */
    async saveBaseline(testName) {
        if (testName) {
            const result = this.testResults.get(testName);
            if (!result) {
                throw new Error(`No test results found for "${testName}"`);
            }
            await this.regressionDetector.saveBaseline(testName, {
                results: result.results,
                stats: result.stats
            });
        }
        else {
            // Save all test results as baselines
            for (const [name, result] of this.testResults.entries()) {
                await this.regressionDetector.saveBaseline(name, {
                    results: result.results,
                    stats: result.stats
                });
            }
        }
    }
    /**
     * Generate a performance report for all completed tests
     */
    async generateReport(options) {
        return this.reportGenerator.generateReport(Array.from(this.testResults.values()), options);
    }
    /**
     * Clear all test results
     */
    clearResults() {
        this.testResults.clear();
    }
    /**
     * Get test result by name
     */
    getTestResult(name) {
        return this.testResults.get(name);
    }
    /**
     * Get all test results
     */
    getAllTestResults() {
        return Array.from(this.testResults.values());
    }
}
exports.PerformanceSuite = PerformanceSuite;
//# sourceMappingURL=PerformanceSuite.js.map