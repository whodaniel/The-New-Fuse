#!/usr/bin/env node

const { execFile } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'tnf-terminal-heartbeat-pulse', staleMs: 120000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}


const execFileAsync = promisify(execFile);

const { RedisAgentClient } = require(path.join(__dirname, '..', 'lib', 'redis-agent-client.cjs'));

const KNOWN_SHELLS = new Set(['bash', 'fish', 'sh', 'zsh']);
const AGENT_COMMAND_HINTS = ['codex', 'claude', 'gemini', 'goose', 'aider'];
const LOCK_STALE_MS = 5 * 60 * 1000;

const config = {
  actorId: process.env.TNF_TERMINAL_HEARTBEAT_ACTOR_ID || 'tnf-cron-terminal-heartbeat',
  stateDir:
    process.env.TNF_TERMINAL_HEARTBEAT_STATE_DIR ||
    path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'state'),
  sessionSource:
    process.env.TNF_TERMINAL_HEARTBEAT_SESSION_SOURCE ||
    path.join(os.homedir(), '.tnf', 'local-subdirector', 'state', 'local-subdirector-heartbeat.json'),
  laneMapDir:
    process.env.TNF_TERMINAL_HEARTBEAT_LANE_MAP_DIR ||
    path.join(os.homedir(), '.tnf', 'session-discovery'),
  promptTemplate:
    process.env.TNF_TERMINAL_HEARTBEAT_PROMPT_TEMPLATE ||
    'TNF heartbeat {{heartbeatId}} for {{agentId}}: report one-line status and continue your current owned task.',
  allowPromptInjection: true, // HARD-CODED TRUE for Perpetual Awakeness
  clearLine: process.env.TNF_TERMINAL_HEARTBEAT_CLEAR_LINE !== 'false',
  verifyQueueHints: process.env.TNF_TERMINAL_HEARTBEAT_VERIFY_QUEUE_HINTS !== 'false',
  contentTailChars: parsePositiveInt(process.env.TNF_TERMINAL_HEARTBEAT_CONTENT_TAIL_CHARS, 1200),
  maxTargets: parsePositiveInt(process.env.TNF_TERMINAL_HEARTBEAT_MAX_TARGETS, 0),
};

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeTty(tty) {
  return String(tty || '').replace(/^\/dev\//, '');
}

function getAgentId(terminal) {
  const raw = terminal.tty ? normalizeTty(terminal.tty) : `window-${terminal.windowId}`;
  return `tnf-local-terminal-${raw.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function resolvePath(fileName) {
  return path.join(config.stateDir, fileName);
}

async function ensureDirectories() {
  await fsp.mkdir(config.stateDir, { recursive: true });
  await fsp.mkdir(path.join(config.stateDir, 'history'), { recursive: true });
}

function readManagedSessions() {
  try {
    const raw = fs.readFileSync(config.sessionSource, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.sessions) ? parsed.sessions : [];
  } catch (_error) {
    return [];
  }
}

async function pollTerminalWindows() {
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
          contentsTail: contents.length > ${config.contentTailChars} ? contents.slice(-${config.contentTailChars}) : contents
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
    console.error(`[terminal-heartbeat] terminal polling failed: ${String(error.message || error)}`);
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
    console.error(`[terminal-heartbeat] process inventory failed: ${String(error.message || error)}`);
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

function isAgentCommand(commandName, args) {
  const haystack = `${commandName || ''} ${args || ''}`.toLowerCase();
  return AGENT_COMMAND_HINTS.some((hint) => haystack.includes(hint));
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
      ttyProcesses,
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
    ttyProcesses,
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

function isAgentLike(processContext, contentsTail) {
  const processHaystack = (processContext.ttyProcesses || [])
    .map((process) => `${process.commandName || ''} ${process.args || ''}`.toLowerCase())
    .join('\n');
  const contentHaystack = String(contentsTail || '').toLowerCase();
  return AGENT_COMMAND_HINTS.some(
    (hint) => processHaystack.includes(hint) || contentHaystack.includes(hint)
  );
}

function renderPrompt(agentId, heartbeatId) {
  return config.promptTemplate
    .replace(/\{\{agentId\}\}/g, agentId)
    .replace(/\{\{heartbeatId\}\}/g, heartbeatId);
}

function shouldTargetSession(observedSession, managedSession, protectedAgentIds) {
  // Collective Heartbeat Rule: If it looks like an agent and has a TTY, pulse it.
  return observedSession.agentLike && observedSession.tty;
}

async function readTerminalContents(windowId) {
  const { stdout } = await execFileAsync('osascript', [
    '-e',
    `tell application "Terminal" to contents of selected tab of window id ${Number(windowId)}`,
  ]);
  return String(stdout || '');
}

async function pressTerminalKey(windowId, keyCode) {
  await execFileAsync('osascript', [
    '-e',
    'tell application "Terminal" to activate',
    '-e',
    `tell application "Terminal" to set frontmost of window id ${Number(windowId)} to true`,
    '-e',
    'delay 0.1',
    '-e',
    `tell application "System Events" to tell process "Terminal" to key code ${Number(keyCode)}`,
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

  // Satisfying the Codex composer requires Tab first
  if (hasQueueHint) {
    await pressTerminalKey(windowId, 48); // Tab
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Attempt submission multiple times with verification
  while (pending && enterAttempts < 3) {
    await pressTerminalKey(windowId, 36); // Enter
    submitted = true;
    enterAttempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 500));
    contents = await readTerminalContents(windowId);
    hasQueueHint = contents.includes('tab to queue message');
    hasMarker = contents.includes(marker) || contents.includes(pendingPrefix);
    pending = hasMarker || hasQueueHint;
    
    // If still pending after first enter, try a Tab again in case it slipped back
    if (pending && hasQueueHint) {
      await pressTerminalKey(windowId, 48); // Tab
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return {
    queued: false,
    submitted,
    enterAttempts,
    queueHintPresent: pending,
  };
}

async function flushAnyPendingTnfPrompt(windowId) {
  let contents = await readTerminalContents(windowId);
  let pending =
    contents.includes('› TNF wake') ||
    contents.includes('› TNF heartbeat') ||
    contents.includes('tab to queue message');
  
  if (!pending) return { enterAttempts: 0, queueHintPresent: false };

  let enterAttempts = 0;
  while (pending && enterAttempts < 3) {
    // Satisfy composer if needed
    if (contents.includes('tab to queue message')) {
      await pressTerminalKey(windowId, 48); // Tab
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // Direct submit via Enter
    await pressTerminalKey(windowId, 36); // Enter
    enterAttempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    contents = await readTerminalContents(windowId);
    pending =
      contents.includes('› TNF wake') ||
      contents.includes('› TNF heartbeat') ||
      contents.includes('tab to queue message');
  }

  return {
    enterAttempts,
    queueHintPresent: pending,
  };
}

async function injectHeartbeat(target) {
  const heartbeatId = `cron-heartbeat-${normalizeTty(target.tty)}-${Date.now()}`;
  const prompt = renderPrompt(target.agentId, heartbeatId);
  const escapedPrompt = `${config.clearLine ? '\u0015' : ''}${prompt}`;

  // Pre-injection: non-destructive pending-prompt cleanup only.
  if (config.clearLine && target.windowId) {
    await flushAnyPendingTnfPrompt(target.windowId);
  }

  // Using Terminal 'do script' for reliable type-and-submit in Codex
  await execFileAsync('osascript', [
    '-e',
    `tell application "Terminal" to do script "${escapedPrompt.replace(/"/g, '\\"')}\\n" in selected tab of window id ${Number(target.windowId)}`,
  ]);

  let queueHintPresent = false;
  let queued = false;
  let submitted = true;
  let enterAttempts = 0;
  
  if (config.verifyQueueHints && target.windowId) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      ({ queueHintPresent, queued, submitted, enterAttempts } = await submitPromptIfNeeded(
        target.windowId,
        heartbeatId,
        '› TNF heartbeat'
      ));
      
      // Secondary aggressive flush if first pass failed
      if (queueHintPresent) {
        const cleanup = await flushAnyPendingTnfPrompt(target.windowId);
        queueHintPresent = cleanup.queueHintPresent;
        enterAttempts += cleanup.enterAttempts;
        submitted = submitted || cleanup.enterAttempts > 0;
      }
    } catch (_error) {
      queueHintPresent = false;
    }
  }

  return {
    agentId: target.agentId,
    tty: target.tty,
    windowId: target.windowId,
    heartbeatId,
    method: 'terminal-do-script',
    submitted: config.verifyQueueHints ? submitted || !queueHintPresent : true,
    enterAttempts,
    queueHintPresent,
    injectedAt: nowIso(),
  };
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
    // Fail silently to keep pulse robust
  }
}

