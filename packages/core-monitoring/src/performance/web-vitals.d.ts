/**
 * Web Vitals performance monitoring
 * Tracks Core Web Vitals and custom performance metrics
 */
export interface WebVitalsMetric {
    name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}
export interface CustomPerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
}
export interface PerformanceReport {
    url: string;
    timestamp: number;
    sessionId: string;
    userId?: string;
    vitals: WebVitalsMetric[];
    custom: CustomPerformanceMetric[];
    navigation: PerformanceNavigationTiming | null;
    resources: PerformanceResourceTiming[];
}
export interface WebVitalsConfig {
    enabled: boolean;
    reportUrl?: string;
    sampleRate?: number;
    reportAllChanges?: boolean;
    durationThreshold?: number;
    onReport?: (report: PerformanceReport) => void;
}
/**
 * Web Vitals thresholds (from web.dev)
 */
export declare const VITALS_THRESHOLDS: {
    readonly CLS: {
        readonly good: 0.1;
        readonly poor: 0.25;
    };
    readonly FID: {
        readonly good: 100;
        readonly poor: 300;
    };
    readonly FCP: {
        readonly good: 1800;
        readonly poor: 3000;
    };
    readonly LCP: {
        readonly good: 2500;
        readonly poor: 4000;
    };
    readonly TTFB: {
        readonly good: 800;
        readonly poor: 1800;
    };
    readonly INP: {
        readonly good: 200;
        readonly poor: 500;
    };
};
export declare class WebVitalsMonitor {
    private config;
    private sessionId;
    private vitals;
    private customMetrics;
    private reportTimer;
    constructor(config?: Partial<WebVitalsConfig>);
    /**
     * Initialize Web Vitals monitoring
     */
    initialize(): Promise<void>;
    /**
     * Handle a Web Vitals metric
     */
    private handleMetric;
    /**
     * Get rating for a metric value
     */
    private getRating;
    /**
     * Track custom performance metric
     */
    trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): void;
    /**
     * Track Navigation Timing
     */
    private trackNavigationTiming;
    /**
     * Track Resource Timing
     */
    private trackResourceTiming;
    /**
     * Schedule periodic reporting
     */
    private scheduleReport;
    /**
     * Generate performance report
     */
    private generateReport;
    /**
     * Send performance report
     */
    private sendReport;
    /**
     * Send report to endpoint
     */
    private sendToEndpoint;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Get current vitals
     */
    getVitals(): WebVitalsMetric[];
    /**
     * Get custom metrics
     */
    getCustomMetrics(): CustomPerformanceMetric[];
    /**
     * Cleanup
     */
    destroy(): void;
}
/**
 * Create and initialize Web Vitals monitor
 */
export declare function createWebVitalsMonitor(config?: Partial<WebVitalsConfig>): Promise<WebVitalsMonitor>;
//# sourceMappingURL=web-vitals.d.ts.map