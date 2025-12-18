/**
 * The New Fuse - Cloud Sandbox MCP Server
 * Handles WebSocket connections from local Tauri bridge sidecars
 * Provides headless browser, build tools, and AI inference capabilities
 */

import express from 'express';
import { createServer } from 'http';
import { Browser, Page, chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';

// ============================================================================
// TYPES
// ============================================================================

interface MCPMessage {
  jsonrpc: '2.0';
  id?: string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  authenticated: boolean;
  lastActivity: Date;
}

interface ToolHandler {
  name: string;
  description: string;
  inputSchema: object;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

// ============================================================================
// STATE
// ============================================================================

const clients = new Map<string, ConnectedClient>();
let browser: Browser | null = null;
let browserPage: Page | null = null;

// ============================================================================
// MCP TOOLS
// ============================================================================

const tools: ToolHandler[] = [
  {
    name: 'browser_navigate',
    description: 'Navigate headless browser to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
      },
      required: ['url'],
    },
    handler: async (params) => {
      const url = params.url as string;
      if (!browserPage) {
        browser = await chromium.launch({ headless: true });
        browserPage = await browser.newPage();
      }
      await browserPage.goto(url);
      return { success: true, url, title: await browserPage.title() };
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: { type: 'boolean', default: false },
      },
    },
    handler: async (params) => {
      if (!browserPage) {
        return { success: false, error: 'No browser page open' };
      }
      const screenshot = await browserPage.screenshot({
        fullPage: (params.fullPage as boolean) || false,
        type: 'png',
      });
      return { success: true, base64: screenshot.toString('base64') };
    },
  },
  {
    name: 'browser_click',
    description: 'Click on an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
      },
      required: ['selector'],
    },
    handler: async (params) => {
      if (!browserPage) {
        return { success: false, error: 'No browser page open' };
      }
      await browserPage.click(params.selector as string);
      return { success: true };
    },
  },
  {
    name: 'browser_type',
    description: 'Type text into an input element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        text: { type: 'string', description: 'Text to type' },
      },
      required: ['selector', 'text'],
    },
    handler: async (params) => {
      if (!browserPage) {
        return { success: false, error: 'No browser page open' };
      }
      await browserPage.fill(params.selector as string, params.text as string);
      return { success: true };
    },
  },
  {
    name: 'run_command',
    description: 'Execute a shell command in the sandbox',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory', default: '/app' },
      },
      required: ['command'],
    },
    handler: async (params) => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        const { stdout, stderr } = await execAsync(params.command as string, {
          cwd: (params.cwd as string) || '/app',
          timeout: 60000,
        });
        return { success: true, stdout, stderr };
      } catch (error: any) {
        return { success: false, error: error.message, stderr: error.stderr };
      }
    },
  },
  {
    name: 'read_remote_file',
    description: 'Read a file from the sandbox filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
      },
      required: ['path'],
    },
    handler: async (params) => {
      const fs = await import('fs/promises');
      try {
        const content = await fs.readFile(params.path as string, 'utf-8');
        return { success: true, content };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: 'write_remote_file',
    description: 'Write a file to the sandbox filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['path', 'content'],
    },
    handler: async (params) => {
      const fs = await import('fs/promises');
      try {
        await fs.writeFile(params.path as string, params.content as string);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
];

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

async function handleMCPMessage(client: ConnectedClient, message: MCPMessage): Promise<MCPMessage> {
  const { id, method, params } = message;

  // Handle initialize
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'tnf-cloud-sandbox',
          version: '1.0.0',
        },
      },
    };
  }

  // Handle tools/list
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
    };
  }

  // Handle tools/call
  if (method === 'tools/call') {
    const toolName = (params as any)?.name;
    const toolArgs = (params as any)?.arguments || {};

    const tool = tools.find((t) => t.name === toolName);
    if (!tool) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      };
    }

    try {
      const result = await tool.handler(toolArgs);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        },
      };
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: error.message },
      };
    }
  }

  // Unknown method
  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// ============================================================================
// SERVER SETUP
// ============================================================================

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    clients: clients.size,
    browserActive: !!browserPage,
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TNF Cloud Sandbox',
    version: '1.0.0',
    protocol: 'MCP 2024-11-05',
    tools: tools.map((t) => t.name),
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const client: ConnectedClient = {
    id: clientId,
    ws,
    authenticated: true, // TODO: Implement authentication
    lastActivity: new Date(),
  };
  clients.set(clientId, client);

  console.log(`🔌 Client connected: ${clientId} (Total: ${clients.size})`);

  ws.on('message', async (data) => {
    try {
      const message: MCPMessage = JSON.parse(data.toString());
      client.lastActivity = new Date();

      console.log(`📨 Received: ${message.method || 'response'} from ${clientId}`);

      const response = await handleMCPMessage(client, message);
      ws.send(JSON.stringify(response));
    } catch (error: any) {
      console.error('Message handling error:', error);
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
        })
      );
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`❌ Client disconnected: ${clientId} (Remaining: ${clients.size})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
    clients.delete(clientId);
  });
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down...');
  if (browser) {
    await browser.close();
  }
  server.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 TNF Cloud Sandbox running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`🔧 Available tools: ${tools.map((t) => t.name).join(', ')}`);
});
