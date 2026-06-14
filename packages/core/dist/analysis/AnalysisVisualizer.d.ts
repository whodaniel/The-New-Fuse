import { AnalysisResult, AnalysisReport } from './AnalysisManager.js';
export interface VisualizationOptions {
    format?: 'json' | 'html' | 'svg' | 'text';
    includeMetadata?: boolean;
    groupBy?: 'type' | 'severity' | 'file';
    sortBy?: 'severity' | 'type' | 'timestamp';
    theme?: 'light' | 'dark';
    customStyles?: Record<string, string>;
}
export declare enum AnalysisType {
    DEPENDENCY = "dependency",
    SECURITY = "security",
    PERFORMANCE = "performance",
    CODE_QUALITY = "code_quality",
    COMPLEXITY = "complexity"
}
export interface VisualizationData {
    type: 'chart' | 'table' | 'text' | 'graph';
    title: string;
    description?: string;
    data: any;
    metadata?: Record<string, any>;
}
export interface MetricsData {
    cpuUsage?: number;
    memoryUsage?: number;
    throughput?: number;
    errorRate?: number;
    responseTime?: number;
    activeConnections?: number;
}
export interface DependencyNode {
    id: string;
    name: string;
    version?: string;
    type: 'internal' | 'external';
    dependencies?: string[];
    dependents?: string[];
    vulnerable?: boolean;
}
export declare class AnalysisVisualizer {
    private readonly logger;
    visualizeAnalysis(report: AnalysisReport, options?: VisualizationOptions): Promise<VisualizationData>;
    visualizeByType(results: AnalysisResult[], analysisType: AnalysisType, options?: VisualizationOptions): Promise<VisualizationData>;
    private generateJsonVisualization;
    private generateHtmlVisualization;
    private generateSvgVisualization;
    private generateTextVisualization;
    private createDependencyVisualization;
    private createSecurityVisualization;
    private createPerformanceVisualization;
    private createCodeQualityVisualization;
    private createComplexityVisualization;
    visualizeMetrics(metrics: MetricsData): VisualizationData;
    visualizeDependencyGraph(dependencies: DependencyNode[]): VisualizationData;
    private createHtmlReport;
    private createSvgChart;
    private getSeverityWeight;
    private groupResultsByFile;
}
//# sourceMappingURL=AnalysisVisualizer.d.ts.map