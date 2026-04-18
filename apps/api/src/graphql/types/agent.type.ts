// @ts-ignore
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserType } from './user.type';

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
}

registerEnumType(AgentStatus, {
  name: 'AgentStatus',
  description: 'The status of an agent',
});

@ObjectType('Agent')
export class AgentType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  instanceId?: string;

  @Field()
  isActive!: boolean;

  @Field(() => [String], { nullable: 'itemsAndList' })
  capabilities?: string[];

  @Field(() => UserType, { nullable: true })
  owner?: UserType;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  lastActiveAt?: Date;

  @Field(() => String, { nullable: true })
  config?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;

  // Computed field for status
  @Field(() => AgentStatus)
  status!: AgentStatus;
}
