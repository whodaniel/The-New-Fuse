/**
 * Load Testing System
 */

import { ILoadTester } from '../interfaces/IMonitoring';
import { LoadTestConfig, LoadTestResult } from '../types/monitoring';
import { Logger } from '../utils/Logger';

/**
 * Load tester implementation
 */
export class LoadTester implements ILoadTester {
  private readonly logger: Logger;
  private readonly runningTests = new Map<string, LoadTestExecution>();
  private readonly testHistory: LoadTestResult[] = [];

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('LoadTester');
  }

  /**
   * Run a load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    this.logger.info(`Starting load test: ${config.name}`, {
      concurrency: config.concurrency,
      duration: config.duration,
      endpoint: config.endpoint,
    });

    const execution = new LoadTestExecution(config, this.logger);
    this.runningTests.set(config.name, execution);

    try {
      const result = await execution.run();
      this.testHistory.push(result);

      this.logger.info(`Load test completed: ${config.name}`, {
        passed: result.passed,
        totalRequests: result.totalRequests,
        successRate: result.successRate,
        avgResponseTime: result.avgResponseTime,
      });

      return result;
    } finally {
      this.runningTests.delete(config.name);
    }
  }

  /**
   * Get running tests
   */
  getRunningTests(): LoadTestConfig[] {
    return Array.from(this.runningTests.values()).map((execution) => execution.config);
  }

  /**
   * Stop a running test
   */
  async stopTest(testName: string): Promise<void> {
    const execution = this.runningTests.get(testName);
    if (!execution) {
      throw new Error(`Test not found: ${testName}`);
    }

    execution.stop();
    this.logger.info(`Stopped load test: ${testName}`);
  }

  /**
   * Get test history
   */
  getTestHistory(): LoadTestResult[] {
    return [...this.testHistory];
  }

  /**
   * Generate load test report
   */
  async generateTestReport(result: LoadTestResult): Promise<string> {
    const report = [
      `# Load Test Report: ${result.config.name}`,
      '',
      `## Test Configuration`,
      `- **Endpoint**: ${result.config.endpoint}`,
      `- **Concurrency**: ${result.config.concurrency} users`,
      `- **Duration**: ${result.config.duration / 1000}s`,
      `- **Request Rate**: ${result.config.requestRate || 'unlimited'} req/s`,
      '',
      `## Test Results`,
      `- **Start Time**: ${result.startTime.toISOString()}`,
      `- **End Time**: ${result.endTime.toISOString()}`,
      `- **Duration**: ${result.duration / 1000}s`,
      `- **Total Requests**: ${result.totalRequests}`,
      `- **Successful Requests**: ${result.successfulRequests}`,
      `- **Failed Requests**: ${result.failedRequests}`,
      `- **Success Rate**: ${(result.successRate * 100).toFixed(2)}%`,
      `- **Error Rate**: ${(result.errorRate * 100).toFixed(2)}%`,
      `- **Requests per Second**: ${result.requestsPerSecond.toFixed(2)}`,
      '',
      `## Performance Metrics`,
      `- **Average Response Time**: ${result.avgResponseTime.toFixed(2)}ms`,
      `- **P95 Response Time**: ${result.p95ResponseTime.toFixed(2)}ms`,
      `- **P99 Response Time**: ${result.p99ResponseTime.toFixed(2)}ms`,
      '',
      `## Threshold Validation`,
      `- **Test Passed**: ${result.passed ? '✅ Yes' : '❌ No'}`,
      '',
    ];

    if (result.violations.length > 0) {
      report.push(`## Threshold Violations`);
      result.violations.forEach((violation) => {
        report.push(`- ❌ ${violation}`);
      });
      report.push('');
    }

    if (Object.keys(result.errorsByType).length > 0) {
      report.push(`## Errors by Type`);
      Object.entries(result.errorsByType).forEach(([type, count]) => {
        report.push(`- **${type}**: ${count}`);
      });
      report.push('');
    }

    report.push(`## Performance Timeline`);
    report.push(`| Time | Response Time (ms) | RPS | Error Rate (%) |`);
    report.push(`|------|-------------------|-----|----------------|`);

    result.performanceTimeline.forEach((point) => {
      const time = point.timestamp.toISOString().substr(11, 8);
      const responseTime = point.responseTime.toFixed(2);
      const rps = point.requestsPerSecond.toFixed(2);
      const errorRate = (point.errorRate * 100).toFixed(2);
      report.push(`| ${time} | ${responseTime} | ${rps} | ${errorRate} |`);
    });

    return report.join('\n');
  }
}

/**
 * Load test execution class
 */
class LoadTestExecution {
  public readonly config: LoadTestConfig;
  private readonly logger: Logger;
  private stopped = false;
  private workers: LoadTestWorker[] = [];

