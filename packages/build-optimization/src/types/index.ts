/**
 * Core types for build optimization system
 */

/**
 * System resource information
 */
export interface SystemResources {
  /** Total system memory in MB */
  totalMemory: number;
  /** Available system memory in MB */
  availableMemory: number;
  /** Number of CPU cores */
  cpuCores: number;
  /** Operating system platform */
  platform: string;
  /** Node.js version */
  nodeVersion: string;
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
  /** Current memory usage in MB */
  current: number;
  /** Peak memory usage in MB */
  peak: number;
  /** Memory usage as percentage of total */
  percentage: number;
  /** Timestamp of measurement */
  timestamp: number;
}

/**
 * Build strategy configuration
 */
export interface BuildStrategy {
  /** Maximum number of concurrent build processes */
  maxConcurrency: number;
  /** Memory threshold percentage (0-100) */
  memoryThreshold: number;
  /** Number of packages per build stage */
  stageSize: number;
  /** Enable incremental builds */
  enableIncremental: boolean;
  /** Clean up memory between stages */
  cleanupBetweenStages: boolean;
}

/**
 * Build configuration options
 */
export interface BuildConfiguration {
  /** Build strategy type */
  strategy: 'development' | 'production' | 'memory-optimized';
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  /** Maximum concurrency level */
  maxConcurrency: number;
  /** Enable incremental builds */
  enableIncrementalBuilds: boolean;
  /** Enable stage cleanup */
  stageCleanup: boolean;
  /** Memory monitoring interval in milliseconds */
  monitoringInterval: number;
}

/**
 * Build stage definition
 */
export interface BuildStage {
  /** Unique stage identifier */
  id: string;
  /** Packages to build in this stage */
  packages: string[];
  /** Estimated memory usage in MB */
  estimatedMemoryUsage: number;
  /** Dependencies on previous stages */
  dependencies: string[];
  /** Whether packages in this stage can be built in parallel */
  parallelizable: boolean;
}

/**
 * Build result information
 */
export interface BuildResult {
  /** Whether the build was successful */
  success: boolean;
  /** Build duration in milliseconds */
  duration: number;
  /** Peak memory usage during build */
  peakMemoryUsage: number;
  /** Number of packages built */
  packagesBuilt: number;
  /** Error message if build failed */
  error?: string;
  /** Detailed build metrics */
  metrics: BuildMetrics;
}

/**
 * Build metrics and statistics
 */
export interface BuildMetrics {
  /** Total build time in milliseconds */
  totalBuildTime: number;
  /** Peak memory usage in MB */
  peakMemoryUsage: number;
  /** Average memory usage in MB */
  averageMemoryUsage: number;
  /** Number of build stages executed */
  stagesExecuted: number;
  /** Number of packages successfully built */
  successfulBuilds: number;
  /** Number of failed builds */
  failedBuilds: number;
  /** Memory usage history */
  memoryHistory: MemoryUsage[];
}

/**
 * Package dependency information
 */
export interface PackageDependency {
  /** Package name */
  name: string;
  /** Package path */
  path: string;
  /** Direct dependencies */
  dependencies: string[];
  /** Development dependencies */
  devDependencies: string[];
  /** Estimated build memory usage in MB */
  estimatedMemoryUsage: number;
}

/**
 * Build event types
 */
export type BuildEvent = 
  | 'build-started'
  | 'build-completed'
  | 'build-failed'
  | 'stage-started'
  | 'stage-completed'
  | 'memory-threshold-exceeded'
  | 'concurrency-adjusted';

/**
 * Build event data
 */
export interface BuildEventData {
  /** Event type */
  type: BuildEvent;
  /** Event timestamp */
  timestamp: number;
  /** Event payload */
  payload: any;
}

/**
 * Memory monitor callback function
 */
export type MemoryCallback = (usage: MemoryUsage) => void;

/**
 * Build event callback function
 */
export type BuildEventCallback = (event: BuildEventData) => void;

/**
 * SkIDEancer IDE specific configuration
 */
export interface SkIDEancerConfiguration {
  /** Whether SkIDEancer should be built first */
  buildFirst: boolean;
  /** Estimated memory usage for SkIDEancer build in MB */
  estimatedMemoryUsage: number;
  /** Whether to cleanup after SkIDEancer build */
  cleanupAfterBuild: boolean;
  /** Yarn command to use for SkIDEancer build */
  yarnCommand?: string;
  /** Build directory for SkIDEancer */
  buildDirectory?: string;
}

/**
 * Monorepo specific configuration
 */
export interface MonorepoConfiguration {
  /** Total number of packages in monorepo */
  totalPackages: number;
  /** Packages that should be built first (dependencies) */
  priorityPackages: string[];
  /** Packages that require more memory */
  heavyPackages: string[];
  /** Maximum packages per build stage */
  maxPackagesPerStage: number;
  /** Workspace root directory */
  workspaceRoot?: string;
  /** Package manager (bun, npm, yarn) */
  packageManager?: 'bun' | 'npm' | 'yarn';
}

/**
 * Build environment type
 */
export type BuildEnvironment = 'development' | 'production' | 'ci' | 'local';

/**
 * Enhanced build configuration with monorepo support
 */
export interface EnhancedBuildConfiguration extends BuildConfiguration {
  /** Build environment */
  environment: BuildEnvironment;
  /** SkIDEancer IDE configuration */
  ideConfig?: SkIDEancerConfiguration;
  /** Monorepo specific settings */
  monorepoConfig?: MonorepoConfiguration;
  /** Whether to force memory optimization regardless of environment */
  forceMemoryOptimization: boolean;
}