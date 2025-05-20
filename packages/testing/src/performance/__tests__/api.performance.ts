import { PerformanceSuite } from '../PerformanceSuite.js';
import { ConfigService } from '@the-new-fuse/core'; // Corrected import path
import * as path from 'path';

describe('API Performance Tests', () => {
  let suite: PerformanceSuite;
  let config: ConfigService;

  beforeAll(() => {
    config = ConfigService.getInstance();
    
    suite = new PerformanceSuite({
      baselinePath: path.join(__dirname, '../../../performance-baselines'),
      reportOptions: {
        format: 'html',
        outputDir: path.join(__dirname, '../../../performance-reports'),
        includeCharts: true
      },
      defaultThresholds: {
        performance: {
          maxDuration: 1000,    // 1 second
          maxMemoryUsage: 50 * 1024 * 1024  // 50MB
        },
        regression: {
          maxDurationIncrease: 15,  // 15% increase
          maxMemoryIncrease: 20,    // 20% increase
          minSignificantChange: 5    // 5% minimum change
        }
      }
    });
  });

  afterAll(async () => {
    const reportPath = await suite.generateReport();
    console.log(`Performance report generated at: ${reportPath}`);
  });

  describe('Request Handling', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const result = await suite.test(async () => {
        // Simulate 100 concurrent API requests
        const requests = Array.from({ length: 100 }).map(() => 
          fetch('http://localhost:3000/api/data')
        );
        await Promise.all(requests);
      }, {
        name: 'concurrent-api-requests',
        iterations: 10,
        warmupIterations: 2,
        performanceThresholds: {
          maxDuration: 5000,  // 5 seconds
          maxMemoryUsage: 100 * 1024 * 1024  // 100MB
        }
      });

      expect(result.leakDetection?.isLeaking).toBe(false);
      expect(result.stats.mean).toBeLessThan(5000);
    });

    it('should process large data payloads efficiently', async () => {
      const largePayload = Array.from({ length: 10000 }).map((_, i) => ({
        id: i,
        data: 'x'.repeat(1000)  // 1KB of data per item
      }));

      const result = await suite.test(async () => {
        const response = await fetch('http://localhost:3000/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(largePayload)
        });
        await response.json();
      }, {
        name: 'large-payload-processing',
        iterations: 20,
        warmupIterations: 3,
        leakDetectionOptions: {
          duration: 30000,  // 30 seconds
          measureInterval: 100
        }
      });

      expect(result.stats.p95).toBeLessThan(2000);  // 95th percentile under 2 seconds
      expect(result.leakDetection?.isLeaking).toBe(false);
    });
  });

  describe('Data Processing', () => {
    it('should aggregate data efficiently', async () => {
      const result = await suite.test(async () => {
        const response = await fetch('http://localhost:3000/api/aggregate');
        const data = await response.json();
        expect(data).toBeDefined();
      }, {
        name: 'data-aggregation',
        iterations: 50,
        performanceThresholds: {
          maxDuration: 1000,  // 1 second
          maxMemoryUsage: 75 * 1024 * 1024  // 75MB
        }
      });

      // Check for performance regressions
      if (result.regressionAnalysis?.hasRegression) {
        console.warn('Performance regression detected in data aggregation!');
        console.warn(JSON.stringify(result.regressionAnalysis.regressions, null, 2));
      }
    });

    it('should handle streaming data efficiently', async () => {
      const result = await suite.test(async () => {
        const response = await fetch('http://localhost:3000/api/stream');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        let chunks = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks++;
        }

        expect(chunks).toBeGreaterThan(0);
      }, {
        name: 'stream-processing',
        iterations: 30,
        leakDetectionOptions: {
          duration: 20000,  // 20 seconds
          allowedGrowthRate: 2048  // Allow 2KB/s growth due to streaming
        }
      });

      expect(result.stats.mean).toBeLessThan(3000);  // Under 3 seconds
    });
  });

  describe('Memory Management', () => {
    it('should handle memory-intensive operations without leaks', async () => {
      const result = await suite.test(async () => {
        // Simulate a memory-intensive operation
        const data = Array.from({ length: 1000000 }).map((_, i) => ({
          id: i,
          value: Math.random()
        }));

        // Process the data in chunks
        const chunkSize = 1000;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await fetch('http://localhost:3000/api/process-chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk)
          });
        }
      }, {
        name: 'memory-intensive-operation',
        iterations: 5,
        leakDetectionOptions: {
          duration: 60000,  // 1 minute
          measureInterval: 1000,  // 1 second
          allowedGrowthRate: 1024,  // 1KB/s
          minConfidence: 0.9
        }
      });

      expect(result.leakDetection?.isLeaking).toBe(false);
      if (result.leakDetection?.leakRate !== undefined && result.leakDetection.leakRate > 512) {  // More than 512 bytes/s
        console.warn('Potential memory leak detected:', {
          leakRate: result.leakDetection?.leakRate,
          confidence: result.leakDetection?.analysisDetails.confidence
        });
      }
    });
  });
});