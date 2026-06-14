/**
 * Build Optimization Package
 *
 * Memory-efficient build optimization tools for The New Fuse monorepo.
 * Provides intelligent concurrency management, staged compilation, and resource monitoring.
 */
export * from './types/index.js';
export * from './interfaces/index.js';
export * from './system/MemoryMonitor.js';
export * from './system/SystemResourceDetector.js';
export * from './dependency/BuildStageOptimizer.js';
export * from './dependency/DependencyGraphAnalyzer.js';
export * from './concurrency/BuildProcessThrottler.js';
export * from './concurrency/ConcurrencyController.js';
export * from './typescript.js';
export * from './orchestration.js';
export * from './monitoring/index.js';
export declare const VERSION = "1.0.0";
export declare const DEFAULT_CONFIG: {
    /** Default memory threshold percentage for large monorepo */
    readonly MEMORY_THRESHOLD: 70;
    /** Default monitoring interval in milliseconds */
    readonly MONITORING_INTERVAL: 1500;
    /** Default stage size optimized for 50+ packages */
    readonly STAGE_SIZE: 8;
    /** Default maximum concurrency for large monorepo */
    readonly MAX_CONCURRENCY: 3;
    /** Build strategies optimized for monorepo with SkIDEancer IDE */
    readonly STRATEGIES: {
        /** Development builds - always memory optimized for dev workflow */
        readonly development: {
            readonly maxConcurrency: 2;
            readonly memoryThreshold: 65;
            readonly stageSize: 6;
            readonly enableIncremental: true;
            readonly cleanupBetweenStages: true;
        };
        /** Production builds - balanced performance and memory */
        readonly production: {
            readonly maxConcurrency: 4;
            readonly memoryThreshold: 80;
            readonly stageSize: 12;
            readonly enableIncremental: false;
            readonly cleanupBetweenStages: true;
        };
        /** Ultra memory-optimized for resource-constrained environments */
        readonly 'ultra-memory-optimized': {
            readonly maxConcurrency: 1;
            readonly memoryThreshold: 55;
            readonly stageSize: 4;
            readonly enableIncremental: true;
            readonly cleanupBetweenStages: true;
        };
    };
    /** SkIDEancer IDE specific configuration */
    readonly THEIA_CONFIG: {
        /** SkIDEancer must be built with yarn before bun build */
        readonly buildFirst: true;
        /** Estimated memory usage for SkIDEancer build in MB */
        readonly estimatedMemoryUsage: 2048;
        /** Cleanup after SkIDEancer build before continuing */
        readonly cleanupAfterBuild: true;
    };
    /** Monorepo specific settings */
    readonly MONOREPO_CONFIG: {
        /** Total package count estimate */
        readonly totalPackages: 50;
        /** Packages to prioritize in early stages */
        readonly priorityPackages: readonly ["@the-new-fuse/types", "@the-new-fuse/utils", "@the-new-fuse/core"];
        /** Packages that require more memory */
        readonly heavyPackages: readonly ["@the-new-fuse/ide-ide", "@the-new-fuse/electron-desktop"];
        /** Maximum packages per stage for memory efficiency */
        readonly maxPackagesPerStage: 8;
    };
};
//# sourceMappingURL=index.d.ts.map