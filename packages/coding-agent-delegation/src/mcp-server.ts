/**
 * Jules MCP Server
 * Model Context Protocol server that exposes Jules CLI as tools for AI agents
 */

import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types';
import * as fs from 'fs';
import * as path from 'path';
import { JulesClient } from './client.js';
import { JulesTaskTemplate } from './types.js';

// Initialize Jules client
const julesClient = new JulesClient();

// Create MCP server
const server = new Server(
  {
    name: 'jules-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

const TOOLS = [
  {
    name: 'jules_create_session',
    description: `Create a new Jules coding session. Jules is Google's autonomous AI coding agent that can work on tasks asynchronously. Use this to delegate complex coding tasks like implementing features, fixing bugs, refactoring code, or writing tests.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        task: {
          type: 'string',
          description:
            'The task description/instructions for Jules. Be specific about what you want done.',
        },
        repository: {
          type: 'string',
          description:
            'Optional: Repository in format "owner/repo". Defaults to current directory.',
        },
        workspace_context: {
          type: 'string',
          description: 'Optional: Additional context about the workspace/codebase to help Jules.',
        },
        parallel: {
          type: 'number',
          description: 'Optional: Number of parallel sessions to create (1-16). Default is 1.',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'jules_list_sessions',
    description:
      'List all Jules sessions. Returns information about active and completed coding sessions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of sessions to return. Default is 10.',
        },
      },
    },
  },
  {
    name: 'jules_get_session',
    description: 'Get details of a specific Jules session by ID.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID to retrieve.',
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'jules_pull_session',
    description:
      'Pull the results of a completed Jules session. Optionally apply the patch to the local repository.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID to pull.',
        },
        apply: {
          type: 'boolean',
          description: 'Whether to apply the patch to the local repository. Default is false.',
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'jules_teleport',
    description:
      'Teleport to a Jules session - clones the repository, checks out the branch, and applies the patch.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        session_id: {
          type: 'string',
          description: 'The session ID to teleport to.',
        },
      },
      required: ['session_id'],
    },
  },
  {
    name: 'jules_submit_batch',
    description:
      'Submit multiple tasks to Jules in parallel. Use this for bulk operations like creating multiple repositories or implementing multiple features.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              repository: { type: 'string' },
            },
            required: ['task'],
          },
          description: 'Array of tasks to submit.',
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'jules_list_templates',
    description: 'List available task templates from the .jules/tasks directory.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Optional: Filter by category (e.g., database, frontend, backend).',
        },
      },
    },
  },
  {
    name: 'jules_submit_template',
    description: 'Submit a predefined task template to Jules.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        template_id: {
          type: 'string',
          description: 'The template ID (e.g., "01", "02", or full name).',
        },
        repository: {
          type: 'string',
          description: 'Optional: Repository to use.',
        },
      },
      required: ['template_id'],
    },
  },
  {
    name: 'jules_check_status',
    description: 'Check if Jules CLI is available and the user is logged in.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// =============================================================================
// HANDLERS
// =============================================================================

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'jules_create_session': {
        const session = await julesClient.createSession({
          task: (args as { task: string }).task,
          repository: (args as { repository?: string }).repository,
          workspaceContext: (args as { workspace_context?: string }).workspace_context,
          parallel: (args as { parallel?: number }).parallel,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Jules session created successfully',
                  session,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_list_sessions': {
        const sessions = await julesClient.listSessions({
          limit: (args as { limit?: number }).limit,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ sessions }, null, 2),
            },
          ],
        };
      }

      case 'jules_get_session': {
        const session = await julesClient.getSession((args as { session_id: string }).session_id);
        return {
          content: [
            {
              type: 'text',
              text: session
                ? JSON.stringify({ session }, null, 2)
                : JSON.stringify({ error: 'Session not found' }),
            },
          ],
        };
      }

      case 'jules_pull_session': {
        const result = await julesClient.pullSession({
          sessionId: (args as { session_id: string }).session_id,
          apply: (args as { apply?: boolean }).apply,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: result.success,
                  output: result.stdout,
                  error: result.success ? undefined : result.stderr,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_teleport': {
        const result = await julesClient.teleport((args as { session_id: string }).session_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: result.success,
                  output: result.stdout,
                  error: result.success ? undefined : result.stderr,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_submit_batch': {
        const tasks = (args as { tasks: Array<{ task: string; repository?: string }> }).tasks;
        const result = await julesClient.createSessions(tasks);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jules_list_templates': {
        const templates = await listTemplates((args as { category?: string }).category);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ templates }, null, 2),
            },
          ],
        };
      }

      case 'jules_submit_template': {
        const template = await getTemplate((args as { template_id: string }).template_id);
        if (!template) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Template not found' }),
              },
            ],
          };
        }
        const session = await julesClient.submitTemplate(template, {
          repository: (args as { repository?: string }).repository,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Template "${template.name}" submitted to Jules`,
                  session,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'jules_check_status': {
        const isAvailable = await julesClient.isAvailable();
        const version = isAvailable ? await julesClient.getVersion() : null;
        const isLoggedIn = isAvailable ? await julesClient.isLoggedIn() : false;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  available: isAvailable,
                  version,
                  loggedIn: isLoggedIn,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// RESOURCES - Expose task templates as resources
// =============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const templates = await listTemplates();
  return {
    resources: templates.map((t) => ({
      uri: `jules://template/${t.id}`,
      name: t.name,
      description: t.description,
      mimeType: 'text/markdown',
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith('jules://template/')) {
    const templateId = uri.replace('jules://template/', '');
    const template = await getTemplate(templateId);

    if (template) {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: `# ${template.name}\n\n**Category:** ${template.category}\n**Complexity:** ${template.complexity ?? 'N/A'}\n\n## Description\n${template.description}\n\n## Instructions\n${template.instruction}`,
          },
        ],
      };
    }
  }

  throw new Error(`Resource not found: ${uri}`);
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function listTemplates(category?: string): Promise<JulesTaskTemplate[]> {
  const tasksDir = path.join(process.cwd(), '.jules', 'tasks');
  const templates: JulesTaskTemplate[] = [];

  try {
    const files = fs.readdirSync(tasksDir);

    for (const file of files) {
      if (file.startsWith('JULES_TASK_') && file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(tasksDir, file), 'utf-8');
        const template = parseTemplateFile(file, content);

        if (template) {
          if (!category || template.category === category) {
            templates.push(template);
          }
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return templates;
}

async function getTemplate(templateId: string): Promise<JulesTaskTemplate | null> {
  const templates = await listTemplates();

  // Match by ID number (e.g., "01") or full ID
  return templates.find((t) => t.id === templateId || t.id.includes(templateId)) ?? null;
}

function parseTemplateFile(filename: string, content: string): JulesTaskTemplate | null {
  // Extract ID from filename (e.g., "JULES_TASK_01_drizzle_user_repository.md" -> "01")
  const idMatch = filename.match(/JULES_TASK_(\d+)_(.+)\.md/);
  if (!idMatch) return null;

  const id = idMatch[1];
  const nameFromFile = idMatch[2].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Extract mission brief from content
  const missionMatch = content.match(/<mission_brief>([\s\S]*?)<\/mission_brief>/);
  const workspaceMatch = content.match(/<workspace_context>([\s\S]*?)<\/workspace_context>/);

  // Try to extract task name from content
  const taskMatch = content.match(/## Task: (.+)/);
  const name = taskMatch ? taskMatch[1] : nameFromFile;

  // Determine category from filename or content
  let category = 'general';
  if (filename.includes('drizzle') || filename.includes('database')) {
    category = 'database';
  } else if (filename.includes('frontend') || filename.includes('dashboard')) {
    category = 'frontend';
  } else if (filename.includes('api') || filename.includes('backend')) {
    category = 'backend';
  } else if (filename.includes('security') || filename.includes('audit')) {
    category = 'security';
  } else if (filename.includes('test')) {
    category = 'testing';
  } else if (filename.includes('documentation') || filename.includes('readme')) {
    category = 'documentation';
  }

  return {
    id,
    name,
    description: `Task from template: ${filename}`,
    category,
    instruction: missionMatch ? missionMatch[1].trim() : content,
    workspaceContext: workspaceMatch ? workspaceMatch[1].trim() : undefined,
    complexity: parseInt(id) > 10 ? 3 : parseInt(id) > 5 ? 4 : 5,
    tags: [category],
  };
}

// =============================================================================
// START SERVER
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jules MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start Jules MCP Server:', error);
  process.exit(1);
});