function acquireLock(lockPath) {
  try {
    fs.mkdirSync(lockPath);
    fs.writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({ pid: process.pid, startedAt: nowIso() }, null, 2));
    return true;
  } catch (error) {
    if (error && error.code !== 'EEXIST') throw error;
    try {
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
        fs.rmSync(lockPath, { recursive: true, force: true });
        fs.mkdirSync(lockPath);
        fs.writeFileSync(path.join(lockPath, 'owner.json'), JSON.stringify({ pid: process.pid, startedAt: nowIso(), recovered: true }, null, 2));
        return true;
      }
    } catch (_error) {}
    return false;
  }
}

function releaseLock(lockPath) {
  fs.rmSync(lockPath, { recursive: true, force: true });
}

async function writeArtifacts(payload) {
  await fsp.writeFile(resolvePath('terminal-heartbeat-latest.json'), JSON.stringify(payload, null, 2));
  await fsp.writeFile(resolvePath('terminal-heartbeat-latest.md'), buildMarkdown(payload));
  const stamp = payload.generatedAt.replace(/[:]/g, '-');
  await fsp.writeFile(path.join(config.stateDir, 'history', `terminal-heartbeat-${stamp}.json`), JSON.stringify(payload, null, 2));
  await fsp.appendFile(resolvePath('terminal-heartbeat-history.jsonl'), `${JSON.stringify(payload)}\n`);
}

