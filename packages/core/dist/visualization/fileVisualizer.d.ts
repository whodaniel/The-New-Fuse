export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'directory';
    path: string;
    size?: number;
    children?: FileNode[];
    metadata?: Record<string, any>;
}
export interface VisualizationConfig {
    maxDepth: number;
    includeHidden: boolean;
    filterExtensions?: string[];
    groupByType: boolean;
}
export declare class FileVisualizer {
    private config;
    constructor(config: VisualizationConfig);
    generateFileTree(rootPath: string): Promise<FileNode>;
    generateDependencyGraph(filePath: string): Promise<{
        nodes: any[];
        edges: any[];
        message?: string;
    }>;
    generateCodeMetrics(filePath: string): Promise<{
        linesOfCode: number;
        complexity: number;
        dependencies: number;
        message?: string;
    }>;
    exportVisualization(data: any, format: string): Promise<string>;
    private getDirectoryChildren;
    private shouldIncludeDirectory;
    private groupByType;
    private calculateComplexity;
    private countDependencies;
    private parseDependencies;
    private generateSVG;
}
//# sourceMappingURL=fileVisualizer.d.ts.map