import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';

const server = new Server(
  {
    name: 'pnpm-workspace-manager',
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
        name: 'list_packages',
        description: 'List all packages in the pnpm workspace',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'run_package_script',
        description: 'Run a script in a specific package',
        inputSchema: {
          type: 'object',
          properties: {
            package: { type: 'string', description: 'Package name (e.g., @the-new-fuse/core)' },
            script: { type: 'string', description: 'Script name (e.g., build, test)' },
          },
          required: ['package', 'script'],
        },
      },
      {
        name: 'add_dependency',
        description: 'Add a dependency to a specific package',
        inputSchema: {
          type: 'object',
          properties: {
            package: { type: 'string', description: 'Target package name' },
            dependency: { type: 'string', description: 'Dependency name and version' },
            dev: { type: 'boolean', description: 'Whether it is a dev dependency' },
          },
          required: ['package', 'dependency'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_packages': {
        const output = execSync('pnpm mls --json', { cwd: PROJECT_ROOT }).toString();
        return {
          content: [{ type: 'text', text: output }],
        };
      }
      case 'run_package_script': {
        const pkg = args?.package as string;
        const script = args?.script as string;
        const output = execSync(`pnpm --filter ${pkg} run ${script}`, {
          cwd: PROJECT_ROOT,
        }).toString();
        return {
          content: [{ type: 'text', text: output }],
        };
      }
      case 'add_dependency': {
        const pkg = args?.package as string;
        const dep = args?.dependency as string;
        const dev = args?.dev ? '-D' : '';
        const output = execSync(`pnpm --filter ${pkg} add ${dev} ${dep}`, {
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
  console.error('PNPM Workspace Manager MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
