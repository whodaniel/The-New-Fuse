import { GraphNode, GraphEdge } from '../../shared/types.js';
export interface GraphMetrics {
    centrality: {
        degree: Map<string, number>;
        betweenness: Map<string, number>;
        closeness: Map<string, number>;
        eigenvector: Map<string, number>;
        katz: Map<string, number>;
    };
    clustering: {
        globalCoefficient: number;
        localCoefficients: Map<string, number>;
        communities: Map<string, number>;
    };
    paths: {
        averagePathLength: number;
        diameter: number;
        eccentricity: Map<string, number>;
    };
    spectral: {
        eigenvalues: number[];
        eigenvectors: number[][];
        laplacianSpectrum: number[];
    };
}
export declare class AdvancedGraphAlgorithms {
    private nodes;
    private edges;
    private adjacencyMatrix;
    private laplacianMatrix;
    private nodeIndices;
    constructor(nodes: GraphNode[], edges: GraphEdge[]);
    private buildAdjacencyMatrix;
    private buildLaplacianMatrix;
    private powerIteration;
    calculateEigenvectorCentrality(): Map<string, number>;
    calculateKatzCentrality(alpha?: number): Map<string, number>;
    calculateSpectralProperties(): {
        eigenvalues: number[];
        eigenvectors: number[][];
        laplacianSpectrum: number[];
    };
    detectStructuralHoles(): Map<string, number>;
    findCorePeriphery(): {
        core: Set<string>;
        periphery: Set<string>;
    };
    calculateAllMetrics(): GraphMetrics;
}
