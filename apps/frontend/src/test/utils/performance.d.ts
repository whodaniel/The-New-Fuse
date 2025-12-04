export declare class PerformanceMonitor {
    private static metrics;
    static startMeasure(name: string): void;
    static endMeasure(name: string): void;
    static generateReport(): void;
}
