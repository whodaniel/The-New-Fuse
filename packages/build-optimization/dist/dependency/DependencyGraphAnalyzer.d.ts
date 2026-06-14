/**
 * Dependency Graph Analyzer for build optimization
 *
 * This class analyzes package dependencies across a workspace to determine
 * optimal build order and create memory-efficient build stages.
 */
import { IDependencyGraphAnalyzer } from '../interfaces/index.js';
import { BuildStage, PackageDependency } from '../types/index.js';
/**
 * Analyzes package dependencies and creates optimized build stages
 */
export declare class DependencyGraphAnalyzer implements IDependencyGraphAnalyzer {
    private workspaceRoot;
    private packageCache;
    private dependencyGraph;
    constructor(workspaceRoot?: string);
    /**
     * Analyze package dependencies across the workspace
     */
    analyzeDependencies(workspaceRoot?: string): Promise<PackageDependency[]>;
    /**
     * Create build stages from analyzed dependencies
     */
    createBuildStages(dependencies: PackageDependency[], stageSize?: number): BuildStage[];
    /**
     * Get optimal build order using topological sort
     */
    getOptimalBuildOrder(dependencies: PackageDependency[]): string[];
    /**
     * Detect circular dependencies in the package graph
     */
    detectCircularDependencies(dependencies: PackageDependency[]): string[][];
    /**
     * Find all package.json files in the workspace
     */
    private findPackageJsonFiles;
    /**
     * Parse a package.json file
     */
    private parsePackageJson;
    /**
     * Build the dependency graph from package dependencies
     */
    private buildDependencyGraph;
    /**
     * Calculate dependency levels for each package
     */
    private calculateDependencyLevels;
    /**
     * Perform topological sort to get build order
     */
    private topologicalSort;
    /**
     * Check if packages in a stage can run in parallel
     */
    private canRunInParallel;
    /**
     * Get dependencies for the current stage based on previous stages
     */
    private getPreviousStageDependencies;
    /**
     * Estimate memory usage for a package based on its characteristics
     */
    private estimatePackageMemoryUsage;
}
//# sourceMappingURL=DependencyGraphAnalyzer.d.ts.map