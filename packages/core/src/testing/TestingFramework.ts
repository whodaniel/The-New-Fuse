import { Injectable } from '@nestjs/common';
import { TestDataGenerator } from './TestDataGenerator';
import { TestRunner } from './TestRunner';
import { TestConfiguration, TestSuite, TestResult } from '../types/types';

@Injectable()
export class TestingFramework {
  private testRunner: TestRunner;
  private testDataGenerator: TestDataGenerator;

  constructor() {
    this.testRunner = new TestRunner();
    this.testDataGenerator = new TestDataGenerator();
  }

  async runSuite(suite: TestSuite, config: TestConfiguration): Promise<Map<string, TestResult[]>> {
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
          duration
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        suiteResults.push({
          name: test.name || 'Unnamed test',
          success: false,
          duration,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    results.set(suite.name, suiteResults);
    return results;
  }

  async runSuites(suites: TestSuite[], config: TestConfiguration): Promise<Map<string, TestResult[]>> {
    const allResults = new Map<string, TestResult[]>();

    for (const suite of suites) {
      const suiteResults = await this.runSuite(suite, config);
      for (const [suiteName, results] of suiteResults.entries()) {
        allResults.set(suiteName, results);
      }
    }

    return allResults;
  }

  private async executeTest(test: any, config: TestConfiguration): Promise<boolean> {
    return this.testRunner.execute(test, config);
  }

  generateTestData(schema: any): any {
    return this.testDataGenerator.generate(schema);
  }
}
