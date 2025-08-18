/**
 * Basic tests for build optimization package exports
 */

import { describe, it, expect } from 'vitest';
import { VERSION, DEFAULT_CONFIG } from './index.js';

describe('Build Optimization Package', () => {
  it('should export version information', () => {
    expect(VERSION).toBe('1.0.0');
  });

  it('should export default configuration optimized for large monorepo', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.MEMORY_THRESHOLD).toBe(70);
    expect(DEFAULT_CONFIG.MONITORING_INTERVAL).toBe(1500);
    expect(DEFAULT_CONFIG.STAGE_SIZE).toBe(8);
    expect(DEFAULT_CONFIG.MAX_CONCURRENCY).toBe(3);
  });

  it('should have all build strategies defined for monorepo', () => {
    expect(DEFAULT_CONFIG.STRATEGIES).toBeDefined();
    expect(DEFAULT_CONFIG.STRATEGIES.development).toBeDefined();
    expect(DEFAULT_CONFIG.STRATEGIES.production).toBeDefined();
    expect(DEFAULT_CONFIG.STRATEGIES['ultra-memory-optimized']).toBeDefined();
  });

  it('should have proper strategy configurations for monorepo', () => {
    const devStrategy = DEFAULT_CONFIG.STRATEGIES.development;
    expect(devStrategy.maxConcurrency).toBe(2);
    expect(devStrategy.memoryThreshold).toBe(65);
    expect(devStrategy.enableIncremental).toBe(true);
    expect(devStrategy.stageSize).toBe(6);

    const prodStrategy = DEFAULT_CONFIG.STRATEGIES.production;
    expect(prodStrategy.maxConcurrency).toBe(4);
    expect(prodStrategy.memoryThreshold).toBe(80);
    expect(prodStrategy.enableIncremental).toBe(false);
    expect(prodStrategy.stageSize).toBe(12);

    const ultraMemoryStrategy = DEFAULT_CONFIG.STRATEGIES['ultra-memory-optimized'];
    expect(ultraMemoryStrategy.maxConcurrency).toBe(1);
    expect(ultraMemoryStrategy.memoryThreshold).toBe(55);
    expect(ultraMemoryStrategy.enableIncremental).toBe(true);
    expect(ultraMemoryStrategy.stageSize).toBe(4);
  });

  it('should have Theia and monorepo configuration', () => {
    expect(DEFAULT_CONFIG.THEIA_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.THEIA_CONFIG.buildFirst).toBe(true);
    expect(DEFAULT_CONFIG.THEIA_CONFIG.estimatedMemoryUsage).toBe(2048);
    expect(DEFAULT_CONFIG.THEIA_CONFIG.cleanupAfterBuild).toBe(true);

    expect(DEFAULT_CONFIG.MONOREPO_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.MONOREPO_CONFIG.totalPackages).toBe(50);
    expect(DEFAULT_CONFIG.MONOREPO_CONFIG.maxPackagesPerStage).toBe(8);
    expect(DEFAULT_CONFIG.MONOREPO_CONFIG.priorityPackages).toContain('@the-new-fuse/types');
  });
});