// @ts-ignore
import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateAgentInput {
  @Field()
  name!: string;

  @Field()
  type!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  capabilities?: string[];

  @Field(() => String, { nullable: true })
  config?: string;
}

@InputType()
export class UpdateAgentInput {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  capabilities?: string[];

  @Field({ nullable: true })
  isActive?: boolean;
}

@InputType()
export class ExecuteWorkflowInput {
  @Field(() => ID)
  workflowId!: string;

  @Field(() => String, { nullable: true })
  variables?: string;

  @Field({ nullable: true })
  async?: boolean;
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  variables?: string;

  @Field(() => String, { nullable: true })
  triggers?: string;
}
