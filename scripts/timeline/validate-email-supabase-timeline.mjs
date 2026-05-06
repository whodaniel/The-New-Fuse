#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_OUT_PATH = resolveTimelineOutputPath(`email-supabase-timeline-validation.${TODAY}.json`);

const DEFAULT_EXCLUDED_PATH = resolveTimelineOutputPath(`email-ledger-excluded-review.${TODAY}.json`);

const DEFAULT_LEDGER_PATH = path.join(process.cwd(), 'data', 'unified-task-ledger.json');

const ALLOWED_SOURCE_TYPES = new Set(['git', 'manual', 'inferred', 'ai_generated']);

const TITLE_WEAK_PATTERNS = [
  /^\(no-?subject\)$/i,
  /^re:\s*\.?$/i,
  /^ss\.?$/i,
  /^t$/i,
  /^re:$/i,
];

const TITLE_POSITIVE_KEYWORDS = [
  'receipt',
  'invoice',
  'payment',
  'purchase',
  'approval',
  'approved',
  'activation',
  'activated',
  'account',
  'onboarding',
  'registration',
  'welcome',
  'response code',
  'commission',
  'support',
  'license',
];

const TITLE_NEGATIVE_KEYWORDS = [
  'no-subject',
  'hello',
  'hey',
  'urgent',
  'random',
  'laugh',
  'trip',
];

