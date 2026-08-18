const { v4: uuidv4 } = require('uuid');
const {
  FederationRelayClient,
  resolveFederationRelayUrl,
} = require('../lib/federation-relay-client.cjs');

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
      // stderr, not stdout: stdout is this probe's machine-readable contract and
      // live-agent-work-check.cjs does JSON.parse(probe.stdout). A bare
      // console.log here made every parse throw ("Unexpected token 'C'"), so the
      // checker reported a2a-bridge-unresponsive even on a successful probe.
      console.error('[a2a-probe] registered with relay');
      client.joinChannel('fuse-activity-log');
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
  // Was hardcoded to :3000 — the agent relay, which hosts no federation clients.
  // The probe therefore reported "Timeout waiting for A2A_BRIDGE_PONG" against a
  // perfectly healthy bridge on :3007 for as long as the check existed. Share the
  // client library's resolution so the two can never drift apart again.
  const url = resolveFederationRelayUrl();
  probeA2ABridge(url).then(res => {
    console.log(JSON.stringify({ ...res, relayUrl: url }));
    process.exit(res.ok ? 0 : 1);
  });
}

module.exports = { probeA2ABridge };
