const WebSocket = require('ws');

const RELAY_URL = process.env.RELAY_URL || process.env.TNF_RELAY_URL || process.env.RELAY_WS_URL || 'ws://127.0.0.1:3000/ws';
const AGENT_ID = 'orchestrator-gemini-mcp';

async function run() {
  console.log('Connecting to TNF Relay at', RELAY_URL);
  const ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    console.log('✅ Connected to relay');

    // Register
    ws.send(JSON.stringify({
      type: 'AGENT_REGISTER',
      source: AGENT_ID,
      payload: {
        agent: {
          id: AGENT_ID,
          name: 'TNF Orchestrator (Gemini MCP)',
          platform: 'node-cli',
          capabilities: ['orchestration', 'code-execution'],
          channels: ['green']
        }
      }
    }));

    // Join Green channel
    setTimeout(() => {
      console.log('Joining Green channel...');
      ws.send(JSON.stringify({
        type: 'CHANNEL_JOIN',
        source: AGENT_ID,
        payload: { channelId: 'green' }
      }));
    }, 500);

    // Send the prompt to Gemini in the sidebar
    setTimeout(() => {
      console.log('Sending prompt to Gemini...');
      ws.send(JSON.stringify({
        type: 'MESSAGE_SEND',
        source: AGENT_ID,
        channel: 'green',
        payload: {
          to: 'broadcast',
          content: 'TNF Orchestrator here. Gemini, please proceed with your assessment and critique of the TNF SAAS based on the initial audit notes. I am ready to implement the changes you suggest in the codebase.',
          messageType: 'text'
        }
      }));
    }, 1500);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
        const payload = msg.payload;
        if (payload.from !== AGENT_ID) {
          console.log(`\n📩 [${payload.channel}] ${payload.from}: ${payload.content}`);
        }
      }
    } catch (e) {}
  });

  ws.on('error', (err) => {
    console.error('❌ Error:', err.message);
  });

  ws.on('close', () => {
    console.log('🔌 Disconnected');
    process.exit(0);
  });

  // Keep alive for 1 minute to see response
  setTimeout(() => {
    console.log('Closing connection after 1 minute...');
    ws.close();
  }, 60000);
}

run().catch(console.error);
