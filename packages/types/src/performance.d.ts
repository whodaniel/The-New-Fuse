import { SystemPerformanceMetrics } from './metrics.js';
import { JsonValue } from './common-types.js';
export type { SystemPerformanceMetrics };
export interface ExtendedPerformanceMetrics extends SystemPerformanceMetrics {
    latencyP50: number;
    latencyP90: number;
    latencyP99: number;
}
export interface PerformanceThreshold {
    metric: string;
    min?: number;
    max?: number;
    target?: number;
    tolerance?: number;
}
export interface PerformanceMetricsResult {
    values: SystemPerformanceMetrics;
    timestamp: Date;
}
export interface PerformanceInsight {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
    recommendation: string;
    metrics: SystemPerformanceMetrics;
    timestamp: Date;
}
export interface PerformanceAlert {
    id: string;
    metric: string;
    value: number | JsonValue;
    threshold: PerformanceThreshold;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    message?: string;
}
export interface PerformanceReport {
    id: string;
    metrics: SystemPerformanceMetrics;
    alerts: PerformanceAlert[];
    timestamp: Date;
    metadata?: Record<string, JsonValue>;
}
export interface TaskService {
    process(data: Record<string, unknown>): Promise<void>;
}
export interface PerformanceMetricsService {
    record(event: string, data: Record<string, unknown>): Promise<void>;
}
export interface ResourceManager {
    getCurrentUsage(): Promise<SystemPerformanceMetrics>;
    getCPUUsage(): Promise<number>;
    getMemoryUsage(): Promise<number>;
    getAverageLatency(): Promise<number>;
    getThroughput(): Promise<number>;
    getRequestCount(): Promise<number>;
    getConcurrentUsers(): Promise<number>;
}
//# sourceMappingURL=performance.d.ts.map