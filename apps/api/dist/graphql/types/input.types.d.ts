export declare class CreateAgentInput {
    name: string;
    type: string;
    description?: string;
    capabilities?: string[];
    config?: string;
}
export declare class UpdateAgentInput {
    id: string;
    name?: string;
    description?: string;
    capabilities?: string[];
    isActive?: boolean;
}
export declare class ExecuteWorkflowInput {
    workflowId: string;
    variables?: string;
    async?: boolean;
}
export declare class CreateWorkflowInput {
    name: string;
    description?: string;
    variables?: string;
    triggers?: string;
}
//# sourceMappingURL=input.types.d.ts.map