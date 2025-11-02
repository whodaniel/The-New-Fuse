declare module 'graphology' {
  export class Graph {
    addNode(node: string, attributes?: any): void;
    addEdge(source: string, target: string, attributes?: any): void;
    nodes(): string[];
    edges(): string[];
    getNodeAttribute(node: string, attribute: string): any;
    setNodeAttribute(node: string, attribute: string, value: any): void;
    getEdgeAttribute(edge: string, attribute: string): any;
    setEdgeAttribute(edge: string, attribute: string, value: any): void;
  }
}
