export interface VisualizationConfig {
    id: string;
    type: 'graph' | 'chart' | 'diagram' | 'tree';
    data: any;
    options?: Record<string, any>;
}
export interface VisualizationResult {
    id: string;
    output: string;
    format: 'svg' | 'png' | 'json';
    metadata?: Record<string, any>;
}
export declare class VisualizationManager {
    private readonly logger;
    private visualizations;
    createVisualization(config: VisualizationConfig): Promise<VisualizationResult>;
    getVisualization(id: string): VisualizationConfig | undefined;
    updateVisualization(id: string, updates: Partial<VisualizationConfig>): Promise<VisualizationResult>;
    deleteVisualization(id: string): boolean;
    getAllVisualizations(): VisualizationConfig[];
}
//# sourceMappingURL=VisualizationManager_clean.d.ts.map