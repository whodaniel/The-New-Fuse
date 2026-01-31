#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.DRS_API_URL || 'http://localhost:8080';
const API_KEY = process.env.DRS_API_KEY;

class DrsServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-drs-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'find_mcp_servers',
            description: 'Find MCP servers based on capabilities, tools, or author.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: "Natural language search query (e.g., 'tools for analyzing video')",
                },
                toolName: {
                  type: 'string',
                  description: 'Specific tool name to look for',
                },
                author: {
                  type: 'string',
                  description: 'Author name',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'find_mcp_servers') {
        return this.handleFindServers(request.params.arguments);
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async handleFindServers(args) {
    try {
      // Construct query parameters
      const params = {};
      if (args.query) params.q = args.query;
      if (args.toolName) params.toolName = args.toolName;
      if (args.author) params.author = args.author;

      const headers = {};
      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      const response = await axios.get(`${API_BASE_URL}/api/servers`, {
        params,
        headers,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching from DRS API:', error.message);
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching servers: ${error.message}. ${API_KEY ? '' : 'Note: DRS_API_KEY is not set.'}`,
          },
        ],
        isError: true,
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DRS MCP Server running on stdio');
  }
}

const server = new DrsServer();
server.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
