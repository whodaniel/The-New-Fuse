#!/usr/bin/env node

// Resolve dependencies at startup:
//   - `../lib/tnf-single-instance-guard.cjs` is the canonical layout
//     when this script lives in scripts/runtime/. When mirrored to
//     ~/.tnf/bin/ by `scripts/runtime/terminal-heartbeat-cron.sh`
//     install we ALSO copy scripts/lib/*.cjs into ~/.tnf/lib/ so the
//     same relative path works in both homes.
//   - `ioredis` lives in the repo's node_modules; pre-seed
//     NODE_PATH or fall through to a relative module resolution that
//     walks upward until it finds a node_modules.

const { execFile } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

// Self-sufficient resolver for sibling-lib requires. We try `../lib`
// (the canonical mirror layout) first, then walk up to the repo root
// looking for `scripts/lib/`. Last resort: explicit error.
function resolveSibling(filename) {
  const candidates = [
    path.join(__dirname, '..', 'lib', filename),
    path.join(__dirname, 'lib', filename),
    path.join(__dirname, '..', '..', 'scripts', 'lib', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `[terminal-heartbeat-pulse] unable to locate ${filename} (tried: ${candidates.join(', ')})`
  );
}

// Operator kill-switch: if present, this pulse must not run at all —
// no injection, no lock acquisition, no side effects. Checked first,
// before anything else, so it works regardless of which caller invoked
// this script (cron, master-heartbeat-loop's run-once, ad-hoc) and
// survives ensure-terminal-heartbeat-cron re-provisioning the crontab
// line, since re-provisioning only touches the crontab/mirrors, not
// this early-exit check in the canonical source.
const DISABLE_FILE = path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'DISABLED');
if (fs.existsSync(DISABLE_FILE)) {
  console.log(JSON.stringify({ ok: true, skipped: 'disabled-by-operator', disableFile: DISABLE_FILE }));
  process.exit(0);
}

// Fleet-wide injection pause gate — defense in depth. The cron-gated
// path through run-chronological-process.cjs already short-circuits
// when mode === 'paused', but this script can also be invoked directly
// (ad-hoc, master-heartbeat-loop, terminal-heartbeat-cron mirror).
// 'injection-paused' pauses keystroke/prompt injection without
// stopping other cron work; 'paused' is fully covered upstream.
const { isInjectionPaused, readFleetMode } = require(resolveSibling('tnf-fleet-mode.cjs'));
if (isInjectionPaused()) {
  const fleetState = readFleetMode();
  console.log(
    JSON.stringify({
      ok: true,
      skipped: 'fleet-injection-paused',
      reason: fleetState.reason || 'fleet-injection-paused',
      fleetMode: fleetState.mode,
      fleetUpdatedAt: fleetState.updatedAt,
      fleetUpdatedBy: fleetState.updatedBy,
    })
  );
  process.exit(0);
}

