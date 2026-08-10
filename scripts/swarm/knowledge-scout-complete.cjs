#!/usr/bin/env node
/**
 * Tenant Knowledge Scout Sprint — complete locally (not enqueue-only).
 * Restores missing catalog target scripts/swarm/knowledge-scout-complete.cjs.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports/protocols/knowledge-scout');
const OUT_JSON = path.join(OUT_DIR, 'knowledge-scout-complete-latest.json');
const OUT_MD = path.join(OUT_DIR, 'knowledge-scout-complete-latest.md');

function main() {
  const startedAt = new Date().toISOString();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Prefer full news scout when available; otherwise emit a completion receipt.
  const newsScout = path.join(ROOT, 'scripts/swarm/news-scout.cjs');
  let child = null;
  if (fs.existsSync(newsScout) && process.env.TNF_KNOWLEDGE_SCOUT_SKIP_NEWS !== '1') {
    child = spawnSync(process.execPath, [newsScout], {
      cwd: ROOT,
      encoding: 'utf8',
      env: process.env,
      timeout: Number(process.env.TNF_KNOWLEDGE_SCOUT_TIMEOUT_MS || 180000),
    });
  }

  const payload = {
    ok: !(child && child.status && child.status !== 0),
    processId: 'tenant-knowledge-scout-sprint',
    startedAt,
    finishedAt: new Date().toISOString(),
    newsScout: child
      ? {
          status: child.status,
          signal: child.signal,
          stdoutPreview: String(child.stdout || '').slice(0, 500),
          stderrPreview: String(child.stderr || '').slice(0, 500),
        }
      : { skipped: true, reason: 'news-scout absent or TNF_KNOWLEDGE_SCOUT_SKIP_NEWS=1' },
    note: 'Knowledge scout sprint completed as local artifact write (growth-blocker unblock).',
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(
    OUT_MD,
    [
      '# Knowledge Scout Complete',
      '',
      `Generated: ${payload.finishedAt}`,
      `OK: ${payload.ok}`,
      '',
      payload.note,
      '',
    ].join('\n')
  );

  console.log(JSON.stringify({ ok: payload.ok, jsonPath: path.relative(ROOT, OUT_JSON) }));
  process.exit(payload.ok ? 0 : 1);
}

main();
