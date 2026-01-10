console.log('!!! SERVER STARTING - VERSION 16 (LIVE VIEW) !!!');
/**
 * The New Fuse - Cloud Sandbox MCP Server
 * Handles WebSocket connections from local Tauri bridge sidecars
 * Provides shell command execution, file system, and browser automation capabilities
 */

// CRITICAL: Set Playwright browser path BEFORE importing playwright
// This must be at the very top of the file
// process.env.PLAYWRIGHT_BROWSERS_PATH = '/ms-playwright';

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
// ============================================================================
// LIVE VIEW & BROADCASTING
// ============================================================================
import { promisify } from 'util';

// Self-healing: Install Playwright browsers if missing
try {
  console.log('📦 checking/installing Playwright browsers...');

  // Set writable paths for non-root user
  // Use HOME directory which should be writable
  const homeDir = process.env.HOME || '/home/app-user';
  const localBrowsersPath = `${homeDir}/pw-browsers`;
  const npmCachePath = `${homeDir}/.npm-cache`;

  console.log(`📂 Configuration:
    - PLAYWRIGHT_BROWSERS_PATH: ${localBrowsersPath}
    - NPM_CONFIG_CACHE: ${npmCachePath}
  `);

  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsersPath;
  process.env.NPM_CONFIG_CACHE = npmCachePath;

  // Create directories using execSync (safe, synchronous)
  try {
    console.log(`Creation ${localBrowsersPath}...`);
    // Need execSync from import, will add later
    const { execSync: es } = await import('child_process');
    es(`mkdir -p "${localBrowsersPath}"`, { stdio: 'inherit' });
    console.log(`Creation ${npmCachePath}...`);
    es(`mkdir -p "${npmCachePath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('⚠️ Failed to create directories:', e);
  }

  // Attempt installation ASYNC
  console.log('Running playwright install (ASYNC)...');

  // Check if binary exists using shell
  let useBinary = false;
  try {
    // Use test command to check presence
    const { execSync: es } = await import('child_process');
    es('[ -f ./node_modules/.bin/playwright ]');
    useBinary = true;
  } catch {}

  const cmd = useBinary
    ? './node_modules/.bin/playwright install chromium'
    : 'npx --yes playwright install chromium';

  console.log(`Executing: ${cmd}`);

  const installProcess = exec(cmd, {
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: npmCachePath,
      PLAYWRIGHT_BROWSERS_PATH: localBrowsersPath,
    },
  });

  installProcess.stdout?.on('data', (d: any) => console.log(`📦 Install: ${d.toString().trim()}`));
  installProcess.stderr?.on('data', (d: any) =>
    console.error(`📦 Install Err: ${d.toString().trim()}`)
  );

  installProcess.on('exit', (code: any) => {
    console.log(`✅ Browser installation completed with code ${code}`);
    try {
      // Async read dir
      fs.readdir(localBrowsersPath)
        .then((files) => console.log('📂 Browser dir content:', files))
        .catch((e) => console.log('Empty browser dir', e));
    } catch (e) {
      console.log('Read failed', e);
    }
  });
} catch (e) {
  console.error('❌ Browser installation setup failed:', e);
}

import express from 'express';
import { chromium } from 'playwright';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';

import type { Browser, Page } from 'playwright';
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
    console.log('PLAYWRIGHT_BROWSERS_PATH:', process.env.PLAYWRIGHT_BROWSERS_PATH);

    const fsSync = await import('fs');

    // Scan standard Playwright cache locations
    const cachePaths = [
      '/ms-playwright',
      '/root/.cache/ms-playwright',
      '/home/pwuser/.cache/ms-playwright',
    ];
    for (const p of cachePaths) {
      if (fsSync.existsSync(p)) {
        console.log(`📂 Contents of ${p}:`, fsSync.readdirSync(p));
      } else {
        console.log(`❌ ${p} DOES NOT EXIST`);
      }
    }

    // Extensive list of possible chromium locations
    const possiblePaths = [
      '/ms-playwright/chromium-1091/chrome-linux/chrome',
      '/root/.cache/ms-playwright/chromium-1091/chrome-linux/chrome',
      '/home/pwuser/.cache/ms-playwright/chromium-1091/chrome-linux/chrome',
      '/ms-playwright/chromium-1088/chrome-linux/chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
    ];

    let execPath: string | undefined;
    for (const path of possiblePaths) {
      if (fsSync.existsSync(path)) {
        execPath = path;
        console.log(`✅ Found Chromium at: ${path}`);
        break;
      }
    }

    // Fallback to Playwright's own detection
    if (!execPath) {
      try {
        const detected = chromium.executablePath();
        console.log(`Playwright detected: ${detected}`);
        if (fsSync.existsSync(detected)) {
          execPath = detected;
        }
      } catch (e) {
        console.log('Detection failed:', e);
      }
    }

    console.log(`Using executable: ${execPath || 'none'}`);

    if (!execPath) {
      throw new Error('No Chromium found');
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: execPath,
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
// LIVE VIEW & BROADCASTING
// ============================================================================

// Helper to broadcast to heartbeat clients
function broadcastToHeartbeat(type: string, payload: any) {
  const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  for (const client of heartbeatClients.values()) {
    if (client.ws.readyState === 1) {
      // OPEN
      client.ws.send(msg);
    }
  }
}

// Helper to capture and broadcast screenshot
async function captureAndBroadcast(action: string) {
  if (!activePage) {
    return;
  }
  try {
    const screenshot = await activePage.screenshot({ type: 'jpeg', quality: 60, scale: 'css' });
    const base64 = screenshot.toString('base64');
    const imageUri = `data:image/jpeg;base64,${base64}`;

    // Broadcast to legacy heartbeat clients
    broadcastToHeartbeat('screenshot', { action, image: imageUri });

    // Broadcast to new Socket.IO Live View
    if (typeof broadcastScreenshotToLiveView === 'function') {
      broadcastScreenshotToLiveView(imageUri, action);
    } else {
      // Fallback if not physically hoisted or circular dep issues (runtime safety)
      const globalBroadcast = (global as any).broadcastScreenshotToLiveView;
      if (globalBroadcast) globalBroadcast(imageUri, action);
    }
  } catch (e) {
    console.error('Snapshot failed:', e);
  }
}

// Wrapper for tool handlers to auto-screenshot
const withBroadcast = (actionName: string, handler: (params: any) => Promise<any>) => {
  return async (params: any) => {
    try {
      const result = await handler(params);
      // Fire and forget screenshot
      captureAndBroadcast(actionName).catch(console.error);
      return result;
    } catch (e) {
      throw e;
    }
  };
};

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
    handler: withBroadcast('navigate', async (params) => {
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
    }),
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
    handler: withBroadcast('screenshot', async (params) => {
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
    }),
  },
  {
    name: 'browser_click',
    description: 'Click an element on the page by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to click' },
      },
      required: ['selector'],
    },
    handler: withBroadcast('click', async (params) => {
      try {
        const page = await getPage();
        await page.click(params.selector as string);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    }),
  },
  {
    name: 'browser_type',
    description: 'Type text into an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        text: { type: 'string', description: 'Text to type' },
      },
      required: ['selector', 'text'],
    },
    handler: withBroadcast('type', async (params) => {
      try {
        const page = await getPage();
        await page.fill(params.selector as string, params.text as string);
        return { success: true };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    }),
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
    handler: withBroadcast('evaluate', async (params) => {
      try {
        const page = await getPage();
        const result = await page.evaluate(params.script as string);
        return { success: true, result };
      } catch (error: unknown) {
        const err = error as { message: string };
        return { success: false, error: err.message };
      }
    }),
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
        }
        await page.waitForTimeout((params.timeout as number) || 1000);
        return { success: true, waited: params.timeout };
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

// Enable CORS for all origins to allow WebSocket connections from external viewers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Upgrade, Connection'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ============================================================================
// HTTP FALLBACK FOR AGENTS (Bypass Proxy Issues)
// Hosted HIGH in the stack to avoid 'static' middleware interference
// ============================================================================

app.use(express.json()); // Ensure body parsing is enabled globally

app.get('/ping', (req, res) => res.send('pong'));

app.post('/api/agent/call', async (req, res) => {
  try {
    const message = req.body;
    const clientId = 'http-agent-' + new Date().getTime();

    console.log(`📨 Received via HTTP: ${(message as MCPMessage).method || 'response'}`);

    // Create ephemeral client context with Mock WS
    const client: ConnectedClient = {
      id: clientId,
      ws: { send: () => {}, readyState: 1 } as any,
      authenticated: true,
      lastActivity: new Date(),
    };

    const response = await handleMCPMessage(client, message as MCPMessage);
    res.json(response);
  } catch (error) {
    console.error('HTTP Agent Error:', error);
    res.status(500).json({ error: { code: -32603, message: 'Internal error' } });
  }
});

// Serve viewer manually to debug
app.get('/viewer', (req, res) => {
  const p = join(process.cwd(), 'public', 'viewer.html');
  console.log(`Attempting to serve viewer from: ${p}`);
  res.sendFile(p);
});

// Resolve public path relative to CWD /app
const publicPath = join(process.cwd(), 'public');
console.log(`📂 Serving static files from: ${publicPath}`);
app.use(express.static(join(process.cwd(), 'public')));
app.use('/public', express.static(join(process.cwd(), 'public')));

try {
  import('fs').then((fs) => {
    if (fs.existsSync(publicPath)) {
      console.log('📂 Public dir contents:', fs.readdirSync(publicPath));
    } else {
      console.error(`❌ Public dir ${publicPath} does not exist!`);
      // Try to find it
      const tryPaths = ['public', 'src/public', '../public', '/app/public'];
      for (const p of tryPaths) {
        if (fs.existsSync(p)) {
          console.log(`found candidate: ${p}`);
        }
      }
    }
  });
} catch (e) {
  console.error(e);
}

app.get('/debug-fs', async (_req, res) => {
  const fs = await import('fs');
  const recursiveList = (dir: string): any[] => {
    try {
      return fs.readdirSync(dir).map((f) => {
        const full = join(dir, f);
        const stat = fs.statSync(full);
        return stat.isDirectory() ? { name: f, children: recursiveList(full) } : f;
      });
    } catch (e) {
      return [`error: ${e}`];
    }
  };
  res.json({ cwd: process.cwd(), __dirname, files: recursiveList(process.cwd()) });
});

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

app.post('/audit/agents', async (_req, res) => {
  console.log('🕵️ Starting Agent Page Audit...');
  console.log('User:', process.env.USER || 'unknown');
  console.log('Home:', process.env.HOME);
  console.log('PLAYWRIGHT_BROWSERS_PATH (Current):', process.env.PLAYWRIGHT_BROWSERS_PATH);

  try {
    const fs = await import('fs');
    if (fs.existsSync('/ms-playwright')) {
      console.log('✅ /ms-playwright exists! Contents:', fs.readdirSync('/ms-playwright'));
    } else {
      console.log('❌ /ms-playwright DOES NOT EXIST');
    }
  } catch (e) {
    console.log('Error checking path:', e);
  }

  try {
    const page = await getPage();
    const report: any[] = [];

    // 1. Navigate
    console.log('Navigate -> https://thenewfuse.com/agents');
    await page.goto('https://thenewfuse.com/agents', { waitUntil: 'domcontentloaded' });
    report.push({ step: 'Navigate', url: page.url(), title: await page.title() });

    // 2. Search
    console.log('Search -> Typing "Dev"');
    const searchSelector = 'input[placeholder*="Search"], input[type="text"]';
    try {
      await page.waitForSelector(searchSelector, { timeout: 5000 });
      await page.fill(searchSelector, '');
      await page.type(searchSelector, 'Dev');
      await page.waitForTimeout(2000);

      const ssPath = '/tmp/audit_agents_search.png';
      await page.screenshot({ path: ssPath });
      report.push({ step: 'Search', status: 'Success', screenshot: ssPath });
    } catch (e) {
      report.push({ step: 'Search', status: 'Failed', error: (e as Error).message });
    }

    // 3. Verify Content
    const content = await page.textContent('body');
    const hasDev = content?.includes('Dev') || false;
    report.push({ step: 'Verification', foundKeyword: hasDev });

    console.log('✅ Audit Complete');
    res.json({ success: true, report });
  } catch (error) {
    console.error('❌ Audit Failed:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: '/ws',
  perMessageDeflate: false,
});

// Simple test WebSocket endpoint for debugging
const testWss = new WebSocketServer({ server, path: '/ws-test' });
testWss.on('connection', (ws) => {
  console.log('🧪 Test WS client connected');
  ws.send(JSON.stringify({ type: 'hello', message: 'Connection successful!' }));

  ws.on('message', (data) => {
    console.log('🧪 Test WS received:', data.toString());
    ws.send(JSON.stringify({ type: 'echo', received: data.toString() }));
  });

  ws.on('close', () => {
    console.log('🧪 Test WS client disconnected');
  });
});

// ============================================================================
// HTTP FALLBACK FOR AGENTS (Bypass Proxy Issues)
// ============================================================================

app.use(express.json()); // Ensure body parsing is enabled

app.post('/api/agent/call', async (req, res) => {
  try {
    const message = req.body;
    const clientId = 'http-agent-' + new Date().getTime();

    // Create ephemeral client context
    const client: ConnectedClient = {
      id: clientId,
      ws: {
        // Mock WS for handler compatibility
        send: () => {},
        readyState: 1,
      } as any,
      authenticated: true,
      lastActivity: new Date(),
    };

    console.log(`📨 Received via HTTP: ${(message as MCPMessage).method || 'response'}`);
    const response = await handleMCPMessage(client, message as MCPMessage);
    res.json(response);
  } catch (error) {
    console.error('HTTP Agent Error:', error);
    res.status(500).json({ error: { code: -32603, message: 'Internal error' } });
  }
});

// ============================================================================
// SOCKET.IO LIVE VIEW SERVER (Better Railway compatibility)
// ============================================================================

const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins for now - tighten in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'], // Polling MUST be first for Railway
  path: '/socket.io/',
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track connected Live View monitors
const liveViewMonitors = new Map<string, { socketId: string; tenantId?: string }>();

io.on('connection', (socket) => {
  const clientId = socket.id;
  console.log(`📺 Socket.IO client connected: ${clientId}`);

  // Send welcome message
  socket.emit('welcome', {
    message: 'Connected to TNF Cloud Sandbox Live View',
    clientId,
    transport: socket.conn.transport.name,
  });

  // Handle monitor registration
  socket.on('register_monitor', (data: { tenantId?: string }) => {
    liveViewMonitors.set(clientId, { socketId: clientId, tenantId: data?.tenantId });
    console.log(`📺 Monitor registered: ${clientId}, tenant: ${data?.tenantId || 'default'}`);

    // Join tenant-specific room if provided
    if (data?.tenantId) {
      socket.join(`tenant:${data.tenantId}`);
    } else {
      socket.join('global'); // Default room for all viewers
    }

    socket.emit('registered', { success: true, monitors: liveViewMonitors.size });
  });

  socket.on('disconnect', (reason) => {
    liveViewMonitors.delete(clientId);
    clients.delete(clientId); // Remove from agent clients if registered
    console.log(`📺 Monitor disconnected: ${clientId} (${reason})`);
  });

  // ==========================================================================
  // HYBRID AGENT SUPPORT (Socket.IO -> MCP)
  // This allows agents to connect via Polling if WebSockets are blocked by proxies
  // ==========================================================================

  socket.on('agent_message', async (data: any) => {
    try {
      // Create a persistent client wrapper if it doesn't exist
      if (!clients.has(clientId)) {
        // Mock the WebSocket interface for the MCP handler
        const mockWs: any = {
          send: (msg: string) => socket.emit('agent_response', JSON.parse(msg)),
          readyState: 1,
        };

        const client: ConnectedClient = {
          id: clientId,
          ws: mockWs,
          authenticated: true,
          lastActivity: new Date(),
        };
        clients.set(clientId, client);
        console.log(`🔌 Hybrid Socket.IO Agent connected: ${clientId}`);
      }

      const client = clients.get(clientId)!;
      client.lastActivity = new Date();

      console.log(
        `📨 Received via Socket.IO: ${(data as MCPMessage).method || 'response'} from ${clientId}`
      );

      const response = await handleMCPMessage(client, data as MCPMessage);
      // Send response back via specific event
      socket.emit('agent_response', response);
    } catch (error) {
      console.error('Socket.IO Agent Error:', error);
      socket.emit('agent_error', { code: -32700, message: 'Parse error' });
    }
  });
});

// Function to broadcast screenshots to Live View monitors via Socket.IO
function broadcastScreenshotToLiveView(screenshot: string, action: string, tenantId?: string) {
  const payload = {
    type: 'screenshot',
    image: screenshot,
    action,
    timestamp: Date.now(),
  };

  if (tenantId) {
    io.to(`tenant:${tenantId}`).emit('screenshot', payload);
  } else {
    io.to('global').emit('screenshot', payload);
  }

  console.log(`📷 Broadcast screenshot to ${liveViewMonitors.size} monitors (action: ${action})`);
}

// Export for use in browser tools
(global as any).broadcastScreenshotToLiveView = broadcastScreenshotToLiveView;

// ============================================================================
// HEARTBEAT MONITORING SYSTEM
// ============================================================================

interface AgentHeartbeat {
  agentId: string;
  lastHeartbeat: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'stalled' | 'failed';
  consecutiveFailures: number;
  currentTask?: string;
}

interface HeartbeatClient {
  id: string;
  ws: WebSocket;
  type: 'monitor'; // Client type for heartbeat connections
}

const agentHeartbeats = new Map<string, AgentHeartbeat>();
const heartbeatClients = new Map<string, HeartbeatClient>();

// Heartbeat configuration
const HEARTBEAT_CONFIG = {
  intervalMs: 10000, // Check every 10 seconds
  timeoutMs: 30000, // Agent timeout after 30 seconds
  stagnationThresholdMs: 60000, // Stagnation after 1 minute
};

// Heartbeat WebSocket server
const heartbeatWss = new WebSocketServer({ server, path: '/ws/heartbeat' });

heartbeatWss.on('connection', (ws) => {
  const clientId = uuidv4();
  const client: HeartbeatClient = {
    id: clientId,
    ws,
    type: 'monitor',
  };
  heartbeatClients.set(clientId, client);

  console.log(`💓 Heartbeat client connected: ${clientId} (Total: ${heartbeatClients.size})`);

  // Send initial system health
  sendSystemHealth(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleHeartbeatMessage(clientId, message);
    } catch (error) {
      console.error('Heartbeat message error:', error);
    }
  });

  ws.on('close', () => {
    heartbeatClients.delete(clientId);
    console.log(`💔 Heartbeat client disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`Heartbeat error for ${clientId}:`, error);
    heartbeatClients.delete(clientId);
  });
});

