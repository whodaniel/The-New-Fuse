export interface StepMetric {
    id: string;
    name: string;
    value: number;
    nodeId: string;
    duration: number;
    success: boolean;
}
export interface MemoryMetric {
    id: string;
    name: string;
    value: number;
    totalItems: number;
    hitRate: number;
}
export interface MetricsData {
    stepMetrics: StepMetric[];
    memoryMetrics: MemoryMetric;
}
export type Metric = StepMetric;
export interface BaseMetric {
    id: string;
    name: string;
    value: number;
}
//# sourceMappingURL=metrics.d.ts.map