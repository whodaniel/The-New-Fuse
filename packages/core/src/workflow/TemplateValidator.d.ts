import { WorkflowTemplate } from '@the-new-fuse/types';
export declare class TemplateValidator {
    private rules;
    validate(template: WorkflowTemplate): void;
    private validateTemplate;
    private validateBasicFields;
    private validateSteps;
    private validateDependencies;
    private validateNoCycles;
}
