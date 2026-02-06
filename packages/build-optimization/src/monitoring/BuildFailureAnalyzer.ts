/**
 * Build failure analysis and recommendation system
 */

import { EventEmitter } from 'events';
import { BuildResult, MemoryUsage, SystemResources } from '../types/index.js';
import { DetailedBuildMetrics } from './BuildMetricsCollector.js';

/**
 * Types of build failures
 */
export type FailureType =
  | 'memory-exhaustion'
  | 'compilation-error'
  | 'dependency-error'
  | 'timeout'
  | 'system-resource'
  | 'configuration-error'
  | 'unknown';

/**
 * Build failure analysis result
 */
export interface FailureAnalysis {
  /** Type of failure detected */
  type: FailureType;
  /** Confidence level (0-100) */
  confidence: number;
  /** Detailed description of the failure */
  description: string;
  /** Root cause analysis */
  rootCause: string;
  /** Affected packages or components */
  affectedComponents: string[];
  /** Memory usage at time of failure */
  memoryAtFailure?: MemoryUsage;
  /** System resources at time of failure */
  systemResourcesAtFailure?: SystemResources;
}

/**
 * Build optimization recommendation
 */
export interface BuildRecommendation {
  /** Recommendation category */
  category: 'memory' | 'concurrency' | 'configuration' | 'system' | 'dependency';
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Short title of the recommendation */
  title: string;
  /** Detailed description */
  description: string;
  /** Specific actions to take */
  actions: string[];
  /** Expected impact */
  expectedImpact: string;
  /** Configuration changes needed */
  configChanges?: Record<string, any>;
}

/**
 * Failure pattern for pattern matching
 */
interface FailurePattern {
  /** Pattern identifier */
  id: string;
  /** Error message patterns to match */
  errorPatterns: RegExp[];
  /** Memory usage patterns */
  memoryPatterns?: {
    peakUsage?: number;
    rapidIncrease?: boolean;
    threshold?: number;
  };
  /** Event sequence patterns */
  eventPatterns?: string[];
  /** Failure type this pattern indicates */
  failureType: FailureType;
  /** Confidence level for this pattern */
  confidence: number;
}

/**
 * Build failure analyzer implementation
 */
export class BuildFailureAnalyzer extends EventEmitter {
  private readonly failurePatterns: FailurePattern[];
  private readonly analysisHistory: FailureAnalysis[] = [];
  private readonly recommendationCache = new Map<string, BuildRecommendation[]>();

  constructor() {
    super();
    this.failurePatterns = this.initializeFailurePatterns();
  }

  /**
   * Analyze build failure and generate recommendations
   */
  public async analyzeBuildFailure(
    buildResult: BuildResult,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources,
    errorLogs: string[] = []
  ): Promise<{
    analysis: FailureAnalysis;
    recommendations: BuildRecommendation[];
  }> {
    // Perform failure analysis
    const analysis = this.performFailureAnalysis(
      buildResult,
      buildMetrics,
      systemResources,
      errorLogs
    );

    // Generate recommendations based on analysis
    const recommendations = this.generateRecommendations(analysis, buildMetrics, systemResources);

    // Store analysis for pattern learning
    this.analysisHistory.push(analysis);

    // Emit analysis complete event
    this.emit('analysis-complete', { analysis, recommendations });

    return { analysis, recommendations };
  }

