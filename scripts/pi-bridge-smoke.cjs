#!/usr/bin/env node
/* eslint-disable no-console */

const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');

const Redis = require('ioredis');

const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    json: false,
    timeoutMs: Number(process.env.PI_BRIDGE_SMOKE_TIMEOUT_MS || '90000'),
    useRealPi: process.env.PI_BRIDGE_SMOKE_USE_REAL_PI === '1',
    failureCategory: process.env.PI_BRIDGE_SMOKE_FAILURE_CATEGORY || 'rate_limit',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') args.json = true;
    else if (token === '--timeout-ms') args.timeoutMs = Number(argv[++i] || args.timeoutMs);
    else if (token === '--use-real-pi') args.useRealPi = true;
    else if (token === '--failure-category') args.failureCategory = String(argv[++i] || '').trim();
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 5000) {
    throw new Error(`Invalid --timeout-ms value: ${args.timeoutMs}`);
  }

  const allowedFailureCategories = new Set(['rate_limit', 'auth', 'timeout', 'availability']);
  if (!allowedFailureCategories.has(args.failureCategory)) {
    throw new Error(
      `Invalid --failure-category value: ${args.failureCategory}. ` +
        `Expected one of: ${Array.from(allowedFailureCategories).join(', ')}`
    );
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitFor(predicate, options = {}) {
  const timeoutMs = options.timeoutMs || 30000;
  const intervalMs = options.intervalMs || 250;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await sleep(intervalMs);
  }

  throw new Error(options.onTimeoutMessage || `Timed out after ${timeoutMs}ms`);
}

async function createMockPiCli(tmpDir) {
  const mockPath = path.join(tmpDir, 'mock-pi-cli.cjs');
  const content = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.includes('--version')) {
  console.log('pi-mock 0.0.1');
  process.exit(0);
}
const providerIndex = args.indexOf('--provider');
const modelIndex = args.indexOf('--model');
const sessionIndex = args.indexOf('--session');
const provider = providerIndex >= 0 ? args[providerIndex + 1] : '';
const model = modelIndex >= 0 ? args[modelIndex + 1] : '';
const session = sessionIndex >= 0 ? args[sessionIndex + 1] : '';
const prompt = args[args.length - 1] || '';
if (prompt.includes('[emit-rate-limit]')) {
  console.error('429 rate limit (simulated by pi smoke mock)');
}
if (prompt.includes('[emit-auth]')) {
  console.error('401 unauthorized (simulated by pi smoke mock)');
}
if (prompt.includes('[emit-timeout]')) {
  console.error('timeout while contacting provider (simulated by pi smoke mock)');
}
if (prompt.includes('[emit-availability]')) {
  console.error('503 service unavailable (simulated by pi smoke mock)');
}
console.log(JSON.stringify({
  ok: true,
  marker: 'PI_MOCK_OK',
  provider,
  model,
  session,
  prompt
}));
process.exit(0);
`;
  await fsp.writeFile(mockPath, content, 'utf8');
  await fsp.chmod(mockPath, 0o755);
  return mockPath;
}

async function createValidatorScript(tmpDir, phase) {
  const scriptPath = path.join(tmpDir, `${phase}-validator.cjs`);
  const marker = phase === 'pre' ? 'PI_PRE_VALIDATION_OK' : 'PI_POST_VALIDATION_OK';
  const content = `#!/usr/bin/env node
