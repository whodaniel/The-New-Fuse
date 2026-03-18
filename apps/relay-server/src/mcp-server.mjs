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
import crypto from 'crypto';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    this.repoRoot = path.resolve(this.workspaceDir, '..', '..', '..');
    this.relayProcesses = new Map();
    this.twipStore = new Map();
    this.twipAuditLog = [];
    this.twipSchemasCache = null;
    this.twipNonceCache = new Map();
    this.twipTerminalInventory = [];
    this.twipInventoryMeta = {
      lastScanAt: null,
      totalTerminals: 0,
      source: 'uninitialized',
    };
    this.twipCapability = {
      name: 'twip-identity',
      version: '0.1',
      status: 'draft',
      tags: ['protocol', 'terminal', 'identity', 'safety'],
      safetyFlags: ['tenant_scoped', 'ttl_enforced', 'provenance_required'],
      schemas: {
        envelope: 'docs/protocols/schemas/twip-envelope.schema.json',
        identity: 'docs/protocols/schemas/twip-identity.schema.json',
      },
    };
    this.twipRequireSignature = process.env.TWIP_REQUIRE_SIGNATURE === 'true';
    this.twipSigningKey = process.env.TWIP_SIGNING_KEY || '';
    this.twipMaxClockSkewSeconds = Math.max(
      30,
      Math.min(3600, Number(process.env.TWIP_MAX_CLOCK_SKEW_SECONDS || 300))
    );
    this.twipMaxReplayAgeSeconds = Math.max(
      this.twipMaxClockSkewSeconds,
      Math.min(3600, Number(process.env.TWIP_MAX_REPLAY_AGE_SECONDS || 3600))
    );
    this.twipInventorySnapshotPath = path.join(
      this.repoRoot,
      'data',
      'protocols',
      'twip-inventory.snapshot.json'
    );
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
          {
            name: 'twip_publish_identity',
            description: 'Publish a TWIP envelope with canonical identity and apply policy checks.',
            inputSchema: {
              type: 'object',
              properties: {
                envelope: {
                  type: 'object',
                  description: 'TWIP envelope payload',
                },
              },
              required: ['envelope'],
            },
          },
          {
            name: 'twip_resolve_identity',
            description: 'Resolve a previously published TWIP identity by twid and tenant.',
            inputSchema: {
              type: 'object',
              properties: {
                twid: { type: 'string', description: 'TWIP ID to resolve' },
                tenant_id: { type: 'string', description: 'Tenant scope' },
              },
              required: ['twid', 'tenant_id'],
            },
          },
          {
            name: 'twip_revoke_identity',
            description: 'Revoke an existing TWIP identity within a tenant scope.',
            inputSchema: {
              type: 'object',
              properties: {
                twid: { type: 'string', description: 'TWIP ID to revoke' },
                tenant_id: { type: 'string', description: 'Tenant scope' },
                reason: { type: 'string', description: 'Optional revoke reason' },
              },
              required: ['twid', 'tenant_id'],
            },
          },
          {
            name: 'twip_policy_evaluate',
            description: 'Evaluate TWIP envelope policy controls without mutating state.',
            inputSchema: {
              type: 'object',
              properties: {
                envelope: { type: 'object', description: 'TWIP envelope payload' },
              },
              required: ['envelope'],
            },
          },
          {
            name: 'twip_register_capability',
            description: 'Expose TWIP capability metadata suitable for catalog/registry ingestion.',
            inputSchema: {
              type: 'object',
              properties: {
                tenant_id: {
                  type: 'string',
                  description: 'Tenant scope for registration metadata',
                },
              },
            },
          },
          {
            name: 'twip_scan_terminals',
            description:
              'Scan local system terminals and normalize them into TWIP identities for holistic agent visibility.',
            inputSchema: {
              type: 'object',
              properties: {
                tenant_id: {
                  type: 'string',
                  description: 'Tenant scope applied to discovered terminals',
                  default: 'tnf-local',
                },
                include_commands: {
                  type: 'boolean',
                  description:
                    'Include active process command samples (disabled by default for safety)',
                  default: false,
                },
                publish_to_store: {
                  type: 'boolean',
                  description: 'Publish discovered identities into TWIP identity store',
                  default: true,
                },
                limit: {
                  type: 'number',
                  description: 'Maximum terminals to return',
                  default: 200,
                },
              },
            },
          },
          {
            name: 'twip_get_inventory',
            description: 'Get latest scanned TWIP terminal inventory snapshot.',
            inputSchema: {
              type: 'object',
              properties: {
                tenant_id: { type: 'string', description: 'Filter by tenant' },
                limit: { type: 'number', description: 'Maximum terminals to return', default: 200 },
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
          {
            uri: 'tnf://twip/identities',
            name: 'TWIP Identities',
            description: 'Published TWIP identities in relay memory',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://twip/audit',
            name: 'TWIP Audit Log',
            description: 'TWIP policy and mutation audit events',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://twip/capability',
            name: 'TWIP Capability',
            description: 'TWIP capability card for registry import',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://twip/schemas',
            name: 'TWIP Schemas',
            description: 'TWIP envelope and identity JSON schemas',
            mimeType: 'application/json',
          },
          {
            uri: 'tnf://twip/inventory',
            name: 'TWIP Inventory',
            description: 'Latest holistic snapshot of discoverable local terminals',
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
          case 'twip_publish_identity':
            return await this.twipPublishIdentity(args);
          case 'twip_resolve_identity':
            return await this.twipResolveIdentity(args);
          case 'twip_revoke_identity':
            return await this.twipRevokeIdentity(args);
          case 'twip_policy_evaluate':
            return await this.twipPolicyEvaluate(args);
          case 'twip_register_capability':
            return await this.twipRegisterCapability(args);
          case 'twip_scan_terminals':
            return await this.twipScanTerminals(args);
          case 'twip_get_inventory':
            return await this.twipGetInventory(args);
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
          case 'tnf://twip/identities':
            return await this.getTwipIdentitiesResource();
          case 'tnf://twip/audit':
            return await this.getTwipAuditResource();
          case 'tnf://twip/capability':
            return await this.getTwipCapabilityResource();
          case 'tnf://twip/schemas':
            return await this.getTwipSchemasResource();
          case 'tnf://twip/inventory':
            return await this.getTwipInventoryResource();
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

  appendTwipAudit(eventType, details = {}) {
    const entry = {
      id: `twip-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      timestamp: new Date().toISOString(),
      ...details,
    };
    this.twipAuditLog.push(entry);
    if (this.twipAuditLog.length > 500) {
      this.twipAuditLog.shift();
    }
  }

  stableSortObject(value) {
    if (Array.isArray(value)) {
      return value.map((item) => this.stableSortObject(item));
    }
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
          acc[key] = this.stableSortObject(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  canonicalizeEnvelopeForSignature(envelope) {
    const clone = JSON.parse(JSON.stringify(envelope || {}));
    delete clone.sig;
    return JSON.stringify(this.stableSortObject(clone));
  }

  computeTwipSignature(envelope) {
    if (!this.twipSigningKey) {
      return null;
    }
    const canonical = this.canonicalizeEnvelopeForSignature(envelope);
    return crypto.createHmac('sha256', this.twipSigningKey).update(canonical).digest('hex');
  }

  normalizeSignature(sig) {
    if (!sig || typeof sig !== 'string') {
      return null;
    }
    const trimmed = sig.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.startsWith('hmac-sha256:')) {
      return trimmed.slice('hmac-sha256:'.length);
    }
    return trimmed;
  }

  isReplayEnvelope(envelope, ttlSeconds = 300) {
    const now = Date.now();
    const envelopeId = String(envelope?.id || '').trim();
    if (!envelopeId) {
      return { allow: false, reason: 'missing_envelope_id' };
    }

    const sentAtMs = Date.parse(envelope?.sent_at || '');
    if (!Number.isFinite(sentAtMs)) {
      return { allow: false, reason: 'invalid_sent_at' };
    }

    const ageSeconds = (now - sentAtMs) / 1000;
    if (ageSeconds < -this.twipMaxClockSkewSeconds) {
      return { allow: false, reason: 'sent_at_in_future' };
    }

    const maxAge = Math.min(
      this.twipMaxReplayAgeSeconds,
      Math.max(this.twipMaxClockSkewSeconds, Number(ttlSeconds || 300))
    );
    if (ageSeconds > maxAge) {
      return { allow: false, reason: 'envelope_expired' };
    }

    for (const [id, expiresAt] of this.twipNonceCache.entries()) {
      if (expiresAt <= now) {
        this.twipNonceCache.delete(id);
      }
    }

    const existingExpiry = this.twipNonceCache.get(envelopeId);
    if (existingExpiry && existingExpiry > now) {
      return { allow: false, reason: 'replay_detected' };
    }

    this.twipNonceCache.set(envelopeId, now + maxAge * 1000);
    return { allow: true, reason: 'ok' };
  }

  verifyTwipSignature(envelope) {
    const presented = this.normalizeSignature(envelope?.sig);
    if (!presented) {
      return {
        allow: this.twipRequireSignature !== true,
        reason: this.twipRequireSignature ? 'signature_required' : 'unsigned_allowed',
      };
    }
    if (!this.twipSigningKey) {
      return { allow: false, reason: 'signing_key_unavailable' };
    }

    const expected = this.computeTwipSignature(envelope);
    if (!expected) {
      return { allow: false, reason: 'signature_compute_failed' };
    }

    const presentedBuffer = Buffer.from(presented, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    if (
      presentedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(presentedBuffer, expectedBuffer)
    ) {
      return { allow: false, reason: 'signature_invalid' };
    }
    return { allow: true, reason: 'signature_valid' };
  }

  evaluateTwipSecurity(envelope, ttlSeconds = 300) {
    const signature = this.verifyTwipSignature(envelope);
    if (!signature.allow) {
      return {
        allow: false,
        reason: signature.reason,
        signature: signature.reason,
        replay: null,
      };
    }

    const replay = this.isReplayEnvelope(envelope, ttlSeconds);
    if (!replay.allow) {
      return {
        allow: false,
        reason: replay.reason,
        signature: signature.reason,
        replay: replay.reason,
      };
    }

    return {
      allow: true,
      reason: 'security_allow',
      signature: signature.reason,
      replay: replay.reason,
    };
  }

  validateTwipEnvelope(envelope, expectedType = null) {
    const errors = [];
    if (!envelope || typeof envelope !== 'object') {
      errors.push('envelope must be an object');
      return { valid: false, errors };
    }
    if (!envelope.id || typeof envelope.id !== 'string') {
      errors.push('id is required');
    }
    if (envelope.spec !== 'twip/0.1') {
      errors.push('spec must be twip/0.1');
    }
    if (!envelope.type || typeof envelope.type !== 'string') {
      errors.push('type is required');
    } else if (expectedType && envelope.type !== expectedType) {
      errors.push(`type must be ${expectedType}`);
    }
    if (!envelope.sent_at || !Number.isFinite(Date.parse(envelope.sent_at))) {
      errors.push('sent_at must be a valid date-time');
    }
    if (!envelope.scope || typeof envelope.scope !== 'object') {
      errors.push('scope is required');
    } else if (!envelope.scope.tenant_id) {
      errors.push('scope.tenant_id is required');
    }
    if (!envelope.trace || typeof envelope.trace !== 'object') {
      errors.push('trace is required');
    } else if (!envelope.trace.correlation_id) {
      errors.push('trace.correlation_id is required');
    } else if (!envelope.trace.causation_id) {
      errors.push('trace.causation_id is required');
    }
    if (!envelope.payload || typeof envelope.payload !== 'object') {
      errors.push('payload is required');
    }
    return { valid: errors.length === 0, errors };
  }

  evaluateTwipPolicy(envelope) {
    const policy = envelope?.policy || {};
    const ttl = Number(policy.ttl_seconds ?? 300);
    const redactionEnabled = policy.redact_gui_fields !== false;
    const decision = {
      allow: true,
      reason: 'policy_allow',
      evaluatedAt: new Date().toISOString(),
      checks: {
        tenantScoped: Boolean(envelope?.scope?.tenant_id),
        ttlBounded: Number.isFinite(ttl) && ttl > 0 && ttl <= 3600,
        remotePropagationDisabled: policy.allow_remote_propagation !== true,
      },
      effectivePolicy: {
        ttl_seconds: Number.isFinite(ttl) ? ttl : 300,
        redact_gui_fields: redactionEnabled,
        allow_remote_propagation: policy.allow_remote_propagation === true,
      },
    };

    if (!decision.checks.tenantScoped) {
      decision.allow = false;
      decision.reason = 'missing_tenant_scope';
    } else if (!decision.checks.ttlBounded) {
      decision.allow = false;
      decision.reason = 'ttl_out_of_bounds';
    } else if (!decision.checks.remotePropagationDisabled) {
      decision.allow = false;
      decision.reason = 'remote_propagation_not_allowed';
    }

    return decision;
  }

  sanitizeTwipIdentity(identity, policyDecision) {
    const cloned = JSON.parse(JSON.stringify(identity || {}));
    if (!policyDecision?.effectivePolicy?.redact_gui_fields) {
      return cloned;
    }
    if (Array.isArray(cloned.provenance)) {
      cloned.provenance = cloned.provenance.filter((item) => item?.source !== 'gui');
    }
    return cloned;
  }

  async loadTwipSchemas() {
    if (this.twipSchemasCache) {
      return this.twipSchemasCache;
    }

    const envelopePath = path.join(
      this.repoRoot,
      'docs',
      'protocols',
      'schemas',
      'twip-envelope.schema.json'
    );
    const identityPath = path.join(
      this.repoRoot,
      'docs',
      'protocols',
      'schemas',
      'twip-identity.schema.json'
    );

    try {
      const [envelopeRaw, identityRaw] = await Promise.all([
        fs.readFile(envelopePath, 'utf8'),
        fs.readFile(identityPath, 'utf8'),
      ]);
      this.twipSchemasCache = {
        envelope: JSON.parse(envelopeRaw),
        identity: JSON.parse(identityRaw),
      };
      return this.twipSchemasCache;
    } catch (_error) {
      return null;
    }
  }

  async twipPublishIdentity(args = {}) {
    const envelope = args.envelope;
    const validation = this.validateTwipEnvelope(envelope, 'IDENTITY.PUBLISH');
    if (!validation.valid) {
      this.appendTwipAudit('twip.publish.denied', {
        reason: 'invalid_envelope',
        errors: validation.errors,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                code: 'INVALID_REQUEST',
                message: 'Invalid TWIP envelope',
                errors: validation.errors,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const decision = this.evaluateTwipPolicy(envelope);
    if (!decision.allow) {
      this.appendTwipAudit('twip.publish.denied', {
        reason: decision.reason,
        correlation_id: envelope.trace?.correlation_id || null,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                code: 'POLICY_DENY',
                message: `TWIP policy denied publish: ${decision.reason}`,
                decision,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const security = this.evaluateTwipSecurity(envelope, decision.effectivePolicy.ttl_seconds);
    if (!security.allow) {
      this.appendTwipAudit('twip.publish.denied', {
        reason: security.reason,
        correlation_id: envelope.trace?.correlation_id || null,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                code: 'SECURITY_DENY',
                message: `TWIP security denied publish: ${security.reason}`,
                security,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const identity = envelope.payload?.identity;
    if (!identity?.twid) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                code: 'INVALID_REQUEST',
                message: 'payload.identity.twid is required for publish',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const sanitizedIdentity = this.sanitizeTwipIdentity(identity, decision);
    const record = {
      identity: sanitizedIdentity,
      envelopeMeta: {
        type: envelope.type,
        tenant_id: envelope.scope?.tenant_id,
        correlation_id: envelope.trace?.correlation_id,
        ttl_seconds: decision.effectivePolicy.ttl_seconds,
        signature: security.signature,
      },
      updated_at: new Date().toISOString(),
    };
    this.twipStore.set(identity.twid, record);
    this.appendTwipAudit('twip.publish.allowed', {
      twid: identity.twid,
      tenant_id: envelope.scope?.tenant_id,
      correlation_id: envelope.trace?.correlation_id || null,
      signature: security.signature,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              twid: identity.twid,
              tenant_id: envelope.scope?.tenant_id,
              decision,
              security,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async twipResolveIdentity(args = {}) {
    let twid = args.twid;
    let tenant_id = args.tenant_id;

    if (args.envelope) {
      const envelope = args.envelope;
      const validation = this.validateTwipEnvelope(envelope, 'IDENTITY.RESOLVE');
      if (!validation.valid) {
        this.appendTwipAudit('twip.resolve.denied', {
          reason: 'invalid_envelope',
          errors: validation.errors,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  code: 'INVALID_REQUEST',
                  message: 'Invalid TWIP resolve envelope',
                  errors: validation.errors,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const decision = this.evaluateTwipPolicy(envelope);
      if (!decision.allow) {
        this.appendTwipAudit('twip.resolve.denied', {
          reason: decision.reason,
          correlation_id: envelope.trace?.correlation_id || null,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  code: 'POLICY_DENY',
                  message: `TWIP policy denied resolve: ${decision.reason}`,
                  decision,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const security = this.evaluateTwipSecurity(envelope, decision.effectivePolicy.ttl_seconds);
      if (!security.allow) {
        this.appendTwipAudit('twip.resolve.denied', {
          reason: security.reason,
          correlation_id: envelope.trace?.correlation_id || null,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  code: 'SECURITY_DENY',
                  message: `TWIP security denied resolve: ${security.reason}`,
                  security,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      twid = envelope.payload?.twid;
      tenant_id = envelope.scope?.tenant_id;
    } else if (this.twipRequireSignature) {
      this.appendTwipAudit('twip.resolve.denied', {
        reason: 'envelope_required_for_signed_resolve',
        twid: twid || null,
        tenant_id: tenant_id || null,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                code: 'SECURITY_DENY',
                message: 'Signed resolve requires envelope when TWIP_REQUIRE_SIGNATURE=true',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    if (!twid || !tenant_id) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                code: 'INVALID_REQUEST',
                message: 'twid and tenant_id are required for resolve',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const record = this.twipStore.get(twid);
    if (!record) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ code: 'NOT_FOUND', message: `Unknown twid: ${twid}` }, null, 2),
          },
        ],
        isError: true,
      };
    }
    if (record.envelopeMeta.tenant_id !== tenant_id) {
      this.appendTwipAudit('twip.resolve.denied', {
        twid,
        tenant_id,
        reason: 'tenant_mismatch',
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { code: 'FORBIDDEN', message: 'Tenant mismatch for TWIP identity' },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    this.appendTwipAudit('twip.resolve.allowed', { twid, tenant_id });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ twid, tenant_id, record }, null, 2),
        },
      ],
    };
  }

  async twipRevokeIdentity(args = {}) {
    const { twid, tenant_id, reason = 'manual_revoke' } = args;
    const record = this.twipStore.get(twid);
    if (!record) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ code: 'NOT_FOUND', message: `Unknown twid: ${twid}` }, null, 2),
          },
        ],
        isError: true,
      };
    }
    if (record.envelopeMeta.tenant_id !== tenant_id) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { code: 'FORBIDDEN', message: 'Tenant mismatch for TWIP identity revoke' },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    this.twipStore.delete(twid);
    this.appendTwipAudit('twip.revoke.allowed', { twid, tenant_id, reason });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, twid, tenant_id, reason }, null, 2),
        },
      ],
    };
  }

  async twipPolicyEvaluate(args = {}) {
    const envelope = args.envelope || {};
    const validation = this.validateTwipEnvelope(envelope);
    const decision = this.evaluateTwipPolicy(envelope);
    this.appendTwipAudit('twip.policy.evaluate', {
      allowed: decision.allow,
      reason: decision.reason,
      correlation_id: envelope.trace?.correlation_id || null,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ validation, decision }, null, 2),
        },
      ],
    };
  }

  async twipRegisterCapability(args = {}) {
    const capability = {
      ...this.twipCapability,
      registered_at: new Date().toISOString(),
      tenant_id: args.tenant_id || null,
    };
    this.appendTwipAudit('twip.capability.register', {
      tenant_id: args.tenant_id || null,
      capability: capability.name,
      version: capability.version,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, capability }, null, 2),
        },
      ],
    };
  }

  hashToUuidV5(input) {
    const digest = crypto.createHash('sha1').update(String(input)).digest();
    const bytes = Buffer.from(digest.subarray(0, 16));
    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  getHostId() {
    let user = 'unknown';
    try {
      user = os.userInfo().username || 'unknown';
    } catch (_error) {
      // ignore user info errors
    }
    const raw = `${os.hostname()}:${user}`;
    return `h:${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 8)}`;
  }

  normalizeTty(tty) {
    if (!tty) return null;
    const t = String(tty).trim();
    if (!t || t === '?' || t === '??') return null;
    return t.startsWith('/dev/') ? t.slice(5) : t;
  }

  parseTerminalProcessRows() {
    const commands = [
      'ps -axo pid=,ppid=,pgid=,sid=,tty=,command= 2>/dev/null',
      'ps -axo pid=,ppid=,pgid=,sess=,tty=,command= 2>/dev/null',
    ];

    for (const command of commands) {
      try {
        const output = execSync(command, {
          encoding: 'utf8',
          maxBuffer: 20 * 1024 * 1024,
        });
        const rows = [];
        for (const line of output.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const match = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);
          if (!match) continue;
          const tty = this.normalizeTty(match[5]);
          if (!tty) continue;
          rows.push({
            pid: Number(match[1]),
            ppid: Number(match[2]),
            pgid: Number(match[3]),
            sid: Number(match[4]),
            tty,
            command: match[6],
          });
        }
        if (rows.length > 0) {
          return rows;
        }
      } catch (_error) {
        // try next ps format
      }
    }

    try {
      const output = execSync('ps -axo pid=,ppid=,pgid=,tty=,command= 2>/dev/null', {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
      });
      const rows = [];
      for (const line of output.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const match = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);
        if (!match) continue;
        const tty = this.normalizeTty(match[4]);
        if (!tty) continue;
        rows.push({
          pid: Number(match[1]),
          ppid: Number(match[2]),
          pgid: Number(match[3]),
          sid: Number(match[3]),
          tty,
          command: match[5],
        });
      }
      return rows;
    } catch (_error) {
      return [];
    }
  }

  getTmuxTtyMap() {
    const map = new Map();
    try {
      execSync('command -v tmux >/dev/null 2>&1');
      const output = execSync(
        'tmux list-panes -a -F "#{session_id}|#{window_id}|#{pane_id}|#{pane_tty}"',
        {
          encoding: 'utf8',
          maxBuffer: 2 * 1024 * 1024,
        }
      );
      for (const line of output.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [session_id, window_id, pane_id, pane_tty] = trimmed.split('|');
        const tty = this.normalizeTty(pane_tty);
        if (!tty) continue;
        map.set(tty, {
          kind: 'tmux',
          session_id: session_id || null,
          window_id: window_id || null,
          pane_id: pane_id || null,
        });
      }
    } catch (_error) {
      // tmux unavailable or no active server
    }
    return map;
  }

  buildTerminalIdentity({
    tenantId,
    hostId,
    tty,
    processes,
    tmuxInfo,
    includeCommands,
    observedAt,
  }) {
    const shellPattern = /(^|\/|\s)(zsh|bash|fish|sh|nu|pwsh|ksh)(\s|$)/i;
    const shellProc =
      processes.find((p) => shellPattern.test(p.command)) ||
      processes.find((p) => p.pid === p.sid) ||
      processes[0];

    const sid = shellProc?.sid ?? processes[0]?.sid ?? 0;
    const twid = this.hashToUuidV5(`${hostId}|${tenantId}|${tty}|${sid}`);
    const multiplexer = tmuxInfo || null;
    const scopePaneId =
      multiplexer?.kind === 'tmux' && multiplexer?.pane_id
        ? `pane:${multiplexer.pane_id}`
        : `tty:${tty}`;

    const identity = {
      twid,
      spec: 'twip/0.1',
      created_at: observedAt,
      incarnation: 0,
      scope: {
        tenant_id: tenantId,
        host_id: hostId,
        emulator_id: 'unknown',
        window_id: multiplexer?.window_id || null,
        tab_id: null,
        pane_id: scopePaneId,
        session_key: `tty:${tty}`,
      },
      process: {
        shell_pid: shellProc?.pid ?? null,
        pgid: shellProc?.pgid ?? null,
        sid: shellProc?.sid ?? null,
        process_count: processes.length,
      },
      pty: {
        path: `/dev/${tty}`,
        inode: null,
      },
      multiplexer,
      provenance: [
        {
          key: 'tty',
          value: `/dev/${tty}`,
          source: 'kernel',
          confidence: 1.0,
          observed_at: observedAt,
        },
        {
          key: 'shell_pid',
          value: shellProc?.pid ?? null,
          source: 'process',
          confidence: Number.isFinite(shellProc?.pid) ? 1.0 : 0.6,
          observed_at: observedAt,
        },
        {
          key: 'sid',
          value: shellProc?.sid ?? null,
          source: 'process',
          confidence: Number.isFinite(shellProc?.sid) ? 1.0 : 0.6,
          observed_at: observedAt,
        },
        {
          key: 'tmux_pane',
          value: multiplexer?.pane_id || null,
          source: 'multiplexer',
          confidence: multiplexer ? 0.95 : 0.0,
          observed_at: observedAt,
        },
      ].filter((item) => item.value !== null),
      labels: ['inventory_scan'],
    };

    if (includeCommands) {
      const commands = [];
      for (const proc of processes) {
        if (commands.length >= 5) break;
        if (!commands.includes(proc.command)) commands.push(proc.command);
      }
      identity.active_commands = commands;
    }

    return identity;
  }

  async twipScanTerminals(args = {}) {
    const tenantId = args.tenant_id || 'tnf-local';
    const includeCommands = args.include_commands === true;
    const publishToStore = args.publish_to_store !== false;
    const limit = Math.max(1, Math.min(1000, Number(args.limit || 200)));
    const observedAt = new Date().toISOString();

    const hostId = this.getHostId();
    const processRows = this.parseTerminalProcessRows();
    const byTty = new Map();
    for (const row of processRows) {
      if (!byTty.has(row.tty)) byTty.set(row.tty, []);
      byTty.get(row.tty).push(row);
    }

    const tmuxMap = this.getTmuxTtyMap();
    const identities = [];
    for (const [tty, processes] of byTty.entries()) {
      const sorted = [...processes].sort((a, b) => a.pid - b.pid);
      identities.push(
        this.buildTerminalIdentity({
          tenantId,
          hostId,
          tty,
          processes: sorted,
          tmuxInfo: tmuxMap.get(tty) || null,
          includeCommands,
          observedAt,
        })
      );
    }

    identities.sort((a, b) => (a.pty.path > b.pty.path ? 1 : -1));
    const limited = identities.slice(0, limit);
    this.twipTerminalInventory = limited;
    this.twipInventoryMeta = {
      lastScanAt: observedAt,
      totalTerminals: identities.length,
      returned: limited.length,
      source: 'ps+tmux',
      tenant_id: tenantId,
      include_commands: includeCommands,
    };

    if (publishToStore) {
      for (const identity of limited) {
        this.twipStore.set(identity.twid, {
          identity,
          envelopeMeta: {
            type: 'IDENTITY.PUBLISH',
            tenant_id: tenantId,
            correlation_id: `inventory-scan-${Date.now()}`,
            ttl_seconds: 300,
          },
          updated_at: observedAt,
        });
      }
    }

    this.appendTwipAudit('twip.inventory.scan', {
      tenant_id: tenantId,
      total_detected: identities.length,
      total_returned: limited.length,
      published_to_store: publishToStore,
    });
    await this.persistTwipInventorySnapshot();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              meta: this.twipInventoryMeta,
              sample: limited.slice(0, 5).map((identity) => ({
                twid: identity.twid,
                tty: identity.pty.path,
                pane_id: identity.scope.pane_id,
                shell_pid: identity.process.shell_pid,
                multiplexer: identity.multiplexer?.kind || 'none',
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async persistTwipInventorySnapshot() {
    try {
      const snapshot = {
        mirrored_from: 'tnf://twip/inventory',
        mirrored_at: new Date().toISOString(),
        meta: this.twipInventoryMeta,
        total: this.twipTerminalInventory.length,
        terminals: this.twipTerminalInventory,
      };
      await fs.mkdir(path.dirname(this.twipInventorySnapshotPath), { recursive: true });
      await fs.writeFile(this.twipInventorySnapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
      this.appendTwipAudit('twip.inventory.snapshot.saved', {
        path: this.twipInventorySnapshotPath,
        total: this.twipTerminalInventory.length,
      });
    } catch (error) {
      this.appendTwipAudit('twip.inventory.snapshot.error', {
        reason: error.message,
        path: this.twipInventorySnapshotPath,
      });
    }
  }

  async twipGetInventory(args = {}) {
    const tenantId = args.tenant_id || null;
    const limit = Math.max(1, Math.min(1000, Number(args.limit || 200)));
    const filtered = this.twipTerminalInventory.filter((identity) =>
      tenantId ? identity.scope?.tenant_id === tenantId : true
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              meta: this.twipInventoryMeta,
              total: filtered.length,
              terminals: filtered.slice(0, limit),
            },
            null,
            2
          ),
        },
      ],
    };
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

  async getTwipIdentitiesResource() {
    const identities = Array.from(this.twipStore.entries()).map(([twid, record]) => ({
      twid,
      ...record,
    }));
    return {
      contents: [
        {
          uri: 'tnf://twip/identities',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              total: identities.length,
              identities,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getTwipAuditResource() {
    return {
      contents: [
        {
          uri: 'tnf://twip/audit',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              total: this.twipAuditLog.length,
              events: this.twipAuditLog,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getTwipCapabilityResource() {
    return {
      contents: [
        {
          uri: 'tnf://twip/capability',
          mimeType: 'application/json',
          text: JSON.stringify(this.twipCapability, null, 2),
        },
      ],
    };
  }

  async getTwipInventoryResource() {
    return {
      contents: [
        {
          uri: 'tnf://twip/inventory',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              meta: this.twipInventoryMeta,
              total: this.twipTerminalInventory.length,
              terminals: this.twipTerminalInventory,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async getTwipSchemasResource() {
    const schemas = await this.loadTwipSchemas();
    return {
      contents: [
        {
          uri: 'tnf://twip/schemas',
          mimeType: 'application/json',
          text: JSON.stringify(
            schemas || {
              warning: 'TWIP schema files not found from relay server path',
              expected_paths: this.twipCapability.schemas,
            },
            null,
            2
          ),
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

export { TNFRelayMCPServer };
export async function startMcpServer() {
  const server = new TNFRelayMCPServer();
  await server.run();
}

const isMainModule =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  startMcpServer().catch(console.error);
}
