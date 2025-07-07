#!/usr/bin/env node

/**
 * TNF Relay MCP Direct Server
 * Direct MCP server implementation of TNF relay functionality
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

class TNFRelayMCPDirect {
  constructor() {
    this.server = new Server(
      {
        name: "tnf-relay-direct",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.workspaceDir = path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The New Fuse');
    this.relayInstances = new Map();
    this.logPath = path.join(this.workspaceDir, 'tnf-relay-mcp.log');
    
    this.setupHandlers();
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    console.error(logEntry.trim()); // Use stderr for MCP logging
    
    try {
      await fs.appendFile(this.logPath, logEntry);
    } catch (error) {
      console.error('Logging error:', error);
    }
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "start_relay_instance",
            description: "Start a TNF relay instance with specified configuration",
            inputSchema: {
              type: "object",
              properties: {
                instance_name: {
                  type: "string",
                  description: "Name for this relay instance"
                },
                mode: {
                  type: "string",
                  enum: ["comprehensive", "websocket", "proxy"],
                  description: "Relay mode to start",
                  default: "comprehensive"
                },
                ports: {
                  type: "object",
                  properties: {
                    http: { type: "number", default: 3000 },
                    websocket: { type: "number", default: 3001 },
                    proxy: { type: "number", default: 8888 },
                    ui: { type: "number", default: 3002 }
                  }
                }
              },
              required: ["instance_name"]
            }
          },
          {
            name: "stop_relay_instance",
            description: "Stop a running relay instance",
            inputSchema: {
              type: "object",
              properties: {
                instance_name: {
                  type: "string",
                  description: "Name of instance to stop"
                }
              },
              required: ["instance_name"]
            }
          },
          {
            name: "list_relay_instances",
            description: "List all running relay instances",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "send_relay_message",
            description: "Send message to relay instance via HTTP API",
            inputSchema: {
              type: "object",
              properties: {
                instance_name: {
                  type: "string",
                  description: "Target relay instance"
                },
                endpoint: {
                  type: "string",
                  description: "API endpoint (e.g., '/send', '/intercept-rules')"
                },
                method: {
                  type: "string",
                  enum: ["GET", "POST", "PUT", "DELETE"],
                  default: "POST"
                },
                data: {
                  type: "object",
                  description: "Request payload"
                }
              },
              required: ["instance_name", "endpoint"]
            }
          },
          {
            name: "connect_websocket_client",
            description: "Connect to relay WebSocket for real-time communication",
            inputSchema: {
              type: "object",
              properties: {
                instance_name: {
                  type: "string",
                  description: "Relay instance to connect to"
                },
                client_type: {
                  type: "string",
                  enum: ["agent", "chrome_extension", "vscode"],
                  description: "Type of client connecting"
                },
                client_id: {
                  type: "string",
                  description: "Unique client identifier"
                }
              },
              required: ["instance_name", "client_type", "client_id"]
            }
          },
          {
            name: "configure_proxy_settings",
            description: "Configure system proxy settings to use TNF relay",
            inputSchema: {
              type: "object",
              properties: {
                instance_name: {
                  type: "string",
                  description: "Relay instance to use as proxy"
                },
                enable: {
                  type: "boolean",
                  description: "Enable or disable proxy",
                  default: true
                }
              },
              required: ["instance_name"]
            }
          },
          {
            name: "get_relay_status",
            description: "Get detailed status of a relay instance",
            inputSchema: {
              type: "object",
              properties: {
                instance_name: {
                  type: "string",
                  description: "Relay instance name"
                }
              },
              required: ["instance_name"]
            }
          },
          {
            name: "discover_tnf_services",
            description: "Discover all TNF-related services and processes",
            inputSchema: {
              type: "object",
              properties: {
                scan_depth: {
                  type: "string",
                  enum: ["basic", "comprehensive"],
                  description: "Depth of service discovery",
                  default: "comprehensive"
                }
              }
            }
          }
        ]
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "tnf-relay://instances",
            name: "Relay Instances",
            description: "All running TNF relay instances",
            mimeType: "application/json"
          },
          {
            uri: "tnf-relay://logs",
            name: "Relay Logs",
            description: "TNF relay system logs",
            mimeType: "text/plain"
          },
          {
            uri: "tnf-relay://config",
            name: "Relay Configuration",
            description: "Current relay configuration and settings",
            mimeType: "application/json"
          },
          {
            uri: "tnf-relay://services",
            name: "TNF Services",
            description: "Discovered TNF services and their status",
            mimeType: "application/json"
          },
          {
            uri: "tnf-relay://workspace",
            name: "Workspace Info",
            description: "TNF workspace directory and file information",
            mimeType: "application/json"
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "start_relay_instance":
            return await this.startRelayInstance(args);
          case "stop_relay_instance":
            return await this.stopRelayInstance(args);
          case "list_relay_instances":
            return await this.listRelayInstances();
          case "send_relay_message":
            return await this.sendRelayMessage(args);
          case "connect_websocket_client":
            return await this.connectWebSocketClient(args);
          case "configure_proxy_settings":
            return await this.configureProxySettings(args);
          case "get_relay_status":
            return await this.getRelayStatus(args);
          case "discover_tnf_services":
            return await this.discoverTNFServices(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        await this.log(`Error executing ${name}: ${error.message}`, 'ERROR');
        return {
          content: [
            {
              type: "text",
              text: `❌ Error executing ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      try {
        switch (uri) {
          case "tnf-relay://instances":
            return await this.getInstancesResource();
          case "tnf-relay://logs":
            return await this.getLogsResource();
          case "tnf-relay://config":
            return await this.getConfigResource();
          case "tnf-relay://services":
            return await this.getServicesResource();
          case "tnf-relay://workspace":
            return await this.getWorkspaceResource();
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Error reading resource ${uri}: ${error.message}`);
      }
    });
  }

  async startRelayInstance(args) {
    const { instance_name, mode = "comprehensive", ports = {} } = args;
    
    if (this.relayInstances.has(instance_name)) {
      throw new Error(`Relay instance '${instance_name}' already exists`);
    }

    const defaultPorts = {
      http: 3000,
      websocket: 3001,
      proxy: 8888,
      ui: 3002
    };
    
    const finalPorts = { ...defaultPorts, ...ports };
    
    let scriptPath;
    let scriptArgs = [];
    
    switch (mode) {
      case "comprehensive":
        scriptPath = path.join(this.workspaceDir, 'comprehensive-tnf-relay.js');
        scriptArgs = ['start'];
        break;
      case "websocket":
        scriptPath = path.join(this.workspaceDir, 'relay-server/index.js');
        break;
      case "proxy":
        scriptPath = path.join(this.workspaceDir, 'tnf-relay.js');
        scriptArgs = ['start'];
        break;
      default:
        throw new Error(`Unknown relay mode: ${mode}`);
    }

    // Check if script exists
    await fs.access(scriptPath);
    
    // Start the process
    const process = spawn('node', [scriptPath, ...scriptArgs], {
      cwd: this.workspaceDir,
      env: {
        ...process.env,
        HTTP_PORT: finalPorts.http.toString(),
        WS_PORT: finalPorts.websocket.toString(),
        PROXY_PORT: finalPorts.proxy.toString(),
        UI_PORT: finalPorts.ui.toString()
      },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const instanceInfo = {
      name: instance_name,
      mode,
      ports: finalPorts,
      process,
      pid: process.pid,
      startedAt: new Date().toISOString(),
      status: 'starting'
    };

    this.relayInstances.set(instance_name, instanceInfo);
    
    // Handle process events
    process.on('exit', (code) => {
      instanceInfo.status = 'stopped';
      instanceInfo.exitCode = code;
      this.log(`Relay instance '${instance_name}' exited with code ${code}`);
    });

    process.on('error', (error) => {
      instanceInfo.status = 'error';
      instanceInfo.error = error.message;
      this.log(`Relay instance '${instance_name}' error: ${error.message}`, 'ERROR');
    });

    // Give it a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    instanceInfo.status = 'running';

    await this.log(`Started relay instance '${instance_name}' in ${mode} mode`);

    return {
      content: [
        {
          type: "text",
          text: `✅ Started relay instance '${instance_name}'\n\nMode: ${mode}\nPorts: ${JSON.stringify(finalPorts, null, 2)}\nPID: ${process.pid}\n\nEndpoints:\n- HTTP API: http://localhost:${finalPorts.http}\n- WebSocket: ws://localhost:${finalPorts.websocket}\n- Proxy: http://localhost:${finalPorts.proxy}\n- Dashboard: http://localhost:${finalPorts.ui}`
        }
      ]
    };
  }

  async stopRelayInstance(args) {
    const { instance_name } = args;
    
    const instance = this.relayInstances.get(instance_name);
    if (!instance) {
      throw new Error(`Relay instance '${instance_name}' not found`);
    }

    if (instance.process && !instance.process.killed) {
      instance.process.kill('SIGTERM');
      instance.status = 'stopping';
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!instance.process.killed) {
        instance.process.kill('SIGKILL');
      }
    }

    this.relayInstances.delete(instance_name);
    await this.log(`Stopped relay instance '${instance_name}'`);

    return {
      content: [
        {
          type: "text",
          text: `✅ Stopped relay instance '${instance_name}'`
        }
      ]
    };
  }

  async listRelayInstances() {
    const instances = Array.from(this.relayInstances.values()).map(instance => ({
      name: instance.name,
      mode: instance.mode,
      status: instance.status,
      ports: instance.ports,
      pid: instance.pid,
      started_at: instance.startedAt
    }));

    return {
      content: [
        {
          type: "text",
          text: `📋 Running relay instances (${instances.length}):\n\n${JSON.stringify(instances, null, 2)}`
        }
      ]
    };
  }

  async sendRelayMessage(args) {
    const { instance_name, endpoint, method = "POST", data = {} } = args;
    
    const instance = this.relayInstances.get(instance_name);
    if (!instance) {
      throw new Error(`Relay instance '${instance_name}' not found`);
    }

    const url = `http://localhost:${instance.ports.http}${endpoint}`;
    
    try {
      const fetch = (await import('node-fetch')).default;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (method !== 'GET' && Object.keys(data).length > 0) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.text();

      return {
        content: [
          {
            type: "text",
            text: `📡 Response from ${instance_name}${endpoint}:\n\nStatus: ${response.status}\n\n${result}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to send message to ${instance_name}: ${error.message}`);
    }
  }

  async connectWebSocketClient(args) {
    const { instance_name, client_type, client_id } = args;
    
    const instance = this.relayInstances.get(instance_name);
    if (!instance) {
      throw new Error(`Relay instance '${instance_name}' not found`);
    }

    const wsUrl = `ws://localhost:${instance.ports.websocket}`;
    
    try {
      // Create a test connection to verify it works
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          
          // Send registration message
          ws.send(JSON.stringify({
            type: 'REGISTER',
            payload: {
              type: client_type,
              id: client_id,
              capabilities: ['mcp_integration']
            }
          }));

          ws.close();
          
          resolve({
            content: [
              {
                type: "text",
                text: `✅ Successfully connected WebSocket client '${client_id}' (${client_type}) to relay instance '${instance_name}'\n\nWebSocket URL: ${wsUrl}\nClient registered and connection verified.`
              }
            ]
          });
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket connection failed: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`Failed to connect WebSocket client: ${error.message}`);
    }
  }

  async configureProxySettings(args) {
    const { instance_name, enable = true } = args;
    
    const instance = this.relayInstances.get(instance_name);
    if (!instance) {
      throw new Error(`Relay instance '${instance_name}' not found`);
    }

    const proxyUrl = `http://localhost:${instance.ports.proxy}`;
    
    if (enable) {
      // Set proxy environment variables
      process.env.HTTP_PROXY = proxyUrl;
      process.env.HTTPS_PROXY = proxyUrl;
      process.env.http_proxy = proxyUrl;
      process.env.https_proxy = proxyUrl;
      
      await this.log(`Configured system proxy to use ${instance_name} at ${proxyUrl}`);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Proxy configured to use relay instance '${instance_name}'\n\nProxy URL: ${proxyUrl}\nEnvironment variables set:\n- HTTP_PROXY=${proxyUrl}\n- HTTPS_PROXY=${proxyUrl}`
          }
        ]
      };
    } else {
      // Clear proxy settings
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.http_proxy;
      delete process.env.https_proxy;
      
      await this.log(`Disabled system proxy for ${instance_name}`);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Proxy disabled for relay instance '${instance_name}'\n\nProxy environment variables cleared.`
          }
        ]
      };
    }
  }

  async getRelayStatus(args) {
    const { instance_name } = args;
    
    const instance = this.relayInstances.get(instance_name);
    if (!instance) {
      throw new Error(`Relay instance '${instance_name}' not found`);
    }

    try {
      // Try to get status from the relay's HTTP API
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:${instance.ports.http}/status`);
      
      if (response.ok) {
        const relayStatus = await response.json();
        const combinedStatus = {
          instance_info: {
            name: instance.name,
            mode: instance.mode,
            status: instance.status,
            ports: instance.ports,
            pid: instance.pid,
            started_at: instance.startedAt
          },
          relay_status: relayStatus
        };

        return {
          content: [
            {
              type: "text",
              text: `📊 Status for relay instance '${instance_name}':\n\n${JSON.stringify(combinedStatus, null, 2)}`
            }
          ]
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Return basic instance info if HTTP status fails
      const basicStatus = {
        name: instance.name,
        mode: instance.mode,
        status: instance.status,
        ports: instance.ports,
        pid: instance.pid,
        started_at: instance.startedAt,
        error: `Could not fetch relay status: ${error.message}`
      };

      return {
        content: [
          {
            type: "text",
            text: `📊 Basic status for relay instance '${instance_name}':\n\n${JSON.stringify(basicStatus, null, 2)}`
          }
        ]
      };
    }
  }

  async discoverTNFServices(args) {
    const { scan_depth = "comprehensive" } = args;
    
    const services = {
      relay_instances: Array.from(this.relayInstances.values()),
      mcp_servers: [],
      chrome_extensions: [],
      processes: [],
      config_files: []
    };

    try {
      // Scan for running processes
      if (scan_depth === "comprehensive") {
        try {
          const processes = execSync('ps aux | grep -E "(tnf|relay|mcp)" | grep -v grep').toString();
          services.processes = processes.split('\n').filter(line => line.trim());
        } catch (error) {
          // No matching processes found
        }

        // Look for config files
        const configPaths = [
          `${process.env.HOME}/Library/Application Support/Claude/claude_desktop_config.json`,
          `${this.workspaceDir}/mcp_config.json`,
          `${this.workspaceDir}/chrome-extension-relay-config.json`
        ];

        for (const configPath of configPaths) {
          try {
            await fs.access(configPath);
            services.config_files.push(configPath);
          } catch (error) {
            // Config file doesn't exist
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `🔍 Discovered TNF services (${scan_depth} scan):\n\n${JSON.stringify(services, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Service discovery failed: ${error.message}`);
    }
  }

  // Resource handlers
  async getInstancesResource() {
    const instances = Array.from(this.relayInstances.values());
    return {
      contents: [
        {
          uri: "tnf-relay://instances",
          mimeType: "application/json",
          text: JSON.stringify(instances, null, 2)
        }
      ]
    };
  }

  async getLogsResource() {
    try {
      const logs = await fs.readFile(this.logPath, 'utf8');
      return {
        contents: [
          {
            uri: "tnf-relay://logs",
            mimeType: "text/plain",
            text: logs
          }
        ]
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "tnf-relay://logs",
            mimeType: "text/plain",
            text: `Error reading logs: ${error.message}`
          }
        ]
      };
    }
  }

  async getConfigResource() {
    const config = {
      workspace_dir: this.workspaceDir,
      log_path: this.logPath,
      running_instances: this.relayInstances.size,
      instance_names: Array.from(this.relayInstances.keys())
    };

    return {
      contents: [
        {
          uri: "tnf-relay://config",
          mimeType: "application/json",
          text: JSON.stringify(config, null, 2)
        }
      ]
    };
  }

  async getServicesResource() {
    const services = await this.discoverTNFServices({ scan_depth: "comprehensive" });
    return {
      contents: [
        {
          uri: "tnf-relay://services",
          mimeType: "application/json",
          text: services.content[0].text
        }
      ]
    };
  }

  async getWorkspaceResource() {
    try {
      const files = await fs.readdir(this.workspaceDir);
      const relayFiles = files.filter(file => 
        file.includes('relay') || 
        file.includes('tnf') || 
        file.includes('mcp')
      );

      const workspaceInfo = {
        directory: this.workspaceDir,
        total_files: files.length,
        tnf_related_files: relayFiles,
        last_modified: new Date().toISOString()
      };

      return {
        contents: [
          {
            uri: "tnf-relay://workspace",
            mimeType: "application/json",
            text: JSON.stringify(workspaceInfo, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "tnf-relay://workspace",
            mimeType: "application/json",
            text: `{"error": "Could not read workspace: ${error.message}"}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    await this.log("TNF Relay MCP Direct Server running on stdio");
  }
}

const server = new TNFRelayMCPDirect();
server.run().catch(console.error);