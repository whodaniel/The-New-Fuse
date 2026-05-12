/**
 * Unit tests for MemoryMonitor
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryUsage } from '../types/index.js';
import { MemoryMonitor } from './MemoryMonitor.js';

describe('MemoryMonitor', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    // Clear singleton instance for each test
    (MemoryMonitor as any).instance = undefined;
    monitor = MemoryMonitor.getInstance();

    // Ensure monitoring is stopped before each test
    monitor.stopMonitoring();
    monitor.reset();
  });

  afterEach(() => {
    // Clean up after each test
    monitor.cleanup();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MemoryMonitor.getInstance();
      const instance2 = MemoryMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('startMonitoring', () => {
    it('should start monitoring with default interval', () => {
      monitor.startMonitoring();

      const stats = monitor.getMemoryStatistics();
      expect(stats.isMonitoring).toBe(true);

      monitor.stopMonitoring();
    });

    it('should start monitoring with custom interval', () => {
      monitor.startMonitoring(1000);

      const config = monitor.getConfiguration();
      expect(config.pollingInterval).toBe(1000);

      monitor.stopMonitoring();
    });

    it('should not start monitoring twice', () => {
      monitor.startMonitoring(1000);
      monitor.startMonitoring(2000); // Should be ignored

      const config = monitor.getConfiguration();
      expect(config.pollingInterval).toBe(1000); // Should remain first value

      monitor.stopMonitoring();
    });

    it('should take initial memory reading', () => {
      monitor.startMonitoring();

      const history = monitor.getMemoryHistory();
      expect(history.length).toBeGreaterThan(0);

      monitor.stopMonitoring();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring', () => {
      monitor.startMonitoring();
      expect(monitor.getMemoryStatistics().isMonitoring).toBe(true);

      monitor.stopMonitoring();
      expect(monitor.getMemoryStatistics().isMonitoring).toBe(false);
    });

    it('should handle stopping when not monitoring', () => {
      expect(() => monitor.stopMonitoring()).not.toThrow();
    });
  });

  describe('getCurrentUsage', () => {
    it('should return current memory usage', () => {
      const usage = monitor.getCurrentUsage();

      expect(usage).toHaveProperty('current');
      expect(usage).toHaveProperty('peak');
      expect(usage).toHaveProperty('percentage');
      expect(usage).toHaveProperty('timestamp');

      expect(typeof usage.current).toBe('number');
      expect(typeof usage.peak).toBe('number');
      expect(typeof usage.percentage).toBe('number');
      expect(typeof usage.timestamp).toBe('number');

      expect(usage.current).toBeGreaterThan(0);
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('setThreshold', () => {
    it('should set valid threshold', () => {
      monitor.setThreshold(75);

      const config = monitor.getConfiguration();
      expect(config.threshold).toBe(75);
    });

    it('should reject invalid thresholds', () => {
      expect(() => monitor.setThreshold(-1)).toThrow('Memory threshold must be between 0 and 100');
      expect(() => monitor.setThreshold(101)).toThrow('Memory threshold must be between 0 and 100');
    });

    it('should accept boundary values', () => {
      expect(() => monitor.setThreshold(0)).not.toThrow();
      expect(() => monitor.setThreshold(100)).not.toThrow();
    });
  });

  describe('onThresholdExceeded', () => {
    it('should register threshold callback', () => {
      const callback = vi.fn();
      monitor.onThresholdExceeded(callback);

      const config = monitor.getConfiguration();
      expect(config.callbackCount).toBe(1);
    });

    it('should register multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      monitor.onThresholdExceeded(callback1);
      monitor.onThresholdExceeded(callback2);

      const config = monitor.getConfiguration();
      expect(config.callbackCount).toBe(2);
    });
  });

  describe('removeThresholdCallback', () => {
    it('should remove existing callback', () => {
      const callback = vi.fn();
      monitor.onThresholdExceeded(callback);

      expect(monitor.getConfiguration().callbackCount).toBe(1);

      monitor.removeThresholdCallback(callback);
      expect(monitor.getConfiguration().callbackCount).toBe(0);
    });

    it('should handle removing non-existent callback', () => {
      const callback = vi.fn();
      expect(() => monitor.removeThresholdCallback(callback)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up all resources', () => {
      const callback = vi.fn();
      monitor.onThresholdExceeded(callback);
      monitor.startMonitoring();

      monitor.cleanup();

      const stats = monitor.getMemoryStatistics();
      const config = monitor.getConfiguration();

      expect(stats.isMonitoring).toBe(false);
      expect(stats.historyCount).toBe(0);
      expect(stats.peak).toBe(0);
      expect(config.callbackCount).toBe(0);
    });
  });

  describe('getMemoryHistory', () => {
    it('should return empty history initially', () => {
      const history = monitor.getMemoryHistory();
      expect(history).toEqual([]);
    });

    it('should return copy of history array', () => {
      monitor.startMonitoring();

      // Wait a bit for some readings
      setTimeout(() => {
        const history1 = monitor.getMemoryHistory();
        const history2 = monitor.getMemoryHistory();

        expect(history1).not.toBe(history2); // Different array instances
        expect(history1).toEqual(history2); // Same content

        monitor.stopMonitoring();
      }, 100);
    });
  });

  describe('getPeakMemoryUsage', () => {
    it('should return 0 initially', () => {
      expect(monitor.getPeakMemoryUsage()).toBe(0);
    });

    it('should track peak usage during monitoring', () => {
      monitor.startMonitoring();

      // Peak should be updated after initial reading
      setTimeout(() => {
        expect(monitor.getPeakMemoryUsage()).toBeGreaterThan(0);
        monitor.stopMonitoring();
      }, 100);
    });
  });

  describe('getAverageMemoryUsage', () => {
    it('should return 0 with no history', () => {
      expect(monitor.getAverageMemoryUsage()).toBe(0);
    });

    it('should calculate average from history', () => {
      monitor.startMonitoring();

      setTimeout(() => {
        const average = monitor.getAverageMemoryUsage();
        expect(typeof average).toBe('number');
        expect(average).toBeGreaterThanOrEqual(0);

        monitor.stopMonitoring();
      }, 100);
    });
  });

  describe('getMemoryStatistics', () => {
    it('should return complete statistics', () => {
      const stats = monitor.getMemoryStatistics();

      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('peak');
      expect(stats).toHaveProperty('average');
      expect(stats).toHaveProperty('threshold');
      expect(stats).toHaveProperty('historyCount');
      expect(stats).toHaveProperty('isMonitoring');

      expect(typeof stats.current).toBe('number');
      expect(typeof stats.peak).toBe('number');
      expect(typeof stats.average).toBe('number');
      expect(typeof stats.threshold).toBe('number');
      expect(typeof stats.historyCount).toBe('number');
      expect(typeof stats.isMonitoring).toBe('boolean');
    });
  });

  describe('isAboveThreshold', () => {
    it('should return boolean', () => {
      const result = monitor.isAboveThreshold();
      expect(typeof result).toBe('boolean');
    });

    it('should respect threshold setting', () => {
      monitor.setThreshold(0); // Very low threshold
      expect(monitor.isAboveThreshold()).toBe(true);

      monitor.setThreshold(100); // Very high threshold
      expect(monitor.isAboveThreshold()).toBe(false);
    });
  });

  describe('getMemoryTrend', () => {
    it('should return unknown with insufficient history', () => {
      expect(monitor.getMemoryTrend()).toBe('unknown');
    });

    it('should return trend types', () => {
      const trend = monitor.getMemoryTrend();
      expect(['increasing', 'decreasing', 'stable', 'unknown']).toContain(trend);
    });
  });

  describe('forceGarbageCollection', () => {
    it('should return boolean', () => {
      const result = monitor.forceGarbageCollection();
      expect(typeof result).toBe('boolean');
    });

    it('should handle missing global.gc gracefully', () => {
      const originalGc = global.gc;
      delete (global as any).gc;

      expect(monitor.forceGarbageCollection()).toBe(false);

      if (originalGc) {
        (global as any).gc = originalGc;
      }
    });
  });

  describe('getMemoryPressure', () => {
    it('should return pressure level', () => {
      const pressure = monitor.getMemoryPressure();
      expect(['low', 'medium', 'high', 'critical']).toContain(pressure);
    });

    it('should return appropriate pressure for different thresholds', () => {
      // This test uses the actual system memory, so we can't predict exact values
      // but we can test that it returns valid pressure levels
      monitor.setThreshold(0);
      const lowThresholdPressure = monitor.getMemoryPressure();

      monitor.setThreshold(100);
      const highThresholdPressure = monitor.getMemoryPressure();

      expect(['low', 'medium', 'high', 'critical']).toContain(lowThresholdPressure);
      expect(['low', 'medium', 'high', 'critical']).toContain(highThresholdPressure);
    });
  });

  describe('setMaxHistorySize', () => {
    it('should set valid history size', () => {
      monitor.setMaxHistorySize(50);

      const config = monitor.getConfiguration();
      expect(config.maxHistorySize).toBe(50);
    });

    it('should reject invalid history size', () => {
      expect(() => monitor.setMaxHistorySize(0)).toThrow('Max history size must be at least 1');
      expect(() => monitor.setMaxHistorySize(-1)).toThrow('Max history size must be at least 1');
    });

    it('should trim existing history if needed', () => {
      monitor.startMonitoring();

      setTimeout(() => {
        monitor.setMaxHistorySize(1);
        const history = monitor.getMemoryHistory();
        expect(history.length).toBeLessThanOrEqual(1);

        monitor.stopMonitoring();
      }, 100);
    });
  });

  describe('setThresholdCooldown', () => {
    it('should set valid cooldown', () => {
      monitor.setThresholdCooldown(3000);

      const config = monitor.getConfiguration();
      expect(config.cooldownMs).toBe(3000);
    });

    it('should reject negative cooldown', () => {
      expect(() => monitor.setThresholdCooldown(-1)).toThrow('Cooldown must be non-negative');
    });

    it('should accept zero cooldown', () => {
      expect(() => monitor.setThresholdCooldown(0)).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all monitoring state', () => {
      monitor.startMonitoring();
      monitor.setThreshold(75);

      monitor.reset();

      const stats = monitor.getMemoryStatistics();
      expect(stats.isMonitoring).toBe(false);
      expect(stats.historyCount).toBe(0);
      expect(stats.peak).toBe(0);
    });
  });

  describe('getConfiguration', () => {
    it('should return complete configuration', () => {
      const config = monitor.getConfiguration();

      expect(config).toHaveProperty('pollingInterval');
      expect(config).toHaveProperty('threshold');
      expect(config).toHaveProperty('maxHistorySize');
      expect(config).toHaveProperty('cooldownMs');
      expect(config).toHaveProperty('callbackCount');

      expect(typeof config.pollingInterval).toBe('number');
      expect(typeof config.threshold).toBe('number');
      expect(typeof config.maxHistorySize).toBe('number');
      expect(typeof config.cooldownMs).toBe('number');
      expect(typeof config.callbackCount).toBe('number');
    });
  });

  describe('threshold callbacks', () => {
    it('should trigger callbacks when threshold exceeded', (done) => {
      const callback = vi.fn((usage: MemoryUsage) => {
        expect(usage).toHaveProperty('current');
        expect(usage).toHaveProperty('percentage');
        done();
      });

      monitor.onThresholdExceeded(callback);
      monitor.setThreshold(0); // Very low threshold to trigger immediately
      monitor.startMonitoring(100); // Fast polling

      // Cleanup after test
      setTimeout(() => {
        monitor.stopMonitoring();
      }, 500);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });

      const goodCallback = vi.fn();

      monitor.onThresholdExceeded(errorCallback);
      monitor.onThresholdExceeded(goodCallback);
      monitor.setThreshold(0); // Trigger immediately

      expect(() => monitor.startMonitoring(100)).not.toThrow();

      setTimeout(() => {
        monitor.stopMonitoring();
      }, 200);
    });
  });
});
