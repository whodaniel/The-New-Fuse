// @ts-nocheck
/**
 * Workflow Resolver - Migrated to Drizzle ORM
 * GraphQL resolver for Workflow type queries and mutations
 */
import { UseGuards } from '@nestjs/common';
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
// @ts-ignore
// @ts-ignore
import type { NewWorkflow, User, Workflow } from '@the-new-fuse/database';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { UserLoader } from '../loaders/user.loader';
import { WorkflowLoader } from '../loaders/workflow.loader';
import { CreateWorkflowInput, ExecuteWorkflowInput } from '../types/input.types';
import { UserType } from '../types/user.type';
import { WorkflowStepType } from '../types/workflow-step.type';
import { WorkflowStatus, WorkflowType } from '../types/workflow.type';

// WorkflowStep type alias since it may not be directly exported
type WorkflowStep = any;

@Resolver(() => WorkflowType)
export class WorkflowResolver {
  constructor(
    private readonly db: DatabaseService,
    private readonly userLoader: UserLoader,
    private readonly workflowLoader: WorkflowLoader
  ) {}

  @Query(() => WorkflowType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async workflow(@Args('id', { type: () => ID }) id: string): Promise<Workflow | null> {
    return this.db.workflows.findWorkflowById(id);
  }

  @Query(() => [WorkflowType])
  @UseGuards(GqlAuthGuard)
  async workflows(
    @Args('userId', { type: () => ID, nullable: true }) userIdArg?: string,
    @Context() context?: any
  ): Promise<Workflow[]> {
    const userId = userIdArg || context?.req?.user?.id;
    if (userId) {
      return this.db.workflows.findWorkflowsByCreatorId(userId);
    }
    // Use findActiveWorkflows as a fallback for finding all workflows
    // Passing undefined userId will fail if it's strictly required
    return this.db.workflows.findActiveWorkflows(userId);
  }

  @Mutation(() => WorkflowType)
  @UseGuards(GqlAuthGuard)
  async createWorkflow(
    @Args('input') input: CreateWorkflowInput,
    @Context() context: any
  ): Promise<Workflow> {
    const userId = context.req.user?.id;
    const creator = await this.db.users.findById(userId);

    if (!creator) {
      throw new Error('User not found');
    }

    const workflowData: NewWorkflow = {
      name: input.name,
      description: input.description,
      variables: input.variables ? JSON.parse(input.variables) : {},
      triggers: input.triggers ? JSON.parse(input.triggers) : [],
      creatorId: creator.id,
      isActive: true,
      executionCount: 0,
    };

    return this.db.workflows.createWorkflow(workflowData);
  }

  @Mutation(() => WorkflowType)
  @UseGuards(GqlAuthGuard)
  async executeWorkflow(
    @Args('input') input: ExecuteWorkflowInput,
    @Context() context: any
  ): Promise<Workflow> {
    const workflow = await this.db.workflows.findWorkflowById(input.workflowId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Increment execution count
    await this.db.workflows.incrementExecutionCount(input.workflowId);

    // Update workflow with new execution status
    const updatedWorkflow = await this.db.workflows.updateWorkflow(input.workflowId, {
      statistics: {
        ...((workflow.statistics as object) || {}),
        lastExecutionStatus: 'started',
      },
    });

    // In a real implementation, you would:
    // 1. Queue the workflow for execution
    // 2. Execute steps in order
    // 3. Update statistics upon completion

    return updatedWorkflow || workflow;
  }

  @ResolveField(() => UserType)
  async creator(@Parent() workflow: Workflow): Promise<User | null> {
    if (workflow.creatorId) {
      return this.userLoader.load(workflow.creatorId);
    }
    return null;
  }

  @ResolveField(() => [WorkflowStepType])
  async steps(@Parent() workflow: Workflow): Promise<WorkflowStep[]> {
    return this.workflowLoader.loadStepsByWorkflowId(workflow.id);
  }

  @ResolveField(() => WorkflowStatus)
  status(@Parent() workflow: Workflow): WorkflowStatus {
    const statistics = workflow.statistics as { lastExecutionStatus?: string } | null;
    const lastStatus = statistics?.lastExecutionStatus;

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
