import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { db } from '@the-new-fuse/database';
import { workflows, workflowSteps } from '@the-new-fuse/database/drizzle/schema';
import { eq } from 'drizzle-orm';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { WorkflowExecutionService } from './workflow-execution.service';

interface CreateWorkflowDto {
  name: string;
  description?: string;
  definition?: any;
  variables?: Record<string, any>;
  triggers?: any[];
}

interface CreateStepDto {
  name: string;
  type: string;
  config?: any;
  order: number;
  nextSteps?: string[];
  conditions?: any[];
  transformations?: any[];
  agentId?: string;
}

interface ExecuteWorkflowDto {
  input?: any;
  variables?: Record<string, any>;
  projectId?: string;
}

@Controller('workflows')
@UseGuards(FirebaseAuthGuard)
export class WorkflowController {
  private logger = new Logger(WorkflowController.name);

  constructor(private readonly executionService: WorkflowExecutionService) {
    this.logger.log('WorkflowController initialized');
  }

  // ==================== WORKFLOW CRUD ====================

  @Get()
  async getWorkflows(@Req() req: any, @Query('status') status?: string) {
    this.logger.log(`Getting workflows for user ${req.user?.id}`);

    const query = db.select().from(workflows).where(eq(workflows.creatorId, req.user.id));

    if (status) {
      // Filter by status would be done with additional where clause
    }

    return query;
  }

  @Get(':id')
  async getWorkflowById(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.logger.log(`Getting workflow ${id} for user ${req.user?.id}`);

    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));

    if (!workflow) {
      return { error: 'Workflow not found', id };
    }

    // Get steps
    const steps = await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, id))
      .orderBy(workflowSteps.order);

    return { ...workflow, steps };
  }

  @Post()
  async createWorkflow(@Body() dto: CreateWorkflowDto, @Req() req: any) {
    this.logger.log(`Creating workflow for user ${req.user?.id}`);

    const [workflow] = await db
      .insert(workflows)
      .values({
        name: dto.name,
        description: dto.description,
        definition: dto.definition,
        variables: dto.variables,
        triggers: dto.triggers,
        creatorId: req.user.id,
        status: 'DRAFT',
      } as any)
      .returning();

    return workflow;
  }

  @Put(':id')
  async updateWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateWorkflowDto>,
    @Req() req: any
  ) {
    this.logger.log(`Updating workflow ${id} for user ${req.user?.id}`);

    const [workflow] = await db
      .update(workflows)
      .set({
        ...dto,
        updatedAt: new Date(),
      } as any)
      .where(eq(workflows.id, id))
      .returning();

    return workflow;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWorkflow(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.logger.log(`Deleting workflow ${id} for user ${req.user?.id}`);

    await db
      .update(workflows)
      .set({ deletedAt: new Date() } as any)
      .where(eq(workflows.id, id));
  }

  // ==================== STEP MANAGEMENT ====================

  @Post(':id/steps')
  async addStep(
    @Param('id', ParseUUIDPipe) workflowId: string,
    @Body() dto: CreateStepDto,
    @Req() req: any
  ) {
    this.logger.log(`Adding step to workflow ${workflowId}`);

    const [step] = await db
      .insert(workflowSteps)
      .values({
        ...dto,
        workflowId,
      } as any)
      .returning();

    return step;
  }

  @Put(':id/steps/:stepId')
  async updateStep(
    @Param('id', ParseUUIDPipe) workflowId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: Partial<CreateStepDto>,
    @Req() req: any
  ) {
    this.logger.log(`Updating step ${stepId}`);

    const [step] = await db
      .update(workflowSteps)
      .set({
        ...dto,
        updatedAt: new Date(),
      } as any)
      .where(eq(workflowSteps.id, stepId))
      .returning();

    return step;
  }

  @Delete(':id/steps/:stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStep(
    @Param('id', ParseUUIDPipe) workflowId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Req() req: any
  ) {
    this.logger.log(`Deleting step ${stepId}`);

    await db.delete(workflowSteps).where(eq(workflowSteps.id, stepId));
  }

  // ==================== WORKFLOW PUBLISHING ====================

  @Post(':id/publish')
  async publishWorkflow(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.logger.log(`Publishing workflow ${id}`);

    // Verify workflow has steps
    const steps = await db.select().from(workflowSteps).where(eq(workflowSteps.workflowId, id));

    if (steps.length === 0) {
      return { error: 'Cannot publish workflow without steps' };
    }

    const [workflow] = await db
      .update(workflows)
      .set({
        status: 'PUBLISHED',
        updatedAt: new Date(),
      } as any)
      .where(eq(workflows.id, id))
      .returning();

    return workflow;
  }

  // ==================== WORKFLOW EXECUTION ====================

  @Post(':id/execute')
  async executeWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteWorkflowDto,
    @Req() req: any
  ) {
    this.logger.log(`Executing workflow ${id} for user ${req.user?.id}`);

    const result = await this.executionService.execute(id, dto.input, {
      userId: req.user.id,
      projectId: dto.projectId,
      variables: dto.variables,
    });

    return {
      executionId: result.executionId,
      status: result.status,
      message: 'Workflow execution started',
    };
  }

  @Post(':id/pause')
  async pauseWorkflow(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.logger.log(`Pausing workflow ${id}`);

    await this.executionService.pause(id);

    return { success: true, message: 'Workflow paused' };
  }

  @Post(':id/resume')
  async resumeWorkflow(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.logger.log(`Resuming workflow ${id}`);

    await this.executionService.resume(id);

    return { success: true, message: 'Workflow resumed' };
  }

  @Post(':id/cancel')
  async cancelWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    this.logger.log(`Cancelling workflow ${id}`);

    await this.executionService.cancel(id, reason);

    return { success: true, message: 'Workflow cancelled' };
  }

  // ==================== EXECUTION HISTORY ====================

  @Get(':id/executions')
  async getWorkflowExecutions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit: string = '50',
    @Req() req: any
  ) {
    this.logger.log(`Getting executions for workflow ${id} user ${req.user?.id}`);

    return this.executionService.getWorkflowExecutions(id, parseInt(limit));
  }

  @Get('executions/:executionId')
  async getExecution(@Param('executionId', ParseUUIDPipe) executionId: string, @Req() req: any) {
    this.logger.log(`Getting execution ${executionId}`);

    return this.executionService.getExecution(executionId);
  }
}
