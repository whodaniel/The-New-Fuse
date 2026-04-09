/**
 * Workflow Controller - Production ready REST API for workflow management
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { DatabaseService, and, desc, eq, ilike, or, sql } from '@the-new-fuse/database';
import { Request, Response } from 'express';
// import { workflows, workflowExecutions, workflowSteps } from '@the-new-fuse/database/drizzle/schema'; // This is fine if exported, or use database package exports
import { workflowExecutions, workflows } from '@the-new-fuse/database'; // Verify if schema tables are exported directly from index

type DatabaseWhere = Record<string, any>;

@Controller('workflows')
export class WorkflowController {
  private logger = new Logger(WorkflowController.name);

  constructor(private readonly db: DatabaseService) {}

  // GET /api/workflows
  @Get()
  async getWorkflows(@Query() query: any, @Res() res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, search } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const conditions = [sql`${workflows.deletedAt} IS NULL`];

      if (status) {
        conditions.push(eq(workflows.status, status));
      }

      if (search) {
        conditions.push(
          or(
            ilike(workflows.name, `%${search}%`),
            ilike(workflows.description, `%${search}%`)
          ) as any
        );
      }

      const whereClause = and(...conditions);

      // Fetch workflows with query builder for relational data
      // Using Relational Query API if possible, or query builder
      const result = await this.db.client.query.workflows.findMany({
        where: whereClause,
        orderBy: [desc(workflows.updatedAt)],
        limit: Number(limit),
        offset: skip,
        with: {
          executions: {
            limit: 1,
            orderBy: (executions, { desc }) => [desc(executions.startedAt)],
          },
        },
      });

      // Get total count
      // Drizzle count is a bit manual
      const [countResult] = await this.db.client
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(workflows)
        .where(whereClause);

      const total = countResult?.count ?? 0;

      res.json({
        workflows: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get workflows: ${error}`);
      res.status(500).json({ error: 'Failed to get workflows' });
    }
  }

  // GET /api/workflows/:id
  @Get(':id')
  async getWorkflow(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const workflow = await this.db.client.query.workflows.findFirst({
        where: eq(workflows.id, id),
        with: {
          executions: {
            orderBy: (executions, { desc }) => [desc(executions.startedAt)],
            limit: 10,
          },
          steps: {
            orderBy: (steps, { asc }) => [asc(steps.order)],
          },
        },
      });

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error) {
      this.logger.error(`Failed to get workflow: ${error}`);
      res.status(500).json({ error: 'Failed to get workflow' });
    }
  }

  // POST /api/workflows
  @Post()
  async createWorkflow(
    @Body() workflowData: any,
    @Res() res: Response,
    @Query() req: any
  ): Promise<void> {
    // Using @Query for req hack or inject Request properly
    // Assuming Request is injected via context if properly typed, but cleaner to use @Req() or standard Express request
    try {
      // Basic validation - ensure required fields are present
      if (!workflowData.name) {
        res.status(400).json({
          error: 'Invalid workflow',
          details: ['Name is required'],
        });
        return;
      }

      const userId = workflowData.userId; // Or extract from request if auth setup matches

      const workflow = await this.db.workflows.createWorkflow({
        name: workflowData.name,
        description: workflowData.description || '',
        definition: {
          nodes: workflowData.nodes || [],
          edges: workflowData.edges || [],
          version: workflowData.version || 1,
          tags: workflowData.tags || [],
        },
        status: workflowData.status || 'DRAFT',
        creatorId: userId,
        usageCount: 0,
      } as any); // Cast as needed for optional fields

      this.logger.log(`Created workflow: ${workflow.name} (${workflow.id})`);
      res.status(201).json(workflow);
    } catch (error) {
      this.logger.error(`Failed to create workflow: ${error}`);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  // PATCH /api/workflows/:id
  @Patch(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() updates: any,
    @Res() res: Response
  ): Promise<void> {
    try {
      // Basic validation - ensure name is provided if being updated
      if (updates.name === '') {
        res.status(400).json({
          error: 'Invalid workflow',
          details: ['Name cannot be empty'],
        });
        return;
      }

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.nodes || updates.edges) {
        updateData.definition = {
          nodes: updates.nodes || [],
          edges: updates.edges || [],
          version: updates.version || 1,
          tags: updates.tags || [],
        };
      }

      const workflow = await this.db.workflows.updateWorkflow(id, updateData);

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      this.logger.log(`Updated workflow: ${workflow.name} (${workflow.id})`);
      res.json(workflow);
    } catch (error: unknown) {
      this.logger.error(`Failed to update workflow: ${error}`);
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  }

  // POST /api/workflows/:id/publish
  @Post(':id/publish')
  async publishWorkflow(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const workflow = await this.db.workflows.updateWorkflow(id, {
        status: 'ACTIVE',
      } as any);

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      this.logger.log(`Published workflow: ${workflow.name} (${workflow.id})`);
      res.json({
        ...workflow,
        publication: {
          status: 'published',
          publishedAt: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to publish workflow: ${error}`);
      res.status(500).json({ error: 'Failed to publish workflow' });
    }
  }

  // DELETE /api/workflows/:id
  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const deleted = await this.db.workflows.softDeleteWorkflow(id);

      if (!deleted) {
        // Check if it exists at all
        const exists = await this.db.workflows.findWorkflowById(id);
        if (!exists) {
          res.status(404).json({ error: 'Workflow not found' });
          return;
        }
        res.status(500).json({ error: 'Failed to delete workflow' });
        return;
      }

      this.logger.log(`Deleted workflow: ${id}`);
      res.status(204).send();
    } catch (error: unknown) {
      this.logger.error(`Failed to delete workflow: ${error}`);
      res.status(500).json({ error: 'Failed to delete workflow' });
    }
  }

  // POST /api/workflows/execute
  @Post('execute')
  async executeWorkflow(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { workflowId, input = {} } = body;

      if (!workflowId) {
        res.status(400).json({ error: 'workflowId is required' });
        return;
      }

      const workflow = await this.db.workflows.findWorkflowById(workflowId);

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      // Basic validation - ensure workflow has definition
      const definition = workflow.definition as any;
      const nodes = definition?.nodes || [];
      if (!nodes || nodes.length === 0) {
        res.status(400).json({
          error: 'Cannot execute workflow without nodes',
        });
        return;
      }

      // Create execution record
      const execution = await this.db.workflows.createExecution({
        workflowId: workflowId,
        status: 'RUNNING',
        input: input,
        startedAt: new Date(),
      } as any);

      this.logger.log(`Started execution: ${execution.id} for workflow: ${workflowId}`);
      res.status(201).json(execution);
    } catch (error: unknown) {
      this.logger.error(`Failed to execute workflow: ${error}`);
      res.status(500).json({ error: 'Failed to execute workflow' });
    }
  }

  // GET /api/workflows/executions/:executionId
  @Get('executions/:executionId')
  async getExecution(
    @Param('executionId') executionId: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      // findExecutionById in repo doesn't include workflow relation.
      // Use query builder
      const execution = await this.db.client.query.workflowExecutions.findFirst({
        where: eq(workflowExecutions.id, executionId),
        with: {
          workflow: true,
        },
      });

      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      res.json(execution);
    } catch (error) {
      this.logger.error(`Failed to get execution: ${error}`);
      res.status(500).json({ error: 'Failed to get execution' });
    }
  }

  // GET /api/workflows/executions or /api/workflows/:workflowId/executions
  // NestJS routing order matters. Using different method names or paths.
  // Original was vague. Let's assume standard query params.
  @Get('executions')
  async getExecutions(@Query() query: any, @Res() res: Response): Promise<void> {
    try {
      const { workflowId, page = 1, limit = 20, status } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const conditions = [];

      if (workflowId) {
        conditions.push(eq(workflowExecutions.workflowId, workflowId));
      }

      if (status) {
        conditions.push(eq(workflowExecutions.status, status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.db.client.query.workflowExecutions.findMany({
        where: whereClause,
        offset: skip,
        limit: Number(limit),
        orderBy: [desc(workflowExecutions.startedAt)],
        with: {
          workflow: {
            columns: { id: true, name: true },
          },
        },
      });

      const [countResult] = await this.db.client
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(workflowExecutions)
        .where(whereClause);

      const total = countResult?.count ?? 0;

      res.json({
        executions: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get executions: ${error}`);
      res.status(500).json({ error: 'Failed to get executions' });
    }
  }

  // POST /api/workflows/executions/:executionId/cancel
  @Post('executions/:executionId/cancel')
  async cancelExecution(
    @Param('executionId') executionId: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      // Drizzle update
      const [execution] = await this.db.client
        .update(workflowExecutions)
        .set({ status: 'CANCELLED', completedAt: new Date() })
        .where(eq(workflowExecutions.id, executionId))
        .returning();

      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      this.logger.log(`Cancelled execution: ${executionId}`);
      res.json(execution);
    } catch (error: unknown) {
      this.logger.error(`Failed to cancel execution: ${error}`);
      res.status(500).json({ error: 'Failed to cancel execution' });
    }
  }

  // POST /api/workflows/executions/:executionId/pause
  @Post('executions/:executionId/pause')
  async pauseExecution(
    @Param('executionId') executionId: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const [execution] = await this.db.client
        .update(workflowExecutions)
        .set({ status: 'PAUSED' })
        .where(eq(workflowExecutions.id, executionId))
        .returning();

      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      this.logger.log(`Paused execution: ${executionId}`);
      res.json(execution);
    } catch (error: unknown) {
      this.logger.error(`Failed to pause execution: ${error}`);
      res.status(500).json({ error: 'Failed to pause execution' });
    }
  }

  // POST /api/workflows/executions/:executionId/resume
  @Post('executions/:executionId/resume')
  async resumeExecution(
    @Param('executionId') executionId: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const [execution] = await this.db.client
        .update(workflowExecutions)
        .set({ status: 'RUNNING' })
        .where(eq(workflowExecutions.id, executionId))
        .returning();

      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      this.logger.log(`Resumed execution: ${executionId}`);
      res.json(execution);
    } catch (error: unknown) {
      this.logger.error(`Failed to resume execution: ${error}`);
      res.status(500).json({ error: 'Failed to resume execution' });
    }
  }

  // POST /api/workflows/validate
  @Post('validate')
  async validateWorkflow(@Body() workflow: any, @Res() res: Response): Promise<void> {
    try {
      // Basic validation
      const errors: string[] = [];

      if (!workflow.name || workflow.name.trim() === '') {
        errors.push('Name is required');
      }

      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        errors.push('Nodes must be an array');
      }

      if (!workflow.edges || !Array.isArray(workflow.edges)) {
        errors.push('Edges must be an array');
      }

      res.json({
        valid: errors.length === 0,
        errors,
      });
    } catch (error) {
      this.logger.error(`Failed to validate workflow: ${error}`);
      res.status(500).json({ error: 'Failed to validate workflow' });
    }
  }

  // GET /api/workflows/templates
  @Get('templates')
  async getTemplates(_req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.db.workflows.findPublicTemplates();
      res.json(templates);
    } catch (error) {
      this.logger.error(`Failed to get workflow templates: ${error}`);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }

  // GET /api/workflows/templates/:id
  @Get('templates/:id')
  async getTemplate(@Param('id') id: string, res: Response): Promise<void> {
    try {
      const template = await this.db.workflows.findTemplateById(id);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      res.json(template);
    } catch (error) {
      this.logger.error(`Failed to get template: ${error}`);
      res.status(500).json({ error: 'Failed to get template' });
    }
  }

  // POST /api/workflows/from-template
  @Post('from-template')
  async createFromTemplate(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { templateId, name, userId } = body;

      if (!templateId) {
        res.status(400).json({ error: 'templateId required' });
        return;
      }

      const template = await this.db.workflows.findTemplateById(templateId);
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      const workflow = await this.db.workflows.createWorkflow({
        name: name || template.name,
        description: template.description || '',
        definition: template.definition,
        status: 'DRAFT',
        creatorId: userId,
        usageCount: 0,
      } as any);

      // Increment usage
      await this.db.workflows.incrementTemplateUsage(templateId);

      res.status(201).json(workflow);
    } catch (error: unknown) {
      this.logger.error(`Failed to create workflow from template: ${error}`);
      res.status(500).json({ error: 'Failed to create workflow from template' });
    }
  }
}
