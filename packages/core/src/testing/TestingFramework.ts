import { Injectable } from '@nestjs/common';
import { TestDataGenerator, Schema } from './TestDataGenerator';
import { TestRunner } from './TestRunner';
import { TestConfiguration, TestSuite, TestResult, Test } from '../tools/types';

@Injectable()
export class TestingFramework {
  private testRunner: TestRunner;
  private testDataGenerator: TestDataGenerator;

  constructor() {
    this.testRunner = new TestRunner();
    this.testDataGenerator = new TestDataGenerator();
  }

  async runSuite(suite: TestSuite, config?: TestConfiguration): Promise<Map<string, TestResult[]>> {
    const results = new Map<string, TestResult[]>();
    const suiteResults: TestResult[] = [];
    for (const test of suite.tests) {
      const startTime = Date.now();
      try {
        const success = await this.executeTest(test, config);
        const duration = Date.now() - startTime;
        suiteResults.push({
          name: test.name || 'Unnamed test',
          success,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        suiteResults.push({
          name: test.name || 'Unnamed test',
          success: false,
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    results.set(suite.name, suiteResults);
    return results;
  }

  async runSuites(suites: TestSuite[], config?: TestConfiguration): Promise<Map<string, TestResult[]>> {
    const allResults = new Map<string, TestResult[]>();
    for (const suite of suites) {
      const suiteResults = await this.runSuite(suite, config);
      for (const [suiteName, results] of suiteResults.entries()) {
        allResults.set(suiteName, results);
      }
    }
    return allResults;
  }

  private async executeTest(test: Test, config?: TestConfiguration): Promise<boolean> {
    const timeout = config?.timeout || 5000;
    const retries = config?.retries || 0;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          test.test(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
          ),
        ]);
        if (typeof result === 'boolean') {
          return result;
        }
        throw new Error('Test must return a boolean value');
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    return false;
  }

  generateTestData(schema: Schema): any {
    return this.testDataGenerator.generate(schema);
  }

  createSuite(name: string, tests: Test[]): TestSuite {
    return {
      name,
      tests,
    };
  }
}
