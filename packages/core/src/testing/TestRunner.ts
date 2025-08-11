import { Injectable } from '@nestjs/common';
import { TestConfiguration, TestResult } from './types';
@Injectable()
export class TestRunner {
  // Implementation needed
}
  async run(test() => Promise<boolean> | boolean, config?: TestConfiguration): Promise<TestResult> {
  // Implementation needed
}
    const startTime = Date.now();
    try {
  // Implementation needed
}
      const success = await this.executeWithTimeout(test, config?.timeout || 5000);
      const duration = Date.now() - startTime;
      return {
  // Implementation needed
}
        name: test.name || 'Unnamed test',
        success,
        duration
      };
    } catch (error) {
  // Implementation needed
}
      const duration = Date.now() - startTime;
      return {
  // Implementation needed
}
        name: test.name || 'Unnamed test',
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async runMany(tests: Array<() => Promise<boolean> | boolean>, config?: TestConfiguration): Promise<TestResult[]> {
  // Implementation needed
}
    const results: TestResult[] = [];
    if (config?.parallel) {
  // Implementation needed
}
      const promises = tests.map(test => this.run(test, config));
      const parallelResults = await Promise.allSettled(promises);
      for (const result of parallelResults) {
  // Implementation needed
}
        if (result.status === 'fulfilled') {
  // Implementation needed
}
          results.push(result.value);
        } else {
  // Implementation needed
}
          results.push({
  // Implementation needed
}
            name: 'Parallel test',
            success: false,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason)
          });
        }
      }
    } else {
  // Implementation needed
}
      for (const test of tests) {
  // Implementation needed
}
        const result = await this.run(test, config);
        results.push(result);
      }
    }
    
    return results;
  }

  private async executeWithTimeout(test() => Promise<boolean> | boolean, timeout: number): Promise<boolean> {
  // Implementation needed
}
    return Promise.race([
      test(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }
}