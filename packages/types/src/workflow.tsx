import type { Agent } from './agent.js';
import type { Task, TaskStatusType } from './tasks.js';
import type { BaseEntity, UUID, UnknownRecord } from './core/index.js';

/**
 * Represents the status of a workflow step or the overall workflow.
 */
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';

/**
 * Represents a single step within a workflow.
 */
export interface WorkflowStep extends BaseEntity {
  workflowId: UUID;
  name: string;
  description?: string;
  order: number; // Execution order
  type: string; // e.g., 'task', 'decision', 'notification', 'integration'
  config: UnknownRecord; // Step-specific configuration
  status: WorkflowStatus;
  result?: unknown;
  dependsOn?: UUID[]; // IDs of steps that must complete first
  assignedAgentId?: UUID | null; // Agent responsible for this step, if applicable
  relatedTaskId?: UUID | null; // Link to a Task if this step involves one
}

/**
 * Represents a workflow definition.
 */
export interface WorkflowDefinition extends BaseEntity {
  name: string;
  description?: string;
  version: string;
  triggerType: 'manual' | 'event' | 'schedule';
  triggerConfig?: UnknownRecord; // Configuration for the trigger
  steps: WorkflowStep[]; // Ordered list of steps
  initialContext?: UnknownRecord; // Default context data for new instances
  tags?: string[];
}

/**
 * Represents an active or completed instance of a workflow.
 */
export interface WorkflowInstance extends BaseEntity {
  definitionId: UUID;
  definitionVersion: string;
  status: WorkflowStatus;
  currentStepId?: UUID | null;
  context: UnknownRecord; // Runtime data for the instance
  startedAt?: Date | null;
  completedAt?: Date | null;
  error?: string | null;
  stepHistory?: Array<{ stepId: UUID; status: WorkflowStatus; timestamp: Date; result?: unknown }>;
}

/**
 * Data Transfer Object for creating a new workflow definition.
 */
export interface CreateWorkflowDefinitionDto {
  name: string;
  description?: string;
  triggerType: 'manual' | 'event' | 'schedule';
  triggerConfig?: UnknownRecord;
  steps: Array<Omit<WorkflowStep, 'id' | 'workflowId' | 'createdAt' | 'updatedAt' | 'status'>>;
  initialContext?: UnknownRecord;
  tags?: string[];
}

/**
 * Data Transfer Object for starting a new workflow instance.
 */
export interface StartWorkflowInstanceDto {
  definitionId: UUID;
  context?: UnknownRecord; // Override or supplement initial context
}

/**
 * Interface for a service managing workflows.
 */
export interface WorkflowService {
  createDefinition(definitionData: CreateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
  getDefinitionById(definitionId: UUID): Promise<WorkflowDefinition | null>;
  updateDefinition(definitionId: UUID, updates: Partial<CreateWorkflowDefinitionDto>): Promise<WorkflowDefinition | null>;
  deleteDefinition(definitionId: UUID): Promise<boolean>;
  listDefinitions(filter?: Partial<WorkflowDefinition>): Promise<WorkflowDefinition[]>;

  startInstance(startData: StartWorkflowInstanceDto): Promise<WorkflowInstance>;
  getInstanceById(instanceId: UUID): Promise<WorkflowInstance | null>;
  pauseInstance(instanceId: UUID): Promise<WorkflowInstance | null>;
  resumeInstance(instanceId: UUID): Promise<WorkflowInstance | null>;
  cancelInstance(instanceId: UUID): Promise<WorkflowInstance | null>;
  listInstances(filter?: Partial<WorkflowInstance>): Promise<WorkflowInstance[]>;
  getStepResult(instanceId: UUID, stepId: UUID): Promise<unknown>;
}

// Re-export main types
export type { Agent, Task, TaskStatusType };
