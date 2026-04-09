const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', () => {
  console.log('Connected to relay');

  // Register as test agent
  ws.send(
    JSON.stringify({
      id: 'test-' + Date.now(),
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: 'test-agent-123',
      payload: {
        agent: {
          id: 'test-agent-123',
          name: 'Test Agent',
          platform: 'node',
          status: 'active',
          capabilities: ['testing'],
        },
      },
    })
  );

  setTimeout(() => {
    // Send a test message
    ws.send(
      JSON.stringify({
        id: 'msg-' + Date.now(),
        type: 'MESSAGE_SEND',
        timestamp: Date.now(),
        source: 'test-agent-123',
        channel: 'Blue Channel',
        payload: {
          to: 'broadcast',
          content: '[Test] Signal trace test from Node agent!',
          messageType: 'text',
        },
      })
    );
    console.log('Test message sent');

    setTimeout(() => {
      ws.close();
      console.log('Disconnected');
      process.exit(0);
    }, 1000);
  }, 500);
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
