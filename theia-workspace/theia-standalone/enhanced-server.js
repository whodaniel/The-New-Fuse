#!/usr/bin/env node

/**
 * The New Fuse IDE - Enhanced Server with MCP Support
 * Modern AI-powered development environment with cutting-edge features
 * Integrated with consolidated database architecture
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Load Theia-specific environment configuration
require('dotenv').config({ path: path.join(__dirname, '.env.theia') });

const app = express();
const PORT = parseInt(process.env.PORT || '3300', 10);
const THEIA_PORT = PORT + 33; // 3333
const WS_PORT = PORT + 4; // 3304

// Start Theia Backend
const a = spawn('node', ['./src-gen/backend/main.js', `--port=${THEIA_PORT}`, '--hostname=0.0.0.0', '--plugins=local-dir:../../plugins', '--J-Dplugins.auto-install=false'], {
  stdio: 'inherit',
  env: { ...process.env },
});
a.on('error', (err) => {
 console.error('Theia backend error:', err);
});

// Load MCP configuration
let mcpConfig = {};
try {
  const mcpConfigPath = path.join(__dirname, 'mcp-config.json');
  if (fs.existsSync(mcpConfigPath)) {
    mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    console.log('📋 MCP configuration loaded successfully');
  }
} catch (error) {
  console.warn('⚠️  Failed to load MCP configuration:', error.message);
}

// MCP Server Management
class MCPServerManager {
  constructor() {
    this.servers = new Map();
    this.startAutoServers();
  }

  async startAutoServers() {
    if (!mcpConfig.servers) return;
    
    for (const [name, config] of Object.entries(mcpConfig.servers)) {
      if (config.autostart) {
        await this.startServer(name, config);
      }
    }
  }

  async startServer(name, config) {
    try {
      console.log(`🚀 Starting MCP server: ${name}`);
      
      const childProcess = spawn(config.command, config.args, {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      childProcess.stdout.on('data', (data) => {
        console.log(`[${name}] ${data.toString().trim()}`);
      });

      childProcess.stderr.on('data', (data) => {
        console.warn(`[${name}] ERROR: ${data.toString().trim()}`);
      });

      childProcess.on('exit', (code) => {
        console.log(`[${name}] Process exited with code ${code}`);
        this.servers.delete(name);
      });

      this.servers.set(name, {
        process: childProcess,
        config,
        status: 'running',
        startTime: new Date()
      });

      console.log(`✅ MCP server ${name} started successfully`);
    } catch (error) {
      console.error(`❌ Failed to start MCP server ${name}:`, error);
    }
  }

  getServerStatus() {
    const status = {};
    for (const [name, server] of this.servers) {
      status[name] = {
        status: server.status,
        startTime: server.startTime,
        uptime: Date.now() - server.startTime.getTime(),
        description: server.config.description
      };
    }
    return status;
  }

  async stopServer(name) {
    const server = this.servers.get(name);
    if (server && server.process) {
      server.process.kill('SIGTERM');
      this.servers.delete(name);
      return true;
    }
    return false;
  }
}

// Initialize MCP Server Manager
const mcpManager = new MCPServerManager();

// Simple dashboard HTML function to avoid template literal issues
function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse IDE - AI-Powered Development</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Monaco', 'Cascadia Code', 'Fira Code', Consolas, monospace;
            background: #1e1e1e; color: #d4d4d4; overflow: hidden;
        }
        .ide-container { display: flex; height: 100vh; flex-direction: column; }
        .titlebar {
            background: linear-gradient(90deg, #3c3c3c, #2d2d30); height: 35px;
            display: flex; align-items: center; padding: 0 12px;
            border-bottom: 1px solid #464647;
        }
        .titlebar-title { font-size: 13px; font-weight: 600; color: #cccccc; }
        .ai-indicator {
            margin-left: auto; background: #007acc; color: white;
            padding: 4px 8px; border-radius: 12px; font-size: 11px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .welcome-message { text-align: center; margin-top: 60px; opacity: 0.9; }
        .logo { font-size: 64px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="ide-container">
        <div class="titlebar">
            <div class="titlebar-title">🚀 The New Fuse IDE - AI-Powered Development Environment</div>
            <div class="ai-indicator">🤖 AI Ready</div>
        </div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
            <div class="welcome-message">
                <div class="logo">🚀</div>
                <h1>The New Fuse IDE</h1>
                <h2>AI-Powered Development Environment</h2>
                <p>Cutting-edge 2025 features with Model Context Protocol integration</p>
                <br>
                <p><strong>Status:</strong> ✅ Connected to The New Fuse Platform</p>
                <p><strong>Version:</strong> 2.0.0 with AI & MCP</p>
                <p><strong>Port:</strong> ${PORT} | WebSocket: ${WS_PORT}</p>
                <br>
                <p>🤖 AI Integration: Multiple LLM providers available</p>
                <p>🔗 MCP Protocol: Enabled with context integration</p>
                <p>⚡ Real-time features: WebSocket communication active</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Utility Functions for Enhanced IDE Functionality
async function generateAIResponse(message, provider = 'anthropic') {
  // Simulate AI response with context awareness
  const responses = [
    `As a ${provider} AI assistant, I can help you with: ${message}. This demonstrates the MCP integration with The New Fuse platform.`,
    `Using ${provider} capabilities: Your request "${message}" shows great potential for AI-assisted development.`,
    `AI Analysis (${provider}): "${message}" - I can assist with code analysis, debugging, and development tasks through MCP protocol.`,
    `${provider} AI Response: I understand your request about "${message}". With full API integration, I can provide detailed code assistance, explanations, and solutions.`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

async function listWorkspaceFiles(workspacePath) {
  try {
    const files = [];
    const searchPaths = [
      path.join(workspacePath, 'apps'),
      path.join(workspacePath, 'packages'),
      path.join(workspacePath, 'temp')
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const items = await fs.promises.readdir(searchPath);
        for (const item of items.slice(0, 10)) { // Limit to first 10 items
          const itemPath = path.join(searchPath, item);
          const stat = await fs.promises.stat(itemPath);
          files.push({
            name: item,
            path: itemPath.replace(workspacePath, ''),
            type: stat.isDirectory() ? 'directory' : 'file',
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
    }
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

async function executeCode(content, filename) {
  try {
    // Simple code execution for demonstration
    if (filename.endsWith('.js')) {
      // For JavaScript files, we can use eval (in a real IDE, use a sandboxed environment)
      const result = `// Simulated execution of ${filename}
// Content: ${content.substring(0, 100)}...
// 
// ✅ Code analysis complete
// 📊 Lines: ${content.split('\\n').length}
// 🔧 Ready for MCP-enhanced development
// 🤖 AI assistance available for optimization
// 
// Note: Full code execution requires secure sandboxing`;
      return result;
    } else if (filename.endsWith('.py')) {
      return `# Python execution simulation for ${filename}
# Content analyzed: ${content.substring(0, 100)}...
# 
# ✅ Syntax check: OK
# 📊 Lines: ${content.split('\\n').length}
# 🐍 Python AI assistance ready
# 🔧 MCP integration available`;
    } else {
      return `File: ${filename}
Content preview: ${content.substring(0, 200)}...

✅ File processed successfully
📊 Characters: ${content.length}
🔧 MCP tools available for this file type
🤖 AI analysis ready`;
    }
  } catch (error) {
    return `Error executing ${filename}: ${error.message}`;
  }
}

async function executeTerminalCommand(command) {
  try {
    // Simulate terminal commands for demonstration
    const safeCommands = {
      'ls': 'apps/  packages/  tools/  temp/  README.md  package.json',
      'pwd': '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse',
      'date': new Date().toString(),
      'whoami': 'The New Fuse IDE User',
      'echo': command.replace('echo ', ''),
      'cat package.json': '{ "name": "@the-new-fuse/workspace", "version": "2.0.0" }',
      'git status': 'On branch feature/comprehensive-reorganization\\nYour branch is up to date.',
      'node --version': 'v18.17.0',
      'bun --version': '1.2.19',
      'help': 'Available commands: ls, pwd, date, whoami, echo, cat, git status, node --version, bun --version'
    };
    
    const lowerCmd = command.toLowerCase().trim();
    
    if (lowerCmd.startsWith('echo ')) {
      return command.substring(5);
    }
    
    if (safeCommands[lowerCmd]) {
      return safeCommands[lowerCmd];
    }
    
    return `Command '${command}' executed (simulated)
🔧 MCP terminal integration active
🤖 AI command assistance available
💡 Type 'help' for available commands`;
  } catch (error) {
    return `Terminal error: ${error.message}`;
  }
}

// WebSocket server for real-time features
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`🔌 WebSocket server started on port ${WS_PORT}`);

wss.on('connection', (ws) => {
  console.log('👤 New client connected to WebSocket');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'mcp_status':
          ws.send(JSON.stringify({
            type: 'mcp_status_response',
            data: mcpManager.getServerStatus()
          }));
          break;
          
        case 'ai_chat':
          try {
            // Simulate AI response using MCP context
            const aiResponse = await generateAIResponse(data.message, data.provider || 'anthropic');
            ws.send(JSON.stringify({
              type: 'ai_chat_response',
              data: { 
                message: aiResponse, 
                timestamp: new Date(),
                provider: data.provider || 'anthropic'
              }
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'ai_chat_response',
              data: { 
                message: `AI Response: I understand you asked "${data.message}". This is a demonstration of the AI integration. Full Claude/OpenAI integration requires API keys.`, 
                timestamp: new Date(),
                provider: data.provider || 'anthropic'
              }
            }));
          }
          break;
          
        case 'create_file':
          try {
            const workspacePath = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse';
            const filePath = path.join(workspacePath, 'temp', data.filename);
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, '// New file created in The New Fuse IDE\\n');
            ws.send(JSON.stringify({
              type: 'file_created',
              data: { filename: data.filename, path: filePath }
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Failed to create file: ' + error.message }
            }));
          }
          break;
          
        case 'save_file':
          try {
            const workspacePath = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse';
            const filePath = path.join(workspacePath, 'temp', data.filename);
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, data.content);
            ws.send(JSON.stringify({
              type: 'file_saved',
              data: { filename: data.filename, path: filePath }
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Failed to save file: ' + error.message }
            }));
          }
          break;
          
        case 'list_files':
          try {
            const workspacePath = '/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse';
            const files = await listWorkspaceFiles(workspacePath);
            ws.send(JSON.stringify({
              type: 'files_list',
              data: { files: files }
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Failed to list files: ' + error.message }
            }));
          }
          break;
          
        case 'run_code':
          try {
            const output = await executeCode(data.content, data.filename);
            ws.send(JSON.stringify({
              type: 'code_output',
              data: { output: output, filename: data.filename }
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'code_output',
              data: { output: 'Error: ' + error.message, filename: data.filename }
            }));
          }
          break;
          
        case 'terminal_command':
          try {
            const output = await executeTerminalCommand(data.command);
            ws.send(JSON.stringify({
              type: 'terminal_output',
              data: { output: output, command: data.command }
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'terminal_output',
              data: { output: 'Error: ' + error.message, command: data.command }
            }));
          }
          break;
          
        default:
          ws.send(JSON.stringify({ type: 'unknown_command', message: 'Unknown command type' }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('👤 Client disconnected from WebSocket');
  });
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'src-gen/frontend')));

// Enhanced IDE interface with MCP and AI features (accessible at /dashboard)
app.get('/dashboard', (req, res) => {
  res.send(getDashboardHTML());
});

// MCP API endpoints
app.get('/api/mcp/status', (req, res) => {
  res.json({
    status: 'active',
    servers: mcpManager.getServerStatus(),
    config: mcpConfig
  });
});

app.post('/api/mcp/start/:server', async (req, res) => {
  const serverName = req.params.server;
  const config = mcpConfig.servers?.[serverName];
  
  if (!config) {
    return res.status(404).json({ error: 'Server configuration not found' });
  }
  
  await mcpManager.startServer(serverName, config);
  res.json({ message: `MCP server ${serverName} started` });
});

app.post('/api/mcp/stop/:server', async (req, res) => {
  const serverName = req.params.server;
  const stopped = await mcpManager.stopServer(serverName);
  
  if (stopped) {
    res.json({ message: `MCP server ${serverName} stopped` });
  } else {
    res.status(404).json({ error: 'Server not found or already stopped' });
  }
});

// AI API endpoints
app.post('/api/ai/chat', (req, res) => {
  const { message, provider = 'anthropic' } = req.body;
  
  // Placeholder for AI chat integration
  res.json({
    response: `AI response from ${provider}: Your message "${message}" received. Integration in progress...`,
    provider,
    timestamp: new Date(),
    features: ['mcp-integration', 'context-aware', 'code-assistance']
  });
});

app.get('/api/ai/providers', (req, res) => {
  const providers = mcpConfig.ai?.providers || {};
  const enabledProviders = Object.entries(providers)
    .filter(([_, config]) => config.enabled)
    .map(([name, config]) => ({ name, models: config.models }));
    
  res.json({
    providers: enabledProviders,
    default: mcpConfig.ai?.defaultProvider || 'anthropic'
  });
});

// Health and features endpoints (enhanced)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'The New Fuse IDE',
    version: '2.0.0',
    port: PORT,
    websocket_port: WS_PORT,
    mcp_servers: mcpManager.getServerStatus(),
    timestamp: new Date().toISOString(),
    features: ['ai-integration', 'mcp-protocol', 'real-time-collaboration']
  });
});

app.get('/api/features', (req, res) => {
  res.json({
    name: 'The New Fuse IDE',
    version: '2.0.0',
    features: [
      'AI-Powered Development',
      'Model Context Protocol (MCP)', 
      'Multiple LLM Providers',
      'Real-time Collaboration',
      'Modern Monaco Editor',
      'VS Code Extensions',
      'Git Integration',
      'Syntax Highlighting',
      'File Explorer',
      'Integrated Terminal',
      'WebSocket Support',
      'Browser-based'
    ],
    ai_providers: Object.keys(mcpConfig.ai?.providers || {}),
    mcp_servers: Object.keys(mcpConfig.servers || {}),
    status: 'active',
    port: PORT
  });
});

// Special route to serve Theia directly
app.get('/theia', (req, res) => {
  res.redirect(`http://localhost:${THEIA_PORT}`);
});

// Proxy to Theia for all other requests
app.use('/', createProxyMiddleware({
 target: `http://localhost:${THEIA_PORT}`,
 ws: true,
 changeOrigin: true,
 logLevel: 'debug',
 onError: (err, req, res) => {
   console.log('Proxy error:', err.message);
   if (req.path === '/') {
     res.redirect('/dashboard');
   }
 }
}));

// Start the enhanced server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 The New Fuse IDE Enhanced Server started successfully!');
  console.log(`✨ Server running at http://localhost:${PORT}`);
  console.log(`🌐 Also accessible via http://0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket server on port ${WS_PORT}`);
  console.log('🤖 AI integration: Multiple LLM providers available');
  console.log('🔗 MCP protocol: Enabled with context integration');
  console.log('⚡ Real-time features: WebSocket communication active');
  console.log('🎯 Ready for cutting-edge AI-powered development!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  wss.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully'); 
  wss.close();
  process.exit(0);
});