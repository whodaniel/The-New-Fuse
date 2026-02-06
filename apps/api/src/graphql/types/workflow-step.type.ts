import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AgentType } from './agent.type';

@ObjectType('WorkflowStepStatistics')
export class WorkflowStepStatisticsType {
  @Field({ nullable: true })
  averageExecutionTime?: number;

  @Field({ nullable: true })
  successRate?: number;

  @Field({ nullable: true })
  lastExecutionStatus?: string;

  @Field({ nullable: true })
  errorCount?: number;
}

@ObjectType('WorkflowStep')
export class WorkflowStepType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field(() => AgentType, { nullable: true })
  agent?: AgentType;

  @Field(() => [String])
  nextSteps!: string[];

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  lastExecutedAt?: Date;

  @Field(() => WorkflowStepStatisticsType, { nullable: true })
  statistics?: WorkflowStepStatisticsType;

  @Field(() => String, { nullable: true })
  config?: string;

  @Field(() => String, { nullable: true })
  conditions?: string;

  @Field(() => String, { nullable: true })
  transformations?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;
}
