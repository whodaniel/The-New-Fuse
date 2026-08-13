#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseArgs(argv) {
  const today = new Date().toISOString().slice(0, 10);
  const args = {
    ownerPrincipalId: 'daniel',
    sessionId: '',
    databaseUrl: process.env.DATABASE_URL || '',
    outPath: '',
    manifestPath: resolveTimelineOutputPath(`supabase-email-archaeology-backup-manifest.${today}.json`),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--owner-principal-id' || token === '--owner') && next) {
      args.ownerPrincipalId = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--owner-principal-id=')) {
      args.ownerPrincipalId = String(token.slice('--owner-principal-id='.length)).trim();
      continue;
    }
    if (token === '--session-id' && next) {
      args.sessionId = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--session-id=')) {
      args.sessionId = String(token.slice('--session-id='.length)).trim();
      continue;
    }
    if ((token === '--database-url' || token === '--db-url') && next) {
      args.databaseUrl = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--database-url=')) {
      args.databaseUrl = String(token.slice('--database-url='.length)).trim();
      continue;
    }
    if ((token === '--out' || token === '--output') && next) {
      args.outPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--out=')) {
      args.outPath = path.resolve(token.slice('--out='.length));
      continue;
    }
    if (token === '--manifest' && next) {
      args.manifestPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--manifest=')) {
      args.manifestPath = path.resolve(token.slice('--manifest='.length));
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!args.ownerPrincipalId) throw new Error('owner principal id is required');
  if (!args.databaseUrl) {
    throw new Error('DATABASE_URL not set. Pass --database-url or export DATABASE_URL first.');
  }

  if (!args.outPath) {
    const today = new Date().toISOString().slice(0, 10);
    args.outPath = path.resolve(
      process.cwd(),
      'data',
      'private',
      'supabase-backups',
      `email-archaeology-events-owner-${slug(args.ownerPrincipalId)}-${today}.json`
    );
  }

  return args;
}

function printUsage() {
  console.log(`
Export Supabase email-archaeology timeline events into a private local backup.

Usage:
  node scripts/timeline/export-supabase-email-archaeology-backup.mjs [options]

Options:
  --owner-principal-id <id>   story_sessions.owner_principal_id (default: daniel)
  --session-id <uuid>         optional exact session filter
  --database-url <url>        postgres connection URL (or use DATABASE_URL env)
  --out <path>                backup JSON output path
  --manifest <path>           manifest JSON output path
`);
}

function runPsql(databaseUrl, sql) {
  const result = spawnSync('psql', [databaseUrl, '-At', '-F', '|', '-c', sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
  if (result.status !== 0) {
    throw new Error(`psql failed: ${result.stderr || result.stdout || 'unknown error'}`);
  }
  return result.stdout.trim();
}

function tagValue(tags, prefix) {
  if (!Array.isArray(tags)) return '';
  const hit = tags.find((t) => typeof t === 'string' && t.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : '';
}

function countBy(items, picker) {
  const out = {};
  for (const item of items) {
    const key = picker(item) || 'unknown';
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  const whereSession = args.sessionId ? ` and e.session_id = '${args.sessionId.replace(/'/g, "''")}'::uuid` : '';
  const whereOwner = ` and s.owner_principal_id = '${args.ownerPrincipalId.replace(/'/g, "''")}'`;

  const sql = `
    select coalesce(jsonb_agg(to_jsonb(e) order by e.event_date, e.created_at), '[]'::jsonb)::text
    from public.timeline_events e
    join public.story_sessions s on s.id = e.session_id
    where e.tags @> array['source_type_raw:email-archaeology-import']
      ${whereOwner}
      ${whereSession};
  `;

  const rawJson = runPsql(args.databaseUrl, sql) || '[]';
  let events;
  try {
    events = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`Failed to parse psql JSON payload: ${error.message}`);
  }

  await fs.mkdir(path.dirname(args.outPath), { recursive: true });
  await fs.writeFile(args.outPath, `${JSON.stringify(events, null, 2)}\n`, 'utf8');

  let minDate = null;
  let maxDate = null;
  for (const event of events) {
    const d = event?.event_date || null;
    if (!d) continue;
    if (!minDate || d < minDate) minDate = d;
    if (!maxDate || d > maxDate) maxDate = d;
  }

  const backupRaw = await fs.readFile(args.outPath, 'utf8');
  const sha256 = crypto.createHash('sha256').update(backupRaw).digest('hex');

  const manifest = {
    sourceType: 'supabase-email-archaeology-backup-manifest',
    generatedAt: new Date().toISOString(),
    ownerPrincipalId: args.ownerPrincipalId,
    sessionId: args.sessionId || null,
    backupFile: path.relative(process.cwd(), args.outPath),
    backupSha256: sha256,
    bytes: Buffer.byteLength(backupRaw),
    eventCount: events.length,
    dateRange: { min: minDate, max: maxDate },
    counts: {
      sourceType: countBy(events, (e) => e?.source_type || 'unknown'),
      project: countBy(events, (e) => tagValue(e?.tags, 'project:') || 'unknown'),
      track: countBy(events, (e) => tagValue(e?.tags, 'track:') || 'unknown'),
      confidence: countBy(events, (e) => tagValue(e?.tags, 'confidence:') || 'unknown'),
    },
  };

  await fs.mkdir(path.dirname(args.manifestPath), { recursive: true });
  await fs.writeFile(args.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        backupFile: manifest.backupFile,
        manifestFile: path.relative(process.cwd(), args.manifestPath),
        eventCount: manifest.eventCount,
        dateRange: manifest.dateRange,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});

