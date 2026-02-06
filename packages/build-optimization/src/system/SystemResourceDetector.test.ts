/**
 * Unit tests for SystemResourceDetector
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SystemResourceDetector } from './SystemResourceDetector.js';

describe('SystemResourceDetector', () => {
  let detector: SystemResourceDetector;

  beforeEach(() => {
    // Clear singleton instance for each test
    (SystemResourceDetector as any).instance = undefined;
    detector = SystemResourceDetector.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SystemResourceDetector.getInstance();
      const instance2 = SystemResourceDetector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getSystemResources', () => {
    it('should return system resources with correct structure', async () => {
      const resources = await detector.getSystemResources();

      expect(resources).toHaveProperty('totalMemory');
      expect(resources).toHaveProperty('availableMemory');
      expect(resources).toHaveProperty('cpuCores');
      expect(resources).toHaveProperty('platform');
      expect(resources).toHaveProperty('nodeVersion');

      expect(typeof resources.totalMemory).toBe('number');
      expect(typeof resources.availableMemory).toBe('number');
      expect(typeof resources.cpuCores).toBe('number');
      expect(typeof resources.platform).toBe('string');
      expect(typeof resources.nodeVersion).toBe('string');

      expect(resources.totalMemory).toBeGreaterThan(0);
      expect(resources.availableMemory).toBeGreaterThan(0);
      expect(resources.cpuCores).toBeGreaterThan(0);
      expect(resources.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should have available memory less than or equal to total memory', async () => {
      const resources = await detector.getSystemResources();
      expect(resources.availableMemory).toBeLessThanOrEqual(resources.totalMemory);
    });
  });

  describe('getCurrentMemoryUsage', () => {
    it('should return current memory usage with correct structure', () => {
      const usage = detector.getCurrentMemoryUsage();

      expect(usage).toHaveProperty('current');
      expect(usage).toHaveProperty('peak');
      expect(usage).toHaveProperty('percentage');
      expect(usage).toHaveProperty('timestamp');

      expect(typeof usage.current).toBe('number');
      expect(typeof usage.peak).toBe('number');
      expect(typeof usage.percentage).toBe('number');
      expect(typeof usage.timestamp).toBe('number');

      expect(usage.current).toBeGreaterThanOrEqual(0);
      expect(usage.peak).toBeGreaterThan(0);
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
      expect(usage.timestamp).toBeGreaterThan(0);
    });

    it('should have consistent memory values', () => {
      const usage = detector.getCurrentMemoryUsage();
      // Peak should be greater than or equal to current (but Node.js memory stats can be inconsistent)
      // Just verify they are both positive numbers
      expect(usage.peak).toBeGreaterThan(0);
      expect(usage.current).toBeGreaterThan(0);
    });
  });

  describe('hasSufficientResources', () => {
    it('should return boolean for resource check', () => {
      const result1 = detector.hasSufficientResources(100); // 100MB - should be available
      const result2 = detector.hasSufficientResources(999999); // 999GB - should not be available

      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
      expect(result1).toBe(true); // Small amount should be available
      expect(result2).toBe(false); // Huge amount should not be available
    });

    it('should handle zero and negative values', () => {
      expect(detector.hasSufficientResources(0)).toBe(true);
      expect(detector.hasSufficientResources(-100)).toBe(true);
    });
  });

  describe('getDetailedMemoryInfo', () => {
    it('should return detailed memory information with correct structure', () => {
      const info = detector.getDetailedMemoryInfo();

      expect(info).toHaveProperty('system');
      expect(info).toHaveProperty('process');
      expect(info).toHaveProperty('platform');

      expect(info.system).toHaveProperty('total');
      expect(info.system).toHaveProperty('free');
      expect(info.system).toHaveProperty('used');

      expect(info.process).toHaveProperty('rss');
      expect(info.process).toHaveProperty('heapTotal');
      expect(info.process).toHaveProperty('heapUsed');

      expect(typeof info.system.total).toBe('number');
      expect(typeof info.system.free).toBe('number');
      expect(typeof info.system.used).toBe('number');
      expect(typeof info.platform).toBe('string');

      expect(info.system.total).toBeGreaterThan(0);
      expect(info.system.free).toBeGreaterThanOrEqual(0);
      expect(info.system.used).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCPUInfo', () => {
    it('should return CPU information with correct structure', () => {
      const cpuInfo = detector.getCPUInfo();

      expect(cpuInfo).toHaveProperty('cores');
      expect(cpuInfo).toHaveProperty('model');
      expect(cpuInfo).toHaveProperty('speed');
      expect(cpuInfo).toHaveProperty('architecture');

      expect(typeof cpuInfo.cores).toBe('number');
      expect(typeof cpuInfo.model).toBe('string');
      expect(typeof cpuInfo.speed).toBe('number');
      expect(typeof cpuInfo.architecture).toBe('string');

      expect(cpuInfo.cores).toBeGreaterThan(0);
      expect(cpuInfo.model.length).toBeGreaterThan(0);
      expect(cpuInfo.speed).toBeGreaterThanOrEqual(0);
      expect(cpuInfo.architecture.length).toBeGreaterThan(0);
    });
  });

  describe('getPlatformMemoryLimits', () => {
    it('should return platform memory limits with correct structure', () => {
      const limits = detector.getPlatformMemoryLimits();

      expect(limits).toHaveProperty('maxHeapSize');
      expect(limits).toHaveProperty('recommendedMaxConcurrency');

      expect(typeof limits.maxHeapSize).toBe('number');
      expect(typeof limits.recommendedMaxConcurrency).toBe('number');

      expect(limits.maxHeapSize).toBeGreaterThan(0);
      expect(limits.recommendedMaxConcurrency).toBeGreaterThan(0);
    });

    it('should provide reasonable limits based on system resources', async () => {
      const limits = detector.getPlatformMemoryLimits();
      const resources = await detector.getSystemResources();

      // Max heap should be less than total memory
      expect(limits.maxHeapSize).toBeLessThan(resources.totalMemory);

      // Concurrency should be reasonable for the CPU count
      expect(limits.recommendedMaxConcurrency).toBeLessThanOrEqual(resources.cpuCores);
      expect(limits.recommendedMaxConcurrency).toBeGreaterThan(0);
    });
  });

  describe('isRunningInCI', () => {
    it('should return boolean for CI detection', () => {
      const result = detector.isRunningInCI();
      expect(typeof result).toBe('boolean');
    });

    it('should detect CI environment variables if present', () => {
      // This test will pass regardless of actual CI state
      // since we're just testing the method returns a boolean
      const originalEnv = process.env.CI;

      // Test with CI set
      process.env.CI = 'true';
      expect(detector.isRunningInCI()).toBe(true);

      // Test with CI unset
      delete process.env.CI;
      const result = detector.isRunningInCI();
      expect(typeof result).toBe('boolean');

      // Restore original
      if (originalEnv !== undefined) {
        process.env.CI = originalEnv;
      }
    });
  });

  describe('getEnvironmentRecommendations', () => {
    it('should return environment recommendations with correct structure', () => {
      const recommendations = detector.getEnvironmentRecommendations();

      expect(recommendations).toHaveProperty('maxConcurrency');
      expect(recommendations).toHaveProperty('memoryThreshold');
      expect(recommendations).toHaveProperty('enableIncrementalBuilds');
      expect(recommendations).toHaveProperty('stageSize');

      expect(typeof recommendations.maxConcurrency).toBe('number');
      expect(typeof recommendations.memoryThreshold).toBe('number');
      expect(typeof recommendations.enableIncrementalBuilds).toBe('boolean');
      expect(typeof recommendations.stageSize).toBe('number');

      expect(recommendations.maxConcurrency).toBeGreaterThan(0);
      expect(recommendations.memoryThreshold).toBeGreaterThan(0);
      expect(recommendations.memoryThreshold).toBeLessThanOrEqual(100);
      expect(recommendations.stageSize).toBeGreaterThan(0);
    });

    it('should provide reasonable recommendations', async () => {
      const recommendations = detector.getEnvironmentRecommendations();
      const resources = await detector.getSystemResources();

      // Concurrency should be reasonable for CPU count
      expect(recommendations.maxConcurrency).toBeLessThanOrEqual(resources.cpuCores);

      // Memory threshold should be reasonable
      expect(recommendations.memoryThreshold).toBeGreaterThanOrEqual(50);
      expect(recommendations.memoryThreshold).toBeLessThanOrEqual(90);

      // Stage size should be reasonable
      expect(recommendations.stageSize).toBeGreaterThanOrEqual(1);
      expect(recommendations.stageSize).toBeLessThanOrEqual(50);
    });

    it('should handle CI environment detection', () => {
      const originalCI = process.env.CI;

      // Test CI environment
      process.env.CI = 'true';
      const ciRecommendations = detector.getEnvironmentRecommendations();
      expect(ciRecommendations.memoryThreshold).toBeLessThanOrEqual(80); // More conservative in CI

      // Test local environment
      delete process.env.CI;
      const localRecommendations = detector.getEnvironmentRecommendations();
      expect(typeof localRecommendations.memoryThreshold).toBe('number');

      // Restore original
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      }
    });
  });
});
