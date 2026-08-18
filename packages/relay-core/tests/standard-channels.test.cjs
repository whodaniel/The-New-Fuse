const test = require('node:test');
const assert = require('node:assert/strict');

const TNFRelayServer = require('../dist/standalone-relay.js').default;

/**
 * These cover the two regressions that made federated channels disappear:
 *   - only 'general' was seeded, so a relay restart wiped the standard set;
 *   - CHANNEL_CREATE minted `channel-${Date.now()}` ids, so a channel's id
 *     changed every time it was recreated.
 */

function bareServer() {
  // Avoid the constructor (it opens sockets and Redis); exercise the channel
  // logic against a plain instance with just the state it touches.
  const server = Object.create(TNFRelayServer.prototype);
  server.channels = new Map();
  return server;
}

test('relay seeds the full standard federated channel set', () => {
  const server = bareServer();
  server.createDefaultChannels();

  const ids = [...server.channels.keys()].sort();
  assert.deepEqual(ids, [
    'blue',
    'fuse-activity-log',
    'general',
    'green',
    'purple',
    'red',
    'yellow',
  ]);

  const general = server.channels.get('general');
  assert.equal(general.name, 'General');
  assert.equal(general.createdBy, 'system');
  assert.equal(general.isPrivate, false);
  assert.ok(Array.isArray(general.members));
});

test('seeding twice does not duplicate or clobber existing channels', () => {
  const server = bareServer();
  server.createDefaultChannels();
  server.channels.get('green').members.push('agent-1');

  server.createDefaultChannels();

  assert.equal(server.channels.size, 7);
  assert.deepEqual(server.channels.get('green').members, ['agent-1']);
});

test('channel ids are stable slugs derived from the name', () => {
  const server = bareServer();
  assert.equal(server.allocateChannelId('Release Planning'), 'release-planning');
  assert.equal(server.allocateChannelId('  Mixed   CASE  '), 'mixed-case');
  assert.equal(server.allocateChannelId('deploy/prod #1'), 'deploy-prod-1');
});

test('slug collisions get a numeric suffix rather than overwriting', () => {
  const server = bareServer();
  server.createDefaultChannels();

  // 'General' already exists as 'general'
  assert.equal(server.allocateChannelId('General'), 'general-2');

  server.channels.set('general-2', { id: 'general-2' });
  assert.equal(server.allocateChannelId('General'), 'general-3');
});

test('names that slugify to nothing still produce a usable id', () => {
  const server = bareServer();
  const id = server.allocateChannelId('!!!');
  assert.match(id, /^channel-\d+$/);
});

function seededServer() {
  const server = bareServer();
  server.createDefaultChannels();
  server.agentChannels = new Map();
  server.agents = new Map();
  server.broadcast = () => {};
  return server;
}

test('channel references resolve case-insensitively by id and by name', () => {
  const server = seededServer();

  assert.equal(server.resolveChannel('green').id, 'green');
  assert.equal(server.resolveChannel('Green').id, 'green');
  assert.equal(server.resolveChannel('GREEN').id, 'green');
  assert.equal(server.resolveChannel('  Green  ').id, 'green');
  assert.equal(server.resolveChannel('Fuse Activity Log').id, 'fuse-activity-log');
  assert.equal(server.resolveChannel('nope'), null);
});

test('ensureChannelExists does not duplicate a seeded channel by display name', () => {
  const server = seededServer();

  // master-clock registers agents against CONFIG.CHANNELS display names.
  for (const name of ['Green', 'Blue', 'Red', 'Yellow', 'Purple', 'General']) {
    const ch = server.ensureChannelExists(name);
    assert.equal(ch.id, name.toLowerCase(), `${name} should map onto the seeded channel`);
  }

  assert.equal(server.channels.size, 7, 'no duplicate channels should be created');
});

test('agents addressing a channel by name join the same canonical channel', () => {
  const server = seededServer();

  server.agents.set('a1', { id: 'a1', channels: [] });
  server.agents.set('a2', { id: 'a2', channels: [] });

  server.syncAgentChannelMembership('a1', 'Green');
  server.syncAgentChannelMembership('a2', 'green');

  const green = server.channels.get('green');
  assert.deepEqual(green.members.sort(), ['a1', 'a2']);
  assert.equal(server.channels.size, 7);
  assert.deepEqual(server.agents.get('a1').channels, ['green']);
  assert.deepEqual(server.agents.get('a2').channels, ['green']);
});

test('a genuinely new channel is still auto-created, with a slug id', () => {
  const server = seededServer();
  const ch = server.ensureChannelExists('Release Planning');

  assert.equal(ch.id, 'release-planning');
  assert.equal(ch.name, 'Release Planning');
  assert.equal(server.channels.size, 8);

  // ...and referencing it again by either form resolves to the same channel.
  assert.equal(server.ensureChannelExists('release-planning').id, 'release-planning');
  assert.equal(server.ensureChannelExists('Release Planning').id, 'release-planning');
  assert.equal(server.channels.size, 8);
});
