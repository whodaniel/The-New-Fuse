export interface LLMConfig {
    model: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}
export interface WorkflowStep {
    id: string;
    type: string;
    config: any;
}
export interface WorkflowContext {
    workflowId: string;
    stepId: string;
    data: Record<string, any>;
    metadata: Record<string, any>;
}
export declare class LLMNodeHandler {
    private dependencies;
    constructor(dependencies: any);
    handle(step: WorkflowStep, context: WorkflowContext): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=llm-node.d.ts.map