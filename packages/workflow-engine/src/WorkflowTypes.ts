/**
 * Workflow Engine Types - The New Fuse
 *
 * This file is the single, authoritative source for all workflow-related data structures.
 * It integrates with the Prisma database schema and the Master Agent Registry.
 */

import type { ResourceRequirement } from '@the-new-fuse/mcp-core';
// import { AgentType, TaskPriority, TaskStatus } from '@the-new-fuse/database';

// Define local types to replace database imports
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ------------------- Core Workflow Enums -------------------

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
  DEPRECATED = 'DEPRECATED',
}

export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  PAUSED = 'PAUSED',
}

export enum TriggerType {
  MANUAL = 'MANUAL',
  SCHEDULE = 'SCHEDULE',
  WEBHOOK = 'WEBHOOK',
  EVENT = 'EVENT',
}

export enum StepType {
  TASK = 'TASK',
  SUB_WORKFLOW = 'SUB_WORKFLOW',
  CONDITION = 'CONDITION',
  ITERATION = 'ITERATION',
  START = 'START',
  END = 'END',
  A2A_HANDOFF = 'A2A_HANDOFF',
  NOTIFICATION = 'NOTIFICATION',
}

// ------------------- Workflow Definition -------------------

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

  // Execution graph
  steps: WorkflowStep[];
  edges: WorkflowEdge[];

  // Trigger and input schema
  trigger: WorkflowTrigger;
  inputSchema: Record<string, any>;

  // Configuration
  defaultPriority: TaskPriority;
  maxRetries: number;
  timeoutSeconds: number;
}

export interface WorkflowStep {
  id: string; // Unique within the workflow
  type: StepType;
  name: string;
  description?: string;

  // Task-specific details
  task?: TaskDetails;

  // Sub-workflow details
  subWorkflowId?: string;

  // Conditional logic
  condition?: string; // e.g., "outputs.step1.result === 'success'"

  // Iteration logic
  iteration?: IterationDetails;

  // A2A Handoff details
  a2aHandoff?: A2AHandoffDetails;

  // Notification details
  notification?: NotificationDetails;

  // Agent assignment
  assignee: StepAssignee;

  // Input/Output mapping
  inputs: Record<string, any>; // e.g., { "url": "workflow.inputs.targetUrl" }
  outputs: Record<string, any>;

  // Error handling and retry strategy
  retryStrategy?: RetryStrategy;

  // UI position for the builder
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  condition?: string; // e.g., "outputs.step1.status === 'COMPLETED'"
}

export interface WorkflowTrigger {
  type: TriggerType;
  config: ScheduleTriggerConfig | WebhookTriggerConfig | EventTriggerConfig | {};
}

// ------------------- Step-Specific Details -------------------

export interface TaskDetails {
  action: string; // e.g., "browse_web", "run_shell_command", "analyze_data"
  params: Record<string, any>;
}

export interface IterationDetails {
  collection: string; // e.g., "workflow.inputs.urls"
  itemVariable: string; // e.g., "currentUrl"
  concurrency?: number;
}

export interface A2AHandoffDetails {
    // Schema definition for the data to be passed to the next agent
    // Key: target variable name, Value: source path (e.g. "outputs.step1.summary")
    handoffSchema: Record<string, string>;
    // Optional context instructions to be prepended
    contextInstructions?: string;
}

export interface NotificationDetails {
    channelSelector: 'SLACK' | 'EMAIL' | 'WEBHOOK';
    config: NotificationConfig;
    template: string; // Message template (e.g. "Task {{id}} completed with result {{result}}")
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
  value: string; // Agent ID, AgentType, or a role like "WebResearcher"
  fallback?: StepAssignee;
}

export interface RetryStrategy {
  maxAttempts: number;
  delayMs: number;
  backoffFactor?: number;
}

// ------------------- Trigger Configurations -------------------

export interface ScheduleTriggerConfig {
  cron: string; // e.g., "0 0 * * *" for daily at midnight
  timezone?: string;
}

export interface WebhookTriggerConfig {
  url: string; // The New Fuse generates a unique URL for this trigger
  method: 'POST' | 'GET';
  authentication?: {
    type: 'API_KEY' | 'HMAC';
    secret?: string;
  };
}

export interface EventTriggerConfig {
  source: string; // e.g., "MasterAgentRegistry"
  eventName: string; // e.g., "agent_master_registered"
  filter?: Record<string, any>;
}

// ------------------- Workflow Execution (Instance) -------------------

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  workflowVersion: number;
  status: WorkflowStepStatus; // Overall status of the workflow run
  workspaceId?: string; // Isolate user workflows
  projectId?: string; // Isolate ideas in progress
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string; // User ID, "schedule", "webhook", etc.

  // State of each step in the instance
  stepStates: Map<string, WorkflowStepState>;

  // Pending context to be passed to the next agent (from A2A_HANDOFF)
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

// ------------------- Integration with other TNF Systems -------------------

// A task generated by the workflow engine to be executed by an agent
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

  // Context to be added to the agent's system prompt
  context?: string;
}

// Payload for an event that can trigger a workflow
export interface WorkflowEvent {
  source: string;
  eventName: string;
  payload: Record<string, any>;
}
