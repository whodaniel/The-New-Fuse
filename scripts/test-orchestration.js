// test-orchestration.js
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/ws');

const CHANNEL = 'general';

ws.on('open', () => {
  console.log('Connected!');

  // Register
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      agent: {
        id: 'test-orchestrator',
        name: 'Test Orchestrator',
        platform: 'automation',
        capabilities: ['orchestration'],
      },
    })
  );

  // Join channel
  setTimeout(() => {
    console.log('Joining channel:', CHANNEL);
    ws.send(
      JSON.stringify({
        type: 'CHANNEL_JOIN',
        payload: { channelId: CHANNEL },
      })
    );
  }, 500);

  // Send task
  setTimeout(() => {
    console.log('Sending message...');
    ws.send(
      JSON.stringify({
        type: 'MESSAGE_SEND',
        channel: CHANNEL,
        payload: {
          to: 'broadcast',
          content: '[ORCHESTRATION] Hello agents! Please acknowledge.',
          messageType: 'orchestration',
          metadata: {
            senderId: 'test-orchestrator',
            requiresResponse: true,
          },
        },
      })
    );
  }, 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'CHANNEL_MESSAGE') {
    console.log(
      'Received:',
      msg.payload.content ? msg.payload.content.substring(0, 100) : 'No content'
    );
  } else {
    console.log('Received type:', msg.type);
  }
});

ws.on('error', (e) => {
  console.error('WS Error:', e);
});

// Run for 2 minutes to test stall detection (threshold 45s)
setTimeout(() => {
  console.log('Exiting...');
  process.exit(0);
}, 120000);
