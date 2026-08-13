#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const DEFAULT_LEDGER_PATH = path.join(process.cwd(), 'data', 'unified-task-ledger.json');
const DEFAULT_OUT_PATH = resolveTimelineOutputPath(
  `email-supabase-timeline-sync-payload.${new Date().toISOString().slice(0, 10)}.json`
);

function parseArgs(argv) {
  const args = {
    ledgerPath: DEFAULT_LEDGER_PATH,
    outPath: DEFAULT_OUT_PATH,
    source: 'email-archaeology-import',
    ownerPrincipalId: 'daniel',
    userId: '',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--ledger' || token === '--input') && next) {
      args.ledgerPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--ledger=')) {
      args.ledgerPath = path.resolve(token.slice('--ledger='.length));
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
    if (token === '--source' && next) {
      args.source = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--source=')) {
      args.source = String(token.slice('--source='.length)).trim();
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
Build Supabase-compatible timeline sync payload from unified ledger email imports.

Usage:
  node scripts/timeline/build-supabase-email-timeline-sync-payload.mjs [options]

Options:
  --ledger <path>               Unified ledger JSON path
  --out <path>                  Output payload JSON path
  --source <string>             payload.source filter (default: email-archaeology-import)
  --owner-principal-id <id>     Owner principal id for story session scope
  --user-id <id>                Optional user id filter
`);
}

function ensureStoreShape(value) {
  return {
    timelineEvents: Array.isArray(value?.timelineEvents) ? value.timelineEvents : [],
  };
}

function pickDominantUserId(events) {
  const counts = new Map();
  for (const event of events || []) {
    const id = String(event?.userId || '').trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  let best = '';
  let bestCount = -1;
  for (const [id, count] of counts.entries()) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toEventDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function yearToEra(year) {
  if (!Number.isFinite(year)) return 1;
  if (year <= 2002) return 1;
  if (year <= 2006) return 2;
  if (year <= 2010) return 3;
  if (year <= 2014) return 4;
  if (year <= 2018) return 5;
  if (year <= 2021) return 6;
  if (year <= 2024) return 7;
  return 8;
}

function toSupabaseFact(event) {
  const payload = event?.payload || {};
  const eventDate = toEventDate(event?.timestamp);
  const year = eventDate ? Number(eventDate.slice(0, 4)) : NaN;
  const era = yearToEra(year);

  const storyKey = String(payload.storyKey || '').trim() || `email-fact:${slug(payload.title || event.id)}`;
  const track = String(payload.timelineTrack || payload.segment || '').trim();
  const confidence = String(payload.confidence || 'moderate').trim().toLowerCase();

  const tagSet = new Set([
    'ai-filtered',
    'email-archaeology-import',
    'source_type_raw:email-archaeology-import',
    `story_key:${storyKey}`,
    `confidence:${confidence}`,
    payload.project ? `project:${slug(payload.project)}` : '',
    payload.timelineCategory ? `timeline_category:${slug(payload.timelineCategory)}` : '',
    track ? `track:${slug(track)}` : '',
  ]);

  for (const tag of payload?.importMetadata?.relevanceTags || []) {
    const t = String(tag || '').trim();
    if (t) tagSet.add(t);
  }

  const tags = Array.from(tagSet).filter(Boolean);

  return {
    storyKey,
    eventDate,
    era,
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    sourceType: 'inferred',
    timelineTrack: track || null,
    confidence,
    tags,
    importMetadata: payload.importMetadata || {},
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const raw = await fs.readFile(args.ledgerPath, 'utf8');
  const store = ensureStoreShape(JSON.parse(raw));

  const targetUserId = args.userId || pickDominantUserId(store.timelineEvents);
  if (!targetUserId) {
    throw new Error('Unable to resolve user id from ledger. Pass --user-id explicitly.');
  }

  const filtered = store.timelineEvents
    .filter((event) => event?.userId === targetUserId)
    .filter((event) => String(event?.payload?.source || '') === args.source)
    .sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));

  const facts = [];
  const seen = new Set();

  for (const event of filtered) {
    const fact = toSupabaseFact(event);
    if (!fact.title || !fact.description || !fact.eventDate) continue;
    if (seen.has(fact.storyKey)) continue;
    seen.add(fact.storyKey);
    facts.push(fact);
  }

  const payload = {
    sourceType: 'email-archaeology-supabase-sync-payload',
    generatedAt: new Date().toISOString(),
    sourceLedger: path.relative(process.cwd(), args.ledgerPath),
    ownerPrincipalId: args.ownerPrincipalId,
    userId: targetUserId,
    sourceFilter: args.source,
    factCount: facts.length,
    facts,
  };

  await fs.mkdir(path.dirname(args.outPath), { recursive: true });
  await fs.writeFile(args.outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath: args.outPath,
        sourceEvents: filtered.length,
        factCount: facts.length,
        earliest: facts[0]?.eventDate || null,
        latest: facts[facts.length - 1]?.eventDate || null,
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