function buildMarkdown(payload) {
  const lines = [
    '# TNF Cron Terminal Heartbeat',
    '',
    `Generated: ${payload.generatedAt}`,
    `Actor: ${payload.actor.id}`,
    `Status: ${payload.status}`,
    '',
    '## Summary',
    '',
    `- Observed sessions: ${payload.summary.observedSessions}`,
    `- Agent sessions: ${payload.summary.agentSessions}`,
    `- Targeted sessions: ${payload.summary.targetedSessions}`,
    `- Direct injections: ${payload.summary.injections}`,
    `- Queue hint failures: ${payload.summary.queueHintFailures}`,
    '',
    '## Targets',
    '',
    ...payload.targets.map(
      (target) =>
        `- ${target.agentId} | ${target.tty} | method=${target.method} | submitted=${target.submitted} | queueHintPresent=${target.queueHintPresent}`
    ),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function main() {
  await ensureDirectories();
  const lockPath = resolvePath('pulse.lock');
  if (!acquireLock(lockPath)) {
    const payload = {
      generatedAt: nowIso(),
      actor: { id: config.actorId, role: 'tnf-master-clock' },
      status: 'skipped-locked',
      summary: {
        observedSessions: 0,
        agentSessions: 0,
        targetedSessions: 0,
        injections: 0,
        queueHintFailures: 0,
      },
      targets: [],
      functionalGaps: ['Heartbeat pulse skipped because an overlapping pulse lock was present.'],
    };
    await writeArtifacts(payload);
    return;
  }

  try {
    const terminals = await pollTerminalWindows();
    const processTable = await collectProcessTable();
    const managedSessions = readManagedSessions();
    const managedByAgentId = new Map(
      managedSessions
        .filter((session) => session && session.agentId)
        .map((session) => [String(session.agentId), session])
    );
    const observed = [];

    for (const terminal of terminals) {
      const processContext = resolveProcessContext(terminal, processTable);
      const cwd = processContext.shellPid ? await resolveCwd(processContext.shellPid) : null;
      const agentLike = isAgentLike(processContext, terminal.contentsTail);
      observed.push({
        agentId: terminal.tty ? getAgentId(terminal) : null,
        windowId: terminal.windowId,
        tty: terminal.tty,
        busy: terminal.busy,
        cwd,
        shellPid: processContext.shellPid,
        foregroundPid: processContext.foregroundPid,
        foregroundCommand: processContext.foregroundCommand,
        foregroundArgs: processContext.foregroundArgs,
        agentLike,
      });
    }

    let targets = observed.filter((session) =>
      shouldTargetSession(session, managedByAgentId.get(session.agentId))
    );
    if (config.maxTargets > 0) {
      targets = targets.slice(0, config.maxTargets);
    }

    const injections = [];
    for (const target of targets) {
      const result = await injectHeartbeat(target);
      injections.push(result);

      // Official TNF Activity Integration
      await publishActivity(target.agentId, 'heartbeat_injected', {
        heartbeatId: result.heartbeatId,
        method: result.method,
        submitted: result.submitted
      });
    }

    const payload = {
      generatedAt: nowIso(),
      actor: { id: config.actorId, role: 'tnf-master-clock' },
      status: injections.some((target) => target.queueHintPresent) ? 'degraded' : 'healthy',
      summary: {
        observedSessions: observed.length,
        agentSessions: observed.filter((session) => session.agentLike).length,
        targetedSessions: targets.length,
        injections: injections.length,
        queueHintFailures: injections.filter((target) => target.queueHintPresent).length,
      },
      observed,
      targets: injections,
      functionalGaps: [
        'PERPETUAL AWAKENESS: Prompt injection is now hard-coded to TRUE.',
        'Collective Heartbeat Rule: Every agent-like TTY is pulsed every minute, including the Director.',
        'Non-destructive Flush: Pulse only attempts safe prompt cleanup before injection (no forced interrupt).',
      ],
    };

    await writeArtifacts(payload);
    console.log(
      `[terminal-heartbeat] status=${payload.status} observed=${payload.summary.observedSessions} targeted=${payload.summary.targetedSessions} injections=${payload.summary.injections}`
    );
  } finally {
    releaseLock(lockPath);
  }
}

main().catch((error) => {
  console.error(`[terminal-heartbeat] fatal: ${String(error.message || error)}`);
  process.exit(1);
});
