import { Position } from 'reactflow';
interface WorkflowNode {
    id: string;
    type: string;
    position: Position;
    data: {
        label: string;
        type: string;
        inputs: string[];
        outputs: string[];
    };
}
interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    type: 'conditional' | 'default';
    data?: {
        condition?: string;
    };
}
export declare const createNode: (type: string, position: Position, label: string) => WorkflowNode;
export declare const createEdge: (source: string, target: string, condition?: string) => WorkflowEdge;
export declare const validateWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    isValid: boolean;
    errors: string[];
};
export declare const optimizeWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
};
interface WorkflowExport {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    metadata: {
        version: string;
        created: string;
        modified: string;
    };
}
export declare const exportWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => WorkflowExport;
export declare const importWorkflow: (workflow: WorkflowExport) => {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
};
export {};