  /**
   * Analyze memory-related build issues
   */
  public analyzeMemoryIssues(
    memoryHistory: MemoryUsage[],
    systemResources: SystemResources
  ): BuildRecommendation[] {
    const recommendations: BuildRecommendation[] = [];

    if (memoryHistory.length === 0) {
      return recommendations;
    }

    const peakMemory = Math.max(...memoryHistory.map((m) => m.current));
    const avgMemory = memoryHistory.reduce((sum, m) => sum + m.current, 0) / memoryHistory.length;
    const memoryGrowthRate = this.calculateMemoryGrowthRate(memoryHistory);

    // High memory usage recommendation
    if (peakMemory > systemResources.totalMemory * 0.8) {
      recommendations.push({
        category: 'memory',
        priority: 'critical',
        title: 'Reduce Peak Memory Usage',
        description: `Peak memory usage (${peakMemory.toFixed(0)} MB) exceeded 80% of available memory (${systemResources.totalMemory} MB)`,
        actions: [
          'Reduce build concurrency to 1-2 processes',
          'Enable staged builds with memory cleanup',
          'Consider upgrading system memory',
          'Use incremental builds to reduce memory pressure',
        ],
        expectedImpact: 'Prevent out-of-memory errors and improve build stability',
        configChanges: {
          maxConcurrency: Math.max(1, Math.floor(systemResources.cpuCores / 4)),
          memoryThreshold: 70,
          cleanupBetweenStages: true,
        },
      });
    }

    // Memory leak detection
    if (memoryGrowthRate > 10) {
      // MB per minute
      recommendations.push({
        category: 'memory',
        priority: 'high',
        title: 'Potential Memory Leak Detected',
        description: `Memory usage is growing rapidly at ${memoryGrowthRate.toFixed(1)} MB/min`,
        actions: [
          'Enable garbage collection between build stages',
          'Reduce TypeScript compiler memory retention',
          'Monitor for memory leaks in build tools',
          'Use memory profiling tools to identify leaks',
        ],
        expectedImpact: 'Prevent memory exhaustion during long builds',
        configChanges: {
          cleanupBetweenStages: true,
          monitoringInterval: 500,
        },
      });
    }

    // Inefficient memory usage
    if (avgMemory > systemResources.totalMemory * 0.6) {
      recommendations.push({
        category: 'memory',
        priority: 'medium',
        title: 'Optimize Memory Efficiency',
        description: `Average memory usage (${avgMemory.toFixed(0)} MB) is high relative to available memory`,
        actions: [
          'Use memory-optimized TypeScript compiler options',
          'Enable incremental compilation',
          'Reduce concurrent build processes',
          'Consider using swap space for temporary relief',
        ],
        expectedImpact: 'Improve overall build performance and stability',
        configChanges: {
          strategy: 'memory-optimized',
          enableIncremental: true,
        },
      });
    }

    return recommendations;
  }

  /**
   * Generate system-specific recommendations
   */
  public generateSystemRecommendations(
    systemResources: SystemResources,
    buildMetrics: DetailedBuildMetrics
  ): BuildRecommendation[] {
    const recommendations: BuildRecommendation[] = [];

    // Low memory system recommendations
    if (systemResources.totalMemory < 4096) {
      // Less than 4GB
      recommendations.push({
        category: 'system',
        priority: 'high',
        title: 'Low Memory System Optimization',
        description: `System has limited memory (${systemResources.totalMemory} MB). Aggressive optimization needed.`,
        actions: [
          'Use sequential builds (concurrency = 1)',
          'Enable aggressive memory cleanup',
          'Use incremental builds exclusively',
          'Consider adding swap space',
          'Close unnecessary applications during builds',
        ],
        expectedImpact: 'Enable builds on low-memory systems',
        configChanges: {
          maxConcurrency: 1,
          memoryThreshold: 60,
          strategy: 'memory-optimized',
          cleanupBetweenStages: true,
          enableIncremental: true,
        },
      });
    }

    // High-performance system recommendations
    if (systemResources.totalMemory > 16384 && systemResources.cpuCores >= 8) {
      recommendations.push({
        category: 'system',
        priority: 'low',
        title: 'High-Performance System Optimization',
        description:
          'System has abundant resources. Can optimize for speed over memory efficiency.',
        actions: [
          'Increase build concurrency',
          'Use performance-optimized strategy',
          'Enable parallel TypeScript compilation',
          'Consider using build caching',
        ],
        expectedImpact: 'Significantly faster build times',
        configChanges: {
          maxConcurrency: Math.min(systemResources.cpuCores, 8),
          strategy: 'production',
          memoryThreshold: 85,
        },
      });
    }

    // Platform-specific recommendations
    if (systemResources.platform === 'darwin') {
      recommendations.push({
        category: 'system',
        priority: 'medium',
        title: 'macOS-Specific Optimizations',
        description: 'Apply macOS-specific build optimizations',
        actions: [
          'Use native file system watching',
          'Optimize for APFS file system',
          'Consider using Rosetta 2 optimizations if on Apple Silicon',
        ],
        expectedImpact: 'Better performance on macOS systems',
      });
    }

    return recommendations;
  }

