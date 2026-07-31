#!/usr/bin/env node
/**
 * Unit tests for the thin redis-agent-client → full-client shim.
 * Avoids live Redis: stubs the full client before requiring the shim.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const SHIM_PATH = path.join(__dirname, 'redis-agent-client.cjs');
const FULL_PATH = path.join(__dirname, '..', 'tnf-agent-cli.cjs');

function withStubbedFullClient(run) {
  const originalLoad = Module._load;
  const published = [];
  const subscribed = [];
  const typeHandlers = new Map();

  class StubFullClient {
    constructor() {
      this.agentInfo = null;
      this.publisher = {
        publish: async (channel, message) => {
          published.push({ channel, message });
          return 1;
        },
        quit: async () => {},
      };
      this.subscriber = {
        subscribe: async (channel) => {
          subscribed.push(channel);
        },
        quit: async () => {},
      };
      this.messageHandlers = typeHandlers;
    }

    async initialize() {}

    async register(name, role, platform) {
      this.agentInfo = {
        id: `agent_${name}_test`,
        name,
        role,
        platform,
      };
    }

    signMessage(data, type, channel) {
      return {
        header: { agent_id: this.agentInfo.id, alg: 'HS256', kid: 'test' },
        payload: { type, channel, data },
        signature: 'stub-sig',
      };
    }

    onMessage(type, handler) {
      if (!typeHandlers.has(type)) typeHandlers.set(type, []);
      typeHandlers.get(type).push(handler);
    }

    async cleanup() {}

    /** Test helper: simulate inbound dispatch after auth (mirrors dispatchToHandlers). */
    _emit(type, message, channel) {
      const seen = new Set();
      for (const h of typeHandlers.get(type) || []) {
        seen.add(h);
        h(message, channel);
      }
      if (type !== '*') {
        for (const h of typeHandlers.get('*') || []) {
          if (seen.has(h)) continue;
          h(message, channel);
        }
      }
    }
  }

  Module._load = function patched(request, parent, isMain) {
    const resolved =
      request.startsWith('.') && parent?.filename
        ? path.resolve(path.dirname(parent.filename), request)
        : request;
    if (resolved === FULL_PATH || request === FULL_PATH || request.endsWith('tnf-agent-cli.cjs')) {
      return { RedisAgentClient: StubFullClient, CONFIG: {} };
    }
    return originalLoad(request, parent, isMain);
  };

  delete require.cache[SHIM_PATH];
  delete require.cache[FULL_PATH];

  try {
    const mod = require(SHIM_PATH);
    return run({ RedisAgentClient: mod.RedisAgentClient, published, subscribed, StubFullClient });
  } finally {
    Module._load = originalLoad;
    delete require.cache[SHIM_PATH];
  }
}

test('initialize registers and wraps publisher to sign A2A envelopes', async () => {
  await withStubbedFullClient(async ({ RedisAgentClient, published }) => {
    const client = new RedisAgentClient();
    await client.initialize();
    assert.ok(client.agentInfo?.id);

    const envelope = {
      id: 'e1',
      type: 'event',
      from: { agentId: 'Local-Director', role: 'orchestrator' },
      to: { broadcast: true },
      payload: { eventType: 'wake_ping', data: { pingId: 'p1' } },
    };

    await client.publisher.publish('tnf:bus:ingress', JSON.stringify(envelope));
    assert.equal(published.length, 1);
    const wire = JSON.parse(published[0].message);
    assert.equal(wire.signature, 'stub-sig');
    assert.equal(wire.payload.data.type, 'event');
    assert.equal(wire.payload.data.payload.eventType, 'wake_ping');
  });
});

test('non-envelope activity payloads are not force-signed', async () => {
  await withStubbedFullClient(async ({ RedisAgentClient, published }) => {
    const client = new RedisAgentClient();
    await client.initialize();
    const activity = { agentId: 'a1', activityType: 'prompt_injected', timestamp: 't' };
    await client.publisher.publish('agent:activity', JSON.stringify(activity));
    assert.equal(published.length, 1);
    const wire = JSON.parse(published[0].message);
    assert.equal(wire.signature, undefined);
    assert.equal(wire.agentId, 'a1');
  });
});

test('onMessage fans out by Redis channel via catch-all type handler', async () => {
  await withStubbedFullClient(async ({ RedisAgentClient, subscribed }) => {
    const client = new RedisAgentClient();
    await client.initialize();
    const seen = [];
    client.onMessage('tnf:bus:ingress', (msg) => seen.push(msg));
    // Allow async subscribe to schedule.
    await new Promise((r) => setImmediate(r));
    assert.ok(subscribed.includes('tnf:bus:ingress'));

    client._full._emit(
      '*',
      { type: 'event', payload: { eventType: 'wake_ping' } },
      'tnf:bus:ingress'
    );
    assert.equal(seen.length, 1);
    assert.equal(seen[0].payload.eventType, 'wake_ping');
  });
});
