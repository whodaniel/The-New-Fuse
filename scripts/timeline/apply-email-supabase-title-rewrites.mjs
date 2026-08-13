#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const DEFAULT_QUEUE_PATH = resolveTimelineOutputPath(
  `email-supabase-weak-title-rewrite-queue.${new Date().toISOString().slice(0, 10)}.json`
);

function parseArgs(argv) {
  const args = {
    queuePath: DEFAULT_QUEUE_PATH,
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    anonKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    ownerPrincipalId: process.env.VITE_OWNER_PRINCIPAL_ID || process.env.OWNER_PRINCIPAL_ID || 'daniel',
    apply: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--queue' || token === '--input') && next) {
      args.queuePath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--queue=')) {
      args.queuePath = path.resolve(token.slice('--queue='.length));
      continue;
    }
    if (token === '--url' && next) {
      args.url = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--url=')) {
      args.url = String(token.slice('--url='.length)).trim();
      continue;
    }
    if ((token === '--anon-key' || token === '--key') && next) {
      args.anonKey = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--anon-key=')) {
      args.anonKey = String(token.slice('--anon-key='.length)).trim();
      continue;
    }
    if (token === '--owner-principal-id' && next) {
      args.ownerPrincipalId = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--owner-principal-id=')) {
      args.ownerPrincipalId = String(token.slice('--owner-principal-id='.length)).trim();
      continue;
    }
    if (token === '--apply') {
      args.apply = true;
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  return args;
}

function printUsage() {
  console.log(`
Apply queued weak-title rewrites to Supabase timeline_events.

Usage:
  node scripts/timeline/apply-email-supabase-title-rewrites.mjs [options]

Options:
  --queue <path>                Rewrite queue JSON path
  --url <supabase-url>          Supabase project URL
  --anon-key <key>              Supabase API key (service role recommended)
  --owner-principal-id <id>     Owner principal header (default: daniel)
  --apply                       Execute updates (default: dry-run)
`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.url || !args.anonKey) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          dryRun: !args.apply,
          reason: 'missing_supabase_credentials',
          required: ['VITE_SUPABASE_URL or SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY'],
        },
        null,
        2
      )
    );
    return;
  }

  const raw = await fs.readFile(args.queuePath, 'utf8');
  const queue = JSON.parse(raw);
  const items = Array.isArray(queue?.items) ? queue.items : [];

  const supabase = createClient(args.url, args.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        'x-owner-principal-id': args.ownerPrincipalId,
      },
    },
  });

  const ids = items.map((item) => String(item?.id || '').trim()).filter(Boolean);
  const { data: existingRows, error: queryError } = await supabase
    .from('timeline_events')
    .select('id,title,event_date')
    .in('id', ids);

  if (queryError) {
    throw new Error(`Failed to read timeline_events: ${queryError.message}`);
  }

  const existingById = new Map((existingRows || []).map((row) => [String(row.id), row]));
  const ready = [];
  const missing = [];
  const drifted = [];

  for (const item of items) {
    const id = String(item?.id || '').trim();
    if (!id) continue;

    const currentTitle = String(item?.currentTitle || '');
    const suggestedTitle = String(item?.suggestedTitle || '').trim();
    const row = existingById.get(id);

    if (!row) {
      missing.push({
        id,
        expectedCurrentTitle: currentTitle,
        suggestedTitle,
      });
      continue;
    }

    if (String(row.title || '') !== currentTitle) {
      drifted.push({
        id,
        dbTitle: String(row.title || ''),
        queuedCurrentTitle: currentTitle,
        suggestedTitle,
      });
      continue;
    }

    ready.push({
      id,
      eventDate: row.event_date,
      fromTitle: currentTitle,
      toTitle: suggestedTitle,
    });
  }

  const summary = {
    ok: true,
    dryRun: !args.apply,
    queuePath: args.queuePath,
    queueItems: items.length,
    dbRowsFetched: (existingRows || []).length,
    readyCount: ready.length,
    missingCount: missing.length,
    driftedCount: drifted.length,
    readySample: ready.slice(0, 20),
    missingSample: missing.slice(0, 20),
    driftedSample: drifted.slice(0, 20),
  };

  if (!args.apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  let updatedCount = 0;
  const updateFailures = [];

  for (const row of ready) {
    const { data: updated, error } = await supabase
      .from('timeline_events')
      .update({ title: row.toTitle })
      .eq('id', row.id)
      .eq('title', row.fromTitle)
      .select('id,title')
      .maybeSingle();

    if (error) {
      updateFailures.push({ id: row.id, reason: error.message });
      continue;
    }
    if (!updated?.id) {
      updateFailures.push({ id: row.id, reason: 'no_row_updated' });
      continue;
    }
    updatedCount += 1;
  }

  summary.updatedCount = updatedCount;
  summary.updateFailureCount = updateFailures.length;
  summary.updateFailureSample = updateFailures.slice(0, 20);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
