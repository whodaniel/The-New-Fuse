export interface WorkflowTask {
    id: string;
    name: string;
    type: 'data_processing' | 'ml_inference' | 'api_call' | 'notification' | 'validation' | 'transformation' | 'custom';
    dependencies?: string[];
    config: any;
    retryPolicy?: RetryPolicy;
    timeout?: number;
}
export interface RetryPolicy {
    maxRetries: number;
    delayMs: number;
    exponentialBackoff?: boolean;
    retryOnErrors?: string[];
}
export interface WorkflowMetadata {
    version: string;
    author?: string;
    description?: string;
    tags?: string[];
    created: Date;
    lastModified: Date;
}
export interface WorkflowConfig {
    maxConcurrentTasks?: number;
    defaultTimeout?: number;
    retryPolicy?: RetryPolicy;
    notificationConfig?: NotificationConfig;
}
export interface NotificationConfig {
    enabled: boolean;
    endpoints: string[];
    events: ('started' | 'completed' | 'failed' | 'cancelled')[];
}
export interface AgentWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: WorkflowTask[];
    metadata: WorkflowMetadata;
    config?: WorkflowConfig;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class WorkflowValidator {
    private readonly logger;
    validateWorkflow(workflow: AgentWorkflow): ValidationResult;
    private validateBasicStructure;
    private validateTasks;
    private validateDependencies;
    private detectCircularDependencies;
    private validateConfiguration;
    private validateRetryPolicy;
    private validateNotificationConfig;
    private validateMetadata;
}
//# sourceMappingURL=WorkflowValidator.d.ts.map