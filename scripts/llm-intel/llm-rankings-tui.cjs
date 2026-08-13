#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data/llm-intel');
const INTEL_FILE = path.join(DATA_DIR, 'arena-intel-latest.json');
const RECS_FILE = path.join(DATA_DIR, 'ranking-recommendations.json');

const ESC = '\x1b[';
const RESET = ESC + '0m';
const BOLD = ESC + '1m';
const DIM = ESC + '2m';
const RED = ESC + '31m';
const GREEN = ESC + '32m';
const YELLOW = ESC + '33m';
const BLUE = ESC + '34m';
const MAGENTA = ESC + '35m';
const CYAN = ESC + '36m';
const BG_BLUE = ESC + '44m';
const BG_GRAY = ESC + '48;5;236m';

function loadJSON(f) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

function clear() { process.stdout.write(ESC + '2J' + ESC + 'H'); }

function moveCursor(row, col) { process.stdout.write(ESC + `${row};${col}H`); }

function writeAt(row, col, text) {
  moveCursor(row, col);
  process.stdout.write(text);
}

function bar(pct, width) {
  const filled = Math.round(pct / 100 * width);
  return CYAN + '█'.repeat(filled) + DIM + '░'.repeat(width - filled) + RESET;
}

function healthBadge(status) {
  switch (status) {
    case 'live': return GREEN + '● LIVE' + RESET;
    case 'slow': return YELLOW + '◐ SLOW' + RESET;
    case 'eol': return RED + '✕ EOL ' + RESET;
    case 'error': return RED + '⚠ ERR ' + RESET;
    default: return DIM + '  ??? ' + RESET;
  }
}

function actionBadge(action) {
  switch (action) {
    case 'add': return GREEN + 'ADD   ' + RESET;
    case 'reorder': return CYAN + 'REORD ' + RESET;
    case 'remove-eol': return RED + 'RM-EOL' + RESET;
    case 'demote': return YELLOW + 'DEMOT ' + RESET;
    default: return DIM + action.padEnd(6) + RESET;
  }
}

