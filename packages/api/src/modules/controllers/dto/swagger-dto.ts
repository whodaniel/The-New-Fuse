/**
 * Swagger-compatible class versions of our types
 * These are needed because Swagger can't use interfaces/types directly as decorators,
 * they must be classes.
 */

import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStatus } from '@the-new-fuse/types';

/**
 * Swagger documentation class for Workflow (WorkflowDefinition)
 */
export class WorkflowDto {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Workflow name' })
  name!: string;

  @ApiProperty({ description: 'Workflow description', required: false })
  description?: string;

  @ApiProperty({ description: 'Workflow version' })
  version!: string;

  @ApiProperty({
    description: 'Trigger type',
    enum: ['manual', 'event', 'schedule'],
    example: 'manual'
  })
  triggerType!: 'manual' | 'event' | 'schedule';

  @ApiProperty({ description: 'Trigger configuration', required: false })
  triggerConfig?: Record<string, any>;

  @ApiProperty({ description: 'Workflow steps', type: 'array', items: { type: 'object' } })
  steps!: any[];

  @ApiProperty({ description: 'Initial context', required: false })
  initialContext?: Record<string, any>;

  @ApiProperty({ description: 'Tags', required: false, type: 'array', items: { type: 'string' } })
  tags?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Deletion timestamp', required: false })
  deletedAt?: Date;
}

/**
 * Swagger documentation class for WorkflowExecution (WorkflowInstance)
 */
export class WorkflowExecutionDto {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Workflow definition identifier' })
  definitionId!: string;

  @ApiProperty({ description: 'Workflow definition version' })
  definitionVersion!: string;

  @ApiProperty({
    description: 'Execution status',
    enum: ['pending', 'running', 'completed', 'failed', 'paused', 'cancelled'],
    example: 'running'
  })
  status!: WorkflowStatus;

  @ApiProperty({ description: 'Current step ID', required: false })
  currentStepId?: string | null;

  @ApiProperty({ description: 'Runtime context data' })
  context!: Record<string, any>;

  @ApiProperty({ description: 'Start timestamp', required: false })
  startedAt?: Date | null;

  @ApiProperty({ description: 'Completion timestamp', required: false })
  completedAt?: Date | null;

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string | null;

  @ApiProperty({ description: 'Step execution history', type: 'array', items: { type: 'object' }, required: false })
  stepHistory?: Array<{ stepId: string; status: WorkflowStatus; timestamp: Date; result?: unknown }>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Deletion timestamp', required: false })
  deletedAt?: Date;
}

/**
 * Swagger documentation class for Agent
 */
export class AgentDto {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Agent name' })
  name!: string;

  @ApiProperty({ description: 'Agent type', example: 'assistant' })
  type!: string;

  @ApiProperty({ description: 'Agent capabilities', type: 'array', items: { type: 'string' } })
  capabilities!: string[];

  @ApiProperty({ description: 'Agent metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Agent status',
    enum: ['active', 'inactive', 'busy', 'error'],
    example: 'active'
  })
  status!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Deletion timestamp', required: false })
  deletedAt?: Date;
}
