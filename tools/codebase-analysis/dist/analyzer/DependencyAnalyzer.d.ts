import { PackageInfo } from '../scanner/FileSystemScanner';
export interface DependencyInfo {
    name: string;
    version?: string;
    type: DependencyType;
    source: string;
    isInternal: boolean;
    isUsed: boolean;
}
export interface ImportInfo {
    importPath: string;
    importedItems: string[];
    filePath: string;
    lineNumber: number;
    isTypeOnly: boolean;
    isDynamic: boolean;
}
export interface ExportInfo {
    exportedItems: string[];
    filePath: string;
    isDefault: boolean;
    isReExport: boolean;
}
export interface CircularDependency {
    cycle: string[];
    severity: 'warning' | 'error';
    description: string;
}
export interface DependencyConflict {
    packageName: string;
    versions: {
        version: string;
        usedBy: string[];
    }[];
    severity: 'warning' | 'error';
}
export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
    circularDependencies: CircularDependency[];
    conflicts: DependencyConflict[];
    unusedDependencies: string[];
    missingDependencies: string[];
}
export interface DependencyNode {
    id: string;
    name: string;
    type: 'package' | 'app' | 'external';
    version?: string;
    path?: string;
}
export interface DependencyEdge {
    from: string;
    to: string;
    type: DependencyType;
    weight: number;
}
export declare enum DependencyType {
    PRODUCTION = "dependencies",
    DEVELOPMENT = "devDependencies",
    PEER = "peerDependencies",
    OPTIONAL = "optionalDependencies",
    IMPORT = "import",
    REQUIRE = "require"
}
export declare class DependencyAnalyzer {
    private packages;
    private internalPackageNames;
    constructor(packages: PackageInfo[]);
    analyzeDependencies(): Promise<DependencyGraph>;
    private buildDependencyNodes;
    private buildDependencyEdges;
    private analyzeImports;
    private extractImports;
    private parseImportedItems;
    private resolveImportPath;
    private detectCircularDependencies;
    private isInternalCycle;
    private detectVersionConflicts;
    private findUnusedDependencies;
    private findMissingDependencies;
}
//# sourceMappingURL=DependencyAnalyzer.d.ts.map