  /**
   * Get failure analysis history
   */
  public getAnalysisHistory(): FailureAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Clear analysis history
   */
  public clearHistory(): void {
    this.analysisHistory.length = 0;
    this.recommendationCache.clear();
  }

  /**
   * Generate detailed troubleshooting log
   */
  public generateTroubleshootingLog(
    analysis: FailureAnalysis,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): string {
    const timestamp = new Date().toISOString();

    let log = `
Build Failure Troubleshooting Log
Generated: ${timestamp}

FAILURE ANALYSIS
================
Type: ${analysis.type}
Confidence: ${analysis.confidence}%
Description: ${analysis.description}
Root Cause: ${analysis.rootCause}
Affected Components: ${analysis.affectedComponents.join(', ')}

SYSTEM INFORMATION
==================
Platform: ${systemResources.platform}
Total Memory: ${systemResources.totalMemory} MB
Available Memory: ${systemResources.availableMemory} MB
CPU Cores: ${systemResources.cpuCores}
Node Version: ${systemResources.nodeVersion}

BUILD METRICS
=============
Total Build Time: ${(buildMetrics.totalBuildTime / 1000).toFixed(2)}s
Peak Memory Usage: ${buildMetrics.peakMemoryUsage.toFixed(2)} MB
Average Memory Usage: ${buildMetrics.averageMemoryUsage.toFixed(2)} MB
Stages Executed: ${buildMetrics.stagesExecuted}
Successful Builds: ${buildMetrics.successfulBuilds}
Failed Builds: ${buildMetrics.failedBuilds}
Memory Violations: ${buildMetrics.performanceStats.memoryViolations}

MEMORY USAGE TIMELINE
=====================
`;

    // Add memory usage samples
    const samples = buildMetrics.memorySnapshots.slice(-10); // Last 10 samples
    samples.forEach((sample, index) => {
      const time = new Date(sample.timestamp).toLocaleTimeString();
      log += `${time}: ${sample.current.toFixed(1)} MB (${sample.percentage.toFixed(1)}%)\n`;
    });

    log += `
RECENT EVENTS
=============
`;

    // Add recent events
    const recentEvents = buildMetrics.events.slice(-20); // Last 20 events
    recentEvents.forEach((event) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      log += `${time}: ${event.type} - ${JSON.stringify(event.payload)}\n`;
    });

    if (analysis.memoryAtFailure) {
      log += `
MEMORY AT FAILURE
=================
Current: ${analysis.memoryAtFailure.current} MB
Peak: ${analysis.memoryAtFailure.peak} MB
Percentage: ${analysis.memoryAtFailure.percentage}%
Timestamp: ${new Date(analysis.memoryAtFailure.timestamp).toISOString()}
`;
    }

