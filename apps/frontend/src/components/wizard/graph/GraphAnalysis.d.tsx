import { GraphNode, GraphEdge } from '../../shared/types.js';
interface NodeMetrics {
    degree: number;
    inDegree: number;
    outDegree: number;
    betweennessCentrality: number;
    closenessCentrality: number;
    eigenvectorCentrality: number;
    pageRank: number;
    clusteringCoefficient: number;
    community: number;
}
export declare class GraphAnalyzer {
    private nodes;
    private edges;
    private adjacencyMatrix;
    private nodeMetrics;
    constructor(nodes: GraphNode[], edges: GraphEdge[]);
    private buildAdjacencyMatrix;
    calculateDegrees(): Map<string, {
        in: number;
        out: number;
        total: number;
    }>;
    calculateBetweennessCentrality(): Map<string, number>;
    calculateClosenessCentrality(): Map<string, number>;
    calculatePageRank(damping?: number, iterations?: number): Map<string, number>;
    detectCommunities(): Map<string, number>;
    private findAllShortestPaths;
    private findShortestPath;
    analyzeGraph(): Map<string, NodeMetrics>;
    private calculateLocalClusteringCoefficient;
}
export {};
