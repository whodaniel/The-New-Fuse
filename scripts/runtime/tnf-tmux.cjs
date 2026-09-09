#!/usr/bin/env node
'use strict';

/**
 * TNF tmux convention helper (Phase A).
 *
 * Dedicated socket, classed session names, wrap, attach, list, reap, status.
 * Does not implement pane keystroke transport. Operator-class sessions
 * (tnf-o-*) are never reapable and never injectable.
 *
 * Plan: docs/operations/TNF_TMUX_MULTIPLEXER_CONVENTION_PLAN.md
 */

const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const AGENT_PREFIX = 'tnf-a-';
const OPERATOR_PREFIX = 'tnf-o-';
const DEFAULT_REAP_IDLE_SECONDS = 6 * 60 * 60;
const KNOWN_SHELLS = new Set(['bash', 'dash', 'fish', 'ksh', 'sh', 'tmux', 'zsh']);

function socketPath(env = process.env) {
  if (env.TNF_TMUX_SOCKET) return env.TNF_TMUX_SOCKET;
  return path.join(os.homedir(), '.tnf', 'tmux', 'tnf.sock');
}

function stateDir(env = process.env) {
  return path.dirname(socketPath(env));
}

function registryPath(env = process.env) {
  return path.join(stateDir(env), 'sessions.jsonl');
}

function ensureStateDir(env = process.env) {
  const dir = stateDir(env);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch (_error) {
    // chmod can fail on some network mounts; directory existence is enough
  }
  return dir;
}

function hostId(env = process.env) {
  if (env.TNF_TMUX_HOST_ID) return env.TNF_TMUX_HOST_ID;
  let user = 'unknown';
  try {
    user = os.userInfo().username || 'unknown';
  } catch (_error) {
    // ignore
  }
  const raw = `${os.hostname()}:${user}`;
  return `h:${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 8)}`;
}

function shortHost(env = process.env) {
  return hostId(env).replace(/^h:/, '').slice(0, 8);
}

function sanitizeSegment(value, maxLen = 24) {
  const cleaned = String(value || 'session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);
  return cleaned || 'session';
}

function sessionName({ className, agentId, slug, session }, env = process.env) {
  if (session) return String(session);
  const host = shortHost(env);
  if (className === 'operator') {
    return `${OPERATOR_PREFIX}${host}-${sanitizeSegment(slug || 'interactive', 20)}`;
  }
  return `${AGENT_PREFIX}${host}-${sanitizeSegment(agentId || 'agent', 24)}`;
}

function logicalAddress({ className, agentId, slug, incarnation }, env = process.env) {
  const hid = hostId(env);
  if (className === 'operator') {
    return `tnf/operator/${hid}/${sanitizeSegment(slug || 'interactive', 32)}`;
  }
  return `tnf/agent/${hid}/${sanitizeSegment(agentId || 'agent', 40)}/${incarnation}`;
}

function isAgentSession(name) {
  return String(name || '').startsWith(AGENT_PREFIX);
}

function isOperatorSession(name) {
  return String(name || '').startsWith(OPERATOR_PREFIX);
}

function resolveTmuxBin() {
  const candidates = [
    process.env.TNF_TMUX_BIN,
    'tmux',
    '/usr/local/bin/tmux',
    '/opt/homebrew/bin/tmux',
    '/usr/bin/tmux',
  ].filter(Boolean);
  for (const bin of candidates) {
    if (bin === 'tmux') {
      const result = spawnSync('sh', ['-c', 'command -v tmux'], { encoding: 'utf8' });
      const found = String(result.stdout || '').trim();
      if (result.status === 0 && found) return found;
      continue;
    }
    try {
      if (fs.existsSync(bin) && fs.statSync(bin).isFile()) return bin;
    } catch (_error) {
      // try next candidate
    }
  }
  return null;
}

function tmuxAvailable() {
  return Boolean(resolveTmuxBin());
}

function alreadyInTnfTmux(env = process.env) {
  const tmux = String(env.TMUX || '');
  if (!tmux) return false;
  const sock = socketPath(env);
  const current = tmux.split(',')[0];
  return current === sock;
}

function runTmux(args, env = process.env, extra = {}) {
  const bin = resolveTmuxBin();
  if (!bin) {
    return { status: 127, stdout: '', stderr: 'tmux-not-installed', pid: 0 };
  }
  return spawnSync(bin, ['-S', socketPath(env), ...args], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    ...extra,
  });
}

