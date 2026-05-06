#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_OUT_PATH = resolveTimelineOutputPath(`email-supabase-description-enrichment-queue.${TODAY}.json`);

function parseArgs(argv) {
  const args = {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    anonKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    ownerPrincipalId: process.env.VITE_OWNER_PRINCIPAL_ID || process.env.OWNER_PRINCIPAL_ID || 'daniel',
    sessionId: '',
    limit: 0,
    outPath: DEFAULT_OUT_PATH,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

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
    if ((token === '--out' || token === '--output') && next) {
      args.outPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--out=')) {
      args.outPath = path.resolve(token.slice('--out='.length));
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

  return args;
}

function printUsage() {
  console.log(`
Build description-enrichment queue for generic Supabase email timeline descriptions.

Usage:
  node scripts/timeline/build-email-supabase-description-enrichment-queue.mjs [options]

Options:
  --url <supabase-url>            Supabase project URL
  --anon-key <key>                Supabase API key (service role recommended)
  --owner-principal-id <id>       Owner principal header (default: daniel)
  --session-id <uuid>             Optional explicit session id
  --limit <n>                     Optional maximum queued rows
  --out <path>                    Output queue JSON path
`);
}

function extractTagValue(tags, prefix) {
  if (!Array.isArray(tags)) return '';
  const match = tags.find((tag) => String(tag || '').startsWith(prefix));
  return match ? String(match).slice(prefix.length) : '';
}

function projectLabelFromTag(projectTag) {
  const value = String(projectTag || '').trim();
  if (!value) return 'Daniel Adam Goldberg Life Story';
  if (value.includes('daniel-who-s-media-empire')) return "Daniel Who's Media Empire";
  if (value.includes('the-new-fuse-novel')) return 'The New Fuse Novel';
  if (value.includes('daniel-adam-goldberg-life-story')) return 'Daniel Adam Goldberg Life Story';
  return value.replace(/-/g, ' ');
}

function classifyMilestoneType(title) {
  const lower = String(title || '').toLowerCase();
  if (/receipt|invoice|payment|purchase/.test(lower)) return 'transaction';
  if (/welcome|account|activation|approved|approval|registration|onboarding/.test(lower)) return 'account_lifecycle';
  if (/support|help|install|application/.test(lower)) return 'support_or_operations';
  if (/reply|re:|question|message/.test(lower)) return 'communication';
  return 'historical_signal';
}

function deriveNarrativeDescription(row) {
  const projectTag = extractTagValue(row.tags, 'project:');
  const trackTag = extractTagValue(row.tags, 'track:');
  const projectLabel = projectLabelFromTag(projectTag);
  const milestoneType = classifyMilestoneType(row.title);

  const senderMatch = String(row.description || '').match(/email from (.+?) with subject/i);
  const sender = senderMatch ? senderMatch[1].trim() : 'a recorded correspondent';
  const date = String(row.event_date || '').trim() || 'undated';
  const subject = String(row.title || '').trim();
  const trackLabel = trackTag ? trackTag.replace(/-/g, ' ') : 'historical timeline';

  return `Email evidence dated ${date} from ${sender} references "${subject}" and is mapped to ${projectLabel} (${trackLabel}) as a ${milestoneType} milestone.`;
}

async function resolveSessionId(supabase, ownerPrincipalId, explicitSessionId) {
  if (explicitSessionId) return explicitSessionId;

  const { data, error } = await supabase
    .from('story_sessions')
    .select('id')
    .eq('owner_principal_id', ownerPrincipalId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to resolve session id: ${error.message}`);
  if (!data?.id) throw new Error('No active story session found for owner principal id.');
  return data.id;
}

async function fetchRows(supabase, sessionId) {
  const pageSize = 1000;
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('id,event_date,title,description,tags')
      .eq('session_id', sessionId)
      .order('event_date', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed fetching timeline rows at offset ${offset}: ${error.message}`);
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.url || !args.anonKey) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          reason: 'missing_supabase_credentials',
          required: ['VITE_SUPABASE_URL or SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY'],
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

  const sessionId = await resolveSessionId(supabase, args.ownerPrincipalId, args.sessionId);
  const rows = await fetchRows(supabase, sessionId);

  const candidates = rows
    .filter((row) => /captured as a timeline marker across/i.test(String(row.description || '')))
    .map((row) => ({
      id: row.id,
      eventDate: row.event_date,
      title: row.title,
      currentDescription: row.description,
      proposedDescription: deriveNarrativeDescription(row),
      projectTag: extractTagValue(row.tags, 'project:'),
      trackTag: extractTagValue(row.tags, 'track:'),
      storyKey: extractTagValue(row.tags, 'story_key:'),
    }));

  const queueItems = args.limit > 0 ? candidates.slice(0, args.limit) : candidates;

  const queue = {
    sourceType: 'email-supabase-description-enrichment-queue',
    generatedAt: new Date().toISOString(),
    ownerPrincipalId: args.ownerPrincipalId,
    sessionId,
    sourceValidationRule: 'description includes \"captured as a timeline marker across\"',
    totalCandidates: candidates.length,
    queueCount: queueItems.length,
    items: queueItems,
  };

  await fs.mkdir(path.dirname(args.outPath), { recursive: true });
  await fs.writeFile(args.outPath, `${JSON.stringify(queue, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath: args.outPath,
        sessionId,
        rowCount: rows.length,
        totalCandidates: candidates.length,
        queueCount: queueItems.length,
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
