/**
 * BuildStrategyManager Tests
 * 
 * Tests for build strategy configuration, validation, and automatic selection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BuildStrategyManager, ConfigurationValidationError } from './BuildStrategyManager.js';
import {
  BuildStrategy,
  BuildConfiguration,
  SystemResources,
  BuildEnvironment,
  EnhancedBuildConfiguration
} from '../types/index.js';

describe('BuildStrategyManager', () => {
  let manager: BuildStrategyManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    manager = new BuildStrategyManager();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Strategy Management', () => {
    it('should provide default strategies', () => {
      const strategies = manager.getAvailableStrategies();
      
      expect(strategies).toContain('development');
      expect(strategies).toContain('production');
      expect(strategies).toContain('memory-optimized');
      expect(strategies).toContain('ultra-memory-optimized');
    });

    it('should get strategy by name', () => {
      const devStrategy = manager.getStrategy('development');
      
      expect(devStrategy).toBeDefined();
      expect(devStrategy.maxConcurrency).toBe(2);
      expect(devStrategy.memoryThreshold).toBe(65);
      expect(devStrategy.stageSize).toBe(6);
      expect(devStrategy.enableIncremental).toBe(true);
      expect(devStrategy.cleanupBetweenStages).toBe(true);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => manager.getStrategy('unknown')).toThrow('Unknown build strategy: unknown');
    });

    it('should register custom strategy', () => {
      const customStrategy: BuildStrategy = {
        maxConcurrency: 3,
        memoryThreshold: 75,
        stageSize: 5,
        enableIncremental: false,
        cleanupBetweenStages: false
      };

      manager.registerStrategy('custom', customStrategy);
      
      const retrieved = manager.getStrategy('custom');
      expect(retrieved).toEqual(customStrategy);
      expect(manager.getAvailableStrategies()).toContain('custom');
    });

    it('should return copy of strategy to prevent mutation', () => {
      const strategy1 = manager.getStrategy('development');
      const strategy2 = manager.getStrategy('development');
      
      strategy1.maxConcurrency = 999;
      expect(strategy2.maxConcurrency).not.toBe(999);
    });
  });

  describe('Automatic Strategy Selection', () => {
    it('should select ultra-memory-optimized for low memory systems', () => {
      const lowMemoryResources: SystemResources = {
        totalMemory: 4096,
        availableMemory: 2048, // 2GB available
        cpuCores: 2,
        platform: 'linux',
        nodeVersion: '18.0.0'
      };

      const strategy = manager.selectOptimalStrategy(lowMemoryResources);

      expect(strategy.maxConcurrency).toBe(1); // Math.max(1, Math.floor(2/4))
      expect(strategy.memoryThreshold).toBe(55);
      expect(strategy.stageSize).toBe(4);
      expect(strategy.enableIncremental).toBe(true);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });

    it('should select development strategy for medium memory systems', () => {
      const mediumMemoryResources: SystemResources = {
        totalMemory: 8192,
        availableMemory: 6144, // 6GB available
        cpuCores: 4,
        platform: 'darwin',
        nodeVersion: '18.0.0'
      };

      const strategy = manager.selectOptimalStrategy(mediumMemoryResources);

      expect(strategy.maxConcurrency).toBe(2); // Math.max(1, Math.floor(4/2))
      expect(strategy.memoryThreshold).toBe(65);
      expect(strategy.stageSize).toBe(6);
      expect(strategy.enableIncremental).toBe(true);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });

    it('should select production strategy for high memory systems', () => {
      const highMemoryResources: SystemResources = {
        totalMemory: 16384,
        availableMemory: 12288, // 12GB available
        cpuCores: 8,
        platform: 'linux',
        nodeVersion: '18.0.0'
      };

      const strategy = manager.selectOptimalStrategy(highMemoryResources);

      expect(strategy.maxConcurrency).toBe(6); // Math.min(8, Math.floor(12/2))
      expect(strategy.memoryThreshold).toBe(80);
      expect(strategy.stageSize).toBe(12);
      expect(strategy.enableIncremental).toBe(false);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });

    it('should select CI-optimized strategy for CI environment', () => {
      const resources: SystemResources = {
        totalMemory: 8192,
        availableMemory: 6144,
        cpuCores: 4,
        platform: 'linux',
        nodeVersion: '18.0.0'
      };

      const strategy = manager.selectOptimalStrategy(resources, 'ci');

      expect(strategy.maxConcurrency).toBe(2); // Math.min(4, Math.max(1, Math.floor(4/2)))
      expect(strategy.memoryThreshold).toBe(75);
      expect(strategy.stageSize).toBe(8);
      expect(strategy.enableIncremental).toBe(true);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });

    it('should select production strategy for production environment', () => {
      const resources: SystemResources = {
        totalMemory: 8192,
        availableMemory: 6144,
        cpuCores: 4,
        platform: 'linux',
        nodeVersion: '18.0.0'
      };

      const strategy = manager.selectOptimalStrategy(resources, 'production');

      expect(strategy.maxConcurrency).toBe(3); // Math.min(4, Math.floor(6/2))
      expect(strategy.memoryThreshold).toBe(80);
      expect(strategy.stageSize).toBe(12);
      expect(strategy.enableIncremental).toBe(false);
      expect(strategy.cleanupBetweenStages).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    it('should create configuration from environment variables', () => {
      process.env.BUILD_STRATEGY = 'production';
      process.env.MAX_MEMORY_USAGE = '8192';
      process.env.MAX_CONCURRENCY = '4';
      process.env.ENABLE_INCREMENTAL_BUILDS = 'false';
      process.env.STAGE_CLEANUP = 'true';
      process.env.MONITORING_INTERVAL = '2000';
      process.env.FORCE_MEMORY_OPTIMIZATION = 'true';

      const config = manager.createConfigurationFromEnvironment();

      expect(config.strategy).toBe('production');
      expect(config.maxMemoryUsage).toBe(8192);
      expect(config.maxConcurrency).toBe(4);
      expect(config.enableIncrementalBuilds).toBe(false);
      expect(config.stageCleanup).toBe(true);
      expect(config.monitoringInterval).toBe(2000);
      expect(config.forceMemoryOptimization).toBe(true);
    });

    it('should use defaults when environment variables are not set', () => {
      const config = manager.createConfigurationFromEnvironment();

      expect(config.strategy).toBe('development'); // Default for local environment
      expect(config.maxMemoryUsage).toBe(4096);
      expect(config.enableIncrementalBuilds).toBe(true);
      expect(config.stageCleanup).toBe(true);
      expect(config.forceMemoryOptimization).toBe(false);
    });

    it('should detect CI environment', () => {
      process.env.CI = 'true';
      
      const config = manager.createConfigurationFromEnvironment();
      
      expect(config.environment).toBe('ci');
      expect(config.strategy).toBe('memory-optimized'); // Default for CI
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const config = manager.createConfigurationFromEnvironment();
      
      expect(config.environment).toBe('production');
      expect(config.strategy).toBe('production'); // Default for production
    });

    it('should handle invalid environment variable values', () => {
      process.env.MAX_CONCURRENCY = 'invalid';
      process.env.ENABLE_INCREMENTAL_BUILDS = 'maybe';
      
      const config = manager.createConfigurationFromEnvironment();
      
      // Should use defaults for invalid number values, but boolean parsing is strict
      expect(config.maxConcurrency).toBe(3); // DEFAULT_CONFIG.MAX_CONCURRENCY (invalid number -> default)
      expect(config.enableIncrementalBuilds).toBe(false); // 'maybe' is not 'true' or '1' -> false
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validConfig: BuildConfiguration = {
        strategy: 'development',
        maxMemoryUsage: 4096,
        maxConcurrency: 2,
        enableIncrementalBuilds: true,
        stageCleanup: true,
        monitoringInterval: 1500
      };

      expect(() => manager.validateConfiguration(validConfig)).not.toThrow();
    });

    it('should reject configuration with invalid maxMemoryUsage', () => {
      const invalidConfig: BuildConfiguration = {
        strategy: 'development',
        maxMemoryUsage: 0,
        maxConcurrency: 2,
        enableIncrementalBuilds: true,
        stageCleanup: true,
        monitoringInterval: 1500
      };

      expect(() => manager.validateConfiguration(invalidConfig))
        .toThrow(ConfigurationValidationError);
    });

    it('should reject configuration with invalid maxConcurrency', () => {
      const invalidConfig: BuildConfiguration = {
        strategy: 'development',
        maxMemoryUsage: 4096,
        maxConcurrency: -1,
        enableIncrementalBuilds: true,
        stageCleanup: true,
        monitoringInterval: 1500
      };

      expect(() => manager.validateConfiguration(invalidConfig))
        .toThrow(ConfigurationValidationError);
    });

    it('should reject configuration with invalid strategy', () => {
      const invalidConfig: BuildConfiguration = {
        strategy: 'invalid' as any,
        maxMemoryUsage: 4096,
        maxConcurrency: 2,
        enableIncrementalBuilds: true,
        stageCleanup: true,
        monitoringInterval: 1500
      };

      expect(() => manager.validateConfiguration(invalidConfig))
        .toThrow(ConfigurationValidationError);
    });

    it('should validate build strategy', () => {
      const validStrategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      expect(() => manager.validateStrategy(validStrategy)).not.toThrow();
    });

    it('should reject strategy with invalid memoryThreshold', () => {
      const invalidStrategy: BuildStrategy = {
        maxConcurrency: 2,
        memoryThreshold: 150, // > 100
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      expect(() => manager.validateStrategy(invalidStrategy))
        .toThrow(ConfigurationValidationError);
    });

    it('should reject custom strategy with validation errors', () => {
      const invalidStrategy: BuildStrategy = {
        maxConcurrency: 0,
        memoryThreshold: 70,
        stageSize: 4,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      expect(() => manager.registerStrategy('invalid', invalidStrategy))
        .toThrow(ConfigurationValidationError);
    });
  });

  describe('Configuration Presets', () => {
    it('should provide configuration presets', () => {
      const presets = manager.getConfigurationPresets();

      expect(presets).toHaveProperty('low-memory');
      expect(presets).toHaveProperty('high-performance');
      expect(presets).toHaveProperty('ci-optimized');
    });

    it('should have valid low-memory preset', () => {
      const presets = manager.getConfigurationPresets();
      const lowMemory = presets['low-memory'];

      expect(lowMemory.strategy).toBe('memory-optimized');
      expect(lowMemory.maxConcurrency).toBe(1);
      expect(lowMemory.forceMemoryOptimization).toBe(true);
      expect(lowMemory.monorepoConfig?.maxPackagesPerStage).toBe(4);
    });

    it('should have valid high-performance preset', () => {
      const presets = manager.getConfigurationPresets();
      const highPerf = presets['high-performance'];

      expect(highPerf.strategy).toBe('production');
      expect(highPerf.maxConcurrency).toBe(8);
      expect(highPerf.enableIncrementalBuilds).toBe(false);
      expect(highPerf.stageCleanup).toBe(false);
    });

    it('should have valid CI-optimized preset', () => {
      const presets = manager.getConfigurationPresets();
      const ciOptimized = presets['ci-optimized'];

      expect(ciOptimized.environment).toBe('ci');
      expect(ciOptimized.forceMemoryOptimization).toBe(true);
      expect(ciOptimized.enableIncrementalBuilds).toBe(true);
      expect(ciOptimized.stageCleanup).toBe(true);
    });
  });

  describe('Configuration Merging', () => {
    it('should merge partial configuration with defaults', () => {
      const partial: Partial<EnhancedBuildConfiguration> = {
        maxConcurrency: 6,
        theiaConfig: {
          buildFirst: false,
          estimatedMemoryUsage: 1024,
          cleanupAfterBuild: false
        }
      };

      const merged = manager.mergeWithDefaults(partial);

      expect(merged.maxConcurrency).toBe(6); // From partial
      expect(merged.strategy).toBe('development'); // From defaults
      expect(merged.theiaConfig?.buildFirst).toBe(false); // From partial
      expect(merged.theiaConfig?.estimatedMemoryUsage).toBe(1024); // From partial
      expect(merged.monorepoConfig?.totalPackages).toBe(50); // From defaults
    });

    it('should handle empty partial configuration', () => {
      const merged = manager.mergeWithDefaults({});

      expect(merged.strategy).toBe('development');
      expect(merged.maxConcurrency).toBe(3);
      expect(merged.theiaConfig).toBeDefined();
      expect(merged.monorepoConfig).toBeDefined();
    });

    it('should deeply merge nested configurations', () => {
      const partial: Partial<EnhancedBuildConfiguration> = {
        monorepoConfig: {
          maxPackagesPerStage: 16,
          packageManager: 'npm'
        }
      };

      const merged = manager.mergeWithDefaults(partial);

      expect(merged.monorepoConfig?.maxPackagesPerStage).toBe(16); // From partial
      expect(merged.monorepoConfig?.packageManager).toBe('npm'); // From partial
      expect(merged.monorepoConfig?.totalPackages).toBe(50); // From defaults
      expect(merged.monorepoConfig?.priorityPackages).toBeDefined(); // From defaults
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error information', () => {
      try {
        const invalidConfig: BuildConfiguration = {
          strategy: 'development',
          maxMemoryUsage: -1,
          maxConcurrency: 2,
          enableIncrementalBuilds: true,
          stageCleanup: true,
          monitoringInterval: 1500
        };
        
        manager.validateConfiguration(invalidConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationValidationError);
        expect((error as ConfigurationValidationError).field).toBe('maxMemoryUsage');
        expect(error.message).toContain('maxMemoryUsage must be greater than 0');
      }
    });

    it('should handle multiple validation errors', () => {
      const invalidStrategy: BuildStrategy = {
        maxConcurrency: 0,
        memoryThreshold: 150,
        stageSize: -1,
        enableIncremental: true,
        cleanupBetweenStages: true
      };

      // Should throw on first validation error encountered
      expect(() => manager.validateStrategy(invalidStrategy))
        .toThrow(ConfigurationValidationError);
    });
  });
});