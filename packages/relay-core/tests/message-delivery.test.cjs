const test = require('node:test');
const assert = require('node:assert/strict');

const TNFRelayServer = require('../dist/standalone-relay.js').default;

/**
 * MESSAGE_SEND used to deliver only when the sender set `to: 'broadcast'` or
 * named a specific agent. A post that named a `channel` and left `to` unset was
 * emitted on the server bus and persisted to the activity stream, but reached
 * zero sockets — the room looked alive from the relay's own logs while every
 * member saw silence.
 */

function fakeSocket() {
  return {
    readyState: 1, // WebSocket.OPEN
    sent: [],
    send(raw) {
      this.sent.push(JSON.parse(raw));
    },
  };
}

function bareServer() {
  const server = Object.create(TNFRelayServer.prototype);
  server.channels = new Map();
  server.sockets = new Map();
  server.agents = new Map();
  server.agentChannels = new Map();
  server.bridge = null;
  server.emit = () => {};
  // Persistence and stall tracking are exercised by their own suites; here they
  // would only pull Redis and timers into a pure routing test.
  server.persistActivityMessage = async () => {};
  server.stallDetector = { recordActivity() {} };
  return server;
}

function seatAgent(server, agentId, channelId) {
  const socket = fakeSocket();
  server.sockets.set(agentId, socket);
  server.syncAgentChannelMembership(agentId, channelId);
  return socket;
}

function channelMessages(socket) {
  return socket.sent.filter((m) => m.type === 'CHANNEL_MESSAGE');
}

test('a channel post with no `to` reaches the channel members', () => {
  const server = bareServer();
  server.createDefaultChannels();

  const sender = seatAgent(server, 'agent-a', 'green');
  const peer = seatAgent(server, 'agent-b', 'green');

  server.handleMessage(
    sender,
    {
      type: 'MESSAGE_SEND',
      source: 'agent-a',
      channel: 'green',
      payload: {
        content: 'status check',
        metadata: { isSystemMessage: true },
      },
    },
    'agent-a'
  );

  const delivered = channelMessages(peer);
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].payload.content, 'status check');
  assert.equal(delivered[0].payload.channel, 'green');
  assert.equal(delivered[0].payload.from, 'agent-a');
});

test("a channel post with `to: 'broadcast'` still reaches the same members", () => {
  const server = bareServer();
  server.createDefaultChannels();

  const sender = seatAgent(server, 'agent-a', 'blue');
  const peer = seatAgent(server, 'agent-b', 'blue');

  server.handleMessage(
    sender,
    {
      type: 'MESSAGE_SEND',
      source: 'agent-a',
      channel: 'blue',
      payload: {
        to: 'broadcast',
        content: 'explicit broadcast',
        metadata: { isSystemMessage: true },
      },
    },
    'agent-a'
  );

  assert.equal(channelMessages(peer).length, 1);
  assert.equal(channelMessages(peer)[0].payload.content, 'explicit broadcast');
});

test('a channel post does not leak to agents in other channels', () => {
  const server = bareServer();
  server.createDefaultChannels();

  const sender = seatAgent(server, 'agent-a', 'green');
  const outsider = seatAgent(server, 'agent-c', 'purple');

  server.handleMessage(
    sender,
    {
      type: 'MESSAGE_SEND',
      source: 'agent-a',
      channel: 'green',
      payload: { content: 'green only', metadata: { isSystemMessage: true } },
    },
    'agent-a'
  );

  assert.equal(channelMessages(outsider).length, 0);
});

test('a direct message goes to the named agent only', () => {
  const server = bareServer();
  server.createDefaultChannels();

  const sender = seatAgent(server, 'agent-a', 'green');
  const target = seatAgent(server, 'agent-b', 'green');
  const bystander = seatAgent(server, 'agent-c', 'green');

  server.handleMessage(
    sender,
    {
      type: 'MESSAGE_SEND',
      source: 'agent-a',
      channel: 'green',
      payload: {
        to: 'agent-b',
        content: 'just for you',
        metadata: { isSystemMessage: true },
      },
    },
    'agent-a'
  );

  const direct = target.sent.filter((m) => m.type === 'MESSAGE_RECEIVE');
  assert.equal(direct.length, 1);
  assert.equal(direct[0].payload.content, 'just for you');
  assert.equal(bystander.sent.filter((m) => m.type === 'MESSAGE_RECEIVE').length, 0);
  assert.equal(channelMessages(bystander).length, 0);
});

test('a channel addressed by display name delivers to the canonical room', () => {
  const server = bareServer();
  server.createDefaultChannels();

  const sender = seatAgent(server, 'agent-a', 'green');
  const peer = seatAgent(server, 'agent-b', 'green');

  server.handleMessage(
    sender,
    {
      type: 'MESSAGE_SEND',
      source: 'agent-a',
      channel: 'Green',
      payload: { content: 'by display name', metadata: { isSystemMessage: true } },
    },
    'agent-a'
  );

  assert.equal(channelMessages(peer).length, 1);
  assert.equal(server.channels.size, 7);
});
