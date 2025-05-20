export declare class WorkflowValidator {
    private nodeTypes;
    constructor(nodeTypes: any[]);
    validate(nodes: any[], edges: any[]): string[];
}
