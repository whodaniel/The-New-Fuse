import { WorkflowTemplate, WorkflowStep } from '../types.js';
export declare class WorkflowTemplateManager {
    private templates;
    constructor();
    private initializeDefaultTemplates;
    registerTemplate(template: WorkflowTemplate): void;
    getTemplate(templateId: string): WorkflowTemplate | undefined;
    getAllTemplates(): WorkflowTemplate[];
    createWorkflowFromTemplate(templateId: string, steps: WorkflowStep[]): unknown;
}
