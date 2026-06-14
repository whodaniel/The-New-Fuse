/**
 * Build Stage Optimizer
 *
 * Optimizes build stages for memory efficiency by analyzing package characteristics,
 * memory usage patterns, and dependency relationships to create optimal build stages.
 */
import { BuildStage, PackageDependency, SystemResources } from '../types/index.js';
/**
 * Configuration for stage optimization
 */
export interface StageOptimizationConfig {
    /** Maximum memory usage per stage in MB */
    maxMemoryPerStage: number;
    /** Maximum number of packages per stage */
    maxPackagesPerStage: number;
    /** Target memory utilization percentage (0-100) */
    targetMemoryUtilization: number;
    /** Whether to prioritize memory efficiency over build speed */
    prioritizeMemoryEfficiency: boolean;
    /** System resources to consider for optimization */
    systemResources?: SystemResources;
}
/**
 * Stage optimization metrics
 */
export interface StageOptimizationMetrics {
    /** Total number of stages created */
    totalStages: number;
    /** Average memory usage per stage */
    averageMemoryPerStage: number;
    /** Peak memory usage across all stages */
    peakMemoryUsage: number;
    /** Memory utilization efficiency (0-100) */
    memoryUtilizationEfficiency: number;
    /** Estimated total build time reduction */
    estimatedBuildTimeReduction: number;
}
/**
 * Package grouping strategy
 */
export type PackageGroupingStrategy = 'memory-first' | 'dependency-first' | 'balanced' | 'size-first';
/**
 * Optimizes build stages for memory efficiency and performance
 */
export declare class BuildStageOptimizer {
    private config;
    constructor(config?: Partial<StageOptimizationConfig>);
    /**
     * Optimize build stages using advanced algorithms
     */
    optimizeBuildStages(dependencies: PackageDependency[], strategy?: PackageGroupingStrategy): BuildStage[];
    /**
     * Estimate memory usage for a build stage
     */
    estimateStageMemoryUsage(packages: string[], dependencies: PackageDependency[]): number;
    /**
     * Optimize stages based on estimated memory usage
     */
    optimizeStageMemoryUsage(stages: BuildStage[]): BuildStage[];
    /**
     * Calculate optimization metrics for the given stages
     */
    calculateOptimizationMetrics(stages: BuildStage[], originalDependencies: PackageDependency[]): StageOptimizationMetrics;
    /**
     * Detect circular dependencies using DFS
     */
    private detectCircularDependencies;
    /**
     * Break circular dependencies by removing edges
     */
    private breakCircularDependencies;
    /**
     * Optimize stages prioritizing memory efficiency
     */
    private optimizeForMemory;
    /**
     * Optimize stages prioritizing dependency order
     */
    private optimizeForDependencies;
    /**
     * Optimize stages prioritizing package size
     */
    private optimizeForSize;
    /**
     * Balanced optimization considering both memory and dependencies
     */
    private optimizeBalanced;
    /**
     * Calculate dependency levels for packages
     */
    private calculateDependencyLevels;
    /**
     * Create stages for a group of packages
     */
    private createStagesForPackageGroup;
    /**
     * Create a build stage
     */
    private createStage;
    /**
     * Add stage dependencies based on package dependencies
     */
    private addStageDependencies;
    /**
     * Check if packages can run in parallel
     */
    private canRunInParallel;
    /**
     * Split an oversized stage into smaller stages
     */
    private splitOversizedStage;
}
//# sourceMappingURL=BuildStageOptimizer.d.ts.map