#!/usr/bin/env node

const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sha1(value) {
  return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(String(raw || ''));
  } catch (_error) {
    return fallback;
  }
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return safeJsonParse(fs.readFileSync(filePath, 'utf8'), null);
}

function loadTokenFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return '';
    return String(fs.readFileSync(filePath, 'utf8') || '').trim();
  } catch (_error) {
    return '';
  }
}

function resolveForgeTargetsFromEnv() {
  const listRaw = process.env.TNF_SUPERADMIN_FORGE_CHANNEL_TARGETS || '';
  const splitList = listRaw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const targets = [];
  for (const entry of splitList) {
    const idx = entry.indexOf(':');
    if (idx <= 0) continue;
    const channel = entry.slice(0, idx).trim().toLowerCase();
    const to = entry.slice(idx + 1).trim();
    if (channel && to) targets.push({ channel, to });
  }

  const mapped = [
    ['telegram', process.env.TNF_SUPERADMIN_FORGE_TELEGRAM_TO],
    ['imessage', process.env.TNF_SUPERADMIN_FORGE_IMESSAGE_TO],
    ['wechat', process.env.TNF_SUPERADMIN_FORGE_WECHAT_TO],
    ['feishu', process.env.TNF_SUPERADMIN_FORGE_FEISHU_TO],
  ];
  for (const [channel, to] of mapped) {
    if (to && String(to).trim()) {
      targets.push({ channel, to: String(to).trim() });
    }
  }

  return targets;
}

function discoverForgeTargetsFromAllowlist() {
  const root =
    process.env.TNF_SUPERADMIN_FORGE_STATE_DIR ||
    path.join(os.homedir(), '.forge-hub', 'state');
  const channels = ['telegram', 'imessage', 'wechat', 'feishu'];
  const targets = [];
  for (const channel of channels) {
    const allowlistPath = path.join(root, channel, 'allowlist.json');
    if (!fs.existsSync(allowlistPath)) continue;
    const parsed = safeJsonParse(fs.readFileSync(allowlistPath, 'utf8'), null);
    const first = parsed && Array.isArray(parsed.allowed) ? parsed.allowed[0] : null;
    if (!first || !first.id) continue;
    targets.push({ channel, to: String(first.id).trim() });
  }
  return targets;
}

