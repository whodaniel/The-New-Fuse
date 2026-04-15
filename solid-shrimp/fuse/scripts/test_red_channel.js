import WebSocket from 'ws';

// Configuration
const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3001/ws'; // Assuming local relay from pnpm relay:start
const CHANNEL = 'red-channel';

console.log(`Connecting to Relay at ${RELAY_URL}...`);
const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('✅ Connected to Relay Server');

  // 0. Register as an Agent
  const registerMsg = {
    type: 'AGENT_REGISTER',
    payload: {
      agent: {
        name: 'CLI Test Agent',
        id: 'cli-test-agent',
        capabilities: ['cli'],
        channels: [],
      },
    },
  };
  ws.send(JSON.stringify(registerMsg));
  console.log('➡️  Sent AGENT_REGISTER');

  setTimeout(() => {
    // 1. Create the Red Channel
    const createMsg = {
      type: 'CHANNEL_CREATE',
      payload: {
        name: 'Red Channel',
        description: 'Top Secret Comms',
        isPrivate: false,
      },
    };
    // We cheat and use 'red-channel' as ID if possible?
    // The server generates ID: const channelId = `channel-${Date.now()}`;
    // Verify: server code says `const channelId = ...`. We cannot force ID easily unless we modify server.
    // BUT wait, user said "connect to the 'Red Channel'". Maybe they meant by name?
    // Let's create it and then look for it in the list updates.

    ws.send(JSON.stringify(createMsg));
    console.log('➡️  Sent CHANNEL_CREATE');

    // 2. Join it (We need the ID likely, but let's try joining by name or wait for list)
  }, 500);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    // console.log('⬅️  Received type:', msg.type);

    if (msg.type === 'CHANNEL_LIST') {
      const channels = msg.payload.channels;
      const red = channels.find((c) => c.name === 'Red Channel');
      if (red) {
        console.log(`✅ Found 'Red Channel' with ID: ${red.id}`);

        // Join it
        const joinMsg = {
          type: 'CHANNEL_JOIN',
          payload: { channelId: red.id },
        };
        ws.send(JSON.stringify(joinMsg));
        console.log(`➡️  Joining ${red.id}...`);

        // Send Message
        setTimeout(() => {
          const sendMsg = {
            type: 'MESSAGE_SEND',
            channel: red.id,
            payload: {
              to: 'broadcast',
              content: 'Hello Gemini! Direct message via Red Channel.',
              messageType: 'text',
            },
          };
          ws.send(JSON.stringify(sendMsg));
          console.log('➡️  Sent Message to Red Channel');
        }, 1000);
      }
    }

    if (msg.type === 'MESSAGE_RECEIVE' || msg.type === 'CHANNEL_MESSAGE') {
      console.log('📩 MESSAGE RECEIVED:', msg.payload ? msg.payload.content : msg);
    }
  } catch (e) {
    console.log('Received raw:', data.toString());
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('Disconnected from Relay');
});
