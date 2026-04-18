import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { RedisAgentClient } from '@the-new-fuse/tnf-cli';
import { z } from 'zod';

// Network Control Agent (NCA)
const server = new McpServer({
  name: 'tnf-network-control',
  version: '1.0.0',
});

let client: RedisAgentClient | null = null;
let clientInitialized = false;

async function getClient() {
  if (!client) {
    client = new RedisAgentClient();
    try {
      await client.initialize();
      // Register with a special role to avoid confusion with main agents
      await client.register('tnf-network-control', 'broker', 'mcp-server', ['network_management']);
      clientInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TNF Network Client:', error);
      throw error;
    }
  }
  return client;
}

// ------------------------------------------------------------------
// TOOLS
// ------------------------------------------------------------------

// Tool: list_channels
server.tool(
  'list_channels',
  'List all available communication channels in the TNF network.',
  {},
  async () => {
    const c = await getClient();
    const channels = await c.getChannels();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(channels, null, 2),
        },
      ],
    };
  }
);

// Tool: create_channel
server.tool(
  'create_channel',
  'Create a new communication channel for agents.',
  {
    name: z.string().describe("Name of the channel to create (e.g., 'Design', 'Ops')."),
  },
  async ({ name }) => {
    const c = await getClient();
    const result = await c.createChannel(name);
    return {
      content: [
        {
          type: 'text',
          text: `Channel '${result}' creation request sent.`,
        },
      ],
    };
  }
);

// Tool: list_agents
server.tool('list_agents', 'List all registered agents currently in the network.', {}, async () => {
  const c = await getClient();
  const agents = await c.listAgents();
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(agents, null, 2),
      },
    ],
  };
});

// Tool: broadcast_message
// @ts-ignore
server.tool(
  'broadcast_message',
  'Broadcast a message to all agents or a specific channel.',
  {
    message: z.string().describe('Content of the message'),
    channel: z.string().optional().describe("Specific channel to send to. Defaults to 'General'."),
    type: z.enum(['message', 'command', 'status']).optional().default('message'),
  },
  async ({ message, channel, type }) => {
    const c = await getClient();
    await c.send(message, {
      channel: channel || 'General',
      type: type as any,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Message broadcast to ${channel || 'General'}: "${message}"`,
        },
      ],
    };
  }
);

// Tool: invite_agent
server.tool(
  'invite_agent',
  'Invite a specific agent to a channel.',
  {
    agentId: z.string().describe('ID of the agent to invite'),
    channel: z.string().describe('Channel to invite them to'),
    message: z.string().optional().describe('Optional custom invitation message'),
  },
  async ({ agentId, channel, message }) => {
    const c = await getClient();
    const inviteText = message || `Please join channel: ${channel}`;

    // Direct message to agent
    // Note: RedisAgentClient.send with `to` option supports direct messaging if implemented fully
    // Current implementation of 'send' takes options.to

    await c.send(inviteText, {
      to: { agentId },
      channel: channel, // Context channel? Or send on General?
      // Usually invites are sent on a common channel or DMs
      type: 'command',
      metadata: {
        command: 'JOIN_CHANNEL',
        targetChannel: channel,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `Invitation sent to ${agentId} for channel ${channel}.`,
        },
      ],
    };
  }
);

// ------------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TNF Network MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
