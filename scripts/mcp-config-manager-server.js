#!/usr/bin/env node

/* eslint-disable no-undef */
/* eslint-disable no-console */

/**
 * MCP Server for MCP Configuration Manager
 *
 * This script creates an MCP server that exposes the functionality
 * of the MCP Configuration Manager through the Model Context Protocol.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const http = require('http');

// Configure stdin/stdout for the MCP protocol
process.stdin.setEncoding('utf8');
const rl = readline.createInterface({ input: process.stdin });

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: 'Method not allowed'}));
    return;
  }

  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    try {
      const request = JSON.parse(data);
      handleRequest(request, (response) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
      });
    } catch (error) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }));
    }
  });
});

// Start HTTP server
server.listen(3772, () => {
  console.error('MCP Config Manager Server listening on port 3772');
});

// Default paths for common MCP configuration files
const DEFAULT_CONFIG_PATHS = {
  claude: path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  fuse: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The New Fuse', 'mcp_config.json')
};

// Parse and handle MCP requests
// Handle stdin input
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    handleRequest(request, (response) => {
      console.log(JSON.stringify(response));
    });
  } catch (error) {
    console.error('Error processing request:', error);
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }));
  }
});

// Common request handler for both HTTP and stdin
function handleRequest(request, respond) {
  if (request.jsonrpc !== '2.0') {
    respond({
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32600,
        message: 'Invalid Request: Not JSON-RPC 2.0'
      }
    });
    return;
  }
  
  // Handle method calls
  switch (request.method) {
    case 'initialize':
      handleInitialize(request.id, request.params, respond);
      break;
    case 'initialized':
      // Acknowledgment that initialization is complete
      respond({
        jsonrpc: '2.0',
        id: request.id,
        result: {}
      });
      break;
    case 'tools/list':
    case 'rpc.discover':
      handleToolsList(request.id, respond);
      break;
    case 'tools/call':
    case 'call_tool':
      handleCallTool(request.id, request.params, respond);
      break;
    default:
      respond({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      });
  }
}

/**
 * Handle initialization requests
 */
function handleInitialize(id, params, respond) {
  // Respond with initialization success
  respond({
    jsonrpc: '2.0',
    id: id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        logging: {}
      },
      serverInfo: {
        name: 'mcp-config-manager',
        version: '1.0.0'
      }
    }
  });
}

/**
 * Handle tools list requests (modern MCP protocol)
 */
function handleToolsList(id, respond) {
  const tools = [
    {
      name: 'list_mcp_servers',
      description: 'List all registered MCP servers in a configuration file',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to the configuration file. Leave empty for Claude Desktop config.'
          }
        }
      }
    },
    {
      name: 'add_mcp_server',
      description: 'Add or update an MCP server in a configuration file',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to the configuration file. Leave empty for Claude Desktop config.'
          },
          name: {
            type: 'string',
            description: 'Name of the MCP server'
          },
          command: {
            type: 'string',
            description: 'Command to execute the MCP server'
          },
          args: {
            type: 'array',
            items: { type: 'string' },
            description: 'Arguments for the MCP server command'
          },
          env: {
            type: 'object',
            description: 'Environment variables for the MCP server'
          },
          description: {
            type: 'string',
            description: 'Description of the MCP server'
          }
        },
        required: ['name', 'command']
      }
    },
    {
      name: 'remove_mcp_server',
      description: 'Remove an MCP server from a configuration file',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Path to the configuration file. Leave empty for Claude Desktop config.'
          },
          name: {
            type: 'string',
            description: 'Name of the MCP server to remove'
          }
        },
        required: ['name']
      }
    }
  ];  respond({
    jsonrpc: '2.0',
    id: id,
    result: {
      tools: tools
    }
  });
}

/**
 * Handle tool calls
 */
function handleCallTool(id, params, respond) {
  const { tool_name, tool_args } = params;
  
  switch (tool_name) {
    case 'list_mcp_servers':
      listMCPServers(id, tool_args, respond);
      break;
    case 'add_mcp_server':
      addMCPServer(id, tool_args, respond);
      break;
    case 'remove_mcp_server':
      removeMCPServer(id, tool_args, respond);
      break;
    default:
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32601,
          message: `Tool not found: ${tool_name}`
        }
      });
  }
}

