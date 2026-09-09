#!/usr/bin/env node
'use strict';

/**
 * Sole allowlisted tmux keystroke transport (D24).
 *
 * Every pane write goes through shouldInjectTmuxPane before a keystroke
 * is issued. Operator-class sessions (tnf-o-*) are a hard deny. Enter is
 * opt-in only (allowPromptInjection).
 *
 * Do not call tmux send-keys from any other script.
 */

const fs = require('fs');
const path = require('path');
const {
  isTtyRecentlyActive,
  isTypingInTerminal,
} = require(path.join(__dirname, 'tnf-terminal-attention.cjs'));

function resolveTmuxHelper() {
  const candidates = [
    path.join(__dirname, '..', 'runtime', 'tnf-tmux.cjs'),
    path.join(__dirname, '..', '..', 'scripts', 'runtime', 'tnf-tmux.cjs'),
  ];
  try {
    const { resolveTnfRepo } = require(path.join(__dirname, 'resolve-tnf-repo.cjs'));
    const repoRoot = resolveTnfRepo();
    if (repoRoot) {
      candidates.push(path.join(repoRoot, 'scripts', 'runtime', 'tnf-tmux.cjs'));
    }
  } catch (_error) {
    // resolve-tnf-repo is optional outside the monorepo mirror layout.
  }
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error(
    `[tnf-tmux-inject] unable to locate tnf-tmux.cjs (tried: ${candidates.join(', ')})`
  );
}

const tmux = resolveTmuxHelper();

function shouldInjectTmuxPane(info, options = {}) {
  const session = info && info.session;
  if (tmux.isOperatorSession(session)) {
    return { ok: false, reason: 'operator-class' };
  }
  if (!tmux.isAgentSession(session)) {
    return { ok: false, reason: 'not-tnf-agent' };
  }
  if (info.recentlyActive) {
    return { ok: false, reason: 'tty-recently-active' };
  }
  if (info.attached && info.activePane && info.pane && info.activePane === info.pane) {
    return { ok: false, reason: 'attached-active-pane' };
  }
  if (info.contents != null && isTypingInTerminal(info.contents)) {
    return { ok: false, reason: 'typing-in-progress' };
  }
  if (options.requireAgentClass === false) {
    return { ok: false, reason: 'invalid-options' };
  }
  return { ok: true };
}

function gatherPaneInfo(ttyOrPane, env = process.env) {
  const pane =
    ttyOrPane && ttyOrPane.pane && ttyOrPane.session
      ? ttyOrPane
      : tmux.resolvePaneByTty(ttyOrPane && ttyOrPane.tty ? ttyOrPane.tty : ttyOrPane, env);
  if (!pane) return null;
  const clients = tmux.listClients(pane.session, env);
  const activePane = clients.length ? tmux.activePaneId(pane.session, env) : null;
  const captured = tmux.runTmux(
    ['capture-pane', '-p', '-J', '-t', pane.pane, '-S', '-80'],
    env
  );
  const contents = captured.status === 0 ? String(captured.stdout || '') : '';
  const recentlyActive = pane.tty
    ? isTtyRecentlyActive(pane.tty, optionsIdleMs(env))
    : false;
  return {
    ...pane,
    attached: clients.length > 0,
    clients,
    activePane,
    contents,
    recentlyActive,
  };
}

function optionsIdleMs(env) {
  const parsed = Number.parseInt(String(env.TNF_TERMINAL_HEARTBEAT_IDLE_THRESHOLD_MS || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6000;
}

function injectViaTmux(options, env = process.env) {
  if (!tmux.tmuxAvailable()) {
    return { ok: false, fallback: true, reason: 'tmux-not-installed' };
  }
  const info = gatherPaneInfo(options.target || options, env);
  if (!info) {
    return { ok: false, fallback: true, reason: 'no-tmux-pane' };
  }
  const decision = shouldInjectTmuxPane(info);
  if (!decision.ok) {
    return {
      ok: false,
      fallback: false,
      reason: decision.reason,
      session: info.session,
      pane: info.pane,
    };
  }

  const text = String(options.text || '');
  if (!text) {
    return { ok: false, reason: 'empty-text', session: info.session, pane: info.pane };
  }

  if (options.clearLine) {
    const cleared = tmux.runTmux(['send-keys', '-t', info.pane, 'C-u'], env);
    if (cleared.status !== 0) {
      return { ok: false, fallback: true, reason: 'send-failed', session: info.session, pane: info.pane };
    }
  }

  const typed = tmux.runTmux(['send-keys', '-t', info.pane, '-l', '--', text], env);
  if (typed.status !== 0) {
    return { ok: false, fallback: true, reason: 'send-failed', session: info.session, pane: info.pane };
  }

  let submitted = false;
  if (options.allowPromptInjection) {
    const entered = tmux.runTmux(['send-keys', '-t', info.pane, 'Enter'], env);
    submitted = entered.status === 0;
  }

  return {
    ok: true,
    method: submitted ? 'tmux-send-keys-submit' : 'tmux-send-keys-pending',
    submitted,
    session: info.session,
    pane: info.pane,
    tty: info.tty,
    reason: submitted ? null : 'prompt-injection-not-allowed-text-only',
  };
}

function listObservedPanes(env = process.env) {
  if (!tmux.tmuxAvailable()) return [];
  return tmux.listPanes(env).map((pane) => ({
    session: pane.session,
    window: pane.window,
    pane: pane.pane,
    tty: pane.tty,
    command: pane.command,
    class: tmux.isOperatorSession(pane.session)
      ? 'operator'
      : tmux.isAgentSession(pane.session)
        ? 'agent'
        : 'other',
  }));
}

module.exports = {
  shouldInjectTmuxPane,
  gatherPaneInfo,
  injectViaTmux,
  listObservedPanes,
};
