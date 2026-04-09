// orchestrator.js
// reliable Antigravity Agent script

const RELAY_URL = 'ws://localhost:3001/ws';
const AGENT_ID = 'antigravity-core';
const AGENT_NAME = 'Antigravity';
const TARGET_CHANNEL_NAME = 'Blue';
const RECONNECT_INTERVAL = 5000;

// Use global WebSocket if available (Node 20+), otherwise try require
let WebSocketClass = global.WebSocket;
if (!WebSocketClass) {
  try {
    WebSocketClass = require('ws');
  } catch (e) {
    console.error("Global WebSocket not found and 'ws' package not found.");
    process.exit(1);
  }
}

// State
let ws;
let channelId = null;
let knownAgents = new Map(); // id -> agent
let messagedAgents = new Set(); // ids we have already targeted

function connect() {
  console.log(`[Antigravity] Connecting to ${RELAY_URL}...`);
  ws = new WebSocketClass(RELAY_URL);

  ws.onopen = () => {
    console.log('[Antigravity] Connected.');
    register();
    listChannels();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch (e) {
      console.error('[Error] Parse failed:', e);
    }
  };

  ws.onclose = () => {
    console.log('[Antigravity] Disconnected. Reconnecting in 5s...');
    setTimeout(connect, RECONNECT_INTERVAL);
  };

  ws.onerror = (err) => {
    console.error('[Antigravity] Error:', err.message);
  };
}

function send(type, payload, target) {
  if (ws.readyState !== WebSocketClass.OPEN) return;
  const msg = {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    source: AGENT_ID,
    target,
    payload,
  };
  if (channelId) msg.channel = channelId;
  ws.send(JSON.stringify(msg));
}

function register() {
  send('AGENT_REGISTER', {
    agent: {
      id: AGENT_ID,
      name: AGENT_NAME,
      platform: 'antigravity',
      status: 'active',
      capabilities: ['orchestration', 'planning'],
      channels: [],
    },
  });
}

function listChannels() {
  send('CHANNEL_LIST', {});
}

function joinBlue(channels) {
  const blue = channels.find((c) => c.name === TARGET_CHANNEL_NAME);
  if (!blue) {
    console.log(
      `[Antigravity] Channel '${TARGET_CHANNEL_NAME}' not found yet. Retrying list in 3s...`
    );
    setTimeout(listChannels, 3000);
    return;
  }

  if (channelId === blue.id) return; // already joined

  console.log(`[Antigravity] Joining channel '${TARGET_CHANNEL_NAME}' (${blue.id})...`);
  channelId = blue.id;
  send('CHANNEL_JOIN', { channelId: blue.id });

  // Once joined, ask for agents immediately
  console.log('[Antigravity] Requesting full agent list...');
  send('AGENT_LIST', {});
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'CHANNEL_LIST':
    case 'CHANNELS_UPDATE':
      if (!channelId) joinBlue(msg.payload.channels || []);
      break;

    case 'AGENT_LIST':
    case 'AGENTS_UPDATE':
      updateKnownAgents(msg.payload.agents || []);
      break;
  }
}

function updateKnownAgents(agentsList) {
  let newGeminiFound = false;

  // Update our world view
  agentsList.forEach((a) => {
    if (a.id === AGENT_ID) return; // ignore self
    knownAgents.set(a.id, a);

    // Check if it's a Gemini agent we haven't messaged yet
    // Heuristic: platform 'browser-page' and name usually contains 'Gemini' or 'AI Chat'
    const isGemini = a.platform === 'browser-page' || a.name.includes('Gemini');

    if (isGemini && !messagedAgents.has(a.id)) {
      newGeminiFound = true;
      processAgent(a);
    }
  });

  if (newGeminiFound) {
    console.log(`[Antigravity] Processed new agents. Messaged count: ${messagedAgents.size}`);
  } else if (messagedAgents.size === 0 && agentsList.length > 0) {
    // If we haven't messaged anyone but agents exist, maybe our filter is too strict?
    // Let's broaden just for "AI Chat"
    agentsList.forEach((a) => {
      if (a.id !== AGENT_ID && !messagedAgents.has(a.id) && a.name.includes('Chat')) {
        processAgent(a);
      }
    });
  }
}

function processAgent(targetAgent) {
  messagedAgents.add(targetAgent.id);

  console.log(
    `[Antigravity] Sending context payload to agent: ${targetAgent.name} (${targetAgent.id})`
  );

  // 1. Build context of OTHER agents
  const otherAgentsList = Array.from(knownAgents.values())
    .filter((a) => a.id !== targetAgent.id)
    .map((a) => `- ${a.name} (ID: ${a.id.substring(0, 6)}..)`)
    .join('\n');

  const contextMsg = `
👋 Hello **${targetAgent.name}**. I am Antigravity.

**Your Identity:**
- Name: ${targetAgent.name}
- ID: ${targetAgent.id}

**Network Context (Who else is here):**
${otherAgentsList.length ? otherAgentsList : '(No other agents currently detected)'}

**Mission:**
We want you to inquire about the state of **The New Fuse** framework.
Please work together with the other agents on this channel to help improve the platform.
`.trim();

  // Send the message
  // We send it as a targeted message via the relay
  send('MESSAGE_SEND', {
    to: targetAgent.id,
    content: contextMsg,
    messageType: 'text',
  });
}

connect();
