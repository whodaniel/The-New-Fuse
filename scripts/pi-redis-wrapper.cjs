#!/usr/bin/env node

/**
 * Pi Redis Wrapper
 *
 * Bridges Pi CLI into TNF Redis A2A channels with:
 * - worker registration for Director pool routing
 * - Pi session -> TNF handoff packet export
 * - provider failure -> model-watchdog signal publishing
 * - optional pre/post implementation validators
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
const { publishProviderFailureSignal } = require('./watchdog-signal-utils.cjs');
// Lazy-load pi-session-handoff to avoid pulling in monorepo deps at startup
// const { publishPiSessionHandoff, buildGateDecisions } = require('./pi-session-handoff.cjs');

// Inlined from pi-session-handoff.cjs to avoid monorepo dependency chain
const REQUIRED_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'TERMINAL_BINDING_GATE',
  'HIGH_RISK_RUNTIME_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
];
function buildGateDecisions(atIso) {
  return REQUIRED_GATES.map((gate) => ({
    gate,
    decision: 'allow',
    at: atIso,
  }));
}

const SCRIPT_DIR = __dirname;
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const CONFIG = {
  agentName: process.env.AGENT_NAME || 'pi',
  agentRole: process.env.AGENT_ROLE || 'worker',
  platform: 'pi',
  piCommand: process.env.PI_CMD || 'pi',
  piArgs: process.env.PI_ARGS || '',
  provider: process.env.PI_PROVIDER || '',
  model: process.env.PI_MODEL || '',
  skills: process.env.PI_SKILLS || '',
  maxResponseTime: Number.parseInt(process.env.PI_MAX_RESPONSE_MS || '300000', 10),
  modelWatchdogChannel: process.env.PI_MODEL_WATCHDOG_CHANNEL || 'tnf:model-watchdog:signals',
  handoffEnabled: process.env.PI_ENABLE_HANDOFF !== 'false',
  handoffTenantId: process.env.TNF_TENANT_ID || 'tnf-prod',
  validationMode: String(process.env.PI_VALIDATION_MODE || 'warn').toLowerCase(), // off|warn|enforce
  validationTimeoutMs: Number.parseInt(process.env.PI_VALIDATION_TIMEOUT_MS || '900000', 10),
  preValidatorPath: process.env.PI_PRE_VALIDATOR || 'scripts/pre-change-validation.js',
  postValidatorPath: process.env.PI_POST_VALIDATOR || 'scripts/post-change-validation.js',
  validationRunner: String(process.env.PI_VALIDATION_RUNNER || 'auto').toLowerCase(), // auto|node|bun
  modelWatchdogEnabled: process.env.PI_ENABLE_MODEL_WATCHDOG !== 'false',
};

const PROVIDER_FAILURE_PATTERNS = [
  { category: 'rate_limit', regex: /\b(429|rate[\s_-]?limit|quota|resource exhausted)\b/i },
  {
    category: 'auth',
    regex:
      /\b(401|403|unauthorized|forbidden|invalid api key|no api key|missing api key|api key not found|authentication failed)\b/i,
  },
  { category: 'timeout', regex: /\b(timeout|timed out|deadline exceeded|etimedout)\b/i },
  {
    category: 'availability',
    regex: /\b(503|service unavailable|overloaded|connection refused|network error)\b/i,
  },
  {
    category: 'credits',
    regex: /\b(402|insufficient credits|more credits|payment required|billing|quota exceeded)\b/i,
  },
];

function parseList(value) {
  if (Array.isArray(value))
    return value
      .filter(Boolean)
      .map((v) => String(v).trim())
      .filter(Boolean);
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function stripAnsi(value) {
  return String(value || '').replace(/\u001b\[[0-9;]*m/g, '');
}

function normalizeValidationMode(value) {
  if (value === 'off' || value === 'warn' || value === 'enforce') return value;
  return 'warn';
}

function normalizeValidationRunner(value) {
  if (value === 'node' || value === 'bun' || value === 'auto') return value;
  return 'auto';
}

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    stdio: 'ignore',
  });
  return result.status === 0;
}

function resolvePiCommand(command) {
  const candidate = String(command || '').trim() || 'pi';
  if (candidate.includes('/') || commandExists(candidate)) return candidate;

  const homePi = path.join(process.env.HOME || '', '.hermes', 'node', 'bin', 'pi');
  if (homePi && fs.existsSync(homePi)) return homePi;

  return candidate;
}

function resolveValidatorPath(scriptPath) {
  const raw = String(scriptPath || '').trim();
  if (!raw) return null;
  if (path.isAbsolute(raw)) return raw;

  const candidates = [
    path.resolve(process.cwd(), raw),
    path.resolve(REPO_ROOT, raw),
    path.resolve(SCRIPT_DIR, raw),
    path.resolve(SCRIPT_DIR, path.basename(raw)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[1];
}

function detectProviderFailures(text, provider, model) {
  const lines = stripAnsi(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const failures = [];

  for (const line of lines) {
    for (const pattern of PROVIDER_FAILURE_PATTERNS) {
      if (pattern.regex.test(line)) {
        failures.push({
          category: pattern.category,
          message: line.slice(0, 600),
          provider: provider || null,
          model: model || null,
        });
        break;
      }
    }
  }

  const dedup = new Map();
  for (const failure of failures) {
    const key = `${failure.category}:${failure.message}`;
    if (!dedup.has(key)) dedup.set(key, failure);
  }
  return Array.from(dedup.values());
}

function normalizePrompt(prompt) {
  const raw = String(prompt || '').trim();
  if (raw.length > 0) return raw;
  return 'No prompt supplied by upstream agent.';
}

async function runNodeScript(scriptPath, timeoutMs, env = {}) {
  const startedAt = Date.now();
  const fullPath = resolveValidatorPath(scriptPath);
  if (!fullPath || !fs.existsSync(fullPath)) {
    return {
      ok: false,
      exitCode: 127,
      durationMs: Date.now() - startedAt,
      stdout: '',
      stderr: `[pi-validation] validator script not found: ${scriptPath}`,
      command: null,
    };
  }

  const configuredRunner = normalizeValidationRunner(CONFIG.validationRunner);
  const candidateRunners = configuredRunner === 'auto' ? ['node', 'bun'] : [configuredRunner];
  const availableRunners = candidateRunners.filter((runner) => commandExists(runner));
  if (availableRunners.length === 0) {
    return {
      ok: false,
      exitCode: 127,
      durationMs: Date.now() - startedAt,
      stdout: '',
      stderr: `[pi-validation] no available runner from: ${candidateRunners.join(', ')}`,
      command: null,
    };
  }

  const runWithRunner = async (runner) =>
    new Promise((resolve) => {
      const child = spawn(runner, [fullPath], {
        cwd: REPO_ROOT,
        env: {
          ...process.env,
          ...env,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let finished = false;

      const finish = (exitCode) => {
        if (finished) return;
        finished = true;
        resolve({
          ok: exitCode === 0,
          exitCode,
          durationMs: Date.now() - startedAt,
          stdout: stripAnsi(stdout),
          stderr: stripAnsi(stderr),
          command: [runner, fullPath],
        });
      };

      const timer = setTimeout(() => {
        stderr += `\n[pi-validation] timeout after ${timeoutMs}ms`;
        child.kill('SIGTERM');
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('error', (error) => {
        stderr += `\n[pi-validation] spawn error: ${error.message}`;
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        finish(code);
      });
    });

  const firstResult = await runWithRunner(availableRunners[0]);
  if (
    !firstResult.ok &&
    availableRunners.length > 1 &&
    /(cannot use import statement outside a module|unexpected token 'export'|err_require_esm)/i.test(
      String(firstResult.stderr || '')
    )
  ) {
    const secondResult = await runWithRunner(availableRunners[1]);
    if (secondResult.ok) return secondResult;
    return {
      ...secondResult,
      stderr: `${firstResult.stderr}\n${secondResult.stderr}`.trim(),
    };
  }

  return firstResult;
}

class PiCLIInterface {
  constructor() {
    this.isReady = false;
    this.piCommand = resolvePiCommand(CONFIG.piCommand);
  }

  async start() {
    return new Promise((resolve, reject) => {
      const check = spawn(this.piCommand, ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stderr = '';
      check.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      check.on('error', (error) => reject(error));
      check.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Pi CLI unavailable (code ${code}): ${stderr.trim()}`));
          return;
        }
        this.isReady = true;
        resolve();
      });
    });
  }

  buildArgs(promptText, options = {}) {
    const args = ['-p'];

    if (options.provider) args.push('--provider', options.provider);
    if (options.model) args.push('--model', options.model);
    if (options.continueSession && options.sessionKey) {
      args.push('--session', options.sessionKey);
      args.push('--continue');
    }

    for (const skill of options.skills || []) {
      if (skill) args.push('--skill', skill);
    }

    for (const arg of options.extraArgs || []) {
      if (arg) args.push(arg);
    }

    args.push(promptText);
    return args;
  }

  cleanResponse(text) {
    return stripAnsi(text)
      .replace(/^\s*>\s*/gm, '')
      .replace(/\[DONE\]/g, '')
      .replace(/\[END\]/g, '')
      .trim();
  }

  async prompt(promptText, options = {}) {
    if (!this.isReady) {
      throw new Error('Pi CLI not started');
    }

    const startedAt = Date.now();
    const args = this.buildArgs(promptText, options);

    return new Promise((resolve) => {
      const child = spawn(this.piCommand, args, {
        cwd: options.cwd || process.cwd(),
        env: {
          ...process.env,
          ...(options.env || {}),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const finish = (payload) => {
        if (settled) return;
        settled = true;
        resolve(payload);
      };

      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        const response = this.cleanResponse(stdout) || this.cleanResponse(stderr) || '[Pi timeout]';
        finish({
          ok: false,
          exitCode: null,
          stdout: this.cleanResponse(stdout),
          stderr: this.cleanResponse(stderr),
          response,
          durationMs: Date.now() - startedAt,
          command: [CONFIG.piCommand, ...args],
          providerFailures: detectProviderFailures(
            `${stdout}\n${stderr}`,
            options.provider,
            options.model
          ),
          timedOut: true,
          sessionKey: options.sessionKey || null,
        });
      }, CONFIG.maxResponseTime);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('error', (error) => {
        clearTimeout(timeout);
        finish({
          ok: false,
          exitCode: null,
          stdout: this.cleanResponse(stdout),
          stderr: `${this.cleanResponse(stderr)}\n${error.message}`.trim(),
          response: `[Pi spawn error] ${error.message}`,
          durationMs: Date.now() - startedAt,
          command: [CONFIG.piCommand, ...args],
          providerFailures: detectProviderFailures(
            `${stdout}\n${stderr}\n${error.message}`,
            options.provider,
            options.model
          ),
          timedOut: false,
          sessionKey: options.sessionKey || null,
        });
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        const cleanedStdout = this.cleanResponse(stdout);
        const cleanedStderr = this.cleanResponse(stderr);
        const response = cleanedStdout || cleanedStderr || '[Pi returned no output]';
        finish({
          ok: code === 0,
          exitCode: code,
          stdout: cleanedStdout,
          stderr: cleanedStderr,
          response,
          durationMs: Date.now() - startedAt,
          command: [CONFIG.piCommand, ...args],
          providerFailures: detectProviderFailures(
            `${stdout}\n${stderr}`,
            options.provider,
            options.model
          ),
          timedOut: false,
          sessionKey: options.sessionKey || null,
        });
      });
    });
  }

  stop() {
    this.isReady = false;
  }
}

