#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

function parseArgs(argv) {
  const args = {
    archiveDir: path.join(
      process.cwd(),
      'reports',
      'personal-archaeology',
      'findings',
      '_archive'
    ),
    outDir: path.join(process.cwd(), 'reports', 'personal-archaeology', 'findings'),
    includeBody: true,
    timeoutMs: 15000,
    seqList: [],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--archive-dir' && next) {
      args.archiveDir = path.resolve(next);
      i += 1;
      continue;
    }
    if (token === '--out-dir' && next) {
      args.outDir = path.resolve(next);
      i += 1;
      continue;
    }
    if (token === '--no-include-body') {
      args.includeBody = false;
      continue;
    }
    if (token === '--timeout-ms' && next) {
      args.timeoutMs = Number(next);
      i += 1;
      continue;
    }
    if (token === '--seq-list' && next) {
      args.seqList = String(next)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
      i += 1;
    }
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs < 1000) {
    throw new Error('--timeout-ms must be >= 1000');
  }

  return args;
}

function parseJsonFromOutput(rawOutput) {
  const raw = String(rawOutput || '').trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Unable to locate JSON payload in osascript output.');
  }
  return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
}

function runJxa(script, timeoutMs = 15000) {
  const result = spawnSync('osascript', ['-l', 'JavaScript', '-e', script], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
  });

  if (result.error && result.error.code === 'ETIMEDOUT') {
    return { ok: false, timedOut: true, error: 'JXA call timed out' };
  }
  if (result.status !== 0) {
    return {
      ok: false,
      timedOut: false,
      error: (result.stderr || `osascript exited with code ${result.status}`).trim(),
    };
  }

  try {
    const parsed = parseJsonFromOutput(`${result.stdout || ''}\n${result.stderr || ''}`);
    return { ok: true, timedOut: false, data: parsed };
  } catch (error) {
    return { ok: false, timedOut: false, error: error?.message || String(error) };
  }
}

function inferTheme(text) {
  const t = text.toLowerCase();
  if (/(tnf|fuse|agent|workflow|project|mcp|relay|app|build|code)/.test(t)) {
    return 'Business & Projects';
  }
  if (/(piano|music|song|lyric|melody|rhythm|beat|chord|audio)/.test(t)) {
    return 'Creativity';
  }
  if (/(family|mother|father|mom|dad|brother|sister)/.test(t)) {
    return 'Family';
  }
  if (/(love|relationship|dating|partner|wife|husband|cousin|romance)/.test(t)) {
    return 'Relationships';
  }
  if (/(health|sleep|anxiety|depress|stress|mind|lucid|healing|therapy)/.test(t)) {
    return 'Health & Wellness';
  }
  if (/(money|finance|debt|income|budget)/.test(t)) {
    return 'Finance';
  }
  if (/(travel|trip|flight|airport|city|country)/.test(t)) {
    return 'Travel';
  }
  return 'Personal';
}

function containsSensitivePattern(text) {
  const lower = text.toLowerCase();
  const words = String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const looksLikeSeedPhrase =
    words.length >= 12 && words.length <= 30 && words.every((word) => /^[a-z]+$/.test(word));

  return (
    looksLikeSeedPhrase ||
    /(password|passcode|passphrase|private key|secret|seed phrase|api key|auth token|wallet code|otp)/i.test(
      lower
    ) ||
    /\b(wallet|mnemonic)\b/i.test(lower) ||
    /\b(sk|pk|xoxb|ghp|gho|ghu|eyJ)[A-Za-z0-9_\-]{8,}\b/.test(text) ||
    /\b[A-Za-z0-9]{24,}\b/.test(text)
  );
}

function sanitize(text) {
  if (!text) return '';
  if (containsSensitivePattern(text)) {
    return '[REDACTED_SENSITIVE_CONTENT]';
  }
  return text;
}

function noteScript(seq, includeBody) {
  return `
    const Notes = Application('Notes');
    const notes = Notes.notes();
    const seq = ${seq};
    const total = notes.length;
    const sourceIndex = total - seq;

    function toIso(value) {
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        return d.toISOString();
      } catch (e) {
        return '';
      }
    }
    function cleanText(value) {
      return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
    }

    if (sourceIndex < 0 || sourceIndex >= total) {
      console.log(JSON.stringify({
        seq,
        total,
        sourceIndex: sourceIndex + 1,
        status: 'OUT_OF_BOUNDS_CURRENT'
      }));
    } else {
      const n = notes[sourceIndex];
      let title = '';
      let createdAt = '';
      let updatedAt = '';
      let excerpt = '';
      try { title = cleanText(n.name()).slice(0, 240); } catch (e) {}
      try { createdAt = toIso(n.creationDate()); } catch (e) {}
      try { updatedAt = toIso(n.modificationDate()); } catch (e) {}
      if (${includeBody ? 'true' : 'false'}) {
        try { excerpt = cleanText(n.body()).slice(0, 320); } catch (e) {}
      }
      console.log(JSON.stringify({
        seq,
        total,
        sourceIndex: sourceIndex + 1,
        title,
        createdAt,
        updatedAt,
        excerpt,
        status: 'RECOVERED'
      }));
    }
  `;
}

