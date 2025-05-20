export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf';
export interface ExportOptions {
    format: ExportFormat;
    fileName?: string;
    includeMetadata?: boolean;
    columns?: string[];
    filters?: Record<string, unknown>;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
export interface ExportMetadata {
    exportedAt: Date;
    exportedBy: {
        id: string;
        name: string;
    };
    dashboard: {
        id: string;
        name: string;
        description?: string;
    };
    filters?: Record<string, unknown>;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
export interface ShareConfig {
    id: string;
    type: view' | 'edit';
    recipient: {
        type: user' | 'team' | 'public';
        id?: string;
        email?: string;
    };
    expiresAt?: Date;
    password?: string;
    allowExport?: boolean;
    allowShare?: boolean;
    createdAt: Date;
    createdBy: {
        id: string;
        name: string;
    };
}
export interface DashboardState {
    id: string;
    name: string;
    description?: string;
    layout: {
        id: string;
        widgets: Array<{
            id: string;
            position: {
                x: number;
                y: number;
                w: number;
                h: number;
            };
        }>;
    };
    widgets: Record<string, unknown>;
    dataSources: Record<string, unknown>;
    filters: Record<string, unknown>;
    theme?: Record<string, unknown>;
    version: number;
    lastModified: Date;
    lastModifiedBy: {
        id: string;
        name: string;
    };
}