const TITLE_STOPWORDS = new Set([
  're',
  'fw',
  'fwd',
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'of',
  'on',
  'in',
  'your',
  'you',
  'my',
  'me',
  'our',
  'their',
  'his',
  'her',
  'this',
  'that',
  'these',
  'those',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'it',
  'as',
  'with',
  'from',
  'about',
  'again',
  'new',
  'message',
  'hello',
  'hi',
  'sir',
]);

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
    excludedPath: DEFAULT_EXCLUDED_PATH,
    ledgerPath: DEFAULT_LEDGER_PATH,
    outPath: DEFAULT_OUT_PATH,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--url' || token === '-u') && next) {
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
    if ((token === '--excluded' || token === '--excluded-path') && next) {
      args.excludedPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--excluded=')) {
      args.excludedPath = path.resolve(token.slice('--excluded='.length));
      continue;
    }
    if ((token === '--ledger' || token === '--ledger-path') && next) {
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
Validate Supabase timeline quality for email archaeology import.

Usage:
  node scripts/timeline/validate-email-supabase-timeline.mjs [options]

Options:
  --url <supabase-url>            Supabase project URL
  --anon-key <key>                Supabase API key (service role recommended)
  --owner-principal-id <id>       Owner principal header (default: daniel)
  --session-id <uuid>             Optional explicit story session id
  --excluded <path>               Excluded review JSON path
  --ledger <path>                 Unified task ledger path
  --out <path>                    Output JSON path
`);
}

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeTitle(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !TITLE_STOPWORDS.has(token));
}

function jaccard(a, b) {
  const aSet = new Set(a);
  const bSet = new Set(b);
  if (!aSet.size && !bSet.size) return 1;
  let inter = 0;
  for (const token of aSet) {
    if (bSet.has(token)) inter += 1;
  }
  const union = new Set([...aSet, ...bSet]).size;
  return union ? inter / union : 0;
}

function extractStoryKey(tags) {
  if (!Array.isArray(tags)) return '';
  const match = tags.find((tag) => String(tag || '').startsWith('story_key:'));
  return match ? String(match) : '';
}

function extractTagValues(tags, prefix) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag || '').trim())
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => tag.slice(prefix.length));
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

function getWeakTitleReason(title) {
  const trimmed = String(title || '').trim();
  if (!trimmed) return 'empty_title';
  if (trimmed.length <= 2) return 'very_short_title';
  if (TITLE_WEAK_PATTERNS.some((pattern) => pattern.test(trimmed))) return 'placeholder_or_reply_title';
  return '';
}

function extractEmailAddress(value) {
  const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

function normalizeEvidenceReference(value) {
  return String(value || '').trim().toLowerCase();
}

function countKeywordHits(text, keywords) {
  const normalized = normalizeTitle(text);
  let hits = 0;
  const matched = [];
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeTitle(keyword);
    if (!normalizedKeyword) continue;
    if (normalized.includes(normalizedKeyword)) {
      hits += 1;
      matched.push(normalizedKeyword);
    }
  }
  return { hits, matched };
}

function summarizeCounts(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item);
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function intersects(listA, listB) {
  const right = new Set(listB || []);
  return (listA || []).some((value) => right.has(value));
}

async function maybeReadExcludedFacts(excludedPath) {
  try {
    const raw = await fs.readFile(excludedPath, 'utf8');
    const parsed = JSON.parse(raw);
    const low = Array.isArray(parsed?.excluded?.lowConfidenceFacts) ? parsed.excluded.lowConfidenceFacts : [];
    const suspicious = Array.isArray(parsed?.excluded?.suspiciousSubjectFacts)
      ? parsed.excluded.suspiciousSubjectFacts
      : [];
    return {
      found: true,
      path: excludedPath,
      low,
      suspicious,
    };
  } catch (error) {
    return {
      found: false,
      path: excludedPath,
      low: [],
      suspicious: [],
      error: String(error?.message || error),
    };
  }
}

async function maybeReadLedgerEvidence(ledgerPath) {
  try {
    const raw = await fs.readFile(ledgerPath, 'utf8');
    const parsed = JSON.parse(raw);
    const timelineEvents = Array.isArray(parsed?.timelineEvents) ? parsed.timelineEvents : [];
    const storyKeyEvidence = new Map();

    for (const event of timelineEvents) {
      const payload = event?.payload || {};
      const storyKey = String(payload.storyKey || '').trim();
      if (!storyKey) continue;

      const evidenceRefs = Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs : [];
      if (!evidenceRefs.length) continue;

      const normalizedRefs = evidenceRefs
        .map((ref) => normalizeEvidenceReference(ref))
        .filter(Boolean);
      if (!normalizedRefs.length) continue;

      const existing = storyKeyEvidence.get(storyKey) || new Set();
      for (const ref of normalizedRefs) existing.add(ref);
      storyKeyEvidence.set(storyKey, existing);
    }

    return {
      found: true,
      path: ledgerPath,
      storyKeyEvidence,
    };
  } catch (error) {
    return {
      found: false,
      path: ledgerPath,
      storyKeyEvidence: new Map(),
      error: String(error?.message || error),
    };
  }
}

async function resolveSessionId(supabase, args) {
  if (args.sessionId) return args.sessionId;

  const { data, error } = await supabase
    .from('story_sessions')
    .select('id')
    .eq('owner_principal_id', args.ownerPrincipalId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve session id: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error('No active story session found for owner principal id.');
  }
  return data.id;
}

async function fetchTimelineRows(supabase, sessionId) {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('id,session_id,era,event_date,title,description,source_type,tags,created_at,updated_at')
      .eq('session_id', sessionId)
      .order('event_date', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch timeline rows at offset ${offset}: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

function analyzeTimelineRows(rows) {
  const nowIso = new Date().toISOString().slice(0, 10);
  const weakTitles = [];
  const sourceTypeViolations = [];
  const missingStoryKeys = [];
  const duplicateStoryKeyIndex = new Map();
  const duplicateDateTitleIndex = new Map();
  const eraMismatches = [];
  const futureDated = [];
  const genericDescriptions = [];

  const tagCoverage = {
    storyKey: 0,
    project: 0,
    timelineCategory: 0,
    confidence: 0,
    track: 0,
    sourceTypeRaw: 0,
  };

  const projectCounts = {};
  const timelineCategoryCounts = {};
  const confidenceCounts = {};
  const trackCounts = {};
  const sourceTypeCounts = {};

  const dateToRows = new Map();

  for (const row of rows) {
    const storyKey = extractStoryKey(row.tags);
    const normalizedTitle = normalizeTitle(row.title);
    const weakReason = getWeakTitleReason(row.title);

    sourceTypeCounts[row.source_type] = (sourceTypeCounts[row.source_type] || 0) + 1;
    if (!ALLOWED_SOURCE_TYPES.has(String(row.source_type || ''))) {
      sourceTypeViolations.push({
        id: row.id,
        sourceType: row.source_type,
        title: row.title,
        eventDate: row.event_date,
      });
    }

    if (weakReason) {
      weakTitles.push({
        id: row.id,
        eventDate: row.event_date,
        title: row.title,
        reason: weakReason,
      });
    }

    if (!storyKey) {
      missingStoryKeys.push({
        id: row.id,
        eventDate: row.event_date,
        title: row.title,
      });
    } else {
      const current = duplicateStoryKeyIndex.get(storyKey) || [];
      current.push(row);
      duplicateStoryKeyIndex.set(storyKey, current);
      tagCoverage.storyKey += 1;
    }

    const dateTitleKey = `${row.event_date || ''}|${normalizedTitle}`;
    const dateTitleBucket = duplicateDateTitleIndex.get(dateTitleKey) || [];
    dateTitleBucket.push(row);
    duplicateDateTitleIndex.set(dateTitleKey, dateTitleBucket);

    if (!dateToRows.has(row.event_date)) dateToRows.set(row.event_date, []);
    dateToRows.get(row.event_date).push(row);

    if (row.event_date && row.event_date > nowIso) {
      futureDated.push({
        id: row.id,
        eventDate: row.event_date,
        title: row.title,
      });
    }

    if (/captured as a timeline marker across/i.test(String(row.description || ''))) {
      genericDescriptions.push({
        id: row.id,
        eventDate: row.event_date,
        title: row.title,
      });
    }

    const year = Number(String(row.event_date || '').slice(0, 4));
    if (Number.isFinite(year)) {
      const expectedEra = yearToEra(year);
      if (expectedEra !== row.era) {
        eraMismatches.push({
          id: row.id,
          eventDate: row.event_date,
          title: row.title,
          era: row.era,
          expectedEra,
        });
      }
    }

    const projects = extractTagValues(row.tags, 'project:');
    const categories = extractTagValues(row.tags, 'timeline_category:');
    const confidences = extractTagValues(row.tags, 'confidence:');
    const tracks = extractTagValues(row.tags, 'track:');
    const rawSource = extractTagValues(row.tags, 'source_type_raw:');

    if (projects.length) {
      tagCoverage.project += 1;
      for (const value of projects) {
        projectCounts[value] = (projectCounts[value] || 0) + 1;
      }
    }
    if (categories.length) {
      tagCoverage.timelineCategory += 1;
      for (const value of categories) {
        timelineCategoryCounts[value] = (timelineCategoryCounts[value] || 0) + 1;
      }
    }
    if (confidences.length) {
      tagCoverage.confidence += 1;
      for (const value of confidences) {
        confidenceCounts[value] = (confidenceCounts[value] || 0) + 1;
      }
    }
    if (tracks.length) {
      tagCoverage.track += 1;
      for (const value of tracks) {
        trackCounts[value] = (trackCounts[value] || 0) + 1;
      }
    }
    if (rawSource.length) {
      tagCoverage.sourceTypeRaw += 1;
    }
  }

  const duplicateStoryKeys = Array.from(duplicateStoryKeyIndex.entries())
    .filter(([, bucket]) => bucket.length > 1)
    .map(([storyKey, bucket]) => ({
      storyKey,
      count: bucket.length,
      rows: bucket.map((row) => ({
        id: row.id,
        eventDate: row.event_date,
        title: row.title,
      })),
    }));

  const duplicateDateTitle = Array.from(duplicateDateTitleIndex.entries())
    .filter(([, bucket]) => bucket.length > 1)
    .map(([key, bucket]) => ({
      key,
      count: bucket.length,
      rows: bucket.map((row) => ({
        id: row.id,
        eventDate: row.event_date,
        title: row.title,
      })),
    }));

  return {
    rowCount: rows.length,
    firstEventDate: rows[0]?.event_date || null,
    lastEventDate: rows[rows.length - 1]?.event_date || null,
    sourceTypeCounts,
    tagCoverage,
    projectCounts,
    timelineCategoryCounts,
    confidenceCounts,
    trackCounts,
    findings: {
      weakTitles,
      sourceTypeViolations,
      missingStoryKeys,
      duplicateStoryKeys,
      duplicateDateTitle,
      eraMismatches,
      futureDated,
      genericDescriptions,
    },
    dateToRows,
  };
}

function evaluateExcludedFacts(excluded, dateToRows, ledgerEvidence) {
  const lowFacts = excluded.low.map((fact) => ({ ...fact, queue: 'low_confidence' }));
  const suspiciousFacts = excluded.suspicious.map((fact) => ({ ...fact, queue: 'suspicious_subject' }));
  const allFacts = [...lowFacts, ...suspiciousFacts];

  const outcomes = [];

  for (const fact of allFacts) {
    const candidates = dateToRows.get(fact.date) || [];
    const factTokens = tokenize(fact.title);
    const factEmail = extractEmailAddress(fact.from);
    const factMailboxPath = normalizeEvidenceReference(fact.mailboxPath);

    let bestScore = -1;
    let bestRow = null;
    let sameDateSharedToken = false;
    let senderMatch = false;
    let evidenceMatchOnDate = false;
    let evidenceMatchedRow = null;

    for (const row of candidates) {
      const rowTokens = tokenize(row.title);
      const score = jaccard(factTokens, rowTokens);
      if (score > bestScore) {
        bestScore = score;
        bestRow = row;
      }

      const shared = rowTokens.some((token) => factTokens.includes(token));
      if (shared) sameDateSharedToken = true;

      if (factEmail && String(row.description || '').toLowerCase().includes(factEmail)) {
        senderMatch = true;
      }

      const rowStoryKey = extractStoryKey(row.tags).replace(/^story_key:/, '');
      const evidenceSet = ledgerEvidence.storyKeyEvidence.get(rowStoryKey);
      if (factMailboxPath && evidenceSet && evidenceSet.size) {
        const mailboxTag = `email:mailbox:${factMailboxPath}`;
        const matched = evidenceSet.has(mailboxTag) || evidenceSet.has(factMailboxPath);
        if (matched) {
          evidenceMatchOnDate = true;
          evidenceMatchedRow = row;
        }
      }
    }

    const exactTitleMatch =
      candidates.find((row) => normalizeTitle(row.title) === normalizeTitle(fact.title)) || null;

    const positive = countKeywordHits(fact.title, TITLE_POSITIVE_KEYWORDS);
    const negative = countKeywordHits(fact.title, TITLE_NEGATIVE_KEYWORDS);
    const bestCandidatePositive = bestRow ? countKeywordHits(bestRow.title, TITLE_POSITIVE_KEYWORDS) : { hits: 0, matched: [] };
    const sharedPositiveSignal = intersects(positive.matched, bestCandidatePositive.matched);

    let coverageStatus = 'not_covered';
    if (evidenceMatchOnDate) {
      coverageStatus = 'covered_exact_evidence';
    } else if (exactTitleMatch) {
      coverageStatus = 'covered_exact_date_title';
    } else if (bestScore >= 0.35 || senderMatch) {
      coverageStatus = 'covered_probable_same_event';
    } else if (bestScore >= 0.2 && sameDateSharedToken) {
      coverageStatus = 'covered_probable_same_event';
    } else if (bestScore >= 0.15 && sharedPositiveSignal) {
      coverageStatus = 'covered_probable_same_event';
    }

    let recommendation = 'keep_excluded';
    if (coverageStatus !== 'not_covered') {
      recommendation = 'keep_excluded_already_covered';
    } else if (fact.queue === 'suspicious_subject') {
      recommendation = 'keep_excluded_suspicious_subject';
    } else if (positive.hits >= 2 && negative.hits === 0) {
      recommendation = 'promote_for_review';
    } else if (positive.hits >= 1 && negative.hits === 0) {
      recommendation = 'optional_review';
    } else {
      recommendation = 'keep_excluded_low_signal';
    }

    outcomes.push({
      factId: fact.factId,
      queue: fact.queue,
      confidence: fact.confidence,
      date: fact.date,
      title: fact.title,
      from: fact.from,
      project: fact.project,
      domain: fact.domain,
      coverageStatus,
      recommendation,
      positiveSignalHits: positive.hits,
      positiveSignals: positive.matched,
      negativeSignalHits: negative.hits,
      negativeSignals: negative.matched,
      candidateCountSameDate: candidates.length,
      bestTitleSimilarityScore: bestScore >= 0 ? Number(bestScore.toFixed(3)) : 0,
      bestCandidate: bestRow
        ? {
            id: bestRow.id,
            title: bestRow.title,
            eventDate: bestRow.event_date,
          }
        : null,
      evidenceMatchOnDate,
      evidenceMatchedCandidate: evidenceMatchedRow
        ? {
            id: evidenceMatchedRow.id,
            title: evidenceMatchedRow.title,
            eventDate: evidenceMatchedRow.event_date,
          }
        : null,
      sharedPositiveSignalWithBestCandidate: sharedPositiveSignal,
      senderMatchOnDate: senderMatch,
    });
  }

  return {
    factCount: outcomes.length,
    queueCounts: summarizeCounts(outcomes, (item) => item.queue),
    coverageCounts: summarizeCounts(outcomes, (item) => item.coverageStatus),
    recommendationCounts: summarizeCounts(outcomes, (item) => item.recommendation),
    outcomes,
  };
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

  const sessionId = await resolveSessionId(supabase, args);
  const rows = await fetchTimelineRows(supabase, sessionId);
  const excluded = await maybeReadExcludedFacts(args.excludedPath);
  const ledgerEvidence = await maybeReadLedgerEvidence(args.ledgerPath);
  const timelineAnalysis = analyzeTimelineRows(rows);
  const excludedAnalysis = evaluateExcludedFacts(excluded, timelineAnalysis.dateToRows, ledgerEvidence);

  const report = {
    sourceType: 'email-supabase-timeline-validation',
    generatedAt: new Date().toISOString(),
    ownerPrincipalId: args.ownerPrincipalId,
    sessionId,
    timeline: {
      rowCount: timelineAnalysis.rowCount,
      firstEventDate: timelineAnalysis.firstEventDate,
      lastEventDate: timelineAnalysis.lastEventDate,
      sourceTypeCounts: timelineAnalysis.sourceTypeCounts,
      tagCoverage: timelineAnalysis.tagCoverage,
      projectCounts: timelineAnalysis.projectCounts,
      timelineCategoryCounts: timelineAnalysis.timelineCategoryCounts,
      confidenceCounts: timelineAnalysis.confidenceCounts,
      trackCounts: timelineAnalysis.trackCounts,
      findings: timelineAnalysis.findings,
    },
    excludedReview: {
      sourcePath: excluded.path,
      found: excluded.found,
      error: excluded.error || null,
      ledgerPath: ledgerEvidence.path,
      ledgerFound: ledgerEvidence.found,
      ledgerError: ledgerEvidence.error || null,
      ...excludedAnalysis,
    },
  };

  await fs.mkdir(path.dirname(args.outPath), { recursive: true });
  await fs.writeFile(args.outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outPath: args.outPath,
        sessionId,
        rowCount: timelineAnalysis.rowCount,
        weakTitles: timelineAnalysis.findings.weakTitles.length,
        duplicateStoryKeys: timelineAnalysis.findings.duplicateStoryKeys.length,
        duplicateDateTitle: timelineAnalysis.findings.duplicateDateTitle.length,
        missingStoryKeys: timelineAnalysis.findings.missingStoryKeys.length,
        eraMismatches: timelineAnalysis.findings.eraMismatches.length,
        futureDated: timelineAnalysis.findings.futureDated.length,
        excludedFacts: excludedAnalysis.factCount,
        recommendationCounts: excludedAnalysis.recommendationCounts,
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
