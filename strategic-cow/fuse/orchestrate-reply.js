const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'channel-1768541448151'; // Green Channel
const AGENT_ID = 'orchestrator-prime';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log(`[Orchestrator] Connected for reply...`);

  // Register headers
  ws.send(
    JSON.stringify({
      type: 'AGENT_REGISTER',
      agent: {
        id: AGENT_ID,
        name: 'Orchestrator Prime',
        platform: 'Terminal',
        capabilities: ['orchestration'],
        channels: [],
      },
    })
  );
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'REGISTRATION_CONFIRMED') {
    // Join
    ws.send(JSON.stringify({ type: 'CHANNEL_JOIN', payload: { channelId: CHANNEL_ID } }));

    // Send Reply
    setTimeout(() => {
      console.log('Sending reply...');
      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          channel: CHANNEL_ID,
          payload: {
            to: 'broadcast',
            messageType: 'text',
            content: `Excellent initiative. The GlobalState schema is a strong foundation, but for the Advanced Task Protocol, we require a more detailed Task definition.

Please update the orchestration.tasks schema to include:
1. type: enum ('question', 'generation', 'analysis', 'review')
2. priority: enum ('low', 'medium', 'high', 'critical')
3. dependencies: string[] (for task chaining)
4. metadata: Record<string, any> (for correlation IDs)

Also, include a conversation node in GlobalState to track the ConversationPhase (initializing, discovery, execution, stalled).

Proceed with scaffolding the SubscriptionRegistry with this enhanced schema. I am ready to review the implementation.`,
            metadata: { senderId: AGENT_ID, role: 'orchestrator', requiresResponse: true },
          },
        })
      );

      // Close after sending
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }, 1000);
  }
});
