import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { UserType } from './user.type';
import { WorkflowStepType } from './workflow-step.type';

export enum WorkflowStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

registerEnumType(WorkflowStatus, {
  name: 'WorkflowStatus',
  description: 'The execution status of a workflow',
});

@ObjectType('WorkflowStatistics')
export class WorkflowStatisticsType {
  @Field({ nullable: true })
  averageExecutionTime?: number;

  @Field({ nullable: true })
  successRate?: number;

  @Field({ nullable: true })
  lastExecutionStatus?: string;
}

@ObjectType('Workflow')
export class WorkflowType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => UserType, { nullable: true })
  creator?: UserType;

  @Field(() => [WorkflowStepType], { nullable: 'itemsAndList' })
  steps?: WorkflowStepType[];

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  lastExecutedAt?: Date;

  @Field(() => Int)
  executionCount!: number;

  @Field(() => WorkflowStatisticsType, { nullable: true })
  statistics?: WorkflowStatisticsType;

  @Field(() => String, { nullable: true })
  variables?: string;

  @Field(() => String, { nullable: true })
  triggers?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;

  // Computed field for status
  @Field(() => WorkflowStatus)
  status!: WorkflowStatus;
}
