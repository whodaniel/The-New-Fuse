import { measurePerformance, PerformanceResult, PerformanceStats, PerformanceThresholds } from './utils/measurePerformance.js';
import { detectMemoryLeak, LeakDetectionOptions, LeakDetectionResult } from './utils/memoryLeakDetector.js';
import { RegressionDetector, RegressionThresholds } from './regression/regressionDetector.js';
import { PerformanceReportGenerator, TestResult, ReportOptions } from './reporting/reportGenerator.js';

export interface PerformanceTestOptions {
  name: string;
  iterations?: number;
  warmupIterations?: number;
  performanceThresholds?: PerformanceThresholds;
  leakDetectionOptions?: LeakDetectionOptions;
  regressionThresholds?: RegressionThresholds;
}

export interface PerformanceTestResult extends TestResult {
  leakDetection?: LeakDetectionResult;
}

export class PerformanceSuite {
  private regressionDetector: RegressionDetector;
  private reportGenerator: PerformanceReportGenerator;
  private testResults: Map<string, PerformanceTestResult> = new Map();

  constructor(
    private readonly options: {
      baselinePath?: string;
      reportOptions?: Partial<ReportOptions>;
      defaultThresholds?: {
        performance?: PerformanceThresholds;
        regression?: RegressionThresholds;
        leakDetection?: LeakDetectionOptions;
      };
    } = {}
  ) {
    this.regressionDetector = new RegressionDetector(
      options.baselinePath,
      options.defaultThresholds?.regression
    );
    this.reportGenerator = new PerformanceReportGenerator(options.reportOptions);
  }

  /**
   * Run a performance test with the specified options
   */
  public async test(
    fn: () => Promise<any> | any,
    options: PerformanceTestOptions
  ): Promise<PerformanceTestResult> {
    const {
      name,
      iterations = 100,
      warmupIterations = 5,
      performanceThresholds = this.options.defaultThresholds?.performance,
      leakDetectionOptions = this.options.defaultThresholds?.leakDetection
    } = options;

    // Run performance measurements
    const perfResults = await measurePerformance(fn, {
      iterations,
      warmupIterations,
      thresholds: performanceThresholds,
      label: name
    });

    // Run memory leak detection
    const leakResults = await detectMemoryLeak(fn, leakDetectionOptions);

    // Check for regressions
    const regressionAnalysis = await this.regressionDetector.detectRegression(
      name,
      perfResults,
      process.env.NODE_ENV || 'development'
    ).catch(() => undefined); // Handle case where no baseline exists yet

    const testResult: PerformanceTestResult = {
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
  public async saveBaseline(testName?: string): Promise<void> {
    if (testName) {
      const result = this.testResults.get(testName);
      if (!result) {
        throw new Error(`No test results found for "${testName}"`);
      }
      await this.regressionDetector.saveBaseline(testName, {
        results: result.results,
        stats: result.stats
      });
    } else {
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
  public async generateReport(options?: Partial<ReportOptions>): Promise<string> {
    return this.reportGenerator.generateReport(
      Array.from(this.testResults.values()),
      options
    );
  }

  /**
   * Clear all test results
   */
  public clearResults(): void {
    this.testResults.clear();
  }

  /**
   * Get test result by name
   */
  public getTestResult(name: string): PerformanceTestResult | undefined {
    return this.testResults.get(name);
  }

  /**
   * Get all test results
   */
  public getAllTestResults(): PerformanceTestResult[] {
    return Array.from(this.testResults.values());
  }
}