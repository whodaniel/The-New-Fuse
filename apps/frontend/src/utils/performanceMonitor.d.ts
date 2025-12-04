interface PerformanceMetrics {
    componentLoadTime: Record<string, number>;
    bundleSize: Record<string, number>;
    routeLoadTime: Record<string, number>;
    memoryUsage: number;
    timestamp: number;
}
interface BundleStats {
    name: string;
    size: number;
    gzipSize?: number;
    loadingTime: number;
    chunkType: 'route' | 'component' | 'vendor' | 'utility';
}
declare class PerformanceMonitor {
    private metrics;
    private bundleStats;
    private observer?;
    constructor();
    private initializeObserver;
    private determineChunkType;
    startComponentLoad(componentName: string): () => void;
    startRouteLoad(routeName: string): () => void;
    recordBundleSize(bundleName: string, size: number, gzipSize?: number): void;
    generateReport(): PerformanceMetrics & {
        bundleStats: BundleStats[];
    };
    getHeavyComponents(limit?: number): Array<{
        name: string;
        time: number;
    }>;
    getBundleBreakdown(): Record<BundleStats['chunkType'], number>;
    getRecommendations(): string[];
    logSummary(): void;
    destroy(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
export declare const usePerformanceMonitor: (componentName: string) => {
    trackRoute: (routeName: string) => () => void;
};
export type { PerformanceMetrics, BundleStats };
