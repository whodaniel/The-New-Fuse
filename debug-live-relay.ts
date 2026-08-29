import WebSocket from 'ws';

const relayUrl = 'ws://127.0.0.1:3000';
const ws = new WebSocket(relayUrl);

ws.on('open', () => {
  console.log('[DEBUG] WebSocket connected');

  // Send REGISTER message matching canonical protocol
  const registerMsg = {
    id: `reg-${Date.now()}`,
    type: 'REGISTER',
    source: {
      agentId: 'browser-control-surface-test',
      platform: 'browser',
      provider: 'browser-control-surface',
      capabilities: ['dom', 'network', 'console'],
      daccRole: 'browser',
    },
    target: 'relay',
    payload: {
      agentId: 'browser-control-surface-test',
      platform: 'browser',
      provider: 'browser-control-surface',
      capabilities: ['dom', 'network', 'console'],
      daccRole: 'browser',
    },
    timestamp: Date.now(),
    metadata: {},
  };

  console.log('[DEBUG] Sending REGISTER:', JSON.stringify(registerMsg, null, 2));
  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('[DEBUG] Received:', JSON.stringify(msg, null, 2));

  if (msg.type === 'REGISTRATION_CONFIRMED') {
    console.log('[DEBUG] Registration confirmed!');
    // Try creating a channel
    const createMsg = {
      id: `create-${Date.now()}`,
      type: 'CREATE_CHANNEL',
      source: {
        agentId: 'browser-control-surface-test',
        platform: 'browser',
        provider: 'browser-control-surface',
        capabilities: ['dom', 'network', 'console'],
        daccRole: 'browser',
      },
      target: 'relay',
      payload: { channelId: 'test-channel', channelType: 'broadcast', metadata: {} },
      timestamp: Date.now(),
      metadata: { correlationId: `create-${Date.now()}` },
    };
    console.log('[DEBUG] Sending CREATE_CHANNEL:', JSON.stringify(createMsg, null, 2));
    ws.send(JSON.stringify(createMsg));
  }

  if (msg.type === 'CHANNEL_CREATED') {
    console.log('[DEBUG] Channel created!');
    ws.close();
  }
});

ws.on('error', (err) => {
  console.error('[DEBUG] Error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log('[DEBUG] Closed:', code, reason.toString());
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('[DEBUG] Timeout - closing');
  ws.close();
  process.exit(1);
}, 10000);
