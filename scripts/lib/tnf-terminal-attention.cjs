#!/usr/bin/env node

// Shared human-attention detection for terminal-injection scripts.
// Extracted from scripts/relay-channel-monitor.cjs (readTerminalContents,
// getLastVisibleLine, isTypingInTerminal) plus one new cheap pre-filter,
// isTtyRecentlyActive, added for scripts/runtime/terminal-heartbeat-pulse.cjs.
//
// Two layers, both intentionally conservative (err toward skipping):
//   - isTtyRecentlyActive: cheap, sync, stats the tty device's mtime. Any
//     I/O (agent output included, not just human keystrokes) counts as
//     "recent activity" — a deliberately over-protective proxy used only
//     to avoid unnecessary osascript round-trips before the real check.
//   - isTypingInTerminal: the authoritative signal. Pattern-matches the
//     trailing visible terminal lines for an unsubmitted prompt/composer
//     line, which is what actually happens when a human is mid-keystroke.
//     Checks BOTH the last visible line (plain shells, Codex `›` composer)
//     AND a small trailing window for boxed-TUI composers (Claude Code and
//     other Ink-style TUIs) whose input line renders above a bottom border
//     and status lines — see hasBoxedComposerText.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

function normalizeTty(tty) {
  return String(tty || '').replace(/^\/dev\//, '');
}

function isTtyRecentlyActive(tty, thresholdMs, statFn = fs.statSync) {
  const normalized = normalizeTty(tty);
  if (!normalized) return false;
  try {
    const stat = statFn(path.join('/dev', normalized));
    return Date.now() - stat.mtimeMs < thresholdMs;
  } catch (_error) {
    // If we can't stat the tty, don't let that block injection on its own —
    // the authoritative isTypingInTerminal check still runs afterward.
    return false;
  }
}

async function readTerminalContents(windowId, execFn = execFileAsync) {
  const { stdout } = await execFn('osascript', [
    '-e',
    `tell application "Terminal" to contents of selected tab of window id ${Number(windowId)}`,
  ]);
  return String(stdout || '');
}

function stripAnsi(line) {
  return String(line || '').replace(/\[[0-9;]*[A-Za-z]/g, '');
}

function getLastVisibleLine(contents) {
  const lines = String(contents || '')
    .split(/\r?\n/)
    .map(stripAnsi);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (line && line.trim()) return line;
  }
  return '';
}

// How many trailing visible lines to scan for a boxed-TUI composer. Boxed
// composers render their input line ABOVE a bottom border (╰───╯) and one or
// more status/hint lines, so the composer is never the last visible line.
// The window is kept small so `│ > …` lines inside earlier scrollback or
// quoted output can't false-positive.
const COMPOSER_SCAN_WINDOW = 12;

function isTnfInjectedText(text) {
  return text.startsWith('TNF wake') || text.startsWith('TNF heartbeat');
}

// Detect an unsubmitted human line inside a box-drawing composer, e.g.
// Claude Code's `│ > half-typed sentence          │`. Returns true only when
// the composer holds real text — not empty, not the idle placeholder hint,
// and not our own pending TNF injection. This is the guard that previously
// missed: isTypingInTerminal only looked at the LAST visible line, which in
// a boxed TUI is the border/status line, so heartbeat text spliced into a
// half-typed human sentence and got submitted merged.
function hasBoxedComposerText(contents) {
  const lines = String(contents || '').split(/\r?\n/).map(stripAnsi);
  const tail = [];
  for (let i = lines.length - 1; i >= 0 && tail.length < COMPOSER_SCAN_WINDOW; i -= 1) {
    if (lines[i] && lines[i].trim()) tail.push(lines[i]);
  }
  for (const line of tail) {
    const m = line.trim().match(/^[│┃]\s*[>›❯]\s?(.*?)\s*[│┃]?$/);
    if (!m) continue;
    const text = String(m[1] || '').trim();
    if (!text) return false; // empty composer — safe to inject
    if (isTnfInjectedText(text)) return false; // our own pending injection
    if (text.startsWith('Try "')) return false; // idle-composer placeholder hint
    return true;
  }
  return false;
}

function isTypingInTerminal(contents) {
  if (hasBoxedComposerText(contents)) return true;
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
  if (isTnfInjectedText(tail)) return false;
  return true;
}

module.exports = {
  isTtyRecentlyActive,
  readTerminalContents,
  getLastVisibleLine,
  hasBoxedComposerText,
  isTypingInTerminal,
};
