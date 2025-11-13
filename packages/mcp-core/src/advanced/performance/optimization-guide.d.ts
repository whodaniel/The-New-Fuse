/**
 * Automated Performance Optimization Guide
 *
 * This module provides intelligent analysis of performance data and generates
 * specific, actionable optimization recommendations for MCP components.
 */
import { BenchmarkResult } from './benchmarks';
import { ProfileReport } from './profiler';
export interface OptimizationRecommendation {
    id: string;
    category: 'cpu' | 'memory' | 'io' | 'network' | 'architecture';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: {
        performance: number;
        complexity: number;
        risk: number;
    };
    implementation: {
        steps: string[];
        codeExample?: string;
        estimatedTime: string;
        dependencies?: string[];
    };
    metrics: {
        before: Record<string, number>;
        expectedAfter: Record<string, number>;
    };
}
export interface OptimizationPlan {
    sessionId: string;
    timestamp: number;
    overallScore: number;
    recommendations: OptimizationRecommendation[];
    quickWins: OptimizationRecommendation[];
    longTermGoals: OptimizationRecommendation[];
    estimatedImpact: {
        totalPerformanceGain: number;
        implementationTime: string;
        riskLevel: 'low' | 'medium' | 'high';
    };
}
export declare class PerformanceAnalyzer {
    private knowledgeBase;
    constructor();
    analyzeProfile(profile: ProfileReport): OptimizationPlan;
    analyzeBenchmarks(benchmarks: Map<string, BenchmarkResult>): OptimizationRecommendation[];
    private analyzeCPUPerformance;
    private analyzeMemoryPerformance;
    private analyzeIOPerformance;
    private analyzeNetworkPerformance;
    private analyzeArchitecture;
    private initializeKnowledgeBase;
    private parseTimeEstimate;
    private formatTimeEstimate;
    generateOptimizationReport(plan: OptimizationPlan): string;
    private formatRecommendation;
}
//# sourceMappingURL=optimization-guide.d.ts.map