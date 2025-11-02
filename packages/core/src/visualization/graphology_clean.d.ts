// Type definitions for graphology integration
declare module 'graphology-clean' {
  export interface GraphNode {
    id: string;
    label?: string;
    attributes?: Record<string, any>;
  }

  export interface GraphEdge {
    source: string;
    target: string;
    label?: string;
    attributes?: Record<string, any>;
  }

  export class Graph {
    constructor(options?: { type?: 'directed' | 'undirected'; multi?: boolean });
    addNode(id: string, attributes?: Record<string, any>): void;
    addEdge(source: string, target: string, attributes?: Record<string, any>): void;
    hasNode(id: string): boolean;
    hasEdge(source: string, target: string): boolean;
    getNodeAttributes(id: string): Record<string, any>;
    getEdgeAttributes(source: string, target: string): Record<string, any>;
    forEachNode(callback: (node: string, attributes: Record<string, any>) => void): void;
    forEachEdge(callback: (edge: string, attributes: Record<string, any>, source: string, target: string) => void): void;
  }
}
