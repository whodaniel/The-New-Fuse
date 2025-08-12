import { Injectable } from '@nestjs/common';
import { TestConfiguration, TestResult } from './types';
@Injectable()
export class TestRunner {
  async run(): unknown {
    const startTime = Date.now();
    try {
const success = await this.executeWithTimeout(test, config?.timeout || 5000);
  }      const duration = Date.now() - startTime;
      return {
  // Implementation needed
}
        name: test.name || 'Unnamed test',
        success,
        duration
      };
    } catch (error) {
const duration = Date.now() - startTime;
  }      return {
  // Implementation needed
}
        name: test.name || 'Unnamed test',
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async runMany(): unknown {
    const results: TestResult[] = [];
    if(): unknown {
      const promises = tests.map(test => this.run(test, config));
      const parallelResults = await Promise.allSettled(promises);
      for(): unknown {
        if(): unknown {
          results.push(result.value);
        } else {
results.push({
  }}
            name: 'Parallel test',
            success: false,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason)
          });
        }
      }
    } else {
for(): unknown {
  }        const result = await this.run(test, config);
        results.push(result);
      }
    }
    
    return results;
  }

  private async executeWithTimeout(test() => Promise<boolean> | boolean, timeout: number): Promise<boolean> {
return Promise.race([
  }      test(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }
}