/**
 * Embedded Visualization Generator for AG-UI Core
 *
 * Generates self-contained HTML visualizations from data configurations.
 */
export interface VisualizationConfig {
    title: string;
    data: any;
    type: string;
    aiInsights?: string;
    metadata?: Record<string, any>;
}
export declare class VisualizationGenerator {
    generate(config: VisualizationConfig): Promise<string>;
}
//# sourceMappingURL=VisualizationGenerator.d.ts.map