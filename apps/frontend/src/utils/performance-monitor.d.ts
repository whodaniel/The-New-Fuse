export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    context?: Record<string, any>;
}
export interface ComponentPerformance {
    component: string;
    renderTime: number;
    mountTime?: number;
    updateCount: number;
    lastUpdate: number;
}
declare class PerformanceMonitor {
    private metrics;
    private componentMetrics;
    private startTimes;
    private observers;
    constructor();
    private initializeObservers;
    recordMetric(name: string, value: number, context?: Record<string, any>): void;
    startTiming(operation: string): void;
    endTiming(operation: string, context?: Record<string, any>): number;
    trackComponentRender(componentName: string, renderTime: number): void;
    getMetricsSummary(metricName?: string): Record<string, any>;
    getComponentMetrics(): ComponentPerformance[];
    getMemoryUsage(): Record<string, number> | null;
    dispose(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
export declare function usePerformanceTracker(componentName: string): {
    recordRender: () => void;
    startTiming: (operation: string) => void;
    endTiming: (operation: string, context?: Record<string, any>) => number;
};
export declare function timed(target: any, propertyName: string, descriptor: PropertyDescriptor): void;
export {};
