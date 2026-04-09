#!/usr/bin/env node

/**
 * TNF Relay MCP Server
 * Exposes The New Fuse relay services functionality via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';

class TNFRelayMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tnf-relay-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Use the current directory (src) for finding sibling scripts
    this.workspaceDir = __dirname;
    this.relayProcesses = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'start_relay',
            description: 'Start The New Fuse comprehensive relay server',
            inputSchema: {
              type: 'object',
              properties: {
                mode: {
                  type: 'string',
                  enum: ['comprehensive', 'basic', 'websocket'],
                  description: 'Relay mode to start',
                  default: 'comprehensive',
                },
                ports: {
                  type: 'object',
                  properties: {
                    http: { type: 'number', default: 3000 },
                    websocket: { type: 'number', default: 3001 },
                    proxy: { type: 'number', default: 8888 },
                    ui: { type: 'number', default: 3002 },
                  },
                },
              },
            },
          },
          {
            name: 'stop_relay',
            description: 'Stop running relay servers',
            inputSchema: {
              type: 'object',
              properties: {
                relay_id: {
                  type: 'string',
                  description: "Specific relay ID to stop, or 'all' for all relays",
                },
              },
            },
          },
          {
            name: 'relay_status',
            description: 'Get status of all relay services',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'discover_agents',
            description: 'Discover available agents and MCP services',
            inputSchema: {
              type: 'object',
              properties: {
                scan_processes: {
                  type: 'boolean',
                  description: 'Whether to scan running processes',
                  default: true,
                },
              },
            },
          },
          {
            name: 'send_agent_message',
            description: 'Send a message to a specific agent through relay',
            inputSchema: {
              type: 'object',
              properties: {
                target_agent: {
                  type: 'string',
                  description: 'Target agent ID or type',
                },
                message: {
                  type: 'object',
                  description: 'Message content to send',
                },
                relay_endpoint: {
                  type: 'string',
                  description: 'Relay endpoint URL',
                  default: 'http://localhost:3000',
                },
              },
              required: ['target_agent', 'message'],
            },
          },
          {
            name: 'configure_intercept_rules',
            description: 'Configure API interception rules for the relay',
            inputSchema: {
              type: 'object',
              properties: {
                hostname: {
                  type: 'string',
                  description: 'Hostname to intercept (e.g., api.anthropic.com)',
                },
                action: {
                  type: 'string',
                  enum: ['intercept_and_route', 'log_only', 'block'],
                  description: 'Action to take for intercepted requests',
                },
                target: {
                  type: 'string',
                  description: 'Where to route intercepted requests',
                  default: 'claude_desktop',
                },
                enabled: {
                  type: 'boolean',
                  description: 'Whether the rule is enabled',
                  default: true,
                },
              },
              required: ['hostname', 'action'],
            },
          },
          {
            name: 'get_intercepted_messages',
            description: 'Retrieve intercepted API messages',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of recent messages to retrieve',
                  default: 10,
                },
                relay_endpoint: {
                  type: 'string',
                  description: 'Relay endpoint URL',
                  default: 'http://localhost:3000',
                },
              },
            },
          },
          {
            name: 'setup_chrome_extension_relay',
            description: 'Setup relay connection for Chrome extension',
            inputSchema: {
              type: 'object',
              properties: {
                extension_id: {
                  type: 'string',
                  description: 'Chrome extension ID',
                },
                websocket_port: {
                  type: 'number',
                  description: 'WebSocket port for extension communication',
                  default: 3001,
                },
              },
            },
          },
        ],
      };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'tnf://relay/status',
            name: 'TNF Relay Status',
            description: 'Current status of all TNF relay services',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://relay/logs',
            name: 'TNF Relay Logs',
            description: 'Recent relay service logs',
            mimeType: 'text/plain',
          },
          {
            uri: 'tnf://agents/discovered',
            name: 'Discovered Agents',
            description: 'List of discovered agents and their capabilities',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://intercept/messages',
            name: 'Intercepted Messages',
            description: 'Recent intercepted API messages',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://config/mcp',
            name: 'MCP Configuration',
            description: 'Current MCP server configurations',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'start_relay':
            return await this.startRelay(args);
          case 'stop_relay':
            return await this.stopRelay(args);
          case 'relay_status':
            return await this.getRelayStatus();
          case 'discover_agents':
            return await this.discoverAgents(args);
          case 'send_agent_message':
            return await this.sendAgentMessage(args);
          case 'configure_intercept_rules':
            return await this.configureInterceptRules(args);
          case 'get_intercepted_messages':
            return await this.getInterceptedMessages(args);
          case 'setup_chrome_extension_relay':
            return await this.setupChromeExtensionRelay(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      try {
        switch (uri) {
          case 'tnf://relay/status':
            return await this.getRelayStatusResource();
          case 'tnf://relay/logs':
            return await this.getRelayLogsResource();
          case 'tnf://agents/discovered':
            return await this.getDiscoveredAgentsResource();
          case 'tnf://intercept/messages':
            return await this.getInterceptedMessagesResource();
          case 'tnf://config/mcp':
            return await this.getMCPConfigResource();
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Error reading resource ${uri}: ${error.message}`);
      }
    });
  }

  async startRelay(args = {}) {
    const { mode = 'comprehensive', ports = {} } = args;

    try {
      let relayScript;
      const defaultPorts = {
        http: 3000,
        websocket: 3001,
        proxy: 8888,
        ui: 3002,
      };

      const finalPorts = { ...defaultPorts, ...ports };

      switch (mode) {
        case 'comprehensive':
          relayScript = path.join(this.workspaceDir, 'comprehensive-tnf-relay.js');
          break;
        case 'basic':
          relayScript = path.join(this.workspaceDir, 'comprehensive-tnf-relay.js'); // Fallback to comprehensive
          break;
        case 'websocket':
          relayScript = path.join(this.workspaceDir, 'comprehensive-tnf-relay.js'); // Fallback/consolidated
          break;
        default:
          throw new Error(`Unknown relay mode: ${mode}`);
      }

      // Check if script exists
      // ADJUSTED PATH for integration

      // Start the relay process
      const process = spawn('node', [relayScript, 'start'], {
        cwd: path.join(this.workspaceDir, 'tnf-relay-package'),
        env: {
          ...process.env,
          HTTP_PORT: finalPorts.http.toString(),
          WS_PORT: finalPorts.websocket.toString(),
          PROXY_PORT: finalPorts.proxy.toString(),
          UI_PORT: finalPorts.ui.toString(),
        },
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const relayId = `${mode}-relay-${Date.now()}`;
      this.relayProcesses.set(relayId, {
        process,
        mode,
        ports: finalPorts,
        startedAt: new Date().toISOString(),
      });

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        content: [
          {
            type: 'text',
            text: `✅ Started ${mode} relay server (${relayId})\n\nEndpoints:\n- HTTP API: http://localhost:${finalPorts.http}\n- WebSocket: ws://localhost:${finalPorts.websocket}\n- Proxy: http://localhost:${finalPorts.proxy}\n- Dashboard: http://localhost:${finalPorts.ui}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to start relay: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async stopRelay(args = {}) {
    const { relay_id } = args;

    try {
      if (relay_id === 'all') {
        // Stop all relays
        const stopped = [];
        for (const [id, relay] of this.relayProcesses.entries()) {
          relay.process.kill();
          stopped.push(id);
        }
        this.relayProcesses.clear();

        return {
          content: [
            {
              type: 'text',
              text: `✅ Stopped ${stopped.length} relay services: ${stopped.join(', ')}`,
            },
          ],
        };
      } else if (relay_id && this.relayProcesses.has(relay_id)) {
        // Stop specific relay
        const relay = this.relayProcesses.get(relay_id);
        relay.process.kill();
        this.relayProcesses.delete(relay_id);

        return {
          content: [
            {
              type: 'text',
              text: `✅ Stopped relay service: ${relay_id}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Relay not found: ${relay_id || 'none specified'}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error stopping relay: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getRelayStatus() {
    try {
      const status = {
        running_relays: this.relayProcesses.size,
        relays: [],
      };

      for (const [id, relay] of this.relayProcesses.entries()) {
        status.relays.push({
          id,
          mode: relay.mode,
          ports: relay.ports,
          started_at: relay.startedAt,
          pid: relay.process.pid,
        });
      }

      // Try to get status from running relay if available
      if (this.relayProcesses.size > 0) {
        try {
          const response = await fetch('http://localhost:3000/status');
          if (response.ok) {
            const relayStatus = await response.json();
            status.relay_details = relayStatus;
          }
        } catch (error) {
          // Relay status endpoint not available
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `📊 TNF Relay Status:\n\n${JSON.stringify(status, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error getting relay status: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async discoverAgents(args = {}) {
    const { scan_processes = true } = args;

    try {
      const agents = [];

      if (scan_processes) {
        // Scan for running MCP processes
        try {
          const processes = execSync(
            'ps aux | grep -E "(mcp|applescript|browser)" | grep -v grep'
          ).toString();
          const lines = processes.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length > 10) {
              const pid = parts[1];
              const command = parts.slice(10).join(' ');

              if (command.includes('applescript-mcp')) {
                agents.push({
                  id: `applescript-mcp-${pid}`,
                  name: 'AppleScript MCP Agent',
                  type: 'APPLESCRIPT_MCP',
                  pid: parseInt(pid),
                  status: 'running',
                  command,
                });
              }

              if (command.includes('browsermcp')) {
                agents.push({
                  id: `browser-mcp-${pid}`,
                  name: 'Browser MCP Agent',
                  type: 'BROWSER_MCP',
                  pid: parseInt(pid),
                  status: 'running',
                  command,
                });
              }
            }
          }
        } catch (error) {
          // Process scan failed, continue
        }
      }

      // Check MCP configuration files
      const homeDir = process.env.HOME;
      const configs = [
        {
          path: `${homeDir}/Library/Application Support/Claude/claude_desktop_config.json`,
          type: 'CLAUDE_MCP',
        },
        { path: `${homeDir}/.claude-code/mcp.json`, type: 'CLAUDE_CODE_MCP' },
      ];

      for (const config of configs) {
        try {
          await fs.access(config.path);
          const configData = JSON.parse(await fs.readFile(config.path, 'utf8'));

          if (configData.mcpServers) {
            Object.entries(configData.mcpServers).forEach(([name, serverConfig]) => {
              agents.push({
                id: `${config.type.toLowerCase()}-${name}`,
                name: `${name} (${config.type})`,
                type: config.type,
                status: 'configured',
                config_path: config.path,
                server_config: serverConfig,
              });
            });
          }
        } catch (error) {
          // Config doesn't exist or can't be read
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `🤖 Discovered ${agents.length} agents:\n\n${agents
              .map((agent) => `• ${agent.name} (${agent.id}) - ${agent.status}`)
              .join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error discovering agents: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async sendAgentMessage(args) {
    const { target_agent, message, relay_endpoint = 'http://localhost:3000' } = args;

    try {
      const response = await fetch(`${relay_endpoint}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: target_agent,
          message,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: `✅ Message sent to ${target_agent}: ${JSON.stringify(result)}`,
            },
          ],
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error sending message: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async configureInterceptRules(args) {
    const { hostname, action, target = 'claude_desktop', enabled = true } = args;

    try {
      const response = await fetch('http://localhost:3000/intercept-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname,
          action,
          target,
          enabled,
          description: `${action} for ${hostname}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: `✅ Configured intercept rule for ${hostname}: ${action} → ${target}`,
            },
          ],
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error configuring intercept rule: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getInterceptedMessages(args = {}) {
    const { limit = 10, relay_endpoint = 'http://localhost:3000' } = args;

    try {
      const response = await fetch(`${relay_endpoint}/intercepted-messages?limit=${limit}`);

      if (response.ok) {
        const data = await response.json();
        return {
          content: [
            {
              type: 'text',
              text: `📨 Last ${data.messages.length} intercepted messages (${data.total} total):\n\n${JSON.stringify(data.messages, null, 2)}`,
            },
          ],
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error getting intercepted messages: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async setupChromeExtensionRelay(args) {
    const { extension_id, websocket_port = 3001 } = args;

    try {
      // This would set up WebSocket communication for Chrome extension
      const config = {
        extension_id,
        websocket_url: `ws://localhost:${websocket_port}`,
        relay_endpoint: `http://localhost:3000`,
        setup_timestamp: new Date().toISOString(),
      };

      // Save configuration
      const configPath = path.join(this.workspaceDir, 'chrome-extension-relay-config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      return {
        content: [
          {
            type: 'text',
            text: `✅ Chrome extension relay configured:\n\n${JSON.stringify(config, null, 2)}\n\nConfiguration saved to: ${configPath}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error setting up Chrome extension relay: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Resource handlers
  async getRelayStatusResource() {
    const status = await this.getRelayStatus();
    return {
      contents: [
        {
          uri: 'tnf://relay/status',
          mimeType: 'application/json',
          text: status.content[0].text,
        },
      ],
    };
  }

  async getRelayLogsResource() {
    try {
      const logPath = path.join(this.workspaceDir, 'comprehensive-relay.log');
      const logs = await fs.readFile(logPath, 'utf8');
      return {
        contents: [
          {
            uri: 'tnf://relay/logs',
            mimeType: 'text/plain',
            text: logs,
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: 'tnf://relay/logs',
            mimeType: 'text/plain',
            text: `Error reading logs: ${error.message}`,
          },
        ],
      };
    }
  }

  async getDiscoveredAgentsResource() {
    const agents = await this.discoverAgents();
    return {
      contents: [
        {
          uri: 'tnf://agents/discovered',
          mimeType: 'application/json',
          text: agents.content[0].text,
        },
      ],
    };
  }

  async getInterceptedMessagesResource() {
    const messages = await this.getInterceptedMessages();
    return {
      contents: [
        {
          uri: 'tnf://intercept/messages',
          mimeType: 'application/json',
          text: messages.content[0].text,
        },
      ],
    };
  }

  async getMCPConfigResource() {
    return {
      contents: [
        {
          uri: 'tnf://config/mcp',
          mimeType: 'application/json',
          text: JSON.stringify({ version: '1.0.0', configured: true }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TNF Relay MCP Server running on stdio');
  }
}

const server = new TNFRelayMCPServer();
server.run().catch(console.error);
