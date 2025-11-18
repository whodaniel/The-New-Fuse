import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Args,
  ID,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserType } from '../types/user.type';
import { AgentType } from '../types/agent.type';
import { WorkflowType } from '../types/workflow.type';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { AgentLoader } from '../loaders/agent.loader';
import { WorkflowLoader } from '../loaders/workflow.loader';

@Resolver(() => UserType)
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly agentLoader: AgentLoader,
    private readonly workflowLoader: WorkflowLoader,
  ) {}

  @Query(() => UserType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async user(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  @Query(() => UserType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: any): Promise<User | null> {
    const userId = context.req.user?.id;
    if (!userId) return null;
    return this.userRepository.findOne({ where: { id: userId } });
  }

  @Query(() => [UserType])
  @UseGuards(GqlAuthGuard)
  async users(): Promise<User[]> {
    return this.userRepository.find({
      take: 100,
      order: { createdAt: 'DESC' },
    });
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
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || null;
  }

  @ResolveField(() => String, { nullable: true })
  preferences(@Parent() user: User): string | null {
    return user.preferences ? JSON.stringify(user.preferences) : null;
  }

  @ResolveField(() => String, { nullable: true })
  metadata(@Parent() user: User): string | null {
    return user.metadata ? JSON.stringify(user.metadata) : null;
  }
}
