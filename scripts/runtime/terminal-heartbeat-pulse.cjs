#!/usr/bin/env node

const { execFile } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
let RedisAgentClient = null;
for (const candidate of [
  path.join(__dirname, 'lib', 'redis-agent-client.cjs'),
  path.join(__dirname, '..', 'lib', 'redis-agent-client.cjs'),
  path.join(os.homedir(), '.tnf', 'bin', 'lib', 'redis-agent-client.cjs'),
]) {
  try {
    ({ RedisAgentClient } = require(candidate));
    break;
  } catch (_error) {}
}
if (!RedisAgentClient) {
  throw new Error('Unable to resolve redis-agent-client.cjs for terminal heartbeat runtime.');
}

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
    'TNF heartbeat {{heartbeatId}} for {{agentId}}: post one-line status, keep current task focus, and do not switch tasks. If blocked or conflicted, message Local Sub-Director with issue and requested help.',
  allowPromptInjection:
    String(process.env.TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION || 'false').toLowerCase() ===
    'true',
  interactiveSafeModeEnv: process.env.TNF_INTERACTIVE_SAFE_MODE || '',
  interactiveSafeModeFile:
    process.env.TNF_INTERACTIVE_SAFE_MODE_FILE ||
    path.join(os.homedir(), '.tnf', 'flags', 'interactive-safe-mode'),
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

