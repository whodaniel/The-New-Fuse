export interface DependencyNode {
    id: string;
    label: string;
    type: 'direct' | 'dev' | 'peer';
    version: string;
    metadata: Record<string, unknown>;
}
export interface DependencyEdge {
    source: string;
    target: string;
    type: 'direct' | 'dev' | 'peer';
    metadata?: Record<string, unknown>;
}
export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
}
export interface OutdatedDependency {
    name: string;
    version: string;
    latestVersion: string;
    type: 'direct' | 'dev' | 'peer';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    updateType: 'major' | 'minor' | 'patch';
    metadata?: Record<string, unknown>;
}
export interface DependencyAnalysis {
    totalDependencies: number;
    directDependencies: number;
    devDependencies: number;
    peerDependencies: number;
    circularDependenciesCount: number;
    outdatedDependencies: number;
    vulnerableDependencies: number;
    averageDependencyDepth: number;
    metadata: {
        timestamp: Date;
        graphComplexity: number;
        analysisVersion: string;
    };
}
export interface DependencyMapper {
    mapDependencies(projectId: string): Promise<DependencyGraph>;
    findCircularDependencies(projectId: string): Promise<string[][]>;
    findOutdatedDependencies(projectId: string): Promise<OutdatedDependency[]>;
    analyzeDependencyGraph(projectId: string): Promise<DependencyAnalysis>;
}
//# sourceMappingURL=dependency.d.d.ts.map