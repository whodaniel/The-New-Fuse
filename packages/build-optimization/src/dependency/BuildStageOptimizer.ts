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
export type PackageGroupingStrategy =
  | 'memory-first' // Prioritize memory efficiency
  | 'dependency-first' // Prioritize dependency order
  | 'balanced' // Balance memory and dependencies
  | 'size-first'; // Group by package size

/**
 * Optimizes build stages for memory efficiency and performance
 */
export class BuildStageOptimizer {
  private config: StageOptimizationConfig;

  constructor(config: Partial<StageOptimizationConfig> = {}) {
    this.config = {
      maxMemoryPerStage: 2048, // 2GB default
      maxPackagesPerStage: 8,
      targetMemoryUtilization: 75,
      prioritizeMemoryEfficiency: true,
      ...config,
    };
  }

  /**
   * Optimize build stages using advanced algorithms
   */
  optimizeBuildStages(
    dependencies: PackageDependency[],
    strategy: PackageGroupingStrategy = 'balanced'
  ): BuildStage[] {
    // Detect and handle circular dependencies first
    const circularDeps = this.detectCircularDependencies(dependencies);
    if (circularDeps.length > 0) {
      console.warn('Circular dependencies detected:', circularDeps);
      // Break circular dependencies by removing the least critical edges
      dependencies = this.breakCircularDependencies(dependencies, circularDeps);
    }

    // Apply the selected optimization strategy
    switch (strategy) {
      case 'memory-first':
        return this.optimizeForMemory(dependencies);
      case 'dependency-first':
        return this.optimizeForDependencies(dependencies);
      case 'size-first':
        return this.optimizeForSize(dependencies);
      case 'balanced':
      default:
        return this.optimizeBalanced(dependencies);
    }
  }

  /**
   * Estimate memory usage for a build stage
   */
  estimateStageMemoryUsage(packages: string[], dependencies: PackageDependency[]): number {
    let totalMemory = 0;
    const packageMap = new Map(dependencies.map((dep) => [dep.name, dep]));

    for (const packageName of packages) {
      const pkg = packageMap.get(packageName);
      if (pkg) {
        totalMemory += pkg.estimatedMemoryUsage;
      }
    }

    // Add overhead for parallel execution
    const parallelOverhead = packages.length > 1 ? packages.length * 50 : 0; // 50MB overhead per parallel package

    return totalMemory + parallelOverhead;
  }

  /**
   * Optimize stages based on estimated memory usage
   */
  optimizeStageMemoryUsage(stages: BuildStage[]): BuildStage[] {
    const optimizedStages: BuildStage[] = [];

    for (const stage of stages) {
      if (stage.estimatedMemoryUsage <= this.config.maxMemoryPerStage) {
        optimizedStages.push(stage);
        continue;
      }

      // Split oversized stage
      const splitStages = this.splitOversizedStage(stage);
      optimizedStages.push(...splitStages);
    }

    return optimizedStages;
  }