    return log;
  }

  /**
   * Perform failure analysis based on build data
   */
  private performFailureAnalysis(
    buildResult: BuildResult,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources,
    errorLogs: string[]
  ): FailureAnalysis {
    // Try to match against known failure patterns
    for (const pattern of this.failurePatterns) {
      if (this.matchesPattern(pattern, buildResult, buildMetrics, errorLogs)) {
        return this.createAnalysisFromPattern(pattern, buildResult, buildMetrics, systemResources);
      }
    }

    // Fallback to heuristic analysis
    return this.performHeuristicAnalysis(buildResult, buildMetrics, systemResources, errorLogs);
  }

  /**
   * Check if failure matches a known pattern
   */
  private matchesPattern(
    pattern: FailurePattern,
    buildResult: BuildResult,
    buildMetrics: DetailedBuildMetrics,
    errorLogs: string[]
  ): boolean {
    // Check error message patterns
    if (pattern.errorPatterns.length > 0) {
      const allErrors = [buildResult.error || '', ...errorLogs].join(' ');
      const hasMatchingError = pattern.errorPatterns.some((regex) => regex.test(allErrors));
      if (!hasMatchingError) return false;
    }

    // Check memory patterns
    if (pattern.memoryPatterns) {
      const { peakUsage, rapidIncrease, threshold } = pattern.memoryPatterns;

      if (peakUsage && buildMetrics.peakMemoryUsage < peakUsage) return false;
      if (threshold && buildMetrics.performanceStats.memoryViolations === 0) return false;
      if (rapidIncrease && this.calculateMemoryGrowthRate(buildMetrics.memorySnapshots) < 5)
        return false;
    }

    // Check event patterns
    if (pattern.eventPatterns) {
      const eventTypes = buildMetrics.events.map((e) => e.type);
      const hasEventPattern = pattern.eventPatterns.every((eventType) =>
        eventTypes.includes(eventType as any)
      );
      if (!hasEventPattern) return false;
    }

    return true;
  }

  /**
   * Create analysis from matched pattern
   */
  private createAnalysisFromPattern(
    pattern: FailurePattern,
    buildResult: BuildResult,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): FailureAnalysis {
    const failedStages = buildMetrics.stageMetrics.filter((s) => !s.success);
    const affectedComponents = failedStages.flatMap((s) => s.packages);

    return {
      type: pattern.failureType,
      confidence: pattern.confidence,
      description: this.getFailureDescription(pattern.failureType, buildResult, buildMetrics),
      rootCause: this.getRootCause(pattern.failureType, buildMetrics, systemResources),
      affectedComponents,
      memoryAtFailure: buildMetrics.memorySnapshots[buildMetrics.memorySnapshots.length - 1],
      systemResourcesAtFailure: systemResources,
    };
  }

  /**
   * Perform heuristic analysis when no pattern matches
   */
  private performHeuristicAnalysis(
    buildResult: BuildResult,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources,
    errorLogs: string[]
  ): FailureAnalysis {
    let failureType: FailureType = 'unknown';
    let confidence = 50;

    // Analyze memory usage
    if (buildMetrics.peakMemoryUsage > systemResources.totalMemory * 0.9) {
      failureType = 'memory-exhaustion';
      confidence = 90;
    } else if (buildMetrics.performanceStats.memoryViolations > 3) {
      failureType = 'memory-exhaustion';
      confidence = 75;
    }

    // Analyze error messages
    const allErrors = [buildResult.error || '', ...errorLogs].join(' ').toLowerCase();
    if (allErrors.includes('out of memory') || allErrors.includes('heap out of memory')) {
      failureType = 'memory-exhaustion';
      confidence = 95;
    } else if (allErrors.includes('timeout') || allErrors.includes('timed out')) {
      failureType = 'timeout';
      confidence = 80;
    } else if (allErrors.includes('cannot resolve') || allErrors.includes('module not found')) {
      failureType = 'dependency-error';
      confidence = 85;
    } else if (allErrors.includes('syntax error') || allErrors.includes('compilation error')) {
      failureType = 'compilation-error';
      confidence = 80;
    }

    const failedStages = buildMetrics.stageMetrics.filter((s) => !s.success);
    const affectedComponents = failedStages.flatMap((s) => s.packages);

    return {
      type: failureType,
      confidence,
      description: this.getFailureDescription(failureType, buildResult, buildMetrics),
      rootCause: this.getRootCause(failureType, buildMetrics, systemResources),
      affectedComponents,
      memoryAtFailure: buildMetrics.memorySnapshots[buildMetrics.memorySnapshots.length - 1],
      systemResourcesAtFailure: systemResources,
    };
  }

  /**
   * Generate recommendations based on failure analysis
   */
  private generateRecommendations(
    analysis: FailureAnalysis,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): BuildRecommendation[] {
    const cacheKey = `${analysis.type}-${analysis.confidence}`;
    if (this.recommendationCache.has(cacheKey)) {
      return this.recommendationCache.get(cacheKey)!;
    }

    const recommendations: BuildRecommendation[] = [];

    // Type-specific recommendations
    switch (analysis.type) {
      case 'memory-exhaustion':
        recommendations.push(
          ...this.getMemoryExhaustionRecommendations(buildMetrics, systemResources)
        );
        break;
      case 'compilation-error':
        recommendations.push(...this.getCompilationErrorRecommendations(analysis));
        break;
      case 'dependency-error':
        recommendations.push(...this.getDependencyErrorRecommendations(analysis));
        break;
      case 'timeout':
        recommendations.push(...this.getTimeoutRecommendations(buildMetrics, systemResources));
        break;
      case 'system-resource':
        recommendations.push(...this.getSystemResourceRecommendations(systemResources));
        break;
      default:
        recommendations.push(...this.getGenericRecommendations(buildMetrics, systemResources));
    }

    // Add memory-specific recommendations
    recommendations.push(
      ...this.analyzeMemoryIssues(buildMetrics.memorySnapshots, systemResources)
    );

    // Add system-specific recommendations
    recommendations.push(...this.generateSystemRecommendations(systemResources, buildMetrics));

    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.recommendationCache.set(cacheKey, recommendations);
    return recommendations;
  }

  /**
   * Initialize failure patterns for pattern matching
   */
  private initializeFailurePatterns(): FailurePattern[] {
    return [
      {
        id: 'memory-exhaustion-oom',
        errorPatterns: [
          /out of memory/i,
          /heap out of memory/i,
          /maximum heap size/i,
          /cannot allocate memory/i,
        ],
        memoryPatterns: {
          peakUsage: 1000,
          threshold: 80,
        },
        failureType: 'memory-exhaustion',
        confidence: 95,
      },
      {
        id: 'memory-exhaustion-threshold',
        errorPatterns: [],
        memoryPatterns: {
          rapidIncrease: true,
          threshold: 90,
        },
        eventPatterns: ['memory-threshold-exceeded'],
        failureType: 'memory-exhaustion',
        confidence: 85,
      },
      {
        id: 'typescript-compilation-error',
        errorPatterns: [
          /typescript error/i,
          /ts\(\d+\)/,
          /type.*error/i,
          /cannot find module.*\.ts/i,
        ],
        failureType: 'compilation-error',
        confidence: 90,
      },
      {
        id: 'dependency-resolution-error',
        errorPatterns: [
          /cannot resolve/i,
          /module not found/i,
          /dependency.*not found/i,
          /package.*does not exist/i,
        ],
        failureType: 'dependency-error',
        confidence: 85,
      },
      {
        id: 'build-timeout',
        errorPatterns: [/timeout/i, /timed out/i, /operation.*timeout/i],
        failureType: 'timeout',
        confidence: 80,
      },
    ];
  }

  /**
   * Calculate memory growth rate in MB per minute
   */
  private calculateMemoryGrowthRate(memoryHistory: MemoryUsage[]): number {
    if (memoryHistory.length < 2) return 0;

    const first = memoryHistory[0];
    const last = memoryHistory[memoryHistory.length - 1];
    const timeDiffMinutes = (last.timestamp - first.timestamp) / (1000 * 60);
    const memoryDiff = last.current - first.current;

    return timeDiffMinutes > 0 ? memoryDiff / timeDiffMinutes : 0;
  }

  /**
   * Get failure description based on type
   */
  private getFailureDescription(
    type: FailureType,
    buildResult: BuildResult,
    buildMetrics: DetailedBuildMetrics
  ): string {
    switch (type) {
      case 'memory-exhaustion':
        return `Build failed due to memory exhaustion. Peak usage: ${buildMetrics.peakMemoryUsage.toFixed(0)} MB`;
      case 'compilation-error':
        return `Build failed due to compilation errors in ${buildMetrics.failedBuilds} package(s)`;
      case 'dependency-error':
        return `Build failed due to dependency resolution issues`;
      case 'timeout':
        return `Build failed due to timeout after ${(buildMetrics.totalBuildTime / 1000).toFixed(0)} seconds`;
      case 'system-resource':
        return `Build failed due to insufficient system resources`;
      case 'configuration-error':
        return `Build failed due to configuration issues`;
      default:
        return buildResult.error || 'Build failed for unknown reasons';
    }
  }

  /**
   * Get root cause analysis
   */
  private getRootCause(
    type: FailureType,
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): string {
    switch (type) {
      case 'memory-exhaustion':
        if (buildMetrics.peakMemoryUsage > systemResources.totalMemory * 0.9) {
          return 'System memory exhausted due to high concurrent build processes';
        } else if (buildMetrics.performanceStats.memoryViolations > 0) {
          return 'Memory threshold violations indicate memory pressure during build';
        }
        return 'Memory usage exceeded available system resources';
      case 'compilation-error':
        return 'TypeScript compilation errors in source code';
      case 'dependency-error':
        return 'Missing or incompatible package dependencies';
      case 'timeout':
        return 'Build process exceeded maximum allowed time';
      case 'system-resource':
        return 'Insufficient CPU, memory, or disk resources';
      default:
        return 'Root cause could not be determined from available data';
    }
  }

  /**
   * Get memory exhaustion specific recommendations
   */
  private getMemoryExhaustionRecommendations(
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): BuildRecommendation[] {
    return [
      {
        category: 'memory',
        priority: 'critical',
        title: 'Immediate Memory Optimization',
        description: 'Critical memory exhaustion detected. Immediate action required.',
        actions: [
          'Reduce build concurrency to 1',
          'Enable aggressive memory cleanup between stages',
          'Use incremental builds only',
          'Close all unnecessary applications',
          'Consider adding system memory or swap space',
        ],
        expectedImpact: 'Prevent build failures due to memory exhaustion',
        configChanges: {
          maxConcurrency: 1,
          memoryThreshold: 60,
          cleanupBetweenStages: true,
          strategy: 'memory-optimized',
        },
      },
    ];
  }

  /**
   * Get compilation error recommendations
   */
  private getCompilationErrorRecommendations(analysis: FailureAnalysis): BuildRecommendation[] {
    return [
      {
        category: 'configuration',
        priority: 'high',
        title: 'Fix Compilation Errors',
        description: 'TypeScript compilation errors detected',
        actions: [
          'Review and fix TypeScript errors in affected packages',
          'Check tsconfig.json configuration',
          'Verify type definitions are installed',
          'Run type checking separately to isolate issues',
        ],
        expectedImpact: 'Resolve compilation failures and enable successful builds',
      },
    ];
  }

  /**
   * Get dependency error recommendations
   */
  private getDependencyErrorRecommendations(analysis: FailureAnalysis): BuildRecommendation[] {
    return [
      {
        category: 'dependency',
        priority: 'high',
        title: 'Resolve Dependency Issues',
        description: 'Package dependency resolution failures detected',
        actions: [
          'Run package manager install/update',
          'Check package.json for missing dependencies',
          'Verify workspace configuration',
          'Clear node_modules and reinstall if necessary',
        ],
        expectedImpact: 'Resolve dependency issues and enable successful builds',
      },
    ];
  }

  /**
   * Get timeout recommendations
   */
  private getTimeoutRecommendations(
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): BuildRecommendation[] {
    return [
      {
        category: 'configuration',
        priority: 'medium',
        title: 'Optimize Build Performance',
        description: 'Build timeout indicates performance issues',
        actions: [
          'Increase build timeout limits',
          'Enable incremental builds to reduce build time',
          'Optimize TypeScript compilation settings',
          'Consider using build caching',
        ],
        expectedImpact: 'Reduce build times and prevent timeout failures',
      },
    ];
  }

  /**
   * Get system resource recommendations
   */
  private getSystemResourceRecommendations(
    systemResources: SystemResources
  ): BuildRecommendation[] {
    return [
      {
        category: 'system',
        priority: 'medium',
        title: 'System Resource Optimization',
        description: 'System resource constraints detected',
        actions: [
          'Close unnecessary applications',
          'Free up disk space',
          'Consider system upgrades',
          'Use resource monitoring tools',
        ],
        expectedImpact: 'Improve system resource availability for builds',
      },
    ];
  }

  /**
   * Get generic recommendations
   */
  private getGenericRecommendations(
    buildMetrics: DetailedBuildMetrics,
    systemResources: SystemResources
  ): BuildRecommendation[] {
    return [
      {
        category: 'configuration',
        priority: 'low',
        title: 'General Build Optimization',
        description: 'General recommendations for build improvement',
        actions: [
          'Enable build monitoring and logging',
          'Use incremental builds when possible',
          'Optimize build configuration for your system',
          'Consider using build caching',
        ],
        expectedImpact: 'Improve overall build reliability and performance',
      },
    ];
  }
}
