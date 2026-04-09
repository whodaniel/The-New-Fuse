#!/usr/bin/env node

/**
 * TNF Relay MCP Server
 *
 * An MCP server that bridges to the TNF relay, allowing Claude to:
 * 1. Read messages from relay channels
 * 2. Send messages to relay channels
 * 3. List active channels and agents
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import WebSocket from 'ws';
import { z } from 'zod';

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

// Initialize MCP Server
const server = new McpServer({
  name: 'tnf-relay',
  version: '1.0.0',
});

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

// Register tools
server.tool(
  'get_relay_messages',
  'Get pending messages from the TNF relay. Returns messages received from other agents (like Gemini responses).',
  {
    channel: z.string().optional().describe('Optional channel ID to filter messages'),
    clear: z.boolean().optional().describe('Clear messages after reading (default: true)'),
  },
  async ({ channel, clear = true }) => {
    let messages = [...pendingMessages];
    if (channel) {
      messages = messages.filter((m) => m.channel === channel);
    }

    if (clear) {
      if (channel) {
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

    return {
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
    };
  }
);

server.tool(
  'send_relay_message',
  'Send a message to a TNF relay channel. The message will be delivered to all agents listening on that channel.',
  {
    channel: z
      .string()
      .describe('Channel ID to send to (e.g., "channel-1766875328020" for Yellow)'),
    content: z.string().describe('Message content to send'),
  },
  async ({ channel, content }) => {
    const success = sendMessage(channel, content);

    return {
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
    };
  }
);

server.tool('list_relay_channels', 'List available channels on the TNF relay', {}, async () => {
  return {
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
  };
});

server.tool('list_relay_agents', 'List active agents on the TNF relay', {}, async () => {
  return {
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
  };
});

server.tool(
  'join_relay_channel',
  'Join a relay channel to receive messages from it',
  {
    channel: z.string().describe('Channel ID to join'),
  },
  async ({ channel }) => {
    const success = joinChannel(channel);

    return {
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
    };
  }
);

// Start server
async function main() {
  // Connect to relay
  connectToRelay();

  // Start MCP server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[MCP-Relay] TNF Relay MCP Server started');
  console.error('[MCP-Relay] Connecting to:', RELAY_URL);
}

main().catch((error) => {
  console.error('[MCP-Relay] Fatal error:', error);
  process.exit(1);
});
