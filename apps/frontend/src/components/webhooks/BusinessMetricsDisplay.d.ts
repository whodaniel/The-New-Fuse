import { BusinessMetrics } from '@the-new-fuse/types';
export interface BusinessMetricsDisplayProps {
    metrics: BusinessMetrics | null;
    loading?: boolean;
    compact?: boolean;
    className?: string;
}
export declare function BusinessMetricsDisplay({ metrics, loading, compact, className, }: BusinessMetricsDisplayProps): import("react/jsx-runtime").JSX.Element;
