import { LoggingService } from '../../services/LoggingService';
export interface ScheduledTask {
    id: string;
    name: string;
    description: string;
    type: 'one_time' | 'recurring' | 'cron' | 'interval';
    status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
    schedule_config: ScheduleConfig;
    task_config: TaskConfig;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    last_executed?: Date;
    next_execution: Date;
    execution_count: number;
    success_count: number;
    failure_count: number;
    tags: string[];
    timeout: number;
    retry_policy: TaskRetryPolicy;
    notifications: NotificationConfig[];
}
export interface ScheduleConfig {
    execute_at?: Date;
    frequency?: 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    cron_expression?: string;
    timezone?: string;
    start_date?: Date;
    end_date?: Date;
    max_executions?: number;
    days_of_week?: number[];
    days_of_month?: number[];
    hours?: number[];
    minutes?: number[];
}
export interface TaskConfig {
    type: 'workflow' | 'agent_action' | 'webhook' | 'script' | 'database_query' | 'file_operation' | 'email' | 'api_call';
    target: string;
    action?: string;
    parameters: Record<string, any>;
    environment_variables?: Record<string, string>;
    working_directory?: string;
    expected_duration?: number;
}
export interface TaskRetryPolicy {
    enabled: boolean;
    max_attempts: number;
    delay: number;
    backoff_strategy: 'fixed' | 'linear' | 'exponential';
    backoff_multiplier: number;
    max_delay: number;
    retry_on_failure_only: boolean;
}
export interface NotificationConfig {
    type: 'email' | 'webhook' | 'slack' | 'teams' | 'sms';
    target: string;
    events: ('started' | 'completed' | 'failed' | 'cancelled' | 'retry')[];
    template?: string;
    enabled: boolean;
}
export interface TaskExecution {
    id: string;
    task_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
    scheduled_at: Date;
    started_at?: Date;
    completed_at?: Date;
    duration?: number;
    attempt_number: number;
    output?: any;
    error_message?: string;
    logs: ExecutionLog[];
    resource_usage?: ResourceUsage;
}
export interface ExecutionLog {
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}
export interface ResourceUsage {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
}
export interface TaskSchedulerStats {
    total_tasks: number;
    active_tasks: number;
    paused_tasks: number;
    total_executions: number;
    pending_executions: number;
    running_executions: number;
    completed_executions: number;
    failed_executions: number;
    average_execution_time: number;
    tasks_by_type: Record<string, number>;
    tasks_by_status: Record<string, number>;
    next_24h_executions: number;
}
export declare class TaskSchedulerAgent {
    private readonly logger;
    private tasks;
    private executions;
    private execution_times;
    private scheduler_interval?;
    private cleanup_interval?;
    constructor(logger: LoggingService);
    createTask(task_data: Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_count' | 'failure_count' | 'next_execution'>): Promise<ScheduledTask>;
    updateTask(id: string, updates: Partial<Omit<ScheduledTask, 'id' | 'created_at' | 'execution_count' | 'success_count' | 'failure_count'>>): Promise<ScheduledTask | null>;
    deleteTask(id: string): Promise<boolean>;
    executeTaskNow(id: string): Promise<string>;
    _$: any;
}
export default TaskSchedulerAgent;
//# sourceMappingURL=task-scheduler.d.ts.map