class PiRedisAgent {
  constructor() {
    this.client = new RedisAgentClient();
    this.pi = new PiCLIInterface();
    this.validationMode = normalizeValidationMode(CONFIG.validationMode);
    this.isRunning = false;
  }

  async start() {
    console.log(`
╔═══════════════════════════════════════════════════╗
║              Pi Redis Agent Wrapper               ║
║        ( TNF Worker + Handoff + Watchdog )        ║
╚═══════════════════════════════════════════════════╝
`);

    try {
      await this.client.initialize();
      await this.pi.start();
      if (!String(process.env.AGENT_ID || '').trim()) {
        process.env.AGENT_ID = `agent_${CONFIG.agentName}`;
      }

      await this.client.register(CONFIG.agentName, CONFIG.agentRole, CONFIG.platform, [
        'autonomous_code_editing',
        'multi_provider_inference',
        'tnf_handoff_export',
        'model_watchdog_reporting',
        'validation_pipeline',
        'director_callable_worker',
        'broker_routed_task_execution',
        'task_execution',
      ]);

      this.setupHandlers();
      this.isRunning = true;

      console.log('\n🎧 Pi wrapper listening on TNF Redis channels...\n');
      await this.waitForShutdown();
    } catch (error) {
      console.error('Failed to start Pi agent:', error.message);
      try {
        await publishProviderFailureSignal(this.client, {
          channel: CONFIG.modelWatchdogChannel,
          sourceAgent: CONFIG.agentName,
          agentRole: CONFIG.agentRole,
          platform: CONFIG.platform,
          provider: CONFIG.provider || 'unknown',
          model: CONFIG.model || 'unknown',
          category: 'availability',
          message: error.message,
        });
        console.log('📡 Emitted watchdog failover signal');
      } catch (e) {}
      await this.stop();
      process.exit(1);
    }
  }

