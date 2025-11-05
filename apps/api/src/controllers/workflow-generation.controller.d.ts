declare class PlannerOutputDto {
    steps: {
        step: number;
        task: string;
        agentId: string;
        reasoning: string;
    }[];
}
declare class WorkflowDto {
    nodes: any[];
    edges: any[];
}
export declare class WorkflowGenerationController {
    generateWorkflowFromPlan(plannerOutput: PlannerOutputDto): WorkflowDto;
}
export {};
//# sourceMappingURL=workflow-generation.controller.d.ts.map