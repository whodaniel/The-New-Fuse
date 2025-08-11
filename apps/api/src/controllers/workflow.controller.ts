/**
 * Workflow Controller - Production ready REST API for workflow management
 */

import { Request, Response } from 'express';
import { WorkflowEngine } from '@tnf/workflow-engine';
import { WorkflowExecutor } from '@tnf/workflow-engine';
import { WorkflowValidator } from '@tnf/workflow-engine';
import { Logger } from '@tnf/relay-core';
import { PrismaClient } from '@prisma/client';

export class WorkflowController {
  private workflowEngine: WorkflowEngine;
  private workflowExecutor: WorkflowExecutor;
  private workflowValidator: WorkflowValidator;
  private logger: Logger;
  private prisma: PrismaClient;

  constructor(
    workflowEngine: WorkflowEngine,
    workflowExecutor: WorkflowExecutor,
    workflowValidator: WorkflowValidator,
    logger: Logger,
    prisma: PrismaClient
  ) {
    this.workflowEngine = workflowEngine;
    this.workflowExecutor = workflowExecutor;
    this.workflowValidator = workflowValidator;
    this.logger = logger;
    this.prisma = prisma;
  }

  // GET /api/workflows
  async getWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
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
      this.logger.error('Failed to get workflows:', error);
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
      this.logger.error('Failed to get workflow:', error);
      res.status(500).json({ error: 'Failed to get workflow' });
    }
  }

  // POST /api/workflows
  async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflowData = req.body;
      
      // Validate workflow structure
      const validation = this.workflowValidator.validate(workflowData);
      if (!validation.isValid) {
        res.status(400).json({ 
          error: 'Invalid workflow', 
          details: validation.errors 
        });
        return;
      }

      const workflow = await this.workflowEngine.createWorkflow(workflowData);
      
      this.logger.info(`Created workflow: ${workflow.name} (${workflow.id})`);
      res.status(201).json(workflow);
    } catch (error) {
      this.logger.error('Failed to create workflow:', error);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  // PATCH /api/workflows/:id
  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate workflow structure if nodes/edges are being updated
      if (updates.nodes || updates.edges) {
        const validation = this.workflowValidator.validate(updates);
        if (!validation.isValid) {
          res.status(400).json({ 
            error: 'Invalid workflow', 
            details: validation.errors 
          });
          return;
        }
      }

      const workflow = await this.workflowEngine.updateWorkflow(id, updates);
      
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      this.logger.info(`Updated workflow: ${workflow.name} (${workflow.id})`);
      res.json(workflow);
    } catch (error) {
      this.logger.error('Failed to update workflow:', error);
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  }

  // DELETE /api/workflows/:id
  async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const success = await this.workflowEngine.deleteWorkflow(id);
      
      if (!success) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      this.logger.info(`Deleted workflow: ${id}`);
      res.status(204).send();
    } catch (error) {
      this.logger.error('Failed to delete workflow:', error);
      res.status(500).json({ error: 'Failed to delete workflow' });
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

      const workflow = await this.workflowEngine.getWorkflow(workflowId);
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      // Validate workflow before execution
      const validation = this.workflowValidator.validate(workflow);
      if (!validation.isValid) {
        res.status(400).json({ 
          error: 'Cannot execute invalid workflow', 
          details: validation.errors 
        });
        return;
      }

      const execution = await this.workflowExecutor.execute(workflow, input);
      
      this.logger.info(`Started execution: ${execution.id} for workflow: ${workflowId}`);
      res.status(201).json(execution);
    } catch (error) {
      this.logger.error('Failed to execute workflow:', error);
      res.status(500).json({ error: 'Failed to execute workflow' });
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
      this.logger.error('Failed to get execution:', error);
      res.status(500).json({ error: 'Failed to get execution' });
    }
  }

  // GET /api/workflows/executions or /api/workflows/:workflowId/executions
  async getExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
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
      this.logger.error('Failed to get executions:', error);
      res.status(500).json({ error: 'Failed to get executions' });
    }
  }

  // POST /api/workflows/executions/:executionId/cancel
  async cancelExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.workflowExecutor.cancel(executionId);
      
      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      this.logger.info(`Cancelled execution: ${executionId}`);
      res.json(execution);
    } catch (error) {
      this.logger.error('Failed to cancel execution:', error);
      res.status(500).json({ error: 'Failed to cancel execution' });
    }
  }

  // POST /api/workflows/executions/:executionId/pause
  async pauseExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.workflowExecutor.pause(executionId);
      
      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      this.logger.info(`Paused execution: ${executionId}`);
      res.json(execution);
    } catch (error) {
      this.logger.error('Failed to pause execution:', error);
      res.status(500).json({ error: 'Failed to pause execution' });
    }
  }

  // POST /api/workflows/executions/:executionId/resume
  async resumeExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = await this.workflowExecutor.resume(executionId);
      
      if (!execution) {
        res.status(404).json({ error: 'Execution not found' });
        return;
      }

      this.logger.info(`Resumed execution: ${executionId}`);
      res.json(execution);
    } catch (error) {
      this.logger.error('Failed to resume execution:', error);
      res.status(500).json({ error: 'Failed to resume execution' });
    }
  }

  // POST /api/workflows/validate
  async validateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = req.body;
      const validation = this.workflowValidator.validate(workflow);
      
      res.json({
        valid: validation.isValid,
        errors: validation.errors
      });
    } catch (error) {
      this.logger.error('Failed to validate workflow:', error);
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
      this.logger.error('Failed to get templates:', error);
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
      this.logger.error('Failed to get template:', error);
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

      const workflow = await this.workflowEngine.createWorkflow(workflowData);
      
      this.logger.info(`Created workflow from template: ${workflow.name} (${workflow.id})`);
      res.status(201).json(workflow);
    } catch (error) {
      this.logger.error('Failed to create workflow from template:', error);
      res.status(500).json({ error: 'Failed to create workflow from template' });
    }
  }
}