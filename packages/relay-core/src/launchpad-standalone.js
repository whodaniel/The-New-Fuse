#!/usr/bin/env node
const { readFileSync, writeFileSync, existsSync, appendFileSync } = require('fs');
const { join } = require('path');

const IS_DRY_RUN = process.env.LAUNCHPAD_DRY_RUN !== 'false';
const INTERVAL_MS = parseInt(process.env.LAUNCH_INTERVAL_MS || '300000');
const BACKLOG_PATH = join(process.cwd(), 'docs', 'LAUNCH_BACKLOG.md');
const LOG_PATH = join(process.cwd(), 'docs', 'LAUNCH_LOG.md');
const STATE_FILE = '/tmp/.launchpad-state.json';
const LOG_FILE = '/tmp/launchpad.log';

function log(msg) {
  const ts = new Date().toISOString();
  console.log('[' + ts + '] ' + msg);
  try { appendFileSync(LOG_FILE, '[' + ts + '] ' + msg + String.fromCharCode(10)); } catch (e) {}
}

function loadState() {
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); }
  catch { return { lastIndex: -1, runs: 0 }; }
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getBacklogItems(content) {
  const items = [];
  const lines = content.split(String.fromCharCode(10));
  let inTable = false;
  for (const line of lines) {
    if (line.trim() === '| Agent |') { inTable = true; continue; }
    if (!inTable) continue;
    if (line.includes('---') || !line.startsWith('|') || line.includes('Agent') || line.includes('**')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 4 && cols[3] && !cols[3].includes('DONE') && !cols[3].includes('LAUNCHED') && !cols[3].includes('DRY')) {
      items.push({ name: cols[1], agents: cols[2], spec: cols[3], status: cols[4] || '' });
    }
    if (cols[0] === '---') break;
  }
  return items;
}

function runCycle() {
  const state = loadState();
  state.runs++;
  log('=== Launchpad Cycle #' + state.runs + ' ===');
  if (!existsSync(BACKLOG_PATH)) { log('No backlog, standing by.'); return; }
  const backlog = readFileSync(BACKLOG_PATH, 'utf8');
  const items = getBacklogItems(backlog);
  log('Pending items: ' + items.length);
  if (items.length === 0) { log('No pending items. Standing by.'); return; }
  const nextIndex = (state.lastIndex + 1) % items.length;
  const next = items[nextIndex];
  state.lastIndex = nextIndex;
  saveState(state);
  log('LAUNCHING: ' + next.name + ' => ' + next.agents + ' | spec: ' + next.spec);
  const flag = IS_DRY_RUN ? '🔍 DRY RUN' : '🚀 LAUNCHED';
  const date = new Date().toISOString().split('T')[0];
  const logEntry = String.fromCharCode(10) + '| ' + date + ' | **' + next.name + '** | ' + next.agents + ' | ' + next.spec + ' | ' + flag + ' |';
  if (existsSync(LOG_PATH)) { appendFileSync(LOG_PATH, logEntry); }
  else {
    writeFileSync(LOG_PATH, '# TNF Launch Log' + String.fromCharCode(10) + String.fromCharCode(10) + '| Date | Launch | Agent | Spec | Status |' + String.fromCharCode(10) + '|------|--------|-------|------|--------|' + logEntry + String.fromCharCode(10));
  }
  log('Cycle #' + state.runs + ' done. Next in ' + (INTERVAL_MS/1000) + 's');
}

log('Launchpad starting — DRY_RUN=' + IS_DRY_RUN + ' — every ' + (INTERVAL_MS/1000) + 's');
runCycle();
setInterval(runCycle, INTERVAL_MS);
