/**
 * The New Fuse - Cloud Sandbox MCP Server
 * Handles WebSocket connections from local Tauri bridge sidecars
 * Provides shell command execution, file system, and browser automation capabilities
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { createServer } from 'http';
import { promisify } from 'util';

import express from 'express';
import { Browser, Page, chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';

import type { WebSocket } from 'ws';

const execAsync = promisify(exec);

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
// BROWSER STATE (Playwright)
// ============================================================================

let browser: Browser | null = null;
let activePage: Page | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    console.log('🌐 Launching headless Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function getPage(): Promise<Page> {
  if (!activePage) {
    const b = await getBrowser();
    activePage = await b.newPage();
  }
  return activePage;
}

// ============================================================================
// STATE
// ============================================================================

const clients = new Map<string, ConnectedClient>();

// ============================================================================
// MCP TOOLS
// ============================================================================

const tools: ToolHandler[] = [
  // -------------------------------------------------------------------------
  // Browser Automation Tools
  // -------------------------------------------------------------------------
  {
    name: 'browser_navigate',
    description: 'Navigate the headless browser to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
        waitUntil: {
          type: 'string',
          description: 'When to consider navigation complete',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          default: 'domcontentloaded',
        },
      },
      required: ['url'],
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        const waitUntil =
          (params.waitUntil as 'load' | 'domcontentloaded' | 'networkidle') || 'domcontentloaded';
        await page.goto(params.url as string, { waitUntil, timeout: 30000 });
        const title = await page.title();
        return { success: true, url: params.url, title };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to save screenshot',
          default: '/tmp/screenshot.png',
        },
        fullPage: {
          type: 'boolean',
          description: 'Capture full page or viewport only',
          default: false,
        },
      },
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        const path = (params.path as string) || '/tmp/screenshot.png';
        const fullPage = (params.fullPage as boolean) || false;
        await page.screenshot({ path, fullPage });
        return { success: true, path };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'browser_click',
    description: 'Click an element on the page by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to click' },
      },
      required: ['selector'],
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        await page.click(params.selector as string, { timeout: 10000 });
        return { success: true, selector: params.selector };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'browser_type',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of input field' },
        text: { type: 'string', description: 'Text to type' },
        clear: { type: 'boolean', description: 'Clear field before typing', default: true },
      },
      required: ['selector', 'text'],
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        const selector = params.selector as string;
        if (params.clear !== false) {
          await page.fill(selector, '');
        }
        await page.type(selector, params.text as string);
        return { success: true, selector, text: params.text };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'browser_get_content',
    description: 'Get the text content of the current page or a specific element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (optional, defaults to body)' },
      },
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        const selector = (params.selector as string) || 'body';
        const content = await page.textContent(selector);
        const url = page.url();
        const title = await page.title();
        return { success: true, url, title, content };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'browser_evaluate',
    description: 'Execute JavaScript in the browser context',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript code to execute' },
      },
      required: ['script'],
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        const result = await page.evaluate(params.script as string);
        return { success: true, result };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'browser_wait',
    description: 'Wait for an element or a timeout',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for' },
        timeout: { type: 'number', description: 'Timeout in milliseconds', default: 10000 },
      },
    },
    handler: async (params) => {
      try {
        const page = await getPage();
        if (params.selector) {
          await page.waitForSelector(params.selector as string, {
            timeout: (params.timeout as number) || 10000,
          });
          return { success: true, found: params.selector };
        } else {
          await page.waitForTimeout((params.timeout as number) || 1000);
          return { success: true, waited: params.timeout };
        }
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  // -------------------------------------------------------------------------
  // Shell & File System Tools
  // -------------------------------------------------------------------------
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
      try {
        const { stdout, stderr } = await execAsync(params.command as string, {
          cwd: (params.cwd as string) || '/app',
          timeout: 60000,
        });
        return { success: true, stdout, stderr };
      } catch (error: unknown) {
        const err = error as { message: string; stderr?: string };
        return { success: false, error: err.message, stderr: err.stderr };
      }
    },
  },
  {
    name: 'read_file',
    description: 'Read a file from the sandbox filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
      },
      required: ['path'],
    },
    handler: async (params) => {
      try {
        const content = await fs.readFile(params.path as string, 'utf-8');
        return { success: true, content };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'write_file',
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
      try {
        await fs.writeFile(params.path as string, params.content as string);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'list_directory',
    description: 'List files in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
      },
      required: ['path'],
    },
    handler: async (params) => {
      try {
        const files = await fs.readdir(params.path as string);
        return { success: true, files };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    },
  },
  {
    name: 'echo',
    description: 'Echo back a message (for testing)',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to echo' },
      },
      required: ['message'],
    },
    handler: async (params) => {
      return { success: true, echo: params.message };
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
    const toolName = (params as { name?: string })?.name;
    const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {};

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
    } catch (error: unknown) {
      const err = error as { message: string };
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message },
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

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    clients: clients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'TNF Cloud Sandbox',
    version: '1.0.0',
    protocol: 'MCP 2024-11-05',
    tools: tools.map((t) => t.name),
    websocket: '/ws',
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

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
    } catch (error: unknown) {
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
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down...');
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
