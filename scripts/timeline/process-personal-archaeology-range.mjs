#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

function parseArgs(argv) {
  const args = {
    startSeq: 951,
    batchSize: 50,
    userId: '',
    pointStep: 8,
    outDir: path.join(process.cwd(), 'reports', 'personal-archaeology', 'findings'),
    extractScript: path.join(process.cwd(), 'scripts', 'timeline', 'extract-apple-notes-oldest-forward-batch.mjs'),
    importScript: path.join(process.cwd(), 'scripts', 'timeline', 'import-timeline-draft-to-ledger.mjs'),
    ledgerPath: path.join(process.cwd(), 'apps', 'api', 'data', 'unified-task-ledger.json'),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--start-seq' && next) {
      args.startSeq = Number(next);
      i += 1;
      continue;
    }
    if (token === '--batch-size' && next) {
      args.batchSize = Number(next);
      i += 1;
      continue;
    }
    if (token === '--user-id' && next) {
      args.userId = String(next);
      i += 1;
      continue;
    }
    if (token === '--point-step' && next) {
      args.pointStep = Number(next);
      i += 1;
      continue;
    }
    if (token === '--out-dir' && next) {
      args.outDir = path.resolve(next);
      i += 1;
      continue;
    }
  }

  if (!Number.isFinite(args.startSeq) || args.startSeq < 1) {
    throw new Error('--start-seq must be >= 1');
  }
  if (!Number.isFinite(args.batchSize) || args.batchSize < 1) {
    throw new Error('--batch-size must be >= 1');
  }
  if (!Number.isFinite(args.pointStep) || args.pointStep < 1) {
    throw new Error('--point-step must be >= 1');
  }
  if (!args.userId) {
    throw new Error('--user-id is required');
  }

  return args;
}

function parseJsonFromOutput(rawOutput) {
  const raw = String(rawOutput || '').trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Unable to locate JSON payload in command output.');
  }
  return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
}

function runCmd(cmd, argv, options = {}) {
  const result = spawnSync(cmd, argv, {
    encoding: 'utf8',
    maxBuffer: 25 * 1024 * 1024,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `Command failed: ${cmd}`).trim());
  }
  return result.stdout || '';
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runCmdWithRetry(cmd, argv, options = {}) {
  const retries = Number.isFinite(options.retries) ? options.retries : 3;
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? options.retryDelayMs : 1500;
  const retryablePattern = options.retryablePattern || /JXA call timed out|ETIMEDOUT|timeout/i;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return runCmd(cmd, argv, options);
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      if (attempt >= retries || !retryablePattern.test(message)) {
        throw error;
      }
      sleepMs(retryDelayMs * attempt);
    }
  }

  throw lastError || new Error('Unknown retry failure');
}

function getTotalNotes() {
  const result = spawnSync(
    'osascript',
    [
      '-l',
      'JavaScript',
      '-e',
      "const Notes = Application('Notes'); console.log(JSON.stringify({ totalNotes: Notes.notes().length }));",
    ],
    {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }
  );
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'Failed to read Apple Notes total').trim());
  }
  const parsed = parseJsonFromOutput(`${result.stdout || ''}\n${result.stderr || ''}`);
  return Number(parsed.totalNotes || 0);
}

function containsSensitiveKeyword(text) {
  return /(password|passcode|passphrase|private key|seed phrase|api key|auth token|wallet code|otp)/i.test(text);
}

function getDateRange(rows, startSeq, endSeq) {
  const dates = rows
    .filter((row) => row.seq >= startSeq && row.seq <= endSeq && row.createdAt)
    .map((row) => row.createdAt)
    .sort();
  return {
    start: dates[0] || 'Unknown',
    end: dates[dates.length - 1] || 'Unknown',
  };
}

function getThemeCounts(rows, startSeq, endSeq) {
  const counts = {};
  for (const row of rows) {
    if (row.seq < startSeq || row.seq > endSeq) continue;
    const theme = row.theme || 'Unknown';
    counts[theme] = (counts[theme] || 0) + 1;
  }
  return counts;
}

function formatDominantThemes(themeCounts) {
  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => `${theme} (${count})`);
}

function pickCategory(themeCounts) {
  const top = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : 'Personal';
}

async function readLedgerState(ledgerPath, userId) {
  let ledger = { timelineEvents: [] };
  try {
    ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8'));
  } catch {
    ledger = { timelineEvents: [] };
  }

  const events = Array.isArray(ledger.timelineEvents) ? ledger.timelineEvents : [];
  const userEvents = events.filter((event) => event.userId === userId);
  let maxPoint = 0;
  let maxSegment = 0;

  for (const event of userEvents) {
    const point = Number(event?.payload?.point || 0);
    if (Number.isFinite(point) && point > maxPoint) {
      maxPoint = point;
    }
    const title = String(event?.payload?.title || '');
    const match = title.match(/Life Segment\s+(\d+)/i);
    if (match) {
      const num = Number(match[1]);
      if (Number.isFinite(num) && num > maxSegment) {
        maxSegment = num;
      }
    }
  }

  return { maxPoint, maxSegment };
}