function handleHeartbeatMessage(
  clientId: string,
  message: { type: string; payload?: Record<string, unknown> }
): void {
  switch (message.type) {
    case 'register_agent': {
      const agentId = message.payload?.agentId as string;
      if (agentId) {
        registerAgent(agentId);
        broadcastToHeartbeatClients({ type: 'agent_registered', payload: { agentId } });
      }
      break;
    }
    case 'heartbeat': {
      const agentId = message.payload?.agentId as string;
      const taskId = message.payload?.taskId as string | undefined;
      if (agentId) {
        recordHeartbeat(agentId, taskId);
      }
      break;
    }
    case 'activity': {
      const agentId = message.payload?.agentId as string;
      if (agentId) {
        recordActivity(agentId);
      }
      break;
    }
    case 'get_system_health': {
      const client = heartbeatClients.get(clientId);
      if (client) {
        sendSystemHealth(client.ws);
      }
      break;
    }
    case 'get_agent_health': {
      const agentId = message.payload?.agentId as string;
      const client = heartbeatClients.get(clientId);
      if (client && agentId) {
        const health = agentHeartbeats.get(agentId);
        client.ws.send(
          JSON.stringify({
            type: 'agent_health',
            payload: health || null,
          })
        );
      }
      break;
    }
  }
}

