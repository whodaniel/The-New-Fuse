#!/usr/bin/env node

/**
 * TNF REDIS-NATIVE RELAY MONITOR (v7)
 * 
 * SILENT & NON-DISRUPTIVE: Performs background injections only.
 * Does not steal window focus or use 'activate'.
 */

const { RedisAgentClient } = require('./lib/redis-agent-client.cjs');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Configuration
const ALIAS_SOURCE_FILE = path.join(process.env.HOME, '.tnf', 'local-subdirector', 'state', 'local-subdirector-heartbeat.json');
const ALLOW_PROMPT_INJECTION =
  String(process.env.TNF_RELAY_MONITOR_ALLOW_PROMPT_INJECTION || 'false').toLowerCase() === 'true';
const INTERACTIVE_SAFE_MODE_ENV = process.env.TNF_INTERACTIVE_SAFE_MODE || '';
const INTERACTIVE_SAFE_MODE_FILE =
  process.env.TNF_INTERACTIVE_SAFE_MODE_FILE ||
  path.join(process.env.HOME, '.tnf', 'flags', 'interactive-safe-mode');

function log(message, metadata = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, message, role: 'Relay-Monitor', ...metadata }));
}

function isInteractiveSafeModeEnabled() {
  if (String(INTERACTIVE_SAFE_MODE_ENV || '').trim()) {
    return String(INTERACTIVE_SAFE_MODE_ENV).toLowerCase() !== 'false';
  }
  return fs.existsSync(INTERACTIVE_SAFE_MODE_FILE);
}

