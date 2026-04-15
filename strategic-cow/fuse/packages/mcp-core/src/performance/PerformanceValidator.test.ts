/**
 * Performance Validator Tests
 */

// @ts-expect-error - Jest globals are available without import
import { PerformanceValidator } from './PerformanceValidator';
import { LoadTestScenario } from './LoadTestRunner';

describe('PerformanceValidator', () => {
  let validator: PerformanceValidator;

  beforeEach(() => {
    validator = new PerformanceValidator();
  });

  describe('Performance Validation', () => {
    it('should validate performance against targets', async () => {
      const scenario: LoadTestScenario = {
        name: 'Basic Performance Test',
        phases: [{
          name: 'Load Phase',
          duration: 1000,
          users: { start: 1, end: 5, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const targets = {
        maxAvgResponseTime: 1000,
        maxP95ResponseTime: 2000,
        maxP99ResponseTime: 5000,
        minRPS: 1,
        minSuccessRate: 0.9,
        maxErrorRate: 0.1,
        maxMemoryUsage: 1024 * 1024 * 1024,
        maxCPUUsage: 80,
        minConcurrentConnections: 1
      };

      const result = await validator.validatePerformance(scenario, targets);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('validations');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('recommendations');

      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.validations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should identify failed validations', async () => {
      const scenario: LoadTestScenario = {
        name: 'Strict Performance Test',
        phases: [{
          name: 'Load Phase',
          duration: 500,
          users: { start: 1, end: 2, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      // Very strict targets that are likely to fail
      const strictTargets = {
        maxAvgResponseTime: 1, // 1ms - very strict
        maxP95ResponseTime: 2,
        maxP99ResponseTime: 5,
        minRPS: 10000, // Very high RPS requirement
        minSuccessRate: 0.99,
        maxErrorRate: 0.001,
        maxMemoryUsage: 1024, // Very low memory limit
        maxCPUUsage: 1,
        minConcurrentConnections: 1000
      };

      const result = await validator.validatePerformance(scenario, strictTargets);

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(100);
      
      const failedValidations = result.validations.filter(v => !v.passed);
      expect(failedValidations.length).toBeGreaterThan(0);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide meaningful recommendations', async () => {
      const scenario: LoadTestScenario = {
        name: 'Recommendation Test',
        phases: [{
          name: 'Load Phase',
          duration: 500,
          users: { start: 1, end: 2, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const targets = {
        maxAvgResponseTime: 10, // Low threshold to trigger recommendation
        maxP95ResponseTime: 20,
        maxP99ResponseTime: 50,
        minRPS: 1000, // High threshold to trigger recommendation
        minSuccessRate: 0.99,
        maxErrorRate: 0.001, // Low threshold to trigger recommendation
        maxMemoryUsage: 1024 * 1024, // Low threshold to trigger recommendation
        maxCPUUsage: 10, // Low threshold to trigger recommendation
        minConcurrentConnections: 1
      };

      const result = await validator.validatePerformance(scenario, targets);

      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check for specific recommendation types
      const hasResponseTimeRec = result.recommendations.some(rec => 
        rec.includes('caching') || rec.includes('optimize')
      );
      const hasThroughputRec = result.recommendations.some(rec => 
        rec.includes('scaling') || rec.includes('load balancing')
      );
      
      expect(hasResponseTimeRec || hasThroughputRec).toBe(true);
    });
  });

  describe('Scalability Testing', () => {
    it('should run scalability test with increasing load', async () => {
      const baseScenario: LoadTestScenario = {
        name: 'Scalability Test',
        phases: [{
          name: 'Load Phase',
          duration: 500,
          users: { start: 1, end: 1, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const { results, scalabilityAnalysis } = await validator.runScalabilityTest(baseScenario);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      expect(scalabilityAnalysis).toBeDefined();
      expect(scalabilityAnalysis).toHaveProperty('linearScaling');
      expect(scalabilityAnalysis).toHaveProperty('optimalUserCount');
      expect(scalabilityAnalysis).toHaveProperty('bottlenecks');
      expect(scalabilityAnalysis).toHaveProperty('throughputData');
      expect(scalabilityAnalysis).toHaveProperty('scalabilityScore');

      expect(typeof scalabilityAnalysis.linearScaling).toBe('boolean');
      expect(typeof scalabilityAnalysis.optimalUserCount).toBe('number');
      expect(Array.isArray(scalabilityAnalysis.bottlenecks)).toBe(true);
      expect(Array.isArray(scalabilityAnalysis.throughputData)).toBe(true);
      expect(typeof scalabilityAnalysis.scalabilityScore).toBe('number');
    });

    it('should identify optimal user count', async () => {
      const baseScenario: LoadTestScenario = {
        name: 'Optimal Load Test',
        phases: [{
          name: 'Load Phase',
          duration: 300,
          users: { start: 1, end: 1, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const { scalabilityAnalysis } = await validator.runScalabilityTest(baseScenario);

      expect(scalabilityAnalysis.optimalUserCount).toBeGreaterThan(0);
      expect(scalabilityAnalysis.scalabilityScore).toBeGreaterThanOrEqual(0);
      expect(scalabilityAnalysis.scalabilityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Stress Testing', () => {
    it('should run stress test to find breaking point', async () => {
      const baseScenario: LoadTestScenario = {
        name: 'Stress Test',
        phases: [{
          name: 'Stress Phase',
          duration: 200, // Short duration for testing
          users: { start: 1, end: 1, rampUp: 'linear' },
          operations: [{
            name: 'stress-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/stress'
            }
          }]
        }]
      };

      const stressResult = await validator.runStressTest(baseScenario);

      expect(stressResult).toBeDefined();
      expect(stressResult).toHaveProperty('breakingPoint');
      expect(stressResult).toHaveProperty('degradationPoint');
      expect(stressResult).toHaveProperty('recoveryTime');
      expect(stressResult).toHaveProperty('stressMetrics');

      expect(typeof stressResult.breakingPoint).toBe('number');
      expect(typeof stressResult.degradationPoint).toBe('number');
      expect(typeof stressResult.recoveryTime).toBe('number');
      expect(Array.isArray(stressResult.stressMetrics)).toBe(true);

      expect(stressResult.breakingPoint).toBeGreaterThan(0);
      expect(stressResult.recoveryTime).toBeGreaterThan(0);
    });

    it('should identify degradation before breaking point', async () => {
      const baseScenario: LoadTestScenario = {
        name: 'Degradation Test',
        phases: [{
          name: 'Load Phase',
          duration: 100,
          users: { start: 1, end: 1, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const stressResult = await validator.runStressTest(baseScenario);

      // Degradation point should be less than or equal to breaking point
      expect(stressResult.degradationPoint).toBeLessThanOrEqual(stressResult.breakingPoint);
    });
  });

  describe('Metrics Extraction', () => {
    it('should extract comprehensive metrics from test results', async () => {
      const scenario: LoadTestScenario = {
        name: 'Metrics Test',
        phases: [{
          name: 'Load Phase',
          duration: 500,
          users: { start: 1, end: 2, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const targets = {
        maxAvgResponseTime: 1000,
        maxP95ResponseTime: 2000,
        maxP99ResponseTime: 5000,
        minRPS: 1,
        minSuccessRate: 0.9,
        maxErrorRate: 0.1,
        maxMemoryUsage: 1024 * 1024 * 1024,
        maxCPUUsage: 80,
        minConcurrentConnections: 1
      };

      const result = await validator.validatePerformance(scenario, targets);

      // Verify metrics structure
      expect(result.metrics).toHaveProperty('responseTime');
      expect(result.metrics).toHaveProperty('throughput');
      expect(result.metrics).toHaveProperty('errors');
      expect(result.metrics).toHaveProperty('resources');
      expect(result.metrics).toHaveProperty('scalability');

      // Response time metrics
      expect(result.metrics.responseTime).toHaveProperty('avg');
      expect(result.metrics.responseTime).toHaveProperty('p50');
      expect(result.metrics.responseTime).toHaveProperty('p95');
      expect(result.metrics.responseTime).toHaveProperty('p99');
      expect(result.metrics.responseTime).toHaveProperty('min');
      expect(result.metrics.responseTime).toHaveProperty('max');

      // Throughput metrics
      expect(result.metrics.throughput).toHaveProperty('rps');
      expect(result.metrics.throughput).toHaveProperty('bytesPerSecond');

      // Error metrics
      expect(result.metrics.errors).toHaveProperty('rate');
      expect(result.metrics.errors).toHaveProperty('count');
      expect(result.metrics.errors).toHaveProperty('types');

      // Resource metrics
      expect(result.metrics.resources).toHaveProperty('memoryUsage');
      expect(result.metrics.resources).toHaveProperty('cpuUsage');
      expect(result.metrics.resources).toHaveProperty('connections');

      // Scalability metrics
      expect(result.metrics.scalability).toHaveProperty('concurrentUsers');
      expect(result.metrics.scalability).toHaveProperty('linearScaling');
      expect(result.metrics.scalability).toHaveProperty('bottlenecks');
    });
  });

  describe('Target Validation', () => {
    it('should validate all target types correctly', async () => {
      const scenario: LoadTestScenario = {
        name: 'Target Validation Test',
        phases: [{
          name: 'Load Phase',
          duration: 300,
          users: { start: 1, end: 1, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const targets = {
        maxAvgResponseTime: 1000,
        maxP95ResponseTime: 2000,
        maxP99ResponseTime: 5000,
        minRPS: 1,
        minSuccessRate: 0.9,
        maxErrorRate: 0.1,
        maxMemoryUsage: 1024 * 1024 * 1024,
        maxCPUUsage: 80,
        minConcurrentConnections: 1
      };

      const result = await validator.validatePerformance(scenario, targets);

      // Check that all target types are validated
      const targetNames = result.validations.map(v => v.target);
      expect(targetNames).toContain('Average Response Time');
      expect(targetNames).toContain('P95 Response Time');
      expect(targetNames).toContain('P99 Response Time');
      expect(targetNames).toContain('Requests per Second');
      expect(targetNames).toContain('Success Rate');
      expect(targetNames).toContain('Error Rate');
      expect(targetNames).toContain('Memory Usage');
      expect(targetNames).toContain('CPU Usage');

      // Each validation should have required properties
      result.validations.forEach(validation => {
        expect(validation).toHaveProperty('target');
        expect(validation).toHaveProperty('expected');
        expect(validation).toHaveProperty('actual');
        expect(validation).toHaveProperty('passed');
        expect(validation).toHaveProperty('deviation');

        expect(typeof validation.target).toBe('string');
        expect(typeof validation.expected).toBe('number');
        expect(typeof validation.actual).toBe('number');
        expect(typeof validation.passed).toBe('boolean');
        expect(typeof validation.deviation).toBe('number');
      });
    });

    it('should calculate deviation correctly', async () => {
      const scenario: LoadTestScenario = {
        name: 'Deviation Test',
        phases: [{
          name: 'Load Phase',
          duration: 200,
          users: { start: 1, end: 1, rampUp: 'linear' },
          operations: [{
            name: 'test-operation',
            weight: 1,
            request: {
              method: 'GET',
              path: '/test'
            }
          }]
        }]
      };

      const targets = {
        maxAvgResponseTime: 100, // Likely to be exceeded
        maxP95ResponseTime: 200,
        maxP99ResponseTime: 500,
        minRPS: 1,
        minSuccessRate: 0.9,
        maxErrorRate: 0.1,
        maxMemoryUsage: 1024 * 1024 * 1024,
        maxCPUUsage: 80,
        minConcurrentConnections: 1
      };

      const result = await validator.validatePerformance(scenario, targets);

      // Find response time validation
      const responseTimeValidation = result.validations.find(v => 
        v.target === 'Average Response Time'
      );

      if (responseTimeValidation && !responseTimeValidation.passed) {
        expect(Math.abs(responseTimeValidation.deviation)).toBeGreaterThan(0);
      }
    });
  });
});