/**
 * Workflow Repository - The New Fuse
 *
 * This class handles all database interactions for workflow definitions,
 * abstracting the Prisma queries from the WorkflowEngine.
 */

// import { PrismaClient } from '@prisma/client';
import { Logger } from '@the-new-fuse/relay-core';
import { WorkflowDefinition } from './WorkflowTypes';

export class WorkflowRepository {
  private prisma: any; // PrismaClient;
  private logger: Logger;

  constructor(prisma: any /* PrismaClient */, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async createWorkflow(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    this.logger.info(`Creating workflow in DB: ${definition.name}`);
    const created = await this.prisma.workflow.create({
      data: {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        version: definition.version,
        status: definition.status,
        authorId: definition.authorId,
        tags: definition.tags,
        definition: definition as any, // Store the full definition as JSON
      },
    });
    return this.mapToWorkflowDefinition(created);
  }

  async getWorkflowById(id: string): Promise<WorkflowDefinition | null> {
    const workflow = await this.prisma.workflow.findUnique({ where: { id } });
    return workflow ? this.mapToWorkflowDefinition(workflow) : null;
  }

  async getAllWorkflows(): Promise<WorkflowDefinition[]> {
    const workflows = await this.prisma.workflow.findMany();
    return workflows.map(this.mapToWorkflowDefinition);
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition | null> {
    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        version: updates.version,
        status: updates.status,
        definition: updates as any,
      },
    });
    return this.mapToWorkflowDefinition(updated);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await this.prisma.workflow.delete({ where: { id } });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete workflow ${id}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private mapToWorkflowDefinition(data: any): WorkflowDefinition {
    // The full definition is stored in the 'definition' JSON field
    return data.definition as WorkflowDefinition;
  }
}
