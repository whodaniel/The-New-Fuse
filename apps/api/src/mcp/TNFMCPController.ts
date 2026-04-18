import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { TNFMCPService } from './TNFMCPService.js';

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
        message: (error as Error).message,
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

  @Get('marketplace')
  async getMarketplaceServers() {
    return [
      {
        id: 'vscode-mcp-server',
        name: 'VS Code MCP Server',
        description:
          'Enables AI agents to interact with Visual Studio Code through the Model Context Protocol',
        version: '1.2.0',
        publisher: 'MCP Foundation',
        category: 'Development Tools',
        rating: 4.8,
        downloads: 12503,
        lastUpdated: '2025-04-01',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/vscode-mcp-server'],
        capabilities: ['Code editing', 'File operations', 'Terminal commands', 'Diagnostics'],
        requiresConfiguration: false,
      },
      {
        id: 'filesystem-mcp-server',
        name: 'Filesystem MCP Server',
        description:
          'Provides secure filesystem access for AI agents through the Model Context Protocol',
        version: '0.9.5',
        publisher: 'MCP Foundation',
        category: 'File Management',
        rating: 4.6,
        downloads: 8921,
        lastUpdated: '2025-03-15',
        installCommand: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '--allow-dir', './data'],
        capabilities: ['File read', 'File write', 'Directory listing', 'File search'],
        requiresConfiguration: true,
        configurationSchema: {
          type: 'object',
          required: ['allowedDirectories'],
          properties: {
            allowedDirectories: {
              type: 'string',
              description: 'Comma-separated list of directories to allow access to',
            },
          },
        },
      },
    ];
  }

  @Post('install')
  async installServer(@Body() body: { serverId: string; configuration: any }) {
    const { serverId, configuration } = body;
    // Mock installation process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { success: true, message: `Server ${serverId} installed successfully` };
  }
}
