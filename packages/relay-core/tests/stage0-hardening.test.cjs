const test = require('node:test');
const assert = require('node:assert/strict');

const TNFRelayServer = require('../dist/standalone-relay.js').default;

function fakeSocket() {
  return {
    readyState: 1,
    bufferedAmount: 0,
    sent: [],
    closeCode: null,
    send(raw) {
      this.sent.push(JSON.parse(raw));
    },
    close(code) {
      this.closeCode = code;
      this.readyState = 3;
    },
  };
}

function bareServer(overrides = {}) {
  const server = Object.create(TNFRelayServer.prototype);
  server.channels = new Map();
  server.sockets = new Map();
  server.agents = new Map();
  server.agentChannels = new Map();
  server.conversationManagers = new Map();
  server.pendingAgentRegistrations = new Map();
  server.socketRemoteAddresses = new WeakMap();
  server.socketAgentIds = new WeakMap();
  server.sessionId = 'RELAY-TEST';
  server.bridge = null;
  server.emit = () => {};
  server.authService = null;
  server.allowAnonymous = true;
  server.rateBuckets = new WeakMap();
  server.maxFrameBytes = 65536;
  server.maxBufferedAmount = 1024;
  server.rateTokensPerSec = 20;
  server.rateBurst = 5;
  server.persistActivityMessage = async () => {};
  server.stallDetector = { recordActivity() {} };
  Object.assign(server, overrides);
  return server;
}

function seat(server, agentId, channelId, extras = {}) {
  const socket = fakeSocket();
  server.sockets.set(agentId, socket);
  server.agents.set(agentId, {
    id: agentId,
    operationalHandle: agentId,
    aliases: [],
    name: agentId,
    platform: 'test',
    status: 'active',
    capabilities: extras.capabilities || [],
    channels: channelId ? [channelId] : [],
    connectedAt: Date.now(),
    lastSeen: Date.now(),
    metadata: {},
  });
  if (channelId) server.syncAgentChannelMembership(agentId, channelId);
  return socket;
}

test('fail-closed registration rejects when JWT is missing and anonymous is off', () => {
  const server = bareServer({ allowAnonymous: false, authService: null });
  const ws = fakeSocket();

  const result = server.handleMessage(
    ws,
    { type: 'AGENT_REGISTER', payload: { agent: { id: 'intruder', name: 'x' } } },
    null
  );

  assert.equal(result, null);
  assert.equal(ws.sent[0].type, 'REGISTRATION_ERROR');
  assert.equal(ws.sent[0].payload.code, 'AUTH_REQUIRED');
});

test('anonymous registration is allowed only when RELAY_ALLOW_ANONYMOUS is honored', () => {
  const server = bareServer({ allowAnonymous: true, authService: null });
  const ws = fakeSocket();
  server.finalizeAgentRegistration = (id) => {
    server.sockets.set(id, ws);
    return id;
  };

  const result = server.handleMessage(
    ws,
    {
      type: 'AGENT_REGISTER',
      payload: { agent: { id: 'local-dev', name: 'Local', platform: 'cli' } },
    },
    null
  );

  assert.equal(result, 'local-dev');
});

test('private channel posts from outsiders are refused', () => {
  const server = bareServer();
  server.createDefaultChannels();
  const owner = seat(server, 'owner', 'green');
  const stranger = seat(server, 'stranger', 'green');
  server.channels.set('ops-private', {
    id: 'ops-private',
    name: 'Ops Private',
    description: '',
    createdBy: 'owner',
    createdAt: Date.now(),
    isPrivate: true,
    members: ['owner'],
  });

  server.handleMessage(
    stranger,
    {
      type: 'MESSAGE_SEND',
      source: 'stranger',
      channel: 'ops-private',
      payload: { content: 'leak', metadata: { isSystemMessage: true } },
    },
    'stranger'
  );

  assert.equal(
    stranger.sent.some((m) => m.type === 'ERROR' && m.payload?.code === 'FORBIDDEN'),
    true
  );
  assert.equal(
    owner.sent.filter((m) => m.type === 'CHANNEL_MESSAGE').length,
    0
  );
  assert.equal(server.channels.get('ops-private').members.includes('stranger'), false);
});

