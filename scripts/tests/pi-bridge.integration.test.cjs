#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.PI_ENABLE_HANDOFF = 'true';
process.env.PI_ENABLE_MODEL_WATCHDOG = 'true';

const { HandoffPacket, HandoffPacketInput } = require('../../packages/relay-core/src/protocol/handoff-protocol.js');
const {
  PiRedisAgent,
  detectProviderFailures,
} = require('../pi-redis-wrapper.cjs');
const { buildHandoffInput } = require('../pi-session-handoff.cjs');

function createMessage(overrides = {}) {
  return {
    id: 'd6feef17-6eb4-4ba9-82e7-87cb230cad0f',
    content:
      'Apply a minimal update and return a short status report for downstream orchestration.',
    conversationId: 'convo_pi_gate_1',
    from: {
      agentId: 'agent_orchestrator_1',
      agentName: 'orchestrator',
    },
    metadata: {
      sessionKey: 'tnf-pi-gate-session-1',
      workflowId: 'wf-pi-gate-1',
      channelId: 'channel-pi-gate-1',
      provider: 'google',
      model: 'gemini-2.5-flash',
      continueSession: false,
      skills: '',
      piArgs: '',
    },
    ...overrides,
  };
}

function createHarness() {
  const sent = [];
  const redisOps = [];

  return {
    sent,
    redisOps,
    client: {
      agentInfo: {
        id: 'agent_pi_test',
      },
      publisher: {
        async set(...args) {
          redisOps.push({ op: 'set', args });
          return 'OK';
        },
        async rpush(...args) {
          redisOps.push({ op: 'rpush', args });
          return 1;
        },
      },
      async send(content, options = {}) {
        sent.push({ content, options });
        return { id: `sent_${sent.length}` };
      },
      async cleanup() {},
    },
  };
}

test('detectProviderFailures classifies missing key auth failures', () => {
  const failures = detectProviderFailures(
    'No API key found for google.\nTry /login for provider auth.',
    'google',
    'gemini-2.5-flash'
  );

  assert.equal(failures.length, 1);
  assert.equal(failures[0].category, 'auth');
  assert.equal(failures[0].provider, 'google');
});

test('processMessage emits response envelope, model-watchdog status, and schema-valid handoff packet', async () => {
  const harness = createHarness();
  const agent = new PiRedisAgent();
  agent.client = harness.client;
  agent.validationMode = 'warn';

  agent.runValidation = async (phase) => ({
    phase,
    ok: true,
    exitCode: 0,
    durationMs: 1,
    stdout: '',
    stderr: '',
    command: ['node', 'mock-validator'],
  });

  agent.pi = {
    async prompt() {
      return {
        ok: false,
        exitCode: 1,
        durationMs: 50,
        timedOut: false,
        command: ['pi', '-p', 'mock prompt'],
        response: 'No API key found for google.',
        providerFailures: [
          {
            category: 'auth',
            message: 'No API key found for google.',
            provider: 'google',
            model: 'gemini-2.5-flash',
          },
        ],
      };
    },
  };

  const message = createMessage();
  await agent.processMessage(message, 'message');

  const watchdogSend = harness.sent.find(
    (entry) => entry.options?.type === 'status' && entry.options?.metadata?.event === 'pi_provider_failure'
  );
  assert.ok(watchdogSend, 'expected model-watchdog status publish');
  assert.equal(watchdogSend.options.channel, 'tnf:model-watchdog:signals');
  assert.equal(
    watchdogSend.options.metadata.signal.category,
    'auth',
    'expected auth provider failure signal'
  );

  const responseSend = harness.sent.find((entry) => entry.options?.type === 'response');
  assert.ok(responseSend, 'expected downstream response envelope');
  assert.equal(responseSend.options.replyTo, message.id);
  assert.equal(responseSend.options.metadata.bridge, 'pi-redis-wrapper');
  assert.equal(responseSend.options.metadata.messageType, 'message');
  assert.equal(responseSend.options.metadata.providerFailures[0].category, 'auth');
  assert.ok(
    Array.isArray(responseSend.options.metadata.modelWatchdogSignals) &&
      responseSend.options.metadata.modelWatchdogSignals.length === 1
  );

  const packetSetOp = harness.redisOps.find(
    (op) => op.op === 'set' && typeof op.args?.[0] === 'string' && op.args[0].includes(':packet:')
  );
  assert.ok(packetSetOp, 'expected handoff packet write');
  const storedPacket = JSON.parse(packetSetOp.args[1]);

  assert.equal(storedPacket.spec, 'tnf/handoff-packet/1.1');
  assert.equal(storedPacket.scope.sessionKey, message.metadata.sessionKey);
  assert.ok(Array.isArray(storedPacket.gateDecisions));
  assert.ok(storedPacket.gateDecisions.length >= 5);
  assert.equal(responseSend.options.metadata.handoffPacketId, storedPacket.id);

  HandoffPacket.parse(storedPacket);
});

