export declare class WorkflowManager {
    constructor(commBus: any);
    createWorkflow(templateName: any, parameters: any): Promise<string>;
    cancelWorkflow(workflowId: any): Promise<boolean>;
    getWorkflowStatus(workflowId: any): any;
    registerTemplate(template: any): void;
    generateWorkflowId(): string;
    startWorkflow(workflowId: any, template: any, parameters: any): Promise<void>;
    executeStep(step: any, parameters: any): Promise<void>;
}