function appendRegistry(record, env = process.env) {
  ensureStateDir(env);
  fs.appendFileSync(registryPath(env), `${JSON.stringify(record)}\n`);
}

function inspectSession(session, env = process.env) {
  const result = runTmux(
    [
      'list-panes',
      '-t',
      session,
      '-F',
      '#{session_name}\t#{window_id}\t#{pane_id}\t#{pane_tty}\t#{pane_pid}\t#{pane_current_command}\t#{pane_dead}\t#{session_activity}\t#{session_attached}',
    ],
    env
  );
  if (result.status !== 0) return null;
  const line = String(result.stdout || '')
    .trim()
    .split('\n')
    .filter(Boolean)[0];
  if (!line) return null;
  const [name, window, pane, tty, pid, command, dead, activity, attached] = line.split('\t');
  return {
    session: name,
    window,
    pane,
    tty,
    pid,
    command,
    dead,
    activity,
    attached,
  };
}

function normalizeTty(tty) {
  return String(tty || '').replace(/^\/dev\//, '');
}

function resolvePaneByTty(tty, env = process.env) {
  const want = normalizeTty(tty);
  if (!want) return null;
  return (
    listPanes(env).find((pane) => normalizeTty(pane.tty) === want) || null
  );
}

function activePaneId(session, env = process.env) {
  const result = runTmux(['display-message', '-p', '-t', session, '#{pane_id}'], env);
  if (result.status !== 0) return null;
  return String(result.stdout || '').trim() || null;
}

function listClients(session, env = process.env) {
  const result = runTmux(['list-clients', '-t', session], env);
  if (result.status !== 0) return [];
  return String(result.stdout || '')
    .trim()
    .split('\n')
    .filter(Boolean);
}

function listPanes(env = process.env) {
  const result = runTmux(
    [
      'list-panes',
      '-a',
      '-F',
      '#{session_name}\t#{window_id}\t#{pane_id}\t#{pane_tty}\t#{pane_current_command}\t#{pane_dead}\t#{session_activity}\t#{session_attached}',
    ],
    env
  );
  if (result.status !== 0) return [];
  return String(result.stdout || '')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [session, window, pane, tty, command, dead, activity, attached] = line.split('\t');
      return { session, window, pane, tty, command, dead, activity, attached };
    });
}

function shouldReapSession(info, options = {}) {
  const nowMs = options.nowMs || Date.now();
  const rawIdle = options.idleSeconds;
  const parsedIdle = Number(rawIdle);
  const idleSeconds =
    Number.isFinite(parsedIdle) && parsedIdle >= 0 ? parsedIdle : DEFAULT_REAP_IDLE_SECONDS;
  const name = info && info.session;
  if (!isAgentSession(name)) {
    return {
      reap: false,
      reason: isOperatorSession(name) ? 'operator-class' : 'not-tnf-agent',
    };
  }
  const clientCount = Array.isArray(info.clients) ? info.clients.length : Number(info.attached || 0);
  if (clientCount > 0) {
    return { reap: false, reason: 'attached-client' };
  }
  const activity = Number(info.activity || 0);
  const idle = activity ? nowMs / 1000 - activity : idleSeconds + 1;
  if (idle < idleSeconds) {
    return { reap: false, reason: 'not-idle', idleSeconds: Math.floor(idle) };
  }
  const cmd = path.basename(String(info.command || ''));
  const commandGone = String(info.dead) === '1' || !cmd || KNOWN_SHELLS.has(cmd);
  if (!commandGone) {
    return { reap: false, reason: 'command-alive', command: cmd };
  }
  return { reap: true, reason: 'idle-and-command-gone' };
}

