export interface Node {
    id: string;
    type: string;
    position: Position;
    data: unknown;
}
export interface Edge {
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    label?: string;
}
export interface Position {
    x: number;
    y: number;
}
export interface WorkflowData {
    nodes: Node[];
    edges: Edge[];
}
export interface NodeData {
    label: string;
    inputs?: string[];
    outputs?: string[];
    config?: Record<string, unknown>;
}
export interface WorkflowContextType {
    workflow: WorkflowData;
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    setWorkflow: (workflow: WorkflowData) => void;
    addNode: (node: Node) => void;
    updateNode: (nodeId: string, data: Partial<Node>) => void;
    removeNode: (nodeId: string) => void;
    addEdge: (edge: Edge) => void;
    updateEdge: (edgeId: string, data: Partial<Edge>) => void;
    removeEdge: (edgeId: string) => void;
    selectNode: (node: Node | null) => void;
    selectEdge: (edge: Edge | null) => void;
}