async function main() {
  const args = parseArgs(process.argv);
  await fs.mkdir(args.outDir, { recursive: true });

  const totalNotes = getTotalNotes();
  if (args.startSeq > totalNotes) {
    throw new Error(`startSeq ${args.startSeq} is beyond current total notes ${totalNotes}`);
  }

  const ledgerState = await readLedgerState(args.ledgerPath, args.userId);
  let pointCursor = ledgerState.maxPoint;
  let segmentCursor = ledgerState.maxSegment;

  const runSummary = [];

  for (let startSeq = args.startSeq; startSeq <= totalNotes; startSeq += args.batchSize) {
    const extractOut = runCmdWithRetry(
      'node',
      [
        args.extractScript,
        '--start-seq',
        String(startSeq),
        '--batch-size',
        String(args.batchSize),
        '--include-body',
        '--out-dir',
        args.outDir,
      ],
      { cwd: process.cwd(), retries: 4, retryDelayMs: 2000 }
    );
    const extractMeta = parseJsonFromOutput(extractOut);

    const batchJson = JSON.parse(await fs.readFile(extractMeta.jsonPath, 'utf8'));
    const rows = Array.isArray(batchJson.rows) ? batchJson.rows : [];
    const endSeq = Number(batchJson.endSeq || startSeq);
    const skippedSeqs = rows.filter((row) => row.skipReason).map((row) => row.seq);
    const redactedSeqs = rows
      .filter(
        (row) =>
          String(row.title || '').includes('[REDACTED_SENSITIVE_CONTENT]') ||
          String(row.excerpt || '').includes('[REDACTED_SENSITIVE_CONTENT]')
      )
      .map((row) => row.seq);

    const riskyUnredacted = rows
      .filter((row) => {
        const text = `${row.title || ''} ${row.excerpt || ''}`;
        return containsSensitiveKeyword(text) && !text.includes('[REDACTED_SENSITIVE_CONTENT]');
      })
      .map((row) => row.seq);

    const segAStart = startSeq;
    const segAEnd = Math.min(startSeq + 24, endSeq);
    const segBStart = segAEnd + 1;
    const hasSegB = segBStart <= endSeq;
    const segBEnd = endSeq;

    const segAThemes = getThemeCounts(rows, segAStart, segAEnd);
    const segAThemesFmt = formatDominantThemes(segAThemes);
    const segADateRange = getDateRange(rows, segAStart, segAEnd);
    const segACategory = pickCategory(segAThemes);

    const segments = [
      {
        start: segAStart,
        end: segAEnd,
        themes: segAThemesFmt,
        category: segACategory,
        dateRange: segADateRange,
      },
    ];

    if (hasSegB) {
      const segBThemes = getThemeCounts(rows, segBStart, segBEnd);
      const segBThemesFmt = formatDominantThemes(segBThemes);
      const segBDateRange = getDateRange(rows, segBStart, segBEnd);
      const segBCategory = pickCategory(segBThemes);
      segments.push({
        start: segBStart,
        end: segBEnd,
        themes: segBThemesFmt,
        category: segBCategory,
        dateRange: segBDateRange,
      });
    }

    const findingsPath = path.join(args.outDir, `personal-archaeology-findings-start${startSeq}-${endSeq}.md`);
    const outlinePath = path.join(args.outDir, `daniel-notes-narrative-outline-start${startSeq}-${endSeq}.md`);
    const draftPath = path.join(args.outDir, `timeline-events-draft-start${startSeq}-${endSeq}.json`);

    const findingsLines = [];
    findingsLines.push(`# Personal Archaeology Findings (Records ${startSeq}-${endSeq})`);
    findingsLines.push('');
    findingsLines.push(`- Generated: ${new Date().toISOString()}`);
    findingsLines.push(`- Scope: Apple Notes oldest-forward sequence ${startSeq}..${endSeq}`);
    findingsLines.push(
      '- Redaction policy: Full redaction active (sensitive patterns replaced with `[REDACTED_SENSITIVE_CONTENT]`)'
    );
    findingsLines.push('');
    findingsLines.push('## Findings Summary');
    findingsLines.push(`- Total records analyzed: ${rows.length}`);
    findingsLines.push(`- Total notes visible in source environment: ${batchJson.totalNotes}`);
    findingsLines.push('- Theme distribution:');
    for (const [theme, count] of Object.entries(batchJson.themeCounts || {}).sort((a, b) => b[1] - a[1])) {
      findingsLines.push(`  - ${theme}: ${count}`);
    }
    findingsLines.push(`- Timeout skips: ${skippedSeqs.length}${skippedSeqs.length ? ` (seq ${skippedSeqs.join(', ')})` : ''}`);
    findingsLines.push(`- Redaction hits: ${redactedSeqs.length}${redactedSeqs.length ? ` (seq ${redactedSeqs.join(', ')})` : ''}`);
    findingsLines.push(
      `- Post-check for unredacted sensitive keywords: ${riskyUnredacted.length ? `flagged seq ${riskyUnredacted.join(', ')}` : 'none detected'}`
    );
    findingsLines.push('');
    findingsLines.push('## Segment-Level Findings');
    segments.forEach((seg, idx) => {
      findingsLines.push(`### Segment ${segmentCursor + idx + 1} (${seg.start}-${seg.end})`);
      findingsLines.push(`- Date window: ${seg.dateRange.start} -> ${seg.dateRange.end}`);
      findingsLines.push(`- Dominant themes: ${seg.themes.join(', ') || 'Unknown'}`);
      findingsLines.push('');
    });
    findingsLines.push('## Source Artifacts');
    findingsLines.push(`- ${path.relative(process.cwd(), extractMeta.jsonPath)}`);
    findingsLines.push(`- ${path.relative(process.cwd(), extractMeta.mdPath)}`);
    findingsLines.push('');
    await fs.writeFile(findingsPath, `${findingsLines.join('\n')}\n`, 'utf8');

    const outlineLines = [];
    outlineLines.push(`# Daniel Who Timeline Narrative Outline (Notes ${startSeq}-${endSeq})`);
    outlineLines.push('');
    outlineLines.push(`- Generated: ${new Date().toISOString()}`);
    outlineLines.push(`- Scope: Apple Notes sequences ${startSeq}..${endSeq} (oldest -> newest).`);
    outlineLines.push('- Security handling: sensitive-looking content is redacted.');
    outlineLines.push(
      `- Skipped notes due to timeout/read errors: ${skippedSeqs.length ? skippedSeqs.join(', ') : 'none'}`
    );
    outlineLines.push(`- Redacted notes: ${redactedSeqs.length ? redactedSeqs.join(', ') : 'none'}`);
    outlineLines.push(`- Source batch: ${path.relative(process.cwd(), extractMeta.jsonPath)}`);
    outlineLines.push('');
    outlineLines.push('## Sequential Segments');
    segments.forEach((seg, idx) => {
      outlineLines.push(`### Segment ${segmentCursor + idx + 1}: Notes ${seg.start}-${seg.end}`);
      outlineLines.push(`- Date window: ${seg.dateRange.start} -> ${seg.dateRange.end}`);
      outlineLines.push(`- Dominant themes: ${seg.themes.join(', ') || 'Unknown'}`);
      outlineLines.push(`- Candidate category lane: ${seg.category}`);
      outlineLines.push(`- Source: Apple Notes seq ${seg.start}-${seg.end}`);
      outlineLines.push('');
    });
    await fs.writeFile(outlinePath, `${outlineLines.join('\n')}\n`, 'utf8');

    const events = [];
    for (const seg of segments) {
      segmentCursor += 1;
      pointCursor += args.pointStep;
      const segRedacted = redactedSeqs.filter((seq) => seq >= seg.start && seq <= seg.end);
      const segSkipped = skippedSeqs.filter((seq) => seq >= seg.start && seq <= seg.end);
      events.push({
        title: `Life Segment ${segmentCursor} (Notes ${seg.start}-${seg.end})`,
        description: `Chronological segment reconstructed from Apple Notes oldest-forward scan (${seg.start}-${seg.end}).`,
        timestamp: seg.dateRange.start === 'Unknown' ? new Date().toISOString() : seg.dateRange.start,
        point: pointCursor,
        category: seg.category,
        segment: seg.category,
        source: 'apple-notes-chronology',
        evidenceRefs: [
          `apple-notes:seq:${seg.start}-${seg.end}`,
          path.relative(process.cwd(), extractMeta.jsonPath),
        ],
        sources: [
          `Apple Notes sequence window ${seg.start}-${seg.end}`,
          `Redacted extraction batch (start${startSeq} size${args.batchSize})`,
        ],
        metadata: {
          startSeq: seg.start,
          endSeq: seg.end,
          dominantThemes: seg.themes,
          redactedSeqs: segRedacted,
          skippedSeqs: segSkipped,
        },
      });
    }

    const draftPayload = {
      generatedAt: new Date().toISOString(),
      scope: `Apple Notes oldest-forward, seq ${startSeq}..${endSeq}`,
      privacy: 'Sensitive content redacted; references only',
      events,
    };
    await fs.writeFile(draftPath, `${JSON.stringify(draftPayload, null, 2)}\n`, 'utf8');

    const importOut = runCmd(
      'node',
      [args.importScript, '--input', draftPath, '--user-id', args.userId],
      { cwd: process.cwd() }
    );
    const importMeta = parseJsonFromOutput(importOut);

    runSummary.push({
      startSeq,
      endSeq,
      created: importMeta.created,
      findingsPath: path.relative(process.cwd(), findingsPath),
      draftPath: path.relative(process.cwd(), draftPath),
      skipped: skippedSeqs.length,
      redacted: redactedSeqs.length,
    });

    if (endSeq >= totalNotes) break;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        processedBatches: runSummary.length,
        startSeq: args.startSeq,
        totalNotes,
        userId: args.userId,
        summary: runSummary,
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
