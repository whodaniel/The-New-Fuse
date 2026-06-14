import { VisualizationConfig } from './fileVisualizer.js';
export interface VisualizationRequest {
    type: 'file-tree' | 'dependency-graph' | 'code-metrics';
    target: string;
    config?: VisualizationConfig;
    format?: 'json' | 'svg' | 'png';
}
export interface VisualizationResult {
    id: string;
    type: string;
    data: any;
    format: string;
    createdAt: Date;
    metadata?: Record<string, any>;
}
export declare class VisualizationManager {
    private fileVisualizer;
    private cache;
    constructor();
    createVisualization(request: VisualizationRequest): Promise<VisualizationResult>;
    getVisualization(id: string): Promise<VisualizationResult | null>;
    exportVisualization(id: string, format: string): Promise<string>;
    clearCache(): Promise<void>;
    getCacheStats(): Promise<{
        size: number;
        keys: string[];
        totalMemory: number;
    }>;
    private generateId;
    private getDefaultConfig;
}
//# sourceMappingURL=VisualizationManager.d.ts.map