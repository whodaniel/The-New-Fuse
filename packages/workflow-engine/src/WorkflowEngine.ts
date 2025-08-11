/**
 * Workflow Engine - The New Fuse
 *
 * This engine is responsible for the lifecycle management of workflow definitions.
 * It integrates with the Master Agent Registry for agent information and the
 * WorkflowRepository for database operations. It uses the WorkflowValidator
 * to ensure the integrity of workflow definitions.
 */

import { EventEmitter } from 'events';
import { Logger } from '@tnf/relay-core';
import { PrismaClient } from '@prisma/client';
import { MasterAgentRegistry } from '@tnf/relay-core';
import { WorkflowRepository } from './WorkflowRepository';
import { WorkflowValidator } from './WorkflowValidator';
import {
  WorkflowDefinition,
  WorkflowStatus,
} from './WorkflowTypes';

export class WorkflowEngine extends EventEmitter {
  private logger: Logger;
  private prisma: PrismaClient;
  private agentRegistry: MasterAgentRegistry;
  private workflowRepository: WorkflowRepository;
  private workflowValidator: WorkflowValidator;
  private workflows: Map<string, WorkflowDefinition> = new Map();

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    agentRegistry: MasterAgentRegistry
  ) {
    super();
    this.prisma = prisma;
    this.logger = logger;
    this.agentRegistry = agentRegistry;
    this.workflowRepository = new WorkflowRepository(prisma, logger);
    this.workflowValidator = new WorkflowValidator(this.agentRegistry);
    this.loadWorkflows();
  }

  private async loadWorkflows(): Promise<void> {
    this.logger.info('Loading workflow definitions...');
    try {
      const definitions = await this.workflowRepository.getAllWorkflows();
      for (const definition of definitions) {
        this.workflows.set(definition.id, definition);
      }
      this.logger.info(`Loaded ${this.workflows.size} workflow definitions.`);
    } catch (error) {
      this.logger.error(`Failed to load workflow definitions: ${error}`);
    }
  }

  async createWorkflow(definitionData: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    this.logger.info(`Creating new workflow: ${definitionData.name}`);
    
    const definition: WorkflowDefinition = {
      id: `wf-${Date.now()}`,
      version: 1,
      status: WorkflowStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...definitionData,
    } as WorkflowDefinition;

    const validationResult = this.workflowValidator.validate(definition);
    if (!validationResult.isValid) {
      throw new Error(`Workflow validation failed: ${validationResult.errors.join(', ')}`);
    }

    const createdWorkflow = await this.workflowRepository.createWorkflow(definition);
    this.workflows.set(createdWorkflow.id, createdWorkflow);
    this.emit('workflow_created', createdWorkflow);
    return createdWorkflow;
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    if (this.workflows.has(id)) {
      return this.workflows.get(id)!;
    }
    return this.workflowRepository.getWorkflowById(id);
  }

  async getAllWorkflows(): Promise<WorkflowDefinition[]> {
    return Array.from(this.workflows.values());
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition | null> {
    const existingWorkflow = await this.getWorkflow(id);
    if (!existingWorkflow) {
      return null;
    }

    const updatedWorkflow = { 
      ...existingWorkflow, 
      ...updates, 
      version: existingWorkflow.version + 1,
      updatedAt: new Date(),
    };

    const validationResult = this.workflowValidator.validate(updatedWorkflow as WorkflowDefinition);
    if (!validationResult.isValid) {
      throw new Error(`Workflow validation failed: ${validationResult.errors.join(', ')}`);
    }

    const savedWorkflow = await this.workflowRepository.updateWorkflow(id, updatedWorkflow);
    if (savedWorkflow) {
      this.workflows.set(id, savedWorkflow);
      this.emit('workflow_updated', savedWorkflow);
    }
    return savedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const success = await this.workflowRepository.deleteWorkflow(id);
    if (success) {
      this.workflows.delete(id);
      this.emit('workflow_deleted', { id });
    }
    return success;
  }

  async setWorkflowStatus(id: string, status: WorkflowStatus): Promise<WorkflowDefinition | null> {
    return this.updateWorkflow(id, { status });
  }
}
