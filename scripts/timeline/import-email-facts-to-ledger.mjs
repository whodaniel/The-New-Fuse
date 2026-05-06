#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_QUEUE_PATH = resolveTimelineOutputPath(`email-fact-candidate-queue.${TODAY}.json`);

const DEFAULT_INTAKE_PATH = resolveTimelineOutputPath(`email-fact-intake.${TODAY}.json`);

const DEFAULT_STORE_PATH = path.join(process.cwd(), 'data', 'unified-task-ledger.json');

const CONF_LEVELS = {
  low: 1,
  medium: 2,
  high: 3,
};

const SUSPICIOUS_SUBJECT_PATTERNS = [
  /\[?\?\?\s*probable spam\]?/i,
  /probable spam/i,
  /lottery/i,
  /inheritance/i,
  /viagra/i,
  /casino/i,
  /weight loss/i,
  /\burgent\b/i,
  /^about trip$/i,
  /hello\.again/i,
  /^re:\s*greetings and thank you for your response to my mail$/i,
];

function parseArgs(argv) {
  const args = {
    queuePath: DEFAULT_QUEUE_PATH,
    intakePath: DEFAULT_INTAKE_PATH,
    storePath: DEFAULT_STORE_PATH,
    userId: '',
    minConfidence: 'medium',
    startYear: 0,
    endYear: 0,
    limit: 0,
    includeIntake: true,
    dryRun: true,
    backup: true,
    sourceTag: 'email-archaeology-import',
    excludeSuspiciousSubjects: true,
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
    if (token === '--intake' && next) {
      args.intakePath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--intake=')) {
      args.intakePath = path.resolve(token.slice('--intake='.length));
      continue;
    }
    if ((token === '--store' || token === '--store-path') && next) {
      args.storePath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--store=')) {
      args.storePath = path.resolve(token.slice('--store='.length));
      continue;
    }
    if ((token === '--user' || token === '--user-id') && next) {
      args.userId = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--user-id=')) {
      args.userId = String(token.slice('--user-id='.length)).trim();
      continue;
    }
    if (token === '--min-confidence' && next) {
      args.minConfidence = String(next).trim().toLowerCase();
      i += 1;
      continue;
    }
    if (token.startsWith('--min-confidence=')) {
      args.minConfidence = String(token.slice('--min-confidence='.length)).trim().toLowerCase();
      continue;
    }
    if (token === '--start-year' && next) {
      args.startYear = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--start-year=')) {
      args.startYear = Number(token.slice('--start-year='.length));
      continue;
    }
    if (token === '--end-year' && next) {
      args.endYear = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--end-year=')) {
      args.endYear = Number(token.slice('--end-year='.length));
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
    if (token === '--no-intake') {
      args.includeIntake = false;
      continue;
    }
    if (token === '--apply') {
      args.dryRun = false;
      continue;
    }
    if (token === '--no-backup') {
      args.backup = false;
      continue;
    }
    if (token === '--include-suspicious-subjects') {
      args.excludeSuspiciousSubjects = false;
      continue;
    }
    if (token === '--source-tag' && next) {
      args.sourceTag = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--source-tag=')) {
      args.sourceTag = String(token.slice('--source-tag='.length)).trim();
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!Object.hasOwn(CONF_LEVELS, args.minConfidence)) {
    throw new Error('--min-confidence must be one of: low, medium, high');
  }

  if (!Number.isFinite(args.startYear) || args.startYear < 0) {
    throw new Error('--start-year must be >= 0');
  }
  if (!Number.isFinite(args.endYear) || args.endYear < 0) {
    throw new Error('--end-year must be >= 0');
  }
  if (!Number.isFinite(args.limit) || args.limit < 0) {
    throw new Error('--limit must be >= 0');
  }

  return args;
}

function printUsage() {
  console.log(`
Import curated email facts into unified task ledger with deterministic dedupe.

Usage:
  node scripts/timeline/import-email-facts-to-ledger.mjs [options]

Options:
  --queue <path>             Email fact candidate queue JSON
  --intake <path>            Optional high-confidence intake JSON
  --store <path>             Ledger JSON path
  --user-id <uuid>           Target user id (defaults to dominant ledger user)
  --min-confidence <level>   low|medium|high (default: medium)
  --start-year <yyyy>        Include events from this year onward (optional)
  --end-year <yyyy>          Include events through this year (optional)
  --limit <n>                Max imported facts (oldest-first after filters)
  --no-intake                Skip pre-curated intake file
  --apply                    Write changes (default is dry-run)
  --no-backup                Disable backup on apply
  --include-suspicious-subjects
                             Disable suspicious-subject exclusion
  --source-tag <string>      Source marker tag
`);
}

function ensureStoreShape(value) {
  return {
    records: Array.isArray(value?.records) ? value.records : [],
    timelineEvents: Array.isArray(value?.timelineEvents) ? value.timelineEvents : [],
    goals: Array.isArray(value?.goals) ? value.goals : [],
    plans: Array.isArray(value?.plans) ? value.plans : [],
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

function makeEventId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function confidenceRank(level) {
  return CONF_LEVELS[String(level || '').toLowerCase()] || 0;
}

function normalizeConfidenceForLedger(level) {
  const value = String(level || '').toLowerCase();
  if (value === 'high') return 'hard';
  if (value === 'medium') return 'moderate';
  return 'soft';
}

function parseFactDate(fact) {
  const iso = String(fact?.evidence?.dateIso || '').trim();
  if (iso && !Number.isNaN(Date.parse(iso))) {
    return new Date(iso).toISOString();
  }
  const date = String(fact?.date || '').trim();
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00.000Z`).toISOString();
  }
  return null;
}

function getYearFromIso(iso) {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return 0;
  return new Date(ms).getUTCFullYear();
}

function mapCategory(domain) {
  const d = String(domain || '').toLowerCase();
  if (d.includes('personal')) return 'Personal';
  if (d.includes('creativ')) return 'Creativity';
  if (d.includes('business')) return 'Business & Projects';
  if (d.includes('cross')) return 'Cross-Domain';
  return 'Historical';
}

function mapTrack(project, domain) {
  const p = String(project || '').toLowerCase();
  const d = String(domain || '').toLowerCase();
  if (p.includes('new fuse')) return 'the_new_fuse_novel';
  if (p.includes('media empire')) return 'daniel_whos_media_empire';
  if (p.includes('personal life') || p.includes('life story')) return 'daniel_personal_life_story';
  if (d.includes('personal')) return 'daniel_personal_life_story';
  if (d.includes('creativ')) return 'daniel_whos_media_empire';
  if (d.includes('business')) return 'daniel_whos_media_empire';
  return 'historical_reconstruction';
}

function buildStoryKey(fact) {
  if (fact?.evidence?.eventId) {
    return `email-fact:event:${slug(fact.evidence.eventId)}`;
  }
  if (fact?.factId) {
    return `email-fact:id:${slug(fact.factId)}`;
  }
  const date = String(fact?.date || 'undated');
  const title = String(fact?.title || 'untitled');
  return `email-fact:fallback:${slug(`${date}-${title}`)}`;
}

function dedupeKeyFromTimestampAndTitle(timestamp, title) {
  return `${String(timestamp || '').trim()}|${String(title || '').trim().toLowerCase()}`;
}

function uniqueStrings(values) {
  const out = [];
  const seen = new Set();
  for (const item of values || []) {
    const text = String(item || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function summarizeBy(items, getter) {
  const result = {};
  for (const item of items) {
    const key = String(getter(item) || 'unknown');
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function toCandidateFacts(queuePayload, intakePayload, args) {
  const minRank = confidenceRank(args.minConfidence);
  const startYear = args.startYear > 0 ? args.startYear : 0;
  const endYear = args.endYear > 0 ? args.endYear : 9999;

  const queueFacts = Array.isArray(queuePayload?.facts) ? queuePayload.facts : [];
  const intakeFacts = args.includeIntake && Array.isArray(intakePayload?.facts) ? intakePayload.facts : [];

  const merged = [];

  for (const fact of intakeFacts) {
    const timestamp = parseFactDate(fact);
    if (!timestamp) continue;
    const year = getYearFromIso(timestamp);
    if (year < startYear || year > endYear) continue;

    merged.push({
      ...fact,
      _origin: 'intake',
      _confidenceInput: 'high',
      _timestamp: timestamp,
      _year: year,
    });
  }

  for (const fact of queueFacts) {
    const rank = confidenceRank(fact?.confidence);
    if (rank < minRank) continue;

    const timestamp = parseFactDate(fact);
    if (!timestamp) continue;
    const year = getYearFromIso(timestamp);
    if (year < startYear || year > endYear) continue;

    merged.push({
      ...fact,
      _origin: 'queue',
      _confidenceInput: String(fact?.confidence || 'low').toLowerCase(),
      _timestamp: timestamp,
      _year: year,
    });
  }

  merged.sort((a, b) => {
    if (a._timestamp !== b._timestamp) return a._timestamp.localeCompare(b._timestamp);
    if (a._origin !== b._origin) return a._origin === 'intake' ? -1 : 1;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  const deduped = [];
  const seen = new Set();

  for (const fact of merged) {
    const key = `${fact._timestamp}|${String(fact.title || '').toLowerCase()}|${String(fact.project || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(fact);
  }

  if (args.limit > 0) return deduped.slice(0, args.limit);
  return deduped;
}

function isSuspiciousSubject(title) {
  const value = String(title || '').trim();
  if (!value) return false;
  return SUSPICIOUS_SUBJECT_PATTERNS.some((pattern) => pattern.test(value));
}

function buildTimelineEvent(fact, userId, index, total, sourceTag, relQueuePath) {
  const denom = Math.max(total - 1, 1);
  const point = Math.round((index / denom) * 100);
  const category = mapCategory(fact.domain);
  const track = mapTrack(fact.project, fact.domain);

  const storyKey = buildStoryKey(fact);
  const title = String(fact.title || 'Email timeline fact').trim();
  const description = String(fact.statement || '').trim() || `Email-derived fact: ${title}`;
  const evidence = fact.evidence || {};

  const evidenceRefs = uniqueStrings([
    evidence.eventId ? `email:event:${evidence.eventId}` : '',
    evidence.messageId ? `email:message-id:${evidence.messageId}` : '',
    evidence.mailboxPath ? `email:mailbox:${evidence.mailboxPath}` : '',
    `email:fact:${String(fact.factId || '').trim()}`,
  ]);

  const sources = uniqueStrings([
    relQueuePath,
    String(evidence.mailboxPath || ''),
    String(evidence.from || ''),
    String(evidence.subject || ''),
  ]);

  return {
    id: makeEventId(),
    userId,
    eventType: 'historical_event',
    actor: sourceTag,
    timestamp: fact._timestamp,
    payload: {
      title,
      description,
      point,
      category,
      segment: track,
      timelineTrack: track,
      timelineCategory: 'email-archaeology',
      project: String(fact.project || 'Daniel Adam Goldberg Life Story'),
      evidenceRefs,
      sources,
      storyKey,
      source: sourceTag,
      sourceFactId: String(fact.factId || ''),
      confidence: normalizeConfidenceForLedger(fact._confidenceInput),
      isPrivate: true,
      accessScope: 'owner_and_agents',
      narrativeNodeRefs: [],
      narrativeConnections: [],
      narrativeConnectionRefs: [],
      importMetadata: {
        importVersion: 1,
        importedAt: new Date().toISOString(),
        origin: fact._origin,
        queueConfidence: fact._confidenceInput,
        verificationStatus: fact?.review?.status || (fact._origin === 'intake' ? 'verified_seed' : 'pending_human_review'),
        reviewNotes: fact?.review?.reviewNotes || '',
        capturedAt: String(fact.capturedAt || ''),
        enteredBy: String(fact.enteredBy || ''),
        relevanceTags: Array.isArray(fact.relevanceTags) ? fact.relevanceTags : [],
      },
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const queueRaw = await fs.readFile(args.queuePath, 'utf8');
  const queuePayload = JSON.parse(queueRaw);

  let intakePayload = { facts: [] };
  if (args.includeIntake) {
    try {
      intakePayload = JSON.parse(await fs.readFile(args.intakePath, 'utf8'));
    } catch {
      intakePayload = { facts: [] };
    }
  }

  let storeRaw;
  try {
    storeRaw = JSON.parse(await fs.readFile(args.storePath, 'utf8'));
  } catch {
    storeRaw = { records: [], timelineEvents: [], goals: [], plans: [] };
  }
  const store = ensureStoreShape(storeRaw);

  const userId = args.userId || pickDominantUserId(store.timelineEvents);
  if (!userId) {
    throw new Error('Unable to resolve user id from ledger; pass --user-id');
  }

  const facts = toCandidateFacts(queuePayload, intakePayload, args);
  const relQueuePath = path.relative(process.cwd(), args.queuePath);

  const existingStoryKeys = new Set(
    store.timelineEvents.map((event) => String(event?.payload?.storyKey || '')).filter(Boolean)
  );
  const existingFactIds = new Set(
    store.timelineEvents.map((event) => String(event?.payload?.sourceFactId || '')).filter(Boolean)
  );
  const existingFallback = new Set(
    store.timelineEvents
      .map((event) => dedupeKeyFromTimestampAndTitle(event?.timestamp, event?.payload?.title || ''))
      .filter(Boolean)
  );

  const imported = [];
  let skippedExisting = 0;
  let skippedInvalid = 0;
  let skippedSuspicious = 0;

  for (let i = 0; i < facts.length; i += 1) {
    const fact = facts[i];
    if (args.excludeSuspiciousSubjects && isSuspiciousSubject(fact?.title)) {
      skippedSuspicious += 1;
      continue;
    }
    const event = buildTimelineEvent(fact, userId, i, facts.length, args.sourceTag, relQueuePath);
    const storyKey = String(event?.payload?.storyKey || '');
    const sourceFactId = String(event?.payload?.sourceFactId || '');
    const fallback = dedupeKeyFromTimestampAndTitle(event?.timestamp, event?.payload?.title || '');

    if (!event.timestamp || !event.payload.title || !storyKey) {
      skippedInvalid += 1;
      continue;
    }

    if (existingStoryKeys.has(storyKey) || (sourceFactId && existingFactIds.has(sourceFactId)) || existingFallback.has(fallback)) {
      skippedExisting += 1;
      continue;
    }

    imported.push(event);
    existingStoryKeys.add(storyKey);
    if (sourceFactId) existingFactIds.add(sourceFactId);
    existingFallback.add(fallback);
  }

  const summary = {
    ok: true,
    dryRun: args.dryRun,
    userId,
    queuePath: args.queuePath,
    intakePath: args.includeIntake ? args.intakePath : null,
    storePath: args.storePath,
    filters: {
      minConfidence: args.minConfidence,
      startYear: args.startYear || null,
      endYear: args.endYear || null,
      limit: args.limit || null,
      includeIntake: args.includeIntake,
      excludeSuspiciousSubjects: args.excludeSuspiciousSubjects,
    },
    selectedFactsAfterFilter: facts.length,
    importedEvents: imported.length,
    skippedExisting,
    skippedInvalid,
    skippedSuspicious,
    importedByProject: summarizeBy(imported, (e) => e?.payload?.project),
    importedByTrack: summarizeBy(imported, (e) => e?.payload?.timelineTrack),
    importedByConfidence: summarizeBy(imported, (e) => e?.payload?.confidence),
    importedDateRange:
      imported.length > 0
        ? {
            earliest: imported[0].timestamp,
            latest: imported[imported.length - 1].timestamp,
          }
        : null,
    sample: imported.slice(0, 12).map((e) => ({
      timestamp: e.timestamp,
      title: e.payload.title,
      project: e.payload.project,
      track: e.payload.timelineTrack,
      confidence: e.payload.confidence,
      storyKey: e.payload.storyKey,
    })),
  };

  if (args.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (imported.length > 0) {
    const outputStore = ensureStoreShape(store);
    outputStore.timelineEvents.push(...imported);

    await fs.mkdir(path.dirname(args.storePath), { recursive: true });
    if (args.backup) {
      const backupPath = `${args.storePath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      await fs.writeFile(backupPath, JSON.stringify(store, null, 2));
      summary.backupPath = backupPath;
    }

    await fs.writeFile(args.storePath, `${JSON.stringify(outputStore, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
