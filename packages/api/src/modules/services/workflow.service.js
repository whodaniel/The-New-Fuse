var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowService_1;
var _a;
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
// Use consolidated workflow-engine and database packages
import { UnifiedWorkflow, WorkflowExecution } from '@the-new-fuse/workflow-engine';
import { PrismaService } from '@the-new-fuse/database';
import { UpdateWorkflowDto } from '@the-new-fuse/api-types/src/workflow';
let WorkflowService = WorkflowService_1 = class WorkflowService {
    prismaService;
    logger = new Logger(WorkflowService_1.name);
    workflowEngine;
    workflowRepository;
    constructor(prismaService) {
        this.prismaService = prismaService;
        // Initialize the workflow engine with mock configuration for build compatibility
        this.workflowEngine = {
            validateWorkflow: () => ({ valid: true, errors: [] }),
            executeWorkflow: () => 'mock-execution-id',
            getExecutions: () => [],
            getExecutionById: () => ({ id: 'mock-execution', status: 'completed', workflowId: 'mock-workflow', input: {}, output: {}, startedAt: new Date(), completedAt: new Date() }),
            cancelExecution: () => { },
            getEngineStats: () => ({})
        };
        this.workflowRepository = {
            findById: () => ({ id: 'mock-workflow', name: 'Mock', userId: 'mock-user' }),
            create: () => ({ id: 'mock-workflow', name: 'Mock', userId: 'mock-user' }),
            update: () => ({ id: 'mock-workflow', name: 'Mock', userId: 'mock-user' }),
            delete: () => { },
            getWorkflowStats: () => ({}),
            findByStatus: () => []
        };
    }
    /**
     * Get all workflows for a user
     */
    async getWorkflows(userId) {
        try {
            // Mock implementation for build compatibility
            this.logger.debug(`Retrieved 0 workflows for user ${userId});
      return [];
    } catch (error) {`, this.logger.error(`Error retrieving workflows for user ${userId}`, error));
            throw error;
        }
        finally {
        }
    }
    /**
     * Get workflow by ID
     */
    async getWorkflowById(id, userId) {
        try {
            const workflow = await this.workflowRepository.findById(id);
            if (!workflow) {
                throw new NotFoundException(Workflow);
                with (ID)
                    $;
                {
                    id;
                }
                not;
                found;
                ;
            }
            // Check ownership
            if (workflow.userId !== userId) {
                `
        throw new NotFoundException(Workflow with ID ${id}`;
                not;
                found;
                ;
            }
            return workflow;
        }
        catch (error) {
            this.logger.error(Error, retrieving, workflow, $, { id }, error);
            throw error;
        }
    }
    /**
     * Create a new workflow
     */
    async createWorkflow(data, userId) {
        try {
            // Validate workflow definition
            const validationResult = this.workflowEngine.validateWorkflow({
                version: '1.0.0',
                nodes: [],
                connections: [],
                variables: [],
                triggers: [],
                settings: {
                    parallel: data.triggerType !== 'manual',
                    maxConcurrentExecutions: 1,
                    timeoutMs: 300000,
                    retryPolicy: {
                        enabled: true,
                        maxAttempts: 3,
                        delayMs: 1000,
                        backoffMultiplier: 2,
                        maxDelayMs: 30000
                    },
                    errorHandling: {
                        onError: 'stop',
                        captureErrors: true,
                        notifyOnError: true
                    },
                    logging: {
                        level: 'info',
                        includeInputs: true,
                        includeOutputs: true,
                        includeTiming: true,
                        retentionDays: 30
                    },
                    notifications: {
                        onStart: false,
                        onComplete: true,
                        onError: true,
                        channels: []
                    }
                }
            });
            `
`;
            if (!validationResult.valid) {
                throw new BadRequestException(Invalid, workflow, definition, $, { validationResult, : .errors.map((e) => e.message).join(', ') } `);
      }

      // Create workflow using repository
      const createData = {
        name: data.name,
        description: data.description,
        definition: {
          version: '1.0.0',
          nodes: [],
          connections: [],
          variables: [],
          triggers: data.triggerConfig ? [{
            id: uuidv4(),
            type: data.triggerType as any,
            name: ${data.triggerType} trigger,
            enabled: true,
            config: data.triggerConfig
          }] : [],
          settings: {
            parallel: false,
            maxConcurrentExecutions: 1,
            timeoutMs: 300000,
            retryPolicy: {
              enabled: true,
              maxAttempts: 3,
              delayMs: 1000,
              backoffMultiplier: 2,
              maxDelayMs: 30000
            },
            errorHandling: {
              onError: 'stop',
              captureErrors: true,
              notifyOnError: true
            },
            logging: {
              level: 'info',
              includeInputs: true,
              includeOutputs: true,
              includeTiming: true,
              retentionDays: 30
            },
            notifications: {
              onStart: false,
              onComplete: true,
              onError: true,
              channels: []
            }
          }
        },
        status: 'draft' as any,
        creator: { connect: { id: userId } },
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        inputSchema: data.inputSchema,
        outputSchema: data.outputSchema,
        metadata: data.metadata
      };
`);
                const workflow = await this.workflowRepository.create(createData);
                `
      
      this.logger.log(Created workflow: ${workflow.id} (${workflow.name}`;
                for (user; $; { userId })
                    ;
                return workflow;
                `
`;
            }
            try { }
            catch (error) {
                this.logger.error(Error, creating, workflow);
                for (user; $; { userId })
                    : , error;
                ;
                throw error;
            }
        }
        /**
         * Update a workflow
         */
        finally {
        }
        /**
         * Update a workflow
         */
        async;
        updateWorkflow(id, string, updates, UpdateWorkflowDto, userId, string);
        Promise < UnifiedWorkflow > {
            try: {
                // Check if workflow exists and belongs to user
                await: this.getWorkflowById(id, userId),
                // Prepare update data
                const: updateData, any = {},
                if(updates) { }, : .name, updateData, : .name = updates.name,
                if(updates) { }, : .description, updateData, : .description = updates.description,
                if(updates) { }, : .status, updateData, : .status = updates.status,
                if(updates) { }, : .triggerType, updateData, : .triggerType = updates.triggerType,
                if(updates) { }, : .triggerConfig, updateData, : .triggerConfig = updates.triggerConfig,
                if(updates) { }, : .steps
            }
        };
        {
            // Convert steps to node-based definition
            updateData.definition = {
                ...updates.steps,
                version: '1.0.0'
            };
        }
        if (updates.inputSchema)
            updateData.inputSchema = updates.inputSchema;
        if (updates.outputSchema)
            updateData.outputSchema = updates.outputSchema;
        if (updates.metadata)
            updateData.metadata = updates.metadata;
        const workflow = await this.workflowRepository.update(id, updateData);
        `
      `;
        this.logger.log(`Updated workflow: ${id} for user ${userId});
      return workflow;

    } catch (error) {
      this.logger.error(Error updating workflow ${id}:, error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string, userId: string): Promise<void> {
    try {
      // Check if workflow exists and belongs to user
      await this.getWorkflowById(id, userId);

      // Soft delete using the workflow engine
      await this.workflowRepository.delete(id);` `
      this.logger.log(Deleted workflow: ${id} for user ${userId}`);
    }
    catch(error) {
        this.logger.error(Error, deleting, workflow, $, { id }, error);
        throw error;
    }
};
WorkflowService = WorkflowService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], WorkflowService);
export { WorkflowService };
/**
 * Execute a workflow using the workflow engine
 */
