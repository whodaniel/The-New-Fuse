import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { TNFMCPService } from './TNFMCPService';

@Controller('mcp')
export class TNFMCPController {
  private readonly logger = new Logger(TNFMCPController.name);

  constructor(private readonly mcpService: TNFMCPService) {}

  @Get('status')
  async getStatus() {
    return this.mcpService.getServerStatus();
  }

  @Post('start-remote')
  async startRemoteServer(@Body() body: { port?: number }) {
    const port = body.port || 3001;
    
    try {
      await this.mcpService.startRemoteServer(port);
      return {
        success: true,
        message: `MCP Server started on port ${port}`,
        port,
      };
    } catch (error) {
      this.logger.error('Failed to start remote server:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('health')
  async getHealth() {
    const status = await this.mcpService.getServerStatus();
    
    return {
      status: status.initialized ? 'healthy' : 'unhealthy',
      details: status,
      timestamp: new Date().toISOString(),
    };
  }
}
