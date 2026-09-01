#!/usr/bin/env node
/**
 * Shared CJS core for agent-state / quota / profile-session / ecosystem.
 * Used by scripts/runtime/tnf-ecosystem-hydrate.cjs and node:test coverage.
 */
'use strict';

const { createHash, randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SPEC = 'tnf/agent-state-quota-ecosystem/0.2';
const DEFAULT_QUOTA_TTL_SEC = 300;
const HISTORY_CAP = 300;
const HISTORY_DAYS = 14;
const HISTORY_JSONL_LINES = 1000;

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function resolveProfile(tnfHome, env = process.env) {
  if (env.TNF_PROFILE && env.TNF_PROFILE.trim()) return env.TNF_PROFILE.trim();
  try {
    const pointer = fs.readFileSync(path.join(tnfHome, 'profiles', 'default'), 'utf8').trim();
    if (pointer) return pointer;
  } catch {
    // continue
  }
  const active = readJson(path.join(tnfHome, 'profiles', 'active.json'));
  if (active?.callsign) return String(active.callsign);
  return env.USER || env.USERNAME || 'default';
}

function asNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function loadProviderLimits(tnfHome) {
  const out = {};
  for (const file of [
    path.join(tnfHome, 'llm-config.json'),
    path.join(tnfHome, 'provider-config.json'),
  ]) {
    const data = readJson(file);
    if (!data || typeof data !== 'object') continue;
    const providers = data.providers || data.models || data;
    if (!providers || typeof providers !== 'object' || Array.isArray(providers)) continue;
    for (const [name, raw] of Object.entries(providers)) {
      if (!raw || typeof raw !== 'object') continue;
      const limit = asNumber(raw.quotaLimit ?? raw.limit ?? raw.maxTokens ?? raw.dailyLimit, NaN);
      if (!Number.isFinite(limit) || limit <= 0) continue;
      out[name.toLowerCase()] = {
        limit,
        unit: String(raw.quotaUnit || raw.unit || 'tokens').toLowerCase(),
      };
    }
  }
  return out;
}

function loadUsageCounters(tnfHome) {
  const out = {};
  const candidates = [
    path.join(tnfHome, 'metrics', 'health-latest.json'),
    path.join(tnfHome, 'usage-latest.json'),
  ];
  for (const file of candidates) {
    const data = readJson(file);
    if (!data || typeof data !== 'object') continue;
    const usage = data.usage || data.quotas || data.agents;
    if (usage && typeof usage === 'object' && !Array.isArray(usage)) {
      for (const [key, raw] of Object.entries(usage)) {
        if (typeof raw === 'number') out[key.toLowerCase()] = raw;
        else if (raw && typeof raw === 'object') {
          out[key.toLowerCase()] = asNumber(raw.used ?? raw.tokensUsed ?? raw.count, 0);
        }
      }
    }
  }
  return out;
}

function refreshQuota(tnfHome, agent, now = new Date()) {
  const provider = String(agent.platform || 'unknown').toLowerCase();
  const limits = loadProviderLimits(tnfHome);
  const usage = loadUsageCounters(tnfHome);
  const limitRow = limits[provider];
  const limit = limitRow?.limit ?? null;
  const unit = limitRow?.unit || (limit != null ? 'tokens' : 'unknown');
  const usedRaw =
    usage[String(agent.agentId || '').toLowerCase()] ??
    usage[String(agent.name || '').toLowerCase()] ??
    usage[provider];
  const used = usedRaw == null ? null : Number(usedRaw);
  const observedAt = now.toISOString();

  if (limit == null && used == null) {
    return {
      agentId: agent.agentId,
      provider,
      dimension: 'unknown',
      unit: 'unknown',
      used: null,
      limit: null,
      remaining: null,
      remainingFraction: null,
      observedAt,
      refreshedAt: observedAt,
      resetAt: null,
      freshnessTtlSec: DEFAULT_QUOTA_TTL_SEC,
      source: 'unavailable',
      confidence: 'unknown',
      degraded: true,
      reason: 'no quota signal — remaining stays UNKNOWN',
    };
  }

  let remaining = null;
  let remainingFraction = null;
  let confidence = 'inferred';
  if (limit != null && used != null) {
    remaining = Math.max(0, limit - used);
    remainingFraction = limit > 0 ? remaining / limit : null;
    confidence = 'reported';
  }

  return {
    agentId: agent.agentId,
    provider,
    dimension: unit === 'unknown' ? 'quota' : unit,
    unit,
    used,
    limit,
    remaining,
    remainingFraction,
    observedAt,
    refreshedAt: observedAt,
    resetAt: null,
    freshnessTtlSec: DEFAULT_QUOTA_TTL_SEC,
    source: 'local-config+metrics',
    confidence,
    degraded: false,
    reason:
      used == null && limit != null ? 'limit known; usage unknown — remaining UNKNOWN' : undefined,
  };
}

function markFreshness(record, nowMs = Date.now()) {
  if (record.confidence === 'unknown') {
    return { ...record, degraded: true, reason: record.reason || 'quota UNKNOWN' };
  }
  const refreshed = Date.parse(record.observedAt || record.refreshedAt);
  const fresh = Number.isFinite(refreshed) && nowMs - refreshed <= record.freshnessTtlSec * 1000;
  if (fresh && !record.degraded) return record;
  if (!fresh) {
    return { ...record, degraded: true, reason: record.reason || 'quota freshness TTL exceeded' };
  }
  return record;
}

function rankAgentsForDelegation(agents, hints = {}) {
  const required = (hints.capabilities || []).map((c) => c.toLowerCase());
  const requiredRoles = (hints.requiredAuthorityRoles || []).map((c) => c.toLowerCase());
  const now = hints.now ?? Date.now();
  return agents
    .map((agent) => {
      const reasons = [];
      const components = {
        capability: 0,
        authority: 0,
        privacy: 0,
        availability: 0,
        quota: 0,
        latency: 0,
        context: 0,
        reliability: 0,
      };
      let authorityEligible = true;
      if (requiredRoles.length) {
        const role = String(agent.authorityRole || agent.role || '').toLowerCase();
        authorityEligible = requiredRoles.includes(role);
        components.authority = authorityEligible ? 20 : -1000;
        reasons.push(authorityEligible ? `authority=${role || 'none'}` : 'authority-hard-gate-fail');
      }
      if (agent.isOnline) {
        components.availability = 25;
        reasons.push('online');
      } else {
        components.availability = -15;
        reasons.push('offline');
      }
      const quota = agent.quota;
      if (!quota || quota.confidence === 'unknown' || quota.remaining == null || quota.limit == null) {
        components.quota = 0;
        reasons.push('quota=UNKNOWN');
      } else {
        const observed = Date.parse(quota.observedAt || quota.refreshedAt);
        const fresh =
          Number.isFinite(observed) &&
          now - observed <= quota.freshnessTtlSec * 1000 &&
          !quota.degraded;
        if (fresh) {
          components.quota = Math.round((quota.remainingFraction || 0) * 20);
          reasons.push(`quota=${quota.remaining}/${quota.limit}`);
        } else {
          components.quota = -5;
          reasons.push('quota-stale');
        }
      }
      if (required.length) {
        const caps = (agent.capabilities || []).map((c) => c.toLowerCase());
        const matched = required.filter((c) => caps.includes(c)).length;
        components.capability += matched * 10;
        reasons.push(`caps=${matched}/${required.length}`);
      }
      const score = Object.values(components).reduce((a, b) => a + b, 0);
      return { agent, score, reasons, authorityEligible, components };
    })
    .sort((a, b) => {
      if (a.authorityEligible !== b.authorityEligible) return a.authorityEligible ? -1 : 1;
      return b.score - a.score || a.agent.agentId.localeCompare(b.agent.agentId);
    });
}

function agentStateRoot(tnfHome, profile) {
  return path.join(tnfHome, 'agent-state', profile);
}

function pruneHistory(tnfHome, profile, options = {}) {
  const historyCap = options.historyCap ?? HISTORY_CAP;
  const retentionDays = options.retentionDays ?? HISTORY_DAYS;
  const jsonlLines = options.jsonlLines ?? HISTORY_JSONL_LINES;
  const nowMs = options.nowMs ?? Date.now();
  const historyDir = path.join(agentStateRoot(tnfHome, profile), 'history');
  ensureDir(historyDir);
  const files = fs
    .readdirSync(historyDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const full = path.join(historyDir, name);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  const before = files.length;
  const cutoff = nowMs - retentionDays * 86400_000;
  const keep = [];
  let removed = 0;
  for (const file of files) {
    if (keep.length >= historyCap || file.mtime < cutoff) {
      try {
        fs.unlinkSync(file.full);
        removed += 1;
      } catch {
        // ignore
      }
    } else {
      keep.push(file);
    }
  }

  let truncatedJsonl = false;
  const jsonlPath = path.join(agentStateRoot(tnfHome, profile), 'history.jsonl');
  if (fs.existsSync(jsonlPath)) {
    const lines = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean);
    if (lines.length > jsonlLines) {
      fs.writeFileSync(jsonlPath, `${lines.slice(lines.length - jsonlLines).join('\n')}\n`, {
        mode: 0o600,
      });
      truncatedJsonl = true;
    }
  }
  return { before, after: keep.length, removed, truncatedJsonl };
}

function writeAgentStateSnapshot(tnfHome, profile, agents, options = {}) {
  const now = options.now || new Date();
  const withQuotas = agents.map((agent) => {
    const quota = markFreshness(refreshQuota(tnfHome, agent, now), now.getTime());
    return { ...agent, quota };
  });
  const snapshot = {
    spec: SPEC,
    kind: 'observation-history',
    authority: 'not-authoritative',
    canonicalPointers: {
      roles: path.join(tnfHome, 'authority', 'roles.json'),
      handoffCurrent: path.join(tnfHome, 'handoff-current.json'),
      statusLedgerDoc: 'docs/protocols/AGENT_STATUS_LEDGER.md',
    },
    profile,
    generatedAt: now.toISOString(),
    agents: withQuotas,
    receipts: {
      writer: options.writer || 'agent-state-quota-ecosystem-lib',
      agentCount: withQuotas.length,
      quotaFreshCount: withQuotas.filter(
        (a) => a.quota && !a.quota.degraded && a.quota.confidence !== 'unknown'
      ).length,
      quotaDegradedCount: withQuotas.filter((a) => a.quota?.degraded).length,
      quotaUnknownCount: withQuotas.filter((a) => a.quota?.confidence === 'unknown').length,
    },
  };
  const root = agentStateRoot(tnfHome, profile);
  const historyDir = path.join(root, 'history');
  ensureDir(historyDir);
  writeJson(path.join(root, 'latest.json'), snapshot);
  const stamp = snapshot.generatedAt.replace(/[:.]/g, '-');
  writeJson(path.join(historyDir, `${stamp}.json`), snapshot);
  fs.appendFileSync(
    path.join(root, 'history.jsonl'),
    `${JSON.stringify({
      at: snapshot.generatedAt,
      profile,
      agentCount: withQuotas.length,
      writer: snapshot.receipts.writer,
    })}\n`,
    { mode: 0o600 }
  );
  pruneHistory(tnfHome, profile, {
    historyCap: options.historyCap,
    retentionDays: options.retentionDays,
    jsonlLines: options.jsonlLines,
    nowMs: now.getTime(),
  });
  return snapshot;
}

function hashPassphrase(passphrase, salt) {
  return scryptSync(passphrase, salt, 32).toString('hex');
}

function loginProfile(tnfHome, profile, options = {}) {
  const profileDir = path.join(tnfHome, 'profiles', profile);
  ensureDir(profileDir);
  const profileJson = path.join(tnfHome, 'profiles', `${profile}.json`);
  if (!fs.existsSync(profileJson)) {
    writeJson(profileJson, {
      profileName: profile,
      callsign: profile,
      identityMode: options.identityMode || 'local',
      createdAt: new Date().toISOString(),
    });
  }
  const secretsPath = path.join(profileDir, 'auth-secret.json');
  let secrets = readJson(secretsPath);
  const passphrase = options.passphrase || '';
  if (!secrets) {
    const salt = randomBytes(16);
    secrets = {
      salt: salt.toString('hex'),
      hash: passphrase
        ? hashPassphrase(passphrase, salt)
        : createHash('sha256').update(`local:${profile}:${randomBytes(8).toString('hex')}`).digest('hex'),
    };
    writeJson(secretsPath, secrets);
  } else if (passphrase) {
    const salt = Buffer.from(secrets.salt, 'hex');
    const candidate = Buffer.from(hashPassphrase(passphrase, salt), 'hex');
    const expected = Buffer.from(secrets.hash, 'hex');
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      const err = new Error('Invalid profile passphrase');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
  }
  const now = options.now || new Date();
  const session = {
    profile,
    sessionId: randomBytes(16).toString('hex'),
    authenticatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + (options.ttlMs || 12 * 60 * 60 * 1000)).toISOString(),
    identityMode: options.identityMode || 'local',
    cloudLinked: Boolean(options.cloud),
    cloudEndpoint: options.cloudEndpoint,
  };
  writeJson(path.join(profileDir, 'session.json'), session);
  fs.writeFileSync(path.join(tnfHome, 'profiles', 'default'), `${profile}\n`, { mode: 0o600 });
  return session;
}

function readSession(tnfHome, profile, nowMs = Date.now()) {
  const session = readJson(path.join(tnfHome, 'profiles', profile, 'session.json'));
  if (!session) return null;
  const expires = Date.parse(session.expiresAt);
  if (!Number.isFinite(expires) || expires <= nowMs) return null;
  return session;
}

function logoutProfile(tnfHome, profile) {
  const sessionPath = path.join(tnfHome, 'profiles', profile, 'session.json');
  if (!fs.existsSync(sessionPath)) return false;
  fs.unlinkSync(sessionPath);
  return true;
}

module.exports = {
  SPEC,
  DEFAULT_QUOTA_TTL_SEC,
  HISTORY_CAP,
  HISTORY_DAYS,
  HISTORY_JSONL_LINES,
  resolveProfile,
  refreshQuota,
  markFreshness,
  rankAgentsForDelegation,
  writeAgentStateSnapshot,
  pruneHistory,
  loginProfile,
  readSession,
  logoutProfile,
  readJson,
  writeJson,
};
