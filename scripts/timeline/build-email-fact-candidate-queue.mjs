#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveTimelineOutputPath } from './lib/output-paths.mjs';

const DEFAULT_CURATED = path.join(
  process.cwd(),
  'reports',
  'personal-archaeology',
  'email-discovery-full-2026-05-06-v2',
  'timeline-synthesis',
  'email-chronology-curated.json'
);

const DEFAULT_OUT = resolveTimelineOutputPath(
  `email-fact-candidate-queue.${new Date().toISOString().slice(0, 10)}.json`
);

function parseArgs(argv) {
  const options = {
    curatedPath: DEFAULT_CURATED,
    outPath: DEFAULT_OUT,
    limit: 0,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if ((token === '--curated' || token === '--input') && next) {
      options.curatedPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--curated=')) {
      options.curatedPath = path.resolve(token.slice('--curated='.length));
      continue;
    }
    if ((token === '--out' || token === '--output') && next) {
      options.outPath = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--out=')) {
      options.outPath = path.resolve(token.slice('--out='.length));
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
    throw new Error('--limit must be >= 0');
  }

  return options;
}

function printUsage() {
  console.log(`
Build a structured fact candidate queue from curated chronology events.

Usage:
  node scripts/timeline/build-email-fact-candidate-queue.mjs [options]

Options:
  --curated <path>      Curated chronology JSON input
  --out <path>          Output fact queue JSON path
  --limit <n>           Optional max facts for testing
`);
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function classifyProject(domains, strand) {
  const joined = `${(domains || []).join(' ')} ${strand || ''}`.toLowerCase();
  if (joined.includes('tnf') || joined.includes('story architect') || joined.includes('openclaw')) {
    return "The New Fuse Novel";
  }
  if (joined.includes('creative')) {
    return "Daniel Who's Media Empire";
  }
  return "Daniel Adam Goldberg Life Story";
}

function classifyDomain(domains) {
  const ds = Array.isArray(domains) ? domains : [];
  if (ds.length >= 2) return 'Cross-Domain';
  if (ds.includes('business')) return 'Business & Projects';
  if (ds.includes('creative')) return 'Creativity';
  return 'Personal Life';
}

function confidenceFor(event) {
  const score = Number(event.score || 0);
  if (score >= 24) return 'high';
  if (score >= 16) return 'medium';
  return 'low';
}

function normalizeSubject(subject) {
  return String(subject || '(no-subject)').replace(/\s+/g, ' ').trim();
}

function buildStatement(event) {
  const date = String(event.dateIso || '').slice(0, 10) || 'unknown-date';
  const subject = normalizeSubject(event.subject);
  const from = String(event.from || '(unknown sender)').trim();
  return `On ${date}, an email from ${from} with subject "${subject}" was captured as a timeline marker across ${event.domains.join(', ')} domains.`;
}

function flatEvents(curated) {
  const rows = [];
  for (const yearRow of curated.years || []) {
    for (const event of yearRow.events || []) {
      rows.push(event);
    }
  }
  return rows;
}

async function main() {
  const options = parseArgs(process.argv);
  const raw = await fs.readFile(options.curatedPath, 'utf8');
  const curated = JSON.parse(raw);

  const events = flatEvents(curated)
    .sort((a, b) => {
      if ((a.dateIso || '') !== (b.dateIso || '')) return (a.dateIso || '').localeCompare(b.dateIso || '');
      return Number(b.score || 0) - Number(a.score || 0);
    });

  const selected = options.limit > 0 ? events.slice(0, options.limit) : events;

  const facts = selected.map((event, index) => {
    const date = String(event.dateIso || '').slice(0, 10) || 'undated';
    const subject = normalizeSubject(event.subject);
    const idStem = slug(`${date}-${subject}`) || `event-${index + 1}`;
    const project = classifyProject(event.domains, event.strand);
    const domain = classifyDomain(event.domains);

    return {
      factId: `email-fact-${idStem}`,
      date,
      domain,
      project,
      title: subject,
      statement: buildStatement(event),
      confidence: confidenceFor(event),
      enteredBy: 'codex-email-curation',
      capturedAt: new Date().toISOString(),
      relevanceTags: [
        ...event.domains.map((d) => `domain:${d}`),
        `classification:${event.classification}`,
        `strand:${slug(event.strand || 'unknown')}`,
      ],
      evidence: {
        eventId: event.eventId,
        mailboxPath: event.mailboxPath,
        from: event.from,
        subject,
        dateIso: event.dateIso,
        score: event.score,
      },
      review: {
        status: 'pending_human_review',
        reviewNotes: 'Verify relationship context and narrative significance before final timeline insertion.',
      },
    };
  });

  const payload = {
    sourceType: 'email-curated-fact-candidates',
    generatedAt: new Date().toISOString(),
    sourceArtifact: options.curatedPath,
    ownerPrincipalId: 'daniel-goldberg',
    factCount: facts.length,
    facts,
  };

  await fs.mkdir(path.dirname(options.outPath), { recursive: true });
  await fs.writeFile(options.outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    status: 'ok',
    outPath: options.outPath,
    factCount: facts.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
