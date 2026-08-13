/**
 * Unit tests for ConcurrencyController
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryUsage, SystemResources } from '../types/index.js';
import { ConcurrencyController } from './ConcurrencyController.js';

describe('ConcurrencyController', () => {
  let controller: ConcurrencyController;

  beforeEach(() => {
    controller = new ConcurrencyController(4, 8);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultController = new ConcurrencyController();
      expect(defaultController.getCurrentConcurrency()).toBe(2);
    });

    it('should initialize with provided values', () => {
      expect(controller.getCurrentConcurrency()).toBe(4);
      expect(controller.getStats().max).toBe(8);
    });
  });

  describe('getCurrentConcurrency', () => {
    it('should return current concurrency level', () => {
      expect(controller.getCurrentConcurrency()).toBe(4);
    });
  });

  describe('setMaxConcurrency', () => {
    it('should set maximum concurrency', () => {
      controller.setMaxConcurrency(12);
      expect(controller.getStats().max).toBe(12);
    });

    it('should adjust current concurrency if it exceeds new maximum', () => {
      controller.setMaxConcurrency(2);
      expect(controller.getCurrentConcurrency()).toBe(2);
    });

    it('should throw error for invalid maximum', () => {
      expect(() => controller.setMaxConcurrency(0)).toThrow(
        'Maximum concurrency must be at least 1'
      );
    });
  });

  describe('adjustConcurrency', () => {
    it('should reduce concurrency when memory usage is high', () => {
      const highMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 850, // 85% usage
        free: 150,
        percentage: 85,
      };

      const initialConcurrency = controller.getCurrentConcurrency();
      controller.adjustConcurrency(highMemoryUsage);
      expect(controller.getCurrentConcurrency()).toBeLessThan(initialConcurrency);
    });

    it('should increase concurrency when memory usage is low', () => {
      // First set concurrency to a lower value
      controller.forceConcurrency(2);

      const lowMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 500, // 50% usage
        free: 500,
        percentage: 50,
      };

      const initialConcurrency = controller.getCurrentConcurrency();
      controller.adjustConcurrency(lowMemoryUsage);
      expect(controller.getCurrentConcurrency()).toBeGreaterThan(initialConcurrency);
    });

    it('should not change concurrency when memory usage is within acceptable range', () => {
      const normalMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 750, // 75% usage
        free: 250,
        percentage: 75,
      };

      const initialConcurrency = controller.getCurrentConcurrency();
      controller.adjustConcurrency(normalMemoryUsage);
      expect(controller.getCurrentConcurrency()).toBe(initialConcurrency);
    });

    it('should not increase concurrency beyond maximum', () => {
      controller.setMaxConcurrency(4);
      controller.forceConcurrency(4);

      const lowMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 400, // 40% usage
        free: 600,
        percentage: 40,
      };

      controller.adjustConcurrency(lowMemoryUsage);
      expect(controller.getCurrentConcurrency()).toBe(4);
    });

    it('should not reduce concurrency below minimum', () => {
      controller.forceConcurrency(1);

      const highMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 950, // 95% usage
        free: 50,
        percentage: 95,
      };

      controller.adjustConcurrency(highMemoryUsage);
      expect(controller.getCurrentConcurrency()).toBe(1);
    });
  });

  describe('calculateOptimalConcurrency', () => {
    it('should calculate concurrency based on CPU cores', () => {
      const systemResources: SystemResources = {
        totalMemory: 8192,
        availableMemory: 4096,
        cpuCores: 8,
        platform: 'linux',
        nodeVersion: '18.0.0',
      };

      const optimal = controller.calculateOptimalConcurrency(systemResources);
      expect(optimal).toBe(4); // cpuCores / 2
    });

    it('should limit concurrency based on available memory', () => {
      const systemResources: SystemResources = {
        totalMemory: 2048,
        availableMemory: 1024, // Only 1GB available
        cpuCores: 16,
        platform: 'linux',
        nodeVersion: '18.0.0',
      };

      const optimal = controller.calculateOptimalConcurrency(systemResources);
      expect(optimal).toBe(2); // Limited by memory (1024MB / 512MB per process)
    });

    it('should not exceed maximum concurrency', () => {
      controller.setMaxConcurrency(2);

      const systemResources: SystemResources = {
        totalMemory: 16384,
        availableMemory: 8192,
        cpuCores: 16,
        platform: 'linux',
        nodeVersion: '18.0.0',
      };

      const optimal = controller.calculateOptimalConcurrency(systemResources);
      expect(optimal).toBe(2);
    });

    it('should ensure minimum concurrency of 1', () => {
      const systemResources: SystemResources = {
        totalMemory: 512,
        availableMemory: 256, // Very low memory
        cpuCores: 1,
        platform: 'linux',
        nodeVersion: '18.0.0',
      };

      const optimal = controller.calculateOptimalConcurrency(systemResources);
      expect(optimal).toBe(1);
    });
  });

  describe('resetConcurrency', () => {
    it('should reset concurrency to default value', () => {
      controller.forceConcurrency(1);
      controller.resetConcurrency();
      expect(controller.getCurrentConcurrency()).toBe(4); // Initial value
    });
  });

  describe('setMemoryThreshold', () => {
    it('should set memory threshold', () => {
      controller.setMemoryThreshold(0.9);
      expect(controller.getStats().memoryThreshold).toBe(0.9);
    });

    it('should throw error for invalid threshold', () => {
      expect(() => controller.setMemoryThreshold(0)).toThrow(
        'Memory threshold must be between 0 and 1'
      );
      expect(() => controller.setMemoryThreshold(1.5)).toThrow(
        'Memory threshold must be between 0 and 1'
      );
    });
  });

  describe('setAdjustmentFactor', () => {
    it('should set adjustment factor', () => {
      controller.setAdjustmentFactor(0.5);
      // Test by checking if adjustment uses the new factor
      const highMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 850,
        free: 150,
        percentage: 85,
      };

      const initialConcurrency = controller.getCurrentConcurrency();
      controller.adjustConcurrency(highMemoryUsage);

      // With 50% adjustment factor, reduction should be more significant
      const expectedReduction = Math.max(1, Math.floor(initialConcurrency * 0.5));
      const expectedConcurrency = Math.max(1, initialConcurrency - expectedReduction);
      expect(controller.getCurrentConcurrency()).toBe(expectedConcurrency);
    });

    it('should throw error for invalid adjustment factor', () => {
      expect(() => controller.setAdjustmentFactor(0)).toThrow(
        'Adjustment factor must be between 0 and 1'
      );
      expect(() => controller.setAdjustmentFactor(1.5)).toThrow(
        'Adjustment factor must be between 0 and 1'
      );
    });
  });

  describe('getStats', () => {
    it('should return concurrency statistics', () => {
      const stats = controller.getStats();
      expect(stats).toEqual({
        current: 4,
        max: 8,
        min: 1,
        default: 4,
        memoryThreshold: 0.8,
      });
    });
  });

  describe('forceConcurrency', () => {
    it('should force set concurrency within valid range', () => {
      controller.forceConcurrency(6);
      expect(controller.getCurrentConcurrency()).toBe(6);
    });

    it('should throw error for concurrency outside valid range', () => {
      expect(() => controller.forceConcurrency(0)).toThrow('Concurrency must be between 1 and 8');
      expect(() => controller.forceConcurrency(10)).toThrow('Concurrency must be between 1 and 8');
    });
  });

  describe('shouldAdjustConcurrency', () => {
    it('should recommend decrease for high memory usage', () => {
      const highMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 850,
        free: 150,
        percentage: 85,
      };

      const result = controller.shouldAdjustConcurrency(highMemoryUsage);
      expect(result.shouldAdjust).toBe(true);
      expect(result.direction).toBe('decrease');
      expect(result.reason).toContain('exceeds threshold');
    });

    it('should recommend increase for low memory usage', () => {
      controller.forceConcurrency(2); // Set below maximum

      const lowMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 500,
        free: 500,
        percentage: 50,
      };

      const result = controller.shouldAdjustConcurrency(lowMemoryUsage);
      expect(result.shouldAdjust).toBe(true);
      expect(result.direction).toBe('increase');
      expect(result.reason).toContain('is low');
    });

    it('should recommend no change for normal memory usage', () => {
      const normalMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 750,
        free: 250,
        percentage: 75,
      };

      const result = controller.shouldAdjustConcurrency(normalMemoryUsage);
      expect(result.shouldAdjust).toBe(false);
      expect(result.direction).toBe('none');
      expect(result.reason).toContain('within acceptable range');
    });

    it('should not recommend increase when at maximum concurrency', () => {
      controller.forceConcurrency(8); // Set to maximum

      const lowMemoryUsage: MemoryUsage = {
        total: 1000,
        used: 400,
        free: 600,
        percentage: 40,
      };

      const result = controller.shouldAdjustConcurrency(lowMemoryUsage);
      expect(result.shouldAdjust).toBe(false);
      expect(result.direction).toBe('none');
    });
  });

  describe('edge cases', () => {
    it('should handle zero available memory gracefully', () => {
      const systemResources: SystemResources = {
        totalMemory: 1024,
        availableMemory: 0,
        cpuCores: 4,
        platform: 'linux',
        nodeVersion: '18.0.0',
      };

      const optimal = controller.calculateOptimalConcurrency(systemResources);
      expect(optimal).toBe(1); // Should default to minimum
    });

    it('should handle single core systems', () => {
      const systemResources: SystemResources = {
        totalMemory: 2048,
        availableMemory: 1024,
        cpuCores: 1,
        platform: 'linux',
        nodeVersion: '18.0.0',
      };

      const optimal = controller.calculateOptimalConcurrency(systemResources);
      expect(optimal).toBe(1); // Should be 1 for single core
    });

    it('should handle memory usage at exactly threshold', () => {
      const exactThresholdUsage: MemoryUsage = {
        total: 1000,
        used: 801, // Just above 80%
        free: 199,
        percentage: 80.1,
      };

      const initialConcurrency = controller.getCurrentConcurrency();
      controller.adjustConcurrency(exactThresholdUsage);
      expect(controller.getCurrentConcurrency()).toBeLessThan(initialConcurrency);
    });
  });
});
