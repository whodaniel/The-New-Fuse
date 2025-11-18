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
import { Workflow } from '../../entities/workflow.entity';
import { User } from '../../entities/user.entity';
import { WorkflowType, WorkflowStatus } from '../types/workflow.type';
import { UserType } from '../types/user.type';
import { WorkflowStepType } from '../types/workflow-step.type';
import { ExecuteWorkflowInput, CreateWorkflowInput } from '../types/input.types';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { UserLoader } from '../loaders/user.loader';
import { WorkflowLoader } from '../loaders/workflow.loader';

@Resolver(() => WorkflowType)
export class WorkflowResolver {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userLoader: UserLoader,
    private readonly workflowLoader: WorkflowLoader,
  ) {}

  @Query(() => WorkflowType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async workflow(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Workflow | null> {
    return this.workflowRepository.findOne({
      where: { id },
      relations: ['creator', 'steps'],
    });
  }

  @Query(() => [WorkflowType])
  @UseGuards(GqlAuthGuard)
  async workflows(
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
  ): Promise<Workflow[]> {
    if (userId) {
      return this.workflowRepository.find({
        where: { creator: { id: userId } },
        relations: ['creator'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.workflowRepository.find({
      relations: ['creator'],
      take: 100,
      order: { createdAt: 'DESC' },
    });
  }

  @Mutation(() => WorkflowType)
  @UseGuards(GqlAuthGuard)
  async createWorkflow(
    @Args('input') input: CreateWorkflowInput,
    @Context() context: any,
  ): Promise<Workflow> {
    const userId = context.req.user?.id;
    const creator = await this.userRepository.findOne({ where: { id: userId } });

    if (!creator) {
      throw new Error('User not found');
    }

    const workflow = this.workflowRepository.create({
      name: input.name,
      description: input.description,
      variables: input.variables ? JSON.parse(input.variables) : {},
      triggers: input.triggers ? JSON.parse(input.triggers) : [],
      creator,
      isActive: true,
      executionCount: 0,
    });

    return this.workflowRepository.save(workflow);
  }

  @Mutation(() => WorkflowType)
  @UseGuards(GqlAuthGuard)
  async executeWorkflow(
    @Args('input') input: ExecuteWorkflowInput,
    @Context() context: any,
  ): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: input.workflowId },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Update execution metadata
    workflow.lastExecutedAt = new Date();
    workflow.executionCount += 1;

    if (!workflow.statistics) {
      workflow.statistics = {};
    }
    workflow.statistics.lastExecutionStatus = 'started';

    await this.workflowRepository.save(workflow);

    // In a real implementation, you would:
    // 1. Queue the workflow for execution
    // 2. Execute steps in order
    // 3. Update statistics upon completion
    // For now, we just return the workflow

    return workflow;
  }

  @ResolveField(() => UserType)
  async creator(@Parent() workflow: Workflow): Promise<User> {
    if (workflow.creator && typeof workflow.creator === 'object') return workflow.creator;
    if (workflow.creator && typeof workflow.creator === 'string') {
      return this.userLoader.load(workflow.creator);
    }
    throw new Error('Creator not found');
  }

  @ResolveField(() => [WorkflowStepType])
  async steps(@Parent() workflow: Workflow): Promise<any[]> {
    if (workflow.steps) return workflow.steps;
    return this.workflowLoader.loadStepsByWorkflowId(workflow.id);
  }

  @ResolveField(() => WorkflowStatus)
  status(@Parent() workflow: Workflow): WorkflowStatus {
    const lastStatus = workflow.statistics?.lastExecutionStatus;

    if (!lastStatus) return WorkflowStatus.IDLE;
    if (lastStatus === 'running') return WorkflowStatus.RUNNING;
    if (lastStatus === 'completed') return WorkflowStatus.COMPLETED;
    if (lastStatus === 'failed') return WorkflowStatus.FAILED;
    if (lastStatus === 'paused') return WorkflowStatus.PAUSED;

    return WorkflowStatus.IDLE;
  }

  @ResolveField(() => String, { nullable: true })
  variables(@Parent() workflow: Workflow): string | null {
    return workflow.variables ? JSON.stringify(workflow.variables) : null;
  }

  @ResolveField(() => String, { nullable: true })
  triggers(@Parent() workflow: Workflow): string | null {
    return workflow.triggers ? JSON.stringify(workflow.triggers) : null;
  }

  @ResolveField(() => String, { nullable: true })
  metadata(@Parent() workflow: Workflow): string | null {
    return workflow.metadata ? JSON.stringify(workflow.metadata) : null;
  }
}