  setupHandlers() {
    this.client.onMessage('task', async (msg) => {
      await this.processMessage(msg, 'task');
    });
    this.client.onMessage('command', async (msg) => {
      await this.processMessage(msg, 'command');
    });
    this.client.onMessage('message', async (msg) => {
      await this.processMessage(msg, 'message');
    });
    this.client.onMessage('event', async (msg) => {
      await this.processMessage(msg, 'event');
    });
  }

  resolveSessionKey(msg) {
    const requested = String(msg?.metadata?.sessionKey || msg?.conversationId || '').trim();
    if (requested) return requested;
    return `tnf-pi-${Date.now()}`;
  }

  resolveSkills(msg) {
    const fromEnv = parseList(CONFIG.skills);
    const fromMessage = parseList(msg?.metadata?.skills);
    return Array.from(new Set([...fromEnv, ...fromMessage]));
  }

  resolveExtraArgs(msg) {
    const fromEnv = parseList(CONFIG.piArgs);
    const fromMessage = parseList(msg?.metadata?.piArgs);
    return [...fromEnv, ...fromMessage];
  }

  async runValidation(phase, msg, sessionKey) {
    if (this.validationMode === 'off') return null;
    const scriptPath = phase === 'pre' ? CONFIG.preValidatorPath : CONFIG.postValidatorPath;
    const result = await runNodeScript(scriptPath, CONFIG.validationTimeoutMs, {
      TNF_PI_VALIDATION_PHASE: phase,
      TNF_PI_SESSION_KEY: sessionKey,
      TNF_PI_MESSAGE_ID: String(msg.id || ''),
      TNF_PI_FROM_AGENT: String(msg?.from?.agentName || ''),
    });
    return {
      phase,
      ...result,
    };
  }

