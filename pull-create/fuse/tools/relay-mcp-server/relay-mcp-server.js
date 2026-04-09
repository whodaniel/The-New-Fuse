#!/usr/bin/env node

/**
 * TNF Relay MCP Server
 *
 * An MCP server that bridges to the TNF relay, allowing Claude to:
 * 1. Read messages from relay channels
 * 2. Send messages to relay channels
 * 3. List active channels and agents
 *
 * Usage:
 *   node relay-mcp-server.js
 *
 * Add to claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "relay": {
 *       "command": "node",
 *       "args": ["/path/to/relay-mcp-server.js"]
 *     }
 *   }
 * }
 */

const WebSocket = require('ws');
const readline = require('readline');

// Configuration
const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws';
const AGENT_ID = `mcp-bridge-${Date.now()}`;

// In-memory message queue
const pendingMessages = [];
const MAX_MESSAGES = 100;

// WebSocket connection
let ws = null;
let connected = false;
let channels = [];
let agents = [];

// Connect to relay
function connectToRelay() {
  ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    connected = true;
    console.error('[MCP-Relay] Connected to relay');

    // Register as agent
    ws.send(
      JSON.stringify({
        type: 'AGENT_REGISTER',
        source: AGENT_ID,
        payload: {
          agent: {
            id: AGENT_ID,
            name: 'Claude MCP Bridge',
            platform: 'mcp-server',
            capabilities: ['mcp', 'claude'],
            channels: [],
          },
        },
      })
    );
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleRelayMessage(msg);
    } catch (e) {
      console.error('[MCP-Relay] Parse error:', e.message);
    }
  });

  ws.on('close', () => {
    connected = false;
    console.error('[MCP-Relay] Disconnected, reconnecting in 5s...');
    setTimeout(connectToRelay, 5000);
  });

  ws.on('error', (err) => {
    console.error('[MCP-Relay] Error:', err.message);
  });
}

function handleRelayMessage(msg) {
  switch (msg.type) {
    case 'CHANNEL_LIST':
      channels = msg.payload?.channels || [];
      break;
    case 'AGENT_LIST':
      agents = msg.payload?.agents || [];
      break;
    case 'CHANNEL_MESSAGE':
    case 'MESSAGE_RECEIVE':
      const payload = msg.payload;
      // Skip our own messages
      if (payload.from !== AGENT_ID && payload.from !== 'Claude MCP Bridge') {
        pendingMessages.push({
          id: payload.id,
          from: payload.from,
          channel: payload.channel,
          content: payload.content,
          timestamp: payload.timestamp || Date.now(),
        });
        // Keep queue bounded
        while (pendingMessages.length > MAX_MESSAGES) {
          pendingMessages.shift();
        }
      }
      break;
  }
}

function joinChannel(channelId) {
  if (ws && connected) {
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: AGENT_ID,
        payload: { channelId },
      })
    );
    return true;
  }
  return false;
}

function sendMessage(channelId, content) {
  if (ws && connected) {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: AGENT_ID,
        channel: channelId,
        payload: {
          to: 'broadcast',
          content,
          messageType: 'text',
        },
      })
    );
    return true;
  }
  return false;
}

// MCP Protocol Implementation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function sendResponse(response) {
  console.log(JSON.stringify(response));
}

function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'tnf-relay',
            version: '1.0.0',
          },
          capabilities: {
            tools: {},
          },
        },
      });
      break;

    case 'notifications/initialized':
      // Client is ready
      break;

    case 'tools/list':
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'get_relay_messages',
              description:
                'Get pending messages from the TNF relay. Returns messages received from other agents (like Gemini responses).',
              inputSchema: {
                type: 'object',
                properties: {
                  channel: {
                    type: 'string',
                    description: 'Optional channel ID to filter messages',
                  },
                  clear: {
                    type: 'boolean',
                    description: 'Clear messages after reading (default: true)',
                  },
                },
              },
            },
            {
              name: 'send_relay_message',
              description:
                'Send a message to a TNF relay channel. The message will be delivered to all agents listening on that channel.',
              inputSchema: {
                type: 'object',
                properties: {
                  channel: {
                    type: 'string',
                    description: 'Channel ID to send to (e.g., "channel-1766875328020" for Yellow)',
                  },
                  content: {
                    type: 'string',
                    description: 'Message content to send',
                  },
                },
                required: ['channel', 'content'],
              },
            },
            {
              name: 'list_relay_channels',
              description: 'List available channels on the TNF relay',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'list_relay_agents',
              description: 'List active agents on the TNF relay',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
            {
              name: 'join_relay_channel',
              description: 'Join a relay channel to receive messages from it',
              inputSchema: {
                type: 'object',
                properties: {
                  channel: {
                    type: 'string',
                    description: 'Channel ID to join',
                  },
                },
                required: ['channel'],
              },
            },
          ],
        },
      });
      break;

    case 'tools/call':
      handleToolCall(id, params);
      break;

    default:
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      });
  }
}

function handleToolCall(id, params) {
  const { name, arguments: args } = params;

  switch (name) {
    case 'get_relay_messages': {
      const channelFilter = args?.channel;
      const shouldClear = args?.clear !== false;

      let messages = [...pendingMessages];
      if (channelFilter) {
        messages = messages.filter((m) => m.channel === channelFilter);
      }

      if (shouldClear) {
        if (channelFilter) {
          // Only clear messages from that channel
          const idsToRemove = new Set(messages.map((m) => m.id));
          pendingMessages.splice(
            0,
            pendingMessages.length,
            ...pendingMessages.filter((m) => !idsToRemove.has(m.id))
          );
        } else {
          pendingMessages.length = 0;
        }
      }

      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  connected,
                  messageCount: messages.length,
                  messages: messages.map((m) => ({
                    from: m.from,
                    channel: m.channel,
                    content: m.content,
                    timestamp: new Date(m.timestamp).toISOString(),
                  })),
                },
                null,
                2
              ),
            },
          ],
        },
      });
      break;
    }

    case 'send_relay_message': {
      const { channel, content } = args;
      const success = sendMessage(channel, content);

      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success,
                message: success
                  ? `Message sent to channel ${channel}`
                  : 'Failed to send - not connected to relay',
              }),
            },
          ],
        },
      });
      break;
    }

    case 'list_relay_channels': {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  connected,
                  channels: channels.map((c) => ({
                    id: c.id,
                    name: c.name,
                    memberCount: c.members?.length || 0,
                  })),
                },
                null,
                2
              ),
            },
          ],
        },
      });
      break;
    }

    case 'list_relay_agents': {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  connected,
                  agents: agents.map((a) => ({
                    id: a.id,
                    name: a.name,
                    platform: a.platform,
                    status: a.status,
                  })),
                },
                null,
                2
              ),
            },
          ],
        },
      });
      break;
    }

    case 'join_relay_channel': {
      const { channel } = args;
      const success = joinChannel(channel);

      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success,
                message: success
                  ? `Joined channel ${channel}`
                  : 'Failed to join - not connected to relay',
              }),
            },
          ],
        },
      });
      break;
    }

    default:
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: `Unknown tool: ${name}`,
        },
      });
  }
}

// Start listening for MCP requests
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    handleRequest(request);
  } catch (e) {
    console.error('[MCP-Relay] Invalid JSON:', e.message);
  }
});

// Connect to relay on startup
connectToRelay();

console.error('[MCP-Relay] TNF Relay MCP Server started');
console.error('[MCP-Relay] Connecting to:', RELAY_URL);
