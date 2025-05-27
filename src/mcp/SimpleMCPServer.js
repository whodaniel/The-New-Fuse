#!/usr/bin/env node

// Simple MCP Server implementation for The New Fuse
const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

// Load configuration
let config;
try {
  // Look for config file in a few different locations
  const configPaths = [
    path.resolve(__dirname, '../../src/vscode-extension/mcp_config.json'),
    path.resolve(__dirname, '../../src/vscode-extension/mcp_config.json'),
    path.resolve(__dirname, '../../mcp_config.json'),
    path.resolve('./mcp_config.json'),
  ];
  
  let configPath;
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      configPath = p;
      break;
    }
  }
  
  if (configPath) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Loaded MCP configuration from:', configPath);
  } else {
    throw new Error('Configuration file not found');
  }
} catch (error) {
  console.error('Error loading configuration:', error.message);
  config = {
    version: '1.0',
    servers: { main: { port: 3000 } },
    logging: { level: 'info' }
  };
  console.log('Using default configuration');
}

// Create logger
const logDir = path.resolve('./mcp/logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = fs.createWriteStream(path.join(logDir, 'mcp-server.log'), { flags: 'a' });
const logger = {
  info: (message) => {
    const logEntry = `[${new Date().toISOString()}] INFO: ${message}\n`;
    console.log(message);
    logFile.write(logEntry);
  },
  error: (message, error) => {
    const logEntry = `[${new Date().toISOString()}] ERROR: ${message} ${error ? error.stack || error.message : ''}\n`;
    console.error(message, error);
    logFile.write(logEntry);
  }
};

// In-memory database for demo purposes
const agents = [
  {
    id: 'text-analysis-agent',
    name: 'Text Analysis Agent',
    description: 'Analyzes text for sentiment and entities',
    capabilities: ['text-analysis', 'sentiment-analysis', 'entity-extraction'],
    status: 'active'
  },
  {
    id: 'code-generation-agent',
    name: 'Code Generation Agent',
    description: 'Generates code in multiple languages',
    capabilities: ['code-generation', 'code-review', 'code-explanation'],
    status: 'active'
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
let portArg = args.find(arg => arg.startsWith('--port='));
let port;

if (portArg) {
  port = parseInt(portArg.split('=')[1]);
} else {
  portArg = args.indexOf('--port');
  if (portArg !== -1 && args.length > portArg + 1) {
    port = parseInt(args[portArg + 1]);
  }
}

// Get port from environment, arguments, config, or default
port = process.env.PORT || port || (config.servers?.main?.port) || 3000;

// Simple HTML landing page for the root route
const landingPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse - MCP Server</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            color: #2c3e50;
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            background-color: #27ae60;
            color: white;
            font-weight: bold;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoints {
            margin-top: 20px;
        }
        .endpoint {
            background-color: #fff;
            border-left: 4px solid #3498db;
            padding: 10px 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .endpoint h3 {
            margin-top: 0;
            color: #3498db;
        }
        code {
            background-color: #f1f1f1;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: monospace;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9em;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <header>
        <h1>The New Fuse - MCP Server</h1>
        <div class="status">Running</div>
    </header>

    <div class="container">
        <p>
            The Model Context Protocol (MCP) server is currently active and ready to receive requests.
            This server facilitates communication between AI agents and components in The New Fuse ecosystem.
        </p>

        <div class="endpoints">
            <h2>Available Endpoints</h2>
            
            <div class="endpoint">
                <h3>Health Check</h3>
                <p>Check if the MCP server is running properly.</p>
                <p><strong>URL:</strong> <code>http://localhost:${port}/health</code></p>
                <p><strong>Method:</strong> <code>GET</code></p>
            </div>
            
            <div class="endpoint">
                <h3>List Agents</h3>
                <p>Get a list of all available agents and their capabilities.</p>
                <p><strong>URL:</strong> <code>http://localhost:${port}/api/agents</code></p>
                <p><strong>Method:</strong> <code>GET</code></p>
            </div>
            
            <div class="endpoint">
                <h3>MCP Request</h3>
                <p>Send a request to an agent through the MCP protocol.</p>
                <p><strong>URL:</strong> <code>http://localhost:${port}/mcp/request</code></p>
                <p><strong>Method:</strong> <code>POST</code></p>
                <p><strong>Body example:</strong></p>
                <pre><code>{
  "target": {
    "agentId": "text-analysis-agent"
  },
  "capability": "sentiment-analysis",
  "action": "analyze-sentiment",
  "parameters": {
    "text": "I really enjoyed using The New Fuse framework!"
  }
}</code></pre>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>The New Fuse v${config.version} - MCP Server</p>
        <p>For more information, check the <a href="https://github.com/whodaniel/fuse">documentation</a>.</p>
    </div>
</body>
</html>
`;

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = parse(req.url, true);
  const pathname = url.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Root route - serve the landing page
  if (pathname === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(landingPage);
    return;
  }
  
  // Health check endpoint
  if (pathname === '/health' || pathname === '/ping') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok', version: config.version }));
    return;
  }
  
  // List agents endpoint
  if (pathname === '/api/agents' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ data: agents }));
    return;
  }
  
  // MCP request endpoint
  if (pathname === '/mcp/request' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        logger.info(`Received MCP request: ${JSON.stringify(request)}`);
        
        // Simple echo response for demonstration
        const response = {
          id: `response-${Date.now()}`,
          status: 'success',
          data: {
            message: 'MCP request received',
            request: request
          }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(response));
      } catch (error) {
        logger.error('Error processing request', error);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          status: 'error', 
          error: { message: 'Invalid request format' } 
        }));
      }
    });
    
    return;
  }
  
  // Default 404 response
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'error', error: { message: 'Not Found' } }));
});

// Start server
server.listen(port, () => {
  logger.info(`MCP Server running at http://localhost:${port}/`);
  logger.info(`Health check available at http://localhost:${port}/health`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  logger.info('Server shutting down...');
  server.close(() => {
    logger.info('Server closed');
    logFile.end();
    process.exit(0);
  });
});