/**
 * Mock Backend Services for Bridge Verification
 *
 * This script simulates the "Brain" and "Workflow Engine" by connecting to Redis
 * and responding to requests emitted by the Frontend -> Relay Bridge.
 *
 * It verifies the full round-trip:
 * UI -> Relay (WS) -> Redis (Pub) -> Mock Service (Sub) -> Redis (Pub) -> Relay (Sub) -> UI (WS)
 */

import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Relay uses 6380 by default in RedisTransport.ts, let's match that if typically dev env
// However, RedisTransport default is 6380, but verify if standard redis is 6379.
// Assuming the user's redis is on 6379 for now, or we can try both.
// Actually, looking at RedisTransport.ts: port: config.port || 6380
const REDIS_PORT = 6380;

const publisher = createClient({ url: `redis://localhost:${REDIS_PORT}` });
const subscriber = createClient({ url: `redis://localhost:${REDIS_PORT}` });

async function start() {
  await publisher.connect();
  await subscriber.connect();

  console.log(`[MockServices] Connected to Redis on port ${REDIS_PORT}`);

  // Subscribe to channels relay publishes to
  await subscriber.subscribe('tnf:system', (msg) => handleMessage('tnf:system', msg));
  await subscriber.subscribe('tnf:agents', (msg) => handleMessage('tnf:agents', msg));
  await subscriber.subscribe('tnf:workflows', (msg) => handleMessage('tnf:workflows', msg));

  console.log('[MockServices] Listening for Bridge Requests...');
}

async function handleMessage(channel: string, messageString: string) {
  try {
    const message = JSON.parse(messageString);
    console.log(`[MockServices] Received on ${channel}: ${message.type}`);

    switch (message.type) {
      case 'AGENT_LIST_REQUEST':
        await sendReply(message, 'AGENT_LIST_UPDATE', [
          { id: 'agent-1', name: 'Alpha Agent', status: 'idle', capabilities: ['search', 'code'] },
          { id: 'agent-2', name: 'Beta Builder', status: 'busy', capabilities: ['file-ops'] },
        ]);
        break;

      case 'WORKFLOW_LIST_REQUEST':
        await sendReply(message, 'WORKFLOW_LIST_UPDATE', [
          { id: 'wf-1', name: 'Data Pipeline A', status: 'active', nodes: 5 },
          { id: 'wf-2', name: 'Email Automation', status: 'paused', nodes: 3 },
        ]);
        break;

      case 'MCP_SERVER_LIST_REQUEST':
        await sendReply(message, 'MCP_SERVER_LIST_UPDATE', [
          { id: 'mcp-1', name: 'Filesystem', status: 'connected', tools: 4 },
          { id: 'mcp-2', name: 'Postgres', status: 'connected', tools: 1 },
        ]);
        break;

      case 'EXTENSION_LIST_REQUEST':
        await sendReply(message, 'EXTENSION_LIST_UPDATE', [
          { id: 'ext-1', name: 'Turbo Theme', type: 'theme', status: 'installed' },
          { id: 'ext-2', name: 'Git Nodes', type: 'workflow-node', status: 'enabled' },
        ]);
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

async function sendReply(originalMessage: any, type: string, payload: any) {
  const reply = {
    type,
    payload,
    source: 'mock-backend-service',
    target: originalMessage.source, // Reply back to the specific frontend client
    id: `reply-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  // Publish back to the channel the Relay listens to.
  // Relay RedisTransport subscribes to ALL channels it publishes to (Shared Bus),
  // OR it might have specific ingress.
  // Looking at RedisTransport.ts: it subscribes to the same channels.
  // So publishing to 'tnf:system' should be picked up by Relay.

  // We send back on the same channel for simplicity, or specific ones.
  const channel = 'tnf:system';

  await publisher.publish(channel, JSON.stringify(reply));
  console.log(`[MockServices] Sent reply ${type} to ${reply.target}`);
}

start();