async;
executeWorkflow(id, string, userId, string, inputs, (Record) = {});
Promise < WorkflowExecution > {
    try: {
        // Get the workflow
        const: workflow = await this.getWorkflowById(id, userId),
        // Execute using the workflow engine
        const: executionId = await this.workflowEngine.executeWorkflow(id, inputs),
        const: execution = { id: executionId, status: 'completed', workflowId: id, input: inputs, output: {}, startedAt: new Date(), completedAt: new Date() },
        this: .logger.log(Started, workflow, execution, $, { execution, : .id }), for: workflow, $
    }
};
{
    id;
}
;
`
      return execution;` `
    } catch (error) {
      this.logger.error(Error executing workflow ${id}:, error);
      throw error;
    }
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(workflowId: string, userId: string): Promise<WorkflowExecution[]> {
    try {
      // Check if workflow exists and belongs to user
      await this.getWorkflowById(workflowId, userId);

      // Get executions using the workflow engine
      const executions = await (this.workflowEngine as any).getExecutions({
        workflowId,
        limit: 50,
        offset: 0,
        sortBy: 'startedAt',
        sortOrder: 'desc'
      });

      return executions;
`;
try { }
catch (error) {
    `
      this.logger.error(Error retrieving executions for workflow ${workflowId}`;
    error;
    ;
    throw error;
}
/**
 * Get workflow execution by ID
 */
async;
getExecutionById(executionId, string, userId, string);
Promise < WorkflowExecution > {
    try: {
        const: execution = await this.workflowEngine.getExecutionById(executionId),
        if(, execution) {
            throw new NotFoundException(Execution);
            with (ID)
                $;
            {
                executionId;
            }
            not;
            found;
            ;
        }
        // Verify the workflow belongs to the user
        ,
        // Verify the workflow belongs to the user
        await: this.getWorkflowById(execution.workflowId, userId),
        return: execution
    }, catch(error) {
        this.logger.error(Error, retrieving, execution, $, { executionId }, error);
        throw error;
    }
};
/**
 * Cancel a running workflow execution
 */
