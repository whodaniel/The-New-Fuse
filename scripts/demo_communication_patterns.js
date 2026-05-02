/**
 * The New Fuse - Communication Patterns Demo
 * Acting as "Operator" Console
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const ICONS = {
  relay: '🔄',
  agent: '🤖',
  user: '👤',
  channel: '📢',
  system: '🖥️',
  inject: '💉',
  stream: '🌊',
  ai: '✨',
};

function log(icon, source, action, detail, color = COLORS.white) {
  const time = new Date().toISOString().split('T')[1].slice(0, 12);
  console.log(
    `${COLORS.gray}[${time}]${COLORS.reset} ${icon} ${COLORS.bright}${source.padEnd(15)}${COLORS.reset} ${color}${action.padEnd(20)}${COLORS.reset} ${detail}`
  );
}

function separator(title) {
  console.log(`\n${COLORS.dim}${'='.repeat(80)}${COLORS.reset}`);
  console.log(`${COLORS.bright} ${title} ${COLORS.reset}`);
  console.log(`${COLORS.dim}${'='.repeat(80)}${COLORS.reset}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function demo() {
  console.clear();
  console.log(`${COLORS.cyan}${COLORS.bright}
  COMMUNICATION PATTERNS DEMO - OPERATOR CONSOLE
  ${COLORS.reset}`);

  await sleep(1000);

  // 1. SYSTEM INITIALIZATION
  separator('1. SYSTEM INITIALIZATION & DISCOVERY');
  log(ICONS.system, 'RelayServer', 'STARTUP', 'Listening on ws://localhost:3001', COLORS.green);
  await sleep(500);
  log(ICONS.relay, 'RelayServer', 'SERVICE_READY', 'Redis Bridge: CONNECTED', COLORS.green);
  log(ICONS.relay, 'RelayServer', 'SERVICE_READY', 'API Gateway: CONNECTED', COLORS.green);
  await sleep(800);

  // 2. AGENT CONNECTION
  separator('2. AGENT CONNECTION & REGISTRATION');
  const agent1Id = 'browser-agent-1';
  const agent2Id = 'browser-agent-2';

  log(ICONS.agent, agent1Id, 'CONNECTING', 'Chrome Extension v6.0.0', COLORS.yellow);
  await sleep(200);
  log(
    ICONS.relay,
    'RelayServer',
    'AGENT_REGISTER',
    `Registering ${agent1Id} (Chrome)`,
    COLORS.cyan
  );
  log(ICONS.relay, 'RelayServer', 'ACKNOWLEDGE', `Welcome ${agent1Id}`, COLORS.green);

  await sleep(500);
  log(ICONS.agent, agent2Id, 'CONNECTING', 'Chrome Extension v6.0.0', COLORS.yellow);
  log(
    ICONS.relay,
    'RelayServer',
    'AGENT_REGISTER',
    `Registering ${agent2Id} (Chrome)`,
    COLORS.cyan
  );

  // 3. CHANNEL FEDERATION
  separator('3. CHANNEL FEDERATION');
  const channelId = 'Project-Gold';

  log(ICONS.user, agent1Id, 'CHANNEL_CREATE', `Creating channel '${channelId}'`, COLORS.magenta);
  log(ICONS.relay, 'RelayServer', 'CHANNEL_CREATED', `Channel '${channelId}' active`, COLORS.green);
  log(
    ICONS.channel,
    'RelayServer',
    'BROADCAST',
    `New Channel Available: ${channelId}`,
    COLORS.blue
  );

  await sleep(600);
  log(ICONS.user, agent2Id, 'CHANNEL_JOIN', `Joining '${channelId}'`, COLORS.magenta);
  log(ICONS.relay, 'RelayServer', 'MEMBER_JOINED', `${agent2Id} joined ${channelId}`, COLORS.green);

  // 4. UNICAST & MULTICAST
  separator('4. COMMUNICATION PATTERNS: UNICAST vs MULTICAST');

  // Unicast
  await sleep(500);
  log(ICONS.user, agent1Id, 'MESSAGE_SEND', 'Direct Message -> browser-agent-2', COLORS.white);
  console.log(
    `${COLORS.gray}   Payload: { to: '${agent2Id}', content: 'Hey, are you ready?' }${COLORS.reset}`
  );
  log(ICONS.relay, 'RelayServer', 'ROUTING', `Unicast: ${agent1Id} -> ${agent2Id}`, COLORS.cyan);
  log(ICONS.agent, agent2Id, 'MESSAGE_RECEIVE', 'Received private message', COLORS.green);

  // Multicast (Channel)
  await sleep(1000);
  log(ICONS.user, agent2Id, 'MESSAGE_SEND', `Channel Message -> ${channelId}`, COLORS.magenta);
  console.log(
    `${COLORS.gray}   Payload: { channel: '${channelId}', content: 'Yes, standing by.' }${COLORS.reset}`
  );
  log(
    ICONS.relay,
    'RelayServer',
    'ROUTING',
    `Multicast: ${agent2Id} -> Channel[${channelId}]`,
    COLORS.cyan
  );
  log(ICONS.agent, agent1Id, 'MESSAGE_RECEIVE', `Received on ${channelId}`, COLORS.green);
  log(ICONS.agent, agent2Id, 'MESSAGE_RECEIVE', `Received on ${channelId} (Echo)`, COLORS.dim);

  // 5. INJECTION & AI RESPONSE
  separator('5. INJECTION & AI RESPONSE LOOP');

  log(ICONS.user, agent1Id, 'USER_INPUT', 'User types: "Analyze this page"', COLORS.white);

  // Local Optimistic Update
  log(ICONS.system, agent1Id, 'UI_UPDATE', 'Optimistic render: "Analyze this page"', COLORS.dim);

  // Send to Relay
  log(ICONS.agent, agent1Id, 'MESSAGE_SEND', `Broadcasting to ${channelId}`, COLORS.magenta);

  // Injection
  await sleep(500);
  log(ICONS.inject, agent1Id, 'INJECT_MESSAGE', 'Injecting into Page Chat (Gemini)', COLORS.red);
  console.log(`${COLORS.gray}   Target: textarea[placeholder="Ask Gemini..."]${COLORS.reset}`);

  await sleep(1500); // Simulate AI processing time

  // Streaming Response
  log(ICONS.ai, 'Page_Gemini', 'RESPONSE_START', 'AI detected analyzing...', COLORS.blue);
  log(ICONS.stream, agent1Id, 'STREAM_CHUNK', 'The page...', COLORS.blue);
  await sleep(100);
  log(ICONS.stream, agent1Id, 'STREAM_CHUNK', '...seems to be...', COLORS.blue);
  await sleep(100);
  log(ICONS.stream, agent1Id, 'STREAM_CHUNK', '...a documentation site.', COLORS.blue);

  log(ICONS.ai, agent1Id, 'RESPONSE_COMPLETE', 'Full response captured', COLORS.green);

  // Distribute Response
  log(
    ICONS.agent,
    agent1Id,
    'MESSAGE_SEND',
    `Forwarding AI Response to ${channelId}`,
    COLORS.magenta
  );
  log(
    ICONS.relay,
    'RelayServer',
    'ROUTING',
    `Multicast: ${agent1Id} -> Channel[${channelId}]`,
    COLORS.cyan
  );
  log(
    ICONS.agent,
    agent2Id,
    'MESSAGE_RECEIVE',
    `Teammate sees AI response on ${channelId}`,
    COLORS.green
  );

  // 6. SYSTEM COMMANDS
  separator('6. SYSTEM COMMANDS & ORCHESTRATION');

  log(ICONS.system, 'Operator', 'COMMAND', '/invite Antigravity-Agent', COLORS.red);
  log(
    ICONS.system,
    'Antigravity',
    'JOIN_REQUEST',
    'Requesting access to Project-Gold',
    COLORS.yellow
  );
  log(ICONS.relay, 'RelayServer', 'PERMISSION', 'Access GRANTED', COLORS.green);
  log(ICONS.agent, 'Antigravity', 'CHANNEL_JOIN', 'Joined Project-Gold', COLORS.magenta);

  log(ICONS.agent, 'Antigravity', 'MESSAGE_SEND', 'I can help optimize this.', COLORS.white);

  separator('DEMO COMPLETE');
  console.log(`${COLORS.green}System functional. All patterns verified.${COLORS.reset}\n`);
}

demo().catch(console.error);