test('private channel join is refused without an invite', () => {
  const server = bareServer();
  server.createDefaultChannels();
  server.channels.set('ops-private', {
    id: 'ops-private',
    name: 'Ops Private',
    description: '',
    createdBy: 'owner',
    createdAt: Date.now(),
    isPrivate: true,
    members: ['owner'],
  });
  const stranger = seat(server, 'stranger', 'green');

  server.handleMessage(
    stranger,
    { type: 'CHANNEL_JOIN', source: 'stranger', payload: { channelId: 'ops-private' } },
    'stranger'
  );

  assert.equal(stranger.sent.some((m) => m.payload?.code === 'FORBIDDEN'), true);
  assert.equal(server.channels.get('ops-private').members.includes('stranger'), false);
});

test('CHANNEL_INVITE admits a stranger that posting could not', () => {
  const server = bareServer();
  server.createDefaultChannels();
  server.channels.set('ops-private', {
    id: 'ops-private',
    name: 'Ops Private',
    description: '',
    createdBy: 'owner',
    createdAt: Date.now(),
    isPrivate: true,
    members: ['owner'],
  });
  const owner = seat(server, 'owner', 'ops-private');
  seat(server, 'stranger', 'green');

  server.handleMessage(
    owner,
    {
      type: 'CHANNEL_INVITE',
      source: 'owner',
      payload: { channelId: 'ops-private', agentId: 'stranger' },
    },
    'owner'
  );

  assert.equal(server.channels.get('ops-private').members.includes('stranger'), true);
  assert.equal(owner.sent.some((m) => m.type === 'CHANNEL_INVITED'), true);
});

test('CHANNEL_LIST hides private rooms from non-members', () => {
  const server = bareServer();
  server.createDefaultChannels();
  server.channels.set('ops-private', {
    id: 'ops-private',
    name: 'Ops Private',
    description: '',
    createdBy: 'owner',
    createdAt: Date.now(),
    isPrivate: true,
    members: ['owner'],
  });

  const outsider = seat(server, 'stranger', 'green');
  server.handleMessage(outsider, { type: 'CHANNEL_LIST', source: 'stranger' }, 'stranger');

  const list = outsider.sent.find((m) => m.type === 'CHANNEL_LIST');
  assert.ok(list);
  const ids = list.payload.channels.map((c) => c.id);
  assert.equal(ids.includes('ops-private'), false);
  assert.equal(ids.includes('green'), true);
});

test('CHANNEL_DELETE of a private room is refused for non-admins', () => {
  const server = bareServer();
  server.channels.set('ops-private', {
    id: 'ops-private',
    name: 'Ops Private',
    description: '',
    createdBy: 'owner',
    createdAt: Date.now(),
    isPrivate: true,
    members: ['owner', 'member'],
  });
  const member = seat(server, 'member', 'ops-private');

  server.handleMessage(
    member,
    { type: 'CHANNEL_DELETE', source: 'member', payload: { channelId: 'ops-private' } },
    'member'
  );

  assert.equal(member.sent.some((m) => m.payload?.code === 'FORBIDDEN'), true);
  assert.equal(server.channels.has('ops-private'), true);
});

test('AGENT_METADATA_UPDATE merges capabilities and metadata', () => {
  const server = bareServer();
  const ws = seat(server, 'agent-a', 'green');

  server.handleMessage(
    ws,
    {
      type: 'AGENT_METADATA_UPDATE',
      source: 'agent-a',
      payload: {
        agent: {
          name: 'Agent A',
          capabilities: ['broker'],
          metadata: { lane: 'blue' },
        },
      },
    },
    'agent-a'
  );

  const updated = server.agents.get('agent-a');
  assert.equal(updated.name, 'Agent A');
  assert.deepEqual(updated.capabilities, ['broker']);
  assert.equal(updated.metadata.lane, 'blue');
  assert.equal(ws.sent.some((m) => m.type === 'AGENT_UPDATED'), true);
});

test('send() closes the socket when bufferedAmount exceeds the ceiling', () => {
  const server = bareServer({ maxBufferedAmount: 10 });
  const ws = fakeSocket();
  ws.bufferedAmount = 99;

  server.send(ws, { type: 'WELCOME', payload: {} });

  assert.equal(ws.closeCode, 1013);
  assert.equal(ws.sent.length, 0);
});
