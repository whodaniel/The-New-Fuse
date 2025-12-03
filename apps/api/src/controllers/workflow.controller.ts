/**
 * Workflow Controller - Production ready REST API for workflow management
 */

import { Request, Response } from 'express';
import { Controller } from '@nestjs/common';
import { Logger } from '@tnf/relay-core';
import { PrismaClient } from '@prisma/client';

type DatabaseWhere = Record<string, any>;

@Controller('workflows')
export class WorkflowController {
  private logger: Logger;
  private prisma: PrismaClient;

  constructor(
    logger: Logger,
    prisma: PrismaClient
  ) {
    this.logger = logger;
    this.prisma = prisma;
  }

  // GET /api/workflows
  async getWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: DatabaseWhere = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [workflows, total] = await Promise.all([
        this.prisma.workflow.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { updatedAt: 'desc' },
          include: {
            executions: {
              take: 1,
              orderBy: { startTime: 'desc' }
            }
          }
        }),
        this.prisma.workflow.count({ where })
      ]);

      res.json({
        workflows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      this.logger.error(`Failed to get workflows: ${error}`);
      res.status(500).json({ error: 'Failed to get workflows' });
    }
  }

  // GET /api/workflows/:id
  async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const workflow = await this.prisma.workflow.findUnique({
        where: { id },
        include: {
          executions: {
            orderBy: { startTime: 'desc' },
            take: 10
          }
        }
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
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflowData = req.body;

      // Basic validation - ensure required fields are present
      if (!workflowData.name) {
        res.status(400).json({
          error: 'Invalid workflow',
          details: ['Name is required']
        });
        return;
      }

      const workflow = await this.prisma.workflow.create({
        data: {
          name: workflowData.name,
          description: workflowData.description || '',
          nodes: workflowData.nodes || [],
          edges: workflowData.edges || [],
          status: workflowData.status || 'draft',
          version: workflowData.version || 1,
          createdBy: req.user?.id || 'system',
          tags: workflowData.tags || []
        }
      });

      this.logger.info(`Created workflow: ${workflow.name} (${workflow.id})`);
      res.status(201).json(workflow);
    } catch (error) {
      this.logger.error(`Failed to create workflow: ${error}`);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  // PATCH /api/workflows/:id
  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Basic validation - ensure name is provided if being updated
      if (updates.name === '') {
        res.status(400).json({
          error: 'Invalid workflow',
          details: ['Name cannot be empty']
        });
        return;
      }

      const workflow = await this.prisma.workflow.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.nodes && { nodes: updates.nodes }),
          ...(updates.edges && { edges: updates.edges }),
          ...(updates.status && { status: updates.status }),
          ...(updates.version && { version: updates.version }),
          ...(updates.tags && { tags: updates.tags })
        }
      });

      this.logger.info(`Updated workflow: ${workflow.name} (${workflow.id})`);
      res.json(workflow);
    } catch (error: Error) {
      this.logger.error(`Failed to update workflow: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Workflow not found' });
      } else {
        res.status(500).json({ error: 'Failed to update workflow' });
      }
    }
  }

  // DELETE /api/workflows/:id
  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.prisma.workflow.delete({
        where: { id }
      });

      this.logger.info(`Deleted workflow: ${id}`);
      res.status(204).send();
    } catch (error: Error) {
      this.logger.error(`Failed to delete workflow: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Workflow not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete workflow' });
      }
    }
  }

  // POST /api/workflows/execute
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId, input = {} } = req.body;

      if (!workflowId) {
        res.status(400).json({ error: 'workflowId is required' });
        return;
      }

      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      // Basic validation - ensure workflow has nodes
      if (!workflow.nodes || workflow.nodes.length === 0) {
        res.status(400).json({
          error: 'Cannot execute workflow without nodes'
        });
        return;
      }

      // Create execution record
      const execution = await this.prisma.workflowExecution.create({
        data: {
          workflowId: workflowId,
          status: 'running',
          input: input,
          startTime: new Date(),
          createdBy: req.user?.id || 'system'
        }
      });

      this.logger.info(`Started execution: ${execution.id} for workflow: ${workflowId}`);
      res.status(201).json(execution);
    } catch (error: Error) {
      this.logger.error(`Failed to execute workflow: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Workflow not found' });
      } else {
        res.status(500).json({ error: 'Failed to execute workflow' });
      }
    }
  }

  // GET /api/workflows/executions/:executionId
  async getExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          workflow: true,
          nodeExecutions: true,
          logs: {
            orderBy: { timestamp: 'asc' }
          }
        }
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
  async getExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: DatabaseWhere = {};
      
      if (workflowId) {
        where.workflowId = workflowId;
      }
      
      if (status) {
        where.status = status;
      }

      const [executions, total] = await Promise.all([
        this.prisma.workflowExecution.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { startTime: 'desc' },
          include: {
            workflow: {
              select: { id: true, name: true }
            }
          }
        }),
        this.prisma.workflowExecution.count({ where })
      ]);

      res.json({
        executions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      this.logger.error(`Failed to get executions: ${error}`);
      res.status(500).json({ error: 'Failed to get executions' });
    }
  }

  // POST /api/workflows/executions/:executionId/cancel
  async cancelExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'cancelled',
          endTime: new Date()
        }
      });

      this.logger.info(`Cancelled execution: ${executionId}`);
      res.json(execution);
    } catch (error: Error) {
      this.logger.error(`Failed to cancel execution: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Execution not found' });
      } else {
        res.status(500).json({ error: 'Failed to cancel execution' });
      }
    }
  }

  // POST /api/workflows/executions/:executionId/pause
  async pauseExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'paused'
        }
      });

      this.logger.info(`Paused execution: ${executionId}`);
      res.json(execution);
    } catch (error: Error) {
      this.logger.error(`Failed to pause execution: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Execution not found' });
      } else {
        res.status(500).json({ error: 'Failed to pause execution' });
      }
    }
  }

  // POST /api/workflows/executions/:executionId/resume
  async resumeExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'running'
        }
      });

      this.logger.info(`Resumed execution: ${executionId}`);
      res.json(execution);
    } catch (error: Error) {
      this.logger.error(`Failed to resume execution: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Execution not found' });
      } else {
        res.status(500).json({ error: 'Failed to resume execution' });
      }
    }
  }

  // POST /api/workflows/validate
  async validateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = req.body;

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
        errors
      });
    } catch (error) {
      this.logger.error(`Failed to validate workflow: ${error}`);
      res.status(500).json({ error: 'Failed to validate workflow' });
    }
  }

  // GET /api/workflows/templates
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.prisma.workflowTemplate.findMany({
        orderBy: { popularity: 'desc' }
      });

      res.json(templates);
    } catch (error) {
      this.logger.error(`Failed to get workflow templates: ${error}`);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }

  // GET /api/workflows/templates/:id
  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await this.prisma.workflowTemplate.findUnique({
        where: { id }
      });

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
  async createFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId, name, description } = req.body;

      if (!templateId || !name) {
        res.status(400).json({ error: 'templateId and name are required' });
        return;
      }

      const template = await this.prisma.workflowTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      const workflowData = {
        name,
        description: description || template.description,
        nodes: template.nodes,
        edges: template.edges,
        status: 'draft',
        version: 1,
        createdBy: req.user?.id || 'system', // Assuming auth middleware sets req.user
        tags: []
      };

      const workflow = await this.prisma.workflow.create({
        data: workflowData
      });

      this.logger.info(`Created workflow from template: ${workflow.name} (${workflow.id})`);
      res.status(201).json(workflow);
    } catch (error: Error) {
      this.logger.error(`Failed to create workflow from template: ${error}`);
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Template not found' });
      } else {
        res.status(500).json({ error: 'Failed to create workflow from template' });
      }
    }
  }
}