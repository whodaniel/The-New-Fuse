import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { MCPService } from '../services/mcp.service.js';

interface ExecuteDirectiveDto {
  serverName: string;
  action: string;
  params?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Controller('api/mcp')
@UseGuards(JwtAuthGuard)
export class MCPController {
  constructor(private readonly mcpService: MCPService) {}

  @Get('servers')
  async getServers() {
    const servers = this.mcpService.getServers();
    const status = await this.mcpService.getServerStatus();
    
    return {
      success: true,
      data: servers
    };
  }

  @Get('servers/status')
  async getServerStatus() {
    const status = await this.mcpService.getServerStatus();
    
    return {
      success: true,
      data: status
    };
  }

  @Get('capabilities')
  getCapabilities() {
    const capabilities = this.mcpService.getAllCapabilities();
    
    return {
      success: true,
      data: capabilities
    };
  }

  @Get('tools')
  getTools() {
    const tools = this.mcpService.getAllTools();
    
    return {
      success: true,
      data: tools
    };
  }

  @Post('execute')
  async executeDirective(@Body() dto: ExecuteDirectiveDto, @Req() req: any) {
    try {
      const { serverName, action, params, metadata } = dto;
      
      if (!serverName || !action) {
        return {
          success: false,
          error: 'Server name and action are required'
        };
      }
      
      const sender = req.user?.id || 'anonymous';
      const result = await this.mcpService.executeDirective(
        serverName,
        action,
        params || {},
        {
          sender,
          metadata: metadata || {}
        }
      );
      
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('Error executing MCP directive:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute MCP directive'
      };
    }
  }
}