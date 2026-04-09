#!/usr/bin/env node

const { createHash } = require('crypto');
const { execFile } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const KNOWN_SHELLS = new Set(['bash', 'fish', 'sh', 'zsh']);
const AGENT_COMMAND_HINTS = ['codex', 'claude', 'gemini', 'goose', 'aider'];

const config = {
  actorId: process.env.LOCAL_SUBDIRECTOR_ACTOR_ID || 'tnf-local-subdirector',
  // Identity and Trust Protocol
  nftId: process.env.LOCAL_SUBDIRECTOR_NFT_ID || 'unregistered',
  walletAddress: process.env.LOCAL_SUBDIRECTOR_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
  signingPrivateKeyPem: process.env.LOCAL_SUBDIRECTOR_SIGNING_KEY_PEM || '',
  encryptionPrivateKeyPem: process.env.LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_PEM || '',
  intervalMs: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_INTERVAL_MS, 30000),
  stallThresholdMs: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_STALL_THRESHOLD_MS, 180000),
  idleThresholdMs: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_IDLE_THRESHOLD_MS, 300000),
  maxCycles: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_MAX_CYCLES, 0),
  wakePingCooldownMs: parsePositiveInt(
    process.env.LOCAL_SUBDIRECTOR_WAKE_PING_COOLDOWN_MS,
    120000
  ),
  contentTailChars: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_CONTENT_TAIL_CHARS, 4000),
  relayUrl: process.env.LOCAL_SUBDIRECTOR_RELAY_URL || 'ws://localhost:3000/ws',
  relayChannel: process.env.LOCAL_SUBDIRECTOR_RELAY_CHANNEL || 'fuse-activity-log',
  relayOutboxDir: process.env.LOCAL_SUBDIRECTOR_RELAY_OUTBOX_DIR || '/tmp/thefuse/terminal',
  stateDir:
    process.env.LOCAL_SUBDIRECTOR_STATE_DIR ||
    path.join(os.homedir(), '.tnf', 'local-subdirector', 'state'),
};

