# Performance Testing Framework

A comprehensive framework for measuring, analyzing, and tracking performance metrics in The New Fuse platform.

## Features

- **Execution Time Measurement**
  - Function timing with statistical analysis
  - Support for async operations
  - Warm-up iterations
  - Configurable thresholds

- **Memory Usage Monitoring**
  - Heap usage tracking
  - Memory leak detection
  - Long-running process analysis
  - Configurable thresholds

- **Performance Regression Detection**
  - Baseline metrics storage
  - Regression analysis
  - Statistical confidence scoring
  - Environment-specific baselines

- **Reporting**
  - HTML reports with interactive charts
  - Markdown reports
  - JSON data export
  - CI/CD integration

## Installation

The framework is included in the testing package. If you need to install additional dependencies:

```bash
npm install chart.js   # Required for HTML reports with charts
```

## Usage

### Basic Example

```typescript
import { PerformanceSuite } from '@the-new-fuse/testing/performance';

const suite = new PerformanceSuite({
  baselinePath: './performance-baselines',
  reportOptions: {
    format: 'html',
    includeCharts: true
  }
});

// Test a synchronous function
await suite.test(() => {
  // Your code here
}, {
  name: 'My Performance Test',
  iterations: 100,
  warmupIterations: 5
});

// Test an async function
await suite.test(async () => {
  await someAsyncOperation();
}, {
  name: 'Async Operation Test',
  iterations: 50,
  performanceThresholds: {
    maxDuration: 1000,    // 1 second
    maxMemoryUsage: 1024 * 1024  // 1MB
  }
});

// Generate a report
const reportPath = await suite.generateReport();
console.log(`Performance report generated at: ${reportPath}`);
```

### Advanced Configuration

```typescript
const suite = new PerformanceSuite({
  baselinePath: './performance-baselines',
  reportOptions: {
    format: 'html',
    outputDir: './reports',
    includeCharts: true,
    includeRawData: true
  },
  defaultThresholds: {
    performance: {
      maxDuration: 500,
      maxMemoryUsage: 512 * 1024
    },
    regression: {
      maxDurationIncrease: 10,  // 10% increase
      maxMemoryIncrease: 15,    // 15% increase
      minSignificantChange: 5   // 5% minimum change
    },
    leakDetection: {
      duration: 10000,         // 10 seconds
      measureInterval: 100,    // 100ms
      allowedGrowthRate: 1024, // 1KB/s
      minConfidence: 0.8
    }
  }
});
```

### Memory Leak Detection

```typescript
const result = await suite.test(() => {
  // Code that might leak memory
}, {
  name: 'Memory Leak Test',
  leakDetectionOptions: {
    duration: 30000,      // Monitor for 30 seconds
    measureInterval: 100, // Take measurements every 100ms
    iterations: 1000      // Run the operation 1000 times
  }
});

if (result.leakDetection?.isLeaking) {
  console.error(`Memory leak detected! Growth rate: ${result.leakDetection.leakRate} bytes/second`);
}
```

### CI/CD Integration

```typescript
import { PerformanceSuite } from '@the-new-fuse/testing/performance';

async function runPerformanceTests() {
  const suite = new PerformanceSuite({
    baselinePath: './performance-baselines',
    reportOptions: {
      format: process.env.CI ? 'markdown' : 'html',
      outputDir: './performance-reports'
    }
  });

  try {
    // Run your tests
    const results = await Promise.all([
      suite.test(() => { /* test 1 */ }, { name: 'API Response Time' }),
      suite.test(() => { /* test 2 */ }, { name: 'Data Processing' }),
      suite.test(() => { /* test 3 */ }, { name: 'UI Rendering' })
    ]);

    // Generate report
    const reportPath = await suite.generateReport();

    // Check for regressions
    const hasRegressions = results.some(
      result => result.regressionAnalysis?.hasRegression
    );

    if (hasRegressions) {
      console.error('Performance regressions detected!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Performance test failure:', error);
    process.exit(1);
  }
}

// Run in CI
if (process.env.CI) {
  runPerformanceTests();
}
```

## Writing Performance Tests

### Best Practices

1. **Isolate Tests**
   - Each test should measure a specific operation
   - Minimize external dependencies
   - Use mocks when appropriate

2. **Use Appropriate Sample Sizes**
   - More iterations provide better statistical significance
   - Consider using warmup iterations for JIT-compiled code
   - Balance accuracy with test runtime

3. **Set Meaningful Thresholds**
   - Base thresholds on actual performance requirements
   - Consider different environments (CI vs development)
   - Allow for some variance in timing

4. **Monitor Memory Usage**
   - Test memory-intensive operations
   - Set appropriate leak detection durations
   - Consider garbage collection impacts

5. **Maintain Baselines**
   - Update baselines when intentionally changing performance characteristics
   - Keep separate baselines for different environments
   - Document significant baseline changes

### Example Test Suite

```typescript
import { PerformanceSuite } from '@the-new-fuse/testing/performance';

describe('API Performance', () => {
  let suite: PerformanceSuite;

  beforeAll(() => {
    suite = new PerformanceSuite({
      baselinePath: './performance-baselines/api'
    });
  });

  afterAll(async () => {
    await suite.generateReport();
  });

  it('should handle large data sets efficiently', async () => {
    const result = await suite.test(async () => {
      const data = generateLargeDataSet();
      await processData(data);
    }, {
      name: 'large-data-processing',
      iterations: 50,
      performanceThresholds: {
        maxDuration: 2000,
        maxMemoryUsage: 100 * 1024 * 1024 // 100MB
      }
    });

    expect(result.leakDetection?.isLeaking).toBe(false);
    expect(result.regressionAnalysis?.hasRegression).toBe(false);
  });
});
```

## API Reference

See the TypeScript interfaces and classes in the source code for detailed API documentation:

- `PerformanceSuite`: Main entry point for running performance tests
- `measurePerformance`: Core timing and memory measurement utility
- `detectMemoryLeak`: Memory leak detection utility
- `RegressionDetector`: Performance regression analysis
- `PerformanceReportGenerator`: Test result reporting