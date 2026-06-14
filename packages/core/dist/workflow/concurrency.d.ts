export interface WorkflowTemplate {
    id: string;
    name: string;
    concurrencyPolicy: 'queue' | 'merge' | 'reject';
    priority?: 'high' | 'normal' | 'low';
}
export interface WorkflowExecutionContext {
    workflowId: string;
    priority: 'high' | 'normal' | 'low';
    timestamp: Date;
}
export declare class ConcurrencyManager {
    private activeWorkflows;
    canExecute(template: WorkflowTemplate): boolean;
    startExecution(template: WorkflowTemplate, context: WorkflowExecutionContext): void;
    endExecution(templateId: string): void;
    getActiveExecutions(): WorkflowExecutionContext[];
}
export declare class ConcurrentExecutionError extends Error {
    constructor(message: string);
}
export declare function createExecutionContext(workflowId: string, priority?: 'high' | 'normal' | 'low'): WorkflowExecutionContext;
//# sourceMappingURL=concurrency.d.ts.map