import { LoggingService } from '../../services/LoggingService';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    status: 'draft' | 'active' | 'inactive' | 'deprecated';
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    variables: Record<string, WorkflowVariable>;
    timeout: number;
    retry_policy: RetryPolicy;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    tags: string[];
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'task' | 'condition' | 'parallel' | 'sequential' | 'loop' | 'delay' | 'webhook' | 'script';
    agent_id?: string;
    action: string;
    inputs: Record<string, any>;
    outputs: Record<string, string>;
    conditions?: WorkflowCondition[];
    dependencies: string[];
    timeout: number;
    retry_attempts: number;
    error_handling: 'stop' | 'continue' | 'retry' | 'fallback';
    fallback_step?: string;
}
export interface WorkflowTrigger {
    id: string;
    type: 'manual' | 'schedule' | 'event' | 'webhook' | 'file_watch' | 'api_call';
    config: Record<string, any>;
    enabled: boolean;
    conditions?: WorkflowCondition[];
}
export interface WorkflowVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    default_value?: any;
    required: boolean;
    description: string;
}
export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'exists';
    value: any;
    logical_operator?: 'and' | 'or';
}
export interface RetryPolicy {
    max_attempts: number;
    delay: number;
    backoff_multiplier: number;
    max_delay: number;
}
export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    progress: number;
    current_step: string;
    variables: Record<string, any>;
    step_executions: StepExecution[];
    started_at: Date;
    completed_at?: Date;
    duration?: number;
    triggered_by: string;
    trigger_data?: any;
    error_message?: string;
    execution_log: ExecutionLogEntry[];
}
export interface StepExecution {
    step_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retry';
    started_at?: Date;
    completed_at?: Date;
    duration?: number;
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    error_message?: string;
    retry_count: number;
    agent_id?: string;
}
export interface ExecutionLogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    step_id?: string;
    data?: any;
}
export interface WorkflowOrchestratorStats {
    total_workflows: number;
    active_workflows: number;
    total_executions: number;
    running_executions: number;
    completed_executions: number;
    failed_executions: number;
    average_execution_time: number;
    workflows_by_status: Record<string, number>;
    executions_by_status: Record<string, number>;
}
export declare class WorkflowOrchestratorAgent {
    private readonly logger;
    private workflows;
    private executions;
    private execution_times;
    private processing_queue;
    private processing_interval?;
    constructor(logger: LoggingService);
    createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowDefinition>;
    updateWorkflow(id: string, updates: Partial<Omit<WorkflowDefinition, 'id' | 'created_at'>>): Promise<WorkflowDefinition | null>;
    deleteWorkflow(id: string): Promise<boolean>;
    workflow_id: any;
    status: 'pending';
    progress: 0;
    current_step: '';
    variables: {};
    workflow: any;
    variables: {};
    variables: {};
}
export default WorkflowOrchestratorAgent;
//# sourceMappingURL=workflow-orchestrator.d.ts.map