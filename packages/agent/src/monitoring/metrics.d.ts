/**
 * Monitoring and metrics collection for agents
 * Provides performance monitoring and metrics aggregation
 */
export interface Metric {
    name: string;
    value: number;
    timestamp: number;
    tags?: Record<string, string>;
    unit?: string;
}
export interface Counter {
    name: string;
    value: number;
    increment(amount?: number): void;
    reset(): void;
}
export interface Gauge {
    name: string;
    value: number;
    set(value: number): void;
    increment(amount?: number): void;
    decrement(amount?: number): void;
}
export interface Timer {
    name: string;
    start(): () => number;
    record(duration: number): void;
    getStats(): {
        count: number;
        avg: number;
        min: number;
        max: number;
    };
}
export declare class MetricsRegistry {
    private agentId;
    private counters;
    private gauges;
    private timers;
    private metrics;
    constructor(agentId: string);
    /**
     * Create or get a counter metric
     */
    counter(name: string): Counter;
    /**
     * Create or get a timer metric
     */
    timer(name: string): Timer;
    /**
     * Record a metric manually
     */
    recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void;
}
//# sourceMappingURL=metrics.d.ts.map