import { PackageInfo } from '../scanner/FileSystemScanner';
import { SpecificationAlignment } from './SpecificationAlignmentChecker';
import { CodeQualityReport } from './CodeQualityAnalyzer';
import { PerformanceBottleneckReport } from './PerformanceBottleneckDetector';
export interface ImplementationGap {
    feature: string;
    specificationExists: boolean;
    implementationExists: boolean;
    implementationComplete: boolean;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedEffort: string;
    blockers: string[];
    dependencies: string[];
}
export interface ImplementationCompletenessMetrics {
    totalFeatures: number;
    implementedFeatures: number;
    partiallyImplementedFeatures: number;
    missingFeatures: number;
    unspecifiedImplementations: number;
    overallCompletenessScore: number;
    qualityScore: number;
    performanceScore: number;
    alignmentScore: number;
}
export interface ImplementationCompletenessReport {
    specificationAlignment: SpecificationAlignment;
    codeQuality: CodeQualityReport;
    performanceBottlenecks: PerformanceBottleneckReport;
    implementationGaps: ImplementationGap[];
    completenessMetrics: ImplementationCompletenessMetrics;
    prioritizedRecommendations: {
        priority: 'critical' | 'high' | 'medium' | 'low';
        category: 'implementation' | 'quality' | 'performance' | 'alignment';
        recommendation: string;
        effort: string;
        impact: string;
    }[];
}
export declare class ImplementationCompletenessAnalyzer {
    private packages;
    private rootPath;
    constructor(packages: PackageInfo[], rootPath?: string);
    analyzeImplementationCompleteness(): Promise<ImplementationCompletenessReport>;
    private identifyImplementationGaps;
    private determinePriority;
    private estimateImplementationEffort;
    private estimateCompletionEffort;
    private identifyBlockers;
    private identifyDependencies;
    private calculateCompletenessMetrics;
    private generatePrioritizedRecommendations;
}
//# sourceMappingURL=ImplementationCompletenessAnalyzer.d.ts.map