  /**
   * Calculate optimization metrics for the given stages
   */
  calculateOptimizationMetrics(
    stages: BuildStage[],
    originalDependencies: PackageDependency[]
  ): StageOptimizationMetrics {
    const totalMemory = stages.reduce((sum, stage) => sum + stage.estimatedMemoryUsage, 0);
    const averageMemory = totalMemory / stages.length;
    const peakMemory = Math.max(...stages.map((stage) => stage.estimatedMemoryUsage));

    // Calculate memory utilization efficiency
    const targetMemory =
      this.config.maxMemoryPerStage * (this.config.targetMemoryUtilization / 100);
    const memoryEfficiency = Math.min(100, (averageMemory / targetMemory) * 100);

    // Estimate build time reduction (simplified calculation)
    const originalBuildTime = originalDependencies.length * 60; // Assume 60s per package sequentially
    const optimizedBuildTime = stages.length * 120; // Assume 120s per stage with parallelization
    const buildTimeReduction = Math.max(
      0,
      ((originalBuildTime - optimizedBuildTime) / originalBuildTime) * 100
    );

    return {
      totalStages: stages.length,
      averageMemoryPerStage: averageMemory,
      peakMemoryUsage: peakMemory,
      memoryUtilizationEfficiency: memoryEfficiency,
      estimatedBuildTimeReduction: buildTimeReduction,
    };
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(dependencies: PackageDependency[]): string[][] {
    const graph = new Map<string, Set<string>>();
    const cycles: string[][] = [];

    // Build adjacency list
    for (const pkg of dependencies) {
      graph.set(
        pkg.name,
        new Set(pkg.dependencies.filter((dep) => dependencies.some((d) => d.name === dep)))
      );
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(node));
        }
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path]);
      }

      recursionStack.delete(node);
      path.pop();
    };

    for (const [nodeName] of graph) {
      if (!visited.has(nodeName)) {
        dfs(nodeName, []);
      }
    }

    return cycles;
  }

  /**
   * Break circular dependencies by removing edges
   */
  private breakCircularDependencies(
    dependencies: PackageDependency[],
    cycles: string[][]
  ): PackageDependency[] {
    const modifiedDeps = dependencies.map((dep) => ({
      ...dep,
      dependencies: [...dep.dependencies],
    }));

    for (const cycle of cycles) {
      if (cycle.length < 2) continue;

      // Remove the edge from the last package to the first in the cycle
      const lastPkg = cycle[cycle.length - 2]; // Second to last (since last is duplicate of first)
      const firstPkg = cycle[0];

      const pkg = modifiedDeps.find((d) => d.name === lastPkg);
      if (pkg) {
        pkg.dependencies = pkg.dependencies.filter((dep) => dep !== firstPkg);
        console.warn(`Broke circular dependency: ${lastPkg} -> ${firstPkg}`);
      }
    }

    return modifiedDeps;
  }

  /**
   * Optimize stages prioritizing memory efficiency
   */
  private optimizeForMemory(dependencies: PackageDependency[]): BuildStage[] {
    // Sort packages by memory usage (ascending)
    const sortedPackages = [...dependencies].sort(
      (a, b) => a.estimatedMemoryUsage - b.estimatedMemoryUsage
    );

    const stages: BuildStage[] = [];
    let currentStage: string[] = [];
    let currentMemory = 0;
    let stageId = 1;

    for (const pkg of sortedPackages) {
      if (
        currentMemory + pkg.estimatedMemoryUsage > this.config.maxMemoryPerStage ||
        currentStage.length >= this.config.maxPackagesPerStage
      ) {
        if (currentStage.length > 0) {
          stages.push(this.createStage(stageId++, currentStage, currentMemory, dependencies));
        }

        currentStage = [pkg.name];
        currentMemory = pkg.estimatedMemoryUsage;
      } else {
        currentStage.push(pkg.name);
        currentMemory += pkg.estimatedMemoryUsage;
      }
    }

    if (currentStage.length > 0) {
      stages.push(this.createStage(stageId, currentStage, currentMemory, dependencies));
    }

    return this.addStageDependencies(stages, dependencies);
  }

  /**
   * Optimize stages prioritizing dependency order
   */
  private optimizeForDependencies(dependencies: PackageDependency[]): BuildStage[] {
    const dependencyLevels = this.calculateDependencyLevels(dependencies);
    const stages: BuildStage[] = [];

    const maxLevel = Math.max(...Array.from(dependencyLevels.values()));

    for (let level = 0; level <= maxLevel; level++) {
      const packagesAtLevel = Array.from(dependencyLevels.entries())
        .filter(([_, pkgLevel]) => pkgLevel === level)
        .map(([pkgName]) => pkgName);

      if (packagesAtLevel.length === 0) continue;

      // Group packages at this level into stages
      let currentStage: string[] = [];
      let currentMemory = 0;
      let stageId = stages.length + 1;

      for (const packageName of packagesAtLevel) {
        const pkg = dependencies.find((d) => d.name === packageName);
        if (!pkg) continue;

        if (
          currentMemory + pkg.estimatedMemoryUsage > this.config.maxMemoryPerStage ||
          currentStage.length >= this.config.maxPackagesPerStage
        ) {
          if (currentStage.length > 0) {
            stages.push(this.createStage(stageId++, currentStage, currentMemory, dependencies));
          }

          currentStage = [packageName];
          currentMemory = pkg.estimatedMemoryUsage;
        } else {
          currentStage.push(packageName);
          currentMemory += pkg.estimatedMemoryUsage;
        }
      }

      if (currentStage.length > 0) {
        stages.push(this.createStage(stageId, currentStage, currentMemory, dependencies));
      }
    }

    return this.addStageDependencies(stages, dependencies);
  }

  /**
   * Optimize stages prioritizing package size
   */
  private optimizeForSize(dependencies: PackageDependency[]): BuildStage[] {
    // Group packages by size categories
    const smallPackages = dependencies.filter((d) => d.estimatedMemoryUsage < 256);
    const mediumPackages = dependencies.filter(
      (d) => d.estimatedMemoryUsage >= 256 && d.estimatedMemoryUsage < 512
    );
    const largePackages = dependencies.filter((d) => d.estimatedMemoryUsage >= 512);

    const stages: BuildStage[] = [];
    let stageId = 1;

    // Process small packages first (can fit many in one stage)
    if (smallPackages.length > 0) {
      stages.push(...this.createStagesForPackageGroup(smallPackages, stageId));
      stageId = stages.length + 1;
    }

    // Process medium packages
    if (mediumPackages.length > 0) {
      stages.push(...this.createStagesForPackageGroup(mediumPackages, stageId));
      stageId = stages.length + 1;
    }

    // Process large packages (may need individual stages)
    if (largePackages.length > 0) {
      stages.push(...this.createStagesForPackageGroup(largePackages, stageId));
    }

    return this.addStageDependencies(stages, dependencies);
  }

  /**
   * Balanced optimization considering both memory and dependencies
   */
  private optimizeBalanced(dependencies: PackageDependency[]): BuildStage[] {
    const dependencyLevels = this.calculateDependencyLevels(dependencies);
    const stages: BuildStage[] = [];

    const maxLevel = Math.max(...Array.from(dependencyLevels.values()));

    for (let level = 0; level <= maxLevel; level++) {
      const packagesAtLevel = Array.from(dependencyLevels.entries())
        .filter(([_, pkgLevel]) => pkgLevel === level)
        .map(([pkgName]) => pkgName);

      if (packagesAtLevel.length === 0) continue;

      // Sort packages at this level by memory usage for better packing
      const sortedPackages = packagesAtLevel
        .map((name) => dependencies.find((d) => d.name === name)!)
        .filter(Boolean)
        .sort((a, b) => a.estimatedMemoryUsage - b.estimatedMemoryUsage);

      stages.push(...this.createStagesForPackageGroup(sortedPackages, stages.length + 1));
    }

    return this.addStageDependencies(stages, dependencies);
  }

  /**
   * Calculate dependency levels for packages
   */
  private calculateDependencyLevels(dependencies: PackageDependency[]): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    const calculateLevel = (packageName: string): number => {
      if (visited.has(packageName)) {
        return levels.get(packageName) || 0;
      }

      visited.add(packageName);
      const pkg = dependencies.find((d) => d.name === packageName);
      if (!pkg) {
        levels.set(packageName, 0);
        return 0;
      }

      let maxDepLevel = -1;
      for (const depName of pkg.dependencies) {
        if (dependencies.some((d) => d.name === depName)) {
          const depLevel = calculateLevel(depName);
          maxDepLevel = Math.max(maxDepLevel, depLevel);
        }
      }

      const level = maxDepLevel + 1;
      levels.set(packageName, level);
      return level;
    };

    for (const pkg of dependencies) {
      calculateLevel(pkg.name);
    }

    return levels;
  }

  /**
   * Create stages for a group of packages
   */
  private createStagesForPackageGroup(
    packages: PackageDependency[],
    startingStageId: number
  ): BuildStage[] {
    const stages: BuildStage[] = [];
    let currentStage: string[] = [];
    let currentMemory = 0;
    let stageId = startingStageId;

    for (const pkg of packages) {
      if (
        currentMemory + pkg.estimatedMemoryUsage > this.config.maxMemoryPerStage ||
        currentStage.length >= this.config.maxPackagesPerStage
      ) {
        if (currentStage.length > 0) {
          stages.push(this.createStage(stageId++, currentStage, currentMemory, packages));
        }

        currentStage = [pkg.name];
        currentMemory = pkg.estimatedMemoryUsage;
      } else {
        currentStage.push(pkg.name);
        currentMemory += pkg.estimatedMemoryUsage;
      }
    }

    if (currentStage.length > 0) {
      stages.push(this.createStage(stageId, currentStage, currentMemory, packages));
    }

    return stages;
  }

  /**
   * Create a build stage
   */
  private createStage(
    stageId: number,
    packages: string[],
    memoryUsage: number,
    allDependencies: PackageDependency[]
  ): BuildStage {
    return {
      id: `stage-${stageId}`,
      packages: [...packages],
      estimatedMemoryUsage: memoryUsage,
      dependencies: [], // Will be set by addStageDependencies
      parallelizable: this.canRunInParallel(packages, allDependencies),
    };
  }

  /**
   * Add stage dependencies based on package dependencies
   */
  private addStageDependencies(
    stages: BuildStage[],
    dependencies: PackageDependency[]
  ): BuildStage[] {
    const packageToStage = new Map<string, string>();

    // Map packages to their stages
    for (const stage of stages) {
      for (const packageName of stage.packages) {
        packageToStage.set(packageName, stage.id);
      }
    }

    // Calculate stage dependencies
    for (const stage of stages) {
      const stageDeps = new Set<string>();

      for (const packageName of stage.packages) {
        const pkg = dependencies.find((d) => d.name === packageName);
        if (!pkg) continue;

        for (const depName of pkg.dependencies) {
          const depStage = packageToStage.get(depName);
          if (depStage && depStage !== stage.id) {
            stageDeps.add(depStage);
          }
        }
      }

      stage.dependencies = Array.from(stageDeps);
    }

    return stages;
  }

  /**
   * Check if packages can run in parallel
   */
  private canRunInParallel(packages: string[], dependencies: PackageDependency[]): boolean {
    for (let i = 0; i < packages.length; i++) {
      for (let j = i + 1; j < packages.length; j++) {
        const pkg1 = dependencies.find((d) => d.name === packages[i]);
        const pkg2 = dependencies.find((d) => d.name === packages[j]);

        if (!pkg1 || !pkg2) continue;

        // Check if either package depends on the other
        if (pkg1.dependencies.includes(packages[j]) || pkg2.dependencies.includes(packages[i])) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Split an oversized stage into smaller stages
   */
  private splitOversizedStage(stage: BuildStage): BuildStage[] {
    const stages: BuildStage[] = [];
    const packages = [...stage.packages];
    let currentStage: string[] = [];
    let currentMemory = 0;
    let stageId = 1;

    // Estimate memory per package
    const avgMemoryPerPackage = stage.estimatedMemoryUsage / stage.packages.length;

    for (const packageName of packages) {
      if (
        currentMemory + avgMemoryPerPackage > this.config.maxMemoryPerStage ||
        currentStage.length >= this.config.maxPackagesPerStage
      ) {
        if (currentStage.length > 0) {
          stages.push({
            id: `${stage.id}-split-${stageId++}`,
            packages: [...currentStage],
            estimatedMemoryUsage: currentMemory,
            dependencies: [...stage.dependencies],
            parallelizable: stage.parallelizable,
          });
        }

        currentStage = [packageName];
        currentMemory = avgMemoryPerPackage;
      } else {
        currentStage.push(packageName);
        currentMemory += avgMemoryPerPackage;
      }
    }

    if (currentStage.length > 0) {
      stages.push({
        id: `${stage.id}-split-${stageId}`,
        packages: [...currentStage],
        estimatedMemoryUsage: currentMemory,
        dependencies: [...stage.dependencies],
        parallelizable: stage.parallelizable,
      });
    }

    return stages;
  }
}