  constructor(config: LoadTestConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Run the load test
   */
  async run(): Promise<LoadTestResult> {
    const startTime = new Date();
    const results: RequestResult[] = [];
    const performanceTimeline: any[] = [];
    const errorsByType: Record<string, number> = {};

    // Create workers
    for (let i = 0; i < this.config.concurrency; i++) {
      const worker = new LoadTestWorker(i, this.config, this.logger);
      this.workers.push(worker);
    }

    // Start performance monitoring
    const monitoringInterval = setInterval(() => {
      if (this.stopped) return;

      const now = new Date();
      const recentResults = results.filter(
        (r) => now.getTime() - r.timestamp.getTime() < 10000 // Last 10 seconds
      );

      if (recentResults.length > 0) {
        const avgResponseTime =
          recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length;
        const rps = recentResults.length / 10; // 10 second window
        const errorRate = recentResults.filter((r) => !r.success).length / recentResults.length;

        performanceTimeline.push({
          timestamp: now,
          responseTime: avgResponseTime,
          requestsPerSecond: rps,
          errorRate,
        });
      }
    }, 10000); // Every 10 seconds

    // Start workers
    const workerPromises = this.workers.map((worker) => worker.start(results, errorsByType));

    // Wait for test duration or stop signal
    await Promise.race([
      Promise.all(workerPromises),
      new Promise((resolve) => setTimeout(resolve, this.config.duration)),
      new Promise((resolve) => {
        const checkStop = () => {
          if (this.stopped) {
            resolve(undefined);
          } else {
            setTimeout(checkStop, 100);
          }
        };
        checkStop();
      }),
    ]);

    // Stop all workers
    this.stop();
    clearInterval(monitoringInterval);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Calculate results
    const totalRequests = results.length;
    const successfulRequests = results.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const requestsPerSecond = totalRequests / (duration / 1000);

    // Calculate response time percentiles
    const responseTimes = results.map((r) => r.responseTime).sort((a, b) => a - b);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
    const p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);

    // Check thresholds
    const violations: string[] = [];
    let passed = true;

    if (avgResponseTime > this.config.thresholds.maxAvgResponseTime) {
      violations.push(
        `Average response time ${avgResponseTime.toFixed(2)}ms exceeds threshold ${this.config.thresholds.maxAvgResponseTime}ms`
      );
      passed = false;
    }

    if (p95ResponseTime > this.config.thresholds.maxP95ResponseTime) {
      violations.push(
        `P95 response time ${p95ResponseTime.toFixed(2)}ms exceeds threshold ${this.config.thresholds.maxP95ResponseTime}ms`
      );
      passed = false;
    }

    if (successRate < this.config.thresholds.minSuccessRate) {
      violations.push(
        `Success rate ${(successRate * 100).toFixed(2)}% below threshold ${(this.config.thresholds.minSuccessRate * 100).toFixed(2)}%`
      );
      passed = false;
    }

    if (errorRate > this.config.thresholds.maxErrorRate) {
      violations.push(
        `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.thresholds.maxErrorRate * 100).toFixed(2)}%`
      );
      passed = false;
    }

    return {
      config: this.config,
      startTime,
      endTime,
      duration,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      errorRate,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errorsByType,
      performanceTimeline,
      passed,
      violations,
    };
  }

  /**
   * Stop the test
   */
  stop(): void {
    this.stopped = true;
    this.workers.forEach((worker) => worker.stop());
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * percentile) - 1;
    return values[Math.max(0, index)];
  }
}

/**
 * Load test worker
 */
class LoadTestWorker {
  private readonly id: number;
  private readonly config: LoadTestConfig;
  private readonly logger: Logger;
  private stopped = false;

  constructor(id: number, config: LoadTestConfig, logger: Logger) {
    this.id = id;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Start the worker
   */
  async start(results: RequestResult[], errorsByType: Record<string, number>): Promise<void> {
    const requestInterval = this.config.requestRate
      ? (1000 / this.config.requestRate) * this.config.concurrency
      : 0;

    while (!this.stopped) {
      try {
        const result = await this.makeRequest();
        results.push(result);

        if (!result.success && result.error) {
          const errorType = result.error.split(':')[0] || 'Unknown';
          errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        }

        // Rate limiting
        if (requestInterval > 0) {
          await new Promise((resolve) => setTimeout(resolve, requestInterval));
        }
      } catch (error) {
        this.logger.error(`Worker ${this.id} error:`, error);

        const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;

        results.push({
          timestamp: new Date(),
          responseTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Stop the worker
   */
  stop(): void {
    this.stopped = true;
  }

  /**
   * Make a request (mock implementation)
   */
  private async makeRequest(): Promise<RequestResult> {
    const startTime = Date.now();

    // Simulate request
    const responseTime = 50 + Math.random() * 200; // 50-250ms
    await new Promise((resolve) => setTimeout(resolve, responseTime));

    // Simulate occasional failures
    const success = Math.random() > 0.05; // 5% failure rate

    return {
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      success,
      error: success ? undefined : 'Simulated error',
    };
  }
}

/**
 * Request result interface
 */
interface RequestResult {
  timestamp: Date;
  responseTime: number;
  success: boolean;
  error?: string;
}
