import { NextFunction, Request, Response } from 'express';

// Mock MCP Servers
const MARKETPLACE_SERVERS = [
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

export const getMarketplaceServers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json(MARKETPLACE_SERVERS);
  } catch (error) {
    next(error);
  }
};

export const installServer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serverId, configuration } = req.body;
    // Mock installation process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`Installing server ${serverId} with config`, configuration);

    res.status(200).json({ success: true, message: 'Server installed successfully' });
  } catch (error) {
    next(error);
  }
};
