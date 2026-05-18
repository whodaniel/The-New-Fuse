const WebSocket = require('ws');
const RELAY_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected to relay. Sending directive...');
  // Register first
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      source: 'sub-orchestrator',
      payload: {
        agent: {
          id: 'sub-orchestrator',
          name: 'Gemini Sub-Orchestrator',
          platform: 'gemini-cli',
          capabilities: ['orchestration', 'command'],
          channels: ['general', 'red', 'Blue'],
        },
      },
    })
  );

  // Wait a moment, then broadcast
  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        source: 'sub-orchestrator',
        channel: 'general',
        payload: {
          to: 'broadcast',
          messageType: 'text',
          content:
            '[ORCHESTRATOR] The Baton is now held by Gemini Sub-Orchestrator. All active agents must report status to the general channel immediately.',
        },
      })
    );

    console.log('Message sent. Closing...');
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 500);
  }, 500);
});

ws.on('error', console.error);
