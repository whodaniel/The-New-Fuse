#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const ASSETS_DIR = path.join(ROOT, 'assets/generated/poker');
const TASK_PACKET_PATH = path.join(DOCS, 'NANOBANANA_POKER_GRAPHICS_TASK_PACKET.json');
const OUT_JSON = path.join(DOCS, 'NANOBANANA_POKER_PROGRESS.json');
const OUT_MD = path.join(DOCS, 'NANOBANANA_POKER_PROGRESS.md');

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of readdirSync(cur, { withFileTypes: true })) {
      const abs = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(abs);
      else if (ent.isFile()) out.push(abs);
    }
  }
  return out;
}

function laneSummary(tasks, presentByBase) {
  const lanes = new Map();
  for (const task of tasks) {
    const lane = task.lane || 'unassigned';
    if (!lanes.has(lane)) {
      lanes.set(lane, { lane, total: 0, done: 0, missing: [] });
    }
    const row = lanes.get(lane);
    row.total += 1;
    const file = String(task.filename || '');
    if (presentByBase.has(path.basename(file))) row.done += 1;
    else row.missing.push(file);
  }
  return [...lanes.values()].map((x) => ({
    ...x,
    percent: x.total > 0 ? Number(((x.done / x.total) * 100).toFixed(2)) : 0,
  }));
}

function main() {
  if (!existsSync(TASK_PACKET_PATH)) {
    throw new Error(`Missing task packet: ${path.relative(ROOT, TASK_PACKET_PATH)}`);
  }

  const packet = JSON.parse(readFileSync(TASK_PACKET_PATH, 'utf8'));
  const tasks = Array.isArray(packet.tasks) ? packet.tasks : [];
  const files = walk(ASSETS_DIR).filter((f) => ['.png', '.webp'].includes(path.extname(f).toLowerCase()));
  const presentByBase = new Set(files.map((f) => path.basename(f)));

  const done = tasks.filter((t) => presentByBase.has(path.basename(String(t.filename || ''))));
  const missing = tasks.filter((t) => !presentByBase.has(path.basename(String(t.filename || ''))));
  const lanes = laneSummary(tasks, presentByBase);

  const progress = {
    generatedAt: new Date().toISOString(),
    assetsDir: path.relative(ROOT, ASSETS_DIR),
    totalRequired: tasks.length,
    totalPresent: done.length,
    totalMissing: missing.length,
    completionPercent: tasks.length ? Number(((done.length / tasks.length) * 100).toFixed(2)) : 0,
    lanes,
    missing: missing.map((t) => ({
      taskId: t.taskId,
      lane: t.lane,
      filename: t.filename,
      groupName: t.groupName,
    })),
  };

  writeFileSync(OUT_JSON, `${JSON.stringify(progress, null, 2)}\n`);

  const md = [
    '# Nanobanana Poker Progress',
    '',
    `Generated: ${progress.generatedAt}`,
    `Assets dir: ${progress.assetsDir}`,
    '',
    `- Required: ${progress.totalRequired}`,
    `- Present: ${progress.totalPresent}`,
    `- Missing: ${progress.totalMissing}`,
    `- Completion: ${progress.completionPercent}%`,
    '',
    '## Lane Status',
    ...progress.lanes.map((l) => `- ${l.lane}: ${l.done}/${l.total} (${l.percent}%)`),
    '',
    '## Missing Assets',
    ...progress.missing.map((m) => `- [${m.lane}] ${m.filename}`),
    '',
  ].join('\n');

  writeFileSync(OUT_MD, md);
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
}

main();
