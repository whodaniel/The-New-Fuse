#!/usr/bin/env node

/**
 * Model Watchdog Failover Consumer
 *
 * Subscribes to TNF model-watchdog signals (for example, Pi provider failures),
 * tracks provider health in Redis, and emits failover coordination events to
 * orchestrator + broker lanes.
 */

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || '').trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePositiveInt(raw, fallback, min = 1) {
  const parsed = Number.parseInt(String(raw || ''), 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }
  return parsed;
}

function normalizeToken(value, fallback = 'unknown') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized || fallback;
}

function sanitizeRedisSegment(value, fallback = 'unknown') {
  const raw = normalizeToken(value, fallback);
  const cleaned = raw.replace(/[^a-z0-9._:-]/g, '_').replace(/_+/g, '_');
  return cleaned || fallback;
}

function toIso(ms) {
  return new Date(ms).toISOString();
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseSignalTimestamp(signal, fallbackMs) {
  const parsed = Date.parse(String(signal?.timestamp || ''));
  if (Number.isFinite(parsed)) return parsed;
  return fallbackMs;
}

function normalizeMessagePreview(value) {
  const cleaned = String(value || '').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 600);
}

function parseWatchdogSignal(message) {
  if (!message || typeof message !== 'object') return null;
  if (message.type !== 'status') return null;
  const event = message?.metadata?.event;
  if (event !== 'pi_provider_failure' && event !== 'provider_failure') return null;

  const signal = message?.metadata?.signal;
  if (!signal || typeof signal !== 'object') return null;
  if (signal.spec !== 'tnf/model-watchdog/0.1') return null;

  return {
    spec: signal.spec,
    sourceAgent: String(signal.sourceAgent || message?.from?.agentName || 'unknown'),
    provider: normalizeToken(signal.provider, 'unknown'),
    model: normalizeToken(signal.model, 'unspecified'),
    category: normalizeToken(signal.category, 'unknown'),
    message: normalizeMessagePreview(signal.message),
    conversationId: signal.conversationId || null,
    upstreamAgentId: signal.upstreamAgentId || null,
    upstreamAgentName: signal.upstreamAgentName || null,
    replyToMessageId: signal.replyToMessageId || message?.replyTo || null,
    sessionKey: signal.sessionKey || null,
    timestamp: String(signal.timestamp || new Date().toISOString()),
  };
}

function thresholdForCategory(category, config) {
  if (category === 'auth') return config.authFailoverThreshold;
  if (category === 'credits') return config.creditsFailoverThreshold;
  return config.defaultFailoverThreshold;
}

function chooseFallbackProvider(currentProvider, providerChain) {
  const chain = providerChain.map((entry) => normalizeToken(entry)).filter(Boolean);

  if (chain.length === 0) return null;

  const current = normalizeToken(currentProvider);
  const idx = chain.indexOf(current);
  if (idx >= 0) {
    if (chain.length === 1) return chain[0];
    return chain[(idx + 1) % chain.length];
  }

  return chain[0];
}

function failureReasonForCategory(category) {
  switch (category) {
    case 'auth':
      return 'provider authentication failure';
    case 'credits':
      return 'provider credit/quota exhaustion';
    case 'rate_limit':
      return 'provider rate-limit pressure';
    case 'timeout':
      return 'provider timeout/deadline failures';
    case 'availability':
      return 'provider availability outage';
    default:
      return 'provider instability detected';
  }
}

function resolveConfig(overrides = {}) {
  const base = {
    agentName: process.env.MODEL_WATCHDOG_AGENT_NAME || 'model-watchdog',
    agentRole: process.env.MODEL_WATCHDOG_AGENT_ROLE || 'broker',
    platform: process.env.MODEL_WATCHDOG_PLATFORM || 'watchdog',
    modelWatchdogChannel: process.env.PI_MODEL_WATCHDOG_CHANNEL || 'tnf:model-watchdog:signals',
    orchestratorChannel: process.env.MODEL_WATCHDOG_ORCHESTRATOR_CHANNEL || 'tnf:orchestrator',
    brokerChannel: process.env.MODEL_WATCHDOG_BROKER_CHANNEL || 'tnf:broker',
    brokerDecisionChannel: process.env.MODEL_WATCHDOG_DECISION_CHANNEL || 'tnf:broker:decisions',
    statePrefix: process.env.MODEL_WATCHDOG_STATE_PREFIX || 'tnf:model-watchdog:v1',
    failureWindowMs: parsePositiveInt(process.env.MODEL_WATCHDOG_WINDOW_MS, 10 * 60 * 1000),
    escalationCooldownMs: parsePositiveInt(
      process.env.MODEL_WATCHDOG_ESCALATION_COOLDOWN_MS,
      5 * 60 * 1000
    ),
    defaultFailoverThreshold: parsePositiveInt(process.env.MODEL_WATCHDOG_FAILOVER_THRESHOLD, 2),
    authFailoverThreshold: parsePositiveInt(process.env.MODEL_WATCHDOG_AUTH_FAILOVER_THRESHOLD, 1),
    creditsFailoverThreshold: parsePositiveInt(
      process.env.MODEL_WATCHDOG_CREDITS_FAILOVER_THRESHOLD,
      1
    ),
    stateTtlSeconds: parsePositiveInt(process.env.MODEL_WATCHDOG_STATE_TTL_SECONDS, 86400),
    maxRecentFailures: parsePositiveInt(process.env.MODEL_WATCHDOG_MAX_RECENT_FAILURES, 50, 5),
    providerChain: parseList(
      process.env.MODEL_WATCHDOG_PROVIDER_CHAIN ||
        'google,anthropic,openai,openrouter,nvidia,deepseek'
    ).map((entry) => normalizeToken(entry)),
    publishDecisionChannel: process.env.MODEL_WATCHDOG_PUBLISH_DECISION !== 'false',
    dryRun: process.env.MODEL_WATCHDOG_DRY_RUN === '1',
  };

  const merged = {
    ...base,
    ...overrides,
  };
  merged.providerChain = parseList(merged.providerChain).map((entry) => normalizeToken(entry));
  return merged;
}

