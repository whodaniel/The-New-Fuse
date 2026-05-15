#!/usr/bin/env node

/**
 * TNF REDIS-NATIVE RELAY MONITOR (v7)
 *
 * Safe default behavior:
 * - no focus stealing
 * - no ctrl+c pre-injection
 * - prompt injection disabled by default
 */

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { RedisAgentClient } = require(path.join(__dirname, 'lib', 'redis-agent-client.cjs'));

const execFileAsync = promisify(execFile);
const ALIAS_SOURCE_FILE = path.join(
  process.env.HOME,
  '.tnf',
  'local-subdirector',
  'state',
  'local-subdirector-heartbeat.json'
);
const ALLOW_PROMPT_INJECTION =
  String(process.env.TNF_RELAY_MONITOR_ALLOW_PROMPT_INJECTION || 'false').toLowerCase() === 'true';
const INTERACTIVE_SAFE_MODE_ENV = process.env.TNF_INTERACTIVE_SAFE_MODE || '';
const INTERACTIVE_SAFE_MODE_FILE =
  process.env.TNF_INTERACTIVE_SAFE_MODE_FILE ||
  path.join(process.env.HOME, '.tnf', 'flags', 'interactive-safe-mode');

function log(message, metadata = {}) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), message, role: 'Relay-Monitor', ...metadata }));
}

function isInteractiveSafeModeEnabled() {
  if (String(INTERACTIVE_SAFE_MODE_ENV).trim()) {
    return String(INTERACTIVE_SAFE_MODE_ENV).toLowerCase() !== 'false';
  }
  return fs.existsSync(INTERACTIVE_SAFE_MODE_FILE);
}

async function readTerminalContents(windowId) {
  const { stdout } = await execFileAsync('osascript', [
    '-e',
    `tell application "Terminal" to contents of selected tab of window id ${Number(windowId)}`,
  ]);
  return String(stdout || '');
}

function getLastVisibleLine(contents) {
  const lines = String(contents || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\u001b\[[0-9;]*m/g, ''));
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (line && line.trim()) return line;
  }
  return '';
}

