import WebSocket from 'ws';

const RELAY_URL = 'ws://localhost:3001/ws';
const BLUE_CHANNEL_ID = 'channel-1768256017068'; // Hardcoded from list_channels.js result

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log(`Connected to Relay. Target Channel: Blue (${BLUE_CHANNEL_ID})`);

  // 1. Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      payload: {
        agentId: 'cli-blue-tester',
        name: 'BlueTeamCLI',
        capabilities: ['testing'],
      },
    })
  );

  // 2. Join Channel
  setTimeout(() => {
    console.log(`Joining Blue Channel...`);
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        payload: { channelId: BLUE_CHANNEL_ID },
      })
    );
  }, 500);

  // 3. Send Message
  setTimeout(() => {
    const msg = 'Hello Space! This is the CLI Agent joining the Blue Channel.';
    console.log(`Sending: "${msg}"`);
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        payload: {
          to: BLUE_CHANNEL_ID,
          content: msg,
          messageType: 'text',
        },
      })
    );
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    // Filter out my own messages if needed, or just log everything
    if (msg.type === 'MESSAGE_SEND') {
      const from = msg.payload.from;
      const content = msg.payload.content;
      console.log(`\n[${from}]: ${content}`);
    } else if (msg.type === 'error') {
      console.error('Relay Error:', msg.payload);
    } else {
      console.log('Received:', msg.type);
    }
  } catch (e) {
    console.error('Parse Error:', e);
  }
});
