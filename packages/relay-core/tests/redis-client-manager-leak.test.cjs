/**
 * RedisClientManager connection-leak regression tests.
 *
 * Origin: 2026-08-16 Turn Zero. MasterClock.start() re-enters through
 * scheduleReconnect() every 5s after any startup failure. connectRedis()
 * overwrote this.redis / this.redisSub with a fresh pair on every pass without
 * releasing the previous pair, so each re-entry leaked two established sockets.
 * 810 of them accumulated and wedged Redis past its file-descriptor ceiling,
 * taking down the coordination bus for the whole local fleet.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { RedisClientManager } = require('../dist/services/redis-client-manager.service.js');

function createFakeClient(name, { quitRejects = false } = {}) {
  return {
    name,
    quitCalls: 0,
    disconnectCalls: 0,
    listeners: [],
    on(event, handler) {
      this.listeners.push([event, handler]);
      return this;
    },
    async quit() {
      this.quitCalls += 1;
      if (quitRejects) {
        throw new Error(`Connection is closed (${name})`);
      }
      return 'OK';
    },
    disconnect() {
      this.disconnectCalls += 1;
    },
    async subscribe() {
      return 1;
    },
  };
}

function createManager(config = {}) {
  return new RedisClientManager(
    { REDIS_URL: undefined, REDIS_KEYS: { INGRESS: 'tnf:bus:ingress' }, ...config },
    () => {},
    () => {},
    async () => {}
  );
}

test('quit() releases the subscriber even when the primary client rejects', async () => {
  const manager = createManager();
  const primary = createFakeClient('primary', { quitRejects: true });
  const subscriber = createFakeClient('subscriber');
  manager.redis = primary;
  manager.redisSub = subscriber;

  await manager.quit();

  // The original bug: a rejected primary quit() aborted the whole teardown,
  // leaving the subscriber attached and its socket open.
  assert.equal(subscriber.quitCalls, 1, 'subscriber must still be closed');
  assert.equal(primary.disconnectCalls, 1, 'primary must fall back to disconnect()');
  assert.equal(manager.redis, null, 'primary reference must be dropped');
  assert.equal(manager.redisSub, null, 'subscriber reference must be dropped');
});

test('quit() drops references even when both clients reject', async () => {
  const manager = createManager();
  manager.redis = createFakeClient('primary', { quitRejects: true });
  manager.redisSub = createFakeClient('subscriber', { quitRejects: true });

  await manager.quit();

  assert.equal(manager.redis, null);
  assert.equal(manager.redisSub, null);
});

test('releaseStaleClients() closes an orphaned pair', async () => {
  const manager = createManager();
  const stale = createFakeClient('stale-primary');
  const staleSub = createFakeClient('stale-subscriber');
  manager.redis = stale;
  manager.redisSub = staleSub;

  await manager.releaseStaleClients();

  assert.equal(stale.quitCalls, 1, 'stale primary must be closed, not orphaned');
  assert.equal(staleSub.quitCalls, 1, 'stale subscriber must be closed, not orphaned');
  assert.equal(manager.redis, null);
  assert.equal(manager.redisSub, null);
});

test('releaseStaleClients() is a no-op on a fresh manager', async () => {
  const manager = createManager();

  await manager.releaseStaleClients();

  assert.equal(manager.redis, null);
  assert.equal(manager.redisSub, null);
});

test('connectRedis() releases stale clients before creating new ones', async () => {
  // Pin the ordering contract without paying for a real connect attempt: the
  // spy throws a sentinel, so if creation were reached first the sentinel would
  // never surface and this assertion would fail.
  const manager = createManager({ REDIS_URL: 'redis://127.0.0.1:6379' });
  const stale = createFakeClient('stale-primary');
  manager.redis = stale;

  const sentinel = new Error('released-before-create');
  manager.releaseStaleClients = async function spy() {
    await RedisClientManager.prototype.releaseStaleClients.call(this);
    throw sentinel;
  };

  await assert.rejects(() => manager.connectRedis(), (err) => err === sentinel);

  assert.equal(stale.quitCalls, 1, 'stale client must be closed before any new client is created');
  assert.equal(manager.redis, null, 'no new client may be attached once release has run');
});

test('connectRedis() is a no-op when REDIS_URL is unset', async () => {
  const manager = createManager();

  await manager.connectRedis();

  assert.equal(manager.redis, null);
  assert.equal(manager.redisSub, null);
});