function isTypingInTerminal(contents) {
  const line = getLastVisibleLine(contents);
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.includes('tab to queue message')) return true;
  if (trimmed.startsWith('› TNF wake') || trimmed.startsWith('› TNF heartbeat')) return false;
  if (trimmed.startsWith('/')) return true;
  const promptMatch = line.match(/(?:[%$#>❯])\s*(.*)$/);
  if (!promptMatch) return false;
  const tail = String(promptMatch[1] || '').trim();
  if (!tail) return false;
  if (tail.startsWith('TNF wake') || tail.startsWith('TNF heartbeat')) return false;
  return true;
}

async function terminalDoScript(windowId, command) {
  await execFileAsync('osascript', [
    '-e',
    `tell application "Terminal" to do script "${command}" in selected tab of window id ${Number(windowId)}`,
  ]);
}

async function submitPromptIfNeeded(windowId, marker, pendingPrefix) {
  let contents = await readTerminalContents(windowId);
  let pending =
    contents.includes(marker) ||
    contents.includes(pendingPrefix) ||
    contents.includes('tab to queue message');

  if (!pending) return { submitted: false, enterAttempts: 0, pending: false };

  let submitted = false;
  let enterAttempts = 0;
  while (pending && enterAttempts < 2) {
    await terminalDoScript(windowId, ' ');
    submitted = true;
    enterAttempts += 1;
    await new Promise((r) => setTimeout(r, 500));
    contents = await readTerminalContents(windowId);
    pending =
      contents.includes(marker) ||
      contents.includes(pendingPrefix) ||
      contents.includes('tab to queue message');
  }

  return { submitted, enterAttempts, pending };
}

function buildCoordinationPoll(sessions, targetSession) {
  const peers = (Array.isArray(sessions) ? sessions : [])
    .filter((session) => session?.agentId && session.agentId !== targetSession.agentId)
    .map((session) => ({
      agentId: session.agentId,
      tty: session.tty || null,
      windowId: session.windowId || null,
      status: session.status || (session.busy ? 'active' : 'idle'),
      cwd: session.cwd || null,
    }));

  return {
    polledAt: new Date().toISOString(),
    peerCount: peers.length,
    peers: peers.slice(0, 8),
  };
}

async function inject(agentId, prompt, pingId) {
  try {
    if (!fs.existsSync(ALIAS_SOURCE_FILE)) {
      return { submitted: false, method: 'skipped', skippedReason: 'alias-source-missing' };
    }

    const raw = fs.readFileSync(ALIAS_SOURCE_FILE, 'utf8');
    const sessions = JSON.parse(raw).sessions || [];
    const session = sessions.find((s) => s.agentId === agentId);
    if (!(session?.tty && session?.windowId)) {
      return { submitted: false, method: 'skipped', skippedReason: 'terminal-target-unavailable' };
    }

    const coordinationPoll = buildCoordinationPoll(sessions, session);
    if (isInteractiveSafeModeEnabled()) {
      return {
        submitted: false,
        method: 'skipped-safety-hold',
        skippedReason: 'interactive-safe-mode',
        coordinationPoll,
      };
    }
    if (!ALLOW_PROMPT_INJECTION) {
      return {
        submitted: false,
        method: 'skipped-policy-hold',
        skippedReason: 'prompt-injection-disabled',
        coordinationPoll,
      };
    }

    const preflightContents = await readTerminalContents(Number(session.windowId));
    if (isTypingInTerminal(preflightContents)) {
      return {
        submitted: false,
        method: 'skipped-typing',
        skippedReason: 'typing-in-progress',
        activeInputLine: getLastVisibleLine(preflightContents).slice(-160),
        coordinationPoll,
      };
    }

    log('Injecting prompt', { agentId, tty: session.tty, pingId });
    const escapedPrompt = String(prompt).replace(/[\\$"]/g, '\\$&');
    await terminalDoScript(session.windowId, `${escapedPrompt}\\n`);
    await new Promise((r) => setTimeout(r, 500));
    const res = await submitPromptIfNeeded(session.windowId, String(prompt).slice(0, 20), '› TNF');

    return {
      submitted: !res.pending,
      method: 'terminal-do-script-silent',
      skippedReason: res.pending ? 'pending-after-submit' : null,
      enterAttempts: res.enterAttempts,
      pending: res.pending,
      coordinationPoll,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log('Injection failed', { error: message, agentId, pingId });
    return { submitted: false, method: 'terminal-do-script-silent', skippedReason: 'injection-error', error: message };
  }
}

async function publishActivity(agentId, activityType, metadata) {
  try {
    const client = new RedisAgentClient();
    await client.initialize();
    await client.publisher.publish(
      'agent:activity',
      JSON.stringify({
        agentId,
        activityType,
        metadata,
        timestamp: new Date().toISOString(),
      })
    );
    await client.cleanup();
  } catch (_error) {
    // Intentionally ignore activity publish errors
  }
}

async function main() {
  log('Starting Redis-Native Monitor', {
    allowPromptInjection: ALLOW_PROMPT_INJECTION,
    interactiveSafeMode: isInteractiveSafeModeEnabled(),
    interactiveSafeModeFile: INTERACTIVE_SAFE_MODE_FILE,
  });

  const client = new RedisAgentClient();
  await client.initialize();
  client.onMessage('tnf:bus:ingress', async (envelope) => {
    if (envelope.type === 'event' && envelope.payload?.eventType === 'wake_ping') {
      const data = envelope.payload.data || {};
      if (data.targetAgentId && data.customPrompt) {
        const result = await inject(data.targetAgentId, data.customPrompt, data.pingId);
        await publishActivity(
          data.targetAgentId,
          result && result.submitted ? 'prompt_injected' : 'prompt_skipped',
          {
            pingId: data.pingId,
            method: result?.method || 'terminal-do-script-silent',
            submitted: Boolean(result?.submitted),
            skippedReason: result?.skippedReason || null,
            coordination: result?.coordinationPoll || null,
          }
        );
      }
    }
  });

  log('Subscribed to tnf:bus:ingress');
}

main().catch((err) => {
  log('Monitor Fatal Error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