class ModelWatchdogFailoverConsumer {
  constructor(options = {}) {
    const resolvedClient = options.client || createDefaultClient();
    this.config = resolveConfig(options.config || {});
    this.client = resolvedClient;
    this.now = options.now || (() => new Date());
    this.logger = options.logger || console;
    this.memoryState = new Map();
    this.running = false;
  }

  async start() {
    if (this.running) return;

    await this.client.initialize();
    await this.client.register(this.config.agentName, this.config.agentRole, this.config.platform, [
      'model_health_monitoring',
      'provider_failover_coordination',
      'watchdog_signal_ingestion',
    ]);

    await this.subscribeWatchdogChannel();
    this.client.onMessage('status', (message, channel) => {
      void this.handleStatusMessage(message, channel).catch((error) => {
        this.warn(`[model-watchdog] failed to process signal: ${error.message}`);
      });
    });

    this.running = true;
    this.log(
      `[model-watchdog] listening on ${this.config.modelWatchdogChannel} (window=${this.config.failureWindowMs}ms threshold=${this.config.defaultFailoverThreshold})`
    );

    await this.waitForShutdown();
  }

  async subscribeWatchdogChannel() {
    const sub = this.client?.subscriber;
    if (!sub || typeof sub.subscribe !== 'function') {
      throw new Error('Redis subscriber is unavailable on RedisAgentClient');
    }

    await sub.subscribe(this.config.modelWatchdogChannel);
  }

  getStateKey(provider, model) {
    const p = sanitizeRedisSegment(provider, 'unknown');
    const m = sanitizeRedisSegment(model, 'unspecified');
    return `${this.config.statePrefix}:provider:${p}:model:${m}`;
  }

  async readState(key) {
    const redis = this.client?.publisher;
    if (redis && typeof redis.get === 'function') {
      const raw = await redis.get(key);
      if (!raw) return null;
      return safeJsonParse(raw);
    }

    const local = this.memoryState.get(key);
    if (!local) return null;
    return safeJsonParse(local);
  }

  async writeState(key, state) {
    const payload = JSON.stringify(state);
    const redis = this.client?.publisher;

    if (redis && typeof redis.set === 'function') {
      await redis.set(key, payload, 'EX', this.config.stateTtlSeconds);
      return;
    }

    this.memoryState.set(key, payload);
  }

  async publishDecisionPayload(payload) {
    if (!this.config.publishDecisionChannel) return;

    const redis = this.client?.publisher;
    if (!redis || typeof redis.publish !== 'function') return;
    await redis.publish(this.config.brokerDecisionChannel, JSON.stringify(payload));
  }

  async emitFailoverRecommendation(context) {
    const { signal, state, recommendation, threshold } = context;
    const failuresInWindow = Array.isArray(state.recentFailureEpochMs)
      ? state.recentFailureEpochMs.length
      : state.failuresInWindow;

    const nowIso = toIso(this.now().getTime());
    const summary = `[model-watchdog] failover recommended: provider=${signal.provider} model=${signal.model} category=${signal.category} failures=${failuresInWindow}/${threshold} fallback=${recommendation.fallbackProvider || 'none'}`;

    const metadata = {
      event: 'model_failover_recommended',
      spec: 'tnf/model-watchdog-failover/0.1',
      signal,
      health: {
        provider: signal.provider,
        model: signal.model,
        category: signal.category,
        failuresInWindow,
        threshold,
        windowMs: this.config.failureWindowMs,
        lastFailureAt: state.lastFailureAt,
      },
      recommendation,
      emittedAt: nowIso,
    };

    if (this.config.dryRun) {
      this.log(`${summary} (dry-run)`);
      return;
    }

    await this.client.send(summary, {
      type: 'command',
      channel: this.config.orchestratorChannel,
      metadata,
    });

    await this.client.send(summary, {
      type: 'status',
      channel: this.config.brokerChannel,
      metadata,
    });

    await this.publishDecisionPayload({
      brokerId: this.client?.agentInfo?.id || this.config.agentName,
      decisionType: 'model_failover',
      policyDecision: 'escalate',
      policyReason: recommendation.reason,
      riskLevel: recommendation.riskLevel,
      targetAgentId: null,
      decidedAt: nowIso,
      signal,
      recommendation,
      health: metadata.health,
    });

    this.log(summary);
  }

