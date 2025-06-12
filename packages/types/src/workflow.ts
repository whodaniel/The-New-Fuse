import { BaseEntity } from './core/base-types';

export enum WorkflowStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED", 
  COMPLETED = "COMPLETED",
  ERROR = "ERROR"
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: unknown;
  order: number;
}

export interface WorkflowDefinition extends BaseEntity {
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
}

export interface WorkflowInstance extends BaseEntity {
  definitionId: string;
  status: WorkflowStatus;
  currentStep?: string;
  context?: unknown;
}

export interface CreateWorkflowDefinitionDto {
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id'>[];
}

export interface UpdateWorkflowDefinitionDto {
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
  status?: WorkflowStatus;
}

export interface StartWorkflowInstanceDto {
  definitionId: string;
  context?: unknown;
}

export interface WorkflowService {
  create(dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
  update(id: string, dto: UpdateWorkflowDefinitionDto): Promise<WorkflowDefinition>;
  start(dto: StartWorkflowInstanceDto): Promise<WorkflowInstance>;
}