const state = new Map();
let cycle = 0;
let loopTimer = null;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeTty(tty) {
  return String(tty || '').replace(/^\/dev\//, '');
}

function getSessionKey(terminal) {
  return terminal.tty ? `tty:${normalizeTty(terminal.tty)}` : `window:${terminal.windowId}`;
}

function getAgentId(terminal) {
  const raw = terminal.tty ? normalizeTty(terminal.tty) : `window-${terminal.windowId}`;
  return `tnf-local-terminal-${raw.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function hashSignature(payload) {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

function isAgentCommand(commandName, args) {
  const haystack = `${commandName || ''} ${args || ''}`.toLowerCase();
  return AGENT_COMMAND_HINTS.some((hint) => haystack.includes(hint));
}

function isAgentLike(foregroundCommand, foregroundArgs, contentsTail) {
  const haystacks = [
    String(foregroundCommand || '').toLowerCase(),
    String(foregroundArgs || '').toLowerCase(),
    String(contentsTail || '').toLowerCase(),
  ];
  return AGENT_COMMAND_HINTS.some((hint) => haystacks.some((value) => value.includes(hint)));
}

function isInteractiveReady(contentsTail) {
  const haystack = String(contentsTail || '').toLowerCase();
  if (!haystack) return false;
  return [
    'type your message or @path/to/file',
    'summarize recent commits',
    'improve documentation in @filename',
    'write tests for @filename',
    'use /skills to list available skills',
    '? for shortcuts',
    'context left',
    'interactive shell awaiting input',
    'tab to focus',
    'tab to queue message',
  ].some((hint) => haystack.includes(hint));
}

function classifyStatus({ agentLike, busy, activityAgeMs, interactiveReady }) {
  if (!agentLike) return 'observed';
  if (interactiveReady) return 'active';
  if (busy && activityAgeMs >= config.stallThresholdMs) return 'stalled';
  if (busy || activityAgeMs < config.idleThresholdMs) return 'active';
  return 'idle';
}

async function ensureDirectories() {
  await fsp.mkdir(config.stateDir, { recursive: true });
  await fsp.mkdir(config.relayOutboxDir, { recursive: true });
}

function resolvePath(fileName) {
  return path.join(config.stateDir, fileName);
}

async function writeHeartbeat(payload) {
  await fsp.writeFile(resolvePath('local-subdirector-heartbeat.json'), JSON.stringify(payload, null, 2));
  await fsp.writeFile(resolvePath('local-subdirector-heartbeat.md'), buildMarkdown(payload));
}

/**
 * Signal Trust Protocol Integration
 */
async function syncWithSuperDirector() {
  if (config.nftId === 'unregistered') {
    console.warn('[local-subdirector] cloud sync disabled: NFT identity not configured.');
    return;
  }
  // This is where the Local Sub-Director would connect to the Cloud Redis Bridge
  // and subscribe to Master Clock signals.
  console.log(`[local-subdirector] cloud sync initialized for NFT: ${config.nftId}`);
}

function buildMarkdown(payload) {
  const lines = [
    '# Local Terminal Sub-Director Heartbeat',
    '',
    `Generated: ${payload.generatedAt}`,
    `Actor: ${payload.actor.id}`,
    `Status: ${payload.status}`,
    `Cycle: ${payload.cycle}`,
    '',
    '## Summary',
    '',
    `- Observed sessions: ${payload.summary.observedSessions}`,
    `- Agent sessions: ${payload.summary.agentSessions}`,
    `- Active: ${payload.summary.activeSessions}`,
    `- Idle: ${payload.summary.idleSessions}`,
    `- Stalled: ${payload.summary.stalledSessions}`,
    `- Wake pings emitted: ${payload.summary.wakePingsEmitted}`,
    '',
    '## Functional Gaps',
    '',
    ...payload.functionalGaps.map((gap) => `- ${gap}`),
    '',
    '## Recommendations',
    '',
    ...payload.recommendations.map((item) => `- ${item}`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function pollTerminalWindows(contentTailChars) {
  if (process.platform !== 'darwin') return [];

  const script = `
    const Terminal = Application('Terminal');
    const windows = [];
    Terminal.windows().forEach((window) => {
      try {
        const tab = window.selectedTab();
        const contents = String(tab.contents() || '');
        windows.push({
          windowId: Number(window.id()),
          tty: String(tab.tty() || '') || null,
          busy: Boolean(tab.busy()),
          customTitle: String(tab.customTitle() || '') || null,
          contentsTail: contents.length > ${contentTailChars} ? contents.slice(-${contentTailChars}) : contents
        });
      } catch (_error) {}
    });
    JSON.stringify(windows);
  `;

  try {
    const { stdout } = await execFileAsync('osascript', ['-l', 'JavaScript', '-e', script], {
      maxBuffer: 16 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`[local-subdirector] terminal polling failed: ${String(error.message || error)}`);
    return [];
  }
}

async function collectProcessTable() {
  try {
    const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,ppid=,tty=,comm=,args='], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/);
        if (!match) return null;
        const command = match[4];
        return {
          pid: Number(match[1]),
          ppid: Number(match[2]),
          tty: String(match[3] || ''),
          command,
          commandName: path.basename(command).replace(/^-+/, ''),
          args: String(match[5] || command),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error(`[local-subdirector] process inventory failed: ${String(error.message || error)}`);
    return [];
  }
}

function collectDescendants(rootPid, processTable) {
  const childrenByParent = new Map();
  for (const process of processTable) {
    const bucket = childrenByParent.get(process.ppid) || [];
    bucket.push(process);
    childrenByParent.set(process.ppid, bucket);
  }

  const descendants = [];
  const visit = (pid) => {
    const children = childrenByParent.get(pid) || [];
    for (const child of children) {
      descendants.push(child);
      visit(child.pid);
    }
  };
  visit(rootPid);
  return descendants;
}

function resolveProcessContext(terminal, processTable) {
  const tty = normalizeTty(terminal.tty);
  const ttyProcesses = processTable.filter((process) => normalizeTty(process.tty) === tty);
  const shell = ttyProcesses.find((process) => KNOWN_SHELLS.has(process.commandName)) || null;

  if (!shell) {
    const fallback = ttyProcesses.sort((left, right) => right.pid - left.pid)[0] || null;
    return {
      shellPid: fallback ? fallback.pid : null,
      foregroundPid: fallback ? fallback.pid : null,
      foregroundCommand: fallback ? fallback.commandName : null,
      foregroundArgs: fallback ? fallback.args : null,
    };
  }

  const descendants = collectDescendants(shell.pid, ttyProcesses);
  const preferredForeground =
    descendants.find((process) => isAgentCommand(process.commandName, process.args)) ||
    descendants.sort((left, right) => right.pid - left.pid)[0] ||
    shell;

  return {
    shellPid: shell.pid,
    foregroundPid: preferredForeground.pid,
    foregroundCommand: preferredForeground.commandName,
    foregroundArgs: preferredForeground.args,
  };
}

async function resolveCwd(shellPid) {
  try {
    const { stdout } = await execFileAsync('lsof', ['-a', '-d', 'cwd', '-p', String(shellPid)], {
      maxBuffer: 1024 * 1024,
    });
    const line = stdout
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .find((entry) => /\scwd\s/.test(entry));
    if (!line) return null;
    const match = line.match(/cwd\s+DIR\s+\S+\s+\S+\s+\S+\s+(.+)$/);
    return match ? match[1] : null;
  } catch (_error) {
    return null;
  }
}

async function emitWakePing(nowIso, sessionKey, sessionState, terminal) {
  const previousWakeAt = sessionState.lastWakePingAt
    ? new Date(sessionState.lastWakePingAt).getTime()
    : 0;
  const nowMs = new Date(nowIso).getTime();
  if (previousWakeAt && nowMs - previousWakeAt < config.wakePingCooldownMs) {
    return null;
  }

  const wakeId = `wake-${sessionState.agentId}-${Date.now()}`;
  await publishWakePingToRelay({
    wakeId,
    nowIso,
    sessionKey,
    sessionState,
    terminal,
  });

  const record = {
    id: wakeId,
    createdAt: nowIso,
    targetAgentId: sessionState.agentId,
    sessionKey,
    tty: terminal.tty,
    windowId: terminal.windowId,
    reason: 'stall-watchdog',
    transport: 'relay-ws',
    relayUrl: config.relayUrl,
    relayChannel: config.relayChannel,
  };
  await fsp.appendFile(resolvePath('local-subdirector-wake-events.jsonl'), `${JSON.stringify(record)}\n`);
  return record;
}

async function publishWakePingToRelay({ wakeId, nowIso, sessionKey, sessionState, terminal }) {
  const relayAgentId = `${config.actorId}-relay`;
  const directPayload = {
    type: 'MESSAGE_SEND',
    source: relayAgentId,
    channel: config.relayChannel,
    payload: {
      to: sessionState.agentId,
      content: `[WAKE_PING ${wakeId}] ${sessionState.agentId} stalled on ${sessionKey}`,
      messageType: 'event',
      metadata: {
        senderId: relayAgentId,
        eventType: 'wake_ping',
        pingId: wakeId,
        reason: 'stall-watchdog',
        targetAgentId: sessionState.agentId,
        sessionKey,
        tty: terminal.tty,
        windowId: terminal.windowId,
        sourceActorId: config.actorId,
      },
    },
  };
  const auditPayload = {
    type: 'MESSAGE_SEND',
    source: relayAgentId,
    channel: 'fuse-activity-log',
    payload: {
      to: 'broadcast',
      content: `[WAKE_PING ${wakeId}] ${sessionState.agentId} stalled on ${sessionKey}`,
      messageType: 'event',
      metadata: {
        senderId: relayAgentId,
        eventType: 'wake_ping_dispatched',
        pingId: wakeId,
        reason: 'stall-watchdog',
        targetAgentId: sessionState.agentId,
        sessionKey,
        tty: terminal.tty,
        windowId: terminal.windowId,
        sourceActorId: config.actorId,
        deliveryMode: 'direct',
      },
    },
  };

  await new Promise((resolve, reject) => {
    const socket = new WebSocket(config.relayUrl);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch (_error) {}
      reject(new Error(`relay publish timed out (${config.relayUrl})`));
    }, 5000);

    const finalize = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch (_closeError) {}
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      resolve();
    };

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'AGENT_REGISTER',
          source: relayAgentId,
          payload: {
            agent: {
              id: relayAgentId,
              name: 'Local Sub-Director',
              platform: 'daemon',
              status: 'active',
              capabilities: ['stall-defense', 'wake-publisher'],
              channels: [],
            },
          },
        })
      );
      socket.send(JSON.stringify(directPayload));
      socket.send(JSON.stringify(auditPayload));
      setTimeout(() => finalize(null), 150);
    };

    socket.onerror = (event) => {
      const error = event && typeof event.message === 'string' ? event.message : 'relay socket error';
      finalize(new Error(error));
    };
  });
}

function pruneMissingSessions(seenKeys) {
  for (const key of Array.from(state.keys())) {
    if (!seenKeys.has(key)) {
      state.delete(key);
    }
  }
}

async function scanOnce() {
  cycle += 1;
  await ensureDirectories();
  const now = new Date();
  const nowIso = now.toISOString();
  const terminals = await pollTerminalWindows(config.contentTailChars);
  const processTable = await collectProcessTable();
  const wakePings = [];
  const sessions = [];
  const seenKeys = new Set();

  for (const terminal of terminals) {
    const sessionKey = getSessionKey(terminal);
    seenKeys.add(sessionKey);
    const processContext = resolveProcessContext(terminal, processTable);
    const cwd = processContext.shellPid ? await resolveCwd(processContext.shellPid) : null;
    const agentLike = isAgentLike(
      processContext.foregroundCommand,
      processContext.foregroundArgs,
      terminal.contentsTail
    );
    const interactiveReady = isInteractiveReady(terminal.contentsTail);
    const signature = hashSignature({
      busy: terminal.busy,
      contentsTail: terminal.contentsTail,
      cwd,
      foreground: processContext.foregroundArgs,
    });

    const previous = state.get(sessionKey);
    const signatureChanged = !previous || previous.lastSignature !== signature;
    const nextState = previous
      ? {
          ...previous,
          lastSeenAt: nowIso,
          lastActivityAt: signatureChanged ? nowIso : previous.lastActivityAt,
          lastSignature: signature,
          noChangeCycles: signatureChanged ? 0 : previous.noChangeCycles + 1,
        }
      : {
          agentId: getAgentId(terminal),
          sessionKey,
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          lastActivityAt: nowIso,
          lastWakePingAt: null,
          lastSignature: signature,
          noChangeCycles: 0,
          wakePingCount: 0,
        };

    const activityAgeMs = Math.max(0, now.getTime() - new Date(nextState.lastActivityAt).getTime());
    const rawStatus = classifyStatus({
      agentLike,
      busy: terminal.busy,
      activityAgeMs,
      interactiveReady,
    });
    const status = rawStatus;

    if (status === 'stalled') {
      const wakePing = await emitWakePing(nowIso, sessionKey, nextState, terminal);
      if (wakePing) {
        nextState.lastWakePingAt = wakePing.createdAt;
        nextState.wakePingCount += 1;
        wakePings.push(wakePing);
      }
    }

    state.set(sessionKey, nextState);
    sessions.push({
      agentId: nextState.agentId,
      sessionKey,
      windowId: terminal.windowId,
      tty: terminal.tty,
      busy: terminal.busy,
      status,
      cwd,
      shellPid: processContext.shellPid,
      foregroundPid: processContext.foregroundPid,
      foregroundCommand: processContext.foregroundCommand,
      agentLike,
      interactiveReady,
      firstSeenAt: nextState.firstSeenAt,
      lastSeenAt: nextState.lastSeenAt,
      lastActivityAt: nextState.lastActivityAt,
      lastWakePingAt: nextState.lastWakePingAt,
      noChangeCycles: nextState.noChangeCycles,
      wakePingCount: nextState.wakePingCount,
      activityAgeMs,
      customTitle: terminal.customTitle,
    });
  }

  pruneMissingSessions(seenKeys);

  const summary = {
    observedSessions: sessions.length,
    agentSessions: sessions.filter((session) => session.agentLike).length,
    activeSessions: sessions.filter((session) => session.status === 'active').length,
    idleSessions: sessions.filter((session) => session.status === 'idle').length,
    stalledSessions: sessions.filter((session) => session.status === 'stalled').length,
      wakePingsEmitted: wakePings.length,
    };

  const payload = {
    generatedAt: nowIso,
    actor: {
      id: config.actorId,
      role: 'tnf-sub-director',
      lane: 'local-terminal-runtime',
    },
    status:
      summary.stalledSessions > 0 ? 'critical' : summary.agentSessions > 0 ? 'healthy' : 'warning',
    cycle,
    config,
    summary,
    sessions,
    wakePings,
    functionalGaps: [
      'Wake transport now uses direct TNF relay delivery, but terminal wake action still depends on resident per-agent relay consumers.',
      'Lane ownership still depends on separate coordination artifacts; this loop establishes liveness and stall defense, not semantic task understanding.',
      'Direct terminal prompt injection remains intentionally out-of-band and is not used as the default wake transport.',
    ],
    recommendations: [
      summary.stalledSessions > 0
        ? 'Keep the resident relay monitor running with per-agent aliases so each observed agent session receives direct wake coverage.'
        : 'Keep the local Sub-Director running so terminal heartbeats and wake queue stay current.',
      summary.idleSessions > 0
        ? 'Use idle sessions as assignable capacity through the local director once lane selection is wired.'
        : 'No idle terminal agent capacity is currently visible.',
    ],
  };

  await writeHeartbeat(payload);
}

async function main() {
  await scanOnce();
  await syncWithSuperDirector();
  console.log(`[local-subdirector] started interval=${config.intervalMs} stateDir=${config.stateDir}`);
  if (config.maxCycles > 0 && cycle >= config.maxCycles) {
    shutdown();
    return;
  }
  loopTimer = setInterval(() => {
    void scanOnce()
      .then(() => {
        if (config.maxCycles > 0 && cycle >= config.maxCycles) {
          shutdown();
        }
      })
      .catch((error) => {
        console.error(`[local-subdirector] scan failed: ${String(error.message || error)}`);
      });
  }, config.intervalMs);
}

function shutdown() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  console.error(`[local-subdirector] fatal: ${String(error.message || error)}`);
  process.exit(1);
});
