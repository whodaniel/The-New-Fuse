export interface NotificationConfig {
    type: 'email' | 'slack' | 'webhook';
    recipient: string;
    message: string;
    subject?: string;
    metadata?: Record<string, any>;
}
export interface WorkflowStep {
    id: string;
    type: string;
    config: any;
}
export interface WorkflowContext {
    workflowId: string;
    stepId: string;
    data: Record<string, any>;
    metadata: Record<string, any>;
}
export declare class NotificationNodeHandler {
    private dependencies;
    constructor(dependencies: any);
    handle(step: WorkflowStep, context: WorkflowContext): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
//# sourceMappingURL=notification-node.d.ts.map