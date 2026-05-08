#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_INPUT = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery-full-2026-05-06-v2',
  'email-discovery-classified.jsonl'
);

const DEFAULT_OUT_DIR = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery-full-2026-05-06-v2',
  'timeline-synthesis'
);

const PERSONAL_KEYWORDS = [
  'family',
  'mother',
  'father',
  'mom',
  'dad',
  'brother',
  'sister',
  'wife',
  'husband',
  'girlfriend',
  'boyfriend',
  'baby',
  'son',
  'daughter',
  'custody',
  'birthday',
  'pregnan*',
  'hospital',
];

const CREATIVE_KEYWORDS = [
  'music',
  'song',
  'artist',
  'album',
  'lyrics',
  'podcast',
  'video',
  'jamroom',
  'mp3',
  'karaoke',
  'book',
  'chapter',
  'manuscript',
  'author',
  'creative',
  'design',
];

const BUSINESS_KEYWORDS = [
  'affiliate',
  'commission',
  'invoice',
  'receipt',
  'payment',
  'merchant',
  'account',
  'customer',
  'order',
  'purchase',
  'program',
  'project',
  'quote',
  'contract',
  'install',
  'support',
  'software',
  'hosting',
  'domain',
  'website',
  'startree',
  'indi-visible',
  'swiftcd',
  'sales',
  'funnel',
  'traffic',
];

const TNF_KEYWORDS = [
  'the new fuse',
  'thenewfuse',
  'library.thenewfuse.com',
  'story architect',
  'openclaw',
  'ai relay',
  'supabase',
  'timeline wall',
];

const EDUCATION_KEYWORDS = [
  'degree',
  'semester',
  'course',
  'class',
  'university',
  'college',
  'mentor',
  'study',
  'geneseo',
];

const RE_FWD_PREFIX = /^(?:\s*(?:re|fw|fwd)\s*:\s*)+/i;

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    outDir: DEFAULT_OUT_DIR,
    limit: 0,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if ((token === '--input' || token === '--input-path') && next) {
      options.input = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--input=')) {
      options.input = path.resolve(token.slice('--input='.length));
      continue;
    }
    if ((token === '--out-dir' || token === '--out') && next) {
      options.outDir = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--out-dir=')) {
      options.outDir = path.resolve(token.slice('--out-dir='.length));
      continue;
    }
    if (token === '--limit' && next) {
      options.limit = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      options.limit = Number(token.slice('--limit='.length));
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!Number.isFinite(options.limit) || options.limit < 0) {
    throw new Error('--limit must be a non-negative number');
  }

  return options;
}

function printUsage() {
  console.log(`
Synthesize chronological email narrative timeline across personal/creative/business domains.

Usage:
  node scripts/timeline/synthesize-email-timeline-plotlines.mjs [options]

Options:
  --input <path>         Classified email JSONL path
  --out-dir <path>       Output directory
  --limit <n>            Optional row limit for testing
`);
}

