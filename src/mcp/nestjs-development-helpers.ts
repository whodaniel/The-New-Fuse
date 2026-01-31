import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';

const server = new Server(
  {
    name: 'nestjs-development-helpers',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_module',
        description: 'Generate a new NestJS module',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Module name' },
            path: { type: 'string', description: 'Target directory path' },
          },
          required: ['name'],
        },
      },
      {
        name: 'validate_imports',
        description: 'Validate NestJS imports and detect circular dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Source directory to validate' },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_module': {
        const moduleName = args?.name as string;
        const targetPath = (args?.path as string) || 'src';
        const output = execSync(`npx nest generate mo ${moduleName} ${targetPath}`, {
          cwd: PROJECT_ROOT,
        }).toString();
        return {
          content: [{ type: 'text', text: output }],
        };
      }
      case 'validate_imports': {
        const targetPath = (args?.path as string) || 'src';
        const output = execSync(`pnpm dlx madge --circular ${targetPath}`, {
          cwd: PROJECT_ROOT,
        }).toString();
        return {
          content: [{ type: 'text', text: output }],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NestJS Development Helpers MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
