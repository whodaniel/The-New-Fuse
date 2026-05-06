#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const DEFAULT_PAYLOAD_PATH = resolveTimelineOutputPath(
  `email-supabase-timeline-sync-payload.${new Date().toISOString().slice(0, 10)}.json`
);

function parseArgs(argv) {
  const args = {
    payloadPath: DEFAULT_PAYLOAD_PATH,
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    anonKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    ownerPrincipalId: process.env.VITE_OWNER_PRINCIPAL_ID || process.env.OWNER_PRINCIPAL_ID || 'daniel',
    userId: process.env.VITE_STORY_USER_ID || process.env.STORY_USER_ID || '',
    sessionId: '',
    apply: false,
    limit: 0,
    batchSize: 100,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--payload' || token === '--input') && next) {
      args.payloadPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--payload=')) {
      args.payloadPath = path.resolve(token.slice('--payload='.length));
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
    if (token === '--anon-key' && next) {
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
    if ((token === '--user-id' || token === '--user') && next) {
      args.userId = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--user-id=')) {
      args.userId = String(token.slice('--user-id='.length)).trim();
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
    if (token === '--limit' && next) {
      args.limit = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      args.limit = Number(token.slice('--limit='.length));
      continue;
    }
    if (token === '--batch-size' && next) {
      args.batchSize = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--batch-size=')) {
      args.batchSize = Number(token.slice('--batch-size='.length));
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

  if (!Number.isFinite(args.limit) || args.limit < 0) {
    throw new Error('--limit must be >= 0');
  }
  if (!Number.isFinite(args.batchSize) || args.batchSize <= 0) {
    throw new Error('--batch-size must be > 0');
  }

  return args;
}

function printUsage() {
  console.log(`
Sync email timeline payload into Supabase timeline_events.

Usage:
  node scripts/timeline/sync-email-facts-to-supabase.mjs [options]

Options:
  --payload <path>              Sync payload JSON path
  --url <supabase-url>          Supabase project URL
  --anon-key <key>              Supabase API key (service role recommended)
  --owner-principal-id <id>     Owner principal header (x-owner-principal-id)
  --user-id <id>                Story user id for session bootstrap
  --session-id <uuid>           Optional existing story_sessions.id
  --limit <n>                   Optional max facts to process
  --batch-size <n>              Insert batch size in apply mode (default 100)
  --apply                       Execute writes (default: dry-run)
`);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim()
  );
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

const ALLOWED_TIMELINE_SOURCE_TYPES = new Set(['git', 'manual', 'inferred', 'ai_generated']);

function slugTagValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSourceType(rawType, tags) {
  const raw = String(rawType || '').trim();
  if (ALLOWED_TIMELINE_SOURCE_TYPES.has(raw)) {
    return raw;
  }

  const normalizedRaw = slugTagValue(raw);
  if (normalizedRaw) {
    tags.push(`source_type_raw:${normalizedRaw}`);
  }
  return 'inferred';
}

function storyKeyTagFromTags(tags) {
  if (!Array.isArray(tags)) return '';
  const found = tags.find((tag) => String(tag || '').startsWith('story_key:'));
  return found ? String(found) : '';
}

async function ensureSessionId(supabase, args) {
  if (args.sessionId) return args.sessionId;

  const { data: existing, error: existingError } = await supabase
    .from('story_sessions')
    .select('id')
    .eq('owner_principal_id', args.ownerPrincipalId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to query story_sessions: ${existingError.message}`);
  }
  if (existing?.id) return existing.id;

  if (!args.apply) return '';

  const maybeUuidUserId = isUuid(args.userId) ? args.userId : null;
  const { data: created, error: createError } = await supabase
    .from('story_sessions')
    .insert({
      user_id: maybeUuidUserId,
      owner_principal_id: args.ownerPrincipalId,
      visibility_scope: 'agent_scope',
      release_state: 'sealed',
      agent_allowlist: ['story-architect', 'librarian'],
      status: 'active',
      current_question_index: 0,
      current_ring: 1,
    })
    .select('id')
    .single();

  if (createError || !created?.id) {
    throw new Error(`Failed to create story session: ${createError?.message || 'unknown error'}`);
  }

  return created.id;
}

async function main() {
  const args = parseArgs(process.argv);

  const raw = await fs.readFile(args.payloadPath, 'utf8');
  const payload = JSON.parse(raw);
  const factsRaw = Array.isArray(payload?.facts) ? payload.facts : [];
  const facts = args.limit > 0 ? factsRaw.slice(0, args.limit) : factsRaw;

  if (!args.url || !args.anonKey) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          dryRun: !args.apply,
          reason: 'missing_supabase_credentials',
          required: ['VITE_SUPABASE_URL or SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY'],
          payloadPath: args.payloadPath,
          selectedFacts: facts.length,
        },
        null,
        2
      )
    );
    return;
  }

  const supabase = createClient(args.url, args.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: {
        'x-owner-principal-id': args.ownerPrincipalId,
      },
    },
  });

  const sessionId = await ensureSessionId(supabase, args);

  if (!sessionId) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: !args.apply,
          sessionId: null,
          note: 'No active story session found and dry-run mode prevented session creation.',
          selectedFacts: facts.length,
          wouldInsert: facts.length,
        },
        null,
        2
      )
    );
    return;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('timeline_events')
    .select('id,tags')
    .eq('session_id', sessionId)
    .limit(10000);

  if (existingError) {
    throw new Error(`Failed to query timeline_events: ${existingError.message}`);
  }

  const existingStoryTags = new Set(
    (existingRows || [])
      .map((row) => storyKeyTagFromTags(row.tags))
      .filter(Boolean)
  );

  const inserts = [];
  let skippedInvalid = 0;
  let skippedExisting = 0;

  for (const fact of facts) {
    const title = String(fact?.title || '').trim();
    const description = String(fact?.description || '').trim();
    const eventDate = String(fact?.eventDate || '').trim();
    const era = Number(fact?.era || 1);
    const tags = Array.isArray(fact?.tags) ? fact.tags.map((t) => String(t || '').trim()).filter(Boolean) : [];
    const sourceType = normalizeSourceType(fact?.sourceType, tags);

    const storyKeyTag = `story_key:${String(fact?.storyKey || '').trim()}`;
    if (!title || !description || !eventDate || !storyKeyTag || !storyKeyTag.startsWith('story_key:')) {
      skippedInvalid += 1;
      continue;
    }

    if (existingStoryTags.has(storyKeyTag)) {
      skippedExisting += 1;
      continue;
    }

    inserts.push({
      session_id: sessionId,
      era: Number.isFinite(era) ? Math.min(8, Math.max(1, Math.round(era))) : 1,
      event_date: eventDate,
      title,
      description,
      source_type: sourceType,
      tags,
    });
    existingStoryTags.add(storyKeyTag);
  }

  const summary = {
    ok: true,
    dryRun: !args.apply,
    payloadPath: args.payloadPath,
    sessionId,
    selectedFacts: facts.length,
    existingTimelineRowsScanned: (existingRows || []).length,
    pendingInserts: inserts.length,
    skippedExisting,
    skippedInvalid,
  };

  if (!args.apply) {
    summary.sample = inserts.slice(0, 10).map((row) => ({
      event_date: row.event_date,
      title: row.title,
      era: row.era,
      source_type: row.source_type,
      story_key: storyKeyTagFromTags(row.tags),
    }));
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  let inserted = 0;
  for (const part of chunk(inserts, args.batchSize)) {
    const { error } = await supabase.from('timeline_events').insert(part);
    if (error) {
      throw new Error(`Insert failed for batch (${part.length} rows): ${error.message}`);
    }
    inserted += part.length;
  }

  summary.inserted = inserted;
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
