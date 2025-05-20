import { DashboardWidget, DashboardLayout } from '../types.js';
export interface DashboardTemplate {
    id: string;
    name: string;
    description: string;
    category: analytics' | 'monitoring' | 'development' | 'custom';
    thumbnail?: string;
    layout: DashboardLayout;
    widgets: DashboardWidget[];
    tags: string[];
    author: {
        name: string;
        avatar?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface DashboardPreset {
    id: string;
    name: string;
    description: string;
    layout: DashboardLayout;
    isDefault?: boolean;
}
export interface DataSourceConfig {
    id: string;
    type: api' | 'graphql' | 'websocket' | 'custom';
    name: string;
    description?: string;
    config: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        queryParams?: Record<string, string>;
        body?: unknown;
        interval?: number;
        transform?: string;
    };
    credentials?: {
        type: apiKey' | 'oauth' | 'basic';
        [key: string]: unknown;
    };
}
export interface WidgetDataSource {
    sourceId: string;
    mapping: {
        path: string;
        transform?: string;
    };
    refreshInterval?: number;
    errorHandling?: {
        retry: boolean;
        maxRetries?: number;
        fallbackValue?: unknown;
    };
}
