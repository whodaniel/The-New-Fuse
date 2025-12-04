export interface PerformanceMetrics {
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    timeToInteractive: number;
}
export declare const usePagePerformance: (pageName: string) => null;
export declare const PERFORMANCE_THRESHOLDS: {
    FCP: {
        good: number;
        needsImprovement: number;
    };
    LCP: {
        good: number;
        needsImprovement: number;
    };
    FID: {
        good: number;
        needsImprovement: number;
    };
    CLS: {
        good: number;
        needsImprovement: number;
    };
    TTFB: {
        good: number;
        needsImprovement: number;
    };
};