function truncate(s, len) {
  if (!s) return ''.padEnd(len);
  s = String(s);
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

let tab = 0;
const TAB_NAMES = ['Rankings', 'Recommendations', 'NVIDIA Health', 'News'];

function render() {
  const intel = loadJSON(INTEL_FILE);
  const recs = loadJSON(RECS_FILE);
  const scores = recs?.compositeScores || [];
  const recommendations = recs?.recommendations || [];
  const nvidiaHealth = intel?.nvidiaHealth || [];
  const newsDigest = recs?.newsDigest || [];
  const summary = recs?.summary || intel?.summary || {};

  const W = process.stdout.columns || 120;
  const H = process.stdout.rows || 40;

  clear();

  writeAt(1, 1, BOLD + CYAN + ' TNF LLM Rankings Dashboard ' + RESET);
  writeAt(1, 35, DIM + (intel?.completedAt ? new Date(intel.completedAt).toLocaleString() : 'No data') + RESET);

  const tabLine = TAB_NAMES.map((t, i) =>
    (i === tab ? BG_BLUE + BOLD + ' ' + t + ' ' + RESET : DIM + ' ' + t + ' ' + RESET)
  ).join(DIM + '│' + RESET);
  writeAt(2, 1, tabLine);

  const statsLine = [
    `${BOLD}Models:${RESET} ${summary.totalModelsScored || 0}`,
    `${GREEN}Live:${RESET} ${summary.liveModels || 0}`,
    `${YELLOW}Slow:${RESET} ${summary.nvidiaSlow || 0}`,
    `${CYAN}Recs:${RESET} ${summary.recommendationsCount || 0}`,
    `${MAGENTA}News:${RESET} ${summary.newsItems || 0}`,
  ].join(DIM + '  │  ' + RESET);
  writeAt(3, 1, statsLine);

  writeAt(4, 1, DIM + '─'.repeat(W) + RESET);

  let row = 6;

  if (tab === 0) {
    writeAt(row, 1, BOLD + ' Rank  Model                                Arena   Health   Latency   Score' + RESET);
    row++;
    writeAt(row, 1, DIM + '─'.repeat(W) + RESET);
    row++;
    const maxScore = Math.max(...scores.map(s => s.avgArenaScore || 0), 1);
    for (const s of scores.slice(0, H - row - 2)) {
      const pct = s.avgArenaScore ? (s.avgArenaScore / maxScore * 100) : 0;
      const line = [
        ('' + (s.compositeRank || '-')).padStart(4),
        '  ',
        CYAN + truncate(s.nvidiaId, 36) + RESET,
        '  ',
        ('' + (s.avgArenaScore || '-')).padStart(5),
        '  ',
        healthBadge(s.healthStatus),
        '  ',
        (s.latencyMs ? (s.latencyMs + 'ms').padStart(7) : '     - '),
        '  ',
        bar(pct, 20),
      ].join('');
      writeAt(row, 1, line);
      row++;
    }
  } else if (tab === 1) {
    writeAt(row, 1, BOLD + ' Action   Model                                CurP  PropP  Delta  Reason' + RESET);
    row++;
    writeAt(row, 1, DIM + '─'.repeat(W) + RESET);
    row++;
    for (const r of recommendations.slice(0, H - row - 2)) {
      const delta = r.delta === 'new' ? '+new' : (typeof r.delta === 'number' ? (r.delta > 0 ? '+' : '') + r.delta : String(r.delta));
      const line = [
        actionBadge(r.action),
        '  ',
        CYAN + truncate(r.model, 36) + RESET,
        '  ',
        ('' + (r.currentPriority ?? '-')).padStart(4),
        '  ',
        ('' + (r.proposedPriority ?? '-')).padStart(4),
        '  ',
        delta.padStart(5),
        '  ',
        DIM + truncate(r.reason, W - 80) + RESET,
      ].join('');
      writeAt(row, 1, line);
      row++;
    }
  } else if (tab === 2) {
    writeAt(row, 1, BOLD + ' Model                                Status       HTTP   Latency' + RESET);
    row++;
    writeAt(row, 1, DIM + '─'.repeat(W) + RESET);
    row++;
    for (const h of nvidiaHealth.slice(0, H - row - 2)) {
      const line = [
        CYAN + truncate(h.model, 36) + RESET,
        '  ',
        healthBadge(h.status),
        '  ',
        ('' + (h.httpStatus || '-')).padStart(5),
        '  ',
        (h.latencyMs ? (h.latencyMs + 'ms').padStart(7) : '     - '),
      ].join('');
      writeAt(row, 1, line);
      row++;
    }
  } else if (tab === 3) {
    for (const n of newsDigest.slice(0, Math.floor((H - row - 2) / 3))) {
      const title = truncate(n.title || 'Untitled', W - 4);
      writeAt(row, 1, BOLD + title + RESET);
      row++;
      const meta = `${n.source} · ${n.sentiment} · ${n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '?'}`;
      writeAt(row, 1, DIM + meta + RESET);
      row++;
      if (n.relevantNvidiaModels?.length) {
        writeAt(row, 1, CYAN + '  ' + n.relevantNvidiaModels.join(', ') + RESET);
        row++;
      }
      row++;
    }
  }

  writeAt(H, 1, DIM + '─'.repeat(W) + RESET);
  writeAt(H + 1, 1, DIM + ' [1-4] Tab  [q] Quit  [r] Reload  [↑↓] Scroll' + RESET);
}

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (buf) => {
  const key = buf.toString();
  if (key === 'q' || key === '\x03') {
    clear();
    process.exit(0);
  }
  if (key === '1') { tab = 0; render(); }
  if (key === '2') { tab = 1; render(); }
  if (key === '3') { tab = 2; render(); }
  if (key === '4') { tab = 3; render(); }
  if (key === 'r') { render(); }
});

process.stdout.on('resize', () => render());

render();