function wrap(options, env = process.env) {
  const className = options.className === 'operator' ? 'operator' : 'agent';
  const command = Array.isArray(options.command) ? options.command.filter(Boolean) : [];
  if (!command.length) {
    return { ok: false, error: 'wrap-requires-command' };
  }
  if (!tmuxAvailable()) {
    return { ok: false, error: 'tmux-not-installed', fallback: true };
  }
  if (alreadyInTnfTmux(env) && !options.forceNew) {
    return {
      ok: true,
      skipped: 'already-in-tnf-tmux',
      socket: socketPath(env),
      class: className,
    };
  }

  ensureStateDir(env);
  const incarnation = options.incarnation || String(Date.now());
  const session = sessionName({ className, agentId: options.agentId, slug: options.slug, session: options.session }, env);
  const address = logicalAddress({ className, agentId: options.agentId, slug: options.slug, incarnation }, env);
  const cwd = options.cwd || process.cwd();

  const existing = runTmux(['has-session', '-t', session], env);
  if (existing.status === 0) {
    const live = inspectSession(session, env);
    const cmd = path.basename(String((live && live.command) || ''));
    const dead = live && String(live.dead) === '1';
    const alive = live && !dead && cmd && !KNOWN_SHELLS.has(cmd);
    if (className === 'operator' || alive) {
      return {
        ok: true,
        reused: true,
        class: className,
        address,
        session,
        host_id: hostId(env),
        socket: socketPath(env),
        tmux: {
          socket: socketPath(env),
          session,
          window: live && live.window,
          pane: live && live.pane,
        },
        tty: live && live.tty,
      };
    }
    runTmux(['kill-session', '-t', session], env);
  }

  const envPrefix = [
    'env',
    'TNF_TMUX_WRAP=0',
    `TNF_TMUX_SESSION=${session}`,
    `TNF_TMUX_CLASS=${className}`,
    `TNF_TMUX_ADDRESS=${address}`,
    `TERMINAL_TWIP_SOCKET=${socketPath(env)}`,
  ];
  const created = runTmux(
    ['new-session', '-d', '-s', session, '-c', cwd, '--', ...envPrefix, ...command],
    env
  );
  if (created.status !== 0) {
    return {
      ok: false,
      error: String(created.stderr || created.stdout || 'tmux-new-session-failed').trim(),
      session,
    };
  }

  runTmux(['set-option', '-t', session, '@tnf_address', address], env);
  runTmux(['set-option', '-t', session, '@tnf_class', className], env);

  const live = inspectSession(session, env) || {};
  const record = {
    event: 'wrap',
    class: className,
    address,
    tmux: {
      socket: socketPath(env),
      session,
      window: live.window || '0',
      pane: live.pane || null,
    },
    tty: live.tty || null,
    host_id: hostId(env),
    agent_id: options.agentId || null,
    slug: options.slug || null,
    created_at: new Date().toISOString(),
  };
  if (!options.noRegister) appendRegistry(record, env);

  return {
    ok: true,
    created: true,
    session,
    socket: socketPath(env),
    ...record,
  };
}

function attach(session, env = process.env) {
  if (!session) return { ok: false, error: 'attach-requires-session' };
  if (!tmuxAvailable()) return { ok: false, error: 'tmux-not-installed' };
  if (!process.stdout.isTTY) {
    const bin = resolveTmuxBin() || 'tmux';
    return {
      ok: true,
      printed: true,
      command: `${bin} -S ${socketPath(env)} attach -t ${session}`,
    };
  }
  const bin = resolveTmuxBin();
  if (!bin) return { ok: false, error: 'tmux-not-installed' };
  const result = spawnSync(bin, ['-S', socketPath(env), 'attach', '-t', session], {
    stdio: 'inherit',
  });
  return { ok: result.status === 0, status: result.status };
}

