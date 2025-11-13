import { LoggingService } from '../services/LoggingService';
import { MetricsService } from '../monitoring/MetricsService';
export interface Task {
    id: string;
    name: string;
    type: 'immediate' | 'scheduled' | 'recurring' | 'dependent';
    payload: any;
    priority: 'low' | 'normal' | 'high' | 'critical';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    dependencies: string[];
    schedule?: {
        type: 'once' | 'interval' | 'cron';
        start_time?: Date;
        interval_ms?: number;
        cron_expression?: string;
        end_time?: Date;
    };
    execution_config: {
        timeout_ms: number;
        max_retries: number;
        retry_delay_ms: number;
        retry_backoff_multiplier: number;
    };
    created_at: Date;
    scheduled_at?: Date;
    started_at?: Date;
    completed_at?: Date;
    last_run_at?: Date;
    next_run_at?: Date;
    attempt_count: number;
    error_message?: string;
    result?: any;
    metadata: Record<string, any>;
}
export interface TaskExecution {
    id: string;
    task_id: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    started_at: Date;
    completed_at?: Date;
    execution_time_ms?: number;
    error_message?: string;
    result?: any;
    attempt_number: number;
    worker_id?: string;
    resource_usage: {
        cpu_percent?: number;
        memory_mb?: number;
        disk_io_mb?: number;
    };
}
export interface TaskTemplate {
    id: string;
    name: string;
    description: string;
    default_config: Partial<Task>;
    parameter_schema: Record<string, any>;
    validation_rules: string[];
    is_public: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface TaskDependency {
    task_id: string;
    depends_on: string;
    dependency_type: 'success' | 'completion' | 'failure';
    wait_for_result: boolean;
    timeout_ms?: number;
}
export interface TaskWorker {
    id: string;
    name: string;
    status: 'idle' | 'busy' | 'paused' | 'stopped' | 'error';
    capabilities: string[];
    max_concurrent_tasks: number;
    current_tasks: string[];
    total_tasks_processed: number;
    total_tasks_failed: number;
    last_heartbeat: Date;
    created_at: Date;
    metadata: Record<string, any>;
}
export interface TaskQueueMetrics {
    total_tasks: number;
    pending_tasks: number;
    running_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    cancelled_tasks: number;
    scheduled_tasks: number;
    workers_active: number;
    workers_idle: number;
    average_execution_time_ms: number;
    average_wait_time_ms: number;
    success_rate: number;
    throughput_per_minute: number;
    oldest_pending_task?: Date;
    resource_utilization: {
        cpu_percent: number;
        memory_percent: number;
        queue_capacity_percent: number;
    };
    last_updated: Date;
}
export type TaskHandler = (task: Task, execution: TaskExecution) => Promise<any>;
export declare class TaskQueue {
    private readonly logger;
    private readonly metricsService;
    private tasks;
    private taskExecutions;
    private taskTemplates;
    private taskDependencies;
    private taskWorkers;
    private taskHandlers;
    private pendingTasks;
    private scheduledTasks;
    private isInitialized;
    private processingInterval?;
    private schedulerInterval?;
    private maxConcurrentTasks;
    constructor(logger: LoggingService, metricsService: MetricsService);
    initialize(): Promise<void>;
    createTask(name: string, type: Task['type'], payload: any, options?: {
        priority?: Task['priority'];
        dependencies?: string[];
        schedule?: Task['schedule'];
        execution_config?: Partial<Task['execution_config']>;
        metadata?: Record<string, any>;
    }): Promise<Task>;
    createTaskTemplate(name: string, description: string, defaultConfig: Partial<Task>, parameterSchema: Record<string, any>, validationRules: string[], isPublic: boolean, createdBy: string): Promise<TaskTemplate>;
    name: any;
    description: any;
    default_config: defaultConfig;
    parameter_schema: parameterSchema;
    validation_rules: validationRules;
    is_public: isPublic;
    created_by: createdBy;
    created_at: new () => Date;
    updated_at: new () => Date;
}
export default TaskQueue;
//# sourceMappingURL=TaskQueue.d.ts.map