/**
 * Core interfaces for build optimization system
 */

import {
  BuildEventCallback,
  BuildEventData,
  BuildResult,
  BuildStage,
  BuildStrategy,
  MemoryCallback,
  MemoryUsage,
  PackageDependency,
  SystemResources,
} from '../types/index.js';

/**
 * Interface for system resource detection
 */
export interface ISystemResourceDetector {
  /**
   * Get current system resources
   */
  getSystemResources(): Promise<SystemResources>;

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemoryUsage;

  /**
   * Check if system has sufficient resources for build
   */
  hasSufficientResources(requiredMemory: number): boolean;
}

/**
 * Interface for memory monitoring
 */
export interface IMemoryMonitor {
  /**
   * Start monitoring memory usage
   */
  startMonitoring(interval?: number): void;

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void;

  /**
   * Get current memory usage
   */
  getCurrentUsage(): MemoryUsage;

  /**
   * Set memory threshold percentage
   */
  setThreshold(percentage: number): void;

  /**
   * Register callback for threshold exceeded events
   */
  onThresholdExceeded(callback: MemoryCallback): void;

  /**
   * Clean up resources
   */
  cleanup(): void;
}

/**
 * Interface for dependency graph analysis
 */
export interface IDependencyGraphAnalyzer {
  /**
   * Analyze package dependencies
   */
  analyzeDependencies(workspaceRoot: string): Promise<PackageDependency[]>;

  /**
   * Create build stages from dependencies
   */
  createBuildStages(dependencies: PackageDependency[], stageSize: number): BuildStage[];

  /**
   * Get optimal build order
   */
  getOptimalBuildOrder(dependencies: PackageDependency[]): string[];

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(dependencies: PackageDependency[]): string[][];
}

/**
 * Interface for concurrency control
 */
export interface IConcurrencyController {
  /**
   * Get current concurrency level
   */
  getCurrentConcurrency(): number;

  /**
   * Set maximum concurrency
   */
  setMaxConcurrency(max: number): void;

  /**
   * Adjust concurrency based on memory usage
   */
  adjustConcurrency(memoryUsage: MemoryUsage): void;

  /**
   * Calculate optimal initial concurrency
   */
  calculateOptimalConcurrency(systemResources: SystemResources): number;

  /**
   * Reset concurrency to default
   */
  resetConcurrency(): void;
}

/**
 * Interface for TypeScript compilation management
 */
export interface ITypeScriptCompilationManager {
  /**
   * Compile TypeScript projects with optimization
   */
  compileProjects(projects: string[], options?: any): Promise<boolean>;

  /**
   * Enable incremental compilation
   */
  enableIncrementalCompilation(enabled: boolean): void;

  /**
   * Clean up TypeScript compiler memory
   */
  cleanupCompilerMemory(): void;

  /**
   * Get compilation metrics
   */
  getCompilationMetrics(): any;
}

/**
 * Interface for build orchestration
 */
export interface IBuildOrchestrator {
  /**
   * Execute build with specified strategy
   */
  executeBuild(strategy: BuildStrategy): Promise<BuildResult>;

  /**
   * Determine optimal build strategy
   */
  determineOptimalStrategy(systemResources: SystemResources): BuildStrategy;

  /**
   * Monitor and adjust build process
   */
  monitorAndAdjust(): void;

  /**
   * Register build event callback
   */
  onBuildEvent(callback: BuildEventCallback): void;

  /**
   * Stop build process
   */
  stopBuild(): void;
}

/**
 * Interface for build metrics collection
 */
export interface IBuildMetricsCollector {
  /**
   * Start collecting metrics
   */
  startCollection(): void;

  /**
   * Stop collecting metrics
   */
  stopCollection(): void;

  /**
   * Record build event
   */
  recordEvent(event: BuildEventData): void;

  /**
   * Get collected metrics
   */
  getMetrics(): any;

  /**
   * Reset metrics
   */
  resetMetrics(): void;
}

/**
 * Interface for SkIDEancer IDE build management
 */
export interface ISkIDEancerBuilder {
  /**
   * Build SkIDEancer IDE with yarn
   */
  buildSkIDEancer(): Promise<boolean>;

  /**
   * Check if SkIDEancer build is required
   */
  isSkIDEancerBuildRequired(): Promise<boolean>;

  /**
   * Get SkIDEancer build status
   */
  getSkIDEancerBuildStatus(): Promise<'not-built' | 'building' | 'built' | 'failed'>;

  /**
   * Cleanup after SkIDEancer build
   */
  cleanupAfterSkIDEancerBuild(): Promise<void>;

  /**
   * Get SkIDEancer build metrics
   */
  getSkIDEancerBuildMetrics(): any;
}

/**
 * Interface for monorepo package management
 */
export interface IMonorepoManager {
  /**
   * Discover all packages in monorepo
   */
  discoverPackages(): Promise<string[]>;

  /**
   * Get package build order based on dependencies
   */
  getPackageBuildOrder(): Promise<string[]>;

  /**
   * Group packages into memory-efficient stages
   */
  createPackageStages(packages: string[], stageSize: number): string[][];

  /**
   * Identify heavy packages that need special handling
   */
  identifyHeavyPackages(): Promise<string[]>;

  /**
   * Get package metadata (dependencies, size, etc.)
   */
  getPackageMetadata(packageName: string): Promise<any>;
}

/**
 * Interface for enhanced build orchestration with monorepo support
 */
export interface IEnhancedBuildOrchestrator extends IBuildOrchestrator {
  /**
   * Execute monorepo build with SkIDEancer pre-build
   */
  executeMonorepoBuild(): Promise<BuildResult>;

  /**
   * Handle SkIDEancer pre-build process
   */
  handleSkIDEancerBuild(): Promise<boolean>;

  /**
   * Execute staged package builds
   */
  executeStagedBuilds(stages: string[][]): Promise<BuildResult>;

  /**
   * Monitor memory during large monorepo builds
   */
  monitorMonorepoBuild(): void;

  /**
   * Adjust strategy based on monorepo size and memory constraints
   */
  adjustForMonorepo(): void;
}
