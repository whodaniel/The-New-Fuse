/**
 * MCP Gateway Controller
 * Unified endpoint for Model Context Protocol operations
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
  Res,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('mcp')
@ApiTags('mcp')
export class McpGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('servers')
  @Version('1')
  @ApiOperation({ summary: 'Get MCP server configurations' })
  @ApiResponse({ status: 200, description: 'MCP servers retrieved successfully' })
  async getMcpServers(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/mcp/servers',
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'MCP service unavailable',
        error: errorMessage,
      });
    }
  }

  @Post('servers')
  @Version('1')
  @ApiOperation({ summary: 'Register a new MCP server' })
  @ApiResponse({ status: 201, description: 'MCP server registered successfully' })
  async registerMcpServer(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/mcp/servers',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'MCP service unavailable',
        error: errorMessage,
      });
    }
  }

  @Get('servers/:id/status')
  @Version('1')
  @ApiOperation({ summary: 'Get MCP server status' })
  @ApiParam({ name: 'id', description: 'MCP server ID' })
  @ApiResponse({ status: 200, description: 'MCP server status retrieved successfully' })
  async getMcpServerStatus(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        `/api/mcp/servers/${id}/status`,
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'MCP service unavailable',
        error: errorMessage,
      });
    }
  }

  @Put('servers/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update MCP server configuration' })
  @ApiParam({ name: 'id', description: 'MCP server ID' })
  @ApiResponse({ status: 200, description: 'MCP server updated successfully' })
  async updateMcpServer(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        `/api/mcp/servers/${id}`,
        'PUT',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'MCP service unavailable',
        error: errorMessage,
      });
    }
  }

  @Delete('servers/:id')
  @Version('1')
  @ApiOperation({ summary: 'Remove MCP server configuration' })
  @ApiParam({ name: 'id', description: 'MCP server ID' })
  @ApiResponse({ status: 204, description: 'MCP server removed successfully' })
  async removeMcpServer(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        `/api/mcp/servers/${id}`,
        'DELETE',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'MCP service unavailable',
        error: errorMessage,
      });
    }
  }

  @Get('oauth/discovery')
  @Version('1')
  @ApiOperation({ summary: 'MCP OAuth Authorization Server discovery' })
  @ApiResponse({ status: 200, description: 'OAuth discovery metadata retrieved successfully' })
  async getMcpOAuthDiscovery(@Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        '/api/mcp/oauth/discovery',
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'MCP OAuth service unavailable',
        error: errorMessage,
      });
    }
  }
}
