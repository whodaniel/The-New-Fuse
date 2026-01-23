/**
 * BuildStrategyManager - Configuration system for build strategies
 * 
 * Manages different build strategies (development, production, memory-optimized)
 * with automatic strategy selection based on system resources and environment detection.
 */

import {
  BuildStrategy,
  BuildConfiguration,
  SystemResources,
  BuildEnvironment,
  EnhancedBuildConfiguration
} from '../types/index.js';
import { DEFAULT_CONFIG } from '../index.js';

/**
 * Configuration validation error
 */
export class ConfigurationValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ConfigurationValidationError';
  }
}

/**
 * Build strategy configuration manager
 */
export class BuildStrategyManager {
  private strategies: Map<string, BuildStrategy> = new Map();
  private defaultStrategy: string = 'development';

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Get build strategy by name
   */
  getStrategy(name: string): BuildStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown build strategy: ${name}`);
    }
    return { ...strategy }; // Return a copy to prevent mutation
  }

  /**
   * Register a custom build strategy
   */
  registerStrategy(name: string, strategy: BuildStrategy): void {
    this.validateStrategy(strategy);
    this.strategies.set(name, { ...strategy });
  }

  /**
   * Get all available strategy names
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Automatically select optimal strategy based on system resources
   */
  selectOptimalStrategy(systemResources: SystemResources, environment?: BuildEnvironment): BuildStrategy {
    const availableMemoryGB = systemResources.availableMemory / 1024;
    const cpuCores = systemResources.cpuCores;

    // Environment-based strategy selection
    if (environment === 'ci') {
      return this.getCIOptimizedStrategy(systemResources);
    }

    if (environment === 'production') {
      return this.getProductionStrategy(systemResources);
    }

    // Memory-based strategy selection
    if (availableMemoryGB < 4) {
      return this.getUltraMemoryOptimizedStrategy(systemResources);
    }

    if (availableMemoryGB < 8) {
      return this.getDevelopmentStrategy(systemResources);
    }

    // High-memory systems get production strategy
    return this.getProductionStrategy(systemResources);
  }

  /**
   * Create configuration from environment variables and defaults
   */
  createConfigurationFromEnvironment(): EnhancedBuildConfiguration {
    const environment = this.detectEnvironment();
    const strategy = process.env.BUILD_STRATEGY || this.getDefaultStrategyForEnvironment(environment);
    
    return {
      strategy: strategy as any,
      maxMemoryUsage: this.parseEnvNumber('MAX_MEMORY_USAGE', 4096),
      maxConcurrency: this.parseEnvNumber('MAX_CONCURRENCY', DEFAULT_CONFIG.MAX_CONCURRENCY),
      enableIncrementalBuilds: this.parseEnvBoolean('ENABLE_INCREMENTAL_BUILDS', true),
      stageCleanup: this.parseEnvBoolean('STAGE_CLEANUP', true),
      monitoringInterval: this.parseEnvNumber('MONITORING_INTERVAL', DEFAULT_CONFIG.MONITORING_INTERVAL),
      environment,
      forceMemoryOptimization: this.parseEnvBoolean('FORCE_MEMORY_OPTIMIZATION', false),
      ideConfig: {
        buildFirst: this.parseEnvBoolean('THEIA_BUILD_FIRST', DEFAULT_CONFIG.THEIA_CONFIG.buildFirst),
        estimatedMemoryUsage: DEFAULT_CONFIG.THEIA_CONFIG.estimatedMemoryUsage,
        cleanupAfterBuild: this.parseEnvBoolean('THEIA_CLEANUP_AFTER_BUILD', DEFAULT_CONFIG.THEIA_CONFIG.cleanupAfterBuild)
      },
      monorepoConfig: {
        totalPackages: this.parseEnvNumber('TOTAL_PACKAGES', DEFAULT_CONFIG.MONOREPO_CONFIG.totalPackages),
        priorityPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.priorityPackages],
        heavyPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.heavyPackages],
        maxPackagesPerStage: this.parseEnvNumber('MAX_PACKAGES_PER_STAGE', DEFAULT_CONFIG.MONOREPO_CONFIG.maxPackagesPerStage),
        workspaceRoot: process.cwd(),
        packageManager: (process.env.PACKAGE_MANAGER as any) || 'bun'
      }
    };
  }

  /**
   * Validate build configuration
   */
  validateConfiguration(config: BuildConfiguration): void {
    if (config.maxMemoryUsage <= 0) {
      throw new ConfigurationValidationError('maxMemoryUsage must be greater than 0', 'maxMemoryUsage');
    }

    if (config.maxConcurrency <= 0) {
      throw new ConfigurationValidationError('maxConcurrency must be greater than 0', 'maxConcurrency');
    }

    if (config.monitoringInterval <= 0) {
      throw new ConfigurationValidationError('monitoringInterval must be greater than 0', 'monitoringInterval');
    }

    const validStrategies = ['development', 'production', 'memory-optimized'];
    if (!validStrategies.includes(config.strategy)) {
      throw new ConfigurationValidationError(
        `strategy must be one of: ${validStrategies.join(', ')}`,
        'strategy'
      );
    }
  }

  /**
   * Validate build strategy
   */
  validateStrategy(strategy: BuildStrategy): void {
    if (strategy.maxConcurrency <= 0) {
      throw new ConfigurationValidationError('maxConcurrency must be greater than 0', 'maxConcurrency');
    }

    if (strategy.memoryThreshold <= 0 || strategy.memoryThreshold > 100) {
      throw new ConfigurationValidationError('memoryThreshold must be between 1 and 100', 'memoryThreshold');
    }

    if (strategy.stageSize <= 0) {
      throw new ConfigurationValidationError('stageSize must be greater than 0', 'stageSize');
    }
  }

  /**
   * Get configuration presets for different system types
   */
  getConfigurationPresets(): Record<string, EnhancedBuildConfiguration> {
    return {
      'low-memory': {
        strategy: 'memory-optimized',
        maxMemoryUsage: 2048,
        maxConcurrency: 1,
        enableIncrementalBuilds: true,
        stageCleanup: true,
        monitoringInterval: 1000,
        environment: 'development',
        forceMemoryOptimization: true,
        ideConfig: {
          buildFirst: true,
          estimatedMemoryUsage: 1536,
          cleanupAfterBuild: true
        },
        monorepoConfig: {
          totalPackages: 50,
          priorityPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.priorityPackages],
          heavyPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.heavyPackages],
          maxPackagesPerStage: 4,
          workspaceRoot: process.cwd(),
          packageManager: 'bun'
        }
      },
      'high-performance': {
        strategy: 'production',
        maxMemoryUsage: 8192,
        maxConcurrency: 8,
        enableIncrementalBuilds: false,
        stageCleanup: false,
        monitoringInterval: 2000,
        environment: 'production',
        forceMemoryOptimization: false,
        ideConfig: {
          buildFirst: true,
          estimatedMemoryUsage: 2048,
          cleanupAfterBuild: false
        },
        monorepoConfig: {
          totalPackages: 50,
          priorityPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.priorityPackages],
          heavyPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.heavyPackages],
          maxPackagesPerStage: 16,
          workspaceRoot: process.cwd(),
          packageManager: 'bun'
        }
      },
      'ci-optimized': {
        strategy: 'production',
        maxMemoryUsage: 6144,
        maxConcurrency: 4,
        enableIncrementalBuilds: true,
        stageCleanup: true,
        monitoringInterval: 1500,
        environment: 'ci',
        forceMemoryOptimization: true,
        ideConfig: {
          buildFirst: true,
          estimatedMemoryUsage: 2048,
          cleanupAfterBuild: true
        },
        monorepoConfig: {
          totalPackages: 50,
          priorityPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.priorityPackages],
          heavyPackages: [...DEFAULT_CONFIG.MONOREPO_CONFIG.heavyPackages],
          maxPackagesPerStage: 8,
          workspaceRoot: process.cwd(),
          packageManager: 'bun'
        }
      }
    };
  }

  /**
   * Merge configuration with defaults
   */
  mergeWithDefaults(config: Partial<EnhancedBuildConfiguration>): EnhancedBuildConfiguration {
    const defaults = this.createConfigurationFromEnvironment();
    
    const result: EnhancedBuildConfiguration = {
      ...defaults,
      ...config,
      ideConfig: {
        buildFirst: config.ideConfig?.buildFirst ?? defaults.ideConfig?.buildFirst ?? true,
        estimatedMemoryUsage: config.ideConfig?.estimatedMemoryUsage ?? defaults.ideConfig?.estimatedMemoryUsage ?? 2048,
        cleanupAfterBuild: config.ideConfig?.cleanupAfterBuild ?? defaults.ideConfig?.cleanupAfterBuild ?? true
      },
      monorepoConfig: {
        totalPackages: config.monorepoConfig?.totalPackages ?? defaults.monorepoConfig?.totalPackages ?? 50,
        priorityPackages: config.monorepoConfig?.priorityPackages ?? defaults.monorepoConfig?.priorityPackages ?? [],
        heavyPackages: config.monorepoConfig?.heavyPackages ?? defaults.monorepoConfig?.heavyPackages ?? [],
        maxPackagesPerStage: config.monorepoConfig?.maxPackagesPerStage ?? defaults.monorepoConfig?.maxPackagesPerStage ?? 8,
        workspaceRoot: config.monorepoConfig?.workspaceRoot ?? defaults.monorepoConfig?.workspaceRoot ?? process.cwd(),
        packageManager: config.monorepoConfig?.packageManager ?? defaults.monorepoConfig?.packageManager ?? 'bun'
      }
    };
    return result;
  }

  /**
   * Initialize default strategies
   */
  private initializeDefaultStrategies(): void {
    // Register built-in strategies
    this.strategies.set('development', DEFAULT_CONFIG.STRATEGIES.development);
    this.strategies.set('production', DEFAULT_CONFIG.STRATEGIES.production);
    this.strategies.set('memory-optimized', DEFAULT_CONFIG.STRATEGIES['ultra-memory-optimized']);
    this.strategies.set('ultra-memory-optimized', DEFAULT_CONFIG.STRATEGIES['ultra-memory-optimized']);
  }

  /**
   * Get ultra memory optimized strategy for low-memory systems
   */
  private getUltraMemoryOptimizedStrategy(systemResources: SystemResources): BuildStrategy {
    return {
      ...DEFAULT_CONFIG.STRATEGIES['ultra-memory-optimized'],
      maxConcurrency: Math.max(1, Math.floor(systemResources.cpuCores / 4))
    };
  }

  /**
   * Get development strategy for medium-memory systems
   */
  private getDevelopmentStrategy(systemResources: SystemResources): BuildStrategy {
    return {
      ...DEFAULT_CONFIG.STRATEGIES.development,
      maxConcurrency: Math.max(1, Math.floor(systemResources.cpuCores / 2))
    };
  }

  /**
   * Get production strategy for high-memory systems
   */
  private getProductionStrategy(systemResources: SystemResources): BuildStrategy {
    const availableMemoryGB = systemResources.availableMemory / 1024;
    return {
      ...DEFAULT_CONFIG.STRATEGIES.production,
      maxConcurrency: Math.min(systemResources.cpuCores, Math.floor(availableMemoryGB / 2))
    };
  }

  /**
   * Get CI-optimized strategy
   */
  private getCIOptimizedStrategy(systemResources: SystemResources): BuildStrategy {
    const availableMemoryGB = systemResources.availableMemory / 1024;
    
    // CI environments often have memory constraints but need reliability
    return {
      maxConcurrency: Math.min(4, Math.max(1, Math.floor(systemResources.cpuCores / 2))),
      memoryThreshold: 75, // More conservative in CI
      stageSize: 8,
      enableIncremental: true,
      cleanupBetweenStages: true
    };
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): BuildEnvironment {
    // Check common CI environment variables
    if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
      return 'ci';
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }

    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }

    // Default to local development
    return 'local';
  }

  /**
   * Get default strategy for environment
   */
  private getDefaultStrategyForEnvironment(environment: BuildEnvironment): string {
    switch (environment) {
      case 'production':
        return 'production';
      case 'ci':
        return 'memory-optimized';
      case 'development':
      case 'local':
      default:
        return 'development';
    }
  }

  /**
   * Parse environment variable as number with default
   */
  private parseEnvNumber(envVar: string, defaultValue: number): number {
    const value = process.env[envVar];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse environment variable as boolean with default
   */
  private parseEnvBoolean(envVar: string, defaultValue: boolean): boolean {
    const value = process.env[envVar];
    if (!value) return defaultValue;
    
    return value.toLowerCase() === 'true' || value === '1';
  }
}