function registerAgent(agentId: string): void {
  agentHeartbeats.set(agentId, {
    agentId,
    lastHeartbeat: new Date(),
    lastActivity: new Date(),
    status: 'active',
    consecutiveFailures: 0,
  });
  console.log(`📝 Agent registered: ${agentId}`);
}

function recordHeartbeat(agentId: string, taskId?: string): void {
  let heartbeat = agentHeartbeats.get(agentId);
  if (!heartbeat) {
    registerAgent(agentId);
    heartbeat = agentHeartbeats.get(agentId)!;
  }

  heartbeat.lastHeartbeat = new Date();
  heartbeat.lastActivity = new Date();
  heartbeat.status = 'active';
  heartbeat.consecutiveFailures = 0;
  if (taskId) {
    heartbeat.currentTask = taskId;
  }

  broadcastToHeartbeatClients({
    type: 'heartbeat_received',
    payload: { agentId, taskId },
  });
}

function recordActivity(agentId: string): void {
  const heartbeat = agentHeartbeats.get(agentId);
  if (heartbeat) {
    heartbeat.lastActivity = new Date();
    heartbeat.status = 'active';
  }
}

function getSystemHealth(): object {
  const agents = Array.from(agentHeartbeats.values());
  const now = new Date();

  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const stalledAgents = agents.filter((a) => a.status === 'stalled').length;
  const failedAgents = agents.filter((a) => a.status === 'failed').length;

  const responseTimes = agents
    .filter((a) => a.status === 'active')
    .map((a) => now.getTime() - a.lastHeartbeat.getTime());

  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

  // Count alerts
  const criticalAlerts = agents.filter(
    (a) => a.status === 'stalled' && a.consecutiveFailures > 3
  ).length;
  const emergencyAlerts = agents.filter(
    (a) => a.status === 'failed' || a.consecutiveFailures > 5
  ).length;

  return {
    totalAgents: agents.length,
    activeAgents,
    stalledAgents,
    failedAgents,
    activeAlerts: stalledAgents + failedAgents,
    criticalAlerts,
    emergencyAlerts,
    averageResponseTime,
    lastUpdate: now.toISOString(),
  };
}

