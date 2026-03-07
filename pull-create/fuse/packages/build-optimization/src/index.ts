/**
 * Build Optimization Package
 * 
 * Memory-efficient build optimization tools for The New Fuse monorepo.
 * Provides intelligent concurrency management, staged compilation, and resource monitoring.
 */

// Export all types
export * from './types/index.js';

// Export all interfaces
export * from './interfaces/index.js';

// Export system resource detection
export * from './system/SystemResourceDetector.js';
export * from './system/MemoryMonitor.js';

// Export dependency analysis
export * from './dependency/DependencyGraphAnalyzer.js';
export * from './dependency/BuildStageOptimizer.js';

// Export concurrency control
export * from './concurrency/ConcurrencyController.js';
export * from './concurrency/BuildProcessThrottler.js';

// Export TypeScript compilation optimization
export * from './typescript/index.js';

// Export build orchestration
export * from './orchestration/index.js';

// Export monitoring and reporting
export * from './monitoring/index.js';

// Version information
export const VERSION = '1.0.0';

// Default configuration constants for 50+ package monorepo
export const DEFAULT_CONFIG = {
  /** Default memory threshold percentage for large monorepo */
  MEMORY_THRESHOLD: 70,
  
  /** Default monitoring interval in milliseconds */
  MONITORING_INTERVAL: 1500,
  
  /** Default stage size optimized for 50+ packages */
  STAGE_SIZE: 8,
  
  /** Default maximum concurrency for large monorepo */
  MAX_CONCURRENCY: 3,
  
  /** Build strategies optimized for monorepo with SkIDEancer IDE */
  STRATEGIES: {
    /** Development builds - always memory optimized for dev workflow */
    development: {
      maxConcurrency: 2,
      memoryThreshold: 65,
      stageSize: 6,
      enableIncremental: true,
      cleanupBetweenStages: true
    },
    /** Production builds - balanced performance and memory */
    production: {
      maxConcurrency: 4,
      memoryThreshold: 80,
      stageSize: 12,
      enableIncremental: false,
      cleanupBetweenStages: true
    },
    /** Ultra memory-optimized for resource-constrained environments */
    'ultra-memory-optimized': {
      maxConcurrency: 1,
      memoryThreshold: 55,
      stageSize: 4,
      enableIncremental: true,
      cleanupBetweenStages: true
    }
  },
  
  /** SkIDEancer IDE specific configuration */
  THEIA_CONFIG: {
    /** SkIDEancer must be built with yarn before bun build */
    buildFirst: true,
    /** Estimated memory usage for SkIDEancer build in MB */
    estimatedMemoryUsage: 2048,
    /** Cleanup after SkIDEancer build before continuing */
    cleanupAfterBuild: true
  },
  
  /** Monorepo specific settings */
  MONOREPO_CONFIG: {
    /** Total package count estimate */
    totalPackages: 50,
    /** Packages to prioritize in early stages */
    priorityPackages: ['@the-new-fuse/types', '@the-new-fuse/utils', '@the-new-fuse/core'],
    /** Packages that require more memory */
    heavyPackages: ['@the-new-fuse/ide-ide', '@the-new-fuse/electron-desktop'],
    /** Maximum packages per stage for memory efficiency */
    maxPackagesPerStage: 8
  }
} as const;