/**
 * List all MCP servers in a configuration file
 */
function listMCPServers(id, args, respond) {
  const configPath = args.config_path || DEFAULT_CONFIG_PATHS.claude;
  
  try {
    const config = readConfigFile(configPath);
    if (!config) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          tool_result: {
            servers: [],
            error: `Configuration file not found or invalid: ${configPath}`
          }
        }
      });
      return;
    }
    
    const servers = [];
    if (config.mcpServers) {
      Object.entries(config.mcpServers).forEach(([name, server]) => {
        servers.push({
          name,
          command: server.command,
          args: server.args
        });
      });
    }
    
    respond({
      jsonrpc: '2.0',
      id: id,
      result: {
        tool_result: { servers }
      }
    });
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error listing MCP servers: ${error.message}`
      }
    });
  }
}

/**
 * Add or update an MCP server in a configuration file
 */
function addMCPServer(id, args, respond) {
  const { config_path, name, command, args: cmdArgs } = args;
  const configPath = config_path || DEFAULT_CONFIG_PATHS.claude;
  
  try {
    // Read existing config or create new one
    let config = readConfigFile(configPath);
    if (!config) {
      config = { mcpServers: {} };
    }
    
    // Ensure mcpServers exists
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    // Add or update the server
    config.mcpServers[name] = {
      command,
      args: cmdArgs
    };
    
    // Write back to file
    if (writeConfigFile(configPath, config)) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          tool_result: {
            success: true,
            message: `MCP server "${name}" added/updated successfully in ${configPath}`
          }
        }
      });
    } else {
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: `Failed to write configuration to ${configPath}`
        }
      });
    }
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error adding MCP server: ${error.message}`
      }
    });
  }
}

/**
 * Remove an MCP server from a configuration file
 */
function removeMCPServer(id, args, respond) {
  const { config_path, name } = args;
  const configPath = config_path || DEFAULT_CONFIG_PATHS.claude;
  
  try {
    // Read existing config
    const config = readConfigFile(configPath);
    if (!config) {
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: `Configuration file not found: ${configPath}`
        }
      });
      return;
    }
    
    // Check if server exists
    if (!config.mcpServers || !config.mcpServers[name]) {
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: `MCP server "${name}" not found in configuration`
        }
      });
      return;
    }
    
    // Remove the server
    delete config.mcpServers[name];
    
    // Write back to file
    if (writeConfigFile(configPath, config)) {
      respond({
        jsonrpc: '2.0',
        id: id,
        result: {
          tool_result: {
            success: true,
            message: `MCP server "${name}" removed successfully from ${configPath}`
          }
        }
      });
    } else {
      respond({
        jsonrpc: '2.0',
        id: id,
        error: {
          code: -32603,
          message: `Failed to write configuration to ${configPath}`
        }
      });
    }
  } catch (error) {
    respond({
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32603,
        message: `Error removing MCP server: ${error.message}`
      }
    });
  }
}

/**
 * Read and parse a JSON configuration file
 */
function readConfigFile(configPath) {
  try {
    const expandedPath = expandPath(configPath);
    
    // Check if file exists
    if (!fs.existsSync(expandedPath)) {
      return null;
    }
    
    // Read and parse file
    const fileContent = fs.readFileSync(expandedPath, 'utf8');
    try {
      return JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`Error parsing JSON: ${parseError.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return null;
  }
}

/**
 * Write config data to a JSON file
 */
function writeConfigFile(configPath, data) {
  try {
    const expandedPath = expandPath(configPath);
    
    // Ensure directory exists
    const dirPath = path.dirname(expandedPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write the file with pretty formatting (2 spaces indent)
    fs.writeFileSync(expandedPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing file: ${error.message}`);
    return false;
  }
}

/**
 * Expand tilde in file paths (e.g. ~/file.json -> /Users/username/file.json)
 */
function expandPath(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

// MCP server initialization messages
console.error('MCP Config Manager Server initialized');
console.error('Listening on stdin for JSON-RPC requests');
console.error('HTTP server listening on port 3772');
