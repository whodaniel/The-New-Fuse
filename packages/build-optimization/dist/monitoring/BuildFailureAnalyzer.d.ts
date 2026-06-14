/**
 * Build failure analysis and recommendation system
 */
import { EventEmitter } from 'events';
import { BuildResult, MemoryUsage, SystemResources } from '../types/index.js';
import { DetailedBuildMetrics } from './BuildMetricsCollector.js';
/**
 * Types of build failures
 */
export type FailureType = 'memory-exhaustion' | 'compilation-error' | 'dependency-error' | 'timeout' | 'system-resource' | 'configuration-error' | 'unknown';
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
 * Build failure analyzer implementation
 */
export declare class BuildFailureAnalyzer extends EventEmitter {
    private readonly failurePatterns;
    private readonly analysisHistory;
    private readonly recommendationCache;
    constructor();
    /**
     * Analyze build failure and generate recommendations
     */
    analyzeBuildFailure(buildResult: BuildResult, buildMetrics: DetailedBuildMetrics, systemResources: SystemResources, errorLogs?: string[]): Promise<{
        analysis: FailureAnalysis;
        recommendations: BuildRecommendation[];
    }>;
    /**
     * Analyze memory-related build issues
     */
    analyzeMemoryIssues(memoryHistory: MemoryUsage[], systemResources: SystemResources): BuildRecommendation[];
    /**
     * Generate system-specific recommendations
     */
    generateSystemRecommendations(systemResources: SystemResources, buildMetrics: DetailedBuildMetrics): BuildRecommendation[];
    /**
     * Get failure analysis history
     */
    getAnalysisHistory(): FailureAnalysis[];
    /**
     * Clear analysis history
     */
    clearHistory(): void;
    /**
     * Generate detailed troubleshooting log
     */
    generateTroubleshootingLog(analysis: FailureAnalysis, buildMetrics: DetailedBuildMetrics, systemResources: SystemResources): string;
    /**
     * Perform failure analysis based on build data
     */
    private performFailureAnalysis;
    /**
     * Check if failure matches a known pattern
     */
    private matchesPattern;
    /**
     * Create analysis from matched pattern
     */
    private createAnalysisFromPattern;
    /**
     * Perform heuristic analysis when no pattern matches
     */
    private performHeuristicAnalysis;
    /**
     * Generate recommendations based on failure analysis
     */
    private generateRecommendations;
    /**
     * Initialize failure patterns for pattern matching
     */
    private initializeFailurePatterns;
    /**
     * Calculate memory growth rate in MB per minute
     */
    private calculateMemoryGrowthRate;
    /**
     * Get failure description based on type
     */
    private getFailureDescription;
    /**
     * Get root cause analysis
     */
    private getRootCause;
    /**
     * Get memory exhaustion specific recommendations
     */
    private getMemoryExhaustionRecommendations;
    /**
     * Get compilation error recommendations
     */
    private getCompilationErrorRecommendations;
    /**
     * Get dependency error recommendations
     */
    private getDependencyErrorRecommendations;
    /**
     * Get timeout recommendations
     */
    private getTimeoutRecommendations;
    /**
     * Get system resource recommendations
     */
    private getSystemResourceRecommendations;
    /**
     * Get generic recommendations
     */
    private getGenericRecommendations;
}
//# sourceMappingURL=BuildFailureAnalyzer.d.ts.map