import { WorkflowStep, ValidationResult } from '../types.js';
export declare class WorkflowValidator {
    validate(steps: WorkflowStep[]): ValidationResult;
    private validateStep;
    private validateAction;
    private validateConditions;
    private validateWorkflowStructure;
}