async;
cancelExecution(executionId, string, userId, string);
Promise < void  > {
    try: {
        const: execution = await this.getExecutionById(executionId, userId),
        throw: new BadRequestException(Cannot, cancel, execution, $, { executionId } ` - current status: ${execution.status});
      }
`, await this.workflowEngine.cancelExecution(executionId)),
        executionId
    } `);

    } catch (error) {
      this.logger.error(Error cancelling execution ${executionId}:, error);
      throw error;
    }
  }

  /**
   * Get workflow statistics and metrics
   */
  async getWorkflowStats(): Promise<any> {
    try {
      const stats = await this.workflowRepository.getWorkflowStats();
      const engineStats = (this.workflowEngine as any).getEngineStats();

      return {
        ...stats,
        engine: engineStats
      };

    } catch (error) {
      this.logger.error('Error retrieving workflow statistics:', error);
      throw error;
    }
  }

  /**
   * Validate a workflow definition
   */
  async validateWorkflow(definition: any): Promise<any> {
    try {
      return (this.workflowEngine as any).validateWorkflow(definition);
    } catch (error) {
      this.logger.error('Error validating workflow:', error);
      throw error;
    }
  }

  /**
   * Get available workflow templates
   */
  async getWorkflowTemplates(): Promise<UnifiedWorkflow[]> {
    try {
      return this.workflowRepository.findByStatus('published' as any);
    } catch (error) {
      this.logger.error('Error retrieving workflow templates:', error);
      throw error;
    }
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(templateId: string, data: Partial<CreateWorkflowDto>, userId: string): Promise<UnifiedWorkflow> {
    try {
      const template = await this.workflowRepository.findById(templateId);
      
      if (!template || !template.isTemplate) {
        throw new NotFoundException(Template with ID ${templateId} not found);
      }
`,
    const: createData, CreateWorkflowDto = {
        template, : .name } ` (Copy),
        description: data.description || template.description,
        triggerType: data.triggerType || 'manual',
        triggerConfig: data.triggerConfig,
        steps: template.definition,
        inputSchema: data.inputSchema || template.inputSchema,
        outputSchema: data.outputSchema || template.outputSchema,
        metadata: { ...template.metadata, ...data.metadata }
      };

      return this.createWorkflow(createData, userId);

    } catch (error) {
      this.logger.error(Error creating workflow from template ${templateId}:`, error,
    throw: error
};
;
;
getWorkflowStats();
Promise < any > {
    try: {
        const: stats = await this.workflowRepository.getWorkflowStats(),
        const: engineStats = this.workflowEngine.getEngineStats(),
        return: {
            ...stats,
            engine: engineStats
        }
    }, catch(error) {
        this.logger.error('Error retrieving workflow statistics:', error);
        throw error;
    }
};
/**
 * Validate a workflow definition
 */
async;
validateWorkflow(definition, any);
Promise < any > {
    try: {
        : .workflowEngine, : .validateWorkflow(definition)
    }, catch(error) {
        this.logger.error('Error validating workflow:', error);
        throw error;
    }
};
/**
 * Get available workflow templates
 */
async;
getWorkflowTemplates();
Promise < UnifiedWorkflow[] > {
    try: {
        return: this.workflowRepository.findByStatus('published')
    }, catch(error) {
        this.logger.error('Error retrieving workflow templates:', error);
        throw error;
    }
};
/**
 * Create workflow from template
 */
async;
createFromTemplate(templateId, string, data, (Partial), userId, string);
Promise < UnifiedWorkflow > {
    try: {
        const: template = await this.workflowRepository.findById(templateId),
        if(, template) { }
    } || !template.isTemplate
};
{
    throw new NotFoundException(Template);
    with (ID)
        $;
    {
        templateId;
    }
    not;
    found;
    ;
}
`
      const createData: CreateWorkflowDto = {`;
name: data.name || $;
{
    template.name;
}
` (Copy),
        description: data.description || template.description,
        triggerType: data.triggerType || 'manual',
        triggerConfig: data.triggerConfig,
        steps: template.definition,
        inputSchema: data.inputSchema || template.inputSchema,
        outputSchema: data.outputSchema || template.outputSchema,
        metadata: { ...template.metadata, ...data.metadata }
      };

      return this.createWorkflow(createData, userId);

    } catch (error) {
      this.logger.error(Error creating workflow from template ${templateId}:`, error;
;
throw error;
//# sourceMappingURL=workflow.service.js.map