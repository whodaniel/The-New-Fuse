export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    children?: FileNode[];
}
export interface FileVisualization {
    root: FileNode;
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
}
export declare class FileVisualizer {
    private readonly logger;
    visualizeDirectory(path: string): Promise<FileVisualization>;
    generateTree(node: FileNode, prefix?: string): string;
    analyzeFileStructure(root: FileNode): Promise<Record<string, number>>;
}
//# sourceMappingURL=fileVisualizer_clean.d.ts.map