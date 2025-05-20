import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO class for Agent model to be used with Swagger
 */
export class AgentDto {
  @ApiProperty({ description: 'Unique identifier for the agent' })
  id: string;

  @ApiProperty({ description: 'Name of the agent' })
  name: string;

  @ApiProperty({ description: 'Type of the agent' })
  type: string;

  @ApiProperty({ description: 'Current status of the agent', example: 'IDLE' })
  status: string;

  @ApiProperty({ description: 'ID of the user who owns this agent' })
  userId: string;

  @ApiProperty({ description: 'List of capabilities this agent has', type: [String] })
  capabilities: string[];

  @ApiProperty({ description: 'When the agent was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the agent was last updated' })
  updatedAt: Date;
}

/**
 * DTO class for Workflow model to be used with Swagger
 */
export class WorkflowDto {
  @ApiProperty({ description: 'Unique identifier for the workflow' })
  id: string;

  @ApiProperty({ description: 'Name of the workflow' })
  name: string;

  @ApiProperty({ description: 'Description of the workflow' })
  description: string;

  @ApiProperty({ description: 'Steps in the workflow represented as JSON' })
  steps: Record<string, any>;

  @ApiProperty({ description: 'When the workflow was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the workflow was last updated' })
  updatedAt: Date;
}

/**
 * DTO class for WorkflowExecution model to be used with Swagger
 */
export class WorkflowExecutionDto {
  @ApiProperty({ description: 'Unique identifier for the execution' })
  id: string;

  @ApiProperty({ description: 'ID of the workflow being executed' })
  workflowId: string;

  @ApiProperty({ description: 'Current status of the execution', example: 'RUNNING' })
  status: string;

  @ApiProperty({ description: 'Result of the workflow execution', required: false })
  result?: Record<string, any>;

  @ApiProperty({ description: 'When the execution started' })
  startedAt: Date;

  @ApiProperty({ description: 'When the execution completed', required: false })
  completedAt?: Date;
}

/**
 * DTO class for Message model to be used with Swagger
 */
export class MessageDto {
  @ApiProperty({ description: 'Unique identifier for the message' })
  id: string;

  @ApiProperty({ description: 'Content of the message' })
  content: string;

  @ApiProperty({ description: 'Role of the message sender', example: 'user' })
  role: string;

  @ApiProperty({ description: 'ID of the user who owns this message' })
  userId: string;

  @ApiProperty({ description: 'ID of the agent who sent this message', required: false })
  fromAgentId?: string;

  @ApiProperty({ description: 'ID of the agent who received this message', required: false })
  toAgentId?: string;

  @ApiProperty({ description: 'When the message was created' })
  createdAt: Date;
}