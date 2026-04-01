/**
 * User Resolver - Migrated to Drizzle ORM
 * GraphQL resolver for User type queries and mutations
 */
import { UseGuards } from '@nestjs/common';
// @ts-ignore
import { Args, Context, ID, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
// @ts-ignore
// @ts-ignore
import type { User } from '@the-new-fuse/database';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { AgentLoader } from '../loaders/agent.loader';
import { WorkflowLoader } from '../loaders/workflow.loader';
import { AgentType } from '../types/agent.type';
import { UserType } from '../types/user.type';
import { WorkflowType } from '../types/workflow.type';

@Resolver(() => UserType)
export class UserResolver {
  constructor(
    private readonly db: DatabaseService,
    private readonly agentLoader: AgentLoader,
    private readonly workflowLoader: WorkflowLoader
  ) {}

  @Query(() => UserType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User | null> {
    return this.db.users.findById(id);
  }

  @Query(() => UserType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: any): Promise<User | null> {
    const userId = context.req.user?.id;
    if (!userId) return null;
    return this.db.users.findById(userId);
  }

  @Query(() => [UserType])
  @UseGuards(GqlAuthGuard)
  async users(): Promise<User[]> {
    return this.db.users.findAll(100);
  }

  @ResolveField(() => [AgentType])
  async agents(@Parent() user: User): Promise<any[]> {
    return this.agentLoader.loadByUserId(user.id);
  }

  @ResolveField(() => [WorkflowType])
  async workflows(@Parent() user: User): Promise<any[]> {
    return this.workflowLoader.loadByUserId(user.id);
  }

  @ResolveField(() => String, { nullable: true })
  fullName(@Parent() user: User): string | null {
    // Drizzle schema uses 'name' field instead of firstName/lastName
    return user.name || null;
  }

  @ResolveField(() => String, { nullable: true })
  preferences(@Parent() user: User): string | null {
    return user.preferences ? JSON.stringify(user.preferences) : null;
  }

  @ResolveField(() => String, { nullable: true })
  metadata(@Parent() user: User): string | null {
    // Use settings if metadata is not available in schema
    const settings = (user as any).settings;
    return settings ? JSON.stringify(settings) : null;
  }
}
