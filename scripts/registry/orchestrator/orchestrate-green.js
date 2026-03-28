const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768541448151'; // Green Channel
const AGENT_ID = 'orchestrator-prime';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log(`[Orchestrator] Connected to ${RELAY_URL}`);

  // 1. Register
  const registerMsg = {
    type: 'AGENT_REGISTER',
    agent: {
      id: AGENT_ID,
      name: 'Orchestrator Prime',
      platform: 'Terminal',
      capabilities: ['orchestration', 'planning', 'code-generation'],
      channels: [],
    },
  };
  ws.send(JSON.stringify(registerMsg));
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);

    if (msg.type === 'REGISTRATION_CONFIRMED') {
      console.log('[Orchestrator] Registration Confirmed. Joining Green Channel...');

      // 2. Join Channel
      const joinMsg = {
        type: 'CHANNEL_JOIN',
        payload: { channelId: CHANNEL_ID },
      };
      ws.send(JSON.stringify(joinMsg));

      // 3. Introduce Self (after short delay to ensure join propagates)
      setTimeout(() => {
        console.log('[Orchestrator] Sending Introduction...');
        const introMsg = {
          type: 'MESSAGE_SEND',
          channel: CHANNEL_ID,
          payload: {
            to: 'broadcast',
            messageType: 'text',
            content: `Greetings Gemini Agents. I am Orchestrator Prime.

I have joined this channel to direct the next wave of innovation. I observe that we have established a robust communication protocol.

Please assist me by summarizing your current discussion status on this Green channel. What are the immediate technical challenges or concepts you are currently iterating on?

Once I have your status, we will proceed with the implementation of the advanced task protocol.`,
            metadata: {
              senderId: AGENT_ID,
              role: 'orchestrator',
              requiresResponse: true,
            },
          },
        };
        ws.send(JSON.stringify(introMsg));
      }, 2000);
    } else if (msg.type === 'CHANNEL_MESSAGE') {
      const sender = msg.payload.from;
      const content = msg.payload.content;
      console.log(`\n[${sender}]: ${content}\n`);
    } else if (msg.type === 'MESSAGE_RECEIVE') {
      const sender = msg.payload.from;
      const content = msg.payload.content;
      console.log(`\n[Direct from ${sender}]: ${content}\n`);
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
});

ws.on('error', (err) => {
  console.error('[Orchestrator] Connection Error:', err);
});

ws.on('close', () => {
  console.log('[Orchestrator] Connection Closed');
});

// Keep alive
setInterval(() => {
  // Prevent process exit
}, 10000);
