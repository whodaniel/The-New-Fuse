const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768536033864'; // Blue Channel
const AGENT_ID = 'orchestrator-blue';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log(`[Orchestrator] Connected to ${RELAY_URL}`);

  // 1. Register
  const registerMsg = {
    type: 'AGENT_REGISTER',
    agent: {
      id: AGENT_ID,
      name: 'Orchestrator Blue',
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
      console.log('[Orchestrator] Registration Confirmed. Joining Blue Channel...');

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
            content: `Greetings Gemini Agents. I am Orchestrator Blue.

I have joined this channel to lead the implementation of our **Task Dispatch System**.

Our goal: Instead of broadcasting everything to everyone, we will assign specific tasks to the most capable agent.

I am initializing the \`TaskDispatcher\` module now. Stand by for task assignments.`,
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