function hasAny(text, words) {
  const value = String(text || '').toLowerCase();
  return words.some((word) => {
    const raw = String(word || '').toLowerCase().trim();
    if (!raw) return false;

    if (raw.endsWith('*')) {
      const stem = raw.slice(0, -1);
      if (!stem) return false;
      const pattern = new RegExp(`\\b${escapeRegex(stem)}\\w*\\b`, 'i');
      return pattern.test(value);
    }

    if (/^[a-z0-9]+$/.test(raw)) {
      const pattern = new RegExp(`\\b${escapeRegex(raw)}\\b`, 'i');
      return pattern.test(value);
    }

    return value.includes(raw);
  });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSubject(subject) {
  const raw = String(subject || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '(no-subject)';
  return raw.replace(RE_FWD_PREFIX, '').trim() || raw;
}

function extractYearMonth(epoch) {
  if (!Number.isFinite(epoch) || epoch <= 0) return null;
  const d = new Date(epoch * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function inferDomains(record) {
  const text = `${record.subject || ''}\n${record.bodySnippet || ''}`.toLowerCase();
  const domains = new Set();
  if (hasAny(text, PERSONAL_KEYWORDS)) domains.add('personal');
  if (hasAny(text, CREATIVE_KEYWORDS)) domains.add('creative');
  if (hasAny(text, BUSINESS_KEYWORDS)) domains.add('business');
  if (hasAny(text, TNF_KEYWORDS)) {
    domains.add('business');
    domains.add('creative');
  }
  if (hasAny(text, EDUCATION_KEYWORDS)) domains.add('personal');

  if (domains.size === 0) {
    if (record.classification === 'personal_interaction') domains.add('personal');
    if (record.classification === 'transactional') domains.add('business');
    if (record.classification === 'system_notification') domains.add('business');
    if (record.classification === 'low_interaction_misc') domains.add('business');
  }

  return Array.from(domains);
}

function inferStrand(record, domains) {
  const text = `${record.subject || ''}\n${record.bodySnippet || ''}`.toLowerCase();
  if (hasAny(text, TNF_KEYWORDS)) return 'TNF Platform & AI';
  if (hasAny(text, EDUCATION_KEYWORDS)) return 'Education & Training';
  if (domains.includes('personal') && hasAny(text, PERSONAL_KEYWORDS)) return 'Personal & Family Life';
  if (domains.includes('creative') && domains.includes('business')) return 'Creative Business Operations';
  if (domains.includes('creative')) return 'Creative Practice';
  if (domains.includes('business')) return 'Business Operations';
  return 'General Correspondence';
}

function safeSnippet(text, max = 320) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function toEvent(record) {
  const domains = inferDomains(record);
  const strand = inferStrand(record, domains);
  const subjectBase = normalizeSubject(record.subject);
  const yearMonth = extractYearMonth(record.dateEpoch);
  return {
    eventId: `email_evt_${record.dedupeKey.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 80)}`,
    dateIso: record.dateIso || null,
    dateEpoch: record.dateEpoch || 0,
    yearMonth,
    subject: record.subject || '',
    subjectBase,
    from: record.fromHeader || record.fromEmail || '',
    to: Array.isArray(record.toEmails) ? record.toEmails : [],
    classification: record.classification,
    interactionScore: Number(record.interactionScore || 0),
    domains,
    narrativeStrand: strand,
    relevance: record.relevance || {},
    dedupeKey: record.dedupeKey,
    mailboxPath: record.mailboxPath,
    bodySnippet: safeSnippet(record.bodySnippet),
  };
}

function keepForTimeline(record) {
  if (!record || !record.dateEpoch || record.dateEpoch <= 0) return false;
  if (record.classification === 'marketing_newsletter') return false;
  if (record.classification === 'junk_irrelevant') return false;

  const baseSignal =
    record.classification === 'personal_interaction' ||
    record.classification === 'transactional' ||
    record.classification === 'system_notification' ||
    record.classification === 'low_interaction_misc';

  if (!baseSignal) return false;

  const relevance = record.relevance || {};
  const strongRelevance =
    Number(relevance.personalTimelineScore || 0) >= 4 ||
    Number(relevance.mediaEmpireScore || 0) >= 5 ||
    Number(relevance.tnfScore || 0) >= 5;

  const scoreSignal = Number(record.interactionScore || 0) >= 2;

  return strongRelevance || scoreSignal || record.classification === 'personal_interaction';
}

function aggregateByYear(events) {
  const counts = {};
  for (const event of events) {
    if (!event.dateEpoch) continue;
    const year = String(new Date(event.dateEpoch * 1000).getUTCFullYear());
    counts[year] = counts[year] || {
      total: 0,
      personal: 0,
      creative: 0,
      business: 0,
      strands: {},
    };
    const row = counts[year];
    row.total += 1;
    if (event.domains.includes('personal')) row.personal += 1;
    if (event.domains.includes('creative')) row.creative += 1;
    if (event.domains.includes('business')) row.business += 1;
    row.strands[event.narrativeStrand] = (row.strands[event.narrativeStrand] || 0) + 1;
  }
  return counts;
}

function buildStrands(events) {
  const map = new Map();
  for (const event of events) {
    const key = event.narrativeStrand;
    if (!map.has(key)) {
      map.set(key, {
        strand: key,
        totalEvents: 0,
        firstDateIso: null,
        lastDateIso: null,
        domains: {},
        sampleEvents: [],
      });
    }
    const row = map.get(key);
    row.totalEvents += 1;
    for (const d of event.domains) {
      row.domains[d] = (row.domains[d] || 0) + 1;
    }
    if (!row.firstDateIso || (event.dateIso && event.dateIso < row.firstDateIso)) {
      row.firstDateIso = event.dateIso;
    }
    if (!row.lastDateIso || (event.dateIso && event.dateIso > row.lastDateIso)) {
      row.lastDateIso = event.dateIso;
    }
    if (row.sampleEvents.length < 12) {
      row.sampleEvents.push({
        dateIso: event.dateIso,
        subject: event.subject,
        from: event.from,
        mailboxPath: event.mailboxPath,
        domains: event.domains,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalEvents - a.totalEvents);
}

function pickMilestones(events, count = 250) {
  const scored = [];
  for (const event of events) {
    const r = event.relevance || {};
    const score =
      Number(event.interactionScore || 0) * 2 +
      Number(r.personalTimelineScore || 0) +
      Number(r.mediaEmpireScore || 0) +
      Number(r.tnfScore || 0);
    scored.push({ event, score });
  }
  scored.sort((a, b) => {
    if (a.event.dateEpoch !== b.event.dateEpoch) return a.event.dateEpoch - b.event.dateEpoch;
    return b.score - a.score;
  });

  const selected = [];
  const perMonthQuota = new Map();
  for (const row of scored) {
    const ym = row.event.yearMonth || 'unknown';
    const current = perMonthQuota.get(ym) || 0;
    if (current >= 5) continue;
    selected.push({
      ...row.event,
      milestoneScore: row.score,
    });
    perMonthQuota.set(ym, current + 1);
    if (selected.length >= count) break;
  }
  return selected;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readJsonl(inputPath, limit) {
  const raw = await fs.readFile(inputPath, 'utf8');
  const lines = raw.split('\n').filter((line) => line.trim().length > 0);
  const max = limit > 0 ? Math.min(limit, lines.length) : lines.length;
  const rows = [];
  for (let i = 0; i < max; i += 1) {
    try {
      rows.push(JSON.parse(lines[i]));
    } catch {
      // Skip malformed line
    }
  }
  return rows;
}

async function main() {
  const options = parseArgs(process.argv);
  await fs.mkdir(options.outDir, { recursive: true });

  const rows = await readJsonl(options.input, options.limit);
  const timelineRows = rows.filter(keepForTimeline).map(toEvent);
  timelineRows.sort((a, b) => a.dateEpoch - b.dateEpoch);

  const milestones = pickMilestones(timelineRows, 300);
  const byYear = aggregateByYear(timelineRows);
  const strands = buildStrands(timelineRows);

  const personalTimeline = timelineRows.filter((e) => e.domains.includes('personal'));
  const creativeTimeline = timelineRows.filter((e) => e.domains.includes('creative'));
  const businessTimeline = timelineRows.filter((e) => e.domains.includes('business'));

  const output = {
    generatedAt: new Date().toISOString(),
    sourceInput: options.input,
    processedRows: rows.length,
    timelineRows: timelineRows.length,
    dateRange: {
      earliest: timelineRows[0]?.dateIso || null,
      latest: timelineRows[timelineRows.length - 1]?.dateIso || null,
    },
    breakdown: {
      personal: personalTimeline.length,
      creative: creativeTimeline.length,
      business: businessTimeline.length,
    },
    byYear,
    strands,
  };

  const summaryPath = path.join(options.outDir, 'email-timeline-synthesis-summary.json');
  const timelinePath = path.join(options.outDir, 'email-timeline-events.json');
  const milestonesPath = path.join(options.outDir, 'email-timeline-milestones.json');
  const personalPath = path.join(options.outDir, 'email-personal-timeline.json');
  const creativePath = path.join(options.outDir, 'email-creative-timeline.json');
  const businessPath = path.join(options.outDir, 'email-business-timeline.json');

  await writeJson(summaryPath, output);
  await writeJson(timelinePath, timelineRows);
  await writeJson(milestonesPath, milestones);
  await writeJson(personalPath, personalTimeline);
  await writeJson(creativePath, creativeTimeline);
  await writeJson(businessPath, businessTimeline);

  console.log(
    JSON.stringify(
      {
        ok: true,
        summaryPath,
        timelinePath,
        milestonesPath,
        personalPath,
        creativePath,
        businessPath,
        timelineRows: timelineRows.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
