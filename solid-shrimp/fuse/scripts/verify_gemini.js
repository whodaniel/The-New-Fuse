import http from 'http';
import WebSocket from 'ws';

const RELAY_HOST = 'localhost';
const RELAY_PORT = 3001;
const RELAY_WS = `ws://${RELAY_HOST}:${RELAY_PORT}/ws`;
const RELAY_HTTP = `http://${RELAY_HOST}:${RELAY_PORT}`;

// 1. Check HTTP Status for Extension Count
console.log(`Checking Relay Status at ${RELAY_HTTP}...`);
http
  .get(`${RELAY_HTTP}/status`, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const status = JSON.parse(data);
        console.log('📊 System Status:', JSON.stringify(status.stats, null, 2));

        if (status.stats.chromeExtensions > 0) {
          console.log('✅ Chrome Extension DETECTED via HTTP Status!');
        } else {
          console.log('⚠️  No Chrome Extensions reported in HTTP Status.');
        }

        // Proceed to WS
        startWebSocket();
      } catch (e) {
        console.error('❌ Failed to parse HTTP status:', e.message);
        process.exit(1);
      }
    });
  })
  .on('error', (err) => {
    console.error('❌ HTTP Connection Error:', err.message);
    process.exit(1);
  });

function startWebSocket() {
  console.log(`connecting (WS) to ${RELAY_WS}...`);
  const ws = new WebSocket(RELAY_WS);

  ws.on('open', () => {
    console.log('✅ WS Connected.');

    // Register
    ws.send(
      JSON.stringify({
        type: 'AGENT_REGISTER',
        payload: {
          agent: { id: 'cli-verifier', name: 'CLI Verifier', capabilities: ['cli'], channels: [] },
        },
      })
    );
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Handle Agent List (Discovery)
      if (msg.type === 'AGENT_LIST') {
        const agents = msg.payload.agents;
        console.log(`📋 Agents List: (${agents.length})`);
        agents.forEach((a) => console.log(`   - [${a.id}] ${a.name}`));

        // Now look for channels
        console.log('🔍 Requesting Channel List...');
        ws.send(JSON.stringify({ type: 'CHANNEL_LIST', payload: {} }));
      }

      // Handle Channel List (Find Red Channel)
      if (msg.type === 'CHANNEL_LIST') {
        const channels = msg.payload.channels;
        const red = channels.find((c) => c.name === 'Red Channel');

        if (red) {
          console.log(`✅ Found 'Red Channel' (${red.id}). Members: ${red.members.length}`);
          console.log(`   Members: ${JSON.stringify(red.members)}`);

          // Join
          ws.send(JSON.stringify({ type: 'CHANNEL_JOIN', payload: { channelId: red.id } }));

          // Broadcast
          setTimeout(() => {
            console.log('📣 Broadcasting message to Red Channel...');
            ws.send(
              JSON.stringify({
                type: 'MESSAGE_SEND',
                channel: red.id,
                payload: {
                  to: 'broadcast',
                  content: 'Hello Gemini! Attempting direct communication via Red Channel.',
                  messageType: 'text',
                },
              })
            );
          }, 500);
        } else {
          console.log('⚠️  Red Channel not found. Creating it...');
          ws.send(
            JSON.stringify({
              type: 'CHANNEL_CREATE',
              payload: { name: 'Red Channel', description: 'Direct Comms' },
            })
          );
        }
      }

      // Handle Incoming Messages
      if (msg.type === 'MESSAGE_RECEIVE' || msg.type === 'CHANNEL_MESSAGE') {
        const content = msg.payload.content || msg.payload;
        const from = msg.payload.from || msg.source || 'unknown';
        console.log(`📩 MESSAGE FROM [${from}]:`, content);

        // If it's not from us, it's success!
        if (from !== 'cli-verifier') {
          console.log('🎉 SUCCESS: Received message from another agent!');
        }
      }
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  });
}