function sendSystemHealth(ws: WebSocket): void {
  ws.send(
    JSON.stringify({
      type: 'system_health',
      payload: getSystemHealth(),
    })
  );
}

function broadcastToHeartbeatClients(message: object): void {
  const data = JSON.stringify(message);
  for (const client of heartbeatClients.values()) {
    if (client.ws.readyState === 1) {
      // WebSocket.OPEN
      client.ws.send(data);
    }
  }
}

// Periodic health check
function performHealthCheck(): void {
  const now = new Date();

  for (const [agentId, heartbeat] of agentHeartbeats.entries()) {
    const timeSinceLastHeartbeat = now.getTime() - heartbeat.lastHeartbeat.getTime();
    const timeSinceLastActivity = now.getTime() - heartbeat.lastActivity.getTime();

    let newStatus = heartbeat.status;

    // Check for timeout
    if (timeSinceLastHeartbeat > HEARTBEAT_CONFIG.timeoutMs * 2) {
      newStatus = 'failed';
      heartbeat.consecutiveFailures++;
    } else if (timeSinceLastActivity > HEARTBEAT_CONFIG.stagnationThresholdMs) {
      newStatus = 'stalled';
      heartbeat.consecutiveFailures++;
    } else if (timeSinceLastHeartbeat > HEARTBEAT_CONFIG.timeoutMs) {
      newStatus = 'idle';
    }

    if (heartbeat.status !== newStatus) {
      heartbeat.status = newStatus;
      broadcastToHeartbeatClients({
        type: 'agent_status_changed',
        payload: { agentId, newStatus },
      });

      if (newStatus === 'stalled') {
        broadcastToHeartbeatClients({
          type: 'stagnation_detected',
          payload: {
            agentId,
            taskId: heartbeat.currentTask || 'unknown',
            stagnationType: 'no_progress',
            detectedAt: now.toISOString(),
            duration: timeSinceLastActivity,
            severity:
              heartbeat.consecutiveFailures > 5
                ? 'emergency'
                : heartbeat.consecutiveFailures > 3
                  ? 'critical'
                  : 'warning',
          },
        });
      }

      if (newStatus === 'failed' && heartbeat.consecutiveFailures > 5) {
        broadcastToHeartbeatClients({
          type: 'human_intervention_required',
          payload: {
            agentId,
            alert: {
              stagnationType: 'timeout',
              severity: 'emergency',
            },
            message: `Agent ${agentId} has failed after ${heartbeat.consecutiveFailures} consecutive failures`,
          },
        });
      }
    }
  }

  // Broadcast updated health to all clients
  for (const client of heartbeatClients.values()) {
    sendSystemHealth(client.ws);
  }
}