function reap(options = {}, env = process.env) {
  const rawIdle = options.idleSeconds != null ? options.idleSeconds : env.TNF_TMUX_REAP_IDLE_SECONDS;
  const parsedIdle = Number(rawIdle);
  const idleSeconds = Number.isFinite(parsedIdle) && parsedIdle >= 0 ? parsedIdle : DEFAULT_REAP_IDLE_SECONDS;
  const dryRun = options.dryRun === true;
  if (!tmuxAvailable()) {
    return { ok: false, error: 'tmux-not-installed', considered: [], reaped: [] };
  }
  const panes = listPanes(env);
  const bySession = new Map();
  for (const pane of panes) {
    if (!bySession.has(pane.session)) bySession.set(pane.session, pane);
  }
  const considered = [];
  const reaped = [];
  const skipped = [];
  for (const [name, pane] of bySession) {
    const clients = listClients(name, env);
    const decision = shouldReapSession(
      { ...pane, clients, attached: clients.length },
      { idleSeconds, nowMs: Date.now() }
    );
    const row = { session: name, class: isOperatorSession(name) ? 'operator' : isAgentSession(name) ? 'agent' : 'other', ...decision };
    considered.push(row);
    if (!decision.reap) {
      skipped.push(row);
      continue;
    }
    if (!dryRun) {
      const killed = runTmux(['kill-session', '-t', name], env);
      if (killed.status !== 0) {
        skipped.push({ ...row, reason: 'kill-failed' });
        continue;
      }
      appendRegistry(
        {
          event: 'reap',
          class: 'agent',
          session: name,
          reason: decision.reason,
          at: new Date().toISOString(),
        },
        env
      );
    }
    reaped.push(row);
  }
  return { ok: true, dryRun, idleSeconds, considered, reaped, skipped };
}

function status(env = process.env) {
  const sock = socketPath(env);
  const available = tmuxAvailable();
  const panes = available ? listPanes(env) : [];
  const sessions = [...new Set(panes.map((p) => p.session))];
  return {
    ok: true,
    tmuxAvailable: available,
    socket: sock,
    stateDir: stateDir(env),
    registry: registryPath(env),
    inTnfTmux: alreadyInTnfTmux(env),
    sessionCount: sessions.length,
    paneCount: panes.length,
    agentSessions: sessions.filter(isAgentSession),
    operatorSessions: sessions.filter(isOperatorSession),
  };
}

function printHelp() {
  const text = `TNF tmux convention helper

Usage:
  node scripts/runtime/tnf-tmux.cjs <command> [options]

Commands:
  status [--json]
  list [--json]
  wrap --class agent|operator [--agent-id ID] [--slug SLUG]
       [--session NAME] [--cwd DIR] [--detach] [--json] -- <command...>
  attach <session>
  reap [--dry-run] [--idle-seconds N] [--json]

Socket: $TNF_TMUX_SOCKET or ~/.tnf/tmux/tnf.sock
Agent sessions:    tnf-a-<host>-<agentId>   (reapable when idle)
Operator sessions: tnf-o-<host>-<slug>      (never injectable, never reaped)

Pane keystroke transport is not in this helper. See tnf-tmux-inject.cjs and the multiplexer convention plan.
`;
  process.stdout.write(text);
}

