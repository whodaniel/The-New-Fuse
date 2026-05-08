#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { createReadStream } from 'node:fs';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_CLASSIFIED_PATH = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery-full-2026-05-06-v2',
  'email-discovery-classified.jsonl'
);

const DEFAULT_PRIOR_QUEUE_PATH = path.join(
  process.cwd(),
  'data',
  'protocols',
  'email-fact-candidate-queue.2026-05-06.json'
);

const DEFAULT_SUPABASE_BACKUP_PATH = path.join(
  process.cwd(),
  'data',
  'private',
  'supabase-backups',
  `email-archaeology-events-owner-daniel-${TODAY}.json`
);

const DEFAULT_OUT_PATH = resolveTimelineOutputPath(`email-fact-candidate-queue-wave2.${TODAY}.json`);

const DEFAULT_REVIEWED_PATHS = [
  path.join(process.cwd(), 'data', 'protocols', 'email-manual-adjudication.2026-05-07.json'),
  path.join(process.cwd(), 'data', 'protocols', 'email-manual-adjudication-pass2.2026-05-07.json'),
  path.join(process.cwd(), 'data', 'protocols', 'email-manual-adjudication-pass4.2026-05-07.json'),
  path.join(process.cwd(), 'data', 'protocols', 'email-manual-adjudication-pass5.2026-05-07.json'),
  path.join(process.cwd(), 'data', 'protocols', 'email-manual-adjudication-pass6-bulk.2026-05-07.json'),
  path.join(process.cwd(), 'data', 'protocols', 'email-post-cutoff-adjudication.2026-05-07.json'),
  path.join(process.cwd(), 'data', 'protocols', 'email-exclusion-adjudication-pass3.2026-05-07.json'),
];

const BLOCKED_CLASSIFICATIONS = new Set(['junk_irrelevant', 'marketing_newsletter', 'system_notification']);

const SUSPICIOUS_SUBJECT_PATTERNS = [
  /\[?\?\?\s*probable spam\]?/i,
  /probable spam/i,
  /viagra/i,
  /casino/i,
  /lottery/i,
  /inheritance/i,
  /adult/i,
  /\bxxx\b/i,
  /weight loss/i,
  /work from home/i,
  /winning prize/i,
  /personal and private/i,
  /westafrican/i,
  /laundrycontrolboard/i,
  /account confirmation form/i,
  /free(store|list|traffic).*(password|account)/i,
];

const OPERATIONAL_SUBJECT_PATTERNS = [
  /\bre:\b/i,
  /\bfwd:\b/i,
  /\bsupport\b/i,
  /\binstall\b/i,
  /\binvoice\b/i,
  /\breceipt\b/i,
  /\bpayment\b/i,
  /\btransaction\b/i,
  /\baccount\b/i,
  /\bquote\b/i,
  /\bproposal\b/i,
  /\border\b/i,
  /\bconfirmation\b/i,
  /\bdownload\b/i,
];

