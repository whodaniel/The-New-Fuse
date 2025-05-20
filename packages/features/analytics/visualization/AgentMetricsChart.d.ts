import { AgentMetric } from '@/types';
interface AgentMetricsChartProps {
    metrics: AgentMetric[];
    timeRange: 24h' | '7d' | '30d';
}
export declare function AgentMetricsChart({ metrics, timeRange }: AgentMetricsChartProps): any void;
export {};
