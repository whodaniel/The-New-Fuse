import { LoggingService } from '../../services/LoggingService';
export interface ProcessDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    status: 'draft' | 'active' | 'inactive' | 'deprecated';
    process_type: 'linear' | 'parallel' | 'conditional' | 'event_driven' | 'state_machine';
    stages: ProcessStage[];
    variables: Record<string, ProcessVariable>;
    rules: ProcessRule[];
    permissions: ProcessPermissions;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    tags: string[];
    sla_config?: SLAConfig;
}
export interface ProcessStage {
    id: string;
    name: string;
    type: 'manual' | 'automated' | 'approval' | 'review' | 'notification' | 'decision' | 'parallel_gateway' | 'merge_gateway';
    description: string;
    assignee_type: 'user' | 'role' | 'agent' | 'system';
    assignees: string[];
    actions: ProcessAction[];
    form_schema?: FormSchema;
    completion_criteria: CompletionCriteria;
    timeout_config?: TimeoutConfig;
    next_stages: string[];
    escalation_rules?: EscalationRule[];
    position: {
        x: number;
        y: number;
    };
}
export interface ProcessAction {
    id: string;
    name: string;
    type: 'approve' | 'reject' | 'complete' | 'reassign' | 'escalate' | 'comment' | 'request_info';
    label: string;
    requires_comment: boolean;
    next_stage?: string;
    conditions?: ProcessCondition[];
}
export interface ProcessVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'file' | 'object';
    required: boolean;
    default_value?: any;
    validation_rules?: ValidationRule[];
    description: string;
}
export interface ProcessRule {
    id: string;
    name: string;
    type: 'routing' | 'validation' | 'assignment' | 'notification' | 'escalation';
    conditions: ProcessCondition[];
    actions: RuleAction[];
    priority: number;
    enabled: boolean;
}
export interface ProcessCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'regex' | 'exists';
    value: any;
    logical_operator?: 'and' | 'or';
}
export interface RuleAction {
    type: 'route_to_stage' | 'assign_to_user' | 'send_notification' | 'set_variable' | 'escalate' | 'pause' | 'abort';
    parameters: Record<string, any>;
}
export interface ProcessPermissions {
    view: string[];
    edit: string[];
    delete: string[];
    execute: string[];
    admin: string[];
}
export interface SLAConfig {
    enabled: boolean;
    target_completion_time: number;
    warning_threshold: number;
    escalation_threshold: number;
    business_hours_only: boolean;
    business_hours: BusinessHours;
}
export interface BusinessHours {
    timezone: string;
    days: {
        monday: {
            start: string;
            end: string;
            enabled: boolean;
        };
        tuesday: {
            start: string;
            end: string;
            enabled: boolean;
        };
        wednesday: {
            start: string;
            end: string;
            enabled: boolean;
        };
        thursday: {
            start: string;
            end: string;
            enabled: boolean;
        };
        friday: {
            start: string;
            end: string;
            enabled: boolean;
        };
        saturday: {
            start: string;
            end: string;
            enabled: boolean;
        };
        sunday: {
            start: string;
            end: string;
            enabled: boolean;
        };
    };
    holidays: Date[];
}
export interface ProcessInstance {
    id: string;
    process_id: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled' | 'failed' | 'paused';
    current_stage: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    variables: Record<string, any>;
    stage_instances: StageInstance[];
    started_by: string;
    started_at: Date;
    completed_at?: Date;
    duration?: number;
    sla_status?: 'on_track' | 'at_risk' | 'overdue';
    sla_deadline?: Date;
    process_log: ProcessLogEntry[];
    attachments: ProcessAttachment[];
}
export interface StageInstance {
    id: string;
    stage_id: string;
    status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed' | 'cancelled';
    assigned_to: string[];
    started_at?: Date;
    completed_at?: Date;
    duration?: number;
    action_taken?: ProcessAction;
    comments: StageComment[];
    form_data?: Record<string, any>;
    escalation_level: number;
}
export interface StageComment {
    id: string;
    user_id: string;
    message: string;
    timestamp: Date;
    action_type?: string;
}
export interface ProcessLogEntry {
    timestamp: Date;
    event_type: 'started' | 'stage_entered' | 'stage_completed' | 'assigned' | 'escalated' | 'completed' | 'cancelled' | 'failed';
    stage_id?: string;
    user_id?: string;
    details: string;
    metadata?: Record<string, any>;
}
export interface ProcessAttachment {
    id: string;
    filename: string;
    file_size: number;
    mime_type: string;
    uploaded_by: string;
    uploaded_at: Date;
    stage_id?: string;
}
export interface FormSchema {
    fields: FormField[];
    layout: FormLayout;
    validation_rules: ValidationRule[];
}
export interface FormField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'email' | 'date' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'file';
    label: string;
    required: boolean;
    placeholder?: string;
    help_text?: string;
    options?: {
        value: string;
        label: string;
    }[];
    validation?: FieldValidation;
}
export interface FormLayout {
    sections: FormSection[];
    columns: number;
}
export interface FormSection {
    title: string;
    fields: string[];
    collapsible: boolean;
}
export interface FieldValidation {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    custom_rules?: string[];
}
export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
    parameters?: any;
}
export interface CompletionCriteria {
    type: 'all_assignees' | 'any_assignee' | 'majority' | 'custom';
    minimum_approvals?: number;
    custom_logic?: string;
}
export interface TimeoutConfig {
    enabled: boolean;
    duration: number;
    action: 'escalate' | 'auto_approve' | 'auto_reject' | 'reassign' | 'pause';
    parameters?: Record<string, any>;
}
export interface EscalationRule {
    trigger_after: number;
    escalate_to: string[];
    notification_template?: string;
    automatic_action?: string;
}
export interface ProcessManagerStats {
    total_processes: number;
    active_processes: number;
    total_instances: number;
    active_instances: number;
    completed_instances: number;
    failed_instances: number;
    average_completion_time: number;
    sla_compliance_rate: number;
    processes_by_type: Record<string, number>;
    instances_by_status: Record<string, number>;
    instances_by_priority: Record<string, number>;
}
export declare class ProcessManagerAgent {
    private readonly logger;
    private processes;
    private instances;
    private completion_times;
    private monitoring_interval?;
    constructor(logger: LoggingService);
    createProcess(definition: Omit<ProcessDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessDefinition>;
    updateProcess(id: string, updates: Partial<Omit<ProcessDefinition, 'id' | 'created_at'>>): Promise<ProcessDefinition | null>;
    deleteProcess(id: string): Promise<boolean>;
    _$: any;
}
//# sourceMappingURL=process-manager.d.ts.map