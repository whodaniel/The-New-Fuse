import { Injectable } from '@nestjs/common';
// Import 'Test' from Current, but 'Schema' is no longer needed
import { TestDataGenerator } from './TestDataGenerator'; 
import { TestRunner } from './TestRunner';
// Merged Import (Conflict 1)
import { TestConfiguration, TestSuite, TestResult, Test } from '../types/types';

@Injectable()
export class TestingFramework {
  private testRunner: TestRunner;
  private testDataGenerator: TestDataGenerator;

  constructor() {
    this.testRunner = new TestRunner();
    this.testDataGenerator = new TestDataGenerator();
  }

  // Use 'Current' signature (Conflict 2) but with new 'Incoming' logic
  async runSuite(
    suite: TestSuite,
    config?: TestConfiguration,
  ): Promise<Map<string, TestResult[]>> {
    const results = new Map<string, TestResult[]>();
    const suiteResults: TestResult[] = [];

    // Merged Logic: Use the TestRunner directly
    for (const test of suite.tests) {
      const result = await this.testRunner.run(test, config);
      suiteResults.push(result);
    }

    results.set(suite.name, suiteResults);
    return results;
  }

  // Use 'Current' signature (Conflict 3)
  async runSuites(
    suites: TestSuite[],
    config?: TestConfiguration,
  ): Promise<Map<string, TestResult[]>> {
    const allResults = new Map<string, TestResult[]>();

    for (const suite of suites) {
      const suiteResults = await this.runSuite(suite, config);
      for (const [suiteName, results] of suiteResults.entries()) {
        allResults.set(suiteName, results);
      }
    }
    return allResults;
  }

  // Conflict 4 Resolution:
  // - 'executeTest' is removed.
  // - 'generateTestData' is from 'Incoming'.
  // - 'createSuite' is from 'Current'.

  generateTestData(schema: any): any {
    return this.testDataGenerator.generate(schema);
  }

  createSuite(name: string, tests: Test[]): TestSuite {
    return {
      name,
      tests,
    };
  }
}