function parseArgs(argv) {
  const args = {
    classifiedPath: DEFAULT_CLASSIFIED_PATH,
    priorQueuePath: DEFAULT_PRIOR_QUEUE_PATH,
    reviewedPaths: [...DEFAULT_REVIEWED_PATHS],
    supabaseBackupPath: DEFAULT_SUPABASE_BACKUP_PATH,
    outPath: DEFAULT_OUT_PATH,
    ownerPrincipalId: 'daniel-goldberg',
    limit: 500,
    minSignalScore: 8,
    startYear: 0,
    noSupabaseCoverageCheck: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--classified' || token === '--input') && next) {
      args.classifiedPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--classified=')) {
      args.classifiedPath = path.resolve(token.slice('--classified='.length));
      continue;
    }
    if ((token === '--prior-queue' || token === '--queue') && next) {
      args.priorQueuePath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--prior-queue=')) {
      args.priorQueuePath = path.resolve(token.slice('--prior-queue='.length));
      continue;
    }
    if (token === '--reviewed-path' && next) {
      args.reviewedPaths.push(path.resolve(next));
      i += 1;
      continue;
    }
    if (token.startsWith('--reviewed-path=')) {
      args.reviewedPaths.push(path.resolve(token.slice('--reviewed-path='.length)));
      continue;
    }
    if ((token === '--supabase-backup' || token === '--supabase') && next) {
      args.supabaseBackupPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--supabase-backup=')) {
      args.supabaseBackupPath = path.resolve(token.slice('--supabase-backup='.length));
      continue;
    }
    if (token === '--no-supabase-coverage-check') {
      args.noSupabaseCoverageCheck = true;
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
    if (token === '--owner-principal-id' && next) {
      args.ownerPrincipalId = String(next).trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--owner-principal-id=')) {
      args.ownerPrincipalId = String(token.slice('--owner-principal-id='.length)).trim();
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
    if (token === '--min-signal-score' && next) {
      args.minSignalScore = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--min-signal-score=')) {
      args.minSignalScore = Number(token.slice('--min-signal-score='.length));
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
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!Number.isFinite(args.limit) || args.limit < 0) {
    throw new Error('--limit must be >= 0');
  }
  if (!Number.isFinite(args.minSignalScore) || args.minSignalScore < 0) {
    throw new Error('--min-signal-score must be >= 0');
  }
  if (!Number.isFinite(args.startYear) || args.startYear < 0) {
    throw new Error('--start-year must be >= 0');
  }

  return args;
}

function printUsage() {
  console.log(`
Build a wave-2 email fact candidate queue from full classified corpus, excluding already reviewed items.

Usage:
  node scripts/timeline/build-email-fact-candidate-queue-wave2.mjs [options]

Options:
  --classified <path>            email-discovery-classified.jsonl path
  --prior-queue <path>           prior curated queue JSON path
  --reviewed-path <path>         reviewed/adjudication JSON path (repeatable)
  --supabase-backup <path>       private Supabase timeline backup JSON path
  --no-supabase-coverage-check   disable same-date title coverage skip
  --out <path>                   output queue JSON path
  --owner-principal-id <id>      owner principal id metadata
  --limit <n>                    max candidates (oldest-first; default 500)
  --min-signal-score <n>         minimum signal score threshold (default 8)
  --start-year <yyyy>            earliest event year to include
`);
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenOverlap(a, b) {
  const at = new Set(normalizeText(a).split(/\s+/).filter(Boolean));
  const bt = new Set(normalizeText(b).split(/\s+/).filter(Boolean));
  if (!at.size || !bt.size) return 0;
  let hit = 0;
  for (const token of at) {
    if (bt.has(token)) hit += 1;
  }
  return hit / Math.max(at.size, bt.size);
}

function yearFromIso(iso) {
  const ms = Date.parse(String(iso || ''));
  if (Number.isNaN(ms)) return 0;
  return new Date(ms).getUTCFullYear();
}

function hasSuspiciousSubject(subject) {
  const text = String(subject || '').trim();
  if (!text) return true;
  return SUSPICIOUS_SUBJECT_PATTERNS.some((pattern) => pattern.test(text));
}

function hasScamSignal(row) {
  const text = `${row?.subject || ''} ${row?.fromHeader || ''} ${row?.fromEmail || ''} ${row?.bodySnippet || ''}`.toLowerCase();
  const patterns = [
    /west\s*afric/i,
    /next of kin/i,
    /fund transfer/i,
    /lottery winner/i,
    /winning prize/i,
    /beneficiary/i,
    /confidential transaction/i,
    /urgent assistance/i,
    /laundrycontrolboard/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function hasThreadMarker(row) {
  const inReplyTo = String(row?.inReplyTo || '').trim();
  const references = String(row?.references || '').trim();
  const subject = String(row?.subject || '').trim();
  return Boolean(inReplyTo || references || /^re:/i.test(subject) || /^fwd:/i.test(subject));
}

function hasOperationalSubject(subject) {
  return OPERATIONAL_SUBJECT_PATTERNS.some((pattern) => pattern.test(String(subject || '')));
}

function classifyProject(relevance) {
  const personal = Number(relevance?.personalTimelineScore || 0);
  const media = Number(relevance?.mediaEmpireScore || 0);
  const tnf = Number(relevance?.tnfScore || 0);
  if (tnf >= 6 && tnf >= media && tnf >= personal) return 'The New Fuse Novel';
  if (media >= 4 && media >= personal) return "Daniel Who's Media Empire";
  return 'Daniel Adam Goldberg Life Story';
}

function classifyDomain(relevance) {
  const personal = Number(relevance?.personalTimelineScore || 0);
  const media = Number(relevance?.mediaEmpireScore || 0);
  const tnf = Number(relevance?.tnfScore || 0);
  const scores = [
    { key: 'Personal Life', score: personal },
    { key: 'Creativity', score: media },
    { key: 'Business & Projects', score: tnf },
  ].sort((a, b) => b.score - a.score);
  if (scores[0].score >= 4 && scores[1].score >= 4) return 'Cross-Domain';
  if (scores[0].score >= 4) return scores[0].key;
  return 'Business & Projects';
}

function confidenceFor(signalScore) {
  if (signalScore >= 16) return 'high';
  if (signalScore >= 10) return 'medium';
  return 'low';
}

function buildStatement(row, subject) {
  const date = String(row.dateIso || '').slice(0, 10) || 'unknown-date';
  const from = String(row.fromHeader || row.fromEmail || '(unknown sender)').trim();
  return `On ${date}, an email from ${from} with subject "${subject}" was captured as a potential narrative marker pending review.`;
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectMailboxPathsFromObject(value, sink) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectMailboxPathsFromObject(item, sink);
    return;
  }
  if (typeof value.mailboxPath === 'string' && value.mailboxPath.trim()) {
    sink.add(value.mailboxPath.trim());
  }
  for (const item of Object.values(value)) {
    if (item && typeof item === 'object') collectMailboxPathsFromObject(item, sink);
  }
}

function buildSupabaseCoverageIndex(events) {
  const byDate = new Map();
  for (const event of events || []) {
    const date = String(event?.event_date || '').trim();
    const title = String(event?.title || '').trim();
    if (!date || !title) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(title);
  }
  return byDate;
}

function isLikelyAlreadyCovered(supabaseTitlesByDate, dateIso, subject) {
  const date = String(dateIso || '').slice(0, 10);
  if (!date) return false;
  const titles = supabaseTitlesByDate.get(date);
  if (!titles || titles.length === 0) return false;
  const normalizedSubject = normalizeText(subject);
  for (const title of titles) {
    if (normalizeText(title) === normalizedSubject) return true;
    if (tokenOverlap(title, subject) >= 0.55) return true;
  }
  return false;
}

function signalScore(row) {
  const interaction = Number(row?.interactionScore || 0);
  const personal = Number(row?.relevance?.personalTimelineScore || 0);
  const media = Number(row?.relevance?.mediaEmpireScore || 0);
  const tnf = Number(row?.relevance?.tnfScore || 0);
  const maxRelevance = Math.max(personal, media, tnf);

  let score = 0;
  score += interaction * 2;
  score += maxRelevance;
  if (row?.keepForNarrative) score += 2;
  if (row?.fromUser || row?.inSentPath) score += 4;
  if (row?.classification === 'personal_interaction') score += 4;
  if (row?.transactionalSignal) score += 1;
  if (row?.systemSignal) score -= 2;
  if (row?.marketingSignal) score -= 2;
  return score;
}

function shouldKeepCandidate(row, signal) {
  const interaction = Number(row?.interactionScore || 0);
  const personal = Number(row?.relevance?.personalTimelineScore || 0);
  const media = Number(row?.relevance?.mediaEmpireScore || 0);
  const tnf = Number(row?.relevance?.tnfScore || 0);
  const maxRelevance = Math.max(personal, media, tnf);
  const subject = String(row?.subject || '').trim();

  const strongActorSignal = Boolean(row?.fromUser || row?.inSentPath);
  const personalConversation = String(row?.classification || '') === 'personal_interaction';
  const threadSignal = hasThreadMarker(row) && !row?.marketingSignal;
  const operationalTransactional =
    Boolean(row?.transactionalSignal) &&
    !row?.marketingSignal &&
    hasOperationalSubject(subject);
  const curatedHint = Boolean(row?.keepForNarrative) && maxRelevance >= 7 && interaction >= 2;

  if (!(strongActorSignal || personalConversation || threadSignal || operationalTransactional || curatedHint)) {
    return false;
  }

  if (String(row?.classification || '') === 'low_interaction_misc') {
    // For low_interaction_misc, require stronger corroboration to avoid spam-like noise.
    const lowMiscStrong = strongActorSignal || threadSignal || operationalTransactional;
    if (!lowMiscStrong) return false;
    if (signal < 10) return false;
  }

  if (subject.length < 3) return false;
  return true;
}

function toFact(row, signal) {
  const subject = String(row.subject || '(no-subject)').replace(/\s+/g, ' ').trim();
  const date = String(row.dateIso || '').slice(0, 10) || 'undated';
  const dedupeSeed = String(row.dedupeKey || row.messageId || row.mailboxPath || `${date}-${subject}`);
  const dedupeId = slug(dedupeSeed).slice(0, 48);
  const eventId = `email_evt_${dedupeId || Math.random().toString(36).slice(2, 12)}`;
  const domain = classifyDomain(row.relevance);
  const project = classifyProject(row.relevance);
  const confidence = confidenceFor(signal);

  const tags = [];
  if (Number(row?.relevance?.personalTimelineScore || 0) >= 4) tags.push('domain:personal');
  if (Number(row?.relevance?.mediaEmpireScore || 0) >= 4) tags.push('domain:creative');
  if (Number(row?.relevance?.tnfScore || 0) >= 4) tags.push('domain:business');
  tags.push(`classification:${String(row.classification || 'unknown')}`);
  tags.push(`signal_score:${signal}`);

  return {
    factId: `email-fact-wave2-${date}-${dedupeId}`.slice(0, 140),
    date,
    domain,
    project,
    title: subject,
    statement: buildStatement(row, subject),
    confidence,
    enteredBy: 'codex-email-wave2-curation',
    capturedAt: new Date().toISOString(),
    relevanceTags: tags,
    evidence: {
      eventId,
      mailboxPath: row.mailboxPath,
      from: row.fromHeader || row.fromEmail || '',
      subject,
      dateIso: row.dateIso,
      score: signal,
      dedupeKey: row.dedupeKey || '',
    },
    review: {
      status: 'pending_human_review',
      reviewNotes: 'Wave-2 candidate from full corpus; verify narrative significance before timeline insertion.',
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const reviewedMailboxPaths = new Set();
  const priorQueue = await readJsonIfExists(args.priorQueuePath);
  if (Array.isArray(priorQueue?.facts)) {
    for (const fact of priorQueue.facts) {
      const mailboxPath = String(fact?.evidence?.mailboxPath || '').trim();
      if (mailboxPath) reviewedMailboxPaths.add(mailboxPath);
    }
  }

  for (const reviewedPath of args.reviewedPaths) {
    const parsed = await readJsonIfExists(reviewedPath);
    if (!parsed) continue;
    collectMailboxPathsFromObject(parsed, reviewedMailboxPaths);
  }

  const supabaseBackup = args.noSupabaseCoverageCheck ? null : await readJsonIfExists(args.supabaseBackupPath);
  const supabaseEvents = Array.isArray(supabaseBackup) ? supabaseBackup : [];

  const supabaseTitlesByDate = buildSupabaseCoverageIndex(supabaseEvents);

  const selected = [];
  const selectedDedupeKeys = new Set();

  const stats = {
    scannedRows: 0,
    skippedAlreadyReviewedMailboxPath: 0,
    skippedInvalidDate: 0,
    skippedStartYear: 0,
    skippedBlockedClassification: 0,
    skippedJunkPath: 0,
    skippedSuspiciousSubject: 0,
    skippedLowSignal: 0,
    skippedLikelyAlreadyCovered: 0,
    skippedDuplicateDedupeKey: 0,
    selected: 0,
  };

  const rl = readline.createInterface({
    input: createReadStream(args.classifiedPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = String(line || '').trim();
    if (!trimmed) continue;
    stats.scannedRows += 1;

    let row;
    try {
      row = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const mailboxPath = String(row.mailboxPath || '').trim();
    if (!mailboxPath) {
      stats.skippedInvalidDate += 1;
      continue;
    }
    if (reviewedMailboxPaths.has(mailboxPath)) {
      stats.skippedAlreadyReviewedMailboxPath += 1;
      continue;
    }

    const dateIso = String(row.dateIso || '').trim();
    if (!dateIso || Number.isNaN(Date.parse(dateIso))) {
      stats.skippedInvalidDate += 1;
      continue;
    }

    const year = yearFromIso(dateIso);
    if (args.startYear > 0 && year > 0 && year < args.startYear) {
      stats.skippedStartYear += 1;
      continue;
    }

    const classification = String(row.classification || '').trim();
    if (BLOCKED_CLASSIFICATIONS.has(classification)) {
      stats.skippedBlockedClassification += 1;
      continue;
    }

    if (row.inJunkPath) {
      stats.skippedJunkPath += 1;
      continue;
    }

    const subject = String(row.subject || '').trim();
    if (hasSuspiciousSubject(subject)) {
      stats.skippedSuspiciousSubject += 1;
      continue;
    }
    if (!row?.fromUser && !row?.inSentPath && hasScamSignal(row)) {
      stats.skippedSuspiciousSubject += 1;
      continue;
    }

    const signal = signalScore(row);
    if (signal < args.minSignalScore) {
      stats.skippedLowSignal += 1;
      continue;
    }
    if (!shouldKeepCandidate(row, signal)) {
      stats.skippedLowSignal += 1;
      continue;
    }

    if (!args.noSupabaseCoverageCheck && isLikelyAlreadyCovered(supabaseTitlesByDate, dateIso, subject)) {
      stats.skippedLikelyAlreadyCovered += 1;
      continue;
    }

    const dedupeKey = String(row.dedupeKey || row.messageId || mailboxPath);
    if (selectedDedupeKeys.has(dedupeKey)) {
      stats.skippedDuplicateDedupeKey += 1;
      continue;
    }
    selectedDedupeKeys.add(dedupeKey);

    selected.push({ row, signal });
  }

  selected.sort((a, b) => {
    const ad = String(a.row?.dateIso || '');
    const bd = String(b.row?.dateIso || '');
    if (ad !== bd) return ad.localeCompare(bd);
    return Number(b.signal || 0) - Number(a.signal || 0);
  });

  const limited = args.limit > 0 ? selected.slice(0, args.limit) : selected;
  const facts = limited.map(({ row, signal }) => toFact(row, signal));
  stats.selected = facts.length;

  const payload = {
    sourceType: 'email-wave2-fact-candidates',
    generatedAt: new Date().toISOString(),
    sourceArtifact: args.classifiedPath,
    priorQueuePath: args.priorQueuePath,
    reviewedPaths: args.reviewedPaths,
    supabaseCoveragePath: args.noSupabaseCoverageCheck ? null : args.supabaseBackupPath,
    ownerPrincipalId: args.ownerPrincipalId,
    minSignalScore: args.minSignalScore,
    limit: args.limit,
    startYear: args.startYear,
    stats,
    factCount: facts.length,
    facts,
  };

  await fs.mkdir(path.dirname(args.outPath), { recursive: true });
  await fs.writeFile(args.outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        outPath: args.outPath,
        factCount: facts.length,
        stats,
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
