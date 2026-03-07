const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';
const CHANNEL_ID = 'red';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected to relay');

  // 1. Register
  const registerMsg = {
    id: `reg-${Date.now()}`,
    type: 'AGENT_REGISTER',
    timestamp: Date.now(),
    source: 'orchestrator-script',
    payload: {
      agent: {
        id: 'orchestrator-script',
        name: 'Orchestrator Script',
        platform: 'script',
        status: 'active',
        capabilities: ['orchestration'],
        channels: [CHANNEL_ID],
      },
    },
  };
  ws.send(JSON.stringify(registerMsg));

  // 2. Join Channel (explicitly, though register might handle it)
  setTimeout(() => {
    const joinMsg = {
      id: `join-${Date.now()}`,
      type: 'CHANNEL_JOIN',
      timestamp: Date.now(),
      source: 'orchestrator-script',
      payload: { channelId: CHANNEL_ID },
    };
    ws.send(JSON.stringify(joinMsg));
  }, 500);

  // 3. Dispatch Task
  setTimeout(() => {
    const task = {
      id: `task-${Date.now()}`,
      type: 'review',
      priority: 'high',
      title: 'Federation System Self-Test',
      description:
        'The User has requested a perfection of the system. Please acknowledge receipt and provide a status update.',
      instructions: [
        'Confirm you received this task.',
        'State which agent you are (e.g. Gemini, ChatGPT).',
        'Provide a brief "Everything is working" or list any issues you observe in the chat interface.',
      ],
      requiredCapabilities: ['chat-injection'],
      requiresResponse: true,
      correlationId: `corr-${Date.now()}`,
      createdAt: Date.now(),
      createdBy: 'Orchestrator',
    };

    console.log('Dispatching Task:', task.title);

    const dispatchMsg = {
      id: `dispatch-${Date.now()}`,
      type: 'TASK_DISPATCH',
      timestamp: Date.now(),
      source: 'orchestrator-script',
      channel: CHANNEL_ID,
      payload: {
        task: task,
        channelId: CHANNEL_ID,
      },
    };
    ws.send(JSON.stringify(dispatchMsg));

    // Keep alive briefly then exit
    setTimeout(() => {
      console.log('Task dispatched. Exiting.');
      process.exit(0);
    }, 2000);
  }, 1000);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    console.log('Received:', msg.type);
  } catch (e) {
    console.log('Received raw:', data);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket Error:', err);
  process.exit(1);
});
