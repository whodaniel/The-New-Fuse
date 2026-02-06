import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SearchResourceDto } from '../dto';
import { ResourceAccessControlService } from '../services/resource-access-control.service';
import { ResourceRegistryService } from '../services/resource-registry.service';
import { ResourceAction, ResourceCategory, ResourceType, ResourceVisibility } from '../types';

/**
 * MCP Server for Resource Registry
 * Exposes resource management capabilities to AI agents via MCP
 */
export class ResourceRegistryMCPServer {
  private server: Server;
  private resourceService: ResourceRegistryService;
  private accessControl: ResourceAccessControlService;

  constructor() {
    this.server = new Server(
      {
        name: 'resource-registry-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.resourceService = new ResourceRegistryService();
    this.accessControl = new ResourceAccessControlService();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_resources':
            return await this.searchResources(args);

          case 'get_resource':
            return await this.getResource(args);

          case 'create_resource':
            return await this.createResource(args);

          case 'update_resource':
            return await this.updateResource(args);

          case 'list_categories':
            return await this.listCategories();

          case 'get_resource_versions':
            return await this.getResourceVersions(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'search_resources',
        description: 'Search for resources with filters, sorting, and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for name, description, tags, keywords',
            },
            category: {
              type: 'array',
              items: { type: 'string', enum: Object.values(ResourceCategory) },
              description: 'Filter by categories',
            },
            type: {
              type: 'array',
              items: { type: 'string', enum: Object.values(ResourceType) },
              description: 'Filter by types',
            },
            visibility: {
              type: 'array',
              items: { type: 'string', enum: Object.values(ResourceVisibility) },
              description: 'Filter by visibility',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
            isVerified: {
              type: 'boolean',
              description: 'Filter verified resources only',
            },
            isFeatured: {
              type: 'boolean',
              description: 'Filter featured resources only',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            limit: {
              type: 'number',
              description: 'Items per page (default: 20, max: 100)',
            },
          },
        },
      },
      {
        name: 'get_resource',
        description: 'Get a specific resource by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Resource ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_resource',
        description: 'Create a new resource',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Resource name' },
            description: { type: 'string', description: 'Resource description' },
            category: {
              type: 'string',
              enum: Object.values(ResourceCategory),
              description: 'Resource category',
            },
            type: {
              type: 'string',
              enum: Object.values(ResourceType),
              description: 'Resource type',
            },
            content: { type: 'object', description: 'Resource content' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
            version: { type: 'string', description: 'Semantic version (e.g., 1.0.0)' },
            source: { type: 'string', description: 'Source identifier' },
            visibility: {
              type: 'string',
              enum: Object.values(ResourceVisibility),
              description: 'Visibility level',
            },
          },
          required: ['name', 'category', 'type', 'content', 'version', 'source'],
        },
      },
      {
        name: 'update_resource',
        description: 'Update an existing resource',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Resource ID' },
            name: { type: 'string', description: 'Resource name' },
            description: { type: 'string', description: 'Resource description' },
            content: { type: 'object', description: 'Resource content' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
            version: { type: 'string', description: 'Semantic version' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_categories',
        description: 'List all available resource categories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_resource_versions',
        description: 'Get all versions of a resource',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Resource ID' },
          },
          required: ['id'],
        },
      },
    ];
  }

  private async searchResources(args: any) {
    const searchDto: SearchResourceDto = {
      query: args.query,
      category: args.category,
      type: args.type,
      visibility: args.visibility,
      tags: args.tags,
      isVerified: args.isVerified,
      isFeatured: args.isFeatured,
      page: args.page || 1,
      limit: args.limit || 20,
    };

    const result = await this.resourceService.search(searchDto);

    // Filter by access (agent context)
    const context = {
      isAgent: true,
      isAdmin: false,
      agentId: 'mcp-agent',
    };

    const filteredData = this.accessControl.filterByAccess(result.data, context);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ...result,
              data: filteredData,
              total: filteredData.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getResource(args: any) {
    const resource = await this.resourceService.findById(args.id);

    // Check access (agent context)
    const context = {
      isAgent: true,
      isAdmin: false,
      agentId: 'mcp-agent',
    };

    this.accessControl.assertCanView(resource, context);

    // Log access
    await this.resourceService.logAccess(resource.id, ResourceAction.VIEW, 'mcp-agent', 'agent');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(resource, null, 2),
        },
      ],
    };
  }

  private async createResource(args: any) {
    const resource = await this.resourceService.create({
      ...args,
      authorId: 'mcp-agent',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(resource, null, 2),
        },
      ],
    };
  }

  private async updateResource(args: any) {
    const { id, ...updateData } = args;
    const resource = await this.resourceService.update(id, updateData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(resource, null, 2),
        },
      ],
    };
  }

  private async listCategories() {
    const categories = await this.resourceService.getCategories();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(categories, null, 2),
        },
      ],
    };
  }

  private async getResourceVersions(args: any) {
    const versions = await this.resourceService.getVersions(args.id);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(versions, null, 2),
        },
      ],
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Resource Registry MCP Server running on stdio');
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new ResourceRegistryMCPServer();
  server.start().catch(console.error);
}
