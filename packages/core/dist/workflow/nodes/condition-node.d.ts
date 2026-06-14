export interface ConditionConfig {
    condition: string;
    trueBranch?: string;
    falseBranch?: string;
}
export interface WorkflowStep {
    id: string;
    config: any;
}
export interface WorkflowContext {
    variables: Record<string, any>;
    stepResults: Record<string, any>;
}
export declare class ConditionNode {
    execute(config: ConditionConfig, context: WorkflowContext): Promise<{
        nextStep?: string;
        result: boolean;
    }>;
    private evaluateCondition;
}
//# sourceMappingURL=condition-node.d.ts.map