async function readTerminalContents(windowId) {
  const { stdout } = await execFileAsync('osascript', [
    '-e', `tell application "Terminal" to contents of selected tab of window id ${Number(windowId)}`,
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
  if (trimmed.includes('tab to queue message')) return false;
  if (trimmed.startsWith('› TNF wake') || trimmed.startsWith('› TNF heartbeat') || trimmed.startsWith('› TNF delegate')) {
    return false;
  }
  if (trimmed.startsWith('/')) return true;
  const promptMatch = line.match(/(?:[%$#>❯])\s*(.*)$/);
  if (!promptMatch) return false;
  const tail = String(promptMatch[1] || '').trim();
  if (!tail) return false;
  if (tail.startsWith('TNF wake') || tail.startsWith('TNF heartbeat') || tail.startsWith('TNF delegate')) {
    return false;
  }
  return true;
}

function toTaskHint(foregroundArgs, foregroundCommand) {
  const text = String(foregroundArgs || foregroundCommand || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function buildCoordinationPoll(sessions, targetSession) {
  const all = Array.isArray(sessions) ? sessions : [];
  const targetTaskHint = toTaskHint(targetSession.foregroundArgs, targetSession.foregroundCommand);
  const peers = all
    .filter((session) => session && session.agentId && session.agentId !== targetSession.agentId)
    .map((session) => ({
      agentId: session.agentId,
      tty: session.tty || null,
      windowId: session.windowId || null,
      status: session.status || (session.busy ? 'active' : 'idle'),
      cwd: session.cwd || null,
      taskHint: toTaskHint(session.foregroundArgs, session.foregroundCommand),
    }));

  const sharedCwdActivePeers = peers.filter(
    (peer) =>
      peer.cwd &&
      targetSession.cwd &&
      peer.cwd === targetSession.cwd &&
      (peer.status === 'active' || peer.status === 'stalled')
  );

  return {
    polledAt: new Date().toISOString(),
    totalOpenTerminals: all.length,
    target: {
      agentId: targetSession.agentId,
      tty: targetSession.tty || null,
      status: targetSession.status || (targetSession.busy ? 'active' : 'idle'),
      cwd: targetSession.cwd || null,
      taskHint: targetTaskHint,
    },
    peerCount: peers.length,
    peers: peers.slice(0, 8),
    conflictRisk:
      sharedCwdActivePeers.length > 0
        ? {
            code: 'shared-cwd-active-peers',
            reason: 'Multiple active agent terminals are already working in the same cwd.',
            peerAgentIds: sharedCwdActivePeers.map((peer) => peer.agentId),
            cwd: targetSession.cwd || null,
          }
        : null,
  };
}

async function silentSubmit(windowId) {
  // Use background-safe 'do script' to clear composer
  await execFileAsync('osascript', [
    '-e', `tell application "Terminal" to do script " " in selected tab of window id ${Number(windowId)}`,
  ]);
}

async function submitPromptIfNeeded(windowId, marker, pendingPrefix) {
  let contents = await readTerminalContents(windowId);
  let hasQueueHint = contents.includes('tab to queue message');
  let hasMarker = contents.includes(marker) || contents.includes(pendingPrefix);
  let pending = hasMarker || hasQueueHint;

  if (!pending) return { submitted: false, enterAttempts: 0, pending: false };

  let submitted = false;
  let enterAttempts = 0;

  while (pending && enterAttempts < 2) {
    await silentSubmit(windowId);
    submitted = true;
    enterAttempts += 1;
    await new Promise(r => setTimeout(r, 500));
    contents = await readTerminalContents(windowId);
    pending = contents.includes(marker) || contents.includes(pendingPrefix) || contents.includes('tab to queue message');
  }

  return { submitted, enterAttempts, pending };
}

async function inject(agentId, prompt, pingId) {
  try {
    if (!fs.existsSync(ALIAS_SOURCE_FILE)) {
      return {
        submitted: false,
        method: 'terminal-do-script-silent',
        skippedReason: 'alias-source-missing',
      };
    }
    const raw = fs.readFileSync(ALIAS_SOURCE_FILE, 'utf8');
    const sessions = JSON.parse(raw).sessions;
    const session = sessions.find(s => s.agentId === agentId);
    
    if (!(session?.tty && session?.windowId)) {
      return {
        submitted: false,
        method: 'terminal-do-script-silent',
        skippedReason: 'terminal-target-unavailable',
      };
    }

    const poll = buildCoordinationPoll(sessions, session);
    if (isInteractiveSafeModeEnabled()) {
      log('Injection skipped; interactive safe mode enabled', {
        agentId,
        pingId,
        peerCount: poll.peerCount,
        safeModeFile: INTERACTIVE_SAFE_MODE_FILE,
      });
      return {
        submitted: false,
        method: 'skipped-safety-hold',
        skippedReason: 'interactive-safe-mode',
        coordinationPoll: poll,
      };
    }

    if (!ALLOW_PROMPT_INJECTION) {
      log('Injection skipped; prompt injection policy disabled', {
        agentId,
        pingId,
        peerCount: poll.peerCount,
      });
      return {
        submitted: false,
        method: 'skipped-policy-hold',
        skippedReason: 'prompt-injection-disabled',
        coordinationPoll: poll,
      };
    }

    if (poll.conflictRisk) {
      log('Injection skipped; coordination conflict risk', {
        agentId,
        pingId,
        conflictRisk: poll.conflictRisk,
        peerCount: poll.peerCount,
      });
      return {
        submitted: false,
        method: 'skipped-coordination-hold',
        skippedReason: 'coordination-conflict-risk',
        coordinationPoll: poll,
      };
    }

    const preflightContents = await readTerminalContents(Number(session.windowId));
    if (isTypingInTerminal(preflightContents)) {
      log('Injection skipped; typing in progress', {
        agentId,
        windowId: Number(session.windowId),
        pingId,
        activeInputLine: getLastVisibleLine(preflightContents).slice(-160),
      });
      return {
        submitted: false,
        method: 'skipped-typing',
        skippedReason: 'typing-in-progress',
        activeInputLine: getLastVisibleLine(preflightContents).slice(-160),
        coordinationPoll: poll,
      };
    }

    log('Injecting prompt', { agentId, tty: session.tty, pingId });
    
    // Injection: 'do script' does not steal focus
    const escapedPrompt = prompt.replace(/[\\"]/g, '\\$&');
    await execFileAsync('osascript', [
      '-e', `tell application "Terminal" to do script "${escapedPrompt}\\n" in selected tab of window id ${Number(session.windowId)}`,
    ]);
    
    await new Promise(r => setTimeout(r, 500));
    const res = await submitPromptIfNeeded(session.windowId, prompt.slice(0, 20), '› TNF');
    return {
      submitted: !res.pending,
      method: 'terminal-do-script-silent',
      skippedReason: res.pending ? 'pending-after-submit' : null,
      enterAttempts: res.enterAttempts,
      pending: res.pending,
      coordinationPoll: poll,
    };
  } catch (e) {
    log('Injection failed', { error: e.message });
    return {
      submitted: false,
      method: 'terminal-do-script-silent',
      skippedReason: 'injection-error',
      error: e.message,
    };
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
  } catch (_error) {}
}

async function main() {
  log('Starting Silent Redis-Native Monitor', {
    allowPromptInjection: ALLOW_PROMPT_INJECTION,
    interactiveSafeMode: isInteractiveSafeModeEnabled(),
    interactiveSafeModeFile: INTERACTIVE_SAFE_MODE_FILE,
  });
  const client = new RedisAgentClient();
  await client.initialize();

  client.onMessage('tnf:bus:ingress', async (envelope) => {
    if (envelope.type === 'event' && envelope.payload?.eventType === 'wake_ping') {
      const data = envelope.payload.data;
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

main().catch(err => {
  process.exit(1);
});
