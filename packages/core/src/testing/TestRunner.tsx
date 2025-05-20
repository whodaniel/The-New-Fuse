import { Logger } from 'winston';
import { TestSuite, TestCase, TestResult } from '@the-new-fuse/types';

export class TestRunner {
  private suites: Map<string, TestSuite> = new Map();
  
  constructor(private readonly logger: Logger) {}

  async registerSuite(suite: TestSuite): Promise<void> {
    this.suites.set(suite.name, suite);
  }

  async runSuite(suiteName: string): Promise<TestResult[]> {
    const suite = this.suites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite ${suiteName} not found`);
    }

    const results: TestResult[] = [];
    
    for (const testCase of suite.cases) {
      try {
        const result = await this.runTestCase(testCase);
        results.push(result);
      } catch (error) {
        this.logger.error(`Test ${testCase.name} failed`, error);
        results.push({
          name: testCase.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }

    return results;
  }

  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();

    try {
      await testCase.setup?.();
      const assertions = await testCase.execute();
      const duration = Date.now() - startTime;

      if (assertions.every(a => a.success)) {
        return {
          name: testCase.name,
          success: true,
          duration,
          assertions
        };
      }

      const failedAssertions = assertions.filter(a => !a.success);
      return {
        name: testCase.name,
        success: false,
        error: `Failed assertions: ${failedAssertions.map(a => a.message).join(', ')}`,
        duration,
        assertions
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: testCase.name,
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async runAll(): Promise<Map<string, TestResult[]>> {
    const allResults = new Map<string, TestResult[]>();
    for (const [suiteName] of this.suites) {
      const results = await this.runSuite(suiteName);
      allResults.set(suiteName, results);
    }
    return allResults;
  }

  generateReport(results: Map<string, TestResult[]>): string {
    let report = '';
    let totalTests = 0;
    let passedTests = 0;
    for (const [suite, suiteResults] of results) {
      report += `Suite: ${suite}\n`;
      report += '-'.repeat(suite.length + 7) + '\n';
      for (const result of suiteResults) {
        totalTests++;
        if (result.success) passedTests++;
        report += `${result.success ? '✓' : '✗'} ${result.name} (${result.duration}ms)\n`;
        if (!result.success) {
          report += `  Error: ${result.error}\n`;
        }
      }
      report += '\n';
    }
    report += `Summary: ${passedTests}/${totalTests} tests passed\n`;
    return report;
  }
}
