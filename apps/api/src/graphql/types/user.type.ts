// @ts-ignore
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { AgentType } from './agent.type';
import { WorkflowType } from './workflow.type';

@ObjectType('User')
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(() => [String])
  roles!: string[];

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field(() => [AgentType], { nullable: 'itemsAndList' })
  agents?: AgentType[];

  @Field(() => [WorkflowType], { nullable: 'itemsAndList' })
  workflows?: WorkflowType[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => String, { nullable: true })
  preferences?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;

  // Computed field for full name
  @Field({ nullable: true })
  fullName?: string;
}
