import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO class for Workflow model to be used with Swagger
 */
export class WorkflowDto {
  @ApiProperty({ description: 'Unique identifier for the workflow' })
  id: string = '';

  @ApiProperty({ description: 'Name of the workflow' })
  name: string = '';

  @ApiProperty({ description: 'Description of the workflow' })
  description: string = '';

  @ApiProperty({ description: 'Steps in the workflow represented as JSON' })
  steps: Record<string, any> = {};

  @ApiProperty({ description: 'When the workflow was created' })
  createdAt: Date = new Date();

  @ApiProperty({ description: 'When the workflow was last updated' })
  updatedAt: Date = new Date();
}

/**
 * DTO class for WorkflowExecution model to be used with Swagger
 */
export class WorkflowExecutionDto {
  @ApiProperty({ description: 'Unique identifier for the execution' })
  id: string = '';

  @ApiProperty({ description: 'ID of the workflow being executed' })
  workflowId: string = '';

  @ApiProperty({ description: 'Current status of the execution', example: 'RUNNING' })
  status: string = '';

  @ApiProperty({ description: 'Result of the workflow execution', required: false })
  result?: Record<string, any>;

  @ApiProperty({ description: 'When the execution started' })
  startedAt: Date = new Date();

  @ApiProperty({ description: 'When the execution completed', required: false })
  completedAt?: Date;
}
