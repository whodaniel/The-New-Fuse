/**
 * Agent Resolver - Migrated to Drizzle ORM
 * GraphQL resolver for Agent type queries and mutations
 */
import { ForbiddenException, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Agent, NewAgent, User } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { UserLoader } from '../loaders/user.loader';
import { AgentStatus, AgentType } from '../types/agent.type';
import { CreateAgentInput, UpdateAgentInput } from '../types/input.types';
import { UserType } from '../types/user.type';
import { isPrivilegedUser } from '../../auth/auth-policy';

@Resolver(() => AgentType)
export class AgentResolver {
  constructor(
    private readonly db: DatabaseService,
    private readonly userLoader: UserLoader
  ) {}

  @Query(() => AgentType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async agent(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: any
  ): Promise<Agent | null> {
    const userId = context.req.user?.id;
    return this.db.agents.findById(id, userId);
  }

  @Query(() => [AgentType])
  @UseGuards(GqlAuthGuard)
  async agents(
    @Args('userId', { type: () => ID, nullable: true }) userIdArg?: string,
    @Context() context?: any
  ): Promise<Agent[]> {
    const currentUser = context?.req?.user;
    const userId = userIdArg || currentUser?.id;
    if (userId) {
      if (userIdArg && userIdArg !== currentUser?.id && !isPrivilegedUser(currentUser || {})) {
        throw new ForbiddenException('Not authorized to query agents for another user');
      }
      return this.db.agents.findByUserId(userId);
    }
    // If no userId provided and no user in context, we still need a userId for findAll
    // but this case should be guarded by GqlAuthGuard
    return this.db.agents.findAll(userId, 100);
  }

  @Mutation(() => AgentType)
  @UseGuards(GqlAuthGuard)
  async createAgent(
    @Args('input') input: CreateAgentInput,
    @Context() context: any
  ): Promise<Agent> {
    const userId = context.req.user?.id;
    const owner = await this.db.users.findById(userId);

    if (!owner) {
      throw new Error('User not found');
    }

    const agentData: NewAgent = {
      name: input.name,
      type: input.type as any,
      description: input.description,
      capabilities: input.capabilities || [],
      config: input.config ? JSON.parse(input.config) : {},
      userId: owner.id,
    };

    return this.db.agents.create(agentData);
  }

  @Mutation(() => AgentType)
  @UseGuards(GqlAuthGuard)
  async updateAgent(
    @Args('input') input: UpdateAgentInput,
    @Context() context: any
  ): Promise<Agent> {
    const userId = context.req.user?.id;
    const agent = await this.db.agents.findById(input.id, userId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const updates: Partial<NewAgent> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.capabilities !== undefined) updates.capabilities = input.capabilities;

    const updated = await this.db.agents.update(input.id, userId, updates);
    if (!updated) {
      throw new Error('Failed to update agent');
    }
    return updated;
  }

  @ResolveField(() => UserType)
  async owner(@Parent() agent: Agent): Promise<User | null> {
    if (agent.userId) {
      return this.userLoader.load(agent.userId);
    }
    return null;
  }

  @ResolveField(() => AgentStatus)
  status(@Parent() agent: Agent): AgentStatus {
    // Check agent status field if available, otherwise use defaults
    const agentStatus = (agent as any).status;

    if (agentStatus === 'INACTIVE' || agentStatus === 'OFFLINE') {
      return AgentStatus.INACTIVE;
    }

    // Use updatedAt as a proxy for last activity if lastActiveAt doesn't exist
    const lastActive = (agent as any).lastActiveAt || agent.updatedAt;
    if (!lastActive) return AgentStatus.ACTIVE;

    const minutesSinceActive = (Date.now() - new Date(lastActive).getTime()) / 1000 / 60;
    if (minutesSinceActive > 30) return AgentStatus.INACTIVE;

    return AgentStatus.ACTIVE;
  }

  @ResolveField(() => String, { nullable: true })
  config(@Parent() agent: Agent): string | null {
    return agent.config ? JSON.stringify(agent.config) : null;
  }

  @ResolveField(() => String, { nullable: true })
  metadata(@Parent() agent: Agent): string | null {
    // Use a type assertion since metadata may not exist in the minimal Agent type
    const agentMetadata = (agent as any).metadata;
    return agentMetadata ? JSON.stringify(agentMetadata) : null;
  }
}
