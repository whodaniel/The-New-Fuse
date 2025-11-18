import {
  Resolver,
  Query,
  Mutation,
  ResolveField,
  Parent,
  Args,
  ID,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../../entities/agent.entity';
import { User } from '../../entities/user.entity';
import { AgentType, AgentStatus } from '../types/agent.type';
import { UserType } from '../types/user.type';
import { CreateAgentInput, UpdateAgentInput } from '../types/input.types';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { UserLoader } from '../loaders/user.loader';

@Resolver(() => AgentType)
export class AgentResolver {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userLoader: UserLoader,
  ) {}

  @Query(() => AgentType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async agent(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Agent | null> {
    return this.agentRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  @Query(() => [AgentType])
  @UseGuards(GqlAuthGuard)
  async agents(
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
  ): Promise<Agent[]> {
    if (userId) {
      return this.agentRepository.find({
        where: { owner: { id: userId } },
        relations: ['owner'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.agentRepository.find({
      relations: ['owner'],
      take: 100,
      order: { createdAt: 'DESC' },
    });
  }

  @Mutation(() => AgentType)
  @UseGuards(GqlAuthGuard)
  async createAgent(
    @Args('input') input: CreateAgentInput,
    @Context() context: any,
  ): Promise<Agent> {
    const userId = context.req.user?.id;
    const owner = await this.userRepository.findOne({ where: { id: userId } });

    if (!owner) {
      throw new Error('User not found');
    }

    const agent = this.agentRepository.create({
      name: input.name,
      type: input.type as any,
      description: input.description,
      capabilities: input.capabilities || [],
      config: input.config ? JSON.parse(input.config) : {},
      owner,
      isActive: true,
    });

    return this.agentRepository.save(agent);
  }

  @Mutation(() => AgentType)
  @UseGuards(GqlAuthGuard)
  async updateAgent(
    @Args('input') input: UpdateAgentInput,
  ): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id: input.id },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (input.name !== undefined) agent.name = input.name;
    if (input.description !== undefined) agent.description = input.description;
    if (input.capabilities !== undefined) agent.capabilities = input.capabilities;
    if (input.isActive !== undefined) agent.isActive = input.isActive;

    return this.agentRepository.save(agent);
  }

  @ResolveField(() => UserType)
  async owner(@Parent() agent: Agent): Promise<User> {
    if (agent.owner && typeof agent.owner === 'object') return agent.owner;
    if (agent.owner && typeof agent.owner === 'string') {
      return this.userLoader.load(agent.owner);
    }
    throw new Error('Owner not found');
  }

  @ResolveField(() => AgentStatus)
  status(@Parent() agent: Agent): AgentStatus {
    if (!agent.isActive) return AgentStatus.INACTIVE;

    const lastActive = agent.lastActiveAt;
    if (!lastActive) return AgentStatus.ACTIVE;

    const minutesSinceActive = (Date.now() - lastActive.getTime()) / 1000 / 60;
    if (minutesSinceActive > 30) return AgentStatus.INACTIVE;

    return AgentStatus.ACTIVE;
  }

  @ResolveField(() => String, { nullable: true })
  config(@Parent() agent: Agent): string | null {
    return agent.config ? JSON.stringify(agent.config) : null;
  }

  @ResolveField(() => String, { nullable: true })
  metadata(@Parent() agent: Agent): string | null {
    return agent.metadata ? JSON.stringify(agent.metadata) : null;
  }
}
