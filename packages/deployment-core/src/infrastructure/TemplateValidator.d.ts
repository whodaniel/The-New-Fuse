/**
 * Template Validator
 * Validates infrastructure templates for correctness and best practices
 */
import { InfrastructureTemplate, ErrorSeverity } from '../types/infrastructure';
export interface ValidationRule {
    name: string;
    description: string;
    severity: ErrorSeverity;
    validate(template: InfrastructureTemplate): ValidationIssue[];
}
export interface ValidationIssue {
    rule: string;
    severity: ErrorSeverity;
    message: string;
    path: string;
    suggestion?: string;
}
export interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    suggestions: ValidationIssue[];
}
export declare class TemplateValidator {
    private rules;
    private customRules;
    constructor();
    validate(template: InfrastructureTemplate): Promise<ValidationResult>;
}
//# sourceMappingURL=TemplateValidator.d.ts.map