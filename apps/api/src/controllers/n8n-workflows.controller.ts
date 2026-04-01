// @ts-nocheck
/**
 * N8N Workflows Controller
 * REST API endpoints for n8n workflow management
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
  WorkflowCategory,
  WorkflowImportRequest,
  WorkflowSearchQuery,
  WorkflowSource,
} from '@the-new-fuse/n8n-workflows';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { WorkflowService } from '@the-new-fuse/n8n-workflows';

@ApiTags('n8n-workflows')
@Controller('workflows/n8n')
export class N8nWorkflowsController {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = new WorkflowService({
      enablePersistence: true,
    });
  }

  /**
   * GET /api/workflows/n8n - List all workflows
   */
  @Get()
  @ApiOperation({ summary: 'List all n8n workflows' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'complexity', required: false, description: 'Filter by complexity' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  async listWorkflows(
    @Query('query') query?: string,
    @Query('category') category?: WorkflowCategory,
    @Query('source') source?: WorkflowSource,
    @Query('tags') tags?: string,
    @Query('complexity') complexity?: 'simple' | 'medium' | 'complex',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      const searchQuery: WorkflowSearchQuery = {
        query,
        category,
        source,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
        complexity,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };

      const result = await this.workflowService.search(searchQuery);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve workflows',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/categories - List categories
   */
  @Get('categories')
  @ApiOperation({ summary: 'List all workflow categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async listCategories() {
    try {
      const result = await this.workflowService.getCategories();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve categories',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/stats - Get workflow statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get workflow statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    try {
      const stats = await this.workflowService.getStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve statistics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/tags - Get all tags
   */
  @Get('tags')
  @ApiOperation({ summary: 'Get all workflow tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getTags() {
    try {
      const tags = await this.workflowService.getAllTags();

      return {
        success: true,
        data: { tags },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve tags',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/:id - Get workflow by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflow(@Param('id') id: string) {
    try {
      const workflow = await this.workflowService.getWorkflow(id);

      if (!workflow) {
        throw new HttpException(
          {
            success: false,
            error: 'Workflow not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: workflow,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve workflow',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/:id/similar - Get similar workflows
   */
  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar workflows' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of similar workflows to return',
  })
  @ApiResponse({ status: 200, description: 'Similar workflows retrieved successfully' })
  async getSimilarWorkflows(@Param('id') id: string, @Query('limit') limit?: string) {
    try {
      const similarWorkflows = await this.workflowService.getSimilarWorkflows(
        id,
        limit ? parseInt(limit, 10) : 5
      );

      return {
        success: true,
        data: { workflows: similarWorkflows },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve similar workflows',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/category/:category - Get workflows by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get workflows by category' })
  @ApiParam({ name: 'category', description: 'Workflow category' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  async getByCategory(@Param('category') category: WorkflowCategory) {
    try {
      const workflows = await this.workflowService.getByCategory(category);

      return {
        success: true,
        data: { workflows },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve workflows',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/tag/:tag - Get workflows by tag
   */
  @Get('tag/:tag')
  @ApiOperation({ summary: 'Get workflows by tag' })
  @ApiParam({ name: 'tag', description: 'Workflow tag' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  async getByTag(@Param('tag') tag: string) {
    try {
      const workflows = await this.workflowService.getByTag(tag);

      return {
        success: true,
        data: { workflows },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve workflows',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/workflows/n8n/sync - Sync workflows from repositories
   */
  @Post('sync')
  @ApiOperation({ summary: 'Sync workflows from GitHub repositories' })
  @ApiResponse({ status: 200, description: 'Workflows synced successfully' })
  async syncWorkflows() {
    try {
      const result = await this.workflowService.syncWorkflows();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to sync workflows',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/workflows/n8n/import - Import workflow to n8n instance
   */
  @Post('import')
  @ApiOperation({ summary: 'Import workflow to n8n instance' })
  @ApiResponse({ status: 200, description: 'Workflow imported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async importWorkflow(@Body() request: WorkflowImportRequest) {
    try {
      if (!request.workflowId || !request.n8nInstanceUrl) {
        throw new HttpException(
          {
            success: false,
            error: 'Missing required fields: workflowId and n8nInstanceUrl',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.workflowService.importToN8n(request);

      if (!result.success) {
        throw new HttpException(
          {
            success: false,
            error: result.error || 'Failed to import workflow',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to import workflow',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/workflows/n8n/search - Search workflows
   */
  @Get('search')
  @ApiOperation({ summary: 'Search workflows' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchWorkflows(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    try {
      if (!q || q.trim() === '') {
        throw new HttpException(
          {
            success: false,
            error: 'Search query is required',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const searchQuery: WorkflowSearchQuery = {
        query: q,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };

      const result = await this.workflowService.search(searchQuery);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to search workflows',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
