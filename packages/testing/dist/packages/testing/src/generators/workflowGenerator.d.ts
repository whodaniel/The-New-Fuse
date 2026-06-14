import type { GeneratedUser } from './userGenerator';
export interface GenerateWorkflowOptions {
    nodeCount?: number;
    edgeCount?: number;
    withMetadata?: boolean;
    withVariables?: boolean;
    creator?: GeneratedUser;
}
export interface WorkflowNode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        inputs?: string[];
        outputs?: string[];
        config?: Record<string, any>;
    };
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    label?: string;
}
export interface GeneratedWorkflow {
    id: string;
    name: string;
    description?: string;
    creator?: GeneratedUser;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    metadata: Record<string, any>;
    isActive: boolean;
    variables: Record<string, any>;
    triggers: Record<string, any>[];
    createdAt: Date;
    updatedAt: Date;
    lastExecutedAt?: Date;
    executionCount: number;
    statistics: {
        averageExecutionTime?: number;
        successRate?: number;
        lastExecutionStatus?: string;
    };
}
export declare const generateWorkflow: (options?: GenerateWorkflowOptions) => GeneratedWorkflow;
export declare const generateWorkflows: (count: number, options?: GenerateWorkflowOptions) => GeneratedWorkflow[];
//# sourceMappingURL=workflowGenerator.d.ts.map