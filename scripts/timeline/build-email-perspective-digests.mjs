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

function parseArgs(argv) {
  const options = {
    timelinePath: DEFAULT_TIMELINE_PATH,
    outDir: DEFAULT_OUT_DIR,
    perDomainLimit: 400,
    overlapLimit: 600,
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
    if (token === '--per-domain-limit' && next) {
      options.perDomainLimit = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--per-domain-limit=')) {
      options.perDomainLimit = Number(token.slice('--per-domain-limit='.length));
      continue;
    }
    if (token === '--overlap-limit' && next) {
      options.overlapLimit = Number(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--overlap-limit=')) {
      options.overlapLimit = Number(token.slice('--overlap-limit='.length));
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  if (!Number.isFinite(options.perDomainLimit) || options.perDomainLimit <= 0) {
    throw new Error('--per-domain-limit must be > 0');
  }
  if (!Number.isFinite(options.overlapLimit) || options.overlapLimit <= 0) {
    throw new Error('--overlap-limit must be > 0');
  }

  return options;
}

function printUsage() {
  console.log(`
Build perspective digests from synthesized email timeline events.

Usage:
  node scripts/timeline/build-email-perspective-digests.mjs [options]

Options:
  --timeline <path>            Input timeline JSON
  --out-dir <path>             Output directory
  --per-domain-limit <n>       Domain digest row count
  --overlap-limit <n>          Overlap digest row count
`);
}

function scoreEvent(event) {
  const r = event.relevance || {};
  return (
    Number(event.interactionScore || 0) * 2 +
    Number(r.personalTimelineScore || 0) +
    Number(r.mediaEmpireScore || 0) +
    Number(r.tnfScore || 0)
  );
}

function eventLite(event, perspective) {
  return {
    eventId: event.eventId,
    dateIso: event.dateIso,
    yearMonth: event.yearMonth,
    perspective,
    domains: event.domains,
    strand: event.narrativeStrand,
    subject: event.subject,
    from: event.from,
    to: event.to,
    classification: event.classification,
    interactionScore: event.interactionScore,
    relevance: event.relevance,
    score: scoreEvent(event),
    mailboxPath: event.mailboxPath,
    bodySnippet: event.bodySnippet,
  };
}

function buildYearDomainMatrix(events) {
  const matrix = {};
  for (const e of events) {
    if (!e.dateEpoch) continue;
    const year = String(new Date(e.dateEpoch * 1000).getUTCFullYear());
    if (!matrix[year]) {
      matrix[year] = {
        total: 0,
        personal: 0,
        creative: 0,
        business: 0,
        overlap2plus: 0,
      };
    }
    const row = matrix[year];
    row.total += 1;
    if (e.domains.includes('personal')) row.personal += 1;
    if (e.domains.includes('creative')) row.creative += 1;
    if (e.domains.includes('business')) row.business += 1;
    if (e.domains.length >= 2) row.overlap2plus += 1;
  }
  return matrix;
}

function topContacts(events, domain) {
  const map = new Map();
  for (const e of events) {
    if (!e.domains.includes(domain)) continue;
    const key = String(e.from || '(unknown)').trim() || '(unknown)';
    if (!map.has(key)) {
      map.set(key, {
        contact: key,
        count: 0,
        firstDateIso: e.dateIso || null,
        lastDateIso: e.dateIso || null,
      });
    }
    const row = map.get(key);
    row.count += 1;
    if (e.dateIso && (!row.firstDateIso || e.dateIso < row.firstDateIso)) row.firstDateIso = e.dateIso;
    if (e.dateIso && (!row.lastDateIso || e.dateIso > row.lastDateIso)) row.lastDateIso = e.dateIso;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 120);
}

function selectPerspective(events, domain, limit) {
  return events
    .filter((e) => e.domains.includes(domain))
    .map((e) => eventLite(e, domain))
    .sort((a, b) => {
      if (a.dateIso !== b.dateIso) return (a.dateIso || '').localeCompare(b.dateIso || '');
      return b.score - a.score;
    })
    .slice(0, limit);
}

function selectOverlap(events, limit) {
  return events
    .filter((e) => e.domains.length >= 2)
    .map((e) => eventLite(e, 'overlap'))
    .sort((a, b) => {
      if (a.dateIso !== b.dateIso) return (a.dateIso || '').localeCompare(b.dateIso || '');
      return b.score - a.score;
    })
    .slice(0, limit);
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv);
  await fs.mkdir(options.outDir, { recursive: true });

  const timelineRaw = await fs.readFile(options.timelinePath, 'utf8');
  const events = JSON.parse(timelineRaw);

  const sorted = [...events].sort((a, b) => Number(a.dateEpoch || 0) - Number(b.dateEpoch || 0));
  const personal = selectPerspective(sorted, 'personal', options.perDomainLimit);
  const creative = selectPerspective(sorted, 'creative', options.perDomainLimit);
  const business = selectPerspective(sorted, 'business', options.perDomainLimit);
  const overlap = selectOverlap(sorted, options.overlapLimit);

  const digest = {
    generatedAt: new Date().toISOString(),
    sourceTimeline: options.timelinePath,
    totals: {
      events: sorted.length,
      personal: sorted.filter((e) => e.domains.includes('personal')).length,
      creative: sorted.filter((e) => e.domains.includes('creative')).length,
      business: sorted.filter((e) => e.domains.includes('business')).length,
      overlap: sorted.filter((e) => e.domains.length >= 2).length,
    },
    dateRange: {
      earliest: sorted[0]?.dateIso || null,
      latest: sorted[sorted.length - 1]?.dateIso || null,
    },
    yearDomainMatrix: buildYearDomainMatrix(sorted),
    topContacts: {
      personal: topContacts(sorted, 'personal'),
      creative: topContacts(sorted, 'creative'),
      business: topContacts(sorted, 'business'),
    },
  };

  const digestPath = path.join(options.outDir, 'email-perspective-digest.json');
  const personalPath = path.join(options.outDir, 'email-perspective-personal.json');
  const creativePath = path.join(options.outDir, 'email-perspective-creative.json');
  const businessPath = path.join(options.outDir, 'email-perspective-business.json');
  const overlapPath = path.join(options.outDir, 'email-perspective-overlap.json');

  await writeJson(digestPath, digest);
  await writeJson(personalPath, personal);
  await writeJson(creativePath, creative);
  await writeJson(businessPath, business);
  await writeJson(overlapPath, overlap);

  console.log(
    JSON.stringify(
      {
        ok: true,
        digestPath,
        personalPath,
        creativePath,
        businessPath,
        overlapPath,
        totals: digest.totals,
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

