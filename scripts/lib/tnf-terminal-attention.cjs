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
//     last visible terminal line for an unsubmitted prompt/composer line,
//     which is what actually happens when a human is mid-keystroke.

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

function getLastVisibleLine(contents) {
  const lines = String(contents || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\[[0-9;]*m/g, ''));
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

module.exports = {
  isTtyRecentlyActive,
  readTerminalContents,
  getLastVisibleLine,
  isTypingInTerminal,
};
