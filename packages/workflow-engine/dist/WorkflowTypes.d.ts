/**
 * Workflow Engine Types - The New Fuse
 *
 * This file is the single, authoritative source for all workflow-related data structures.
 * It integrates with the Drizzle database schema and the Master Agent Registry.
 */
import type { ResourceRequirement } from '@the-new-fuse/mcp-core';
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum WorkflowStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    ARCHIVED = "ARCHIVED",
    DEPRECATED = "DEPRECATED"
}
export declare enum WorkflowStepStatus {
    PENDING = "PENDING",
    READY = "READY",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED",
    PAUSED = "PAUSED"
}
export declare enum TriggerType {
    MANUAL = "MANUAL",
    SCHEDULE = "SCHEDULE",
    WEBHOOK = "WEBHOOK",
    EVENT = "EVENT"
}
export declare enum StepType {
    TASK = "TASK",
    SUB_WORKFLOW = "SUB_WORKFLOW",
    CONDITION = "CONDITION",
    ITERATION = "ITERATION",
    START = "START",
    END = "END",
    A2A_HANDOFF = "A2A_HANDOFF",
    NOTIFICATION = "NOTIFICATION"
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: number;
    status: WorkflowStatus;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    tags: string[];
    steps: WorkflowStep[];
    edges: WorkflowEdge[];
    trigger: WorkflowTrigger;
    inputSchema: Record<string, any>;
    defaultPriority: TaskPriority;
    maxRetries: number;
    timeoutSeconds: number;
}
export interface WorkflowStep {
    id: string;
    type: StepType;
    name: string;
    description?: string;
    task?: TaskDetails;
    subWorkflowId?: string;
    condition?: string;
    iteration?: IterationDetails;
    a2aHandoff?: A2AHandoffDetails;
    notification?: NotificationDetails;
    assignee: StepAssignee;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    retryStrategy?: RetryStrategy;
    position: {
        x: number;
        y: number;
    };
}
export interface WorkflowEdge {
    id: string;
    sourceStepId: string;
    targetStepId: string;
    condition?: string;
}
export interface WorkflowTrigger {
    type: TriggerType;
    config: ScheduleTriggerConfig | WebhookTriggerConfig | EventTriggerConfig | {};
}
export interface TaskDetails {
    action: string;
    params: Record<string, any>;
}
export interface IterationDetails {
    collection: string;
    itemVariable: string;
    concurrency?: number;
}
export interface A2AHandoffDetails {
    handoffSchema: Record<string, string>;
    contextInstructions?: string;
}
export interface NotificationDetails {
    channelSelector: 'SLACK' | 'EMAIL' | 'WEBHOOK';
    config: NotificationConfig;
    template: string;
}
export type NotificationConfig = SlackConfig | EmailConfig | WebhookConfig;
export interface SlackConfig {
    channelId: string;
    messageType?: 'text' | 'block';
}
export interface EmailConfig {
    recipientEmail: string;
    subject?: string;
    cc?: string[];
}
export interface WebhookConfig {
    url: string;
    method: 'POST' | 'PUT' | 'GET';
    headers?: Record<string, string>;
}
export interface StepAssignee {
    type: 'AGENT_ID' | 'AGENT_TYPE' | 'ROLE';
    value: string;
    fallback?: StepAssignee;
}
export interface RetryStrategy {
    maxAttempts: number;
    delayMs: number;
    backoffFactor?: number;
}
export interface ScheduleTriggerConfig {
    cron: string;
    timezone?: string;
}
export interface WebhookTriggerConfig {
    url: string;
    method: 'POST' | 'GET';
    authentication?: {
        type: 'API_KEY' | 'HMAC';
        secret?: string;
    };
}
export interface EventTriggerConfig {
    source: string;
    eventName: string;
    filter?: Record<string, any>;
}
export interface WorkflowInstance {
    id: string;
    workflowDefinitionId: string;
    workflowVersion: number;
    status: WorkflowStepStatus;
    workspaceId?: string;
    projectId?: string;
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    startedAt: Date;
    completedAt?: Date;
    triggeredBy: string;
    stepStates: Map<string, WorkflowStepState>;
    pendingContext?: string;
}
export interface WorkflowStepState {
    stepId: string;
    status: WorkflowStepStatus;
    startedAt?: Date;
    completedAt?: Date;
    attempt: number;
    inputs: Record<string, any>;
    outputs?: Record<string, any>;
    error?: string;
    logs: string[];
    assignedAgentId?: string;
}
export interface WorkflowTask {
    id: string;
    workflowInstanceId: string;
    workflowStepId: string;
    title: string;
    description: string;
    action: string;
    params: Record<string, any>;
    resourceRequirements?: ResourceRequirement[];
    priority: TaskPriority;
    status: TaskStatus;
    assignedAgentId?: string;
    createdAt: Date;
    updatedAt: Date;
    context?: string;
}
export interface WorkflowEvent {
    source: string;
    eventName: string;
    payload: Record<string, any>;
}
//# sourceMappingURL=WorkflowTypes.d.ts.map