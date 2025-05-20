/**
 * Workflow controller implementation
 * Provides standardized REST API endpoints for workflow operations
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service.js';
import { BaseController } from './base.controller.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { 
  Workflow, 
  WorkflowExecution, 
  ApiResponse 
} from '@the-new-fuse/types';
import { CreateWorkflowDto } from './dto/create-workflow.dto.js';
import { UpdateWorkflowDto } from './dto/update-workflow.dto.js';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse as SwaggerResponse, 
  ApiParam, 
  ApiBody 
} from '@nestjs/swagger';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController extends BaseController {
  constructor(private readonly workflowService: WorkflowService) {
    super(WorkflowController.name);
  }

  /**
   * Get all workflows for the current user
   * @param user Current user
   * @returns Array of workflows
   */
  @Get()
  @ApiOperation({ summary: 'Get all workflows for the current user' })
  @SwaggerResponse({ status: 200, description: 'List of workflows', type: [Workflow] })
  async getWorkflows(
    @CurrentUser() user: any
  ): Promise<ApiResponse<Workflow[]>> {
    return this.handleAsync(
      () => this.workflowService.getWorkflows(user.id),
      'Failed to get workflows'
    );
  }

  /**
   * Get workflow by ID
   * @param id Workflow ID
   * @param user Current user
   * @returns Workflow
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @SwaggerResponse({ status: 200, description: 'Workflow details', type: Workflow })
  @SwaggerResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflow(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ApiResponse<Workflow>> {
    return this.handleAsync(
      () => this.workflowService.getWorkflowById(id, user.id),
      'Failed to get workflow'
    );
  }

  /**
   * Create a new workflow
   * @param data Workflow creation data
   * @param user Current user
   * @returns Created workflow
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiBody({ type: CreateWorkflowDto })
  @SwaggerResponse({ status: 201, description: 'Workflow created', type: Workflow })
  async createWorkflow(
    @Body() data: CreateWorkflowDto,
    @CurrentUser() user: any
  ): Promise<ApiResponse<Workflow>> {
    return this.handleAsync(
      () => this.workflowService.createWorkflow(data, user.id),
      'Failed to create workflow'
    );
  }

  /**
   * Update a workflow
   * @param id Workflow ID
   * @param updates Workflow update data
   * @param user Current user
   * @returns Updated workflow
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiBody({ type: UpdateWorkflowDto })
  @SwaggerResponse({ status: 200, description: 'Workflow updated', type: Workflow })
  @SwaggerResponse({ status: 404, description: 'Workflow not found' })
  async updateWorkflow(
    @Param('id') id: string,
    @Body() updates: UpdateWorkflowDto,
    @CurrentUser() user: any
  ): Promise<ApiResponse<Workflow>> {
    return this.handleAsync(
      () => this.workflowService.updateWorkflow(id, updates, user.id),
      'Failed to update workflow'
    );
  }

  /**
   * Delete a workflow
   * @param id Workflow ID
   * @param user Current user
   * @returns Success/failure response
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @SwaggerResponse({ status: 204, description: 'Workflow deleted' })
  @SwaggerResponse({ status: 404, description: 'Workflow not found' })
  async deleteWorkflow(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ApiResponse<void>> {
    return this.handleAsync(
      () => this.workflowService.deleteWorkflow(id, user.id),
      'Failed to delete workflow'
    );
  }

  /**
   * Execute a workflow
   * @param id Workflow ID
   * @param inputs Workflow inputs
   * @param user Current user
   * @returns Workflow execution
   */
  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  @SwaggerResponse({ status: 200, description: 'Workflow executed', type: WorkflowExecution })
  async executeWorkflow(
    @Param('id') id: string,
    @Body() inputs: Record<string, any> = {},
    @CurrentUser() user: any
  ): Promise<ApiResponse<WorkflowExecution>> {
    return this.handleAsync(
      () => this.workflowService.executeWorkflow(id, user.id, inputs),
      'Failed to execute workflow'
    );
  }

  /**
   * Get workflow executions
   * @param id Workflow ID
   * @param user Current user
   * @returns Array of workflow executions
   */
  @Get(':id/executions')
  @ApiOperation({ summary: 'Get workflow executions' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @SwaggerResponse({ status: 200, description: 'List of workflow executions', type: [WorkflowExecution] })
  async getWorkflowExecutions(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ApiResponse<WorkflowExecution[]>> {
    return this.handleAsync(
      () => this.workflowService.getWorkflowExecutions(id, user.id),
      'Failed to get workflow executions'
    );
  }

  /**
   * Get workflow execution by ID
   * @param id Workflow ID
   * @param executionId Execution ID
   * @param user Current user
   * @returns Workflow execution
   */
  @Get(':id/executions/:executionId')
  @ApiOperation({ summary: 'Get workflow execution by ID' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiParam({ name: 'executionId', description: 'Execution ID' })
  @SwaggerResponse({ status: 200, description: 'Workflow execution details', type: WorkflowExecution })
  @SwaggerResponse({ status: 404, description: 'Execution not found' })
  async getExecution(
    @Param('id') id: string,
    @Param('executionId') executionId: string,
    @CurrentUser() user: any
  ): Promise<ApiResponse<WorkflowExecution>> {
    return this.handleAsync(
      () => this.workflowService.getExecutionById(executionId, user.id),
      'Failed to get workflow execution'
    );
  }
}