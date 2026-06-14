/**
 * Build Stage Optimizer
 *
 * Optimizes build stages for memory efficiency by analyzing package characteristics,
 * memory usage patterns, and dependency relationships to create optimal build stages.
 */
/**
 * Optimizes build stages for memory efficiency and performance
 */
export class BuildStageOptimizer {
    config;
    constructor(config = {}) {
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
    optimizeBuildStages(dependencies, strategy = 'balanced') {
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
    estimateStageMemoryUsage(packages, dependencies) {
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
    optimizeStageMemoryUsage(stages) {
        const optimizedStages = [];
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
    calculateOptimizationMetrics(stages, originalDependencies) {
        const totalMemory = stages.reduce((sum, stage) => sum + stage.estimatedMemoryUsage, 0);
        const averageMemory = totalMemory / stages.length;
        const peakMemory = Math.max(...stages.map((stage) => stage.estimatedMemoryUsage));
        // Calculate memory utilization efficiency
        const targetMemory = this.config.maxMemoryPerStage * (this.config.targetMemoryUtilization / 100);
        const memoryEfficiency = Math.min(100, (averageMemory / targetMemory) * 100);
        // Estimate build time reduction (simplified calculation)
        const originalBuildTime = originalDependencies.length * 60; // Assume 60s per package sequentially
        const optimizedBuildTime = stages.length * 120; // Assume 120s per stage with parallelization
        const buildTimeReduction = Math.max(0, ((originalBuildTime - optimizedBuildTime) / originalBuildTime) * 100);
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
    detectCircularDependencies(dependencies) {
        const graph = new Map();
        const cycles = [];
        // Build adjacency list
        for (const pkg of dependencies) {
            graph.set(pkg.name, new Set(pkg.dependencies.filter((dep) => dependencies.some((d) => d.name === dep))));
        }
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (node, path) => {
            if (recursionStack.has(node)) {
                const cycleStart = path.indexOf(node);
                if (cycleStart !== -1) {
                    cycles.push(path.slice(cycleStart).concat(node));
                }
                return;
            }
            if (visited.has(node))
                return;
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
    breakCircularDependencies(dependencies, cycles) {
        const modifiedDeps = dependencies.map((dep) => ({
            ...dep,
            dependencies: [...dep.dependencies],
        }));
        for (const cycle of cycles) {
            if (cycle.length < 2)
                continue;
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
    optimizeForMemory(dependencies) {
        // Sort packages by memory usage (ascending)
        const sortedPackages = [...dependencies].sort((a, b) => a.estimatedMemoryUsage - b.estimatedMemoryUsage);
        const stages = [];
        let currentStage = [];
        let currentMemory = 0;
        let stageId = 1;
        for (const pkg of sortedPackages) {
            if (currentMemory + pkg.estimatedMemoryUsage > this.config.maxMemoryPerStage ||
                currentStage.length >= this.config.maxPackagesPerStage) {
                if (currentStage.length > 0) {
                    stages.push(this.createStage(stageId++, currentStage, currentMemory, dependencies));
                }
                currentStage = [pkg.name];
                currentMemory = pkg.estimatedMemoryUsage;
            }
            else {
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
    optimizeForDependencies(dependencies) {
        const dependencyLevels = this.calculateDependencyLevels(dependencies);
        const stages = [];
        const maxLevel = Math.max(...Array.from(dependencyLevels.values()));
        for (let level = 0; level <= maxLevel; level++) {
            const packagesAtLevel = Array.from(dependencyLevels.entries())
                .filter(([_, pkgLevel]) => pkgLevel === level)
                .map(([pkgName]) => pkgName);
            if (packagesAtLevel.length === 0)
                continue;
            // Group packages at this level into stages
            let currentStage = [];
            let currentMemory = 0;
            let stageId = stages.length + 1;
            for (const packageName of packagesAtLevel) {
                const pkg = dependencies.find((d) => d.name === packageName);
                if (!pkg)
                    continue;
                if (currentMemory + pkg.estimatedMemoryUsage > this.config.maxMemoryPerStage ||
                    currentStage.length >= this.config.maxPackagesPerStage) {
                    if (currentStage.length > 0) {
                        stages.push(this.createStage(stageId++, currentStage, currentMemory, dependencies));
                    }
                    currentStage = [packageName];
                    currentMemory = pkg.estimatedMemoryUsage;
                }
                else {
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
    optimizeForSize(dependencies) {
        // Group packages by size categories
        const smallPackages = dependencies.filter((d) => d.estimatedMemoryUsage < 256);
        const mediumPackages = dependencies.filter((d) => d.estimatedMemoryUsage >= 256 && d.estimatedMemoryUsage < 512);
        const largePackages = dependencies.filter((d) => d.estimatedMemoryUsage >= 512);
        const stages = [];
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
    optimizeBalanced(dependencies) {
        const dependencyLevels = this.calculateDependencyLevels(dependencies);
        const stages = [];
        const maxLevel = Math.max(...Array.from(dependencyLevels.values()));
        for (let level = 0; level <= maxLevel; level++) {
            const packagesAtLevel = Array.from(dependencyLevels.entries())
                .filter(([_, pkgLevel]) => pkgLevel === level)
                .map(([pkgName]) => pkgName);
            if (packagesAtLevel.length === 0)
                continue;
            // Sort packages at this level by memory usage for better packing
            const sortedPackages = packagesAtLevel
                .map((name) => dependencies.find((d) => d.name === name))
                .filter(Boolean)
                .sort((a, b) => a.estimatedMemoryUsage - b.estimatedMemoryUsage);
            stages.push(...this.createStagesForPackageGroup(sortedPackages, stages.length + 1));
        }
        return this.addStageDependencies(stages, dependencies);
    }
    /**
     * Calculate dependency levels for packages
     */
    calculateDependencyLevels(dependencies) {
        const levels = new Map();
        const visited = new Set();
        const calculateLevel = (packageName) => {
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
    createStagesForPackageGroup(packages, startingStageId) {
        const stages = [];
        let currentStage = [];
        let currentMemory = 0;
        let stageId = startingStageId;
        for (const pkg of packages) {
            if (currentMemory + pkg.estimatedMemoryUsage > this.config.maxMemoryPerStage ||
                currentStage.length >= this.config.maxPackagesPerStage) {
                if (currentStage.length > 0) {
                    stages.push(this.createStage(stageId++, currentStage, currentMemory, packages));
                }
                currentStage = [pkg.name];
                currentMemory = pkg.estimatedMemoryUsage;
            }
            else {
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
    createStage(stageId, packages, memoryUsage, allDependencies) {
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
    addStageDependencies(stages, dependencies) {
        const packageToStage = new Map();
        // Map packages to their stages
        for (const stage of stages) {
            for (const packageName of stage.packages) {
                packageToStage.set(packageName, stage.id);
            }
        }
        // Calculate stage dependencies
        for (const stage of stages) {
            const stageDeps = new Set();
            for (const packageName of stage.packages) {
                const pkg = dependencies.find((d) => d.name === packageName);
                if (!pkg)
                    continue;
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
    canRunInParallel(packages, dependencies) {
        for (let i = 0; i < packages.length; i++) {
            for (let j = i + 1; j < packages.length; j++) {
                const pkg1 = dependencies.find((d) => d.name === packages[i]);
                const pkg2 = dependencies.find((d) => d.name === packages[j]);
                if (!pkg1 || !pkg2)
                    continue;
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
    splitOversizedStage(stage) {
        const stages = [];
        const packages = [...stage.packages];
        let currentStage = [];
        let currentMemory = 0;
        let stageId = 1;
        // Estimate memory per package
        const avgMemoryPerPackage = stage.estimatedMemoryUsage / stage.packages.length;
        for (const packageName of packages) {
            if (currentMemory + avgMemoryPerPackage > this.config.maxMemoryPerStage ||
                currentStage.length >= this.config.maxPackagesPerStage) {
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
            }
            else {
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
//# sourceMappingURL=BuildStageOptimizer.js.map