#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_TIMELINE_PATH = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery-full-2026-05-06-v2',
  'timeline-synthesis',
  'email-timeline-events.json'
);

const DEFAULT_OUT_DIR = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery-full-2026-05-06-v2',
  'timeline-synthesis'
);

const NOISE_SUBJECT_PATTERNS = [
  /^agenda for\b/i,
  /^accepted:\b/i,
  /shadowshopper job notification/i,
  /you(?:\'|’)ve won/i,
  /winning prize/i,
  /viagra/i,
  /casino/i,
  /lottery/i,
  /^re:\s*$/i,
  /^fwd:\s*$/i,
  /^\.{3,}$/,
  /^\(no-subject\)$/i,
];

const EVIDENCE_SUBJECT_PATTERNS = [
  /approved/i,
  /account information/i,
  /welcome aboard/i,
  /receipt/i,
  /invoice/i,
  /payment/i,
  /registration/i,
  /response code/i,
  /license/i,
  /contract/i,
  /proposal/i,
  /quote/i,
  /support/i,
  /install/i,
  /onboarding/i,
  /launch/i,
  /build failed/i,
  /meeting/i,
  /interview/i,
];

function parseArgs(argv) {
  const options = {
    timelinePath: DEFAULT_TIMELINE_PATH,
    outDir: DEFAULT_OUT_DIR,
    perYearLimit: 18,
    minScore: 8,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--timeline' || token === '--input') && next) {
      options.timelinePath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--timeline=')) {
      options.timelinePath = path.resolve(token.slice('--timeline='.length));
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
    if (token === '--per-year-limit' && next) {
      options.perYearLimit = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--per-year-limit=')) {
      options.perYearLimit = Number(token.slice('--per-year-limit='.length));
      continue;
    }
    if (token === '--min-score' && next) {
      options.minScore = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--min-score=')) {
      options.minScore = Number(token.slice('--min-score='.length));
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!Number.isFinite(options.perYearLimit) || options.perYearLimit <= 0) {
    throw new Error('--per-year-limit must be > 0');
  }

  if (!Number.isFinite(options.minScore)) {
    throw new Error('--min-score must be numeric');
  }

  return options;
}

function printUsage() {
  console.log(`
Curate high-signal chronology from synthesized email events.

Usage:
  node scripts/timeline/curate-email-life-chronology.mjs [options]

Options:
  --timeline <path>         Input timeline JSON
  --out-dir <path>          Output directory
  --per-year-limit <n>      Max selected events per year (default 18)
  --min-score <n>           Minimum score for curated inclusion (default 8)
`);
}

function normalizeSpaces(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function hasPattern(text, patterns) {
  const value = normalizeSpaces(text).toLowerCase();
  return patterns.some((pattern) => pattern.test(value));
}

function scoreEvent(event) {
  const relevance = event.relevance || {};
  const classWeights = {
    personal_interaction: 6,
    transactional: 4,
    system_notification: 3,
    low_interaction_misc: 1,
    marketing_newsletter: -8,
    junk_irrelevant: -10,
  };

  let score = 0;
  score += Number(classWeights[event.classification] || 0);
  score += Number(event.interactionScore || 0) * 2;
  score += Number(relevance.personalTimelineScore || 0);
  score += Number(relevance.mediaEmpireScore || 0);
  score += Number(relevance.tnfScore || 0);

  if (Array.isArray(event.domains) && event.domains.length >= 2) score += 2;

  if (hasPattern(event.subject, EVIDENCE_SUBJECT_PATTERNS)) score += 2;
  if (hasPattern(event.subject, NOISE_SUBJECT_PATTERNS)) score -= 8;

  const from = String(event.from || '').toLowerCase();
  if (from.includes('no-reply') || from.includes('noreply') || from.includes('donotreply')) score -= 1;

  return score;
}

function toLite(event, score, flags = {}) {
  return {
    eventId: event.eventId,
    dateIso: event.dateIso,
    yearMonth: event.yearMonth,
    subject: normalizeSpaces(event.subject) || '(no-subject)',
    from: normalizeSpaces(event.from),
    domains: Array.isArray(event.domains) ? event.domains : [],
    strand: event.narrativeStrand,
    classification: event.classification,
    interactionScore: Number(event.interactionScore || 0),
    relevance: event.relevance || {},
    score,
    flags,
    mailboxPath: event.mailboxPath,
    bodySnippet: normalizeSpaces(event.bodySnippet).slice(0, 320),
  };
}

function yearFromEpoch(epoch) {
  if (!Number.isFinite(epoch) || epoch <= 0) return null;
  return String(new Date(epoch * 1000).getUTCFullYear());
}

function uniqueKey(event) {
  const subject = normalizeSpaces(event.subject || '').toLowerCase();
  const from = normalizeSpaces(event.from || '').toLowerCase();
  return `${subject}||${from}`;
}

function selectCuratedByYear(events, perYearLimit, minScore) {
  const byYear = new Map();
  const ambiguous = [];

  for (const event of events) {
    const year = yearFromEpoch(Number(event.dateEpoch || 0));
    if (!year) continue;

    const score = scoreEvent(event);
    const noise = hasPattern(event.subject, NOISE_SUBJECT_PATTERNS);
    const evidence = hasPattern(event.subject, EVIDENCE_SUBJECT_PATTERNS);

    const tnfBoost = Number(event.relevance?.tnfScore || 0) >= 5;
    const highInteraction = Number(event.interactionScore || 0) >= 4;
    const passes = score >= minScore && (!noise || tnfBoost || highInteraction || evidence);

    if (!passes) {
      if (score >= minScore - 1) {
        ambiguous.push(toLite(event, score, { noise, evidence, reason: 'near-threshold' }));
      }
      continue;
    }

    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(toLite(event, score, { noise, evidence }));
  }

  const yearRows = [];
  for (const year of Array.from(byYear.keys()).sort((a, b) => Number(a) - Number(b))) {
    const entries = byYear.get(year);
    const ranked = entries
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.dateIso || '').localeCompare(b.dateIso || '');
      });

    const selected = [];
    const seen = new Set();
    for (const row of ranked) {
      const key = uniqueKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(row);
      if (selected.length >= perYearLimit) break;
    }

    selected.sort((a, b) => (a.dateIso || '').localeCompare(b.dateIso || ''));

    yearRows.push({
      year,
      selectedCount: selected.length,
      candidateCount: entries.length,
      events: selected,
    });
  }

  ambiguous.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.dateIso || '').localeCompare(b.dateIso || '');
  });

  return { yearRows, ambiguous };
}

