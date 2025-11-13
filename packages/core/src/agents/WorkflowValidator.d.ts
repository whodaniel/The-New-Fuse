import { Workflow, WorkflowStep } from './agent-orchestrator';
export interface ValidationError {
    type: 'error' | 'warning';
    code: string;
    message: string;
    stepId?: string;
    field?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}
export declare class WorkflowValidator {
    /**
     * Validate a complete workflow
     */
    validateWorkflow(workflow: Workflow): ValidationResult;
    /**
     * Validate just the workflow steps
     */
    validateWorkflowSteps(steps: WorkflowStep[]): ValidationResult;
    /**
     * Check if workflow can be executed with current agent capabilities
     */
    validateExecutability(workflow: Workflow, availableCapabilities: string[]): ValidationResult;
    /**
     * Validate step dependencies
     */
    private validateDependencies;
    const circularDeps: any;
    for(: any, cycle: any, of: any, circularDeps: any): void;
}
//# sourceMappingURL=WorkflowValidator.d.ts.map