  async handleStatusMessage(message, channel) {
    if (channel !== this.config.modelWatchdogChannel) {
      return { handled: false, reason: 'channel_mismatch' };
    }

    const signal = parseWatchdogSignal(message);
    if (!signal) {
      return { handled: false, reason: 'signal_not_supported' };
    }

    const nowMs = this.now().getTime();
    const observedAtMs = parseSignalTimestamp(signal, nowMs);
    const key = this.getStateKey(signal.provider, signal.model);
    const existing = (await this.readState(key)) || {};

    const recentFailureEpochMs = Array.isArray(existing.recentFailureEpochMs)
      ? existing.recentFailureEpochMs.filter(
          (ts) => Number.isFinite(ts) && nowMs - ts <= this.config.failureWindowMs
        )
      : [];
    recentFailureEpochMs.push(observedAtMs);
    if (recentFailureEpochMs.length > this.config.maxRecentFailures) {
      recentFailureEpochMs.splice(0, recentFailureEpochMs.length - this.config.maxRecentFailures);
    }

    const categories =
      existing.categories && typeof existing.categories === 'object'
        ? { ...existing.categories }
        : {};
    categories[signal.category] = parsePositiveInt(categories[signal.category], 0, 0) + 1;

    const threshold = thresholdForCategory(signal.category, this.config);
    const lastEscalatedAtMs = Date.parse(String(existing.lastEscalatedAt || ''));
    const inCooldown =
      Number.isFinite(lastEscalatedAtMs) &&
      nowMs - lastEscalatedAtMs < this.config.escalationCooldownMs;

    const state = {
      spec: 'tnf/model-watchdog-state/0.1',
      provider: signal.provider,
      model: signal.model,
      failuresInWindow: recentFailureEpochMs.length,
      totalFailures: parsePositiveInt(existing.totalFailures, 0, 0) + 1,
      recentFailureEpochMs,
      categories,
      lastCategory: signal.category,
      lastMessage: signal.message,
      lastFailureAt: toIso(observedAtMs),
      lastSignalAt: toIso(nowMs),
      lastSessionKey: signal.sessionKey || null,
      lastSourceAgent: signal.sourceAgent || null,
      lastEscalatedAt: existing.lastEscalatedAt || null,
      lastRecommendation: existing.lastRecommendation || null,
    };

    const shouldEscalate = recentFailureEpochMs.length >= threshold && !inCooldown;

    if (shouldEscalate) {
      const fallbackProvider = chooseFallbackProvider(signal.provider, this.config.providerChain);
      const recommendation = {
        fallbackProvider,
        fallbackModel: signal.model,
        reason: `${failureReasonForCategory(signal.category)}; ${recentFailureEpochMs.length} failures in ${this.config.failureWindowMs}ms`,
        riskLevel: signal.category === 'auth' || signal.category === 'credits' ? 'high' : 'medium',
      };

      state.lastEscalatedAt = toIso(nowMs);
      state.lastRecommendation = recommendation;

      await this.emitFailoverRecommendation({
        signal,
        state,
        threshold,
        recommendation,
      });
    }

    await this.writeState(key, state);

    return {
      handled: true,
      key,
      escalated: shouldEscalate,
      failuresInWindow: state.failuresInWindow,
      threshold,
    };
  }

  async waitForShutdown() {
    return new Promise((resolve) => {
      const shutdown = async () => {
        await this.stop();
        resolve();
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });
  }

  async stop() {
    if (!this.running) return;
    this.running = false;
    await this.client.cleanup();
    this.log('[model-watchdog] stopped');
  }

  log(message) {
    if (this.logger && typeof this.logger.log === 'function') {
      this.logger.log(message);
    }
  }

  warn(message) {
    if (this.logger && typeof this.logger.warn === 'function') {
      this.logger.warn(message);
    }
  }
}

function createDefaultClient() {
  const { RedisAgentClient } = require('./tnf-agent-cli.cjs');
  return new RedisAgentClient();
}

async function main() {
  const consumer = new ModelWatchdogFailoverConsumer();
  await consumer.start();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[model-watchdog] ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  ModelWatchdogFailoverConsumer,
  parseWatchdogSignal,
  chooseFallbackProvider,
  thresholdForCategory,
  resolveConfig,
};
