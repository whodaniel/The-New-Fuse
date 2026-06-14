import { WorkflowTemplate, WorkflowStep } from '../types/types.js';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare class WorkflowValidator {
    validateTemplate(template: WorkflowTemplate): ValidationResult;
    validateStep(step: WorkflowStep): ValidationResult;
    private validateDependencies;
}
//# sourceMappingURL=validator.d.ts.map