const { singleInstanceGuard } = require(resolveSibling('tnf-single-instance-guard.cjs'));
const _guard = singleInstanceGuard({ lockName: 'tnf-terminal-heartbeat-pulse', staleMs: 120000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}


const execFileAsync = promisify(execFile);

const { RedisAgentClient } = require(resolveSibling('redis-agent-client.cjs'));
const { isInteractiveSafeModeEnabled, isPromptInjectionAllowed } = require(
  resolveSibling('tnf-interactive-safe-mode.cjs')
);
const {
  isTtyRecentlyActive,
  readTerminalContents: readTerminalContentsShared,
  isTypingInTerminal,
} = require(resolveSibling('tnf-terminal-attention.cjs'));

const KNOWN_SHELLS = new Set(['bash', 'fish', 'sh', 'zsh']);
const AGENT_COMMAND_HINTS = ['codex', 'claude', 'gemini', 'goose', 'aider', 'pi'];
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
    'TNF heartbeat {{heartbeatId}} for {{agentId}}: read ~/.tnf/swarm-context.md and ~/.tnf/handoff-current.json for your task and swarm state, then execute it.',
  allowPromptInjection: isPromptInjectionAllowed('TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION'),
  clearLine: process.env.TNF_TERMINAL_HEARTBEAT_CLEAR_LINE !== 'false',
  verifyQueueHints: process.env.TNF_TERMINAL_HEARTBEAT_VERIFY_QUEUE_HINTS !== 'false',
  contentTailChars: parsePositiveInt(process.env.TNF_TERMINAL_HEARTBEAT_CONTENT_TAIL_CHARS, 1200),
  maxTargets: parsePositiveInt(process.env.TNF_TERMINAL_HEARTBEAT_MAX_TARGETS, 0),
  // Cheap sync pre-filter: skip a terminal whose tty had any I/O (agent
  // output included, not just human keystrokes) more recently than this —
  // intentionally over-protective, see scripts/lib/tnf-terminal-attention.cjs.
  idleThresholdMs: parsePositiveInt(process.env.TNF_TERMINAL_HEARTBEAT_IDLE_THRESHOLD_MS, 6000),
  protectedSessionsFile:
    process.env.TNF_TERMINAL_HEARTBEAT_PROTECTED_SESSIONS_FILE ||
    path.join(os.homedir(), '.tnf', 'terminal-heartbeat', 'protected-sessions.json'),
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

// Manual, operator-edited exclude-list — e.g. `{"protected":[{"agentId":"tnf-local-terminal-ttys004","reason":"operator-typing"}]}`.
// A durable alternative to the blunt global DISABLE_FILE for excluding one
// specific terminal without stopping the pulse everywhere.
function readProtectedAgentIds() {
  try {
    const raw = fs.readFileSync(config.protectedSessionsFile, 'utf8');
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed?.protected) ? parsed.protected : [];
    return new Set(entries.map((entry) => String(entry?.agentId || '')).filter(Boolean));
  } catch (_error) {
    return new Set();
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
  return AGENT_COMMAND_HINTS.some((hint) => {
    const regex = new RegExp(`\\b${hint}\\b`, 'i');
    return regex.test(processHaystack) || regex.test(contentHaystack);
  });
}

function renderPrompt(agentId, heartbeatId) {
  return config.promptTemplate
    .replace(/\{\{agentId\}\}/g, agentId)
    .replace(/\{\{heartbeatId\}\}/g, heartbeatId);
}

function shouldTargetSession(observedSession, managedSession, protectedAgentIds) {
  // Collective Heartbeat Rule: If it looks like an agent and has a TTY, pulse it —
  // UNLESS it's on the manual exclude-list, or its tty has had I/O more
  // recently than idleThresholdMs (cheap pre-filter; the authoritative
  // isTypingInTerminal check runs again, fresh, right before injection).
  if (!(observedSession.agentLike && observedSession.tty)) return false;
  if (protectedAgentIds && protectedAgentIds.has(observedSession.agentId)) return false;
  if (isTtyRecentlyActive(observedSession.tty, config.idleThresholdMs)) return false;
  return true;
}

async function readTerminalContents(windowId) {
  return readTerminalContentsShared(windowId, execFileAsync);
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
  // Authoritative attention check, done fresh right before the
  // focus-stealing/keystroke call — time passes between the earlier JXA
  // poll (isTtyRecentlyActive pre-filter in shouldTargetSession) and here,
  // so this re-checks against current terminal contents rather than a
  // stale snapshot. This is what actually catches "human is mid-keystroke
  // right now" (an unsubmitted prompt/composer line).
  if (target.windowId) {
    try {
      const preflightContents = await readTerminalContents(target.windowId);
      if (isTypingInTerminal(preflightContents)) {
        return {
          agentId: target.agentId,
          tty: target.tty,
          windowId: target.windowId,
          heartbeatId: null,
          method: 'skipped-typing',
          submitted: false,
          skippedReason: 'typing-in-progress',
          enterAttempts: 0,
          queueHintPresent: false,
          injectedAt: nowIso(),
        };
      }
    } catch (_error) {
      // If we can't read contents, fall through and let the normal
      // injection path fail/succeed on its own terms below.
    }
  }

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

  // Global operator injection gate — distinct from the blunt DISABLE_FILE
  // kill-switch at the top of this file, and distinct from discovery.
  // isInteractiveSafeModeEnabled()/allowPromptInjection control ONLY
  // whether the injection loop runs below; they must NOT also suppress
  // polling/discovery (`observed[]`), because several other consumers
  // depend on that array for non-injection purposes regardless of
  // whether injection itself is allowed right now: tnf-director-loop.cjs
  // (fallback session source + stale-heartbeat escalation paging),
  // tnf-onboard-twip.cjs (duplicate-lane guard), tnf-fleet-status.cjs
  // (heartbeat-age-based degraded status), fleet-role-map-reconcile.cjs
  // (role map). An earlier version of this gate zeroed observed[] too,
  // which silently starved all of those on every safe-mode/policy skip —
  // fixed so only the injection step is conditional now.
  const injectionAllowed = !isInteractiveSafeModeEnabled() && config.allowPromptInjection;
  const injectionSkippedReason = isInteractiveSafeModeEnabled()
    ? 'interactive-safe-mode'
    : !config.allowPromptInjection
      ? 'prompt-injection-disabled'
      : null;

  try {
    const terminals = await pollTerminalWindows();
    const processTable = await collectProcessTable();
    const managedSessions = readManagedSessions();
    const managedByAgentId = new Map(
      managedSessions
        .filter((session) => session && session.agentId)
        .map((session) => [String(session.agentId), session])
    );
    const protectedAgentIds = readProtectedAgentIds();
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

    let targets = injectionAllowed
      ? observed.filter((session) =>
          shouldTargetSession(session, managedByAgentId.get(session.agentId), protectedAgentIds)
        )
      : [];
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
      status: injectionSkippedReason
        ? 'skipped-safe-mode'
        : injections.some((target) => target.queueHintPresent)
          ? 'degraded'
          : 'healthy',
      summary: {
        observedSessions: observed.length,
        agentSessions: observed.filter((session) => session.agentLike).length,
        targetedSessions: targets.length,
        // injections counts only attempts that actually sent keystrokes —
        // an attempt skipped by the typing-in-progress preflight check
        // (method: 'skipped-typing') was targeted but never touched the
        // terminal, so it shouldn't inflate this count.
        injections: injections.filter((target) => target.method !== 'skipped-typing').length,
        queueHintFailures: injections.filter((target) => target.queueHintPresent).length,
      },
      observed,
      targets: injections,
      skippedForAttention: injections.filter((target) => target.skippedReason === 'typing-in-progress').length,
      functionalGaps: injectionSkippedReason
        ? [`Injection skipped: ${injectionSkippedReason} (discovery still ran; observed[] is current).`]
        : [
            'Attention-aware: sessions with recent tty I/O (idleThresholdMs) or an in-progress unsubmitted line (isTypingInTerminal) are skipped, not just agent-like+tty.',
            'Collective Heartbeat Rule: every remaining agent-like, unattended TTY is pulsed.',
            'Non-destructive Flush: pulse only attempts safe prompt cleanup before injection (no forced interrupt).',
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
