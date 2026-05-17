#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ModelWatchdogFailoverConsumer,
  parseWatchdogSignal,
} = require('../model-watchdog-failover-consumer.cjs');

function createSignalMessage(overrides = {}) {
  return {
    id: 'msg-1',
    type: 'status',
    content: 'pi-provider-failure:rate_limit',
    metadata: {
      event: 'pi_provider_failure',
      signal: {
        spec: 'tnf/model-watchdog/0.1',
        sourceAgent: 'pi',
        provider: 'google',
        model: 'gemini-2.5-flash',
        category: 'rate_limit',
        message: '429 rate limit',
        conversationId: 'convo-1',
        upstreamAgentId: 'agent-upstream-1',
        upstreamAgentName: 'orchestrator',
        replyToMessageId: 'task-1',
        sessionKey: 'tnf-pi-session-1',
        timestamp: '2026-05-17T12:00:00.000Z',
      },
    },
    ...overrides,
  };
}

function createHarness() {
  const kv = new Map();
  const published = [];
  const sent = [];

  const client = {
    agentInfo: {
      id: 'agent_model_watchdog_test',
      name: 'model-watchdog-test',
    },
    publisher: {
      async get(key) {
        return kv.has(key) ? kv.get(key) : null;
      },
      async set(key, value) {
        kv.set(key, value);
        return 'OK';
      },
      async publish(channel, payload) {
        published.push({ channel, payload: JSON.parse(payload) });
        return 1;
      },
    },
    async send(content, options = {}) {
      sent.push({ content, options });
      return { id: `sent-${sent.length}` };
    },
    async cleanup() {},
  };

  return {
    client,
    kv,
    sent,
    published,
  };
}

test('parseWatchdogSignal accepts valid Pi provider failure signal', () => {
  const parsed = parseWatchdogSignal(createSignalMessage());
  assert.ok(parsed);
  assert.equal(parsed.provider, 'google');
  assert.equal(parsed.model, 'gemini-2.5-flash');
  assert.equal(parsed.category, 'rate_limit');
});

test('consumer escalates once threshold is reached and publishes coordination events', async () => {
  const harness = createHarness();
  const startMs = Date.parse('2026-05-17T12:00:10.000Z');
  let nowMs = startMs;

  const consumer = new ModelWatchdogFailoverConsumer({
    client: harness.client,
    now: () => new Date(nowMs),
    logger: {
      log() {},
      warn() {},
    },
    config: {
      modelWatchdogChannel: 'tnf:model-watchdog:signals',
      orchestratorChannel: 'tnf:orchestrator',
      brokerChannel: 'tnf:broker',
      brokerDecisionChannel: 'tnf:broker:decisions',
      failureWindowMs: 10 * 60 * 1000,
      escalationCooldownMs: 5 * 60 * 1000,
      defaultFailoverThreshold: 2,
      authFailoverThreshold: 1,
      creditsFailoverThreshold: 1,
      providerChain: ['google', 'anthropic', 'openai'],
      statePrefix: 'tnf:model-watchdog:test',
      publishDecisionChannel: true,
      dryRun: false,
      stateTtlSeconds: 60,
    },
  });

  const signal = createSignalMessage();

  const first = await consumer.handleStatusMessage(signal, 'tnf:model-watchdog:signals');
  assert.equal(first.escalated, false);
  assert.equal(harness.sent.length, 0);
  assert.equal(harness.published.length, 0);

  nowMs += 15 * 1000;
  const second = await consumer.handleStatusMessage(signal, 'tnf:model-watchdog:signals');
  assert.equal(second.escalated, true);

  assert.equal(harness.sent.length, 2, 'orchestrator + broker messages expected');
  assert.equal(harness.sent[0].options.channel, 'tnf:orchestrator');
  assert.equal(harness.sent[0].options.type, 'command');
  assert.equal(harness.sent[1].options.channel, 'tnf:broker');
  assert.equal(harness.sent[1].options.type, 'status');

  assert.equal(harness.published.length, 1, 'decision channel publish expected');
  assert.equal(harness.published[0].channel, 'tnf:broker:decisions');
  assert.equal(harness.published[0].payload.decisionType, 'model_failover');
  assert.equal(
    harness.sent[0].options.metadata.recommendation.fallbackProvider,
    'anthropic'
  );
});

test('consumer enforces escalation cooldown to avoid duplicate failover storms', async () => {
  const harness = createHarness();
  let nowMs = Date.parse('2026-05-17T12:30:00.000Z');

  const consumer = new ModelWatchdogFailoverConsumer({
    client: harness.client,
    now: () => new Date(nowMs),
    logger: {
      log() {},
      warn() {},
    },
    config: {
      modelWatchdogChannel: 'tnf:model-watchdog:signals',
      failureWindowMs: 10 * 60 * 1000,
      escalationCooldownMs: 10 * 60 * 1000,
      defaultFailoverThreshold: 2,
      authFailoverThreshold: 1,
      creditsFailoverThreshold: 1,
      providerChain: ['google', 'anthropic'],
      statePrefix: 'tnf:model-watchdog:test-cooldown',
      publishDecisionChannel: true,
      stateTtlSeconds: 60,
    },
  });

  const makeSignal = (timestamp) =>
    createSignalMessage({
      metadata: {
        event: 'pi_provider_failure',
        signal: {
          ...createSignalMessage().metadata.signal,
          timestamp,
        },
      },
    });

  await consumer.handleStatusMessage(
    makeSignal('2026-05-17T12:30:00.000Z'),
    'tnf:model-watchdog:signals'
  );
  nowMs += 1000;
  await consumer.handleStatusMessage(
    makeSignal('2026-05-17T12:30:01.000Z'),
    'tnf:model-watchdog:signals'
  );
  assert.equal(harness.sent.length, 2, 'first escalation should emit two sends');

  nowMs += 2000;
  const third = await consumer.handleStatusMessage(
    makeSignal('2026-05-17T12:30:03.000Z'),
    'tnf:model-watchdog:signals'
  );
  assert.equal(third.escalated, false, 'cooldown should block immediate repeat escalation');
  assert.equal(harness.sent.length, 2, 'no additional sends while in cooldown');
});

test('auth category escalates immediately with auth threshold=1', async () => {
  const harness = createHarness();
  const nowMs = Date.parse('2026-05-17T13:00:00.000Z');

  const consumer = new ModelWatchdogFailoverConsumer({
    client: harness.client,
    now: () => new Date(nowMs),
    logger: {
      log() {},
      warn() {},
    },
    config: {
      modelWatchdogChannel: 'tnf:model-watchdog:signals',
      failureWindowMs: 10 * 60 * 1000,
      escalationCooldownMs: 5 * 60 * 1000,
      defaultFailoverThreshold: 3,
      authFailoverThreshold: 1,
      creditsFailoverThreshold: 1,
      providerChain: ['google', 'anthropic'],
      statePrefix: 'tnf:model-watchdog:test-auth',
      stateTtlSeconds: 60,
    },
  });

  const signal = createSignalMessage({
    metadata: {
      event: 'pi_provider_failure',
      signal: {
        spec: 'tnf/model-watchdog/0.1',
        sourceAgent: 'pi',
        provider: 'google',
        model: 'gemini-2.5-flash',
        category: 'auth',
        message: 'No API key found',
        timestamp: '2026-05-17T13:00:00.000Z',
      },
    },
  });

  const result = await consumer.handleStatusMessage(signal, 'tnf:model-watchdog:signals');
  assert.equal(result.escalated, true);
  assert.equal(harness.sent.length, 2);
});
