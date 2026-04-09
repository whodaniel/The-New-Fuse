const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:3001/ws';

// Orchestrator State
let socket;
let redChannelId = null;

function connect() {
  socket = new WebSocket(RELAY_URL);

  socket.on('open', () => {
    console.log('[Orchestrator] Connected to Relay');

    // Register as Orchestrator
    const registerMsg = {
      id: `reg-${Date.now()}`,
      type: 'AGENT_REGISTER',
      timestamp: Date.now(),
      source: 'orchestrator-cli',
      payload: {
        agent: {
          id: 'orchestrator-cli',
          name: 'Orchestrator CLI',
          platform: 'cli',
          status: 'active',
          capabilities: ['orchestration', 'task-management'],
          channels: [],
        },
      },
    };
    socket.send(JSON.stringify(registerMsg));
  });

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(msg);
    } catch (e) {
      console.error('[Orchestrator] Failed to parse message:', e);
    }
  });

  socket.on('close', () => {
    console.log('[Orchestrator] Disconnected. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });
}

function handleMessage(msg) {
  // console.log('[Orchestrator] Received:', msg.type);

  switch (msg.type) {
    case 'WELCOME':
    case 'REGISTRATION_CONFIRMED':
      // Request channel list to find "Red"
      socket.send(
        JSON.stringify({
          id: `list-ch-${Date.now()}`,
          type: 'CHANNEL_LIST',
          timestamp: Date.now(),
        })
      );
      break;

    case 'CHANNEL_LIST':
      const channels = msg.payload?.channels || [];
      const red = channels.find((c) => c.name === 'Red');

      if (red) {
        console.log(`[Orchestrator] Found Red channel: ${red.id} (${red.members.length} members)`);
        if (redChannelId !== red.id) {
          redChannelId = red.id;
          joinRedChannel();
        }
      } else {
        console.log('[Orchestrator] Red channel not found. Creating...');
        socket.send(
          JSON.stringify({
            type: 'CHANNEL_CREATE',
            payload: { name: 'Red', description: 'Orchestration Channel' },
            source: 'orchestrator-cli',
            timestamp: Date.now(),
          })
        );
      }
      break;

    case 'CHANNEL_MESSAGE':
      console.log(`[Orchestrator] Channel Msg [${msg.channel}]:`, msg.payload?.content);
      break;
  }
}

function joinRedChannel() {
  socket.send(
    JSON.stringify({
      type: 'CHANNEL_JOIN',
      payload: { channelId: redChannelId },
      source: 'orchestrator-cli',
      timestamp: Date.now(),
    })
  );

  console.log('[Orchestrator] Joined Red Channel. Dispatching tasks...');

  // Dispatch a task after a slight delay
  setTimeout(dispatchTasks, 2000);
}

function dispatchTasks() {
  // Task 1: UI Inspection
  const task1 = {
    id: `task-${Date.now()}-1`,
    type: 'qa',
    priority: 'high',
    title: 'Analyze Extension UI',
    description:
      'We need to perfect the Federation Chrome Extension. Please analyze the current UI and workflow.',
    instructions: [
      'Acknowledge this task.',
      'Review the Floating Panel UI you are currently seeing.',
      'Suggest 3 specific improvements for the "Tasks" or "Chat" tab to make it more "premium" and "state of the art".',
      'If possible, generate a code snippet for a CSS improvement.',
    ],
    requiredCapabilities: ['chat-injection'],
    createdBy: 'Orchestrator CLI',
    createdAt: Date.now(),
  };

  socket.send(
    JSON.stringify({
      type: 'TASK_DISPATCH',
      channel: redChannelId,
      payload: { task: task1, channelId: redChannelId },
      source: 'orchestrator-cli',
      timestamp: Date.now(),
    })
  );

  console.log('[Orchestrator] Dispatched Task 1: Analyze Extension UI');
}

connect();