test('validation pipeline blocks execution when pre-validation fails in enforce mode', async () => {
  const harness = createHarness();
  const agent = new PiRedisAgent();
  agent.client = harness.client;
  agent.validationMode = 'enforce';

  let promptCalls = 0;
  agent.pi = {
    async prompt() {
      promptCalls += 1;
      return {
        ok: true,
        exitCode: 0,
        durationMs: 1,
        timedOut: false,
        command: ['pi', '-p', 'mock'],
        response: 'ok',
        providerFailures: [],
      };
    },
  };

  agent.runValidation = async (phase) => {
    if (phase === 'pre') {
      return {
        phase: 'pre',
        ok: false,
        exitCode: 1,
        durationMs: 2,
        stdout: '',
        stderr: 'pre validation failed',
        command: ['node', 'mock-pre-validator'],
      };
    }
    throw new Error('post validation should not run when pre-validation is blocked');
  };

  const message = createMessage({ id: '8cf3f47a-97bd-4196-b01e-cd7579bf3dcf' });
  await agent.processMessage(message, 'task');

  assert.equal(promptCalls, 0, 'pi.prompt should not execute when pre-validation blocks');
  assert.equal(harness.sent.length, 1, 'only blocked response should be emitted');
  assert.equal(harness.sent[0].options.type, 'response');
  assert.equal(harness.sent[0].options.metadata.blocked, true);
  assert.match(harness.sent[0].content, /Pre-implementation validator failed/i);
});

test('validation pipeline appends post-validation warning in enforce mode', async () => {
  const harness = createHarness();
  const agent = new PiRedisAgent();
  agent.client = harness.client;
  agent.validationMode = 'enforce';

  agent.runValidation = async (phase) => ({
    phase,
    ok: phase === 'pre',
    exitCode: phase === 'pre' ? 0 : 1,
    durationMs: 3,
    stdout: '',
    stderr: phase === 'pre' ? '' : 'post validation failed',
    command: ['node', `mock-${phase}-validator`],
  });

  agent.pi = {
    async prompt() {
      return {
        ok: true,
        exitCode: 0,
        durationMs: 20,
        timedOut: false,
        command: ['pi', '-p', 'mock'],
        response: 'Pi completed requested changes.',
        providerFailures: [],
      };
    },
  };

  const message = createMessage({ id: '10e066a3-b009-48b8-ab5b-c9d4dd7e6938' });
  await agent.processMessage(message, 'command');

  const responseSend = harness.sent.find((entry) => entry.options?.type === 'response');
  assert.ok(responseSend);
  assert.match(
    responseSend.content,
    /\[Pi validation\] Post-implementation validator failed in enforce mode\./
  );
  assert.equal(responseSend.options.metadata.validation.post.ok, false);
});

test('pi-session-handoff builder produces schema-valid HandoffPacketInput payload', () => {
  const input = buildHandoffInput({
    fromAgentId: 'pi-coding-agent',
    targetAgentIds: ['agent_orchestrator_123'],
    tenantId: 'tnf-prod',
    sessionKey: 'tnf-session-123',
    summary: 'Pi execution completed and context exported for orchestration continuity.',
    prompt: 'Implement protocol bridge and report results for downstream continuation.',
    nextActions: ['Inspect output', 'Resume workflow'],
    acceptanceCriteria: ['Downstream agent can continue with full context'],
    artifacts: ['artifact-1'],
    route: ['pi', 'handoff-service', 'director'],
  });

  const parsed = HandoffPacketInput.parse(input);
  assert.equal(parsed.scope.tenantId, 'tnf-prod');
  assert.equal(parsed.targets.agentIds[0], 'agent_orchestrator_123');
  assert.ok(parsed.gateDecisions.length >= 5);
});