  async publishModelWatchdogSignal(failure, msg, sessionKey) {
    if (!CONFIG.modelWatchdogEnabled) return null;
    const signal = {
      spec: 'tnf/model-watchdog/0.1',
      sourceAgent: CONFIG.agentName,
      provider: failure.provider || null,
      model: failure.model || null,
      category: failure.category,
      message: failure.message,
      conversationId: msg.conversationId || null,
      upstreamAgentId: msg?.from?.agentId || null,
      upstreamAgentName: msg?.from?.agentName || null,
      replyToMessageId: msg.id || null,
      sessionKey,
      timestamp: new Date().toISOString(),
    };

    await this.client.send(`pi-provider-failure:${failure.category}`, {
      type: 'status',
      channel: CONFIG.modelWatchdogChannel,
      metadata: {
        event: 'pi_provider_failure',
        signal,
      },
    });

    return signal;
  }

  async exportHandoff(msg, sessionKey, piRunResult, validation) {
    if (!CONFIG.handoffEnabled) return null;
    const fromAgentId = this.client.agentInfo?.id || CONFIG.agentName;
    const toAgent = msg?.from?.agentId || 'agent_orchestrator';
    const summary = piRunResult.ok
      ? 'Pi executed the upstream task and returned a response for continuation.'
      : 'Pi execution failed and returned diagnostics for downstream recovery.';
    const prompt = normalizePrompt(msg.content);

    const packetId = cryptoRandomUuidSafe(sessionKey);
    const nowIso = new Date().toISOString();

    const packet = {
      id: packetId,
      spec: 'tnf/handoff-packet/1.1',
      fromAgentId,
      targets: { agentIds: [toAgent], roles: ['worker'] },
      scope: {
        tenantId: CONFIG.handoffTenantId,
        ...(sessionKey ? { sessionKey } : {}),
      },
      payload: {
        title: 'Pi Worker Session Export',
        summary,
        prompt,
        acceptanceCriteria:
          validation?.post?.ok === false
            ? ['Post-validation failures acknowledged and triaged']
            : ['Downstream agent can resume from exported Pi context'],
        nextActions: piRunResult.ok
          ? ['Review Pi response output', 'Acknowledge or continue the task in Director lane']
          : ['Inspect Pi stderr diagnostics', 'Trigger fallback model/provider if required'],
        artifacts: [
          `pi-session:${sessionKey}`,
          `pi-command:${piRunResult.command.join(' ')}`,
          `pi-exit-code:${String(piRunResult.exitCode)}`,
        ],
      },
      cumulativeId: {
        spec: 'tnf/mcid/0.1',
        id: packetId,
        tenantId: CONFIG.handoffTenantId,
        scope: { tenant_id: CONFIG.handoffTenantId, session_key: sessionKey },
        lineage: {
          trace_id: null,
          correlation_id: cryptoRandomUuidSafe(msg.id),
          causation_id: cryptoRandomUuidSafe(msg.replyTo || msg.id),
          handoff_packet_id: null,
          twid: null,
          task_id: null,
          schedule_id: null,
          schedule_run_id: null,
        },
        federation: {
          domain: 'tnf-local',
          route: ['pi', 'handoff-service'],
          hop_count: 1,
          gate_decisions: buildGateDecisions(nowIso),
        },
        issued_at: nowIso,
      },
      gateDecisions: buildGateDecisions(nowIso),
      priority: piRunResult.ok ? 'normal' : 'high',
      tags: ['pi-session-export', 'director-pool', 'a2a'],
      createdAt: nowIso,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Publish directly via the wrapper's existing Redis connection (avoid HandoffStoreService which creates a separate connection that hangs)
    const keyPrefix = process.env.TNF_HANDOFF_KEY_PREFIX || 'tnf:handoff:v1';
    const redis = this.client.publisher || this.client.redis || this.client._redis;
    if (redis && typeof redis.set === 'function') {
      await redis.set(
        `${keyPrefix}:packet:${packetId}`,
        JSON.stringify(packet),
        'EX',
        30 * 24 * 60 * 60
      );
      await redis.rpush(`${keyPrefix}:index:session:${sessionKey}`, packetId);
      await redis.rpush(`${keyPrefix}:index:from:${fromAgentId}`, packetId);
      for (const targetId of [toAgent]) {
        await redis.rpush(`${keyPrefix}:inbox:${targetId}`, packetId);
      }
      console.log(`  📦 Handoff packet published: ${packetId}`);
    } else {
      console.warn('  ⚠️ Handoff export skipped: no direct Redis client available');
    }

    return packetId;
  }

  async processMessage(msg, messageType) {
    if (messageType === 'event') {
      if (
        msg.payload?.eventType === 'wake_ping' &&
        msg.payload?.data?.targetAgentId !== this.client.agentInfo.id
      ) {
        return;
      }
      if (msg.payload?.eventType === 'wake_ping' && msg.payload?.data?.customPrompt) {
        msg.content = msg.payload.data.customPrompt;
        messageType = 'task'; // process it as a task
      }
    }

    const sessionKey = this.resolveSessionKey(msg);
    const validation = { pre: null, post: null };
    let handoffPacketId = null;
    let watchdogSignals = [];

    try {
      validation.pre = await this.runValidation('pre', msg, sessionKey);
      if (this.validationMode === 'enforce' && validation.pre && !validation.pre.ok) {
        const blockedResponse =
          '[Pi validation] Pre-implementation validator failed. Execution blocked by enforcement mode.';
        await this.client.send(blockedResponse, {
          replyTo: msg.id,
          type: 'response',
          metadata: {
            bridge: 'pi-redis-wrapper',
            validation,
            sessionKey,
            blocked: true,
          },
        });
        return;
      }

      const runResult = await this.pi.prompt(normalizePrompt(msg.content), {
        provider: msg?.metadata?.provider || CONFIG.provider || undefined,
        model: msg?.metadata?.model || CONFIG.model || undefined,
        skills: this.resolveSkills(msg),
        extraArgs: this.resolveExtraArgs(msg),
        continueSession: Boolean(msg?.metadata?.continueSession),
        sessionKey,
      });

      if (runResult.providerFailures.length > 0) {
        watchdogSignals = [];
        for (const failure of runResult.providerFailures) {
          try {
            const signal = await this.publishModelWatchdogSignal(failure, msg, sessionKey);
            if (signal) watchdogSignals.push(signal);
          } catch (error) {
            console.warn(`[pi-wrapper] model-watchdog publish failed: ${error.message}`);
          }
        }
      }

      validation.post = await this.runValidation('post', msg, sessionKey);

      if (CONFIG.handoffEnabled) {
        try {
          handoffPacketId = await this.exportHandoff(msg, sessionKey, runResult, validation);
        } catch (error) {
          console.warn(`[pi-wrapper] handoff export failed: ${error.message}`);
        }
      }

      const responseText = runResult.response;
      const postValidationBlocked =
        this.validationMode === 'enforce' && validation.post && !validation.post.ok;

      await this.client.send(
        postValidationBlocked
          ? `${responseText}\n\n[Pi validation] Post-implementation validator failed in enforce mode.`
          : responseText,
        {
          replyTo: msg.id,
          type: 'response',
          metadata: {
            bridge: 'pi-redis-wrapper',
            messageType,
            sessionKey,
            run: {
              ok: runResult.ok,
              exitCode: runResult.exitCode,
              durationMs: runResult.durationMs,
              command: runResult.command,
              timedOut: runResult.timedOut,
            },
            validation,
            handoffPacketId,
            providerFailures: runResult.providerFailures,
            modelWatchdogSignals: watchdogSignals,
          },
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[pi-wrapper] processMessage error: ${message}`);
      await this.client.send(`[Pi wrapper error] ${message}`, {
        replyTo: msg.id,
        type: 'response',
        metadata: {
          bridge: 'pi-redis-wrapper',
          sessionKey,
          validation,
          handoffPacketId,
          modelWatchdogSignals: watchdogSignals,
          failed: true,
        },
      });
    }
  }

  async waitForShutdown() {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        await this.stop();
        resolve();
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', async (line) => {
        if (!line.trim()) return;
        const sessionKey = `tnf-pi-local-${Date.now()}`;
        const runResult = await this.pi.prompt(line.trim(), {
          provider: CONFIG.provider || undefined,
          model: CONFIG.model || undefined,
          skills: parseList(CONFIG.skills),
          extraArgs: parseList(CONFIG.piArgs),
          sessionKey,
        });
        await this.client.send(runResult.response, {
          type: 'response',
          metadata: {
            bridge: 'pi-redis-wrapper',
            localTest: true,
            sessionKey,
            run: {
              ok: runResult.ok,
              exitCode: runResult.exitCode,
              durationMs: runResult.durationMs,
            },
          },
        });
      });
    });
  }

  async stop() {
    this.isRunning = false;
    this.pi.stop();
    await this.client.cleanup();
    console.log('👋 Pi wrapper stopped');
  }
}

function cryptoRandomUuidSafe(candidate) {
  const text = String(candidate || '').trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    return text;
  }
  return require('node:crypto').randomUUID();
}

async function main() {
  const agent = new PiRedisAgent();
  await agent.start();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  PiRedisAgent,
  PiCLIInterface,
  detectProviderFailures,
};
