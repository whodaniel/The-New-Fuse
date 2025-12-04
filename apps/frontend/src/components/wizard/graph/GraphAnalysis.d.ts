export declare class GraphAnalyzer {
    constructor(nodes: any, edges: any);
    buildAdjacencyMatrix(): any[][];
    calculateDegrees(): Map<any, any>;
    calculateBetweennessCentrality(): Map<any, any>;
    calculateClosenessCentrality(): Map<any, any>;
    calculatePageRank(damping?: number, iterations?: number): Map<any, any>;
    detectCommunities(): Map<any, any>;
    findAllShortestPaths(start: any, end: any): any[];
    findShortestPath(start: any, end: any): any;
    analyzeGraph(): any;
    calculateLocalClusteringCoefficient(nodeId: any): number;
}