function deriveSummary(yearRows) {
  let totalSelected = 0;
  const domains = { personal: 0, creative: 0, business: 0, overlap2plus: 0 };

  for (const year of yearRows) {
    for (const event of year.events) {
      totalSelected += 1;
      const ds = event.domains || [];
      if (ds.includes('personal')) domains.personal += 1;
      if (ds.includes('creative')) domains.creative += 1;
      if (ds.includes('business')) domains.business += 1;
      if (ds.length >= 2) domains.overlap2plus += 1;
    }
  }

  return { totalSelected, domains };
}

function buildMarkdown(report) {
  const lines = [];
  lines.push('# Curated Email Chronology (High-Signal)');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Source timeline: ${report.sourceTimeline}`);
  lines.push(`Filter: score >= ${report.filters.minScore}, max ${report.filters.perYearLimit} events/year`);
  lines.push('');
  lines.push('## Coverage');
  lines.push(`- Selected events: ${report.summary.totalSelected}`);
  lines.push(`- Personal-tagged: ${report.summary.domains.personal}`);
  lines.push(`- Creative-tagged: ${report.summary.domains.creative}`);
  lines.push(`- Business-tagged: ${report.summary.domains.business}`);
  lines.push(`- Overlap (2+ domains): ${report.summary.domains.overlap2plus}`);
  lines.push('');

  for (const year of report.years) {
    if (!year.events.length) continue;
    lines.push(`## ${year.year}`);
    lines.push(`- Selected ${year.selectedCount} of ${year.candidateCount} high-signal candidates`);
    for (const event of year.events) {
      const date = event.dateIso ? event.dateIso.slice(0, 10) : 'undated';
      const domainStr = event.domains.join(',') || 'unmapped';
      lines.push(`- ${date} | [${domainStr}] | score ${event.score} | ${event.subject} | ${event.from}`);
    }
    lines.push('');
  }

  lines.push('## Ambiguous Queue');
  lines.push(`- Near-threshold / noisy events kept for manual review: ${report.ambiguousReviewCount}`);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv);
  await fs.mkdir(options.outDir, { recursive: true });

  const raw = await fs.readFile(options.timelinePath, 'utf8');
  const events = JSON.parse(raw);

  const filteredBase = events.filter((event) => {
    if (!event || typeof event !== 'object') return false;
    if (!Number.isFinite(Number(event.dateEpoch || 0)) || Number(event.dateEpoch || 0) <= 0) return false;
    if (event.classification === 'marketing_newsletter' || event.classification === 'junk_irrelevant') return false;
    return true;
  });

  const sorted = filteredBase.sort((a, b) => Number(a.dateEpoch || 0) - Number(b.dateEpoch || 0));
  const { yearRows, ambiguous } = selectCuratedByYear(sorted, options.perYearLimit, options.minScore);
  const summary = deriveSummary(yearRows);

  const report = {
    generatedAt: new Date().toISOString(),
    sourceTimeline: options.timelinePath,
    filters: {
      minScore: options.minScore,
      perYearLimit: options.perYearLimit,
      excludedClassifications: ['marketing_newsletter', 'junk_irrelevant'],
      noisePatterns: NOISE_SUBJECT_PATTERNS.map((pattern) => String(pattern)),
      evidencePatterns: EVIDENCE_SUBJECT_PATTERNS.map((pattern) => String(pattern)),
    },
    sourceCounts: {
      inputEvents: events.length,
      datedNonNoiseBase: filteredBase.length,
    },
    summary,
    years: yearRows,
    ambiguousReviewCount: ambiguous.length,
    ambiguousReviewSample: ambiguous.slice(0, 600),
  };

  const jsonPath = path.join(options.outDir, 'email-chronology-curated.json');
  const mdPath = path.join(options.outDir, 'email-chronology-curated.md');
  const ambiguousPath = path.join(options.outDir, 'email-chronology-ambiguous.json');

  await writeJson(jsonPath, report);
  await fs.writeFile(mdPath, buildMarkdown(report), 'utf8');
  await writeJson(ambiguousPath, ambiguous);

  console.log(JSON.stringify({
    status: 'ok',
    jsonPath,
    mdPath,
    ambiguousPath,
    selectedYears: yearRows.length,
    totalSelected: summary.totalSelected,
    ambiguousCount: ambiguous.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