const phase = process.env.TNF_PI_VALIDATION_PHASE || 'unknown';
console.log('${marker}');
console.log('phase=' + phase);
process.exit(0);
`;
  await fsp.writeFile(scriptPath, content, 'utf8');
  await fsp.chmod(scriptPath, 0o755);
  return scriptPath;
}

function createRedisClient() {
  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
  });
}

async function findRegisteredAgent(redis, agentName) {
  const registry = await redis.hgetall('tnf:agent-registry');
  for (const [id, jsonValue] of Object.entries(registry)) {
    try {
      const parsed = JSON.parse(jsonValue);
      if (parsed && parsed.name === agentName) {
        return { id, info: parsed };
      }
    } catch {
      // Ignore invalid records.
    }
  }
  return null;
}

async function stopChild(child, timeoutMs = 5000) {
  if (!child || child.exitCode !== null || child.killed) return;

  child.kill('SIGINT');
  const waitPromise = new Promise((resolve) => {
    child.once('exit', () => resolve());
  });
  const timer = setTimeout(() => {
    if (child.exitCode === null && !child.killed) child.kill('SIGTERM');
  }, timeoutMs);

  await Promise.race([waitPromise, sleep(timeoutMs + 500)]);
  clearTimeout(timer);

  if (child.exitCode === null && !child.killed) {
    child.kill('SIGKILL');
    await sleep(100);
  }
}

async function deleteKeysByPattern(redis, pattern) {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    if (Array.isArray(keys) && keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== '0');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();
  const failurePromptByCategory = {
    rate_limit: 'pi bridge smoke task [emit-rate-limit]',
    auth: 'pi bridge smoke task [emit-auth]',
    timeout: 'pi bridge smoke task [emit-timeout]',
    availability: 'pi bridge smoke task [emit-availability]',
  };

  const summary = {
    ok: false,
    runId,
    timeoutMs: args.timeoutMs,
    useRealPi: args.useRealPi,
    failureCategory: args.failureCategory,
    durationMs: 0,
    assertions: [],
    handoffPacketId: null,
    responseMessageId: null,
    watchdogSignals: 0,
    wrapperAgentId: null,
    errors: [],
  };

  let tempDir = null;
  let wrapperProcess = null;
  let handoffPrefixForCleanup = null;
  const redisPub = createRedisClient();
  const redisSub = createRedisClient();
  let wrapperStdout = '';
  let wrapperStderr = '';

  try {
    await redisPub.ping();
    await redisSub.ping();
    summary.assertions.push('redis_ping_ok');

    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), `tnf-pi-bridge-smoke-${runId}-`));

    const mockPiPath = args.useRealPi ? null : await createMockPiCli(tempDir);
    const preValidatorPath = await createValidatorScript(tempDir, 'pre');
    const postValidatorPath = await createValidatorScript(tempDir, 'post');

    const agentName = `pi-smoke-${runId}`;
    const modelWatchdogChannel = `tnf:model-watchdog:signals:smoke:${runId}`;
    const handoffPrefix = `tnf:handoff:smoke:${runId}`;
    handoffPrefixForCleanup = handoffPrefix;
    const sessionKey = `tnf-smoke-${runId}`;
    const taskId = `task-${runId}`;
    const senderAgentId = `agent-smoke-sender-${runId}`;
    const conversationId = `convo-${runId}`;

    wrapperProcess = spawn('node', ['scripts/pi-redis-wrapper.cjs'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        AGENT_NAME: agentName,
        AGENT_ROLE: 'worker',
        PI_CMD: args.useRealPi ? (process.env.PI_CMD || 'pi') : mockPiPath,
        PI_PROVIDER: 'google',
        PI_MODEL: 'gemini-2.5-flash',
        PI_VALIDATION_MODE: 'warn',
        PI_PRE_VALIDATOR: preValidatorPath,
        PI_POST_VALIDATOR: postValidatorPath,
        PI_ENABLE_HANDOFF: 'true',
        PI_ENABLE_MODEL_WATCHDOG: 'true',
        PI_MODEL_WATCHDOG_CHANNEL: modelWatchdogChannel,
        TNF_HANDOFF_KEY_PREFIX: handoffPrefix,
        TNF_TENANT_ID: 'tnf-prod',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    wrapperProcess.stdout.on('data', (chunk) => {
      wrapperStdout += String(chunk);
      if (wrapperStdout.length > 16000) wrapperStdout = wrapperStdout.slice(-16000);
    });
    wrapperProcess.stderr.on('data', (chunk) => {
      wrapperStderr += String(chunk);
      if (wrapperStderr.length > 16000) wrapperStderr = wrapperStderr.slice(-16000);
    });

    let wrapperEarlyExit = null;
    wrapperProcess.on('exit', (code, signal) => {
      wrapperEarlyExit = { code, signal };
    });

    const registeredAgent = await waitFor(
      async () => {
        if (wrapperEarlyExit) {
          throw new Error(
            `pi-redis-wrapper exited early (code=${wrapperEarlyExit.code}, signal=${wrapperEarlyExit.signal})`
          );
        }
        return findRegisteredAgent(redisPub, agentName);
      },
      {
        timeoutMs: Math.min(args.timeoutMs, 30000),
        intervalMs: 300,
        onTimeoutMessage: 'Timed out waiting for Pi wrapper registration',
      }
    );

    summary.wrapperAgentId = registeredAgent.id;
    summary.assertions.push('wrapper_registered');
    assertCondition(registeredAgent.info.platform === 'pi', 'Registered wrapper platform was not "pi"');

    const watchdogSignals = [];
    let responseMessage = null;
    let responseResolver = null;
    const responsePromise = new Promise((resolve) => {
      responseResolver = resolve;
    });

    redisSub.on('message', (channel, payload) => {
      let parsed = null;
      try {
        parsed = JSON.parse(payload);
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== 'object') return;

      if (
        channel === 'tnf:conversations' &&
        parsed.type === 'response' &&
        parsed.replyTo === taskId &&
        parsed.from &&
        parsed.from.agentId === registeredAgent.id
      ) {
        responseMessage = parsed;
        if (responseResolver) {
          const resolve = responseResolver;
          responseResolver = null;
          resolve(parsed);
        }
        return;
      }

      if (
        channel === modelWatchdogChannel &&
        parsed.type === 'status' &&
        parsed.metadata &&
        parsed.metadata.event === 'pi_provider_failure' &&
        parsed.metadata.signal
      ) {
        watchdogSignals.push(parsed.metadata.signal);
      }
    });

    await redisSub.subscribe('tnf:conversations', modelWatchdogChannel);

    const taskMessage = {
      id: taskId,
      timestamp: new Date().toISOString(),
      from: {
        agentId: senderAgentId,
        agentName: 'pi-smoke-tester',
        role: 'orchestrator',
        platform: 'vscode',
      },
      to: { role: 'worker', platform: 'pi' },
      type: 'task',
      content: failurePromptByCategory[args.failureCategory],
      conversationId,
      metadata: {
        sessionKey,
        workflowId: 'wf-smoke',
        channelId: 'chan-smoke',
        provider: 'google',
        model: 'gemini-2.5-flash',
        continueSession: false,
      },
    };

    await redisPub.publish('tnf:conversations', JSON.stringify(taskMessage));
    summary.assertions.push('task_published');

    const response = await waitFor(
      async () => responseMessage || (await Promise.race([responsePromise, sleep(0)])),
      {
        timeoutMs: Math.min(args.timeoutMs, 45000),
        intervalMs: 200,
        onTimeoutMessage: 'Timed out waiting for Pi wrapper response message',
      }
    );

    assertCondition(response && response.metadata, 'Response metadata missing from Pi wrapper');
    summary.responseMessageId = response.id || null;
    summary.assertions.push('response_received');

    const metadata = response.metadata;
    assertCondition(metadata.bridge === 'pi-redis-wrapper', 'Unexpected bridge metadata in response');
    assertCondition(metadata.sessionKey === sessionKey, 'Session key mismatch in response metadata');

    assertCondition(metadata.run && metadata.run.ok === true, 'Pi run did not report ok=true');
    assertCondition(
      Array.isArray(metadata.run.command) && metadata.run.command.length >= 2,
      'Pi run command metadata missing'
    );
    summary.assertions.push('run_metadata_ok');

    const preValidation = metadata.validation?.pre;
    const postValidation = metadata.validation?.post;
    assertCondition(preValidation && preValidation.ok === true, 'Pre-validation did not pass');
    assertCondition(postValidation && postValidation.ok === true, 'Post-validation did not pass');
    assertCondition(
      String(preValidation.stdout || '').includes('PI_PRE_VALIDATION_OK'),
      'Pre-validation marker missing'
    );
    assertCondition(
      String(postValidation.stdout || '').includes('PI_POST_VALIDATION_OK'),
      'Post-validation marker missing'
    );
    summary.assertions.push('validation_hooks_ok');

    const handoffPacketId = metadata.handoffPacketId;
    assertCondition(typeof handoffPacketId === 'string' && handoffPacketId.length > 0, 'Missing handoffPacketId');
    summary.handoffPacketId = handoffPacketId;

    const handoffRaw = await redisPub.get(`${handoffPrefix}:packet:${handoffPacketId}`);
    assertCondition(Boolean(handoffRaw), 'Handoff packet not found in Redis store');
    const handoffPacket = JSON.parse(handoffRaw);
    assertCondition(
      Array.isArray(handoffPacket.targets?.agentIds) &&
        handoffPacket.targets.agentIds.includes(senderAgentId),
      'Handoff packet target agent mismatch'
    );
    assertCondition(handoffPacket.scope?.sessionKey === sessionKey, 'Handoff packet sessionKey mismatch');
    assertCondition(
      Array.isArray(handoffPacket.gateDecisions) && handoffPacket.gateDecisions.length === 5,
      'Handoff gate decisions missing or incomplete'
    );
    summary.assertions.push('handoff_export_ok');

    await waitFor(() => watchdogSignals.length > 0, {
      timeoutMs: 5000,
      intervalMs: 150,
      onTimeoutMessage: 'Timed out waiting for model-watchdog signal',
    });

    const expectedSignal = watchdogSignals.find((signal) => signal.category === args.failureCategory);
    assertCondition(
      Boolean(expectedSignal),
      `Expected ${args.failureCategory} signal from model-watchdog`
    );
    summary.watchdogSignals = watchdogSignals.length;
    summary.assertions.push('watchdog_signal_ok');

    summary.ok = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summary.errors.push(message);
  } finally {
    summary.durationMs = Date.now() - startedAt;

    await stopChild(wrapperProcess).catch(() => {});

    if (summary.wrapperAgentId) {
      await redisPub.hdel('tnf:agent-registry', summary.wrapperAgentId).catch(() => {});
    }

    if (handoffPrefixForCleanup) {
      await deleteKeysByPattern(redisPub, `${handoffPrefixForCleanup}:*`).catch(() => {});
    }

    await redisSub.quit().catch(() => {});
    await redisPub.quit().catch(() => {});

    if (tempDir) {
      await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  if (args.json) {
    const output = {
      ...summary,
      wrapperStdoutTail: wrapperStdout.slice(-2000),
      wrapperStderrTail: wrapperStderr.slice(-2000),
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`pi bridge smoke: ${summary.ok ? 'pass' : 'fail'}`);
    console.log(`- runId: ${summary.runId}`);
    console.log(`- durationMs: ${summary.durationMs}`);
    console.log(`- assertions: ${summary.assertions.join(', ') || 'none'}`);
    if (summary.handoffPacketId) console.log(`- handoffPacketId: ${summary.handoffPacketId}`);
    console.log(`- watchdogSignals: ${summary.watchdogSignals}`);
    if (!summary.ok) {
      console.log(`- errors: ${summary.errors.join(' | ')}`);
      if (wrapperStdout.trim()) {
        console.log(`- wrapper stdout tail:\n${wrapperStdout.slice(-1200)}`);
      }
      if (wrapperStderr.trim()) {
        console.log(`- wrapper stderr tail:\n${wrapperStderr.slice(-1200)}`);
      }
    }
  }

  process.exit(summary.ok ? 0 : 2);
}

main().catch((error) => {
  console.error(`pi bridge smoke: fatal error: ${error.message}`);
  process.exit(2);
});
