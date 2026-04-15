/**
 * Dependency Graph Analyzer for build optimization
 * 
 * This class analyzes package dependencies across a workspace to determine
 * optimal build order and create memory-efficient build stages.
 */

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { glob } from 'glob';
import { IDependencyGraphAnalyzer } from '../interfaces/index.js';
import { PackageDependency, BuildStage } from '../types/index.js';

/**
 * Node in the dependency graph
 */
interface DependencyNode {
  name: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  level: number;
  estimatedMemoryUsage: number;
}

/**
 * Package.json structure
 */
interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

/**
 * Analyzes package dependencies and creates optimized build stages
 */
export class DependencyGraphAnalyzer implements IDependencyGraphAnalyzer {
  private workspaceRoot: string;
  private packageCache = new Map<string, PackageJson>();
  private dependencyGraph = new Map<string, DependencyNode>();

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = resolve(workspaceRoot);
  }

  /**
   * Analyze package dependencies across the workspace
   */
  async analyzeDependencies(workspaceRoot?: string): Promise<PackageDependency[]> {
    if (workspaceRoot) {
      this.workspaceRoot = resolve(workspaceRoot);
    }

    const packagePaths = await this.findPackageJsonFiles();
    const packages: PackageDependency[] = [];

    // Parse all package.json files
    for (const packagePath of packagePaths) {
      try {
        const packageInfo = await this.parsePackageJson(packagePath);
        if (packageInfo) {
          const dependency: PackageDependency = {
            name: packageInfo.name,
            path: packagePath,
            dependencies: Object.keys(packageInfo.dependencies || {}),
            devDependencies: Object.keys(packageInfo.devDependencies || {}),
            estimatedMemoryUsage: this.estimatePackageMemoryUsage(packageInfo)
          };
          packages.push(dependency);
        }
      } catch (error) {
        console.warn(`Failed to parse package.json at ${packagePath}:`, error);
      }
    }

    // Build dependency graph
    this.buildDependencyGraph(packages);

    return packages;
  }

  /**
   * Create build stages from analyzed dependencies
   */
  createBuildStages(dependencies: PackageDependency[], stageSize: number = 5): BuildStage[] {
    // Build dependency graph first
    this.buildDependencyGraph(dependencies);
    
    // Group packages by dependency level
    const packagesByLevel = new Map<number, string[]>();
    
    for (const [packageName, node] of this.dependencyGraph) {
      const level = node.level;
      if (!packagesByLevel.has(level)) {
        packagesByLevel.set(level, []);
      }
      packagesByLevel.get(level)!.push(packageName);
    }

    // Create stages from levels
    const stages: BuildStage[] = [];
    const sortedLevels = Array.from(packagesByLevel.keys()).sort((a, b) => a - b);
    
    for (const level of sortedLevels) {
      const packagesAtLevel = packagesByLevel.get(level) || [];
      
      // Split packages at this level into multiple stages if needed
      let currentStage: string[] = [];
      let currentMemoryUsage = 0;
      let stageId = stages.length + 1;

      for (const packageName of packagesAtLevel) {
        const pkg = dependencies.find(d => d.name === packageName);
        if (!pkg) continue;

        // Check if adding this package would exceed stage size or memory limits
        const wouldExceedSize = currentStage.length >= stageSize;
        const wouldExceedMemory = currentMemoryUsage + pkg.estimatedMemoryUsage > 2048; // 2GB limit per stage

        if (wouldExceedSize || wouldExceedMemory) {
          // Finalize current stage
          if (currentStage.length > 0) {
            stages.push({
              id: `stage-${stageId}`,
              packages: [...currentStage],
              estimatedMemoryUsage: currentMemoryUsage,
              dependencies: this.getPreviousStageDependencies(stages),
              parallelizable: this.canRunInParallel(currentStage, dependencies)
            });
            stageId = stages.length + 1;
          }

          // Start new stage
          currentStage = [packageName];
          currentMemoryUsage = pkg.estimatedMemoryUsage;
        } else {
          // Add to current stage
          currentStage.push(packageName);
          currentMemoryUsage += pkg.estimatedMemoryUsage;
        }
      }

      // Add final stage for this level if not empty
      if (currentStage.length > 0) {
        stages.push({
          id: `stage-${stageId}`,
          packages: [...currentStage],
          estimatedMemoryUsage: currentMemoryUsage,
          dependencies: this.getPreviousStageDependencies(stages),
          parallelizable: this.canRunInParallel(currentStage, dependencies)
        });
      }
    }

    return stages;
  }

  /**
   * Get optimal build order using topological sort
   */
  getOptimalBuildOrder(dependencies: PackageDependency[]): string[] {
    this.buildDependencyGraph(dependencies);
    return this.topologicalSort();
  }

  /**
   * Detect circular dependencies in the package graph
   */
  detectCircularDependencies(dependencies: PackageDependency[]): string[][] {
    this.buildDependencyGraph(dependencies);
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(node));
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const nodeData = this.dependencyGraph.get(node);
      if (nodeData) {
        for (const dependency of nodeData.dependencies) {
          dfs(dependency, [...path]);
        }
      }

      recursionStack.delete(node);
      path.pop();
    };

    for (const [nodeName] of this.dependencyGraph) {
      if (!visited.has(nodeName)) {
        dfs(nodeName, []);
      }
    }

    return cycles;
  }

  /**
   * Find all package.json files in the workspace
   */
  private async findPackageJsonFiles(): Promise<string[]> {
    const patterns = [
      'package.json',
      'packages/*/package.json',
      'apps/*/package.json',
      'libs/*/package.json',
      'tools/*/package.json'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { 
        cwd: this.workspaceRoot,
        absolute: true 
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Parse a package.json file
   */
  private async parsePackageJson(packagePath: string): Promise<PackageJson | null> {
    try {
      const content = await readFile(packagePath, 'utf-8');
      const packageJson: PackageJson = JSON.parse(content);
      
      if (!packageJson.name) {
        return null; // Skip packages without names
      }

      this.packageCache.set(packageJson.name, packageJson);
      return packageJson;
    } catch (error) {
      console.warn(`Failed to parse ${packagePath}:`, error);
      return null;
    }
  }

  /**
   * Build the dependency graph from package dependencies
   */
  private buildDependencyGraph(dependencies: PackageDependency[]): void {
    this.dependencyGraph.clear();

    // Initialize nodes
    for (const pkg of dependencies) {
      this.dependencyGraph.set(pkg.name, {
        name: pkg.name,
        dependencies: new Set(),
        dependents: new Set(),
        level: 0,
        estimatedMemoryUsage: pkg.estimatedMemoryUsage
      });
    }

    // Build dependency relationships
    for (const pkg of dependencies) {
      const node = this.dependencyGraph.get(pkg.name);
      if (!node) continue;

      // Add internal workspace dependencies only
      for (const depName of pkg.dependencies) {
        if (this.dependencyGraph.has(depName)) {
          node.dependencies.add(depName);
          const depNode = this.dependencyGraph.get(depName);
          if (depNode) {
            depNode.dependents.add(pkg.name);
          }
        }
      }
    }

    // Calculate dependency levels
    this.calculateDependencyLevels();
  }

  /**
   * Calculate dependency levels for each package
   */
  private calculateDependencyLevels(): void {
    const visited = new Set<string>();
    
    const calculateLevel = (nodeName: string): number => {
      if (visited.has(nodeName)) {
        return this.dependencyGraph.get(nodeName)?.level || 0;
      }

      visited.add(nodeName);
      const node = this.dependencyGraph.get(nodeName);
      if (!node) return 0;

      let maxDepLevel = -1;
      for (const depName of node.dependencies) {
        const depLevel = calculateLevel(depName);
        maxDepLevel = Math.max(maxDepLevel, depLevel);
      }

      node.level = maxDepLevel + 1;
      return node.level;
    };

    for (const [nodeName] of this.dependencyGraph) {
      calculateLevel(nodeName);
    }
  }

  /**
   * Perform topological sort to get build order
   */
  private topologicalSort(): string[] {
    const result: string[] = [];
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degrees
    for (const [nodeName, node] of this.dependencyGraph) {
      inDegree.set(nodeName, node.dependencies.size);
      if (node.dependencies.size === 0) {
        queue.push(nodeName);
      }
    }

    // Process nodes with no dependencies first
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const currentNode = this.dependencyGraph.get(current);
      if (currentNode) {
        for (const dependent of currentNode.dependents) {
          const currentInDegree = inDegree.get(dependent) || 0;
          const newInDegree = currentInDegree - 1;
          inDegree.set(dependent, newInDegree);

          if (newInDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    return result;
  }

  /**
   * Check if packages in a stage can run in parallel
   */
  private canRunInParallel(packages: string[], dependencies: PackageDependency[]): boolean {
    // Check if any package in the stage depends on another package in the same stage
    for (const pkg1 of packages) {
      const pkg1Info = dependencies.find(d => d.name === pkg1);
      if (!pkg1Info) continue;

      for (const pkg2 of packages) {
        if (pkg1 === pkg2) continue;
        
        // Check if pkg1 depends on pkg2
        if (pkg1Info.dependencies.includes(pkg2)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get dependencies for the current stage based on previous stages
   */
  private getPreviousStageDependencies(existingStages: BuildStage[]): string[] {
    if (existingStages.length === 0) {
      return [];
    }
    
    // For simplicity, depend on the last stage
    // In a more complex implementation, we could analyze actual dependencies
    const lastStage = existingStages[existingStages.length - 1];
    return [lastStage.id];
  }

  /**
   * Estimate memory usage for a package based on its characteristics
   */
  private estimatePackageMemoryUsage(packageJson: PackageJson): number {
    let baseMemory = 128; // Base memory in MB

    // Increase memory estimate based on dependencies
    const totalDeps = Object.keys(packageJson.dependencies || {}).length +
                     Object.keys(packageJson.devDependencies || {}).length;
    
    baseMemory += totalDeps * 2; // 2MB per dependency

    // Special handling for known heavy packages
    const heavyPackages = ['typescript', 'webpack', 'rollup', 'vite', 'next', 'react'];
    const deps = Object.keys(packageJson.dependencies || {});
    
    for (const heavyPkg of heavyPackages) {
      if (deps.some(dep => dep.includes(heavyPkg))) {
        baseMemory += 256; // Add 256MB for heavy packages
      }
    }

    // Cap at reasonable maximum
    return Math.min(baseMemory, 1024); // Max 1GB per package
  }
}