function parseArgv(argv) {
  const args = argv.slice(2);
  const out = { cmd: 'status', options: {}, command: [] };
  if (!args.length || args[0] === '-h' || args[0] === '--help') {
    out.cmd = args.length ? 'help' : 'status';
    return out;
  }
  out.cmd = args[0];
  const rest = args.slice(1);
  const dash = rest.indexOf('--');
  const flagPart = dash >= 0 ? rest.slice(0, dash) : rest;
  if (dash >= 0) out.command = rest.slice(dash + 1);
  for (let i = 0; i < flagPart.length; i += 1) {
    const token = flagPart[i];
    const next = () => flagPart[(i += 1)];
    if (token === '--json') out.options.json = true;
    else if (token === '--detach') out.options.detach = true;
    else if (token === '--dry-run') out.options.dryRun = true;
    else if (token === '--no-register') out.options.noRegister = true;
    else if (token === '--class') out.options.className = next();
    else if (token === '--agent-id') out.options.agentId = next();
    else if (token === '--slug') out.options.slug = next();
    else if (token === '--session') out.options.session = next();
    else if (token === '--cwd') out.options.cwd = next();
    else if (token === '--idle-seconds') out.options.idleSeconds = next();
    else if (token === '--incarnation') out.options.incarnation = next();
    else if (!token.startsWith('-') && out.cmd === 'wrap') out.command.push(token);
    else if (!token.startsWith('-') && (out.cmd === 'attach' || out.cmd === 'has')) {
      out.options.session = token;
    }
  }
  return out;
}

function emit(result, asJson) {
  if (asJson || !process.stdout.isTTY) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function main(argv = process.argv) {
  const parsed = parseArgv(argv);
  if (parsed.cmd === 'help') {
    printHelp();
    return 0;
  }
  if (parsed.cmd === 'status') {
    emit(status(), parsed.options.json);
    return 0;
  }
  if (parsed.cmd === 'list') {
    const panes = tmuxAvailable() ? listPanes() : [];
    emit({ ok: true, socket: socketPath(), panes }, parsed.options.json);
    return 0;
  }
  if (parsed.cmd === 'wrap') {
    if (!parsed.options.className) {
      emit({ ok: false, error: 'wrap-requires-class' }, true);
      return 2;
    }
    if (parsed.options.className !== 'agent' && parsed.options.className !== 'operator') {
      emit({ ok: false, error: 'wrap-class-must-be-agent-or-operator' }, true);
      return 2;
    }
    const result = wrap({
      className: parsed.options.className,
      agentId: parsed.options.agentId,
      slug: parsed.options.slug,
      session: parsed.options.session,
      cwd: parsed.options.cwd,
      incarnation: parsed.options.incarnation,
      command: parsed.command,
      detach: parsed.options.detach,
      noRegister: parsed.options.noRegister,
    });
    emit(result, true);
    if (!result.ok) return 1;
    const shouldAttach = !parsed.options.detach && process.stdout.isTTY && result.session;
    if (shouldAttach) {
      const attached = attach(result.session);
      return attached.ok ? 0 : 1;
    }
    return 0;
  }
  if (parsed.cmd === 'attach') {
    const result = attach(parsed.options.session);
    if (result.printed) {
      process.stdout.write(`${result.command}\n`);
      return 0;
    }
    if (!result.ok && result.error) emit(result, true);
    return result.ok ? 0 : 1;
  }
  if (parsed.cmd === 'reap') {
    const result = reap({
      dryRun: parsed.options.dryRun,
      idleSeconds: parsed.options.idleSeconds,
    });
    emit(result, true);
    return result.ok ? 0 : 1;
  }
  printHelp();
  return 2;
}

module.exports = {
  AGENT_PREFIX,
  OPERATOR_PREFIX,
  DEFAULT_REAP_IDLE_SECONDS,
  resolveTmuxBin,
  socketPath,
  stateDir,
  registryPath,
  hostId,
  shortHost,
  sanitizeSegment,
  sessionName,
  logicalAddress,
  isAgentSession,
  isOperatorSession,
  tmuxAvailable,
  alreadyInTnfTmux,
  shouldReapSession,
  inspectSession,
  listPanes,
  listClients,
  runTmux,
  resolvePaneByTty,
  activePaneId,
  normalizeTty,
  wrap,
  attach,
  reap,
  status,
  parseArgv,
  main,
};

if (require.main === module) {
  process.exit(main(process.argv));
}
