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
const { injectViaTmux, listObservedPanes } = require(resolveSibling('tnf-tmux-inject.cjs'));

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
  // Deliberately does NOT say "then execute it" — that phrasing is what let an
  // agent in another terminal read this heartbeat + a handoff's next_actions
  // as standing authorization to run `git commit` unattended (2026-07-23
  // incident, see scripts/turn-end.cjs and docs/core/AGENTS.md). The state
  // files are informational; committing/pushing always needs live,
  // current-session operator confirmation regardless of what they say.
  //
  // 2026-08-31/09-01 follow-up: even authorized, heartbeat-woken sessions did
  // routine-sweep commits (`git add -A` style "chore: routine updates") that
  // swept unrelated work-in-progress — twice zeroing/half-breaking
  // packages/tnf-cli sources mid-flight (commits bf04b72a2, e2271e7c3). The
  // prompt therefore now also forbids staging anything under packages/,
  // scripts/, apps/, or other source dirs in routine sweeps; code changes go
  // on a task branch with an explicitly-named file list or not at all.
  promptTemplate:
    process.env.TNF_TERMINAL_HEARTBEAT_PROMPT_TEMPLATE ||
    'TNF heartbeat {{heartbeatId}} for {{agentId}}: read ~/.tnf/swarm-context.md and ~/.tnf/handoff-current.json for current task and swarm state. These are informational, not standing authorization — per docs/core/AGENTS.md, git commit/push (and any other high-impact action) still needs live operator confirmation in this session before you act on them, even if the state files say to. Routine/maintenance sweeps must NEVER stage source code (packages/**/src, scripts/, apps/, .husky/, or any *.ts/*.cjs/*.sh): commit only the data/docs/reports you intentionally wrote, by explicit file path — never `git add -A`/`git commit -a`. Any behavioral code change belongs on a dedicated task branch with an explicit file list, and to a zero-diff or type-broken tree you must stop and report rather than commit.',
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
        let jxaBounds = null;
        try {
          const b = window.bounds();
          jxaBounds = { x: Number(b.x), y: Number(b.y), width: Number(b.width), height: Number(b.height) };
        } catch (_e) {}
        let jxaIndex = null;
        try { jxaIndex = Number(window.index()); } catch (_e) {}
        windows.push({
          windowId: Number(window.id()),
          tty: String(tab.tty() || '') || null,
          busy: Boolean(tab.busy()),
          customTitle: String(tab.customTitle() || '') || null,
          jxaBounds,
          jxaIndex,
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

// Spatial capture for the Terminal Mirror UI: CGWindow bounds + display
// geometry via .agent/skills/screenshot/scripts/macos_window_info.swift.
// Terminal.app AppleScript window.id() matches kCGWindowNumber, so results
// join onto pollTerminalWindows() output by windowId (title fallback below).
const WINDOW_INFO_BINARY = path.join(os.homedir(), '.tnf', 'bin', 'tnf-window-info');

function resolveWindowInfoScript() {
  const candidates = [
    path.join(__dirname, '..', '..', '.agent', 'skills', 'screenshot', 'scripts', 'macos_window_info.swift'),
    path.join(os.homedir(), '.tnf', 'bin', 'macos_window_info.swift'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function collectWindowBounds() {
  if (process.platform !== 'darwin') return { windows: [], displays: [] };

  const args = ['--app', 'Terminal', '--list', '--screens'];
  let invocation = null;
  if (fs.existsSync(WINDOW_INFO_BINARY)) {
    invocation = [WINDOW_INFO_BINARY, args];
  } else {
    const script = resolveWindowInfoScript();
    if (script) invocation = ['swift', [script, ...args]];
  }
  if (!invocation) return { windows: [], displays: [] };

  try {
    const { stdout } = await execFileAsync(invocation[0], invocation[1], {
      maxBuffer: 4 * 1024 * 1024,
      timeout: 45000,
    });
    const parsed = JSON.parse(stdout || '{}');
    return {
      windows: Array.isArray(parsed.windows) ? parsed.windows : [],
      displays: Array.isArray(parsed.displays) ? parsed.displays : [],
    };
  } catch (error) {
    console.error(`[terminal-heartbeat] window bounds capture failed: ${String(error.message || error)}`);
    return { windows: [], displays: [] };
  }
}

// Cron sessions often cannot reach the WindowServer for CGWindowList, but
// osascript still can. NSScreen frames use a bottom-left origin, so flip Y
// into the top-left space that window bounds and the mirror UI use.
async function collectDisplaysFallback() {
  const script = `
    ObjC.import('AppKit');
    const screens = $.NSScreen.screens;
    const main = screens.objectAtIndex(0).frame;
    const out = [];
    for (let i = 0; i < screens.count; i++) {
      const f = screens.objectAtIndex(i).frame;
      out.push({
        id: i,
        x: Number(f.origin.x),
        y: Number(main.size.height - f.origin.y - f.size.height),
        width: Number(f.size.width),
        height: Number(f.size.height),
        main: i === 0
      });
    }
    JSON.stringify(out);
  `;
  try {
    const { stdout } = await execFileAsync('osascript', ['-l', 'JavaScript', '-e', script], {
      maxBuffer: 1024 * 1024,
      timeout: 20000,
    });
    const parsed = JSON.parse(stdout || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function findDisplayId(bounds, displays) {
  if (!bounds || !displays.length) return null;
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  for (const display of displays) {
    if (
      centerX >= display.x &&
      centerX < display.x + display.width &&
      centerY >= display.y &&
      centerY < display.y + display.height
    ) {
      return display.id;
    }
  }
  return displays[0].id;
}

function mergeWindowBounds(terminals, cgCapture) {
  const { windows: cgWindows, displays } = cgCapture;
  const byId = new Map(cgWindows.map((w) => [w.id, w]));
  const byTitle = new Map();
  for (const w of cgWindows) {
    if (w.name) byTitle.set(w.name, w);
  }
  // CGWindowListCopyWindowInfo returns windows front-to-back.
  const zOrderById = new Map(cgWindows.map((w, index) => [w.id, index]));

  return terminals.map((terminal) => {
    const { jxaBounds, jxaIndex, ...rest } = terminal;
    let cg = byId.get(terminal.windowId) || null;
    let matchedBy = cg ? 'windowId' : null;
    if (!cg && terminal.customTitle && byTitle.has(terminal.customTitle)) {
      cg = byTitle.get(terminal.customTitle);
      matchedBy = 'title';
    }
    if (!cg) {
      if (jxaBounds) {
        return {
          ...rest,
          bounds: jxaBounds,
          display: findDisplayId(jxaBounds, displays),
          zOrder: Number.isFinite(jxaIndex) ? jxaIndex - 1 : null,
          matched: true,
          matchedBy: 'jxa',
        };
      }
      return { ...rest, bounds: null, display: null, zOrder: null, matched: false };
    }
    return {
      ...rest,
      bounds: cg.bounds,
      display: findDisplayId(cg.bounds, displays),
      zOrder: zOrderById.get(cg.id) ?? null,
      matched: true,
      matchedBy,
    };
  });
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

// Background keystroke injection — never raises the target window.
// Operator Terminal Inviolability (docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md,
// D24 in DIRECTIVES.md) forbids the cron pulse from stealing operator focus
// or from auto-submitting prompts into operator-visible terminal composers.
// We keep this helper only for the composer-satisfaction path (Tab/Enter) and
// the keystroke goes to `process "Terminal"` without `activate` or
// `set frontmost ... to true`. macOS may still deliver the keystroke only if
// Terminal is reachable as a System Events target; the call is best-effort
// and a failure here is logged but does not abort the pulse. If the operator
// has Terminal on another desktop or hidden, the agent's own TUI will pick
// up the queued text on its next render.
async function pressTerminalKey(windowId, keyCode) {
  await execFileAsync('osascript', [
    '-e',
    `tell application "System Events" to tell process "Terminal" to key code ${Number(keyCode)}`,
  ]);
}

// Cheap, sync check: is this terminal window currently frontmost? Used as a
// final guard before any keystroke-side path runs, so we never type into a
// window the operator just raised — they keep their selection, the keystroke
// is a no-op for that tty, and the agent's own wake-up channel (Redis
// `tnf:bus:heartbeat`) carries the heartbeat record instead.
async function isFrontmostTerminalWindow(windowId) {
  if (process.platform !== 'darwin') return false;
  const script = `
    const Terminal = Application('Terminal');
    try {
      const front = Terminal.frontmost();
      const frontWin = front ? Terminal.windows().find((w) => Number(w.id()) === ${Number(windowId)}) : null;
      JSON.stringify({ isFrontmost: Boolean(frontWin) });
    } catch (_e) {
      JSON.stringify({ isFrontmost: false });
    }
  `;
  try {
    const { stdout } = await execFileAsync('osascript', ['-l', 'JavaScript', '-e', script], {
      maxBuffer: 4096,
      timeout: 5000,
    });
    const parsed = JSON.parse(stdout || '{"isFrontmost":false}');
    return Boolean(parsed.isFrontmost);
  } catch (_error) {
    return false;
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
  // keystroke call — time passes between the earlier JXA
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

  // Operator Terminal Inviolability (D24): if this target is the window the
  // operator currently has focused, skip the UI path entirely. The heartbeat
  // record still goes out via Redis (handled by the caller), so the agent's
  // own wake-up channel carries it without us touching the operator's screen.
  let skippedFrontmost = false;
  if (target.windowId) {
    try {
      if (await isFrontmostTerminalWindow(target.windowId)) {
        skippedFrontmost = true;
      }
    } catch (_error) {
      // Treat probe failure as non-frontmost; the keystroke helpers below
      // are best-effort and a miss here just means we attempt the no-activate
      // path anyway, which is the safe default.
    }
  }
  if (skippedFrontmost) {
    return {
      agentId: target.agentId,
      tty: target.tty,
      windowId: target.windowId,
      heartbeatId: null,
      method: 'skipped-frontmost',
      submitted: false,
      skippedReason: 'target-window-is-operator-frontmost',
      enterAttempts: 0,
      queueHintPresent: false,
      injectedAt: nowIso(),
    };
  }

  const heartbeatId = `cron-heartbeat-${normalizeTty(target.tty)}-${Date.now()}`;
  const prompt = renderPrompt(target.agentId, heartbeatId);
  const escapedPrompt = `${config.clearLine ? '\u0015' : ''}${prompt}`;

  const tmuxAttempt = injectViaTmux({
    target: target.tmux && target.tmux.pane ? target.tmux : { tty: target.tty },
    text: prompt,
    allowPromptInjection: config.allowPromptInjection,
    clearLine: Boolean(config.clearLine && config.allowPromptInjection),
  });
  if (tmuxAttempt.ok) {
    return {
      agentId: target.agentId,
      tty: target.tty,
      windowId: target.windowId || null,
      heartbeatId,
      method: tmuxAttempt.method,
      submitted: Boolean(tmuxAttempt.submitted),
      skippedReason: tmuxAttempt.reason || null,
      enterAttempts: tmuxAttempt.submitted ? 1 : 0,
      queueHintPresent: false,
      injectedAt: nowIso(),
      tmux: { session: tmuxAttempt.session, pane: tmuxAttempt.pane },
    };
  }
  if (!tmuxAttempt.fallback) {
    return {
      agentId: target.agentId,
      tty: target.tty,
      windowId: target.windowId || null,
      heartbeatId: null,
      method: `skipped-${tmuxAttempt.reason}`,
      submitted: false,
      skippedReason: tmuxAttempt.reason,
      enterAttempts: 0,
      queueHintPresent: false,
      injectedAt: nowIso(),
      tmux: { session: tmuxAttempt.session || null, pane: tmuxAttempt.pane || null },
    };
  }

  // Pre-injection: non-destructive pending-prompt cleanup only.
  // Gated by allowPromptInjection so the default cron run never types into
  // a terminal composer (D24 — Operator Terminal Inviolability). When the
  // opt-in is off, stale TNF text from a prior opted-in run is left in the
  // composer and will be picked up by isTypingInTerminal on the next pulse.
  if (config.clearLine && config.allowPromptInjection && target.windowId) {
    await flushAnyPendingTnfPrompt(target.windowId);
  }

  // Two-mode injection (D24 — Operator Terminal Inviolability):
  //   - Default (allowPromptInjection=false): write the prompt text into the
  //     tab's scrollback WITHOUT submitting. The agent's own TUI sees the
  //     text on next render and the heartbeat record on `agent:activity`
  //     tells it to act. Operator focus is never raised; Enter is never
  //     pressed by this cron.
  //   - Opt-in (allowPromptInjection=true): the legacy `do script` path with
  //     a trailing newline. `do script` does not itself `activate`, but it
  //     does submit the prompt when followed by `\n` — this is the
  //     break-glass path for unattended bulk wake-ups and must be enabled
  //     per-deployment via TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION=true
  //     in the crontab env. The CI guard
  //     `scripts/protocols/check-operator-terminal-inviolability.cjs`
  //     refuses to merge any new crontab line that sets this without an
  //     attached `challenge_rationale` referencing this protocol.
  if (!config.allowPromptInjection) {
    // Non-submitting, non-activating write: `do script` with a trailing
    // literal (no `\n`) types into the tab without sending. The agent TUI
    // renders the prompt as pending input and the operator never sees the
    // window raise. If the operator then brings the tab to front and edits,
    // `isTypingInTerminal` will catch it on the next pulse.
    if (target.windowId) {
      await execFileAsync('osascript', [
        '-e',
        `tell application "Terminal" to do script "${escapedPrompt.replace(/"/g, '\\"')}" in selected tab of window id ${Number(target.windowId)}`,
      ]);
    }
    return {
      agentId: target.agentId,
      tty: target.tty,
      windowId: target.windowId,
      heartbeatId,
      method: 'terminal-do-script-pending',
      submitted: false,
      skippedReason: 'prompt-injection-not-allowed-text-only',
      enterAttempts: 0,
      queueHintPresent: false,
      injectedAt: nowIso(),
    };
  }

  // Opt-in path: legacy submit. Still does not `activate` (Terminal raises
  // the tab only when the operator has Terminal.app as the frontmost app
  // already and we don't touch that). Keep the verification/flush dance so
  // existing Codex/Claude Code composer quirks still resolve correctly.
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
    method: 'terminal-do-script-submitted',
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
    const [rawTerminals, cgCapture, processTable] = await Promise.all([
      pollTerminalWindows(),
      collectWindowBounds(),
      collectProcessTable(),
    ]);
    if (!cgCapture.displays.length) {
      cgCapture.displays = await collectDisplaysFallback();
    }
    const terminals = mergeWindowBounds(rawTerminals, cgCapture);
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
        title: terminal.customTitle,
        bounds: terminal.bounds,
        display: terminal.display,
        zOrder: terminal.zOrder,
        matched: terminal.matched,
        matchedBy: terminal.matchedBy || null,
        cwd,
        shellPid: processContext.shellPid,
        foregroundPid: processContext.foregroundPid,
        foregroundCommand: processContext.foregroundCommand,
        foregroundArgs: processContext.foregroundArgs,
        agentLike,
      });
    }

    const seenTty = new Set(observed.map((row) => normalizeTty(row.tty)).filter(Boolean));
    for (const pane of listObservedPanes()) {
      const ttyKey = normalizeTty(pane.tty);
      if (ttyKey && seenTty.has(ttyKey)) {
        const existing = observed.find((row) => normalizeTty(row.tty) === ttyKey);
        if (existing) {
          existing.tmux = {
            session: pane.session,
            window: pane.window,
            pane: pane.pane,
            class: pane.class,
          };
        }
        continue;
      }
      if (ttyKey) seenTty.add(ttyKey);
      observed.push({
        agentId: pane.tty ? getAgentId({ tty: pane.tty }) : `tnf-tmux-${pane.session}`,
        windowId: null,
        tty: pane.tty || null,
        busy: false,
        title: pane.session,
        bounds: null,
        display: null,
        zOrder: null,
        matched: true,
        matchedBy: 'tmux',
        cwd: null,
        shellPid: null,
        foregroundPid: null,
        foregroundCommand: pane.command || null,
        foregroundArgs: '',
        agentLike: pane.class === 'agent',
        tmux: pane,
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
      displays: cgCapture.displays,
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

    // Spatial snapshot for Terminal Mirror consumers (redis-ws-bridge WS
    // subscribers). Deliberately excludes contentsTail — terminal contents
    // can hold secrets and must never leave the state file unfiltered.
    await publishActivity('tnf-terminal-mirror', 'terminal_mirror_snapshot', {
      displays: cgCapture.displays,
      windows: observed.map((session) => ({
        agentId: session.agentId,
        windowId: session.windowId,
        tty: session.tty,
        busy: session.busy,
        title: session.title,
        bounds: session.bounds,
        display: session.display,
        zOrder: session.zOrder,
        agentLike: session.agentLike,
      })),
    });

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
