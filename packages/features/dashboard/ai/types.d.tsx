export interface InsightConfig {
    type: trend' | 'anomaly' | 'correlation' | 'pattern' | 'forecast' | 'recommendation';
    metric: string;
    timeframe: hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
    threshold?: number;
    dimensions?: string[];
}
export interface Insight {
    id: string;
    type: InsightConfig['type'];
    title: string;
    description: string;
    importance: low' | 'medium' | 'high' | 'critical';
    confidence: number;
    timestamp: Date;
    metric: string;
    value: number;
    previousValue?: number;
    change?: {
        absolute: number;
        percentage: number;
        direction: up' | 'down' | 'stable';
    };
    context?: {
        timeframe: string;
        comparison: string;
        factors: string[];
    };
    visualization?: {
        type: line' | 'bar' | 'scatter' | 'heatmap';
        data: unknown[];
    };
    actions?: Array<{
        type: string;
        label: string;
        description: string;
        impact: string;
        configuration?: Record<string, unknown>;
    }>;
}
export interface OptimizationSuggestion {
    id: string;
    type: performance' | 'usability' | 'accessibility' | 'dataQuality' | 'security';
    title: string;
    description: string;
    priority: low' | 'medium' | 'high';
    impact: {
        metrics: string[];
        estimate: {
            type: string;
            value: number;
            unit: string;
        };
    };
    implementation: {
        complexity: easy' | 'medium' | 'hard';
        timeEstimate: string;
        steps: string[];
        resources?: string[];
    };
    status: pending' | 'in_progress' | 'completed' | 'dismissed';
}
export interface SearchConfig {
    query: string;
    filters?: {
        type?: string[];
        category?: string[];
        tags?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        creator?: string[];
    };
    sort?: {
        field: string;
        order: asc' | 'desc';
    };
    page?: number;
    pageSize?: number;
}
export interface SearchResult {
    id: string;
    type: string;
    title: string;
    description: string;
    relevance: number;
    highlights: Array<{
        field: string;
        snippet: string;
    }>;
    metadata: Record<string, unknown>;
}
export interface SearchSuggestion {
    type: query' | 'filter' | 'category' | 'tag';
    value: string;
    label: string;
    count: number;
    relevance: number;
}
