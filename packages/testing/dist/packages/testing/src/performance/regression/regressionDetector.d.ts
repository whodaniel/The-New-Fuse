import { PerformanceResult, PerformanceStats } from '../utils/measurePerformance';
export interface BaselineMetrics {
    timestamp: number;
    environment: string;
    metrics: {
        [key: string]: {
            results: PerformanceResult[];
            stats: PerformanceStats;
        };
    };
}
export interface RegressionAnalysisResult {
    hasRegression: boolean;
    regressions: {
        [key: string]: {
            metric: string;
            baselineValue: number;
            currentValue: number;
            difference: number;
            percentChange: number;
        }[];
    };
    improvements: {
        [key: string]: {
            metric: string;
            baselineValue: number;
            currentValue: number;
            difference: number;
            percentChange: number;
        }[];
    };
}
export interface RegressionThresholds {
    maxDurationIncrease?: number;
    maxMemoryIncrease?: number;
    minSignificantChange?: number;
}
export declare class RegressionDetector {
    private baselinePath;
    private thresholds;
    constructor(baselinePath?: string, thresholds?: RegressionThresholds);
    saveBaseline(testName: string, results: {
        results: PerformanceResult[];
        stats: PerformanceStats;
    }, environment?: string): Promise<void>;
    detectRegression(testName: string, currentResults: {
        results: PerformanceResult[];
        stats: PerformanceStats;
    }, environment?: string): Promise<RegressionAnalysisResult>;
    private loadBaseline;
    private ensureBaselineDirectory;
    private calculateMeanMemoryUsage;
    private calculatePercentChange;
}
//# sourceMappingURL=regressionDetector.d.ts.map