async function collectTimedOutSeqs(archiveDir) {
  const entries = await fs.readdir(archiveDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^apple-notes-oldest-forward-start\d+-size\d+\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const seqSet = new Set();
  for (const file of files) {
    const filePath = path.join(archiveDir, file);
    const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
    for (const row of payload.rows || []) {
      if (row?.skipReason === 'TIMEOUT') {
        seqSet.add(Number(row.seq));
      }
    }
  }

  return Array.from(seqSet)
    .filter((seq) => Number.isFinite(seq) && seq > 0)
    .sort((a, b) => a - b);
}

async function main() {
  const args = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();
  const runId = generatedAt.replace(/[:.]/g, '-');

  const timeoutSeqs = args.seqList.length
    ? Array.from(new Set(args.seqList)).sort((a, b) => a - b)
    : await collectTimedOutSeqs(args.archiveDir);
  if (!timeoutSeqs.length) {
    throw new Error(`No TIMEOUT sequences found in archive: ${args.archiveDir}`);
  }

  const totalProbe = runJxa(`
    const Notes = Application('Notes');
    console.log(JSON.stringify({ totalNotes: Notes.notes().length }));
  `);
  if (!totalProbe.ok) {
    throw new Error(totalProbe.error || 'Failed to read Apple Notes count');
  }
  const totalNotesNow = Number(totalProbe.data.totalNotes || 0);

  const results = [];
  for (const seq of timeoutSeqs) {
    if (seq > totalNotesNow) {
      results.push({
        seq,
        status: 'OUT_OF_BOUNDS_CURRENT',
        reason: `Current total notes is ${totalNotesNow}; seq ${seq} is no longer addressable.`,
      });
      continue;
    }

    const response = runJxa(noteScript(seq, args.includeBody), args.timeoutMs);
    if (!response.ok) {
      results.push({
        seq,
        status: response.timedOut ? 'STILL_TIMEOUT' : 'READ_ERROR',
        reason: response.error || (response.timedOut ? 'Timeout' : 'Read error'),
      });
      continue;
    }

    if (response.data.status === 'OUT_OF_BOUNDS_CURRENT') {
      results.push({
        seq,
        status: 'OUT_OF_BOUNDS_CURRENT',
        reason: `Current total notes is ${response.data.total}.`,
      });
      continue;
    }

    const safeTitle = sanitize(response.data.title || '');
    const safeExcerpt = sanitize(response.data.excerpt || '');
    const theme = inferTheme(`${safeTitle} ${safeExcerpt}`);
    results.push({
      seq,
      status: 'RECOVERED',
      totalNotes: response.data.total,
      sourceIndex: response.data.sourceIndex,
      title: safeTitle,
      createdAt: response.data.createdAt || '',
      updatedAt: response.data.updatedAt || '',
      excerpt: safeExcerpt,
      theme,
    });
  }

  const summary = results.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    },
    { RECOVERED: 0, STILL_TIMEOUT: 0, READ_ERROR: 0, OUT_OF_BOUNDS_CURRENT: 0 }
  );

  await fs.mkdir(args.outDir, { recursive: true });
  const base = `apple-notes-timeout-backfill-${runId}`;
  const jsonPath = path.join(args.outDir, `${base}.json`);
  const mdPath = path.join(args.outDir, `${base}.md`);

  const jsonPayload = {
    generatedAt,
    archiveDir: args.archiveDir,
    totalTimedOutSeqs: timeoutSeqs.length,
    timeoutMs: args.timeoutMs,
    totalNotesNow,
    summary,
    results,
  };
  await fs.writeFile(jsonPath, `${JSON.stringify(jsonPayload, null, 2)}\n`, 'utf8');

  const lines = [];
  lines.push('# Apple Notes Timeout Backfill Report');
  lines.push('');
  lines.push(`- Generated: ${generatedAt}`);
  lines.push(`- Archive source: ${args.archiveDir}`);
  lines.push(`- Timeout sequences attempted: ${timeoutSeqs.length}`);
  lines.push(`- Per-sequence timeout: ${args.timeoutMs}ms`);
  lines.push(`- Current Apple Notes total: ${totalNotesNow}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Recovered: ${summary.RECOVERED || 0}`);
  lines.push(`- Still timeout: ${summary.STILL_TIMEOUT || 0}`);
  lines.push(`- Read error: ${summary.READ_ERROR || 0}`);
  lines.push(`- Out of bounds (current notes state): ${summary.OUT_OF_BOUNDS_CURRENT || 0}`);
  lines.push('');
  lines.push('## Recovered Sequences');
  const recovered = results.filter((row) => row.status === 'RECOVERED');
  if (!recovered.length) {
    lines.push('- None');
  } else {
    for (const row of recovered) {
      lines.push(
        `- seq ${row.seq}: ${row.createdAt || row.updatedAt || 'Unknown date'} | ${row.theme} | ${row.title || 'Untitled'}`
      );
    }
  }
  lines.push('');
  lines.push('## Unresolved Sequences');
  const unresolved = results.filter((row) => row.status !== 'RECOVERED');
  if (!unresolved.length) {
    lines.push('- None');
  } else {
    for (const row of unresolved) {
      lines.push(`- seq ${row.seq}: ${row.status}${row.reason ? ` (${row.reason})` : ''}`);
    }
  }
  lines.push('');

  await fs.writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        jsonPath,
        mdPath,
        totalTimedOutSeqs: timeoutSeqs.length,
        totalNotesNow,
        summary,
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
