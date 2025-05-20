import { PerformanceSuite } from '../PerformanceSuite.js';
import * as path from 'path';

describe('UI Performance Tests', () => {
  let suite: PerformanceSuite;

  beforeAll(() => {
    suite = new PerformanceSuite({
      baselinePath: path.join(__dirname, '../../../performance-baselines'),
      reportOptions: {
        format: 'html',
        outputDir: path.join(__dirname, '../../../performance-reports'),
        includeCharts: true
      },
      defaultThresholds: {
        performance: {
          maxDuration: 100,     // 100ms for UI operations
          maxMemoryUsage: 20 * 1024 * 1024  // 20MB
        },
        regression: {
          maxDurationIncrease: 10,  // 10% increase
          maxMemoryIncrease: 15,    // 15% increase
          minSignificantChange: 5    // 5% minimum change
        }
      }
    });
  });

  afterAll(async () => {
    const reportPath = await suite.generateReport();
    console.log(`Performance report generated at: ${reportPath}`);
  });

  describe('Rendering Performance', () => {
    it('should render large lists efficiently', async () => {
      const result = await suite.test(async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Create a large virtual list
        const list = document.createElement('div');
        list.style.height = '400px';
        list.style.overflow = 'auto';

        // Add 10,000 items
        const items = Array.from({ length: 10000 }).map((_, i) => {
          const item = document.createElement('div');
          item.textContent = `Item ${i}`;
          item.style.height = '40px';
          return item;
        });

        // Measure the actual DOM insertion
        list.append(...items);
        container.appendChild(list);

        // Force layout recalculation
        list.scrollTop = 200;
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Cleanup
        container.remove();
      }, {
        name: 'large-list-render',
        iterations: 20,
        warmupIterations: 2,
        performanceThresholds: {
          maxDuration: 500,  // 500ms
          maxMemoryUsage: 50 * 1024 * 1024  // 50MB
        }
      });

      expect(result.stats.p95).toBeLessThan(500);  // 95th percentile under 500ms
      expect(result.leakDetection?.isLeaking).toBe(false);
    });

    it('should handle frequent UI updates efficiently', async () => {
      const result = await suite.test(async () => {
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Create 100 elements that will be updated frequently
        const elements = Array.from({ length: 100 }).map((_, i) => {
          const el = document.createElement('div');
          el.textContent = `Element ${i}`;
          container.appendChild(el);
          return el;
        });

        // Simulate rapid UI updates
        for (let i = 0; i < 60; i++) {  // Simulate 1 second of 60fps updates
          elements.forEach(el => {
            el.style.transform = `translateX(${Math.sin(i * 0.1) * 10}px)`;
            el.style.opacity = `${0.5 + Math.sin(i * 0.1) * 0.5}`;
          });
          await new Promise(resolve => requestAnimationFrame(resolve));
        }

        // Cleanup
        container.remove();
      }, {
        name: 'frequent-updates',
        iterations: 10,
        performanceThresholds: {
          maxDuration: 1000,  // 1 second
          maxMemoryUsage: 30 * 1024 * 1024  // 30MB
        }
      });

      expect(result.stats.mean).toBeLessThan(1000);  // Average under 1 second
    });
  });

  describe('Event Handling', () => {
    it('should handle rapid user interactions efficiently', async () => {
      const result = await suite.test(async () => {
        const button = document.createElement('button');
        document.body.appendChild(button);

        // Simulate 100 rapid click events
        for (let i = 0; i < 100; i++) {
          button.click();
        }

        // Cleanup
        button.remove();
      }, {
        name: 'rapid-interactions',
        iterations: 50,
        performanceThresholds: {
          maxDuration: 200,  // 200ms
          maxMemoryUsage: 10 * 1024 * 1024  // 10MB
        }
      });

      expect(result.stats.p99).toBeLessThan(200);  // 99th percentile under 200ms
    });
  });

  describe('Animation Performance', () => {
    it('should maintain smooth animations', async () => {
      const result = await suite.test(async () => {
        const element = document.createElement('div');
        element.style.width = '100px';
        element.style.height = '100px';
        element.style.backgroundColor = 'blue';
        document.body.appendChild(element);

        // Track frame timing
        const frameTimes: number[] = [];
        let lastFrameTime = performance.now();

        // Run animation for 1 second
        for (let i = 0; i < 60; i++) {
          await new Promise(resolve => requestAnimationFrame(() => {
            const now = performance.now();
            frameTimes.push(now - lastFrameTime);
            lastFrameTime = now;

            element.style.transform = `rotate(${i * 6}deg)`;
            resolve(undefined);
          }));
        }

        // Calculate frame timing statistics
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const maxFrameTime = Math.max(...frameTimes);

        // Verify smooth animation (target: 60fps = ~16.7ms per frame)
        expect(avgFrameTime).toBeLessThan(17);
        expect(maxFrameTime).toBeLessThan(32);  // Allow occasional frame drops

        // Cleanup
        element.remove();
      }, {
        name: 'animation-smoothness',
        iterations: 10,
        warmupIterations: 2,
        leakDetectionOptions: {
          duration: 10000,  // 10 seconds
          measureInterval: 100,
          allowedGrowthRate: 512  // 512 bytes/s
        }
      });

      expect(result.leakDetection?.isLeaking).toBe(false);
    });
  });
});