function isInteractiveSafeModeEnabled() {
  if (String(config.interactiveSafeModeEnv || '').trim()) {
    return String(config.interactiveSafeModeEnv).toLowerCase() !== 'false';
  }
  return fs.existsSync(config.interactiveSafeModeFile);
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
  
  // If the line is JUST a known system prefix, it's not typing
  const systemPrefixes = ['› TNF wake', '› TNF heartbeat', '›', '>', '$', '%'];
  if (systemPrefixes.some(p => trimmed === p)) return false;

  // If it's a heartbeat/wake message being typed/flushed, it's not "user" typing
  if (trimmed.startsWith('› TNF wake') || trimmed.startsWith('› TNF heartbeat')) return false;
  if (trimmed.includes('tab to queue message')) return false;

  // KEY FIX: More inclusive prompt detection (bash, zsh, conda, custom agent prompts)
  const promptMatch = line.match(/(?:[%$#>❯]|(?:\(.*\)))\s*(.*)$/);
  
  if (promptMatch) {
    const tail = String(promptMatch[1] || '').trim();
    // If there is ANY text after the prompt, the user is likely typing
    return tail.length > 0 && !tail.startsWith('TNF heartbeat') && !tail.startsWith('TNF wake');
  }

  // Fallback: If no prompt character found but the line has content, 
  // it might be a custom agent prompt (e.g. Codex/Aider/Claude). 
  // Safety first: assume typing.
  return trimmed.length > 0;
}

function shouldTargetSession(observedSession, managedSession, protectedAgentIds) {
  // Collective Heartbeat Rule: If it looks like an agent and has a TTY, pulse it.
  return observedSession.agentLike && observedSession.tty;
}

function toTaskHint(foregroundArgs, foregroundCommand) {
  const text = String(foregroundArgs || foregroundCommand || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function buildCoordinationPoll(observed, target) {
  const polledAt = nowIso();
  const allSessions = Array.isArray(observed) ? observed : [];
  const agentSessions = allSessions.filter((session) => session && session.agentLike && session.tty);

  const targetTaskHint = toTaskHint(target.foregroundArgs, target.foregroundCommand);
  const peers = agentSessions
    .filter((session) => session.agentId && session.agentId !== target.agentId)
    .map((session) => ({
      agentId: session.agentId,
      tty: session.tty,
      windowId: session.windowId,
      status: session.busy ? 'active' : 'idle',
      cwd: session.cwd || null,
      taskHint: toTaskHint(session.foregroundArgs, session.foregroundCommand),
    }));

  const sharedCwdActivePeers = peers.filter(
    (peer) => peer.cwd && target.cwd && peer.cwd === target.cwd && peer.status === 'active'
  );
  const conflictRisk =
    sharedCwdActivePeers.length > 0
      ? {
          code: 'shared-cwd-active-peers',
          reason: 'Multiple active agent terminals are already working in the same cwd.',
          peerAgentIds: sharedCwdActivePeers.map((peer) => peer.agentId),
          cwd: target.cwd || null,
        }
      : null;

  return {
    polledAt,
    totalOpenTerminals: allSessions.length,
    totalAgentTerminals: agentSessions.length,
    target: {
      agentId: target.agentId,
      tty: target.tty,
      status: target.busy ? 'active' : 'idle',
      cwd: target.cwd || null,
      taskHint: targetTaskHint,
    },
    peers: peers.slice(0, 8),
    conflictRisk,
  };
}

function coordinationSummary(coordinationPoll) {
  if (!coordinationPoll) return null;
  return {
    polledAt: coordinationPoll.polledAt,
    totalOpenTerminals: coordinationPoll.totalOpenTerminals,
    totalAgentTerminals: coordinationPoll.totalAgentTerminals,
    peerCount: coordinationPoll.peers.length,
    targetAgentId: coordinationPoll.target?.agentId || null,
    targetTaskHint: coordinationPoll.target?.taskHint || null,
    conflictRiskCode: coordinationPoll.conflictRisk?.code || null,
  };
}

async function readTerminalContents(windowId) {
  const { stdout } = await execFileAsync('osascript', [
    '-e',
    `tell application "Terminal" to contents of selected tab of window id ${Number(windowId)}`,
  ]);
  return String(stdout || '');
}

async function forceSubmit(windowId) {
  // Use System Events for a REAL hardware return keystroke.
  // Requires 'activate' to ensure Terminal is focused at the OS level.
  const script = `
    activate application "Terminal"
    tell application "Terminal"
      set frontmost of window id ${Number(windowId)} to true
    end tell
    delay 0.2
    tell application "System Events"
      tell process "Terminal"
        key code 36 -- Return key
      end tell
    end tell
  `;
  try {
    await execFileAsync('osascript', ['-e', script]);
  } catch (_err) {
    // Secondary fallback using do script \n if keystroke fails
    await execFileAsync('osascript', [
      '-e',
      `tell application "Terminal" to do script "\n" in selected tab of window id ${Number(windowId)}`,
    ]);
  }
}

async function submitPromptIfNeeded(windowId, marker, pendingPrefix) {
  let contents = await readTerminalContents(windowId);
  let hasQueueHint = contents.includes('tab to queue message');
  let hasMarker = contents.includes(marker) || contents.includes(pendingPrefix);
  let pending = hasMarker || hasQueueHint;

  if (!pending) return { submitted: false, enterAttempts: 0, pending: false };

  let submitted = false;
  let enterAttempts = 0;

  // Aggressive hardware Enter retry
  while (pending && enterAttempts < 3) {
    await forceSubmit(windowId);
    submitted = true;
    enterAttempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    contents = await readTerminalContents(windowId);
    hasQueueHint = contents.includes('tab to queue message');
    hasMarker = contents.includes(marker) || contents.includes(pendingPrefix);
    pending = hasMarker || hasQueueHint;
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
  while (pending && enterAttempts < 2) {
    await forceSubmit(windowId);
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
  let activeInputLine = null;
  let typingDetected = false;

  if (target.windowId) {
    try {
      const contents = await readTerminalContents(Number(target.windowId));
      activeInputLine = getLastVisibleLine(contents);
      typingDetected = isTypingInTerminal(contents);
      
      if (typingDetected) {
        return {
          agentId: target.agentId,
          tty: target.tty,
          windowId: target.windowId,
          heartbeatId: null,
          method: 'skipped-typing',
          submitted: false,
          enterAttempts: 0,
          queueHintPresent: false,
          skippedReason: 'typing-in-progress',
          activeInputLine: activeInputLine.slice(-160),
          injectedAt: nowIso(),
        };
      }
    } catch (_error) {}
  }

  const heartbeatId = `cron-heartbeat-${normalizeTty(target.tty)}-${Date.now()}`;
  const prompt = renderPrompt(target.agentId, heartbeatId);
  
  // DANGER GUARD: Only use Ctrl+U if we are 100% sure the line is empty or just a system prompt.
  const shouldClear = config.clearLine && !activeInputLine;
  
  try {
    // Use do script for the text injection (fast and specific to tab)
    const injectionScript = shouldClear 
      ? `tell application "Terminal" to do script (ASCII character 21) & "${prompt.replace(/"/g, '\\"')}" in selected tab of window id ${Number(target.windowId)}`
      : `tell application "Terminal" to do script "${prompt.replace(/"/g, '\\"')}" in selected tab of window id ${Number(target.windowId)}`;
    
    await execFileAsync('osascript', ['-e', injectionScript]);
    
    // Immediately trigger forceSubmit for the hardware Return key
    await forceSubmit(target.windowId);
  } catch (error) {
    console.error(`[terminal-heartbeat] injection failed: ${error.message}`);
  }

  let queueHintPresent = false;
  let queued = false;
  let submitted = true;
  let enterAttempts = 1;
  
  if (config.verifyQueueHints && target.windowId) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const verify = await submitPromptIfNeeded(
        target.windowId,
        heartbeatId,
        '› TNF heartbeat'
      );
      queueHintPresent = verify.queueHintPresent;
      enterAttempts += verify.enterAttempts;
      submitted = verify.submitted || !queueHintPresent;
    } catch (_error) {
      queueHintPresent = false;
    }
  }

  return {
    agentId: target.agentId,
    tty: target.tty,
    windowId: target.windowId,
    heartbeatId,
    method: 'do-script-with-force-submit',
    submitted: config.verifyQueueHints ? submitted || !queueHintPresent : true,
    enterAttempts,
    queueHintPresent,
    skippedReason: null,
    activeInputLine: activeInputLine ? activeInputLine.slice(-160) : null,
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
    `- Skipped for safety mode: ${payload.summary.skippedForSafety || 0}`,
    `- Skipped for policy: ${payload.summary.skippedForPolicy || 0}`,
    `- Skipped for coordination: ${payload.summary.skippedForCoordination || 0}`,
    `- Skipped for typing: ${payload.summary.skippedForTyping || 0}`,
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
    const interactiveSafeMode = isInteractiveSafeModeEnabled();
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
      const poll = buildCoordinationPoll(observed, target);

      if (interactiveSafeMode) {
        const safeResult = {
          agentId: target.agentId,
          tty: target.tty,
          windowId: target.windowId,
          heartbeatId: null,
          method: 'skipped-safety-hold',
          submitted: false,
          enterAttempts: 0,
          queueHintPresent: false,
          skippedReason: 'interactive-safe-mode',
          coordinationPoll: poll,
          injectedAt: nowIso(),
        };
        injections.push(safeResult);
        await publishActivity(target.agentId, 'heartbeat_skipped', {
          heartbeatId: null,
          method: safeResult.method,
          submitted: false,
          skippedReason: safeResult.skippedReason,
          coordination: coordinationSummary(poll),
        });
        continue;
      }

      if (!config.allowPromptInjection) {
        const disabledResult = {
          agentId: target.agentId,
          tty: target.tty,
          windowId: target.windowId,
          heartbeatId: null,
          method: 'skipped-policy-hold',
          submitted: false,
          enterAttempts: 0,
          queueHintPresent: false,
          skippedReason: 'prompt-injection-disabled',
          coordinationPoll: poll,
          injectedAt: nowIso(),
        };
        injections.push(disabledResult);
        await publishActivity(target.agentId, 'heartbeat_skipped', {
          heartbeatId: null,
          method: disabledResult.method,
          submitted: false,
          skippedReason: disabledResult.skippedReason,
          coordination: coordinationSummary(poll),
        });
        continue;
      }

      if (poll.conflictRisk) {
        const holdResult = {
          agentId: target.agentId,
          tty: target.tty,
          windowId: target.windowId,
          heartbeatId: null,
          method: 'skipped-coordination-hold',
          submitted: false,
          enterAttempts: 0,
          queueHintPresent: false,
          skippedReason: 'coordination-conflict-risk',
          coordinationPoll: poll,
          injectedAt: nowIso(),
        };
        injections.push(holdResult);
        await publishActivity(target.agentId, 'heartbeat_skipped', {
          heartbeatId: null,
          method: holdResult.method,
          submitted: false,
          skippedReason: holdResult.skippedReason,
          coordination: coordinationSummary(poll),
        });
        continue;
      }

      const result = await injectHeartbeat(target);
      result.coordinationPoll = poll;
      injections.push(result);

      // Official TNF Activity Integration
      await publishActivity(target.agentId, result.submitted ? 'heartbeat_injected' : 'heartbeat_skipped', {
        heartbeatId: result.heartbeatId,
        method: result.method,
        submitted: result.submitted,
        skippedReason: result.skippedReason || null,
        coordination: coordinationSummary(poll),
      });
    }

    const payload = {
      generatedAt: nowIso(),
      actor: { id: config.actorId, role: 'tnf-master-clock' },
      status: injections.some((target) => target.queueHintPresent)
        ? 'degraded'
        : interactiveSafeMode || !config.allowPromptInjection
          ? 'safe-no-injection'
          : 'healthy',
      summary: {
        observedSessions: observed.length,
        agentSessions: observed.filter((session) => session.agentLike).length,
        targetedSessions: targets.length,
        injections: injections.filter((target) => target.submitted).length,
        skippedForSafety: injections.filter((target) => target.skippedReason === 'interactive-safe-mode')
          .length,
        skippedForPolicy: injections.filter(
          (target) => target.skippedReason === 'prompt-injection-disabled'
        ).length,
        skippedForCoordination: injections.filter(
          (target) => target.skippedReason === 'coordination-conflict-risk'
        ).length,
        skippedForTyping: injections.filter((target) => target.skippedReason === 'typing-in-progress').length,
        queueHintFailures: injections.filter((target) => target.queueHintPresent).length,
      },
      observed,
      targets: injections,
      functionalGaps: [
        'Collective Heartbeat Rule: Every agent-like TTY is evaluated every pulse, including the Director.',
        'Coordination Poll Gate: before any send, a short cross-terminal poll captures peer status and task hints.',
        `Interactive Safe Mode: ${interactiveSafeMode ? 'enabled' : 'disabled'} (flag: ${config.interactiveSafeModeFile}).`,
        'Typing Guard: heartbeat injection skips terminals with active user input, including slash commands.',
        'Non-Focus Injection: heartbeat never activates or front-focuses Terminal windows.',
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
