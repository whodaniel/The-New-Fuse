import { Node, Edge } from 'reactflow';
interface N8nNode {
    id: string;
    name: string;
    type: string;
    parameters: Record<string, any>;
    credentials?: Record<string, any>;
}
interface N8nConnection {
    node: string;
    type: string;
    index: number;
}
interface N8nWorkflow {
    nodes: N8nNode[];
    connections: Record<string, {
        main: N8nConnection[];
    }>;
}
export declare function convertToN8n(nodes: Node[], edges: Edge[]): N8nWorkflow;
export declare function validateWorkflow(workflow: N8nWorkflow): boolean;
export {};
