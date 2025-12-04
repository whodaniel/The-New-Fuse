import { AnalyticsMetrics, BusinessEventType, IntegrationSource } from '@the-new-fuse/types';
export interface BusinessMetricsState {
    metrics: AnalyticsMetrics | null;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}
export interface MetricsFilter {
    timeRange: '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
    startDate?: Date;
    endDate?: Date;
    eventTypes?: BusinessEventType[];
    sources?: IntegrationSource[];
}
export declare function useBusinessMetrics(initialFilter?: MetricsFilter): {
    filter: MetricsFilter;
    loadMetrics: (currentFilter?: MetricsFilter) => Promise<void>;
    updateFilter: (newFilter: Partial<MetricsFilter>) => void;
    refreshMetrics: () => void;
    getEventTypePercentages: () => Record<BusinessEventType, number>;
    getSourcePercentages: () => Record<IntegrationSource, number>;
    getTopEventTypes: (limit?: number) => Array<{
        type: BusinessEventType;
        count: number;
        percentage: number;
    }>;
    getTopSources: (limit?: number) => Array<{
        source: IntegrationSource;
        count: number;
        percentage: number;
    }>;
    getHealthScore: () => number;
    getPerformanceGrade: () => "A" | "B" | "C" | "D" | "F";
    getRevenueGrowth: () => number;
    metrics: AnalyticsMetrics | null;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
};
