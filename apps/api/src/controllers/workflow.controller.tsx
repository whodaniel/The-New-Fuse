import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { WorkflowService } from '../services/workflow/WorkflowService.js';
import {
    Workflow,
    CreateWorkflowDto,
    UpdateWorkflowDto,
    WorkflowStatus
} from '@the-new-fuse/types';
import { User } from '@the-new-fuse/database/client';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new workflow' })
    @ApiResponse({ status: HttpStatus.CREATED, type: Workflow })
    async createWorkflow(
        @Body() data: CreateWorkflowDto,
        @CurrentUser() user: User
    ): Promise<Workflow> {
        try {
            return await this.workflowService.createWorkflow(data, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create workflow',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post(':id/execute')
    @ApiOperation({ summary: 'Execute a workflow' })
    @ApiResponse({ status: HttpStatus.OK })
    async executeWorkflow(
        @Param('id') id: string,
        @CurrentUser() user: User
    ): Promise<void> {
        try {
            await this.workflowService.executeWorkflow(id, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to execute workflow',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id/status')
    @ApiOperation({ summary: 'Get workflow execution status' })
    @ApiResponse({ status: HttpStatus.OK, type: String })
    async getWorkflowStatus(
        @Param('id') id: string,
        @CurrentUser() user: User
    ): Promise<WorkflowStatus> {
        try {
            return await this.workflowService.getWorkflowStatus(id, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to get workflow status',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id/results')
    @ApiOperation({ summary: 'Get workflow execution results' })
    @ApiResponse({ status: HttpStatus.OK })
    async getWorkflowResults(
        @Param('id') id: string,
        @CurrentUser() user: User
    ): Promise<any> {
        try {
            return await this.workflowService.getWorkflowResults(id, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to get workflow results',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update workflow' })
    @ApiResponse({ status: HttpStatus.OK, type: Workflow })
    async updateWorkflow(
        @Param('id') id: string,
        @Body() updates: UpdateWorkflowDto,
        @CurrentUser() user: User
    ): Promise<Workflow> {
        try {
            return await this.workflowService.updateWorkflow(id, updates, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to update workflow',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete workflow' })
    @ApiResponse({ status: HttpStatus.NO_CONTENT })
    async deleteWorkflow(
        @Param('id') id: string,
        @CurrentUser() user: User
    ): Promise<void> {
        try {
            await this.workflowService.deleteWorkflow(id, user.id);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to delete workflow',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
