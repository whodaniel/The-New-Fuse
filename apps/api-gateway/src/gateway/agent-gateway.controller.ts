/**
 * Agent Gateway Controller
 * Unified endpoint for all agent operations across services
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('agents')
@ApiTags('agents')
export class AgentGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  @ApiResponse({ status: 200, description: 'List of agents retrieved successfully' })
  @ApiQuery({ name: 'capability', required: false, description: 'Filter by capability' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  async getAgents(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      // Route to agents service (port 3001) - Needs /api prefix as defined in its main.ts
      const response = await this.proxyService.proxyRequest(
        'agents',
        '/api/agents',
        'GET',
        headers,
        undefined,
        query
      );

      return res.status(response.status).json(response.data);
    } catch {
      // Fallback to backend service if agents service is unavailable
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          '/api/agents',
          'GET',
          headers,
          undefined,
          query
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @ApiBody({ description: 'Agent creation data' })
  async createAgent(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        '/api/agents',
        'POST',
        headers,
        body
      );

      return res.status(response.status).json(response.data);
    } catch {
      // Fallback to backend service
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          '/api/agents',
          'POST',
          headers,
          body
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active agents' })
  @ApiResponse({ status: 200, description: 'Active agents retrieved successfully' })
  async getActiveAgents(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        '/api/agents/active',
        'GET',
        headers
      );

      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          '/api/agents/active',
          'GET',
          headers
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgentById(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        `/api/agents/${id}`,
        'GET',
        headers
      );

      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          `/api/agents/${id}`,
          'GET',
          headers
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ description: 'Agent update data' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgent(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        `/api/agents/${id}`,
        'PUT',
        headers,
        body
      );

      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          `/api/agents/${id}`,
          'PUT',
          headers,
          body
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update agent status' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ description: 'Status update data' })
  @ApiResponse({ status: 200, description: 'Agent status updated successfully' })
  async updateAgentStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        `/api/agents/${id}/status`,
        'PUT',
        headers,
        body
      );

      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          `/api/agents/${id}/status`,
          'PUT',
          headers,
          body
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 204, description: 'Agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async deleteAgent(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        `/api/agents/${id}`,
        'DELETE',
        headers
      );

      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          `/api/agents/${id}`,
          'DELETE',
          headers
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Agent services unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }
}