// Start heartbeat monitoring
setInterval(performHealthCheck, HEARTBEAT_CONFIG.intervalMs);
console.log('💓 Heartbeat monitoring started');

// ============================================================================
// MAIN WebSocket connection handling
// ============================================================================

// WebSocket connection handling - supports both MCP clients and Live View monitors
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  let isMonitor = false; // Track if this is a Live View monitor client

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
      const message = JSON.parse(data.toString());
      client.lastActivity = new Date();

      // Check if this is a monitor registration message (from Live View viewer)
      if (message.type === 'register_monitor') {
        isMonitor = true;
        // Add to heartbeat clients for broadcast (using the HeartbeatClient interface)
        const monitorClient: HeartbeatClient = {
          id: clientId,
          ws,
          type: 'monitor',
        };
        heartbeatClients.set(clientId, monitorClient);
        console.log(`📺 Monitor registered: ${clientId} (Live View client)`);

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'welcome',
            payload: { clientId, message: 'Connected to TNF Cloud Sandbox Live View' },
          })
        );
        return;
      }

      // Regular MCP message handling
      console.log(`📨 Received: ${(message as MCPMessage).method || 'response'} from ${clientId}`);

      const response = await handleMCPMessage(client, message as MCPMessage);
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
    if (isMonitor) {
      heartbeatClients.delete(clientId);
      console.log(`📺 Monitor disconnected: ${clientId}`);
    }
    console.log(`❌ Client disconnected: ${clientId} (Remaining: ${clients.size})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
    clients.delete(clientId);
    if (isMonitor) {
      heartbeatClients.delete(clientId);
    }
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
  console.log(`💓 Heartbeat endpoint: ws://localhost:${PORT}/ws/heartbeat`);
  console.log(`🔧 Available tools: ${tools.map((t) => t.name).join(', ')}`);
});
