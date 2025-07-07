import { MemoryLeakInfo } from './MemoryTypes';
export interface MemoryProfile {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
}
export interface MemoryLeakWarning {
    id: string;
    type: 'heap_growth' | 'external_growth' | 'event_listener_leak' | 'timer_leak';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: number;
    memoryUsage: number;
    threshold: number;
    stack?: string;
}
export interface LeakDetectionConfig {
    samplingInterval: number;
    memoryThreshold: number;
    growthThreshold: number;
    retentionPeriod: number;
    enabled: boolean;
}
export declare class MemoryLeakDetector {
    private readonly logger;
    private readonly config;
    private readonly memoryProfiles;
    private readonly warnings;
    private samplingInterval;
    private isMonitoring;
    constructor();
    startMonitoring(): void;
    stopMonitoring(): void;
    private sampleMemoryUsage;
    private analyzeMemoryTrends;
    private checkHeapGrowthLeak;
    private checkExternalMemoryLeak;
    private checkAbsoluteThresholds;
    private calculateSeverity;
    private captureStackTrace;
    private addWarning;
    private cleanupOldProfiles;
    getMemoryLeaks(): MemoryLeakInfo[];
    getCurrentMemoryProfile(): MemoryProfile | null;
    getMemoryTrend(minutes?: number): MemoryProfile[];
    getWarnings(severity?: 'low' | 'medium' | 'high' | 'critical'): MemoryLeakWarning[];
    clearWarnings(): void;
    forceGarbageCollection(): Promise<void>;
    getStats(): {
        profileCount: number;
        warningCount: number;
        isMonitoring: boolean;
        memoryThreshold: number;
        currentMemoryUsage: number;
    };
    onDestroy(): void;
}
//# sourceMappingURL=MemoryLeakDetector.d.ts.map