import { Injectable } from '@nestjs/common';
import { TestConfiguration } from '../types/types';

@Injectable()
export class TestRunner {
  async execute(test: any, config: TestConfiguration): Promise<boolean> {
    try {
      if (typeof test.fn === 'function') {
        await test.fn();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Test execution failed:', error);
      return false;
    }
  }

  async runTests(tests: any[], config: TestConfiguration): Promise<any[]> {
    const results: any[] = [];
    for (const test of tests) {
      const success = await this.execute(test, config);
      results.push({ test: test.name || 'unnamed', success });
    }
    return results;
  }
}
