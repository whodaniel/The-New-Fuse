type Node<T = any> = {
    id: string;
    type: string;
    data: T;
    position: {
        x: number;
        y: number;
    };
};
type Edge = {
    id: string;
    source: string;
    target: string;
    type?: string;
};
export interface CustomNodeData {
    label: string;
    type: string;
    parameters?: Record<string, unknown>;
}
export interface WorkflowData {
    nodes: Array<{
        id: string;
        type: string;
        label: string;
        position?: {
            x: number;
            y: number;
        };
        parameters?: Record<string, unknown>;
    }>;
    edges: Array<{
        source: string;
        target: string;
        label?: string;
    }>;
}
export type FlowNode = Node<CustomNodeData>;
export type FlowEdge = Edge & {
    label?: string;
};
export {};
//# sourceMappingURL=flow.d.d.ts.map