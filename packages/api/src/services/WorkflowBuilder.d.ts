interface WorkflowModel {
    id: string;
    name: string;
    description?: string;
    status: string;
    [key: string]: any;
}
interface WorkflowStepDefinition {
    id: string;
    name: string;
    type: string;
    [key: string]: any;
}
interface WorkflowCondition {
    nextStepId: string;
    expression: string;
}
type WorkflowDefinition = WorkflowModel;
type WorkflowStep = WorkflowStepDefinition;
/**
 * A builder class for creating workflow definitions
 */
export declare class WorkflowBuilder {
    private id;
    private name;
    private description?;
    private steps;
    constructor(id: string, name: string, description?: string);
    /**
     * Add a step to the workflow
     */
    addStep(step: WorkflowStep): void;
    /**
     * Remove a step from the workflow
     */
    removeStep(stepId: string): void;
    /**
     * Update an existing step in the workflow
     */
    updateStep(stepId: string, updatedStep: WorkflowStep): void;
    /**
     * Add a condition to a step
     */
    addCondition(stepId: string, condition: WorkflowCondition): void;
    /**
     * Add a nested workflow as a step
     */
    addSubWorkflowStep(subWorkflow: WorkflowDefinition, stepId: string, name?: string): void;
    /**
     * Build the workflow definition
     */
    build(): WorkflowDefinition;
    /**
     * Export the workflow as JSON
     */
    toJSON(): string;
    /**
     * Import a workflow from JSON
     */
    static fromJSON(json: string): WorkflowBuilder;
    /**
     * Validate the workflow for correctness
     */
    validate(): string[];
}
export {};
//# sourceMappingURL=WorkflowBuilder.d.ts.map