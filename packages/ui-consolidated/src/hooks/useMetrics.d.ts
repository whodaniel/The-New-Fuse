import { MetricsData } from '@the-new-fuse/api-types';
interface UseMetricsOptions {
    refreshInterval?: number;
    autoRefresh?: boolean;
    websocketUrl?: string;
}
export declare function useMetrics(options?: UseMetricsOptions): {
    data: MetricsData | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    isConnected: boolean;
};
export {};
//# sourceMappingURL=useMetrics.d.ts.map