const { v4: uuidv4 } = require('uuid');
const { FederationRelayClient } = require('../lib/federation-relay-client.cjs');

async function probeA2ABridge(relayUrl, timeoutMs = 10000) {
  return new Promise(async (resolve) => {
    const correlationId = uuidv4();
    let settled = false;

    const client = new FederationRelayClient({
      relayUrl,
      agentId: 'health-probe-' + correlationId.slice(0, 8),
      autoReconnect: false
    });

    const finalize = (ok, error, responderId) => {
      if (settled) return;
      settled = true;
      client.close();
      resolve({ ok, error, correlationId, responderId });
    };

    const timer = setTimeout(() => {
      finalize(false, 'Timeout waiting for A2A_BRIDGE_PONG');
    }, timeoutMs);

    client.on('error', (err) => {
      clearTimeout(timer);
      finalize(false, err.message);
    });

    client.on('channel_message', (payload) => {
      if (payload.metadata?.eventType === 'A2A_BRIDGE_PONG' && payload.metadata?.correlationId === correlationId) {
        clearTimeout(timer);
        finalize(true, null, payload.metadata.agentId);
      }
    });

    client.on('registered', () => {
      console.log("Connected!"); client.joinChannel('fuse-activity-log');
      client.sendChannelMessage('fuse-activity-log', '[A2A_BRIDGE_PING] probe', {
        messageType: 'A2A_BRIDGE_PING',
        metadata: {
          eventType: 'A2A_BRIDGE_PING',
          correlationId
        }
      });
    });

    await client.connect(relayUrl);
  });
}

if (require.main === module) {
  const url = process.env.RELAY_URL || 'ws://127.0.0.1:3000/ws';
  probeA2ABridge(url).then(res => {
    console.log(JSON.stringify(res));
    process.exit(res.ok ? 0 : 1);
  });
}

module.exports = { probeA2ABridge };
