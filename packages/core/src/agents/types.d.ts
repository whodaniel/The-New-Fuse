export interface AgentWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: WorkflowTask[];
    metadata: WorkflowMetadata;
    configuration: WorkflowConfiguration;
}
export interface WorkflowTask {
    id: string;
    type: TaskType;
    name: string;
    description?: string;
    dependencies: string[];
    configuration: TaskConfiguration;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}
export interface WorkflowState {
    workflow: AgentWorkflow;
    status: WorkflowStatus;
    startTime: number;
    endTime?: number;
    completedTasks: number;
    errors?: WorkflowError[];
}
export interface TaskConfiguration {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    requirements: TaskRequirements;
    constraints?: TaskConstraints;
}
export interface WorkflowMetadata {
    version: string;
    creator: string;
    createdAt: number;
    tags?: string[];
    priority: low' | 'medium' | 'high';
}
export interface WorkflowConfiguration {
    maxConcurrentTasks: number;
    timeout: number;
    retryPolicy: RetryPolicy;
    notificationConfig?: NotificationConfig;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
}
export interface TaskRequirements {
    memory?: number;
    cpu?: number;
    gpu?: boolean;
    capabilities: string[];
}
export interface TaskConstraints {
    timeout?: number;
    maxRetries?: number;
    dependencies?: string[];
}
export interface WorkflowError {
    taskId?: string;
    errorCode: string;
    message: string;
    timestamp: number;
    context?: Record<string, unknown>;
}
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
export type TaskType = 'data_processing' | 'ml_inference' | 'api_call' | 'notification' | 'validation' | 'transformation';
export interface NotificationConfig {
    endpoints: string[];
    events: ('start' | 'complete' | 'fail' | 'pause')[];
    format: json' | 'plain';
}