function mergeTargets(primary, secondary) {
  const seen = new Set();
  return [...primary, ...secondary].filter((target) => {
    const key = `${target.channel}:${target.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveTnfRoot() {
  return (
    process.env.TNF_ROOT ||
    process.env.TNF_ROOT_DIR ||
    path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse')
  );
}

function discoverTelegramToken() {
  const configured =
    process.env.TNF_SUPERADMIN_TELEGRAM_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    '';
  if (configured) return configured;

  const candidatePaths = [
    path.join(os.homedir(), '.forge-hub', 'state', 'telegram', 'config.json'),
    path.join(resolveTnfRoot(), 'data', 'telegram', 'config.json'),
  ];
  for (const candidate of candidatePaths) {
    const parsed = readJsonFile(candidate);
    if (!parsed || typeof parsed !== 'object') continue;
    if (parsed.bot_token && String(parsed.bot_token).trim()) {
      return String(parsed.bot_token).trim();
    }
  }
  return '';
}

function discoverTelegramChatId() {
  const configured =
    process.env.TNF_SUPERADMIN_TELEGRAM_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    '';
  if (configured) return String(configured).trim();

  const allowlistPath = path.join(os.homedir(), '.forge-hub', 'state', 'telegram', 'allowlist.json');
  const fromAllowlist = readJsonFile(allowlistPath);
  if (fromAllowlist && Array.isArray(fromAllowlist.allowed) && fromAllowlist.allowed[0]?.id) {
    return String(fromAllowlist.allowed[0].id).trim();
  }

  const telegramConfig = readJsonFile(path.join(resolveTnfRoot(), 'data', 'telegram', 'config.json'));
  if (telegramConfig && Array.isArray(telegramConfig.allowed_chats) && telegramConfig.allowed_chats[0] !== undefined) {
    return String(telegramConfig.allowed_chats[0]).trim();
  }

  return '';
}

function resolveHermesTargetsFromEnv() {
  const raw = process.env.TNF_SUPERADMIN_HERMES_TARGETS || '';
  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function discoverHermesTargets({ includeTelegram = false } = {}) {
  try {
    const { stdout } = await execFileAsync('hermes', ['send', '--list', '--json'], {
      maxBuffer: 1024 * 1024 * 8,
    });
    const parsed = safeJsonParse(stdout, null);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.platforms !== 'object') {
      return [];
    }
    const platforms = parsed.platforms || {};
    const targets = [];

    const addTargets = (platformKey, enabled, mode = 'all') => {
      if (!enabled) return;
      const entries = Array.isArray(platforms[platformKey]) ? platforms[platformKey] : [];
      const selected =
        mode === 'dm-first'
          ? entries.filter((entry) => entry && String(entry.type || '').toLowerCase() === 'dm').slice(0, 1)
          : entries;
      for (const entry of selected) {
        if (!entry || !entry.id) continue;
        const thread = entry.thread_id ? `:${entry.thread_id}` : '';
        targets.push(`${platformKey}:${String(entry.id).trim()}${thread}`);
      }
    };

    addTargets('whatsapp', true, 'dm-first');
    addTargets('sms', true);
    addTargets('email', true);
    addTargets('telegram', includeTelegram);
    return targets;
  } catch (_error) {
    return [];
  }
}

async function postJson(url, payload, headers = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    const body = safeJsonParse(text, null);
    return {
      ok: response.ok,
      status: response.status,
      body,
      rawBody: text,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function postForm(url, payload, headers = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload || {})) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
      body: params.toString(),
      signal: controller.signal,
    });
    const text = await response.text();
    const body = safeJsonParse(text, null);
    return {
      ok: response.ok,
      status: response.status,
      body,
      rawBody: text,
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildMessage(event, host) {
  const lines = [
    `TNF Super Admin Escalation`,
    `severity=${event.severity}`,
    `code=${event.code}`,
    `host=${host}`,
    `time=${event.timestamp}`,
    `message=${event.message}`,
  ];
  if (event.metadata && typeof event.metadata === 'object') {
    const metadata = Object.entries(event.metadata)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
    if (metadata) lines.push(`metadata=${metadata}`);
  }
  return lines.join('\n');
}

function loadDedupeState(statePath) {
  if (!fs.existsSync(statePath)) {
    return { sent: {} };
  }
  const parsed = safeJsonParse(fs.readFileSync(statePath, 'utf8'), { sent: {} });
  if (!parsed || typeof parsed !== 'object') return { sent: {} };
  if (!parsed.sent || typeof parsed.sent !== 'object') parsed.sent = {};
  return parsed;
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

async function sendWithRetries(run, retries, backoffMs) {
  let attempt = 0;
  let lastError = null;
  while (attempt <= retries) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      const waitMs = backoffMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    attempt += 1;
  }
  throw lastError || new Error('send failed');
}

function createSuperAdminFanout(options = {}) {
  const host = os.hostname();
  const enabled = process.env.TNF_SUPERADMIN_NOTIFY_ENABLED !== 'false';
  const stateDir =
    process.env.TNF_SUPERADMIN_NOTIFY_STATE_DIR ||
    path.join(os.homedir(), '.tnf', 'super-admin-notify', 'state');
  const outboxDir =
    process.env.TNF_SUPERADMIN_NOTIFY_OUTBOX_DIR ||
    path.join(os.homedir(), '.tnf', 'super-admin-notify', 'outbox');
  const statePath = path.join(stateDir, 'dedupe-state.json');
  const dedupeMsBySeverity = {
    critical: parsePositiveInt(process.env.TNF_SUPERADMIN_NOTIFY_DEDUPE_CRITICAL_MS, 10 * 60 * 1000),
    warning: parsePositiveInt(process.env.TNF_SUPERADMIN_NOTIFY_DEDUPE_WARNING_MS, 20 * 60 * 1000),
    info: parsePositiveInt(process.env.TNF_SUPERADMIN_NOTIFY_DEDUPE_INFO_MS, 60 * 60 * 1000),
  };
  const retries = parsePositiveInt(process.env.TNF_SUPERADMIN_NOTIFY_RETRIES, 2);
  const backoffMs = parsePositiveInt(process.env.TNF_SUPERADMIN_NOTIFY_BACKOFF_MS, 1500);
  const timeoutMs = parsePositiveInt(process.env.TNF_SUPERADMIN_NOTIFY_TIMEOUT_MS, 10000);
  const hermesCommandTimeoutMs = parsePositiveInt(
    process.env.TNF_SUPERADMIN_HERMES_TIMEOUT_MS,
    25000
  );
  const log = typeof options.log === 'function' ? options.log : () => {};

  const forgeHubUrl = (process.env.TNF_SUPERADMIN_FORGE_HUB_URL || process.env.FORGE_HUB_URL || 'http://127.0.0.1:9900').replace(/\/+$/, '');
  const forgeTargets = mergeTargets(
    resolveForgeTargetsFromEnv(),
    discoverForgeTargetsFromAllowlist()
  );
  const forgeToken =
    process.env.HUB_API_TOKEN ||
    process.env.TNF_SUPERADMIN_FORGE_HUB_API_TOKEN ||
    loadTokenFromFile(path.join(os.homedir(), '.forge-hub', 'api-token'));

  const telegramToken = discoverTelegramToken();
  const telegramChatId = discoverTelegramChatId();
  const includeHermesTelegramFallback = !telegramToken || !telegramChatId;

  const twilioSid = process.env.TNF_SUPERADMIN_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || '';
  const twilioAuth = process.env.TNF_SUPERADMIN_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '';
  const smsFrom = process.env.TNF_SUPERADMIN_SMS_FROM || process.env.TWILIO_SMS_FROM || '';
  const smsTo = process.env.TNF_SUPERADMIN_SMS_TO || process.env.TWILIO_SMS_TO || '';
  const whatsappFrom = process.env.TNF_SUPERADMIN_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_FROM || '';
  const whatsappTo = process.env.TNF_SUPERADMIN_WHATSAPP_TO || process.env.TWILIO_WHATSAPP_TO || '';

  const messengerToken =
    process.env.TNF_SUPERADMIN_MESSENGER_PAGE_ACCESS_TOKEN ||
    process.env.MESSENGER_PAGE_ACCESS_TOKEN ||
    '';
  const messengerRecipient =
    process.env.TNF_SUPERADMIN_MESSENGER_RECIPIENT_ID ||
    process.env.MESSENGER_RECIPIENT_ID ||
    '';

  const webhookUrls = String(process.env.TNF_SUPERADMIN_WEBHOOK_URLS || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  async function sendForgeHub(text) {
    if (!forgeTargets.length) return { skipped: true, reason: 'no-forge-targets' };
    const headers = forgeToken ? { Authorization: `Bearer ${forgeToken}` } : {};
    const results = [];
    for (const target of forgeTargets) {
      const response = await postJson(
        `${forgeHubUrl}/send`,
        {
          channel: target.channel,
          to: target.to,
          text,
        },
        headers,
        timeoutMs
      );
      if (!response.ok || !response.body || response.body.success !== true) {
        throw new Error(
          `forge-hub send failed channel=${target.channel} status=${response.status} body=${String(
            response.rawBody || ''
          ).slice(0, 160)}`
        );
      }
      results.push({ channel: target.channel, to: target.to, status: response.status });
    }
    return results;
  }

  async function sendTelegram(text) {
    if (!telegramToken || !telegramChatId) return { skipped: true, reason: 'telegram-not-configured' };
    const response = await postJson(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      { chat_id: telegramChatId, text },
      {},
      timeoutMs
    );
    if (!response.ok || !response.body || response.body.ok !== true) {
      throw new Error(`telegram send failed status=${response.status} body=${String(response.rawBody || '').slice(0, 160)}`);
    }
    return { chatId: telegramChatId, status: response.status };
  }

  async function sendTwilioMessage(from, to, text, mode) {
    if (!twilioSid || !twilioAuth || !from || !to) {
      return { skipped: true, reason: `twilio-${mode}-not-configured` };
    }
    const auth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
    const response = await postForm(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`,
      {
        From: from,
        To: to,
        Body: text,
      },
      {
        Authorization: `Basic ${auth}`,
      },
      timeoutMs
    );
    if (!response.ok) {
      throw new Error(`twilio ${mode} send failed status=${response.status} body=${String(response.rawBody || '').slice(0, 160)}`);
    }
    return { to, status: response.status };
  }

  async function sendMessenger(text) {
    if (!messengerToken || !messengerRecipient) {
      return { skipped: true, reason: 'messenger-not-configured' };
    }
    const response = await postJson(
      `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(messengerToken)}`,
      {
        recipient: { id: messengerRecipient },
        messaging_type: 'MESSAGE_TAG',
        tag: 'ACCOUNT_UPDATE',
        message: { text },
      },
      {},
      timeoutMs
    );
    if (!response.ok || (response.body && response.body.error)) {
      throw new Error(`messenger send failed status=${response.status} body=${String(response.rawBody || '').slice(0, 160)}`);
    }
    return { recipient: messengerRecipient, status: response.status };
  }

  async function sendWebhooks(payload) {
    if (!webhookUrls.length) return { skipped: true, reason: 'no-webhook-targets' };
    const results = [];
    for (const url of webhookUrls) {
      const response = await postJson(url, payload, {}, timeoutMs);
      if (!response.ok) {
        throw new Error(`webhook send failed url=${url} status=${response.status}`);
      }
      results.push({ url, status: response.status });
    }
    return results;
  }

  async function sendHermes(text) {
    const configuredTargets = resolveHermesTargetsFromEnv();
    const discoveredTargets = await discoverHermesTargets({
      includeTelegram: includeHermesTelegramFallback,
    });
    const targets = Array.from(new Set([...configuredTargets, ...discoveredTargets]));
    if (!targets.length) return { skipped: true, reason: 'no-hermes-targets' };

    const results = [];
    const failures = [];
    for (const target of targets) {
      const args = ['send', '--to', target, '--quiet', text];
      try {
        const { stdout } = await execFileAsync('hermes', args, {
          maxBuffer: 1024 * 1024 * 4,
          timeout: hermesCommandTimeoutMs,
        });
        results.push({
          target,
          output: String(stdout || '').trim().slice(0, 200),
        });
      } catch (error) {
        failures.push({
          target,
          error: String(error && error.message ? error.message : error),
        });
      }
    }
    if (results.length === 0) {
      throw new Error(
        `hermes delivery failed for all targets: ${failures
          .map((failure) => `${failure.target}: ${failure.error}`)
          .join(' | ')}`
      );
    }
    return { delivered: results, failures };
  }

  async function notify(input = {}) {
    if (!enabled) {
      return {
        sent: false,
        skipped: 'disabled',
      };
    }

    const now = new Date();
    const severity = ['critical', 'warning', 'info'].includes(String(input.severity || '').toLowerCase())
      ? String(input.severity).toLowerCase()
      : 'warning';
    const code = String(input.code || 'tnf-super-admin-escalation');
    const message = String(input.message || 'TNF escalation signal emitted');
    const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : {};
    const timestamp = now.toISOString();
    const dedupeKey = String(input.dedupeKey || `${code}:${sha1(message)}`);
    const dedupeMs = dedupeMsBySeverity[severity] || dedupeMsBySeverity.warning;
    const dedupeState = loadDedupeState(statePath);
    const lastSentAt = parsePositiveInt(dedupeState.sent[dedupeKey]?.sentAtMs, 0);
    const ageMs = lastSentAt > 0 ? Date.now() - lastSentAt : null;

    if (!input.force && lastSentAt > 0 && ageMs !== null && ageMs < dedupeMs) {
      return {
        sent: false,
        skipped: 'deduped',
        dedupeKey,
        dedupeRemainingMs: dedupeMs - ageMs,
      };
    }

    const event = {
      severity,
      code,
      message,
      metadata,
      timestamp,
      host,
      actorId: String(input.actorId || 'tnf-director'),
    };
    const text = buildMessage(event, host);

    fs.mkdirSync(stateDir, { recursive: true });
    fs.mkdirSync(outboxDir, { recursive: true });
    const outboxPath = path.join(outboxDir, `${timestamp.replace(/[:]/g, '-')}-${slug(dedupeKey)}.json`);

    const envelope = {
      event,
      dedupeKey,
      attempts: [],
      sent: false,
      createdAt: timestamp,
    };

    const attempts = [];
    const runAttempt = async (channelName, fn, overrideRetries = null) => {
      const retriesToUse = Number.isInteger(overrideRetries) ? overrideRetries : retries;
      try {
        const result = await sendWithRetries(fn, retriesToUse, backoffMs);
        const skipped = Boolean(result && typeof result === 'object' && result.skipped);
        const delivered = !skipped && !(Array.isArray(result) && result.length === 0);
        attempts.push({
          channel: channelName,
          ok: true,
          skipped,
          result,
        });
        return delivered;
      } catch (error) {
        attempts.push({
          channel: channelName,
          ok: false,
          skipped: false,
          error: String(error && error.message ? error.message : error),
        });
        return false;
      }
    };

    writeJson(outboxPath, envelope);
    const forgeSent = await runAttempt('forge-hub', () => sendForgeHub(text));
    const telegramSent = await runAttempt('telegram-direct', () => sendTelegram(text));
    const smsSent = await runAttempt('sms', () => sendTwilioMessage(smsFrom, smsTo, text, 'sms'));
    const whatsappSent = await runAttempt('whatsapp', () => sendTwilioMessage(whatsappFrom, whatsappTo, text, 'whatsapp'));
    const messengerSent = await runAttempt('messenger', () => sendMessenger(text));
    const webhooksSent = await runAttempt('webhooks', () =>
      sendWebhooks({
        type: 'tnf.super_admin.escalation',
        event,
        text,
      })
    );
    const hermesSent = await runAttempt('hermes', () => sendHermes(text), 0);

    const sent = [forgeSent, telegramSent, smsSent, whatsappSent, messengerSent, webhooksSent, hermesSent].some(Boolean);
    if (sent) {
      dedupeState.sent[dedupeKey] = {
        sentAt: timestamp,
        sentAtMs: Date.now(),
        severity,
        code,
      };
      writeJson(statePath, dedupeState);
    }

    const output = {
      ...envelope,
      attempts,
      sent,
      finalizedAt: new Date().toISOString(),
    };
    writeJson(outboxPath, output);
    log('Super Admin fanout dispatch complete', {
      dedupeKey,
      sent,
      attempts: attempts.map((attempt) => ({ channel: attempt.channel, ok: attempt.ok })),
    });

    return {
      sent,
      dedupeKey,
      attempts,
      outboxPath,
    };
  }

  return {
    notify,
  };
}

module.exports = {
  createSuperAdminFanout,
};
