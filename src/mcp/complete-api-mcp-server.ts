import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { buildHermesNa10McpCommandPlan } from './hermes-na10-command.js';

// Config
const RUNTIME_STATE_PATH = path.resolve(process.cwd(), '.agent/runtime-state.json');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

const server = new McpServer({
  name: 'tnf-complete-api-wrapper',
  version: '1.0.0',
});

// Helper to read state
function getRuntimeState() {
  try {
    if (fs.existsSync(RUNTIME_STATE_PATH)) {
      const data = fs.readFileSync(RUNTIME_STATE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read runtime state:', e);
  }
  return null;
}

// Tool: list_agents
server.tool(
  'list_agents',
  'List all agents known to the TNF system, including Claw agents.',
  {},
  async () => {
    const state = getRuntimeState();
    if (!state || !state.agents) {
      return {
        content: [{ type: 'text', text: 'No agent state available.' }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(state.agents, null, 2),
        },
      ],
    };
  }
);

// Tool: list_models
server.tool('list_models', 'List available LLM models in the ecosystem.', {}, async () => {
  const state = getRuntimeState();
  if (!state || !state.llmModels) {
    return {
      content: [{ type: 'text', text: 'No model state available.' }],
      isError: true,
    };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(state.llmModels, null, 2),
      },
    ],
  };
});

// Tool: get_system_status
server.tool(
  'get_system_status',
  'Get the overall health and status of the TNF system.',
  {},
  async () => {
    const state = getRuntimeState();
    const status = {
      generatedAt: state?.generatedAt,
      counts: state?.counts,
      apiStatus: 'unknown',
    };

    // Try to ping API
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        status.apiStatus = 'online';
      } else {
        status.apiStatus = 'error';
      }
    } catch (e) {
      status.apiStatus = 'unreachable';
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }
);

// Tool: get_agent_details
server.tool(
  'get_agent_details',
  'Get detailed information about a specific agent by ID or name.',
  {
    identifier: z.string().describe('Agent ID (e.g., TNF:AGENT:...) or Name'),
  },
  async ({ identifier }) => {
    const state = getRuntimeState();
    if (!state || !state.agents) {
      return { content: [{ type: 'text', text: 'No state.' }], isError: true };
    }

    const agent = state.agents.find(
      (a: any) => a.tnf_id === identifier || a.name.toLowerCase() === identifier.toLowerCase()
    );

    if (!agent) {
      return {
        content: [{ type: 'text', text: `Agent '${identifier}' not found.` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(agent, null, 2),
        },
      ],
    };
  }
);

server.tool(
  'hermes_na10_mcp_command',
  'Generate the safe TNF-routed Hermes command template for connecting NA10 MCP credentials.',
  {
    serverName: z.string().optional().describe('MCP server name to register, default na10.'),
    configPath: z
      .string()
      .optional()
      .describe('Hermes MCP client config path, default data/mcp.clients/hermes.mcp.json.'),
  },
  async ({ serverName, configPath }) => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(buildHermesNa10McpCommandPlan({ serverName, configPath }), null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TNF Complete API Wrapper started');
}

main().catch((error) => {
  console.error('Fatal error in API Wrapper:', error);
  process.exit(1);
});
