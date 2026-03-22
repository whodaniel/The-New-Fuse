#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

function parseArgs(argv) {
  const args = {
    startSeq: 1,
    batchSize: 50,
    outDir: path.join(process.cwd(), 'reports', 'personal-archaeology', 'findings'),
    prefix: 'apple-notes-oldest-forward',
    includeBody: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--start-seq' && next) {
      args.startSeq = Number(next);
      i += 1;
    } else if (token === '--batch-size' && next) {
      args.batchSize = Number(next);
      i += 1;
    } else if (token === '--out-dir' && next) {
      args.outDir = path.resolve(next);
      i += 1;
    } else if (token === '--prefix' && next) {
      args.prefix = String(next);
      i += 1;
    } else if (token === '--include-body') {
      args.includeBody = true;
    }
  }

  if (!Number.isFinite(args.startSeq) || args.startSeq < 1) {
    throw new Error('--start-seq must be >= 1');
  }
  if (!Number.isFinite(args.batchSize) || args.batchSize < 1) {
    throw new Error('--batch-size must be >= 1');
  }
  return args;
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

function sanitizeNarrativeText(text) {
  if (!text) return '';
  if (containsSensitivePattern(text)) {
    return '[REDACTED_SENSITIVE_CONTENT]';
  }
  return text;
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
      error: (result.stderr || `osascript exited with code ${result.status}`).trim(),
    };
  }

  try {
    const parsed = parseJsonFromOutput(`${result.stdout || ''}\n${result.stderr || ''}`);
    return { ok: true, data: parsed };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}

function inferNarrativeLine(title, excerpt) {
  const text = `${title} ${excerpt}`.trim();
  const theme = inferTheme(text);

  if (theme === 'Business & Projects') {
    return 'Work/build direction signal with concrete execution language.';
  }
  if (theme === 'Creativity') {
    return 'Creative exploration signal, likely tied to artistic processing.';
  }
  if (theme === 'Relationships') {
    return 'Relational/interpersonal signal with emotionally charged framing.';
  }
  if (theme === 'Health & Wellness') {
    return 'Mental/emotional state tracking signal; useful for resilience timeline.';
  }
  if (theme === 'Finance') {
    return 'Resource and stability signal tied to financial reality.';
  }
  if (theme === 'Travel') {
    return 'Location/movement signal indicating environment shift.';
  }
  if (theme === 'Family') {
    return 'Family-system signal relevant to identity and support structures.';
  }
  return 'Personal reflection signal; context likely clarified by neighboring notes.';
}

async function main() {
  const args = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();
  const batchTag = `start${args.startSeq}-size${args.batchSize}`;

  const totalProbe = runJxa(`
    const Notes = Application('Notes');
    console.log(JSON.stringify({ totalNotes: Notes.notes().length }));
  `);
  if (!totalProbe.ok) {
    throw new Error(totalProbe.error || 'Failed to read Apple Notes count');
  }

  const totalNotes = Number(totalProbe.data.totalNotes || 0);
  const endSeq = Math.min(totalNotes, args.startSeq + args.batchSize - 1);
  const rows = [];

  for (let seq = args.startSeq; seq <= endSeq; seq += 1) {
    const perNoteResult = runJxa(
      `
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
          sourceIndex: sourceIndex + 1,
          title: '',
          createdAt: '',
          updatedAt: '',
          excerpt: '',
          skipped: true,
          skipReason: 'OUT_OF_BOUNDS'
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
        if (${args.includeBody ? 'true' : 'false'}) {
          try { excerpt = cleanText(n.body()).slice(0, 320); } catch (e) {}
        }
        console.log(JSON.stringify({
          seq,
          sourceIndex: sourceIndex + 1,
          title,
          createdAt,
          updatedAt,
          excerpt
        }));
      }
    `,
      args.includeBody ? 10000 : 7000
    );

    if (!perNoteResult.ok) {
      rows.push({
        seq,
        sourceIndex: totalNotes - seq + 1,
        title: '[SKIPPED_UNREADABLE_NOTE]',
        createdAt: '',
        updatedAt: '',
        excerpt: '',
        skipped: true,
        skipReason: perNoteResult.timedOut ? 'TIMEOUT' : 'READ_ERROR',
      });
      continue;
    }

    rows.push(perNoteResult.data);
  }

  const parsed = {
    generatedAt: new Date().toISOString(),
    totalNotes,
    order: 'oldest_to_newest',
    startSeq: args.startSeq,
    endSeq,
    batchSize: args.batchSize,
    rows,
  };

  const enriched = parsed.rows.map((row) => {
    const safeTitle = sanitizeNarrativeText(row.title);
    const safeExcerpt = sanitizeNarrativeText(row.excerpt);
    const theme = inferTheme(`${safeTitle} ${safeExcerpt}`);
    const narrative = inferNarrativeLine(safeTitle, safeExcerpt);
    return { ...row, title: safeTitle, excerpt: safeExcerpt, theme, narrative };
  });

  const themeCounts = enriched.reduce((acc, row) => {
    acc[row.theme] = (acc[row.theme] || 0) + 1;
    return acc;
  }, {});

  await fs.mkdir(args.outDir, { recursive: true });
  const jsonPath = path.join(args.outDir, `${args.prefix}-${batchTag}.json`);
  const mdPath = path.join(args.outDir, `${args.prefix}-${batchTag}.md`);

  const jsonPayload = {
    generatedAt,
    totalNotes: parsed.totalNotes,
    startSeq: parsed.startSeq,
    endSeq: parsed.endSeq,
    batchSize: parsed.batchSize,
    order: parsed.order,
    themeCounts,
    rows: enriched,
  };
  await fs.writeFile(jsonPath, `${JSON.stringify(jsonPayload, null, 2)}\n`, 'utf8');

  const lines = [];
  lines.push(`# Apple Notes Sequential Narrative Outline (${batchTag})`);
  lines.push('');
  lines.push(`- Generated: ${generatedAt}`);
  lines.push(`- Total Notes: ${parsed.totalNotes}`);
  lines.push(`- Sequence Window: ${parsed.startSeq}..${parsed.endSeq} (oldest -> newest)`);
  lines.push(`- Batch Size: ${parsed.batchSize}`);
  lines.push('');
  lines.push('## Theme Distribution');
  Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([theme, count]) => {
      lines.push(`- ${theme}: ${count}`);
    });
  lines.push('');
  lines.push('## Sequential Outline');
  for (const row of enriched) {
    lines.push('');
    lines.push(`### ${row.seq}. ${row.createdAt || row.updatedAt || 'Unknown date'} — ${row.title || 'Untitled'}`);
    lines.push(`- Source index: ${row.sourceIndex}`);
    lines.push(`- Theme: ${row.theme}`);
    lines.push(`- Narrative signal: ${row.narrative}`);
    if (row.excerpt) {
      lines.push(`- Excerpt: ${row.excerpt}`);
    }
  }
  lines.push('');
  if (parsed.endSeq < parsed.totalNotes) {
    lines.push(`## Next Batch`);
    lines.push(`- Continue with: \`--start-seq ${parsed.endSeq + 1} --batch-size ${parsed.batchSize}\``);
  } else {
    lines.push('## Next Batch');
    lines.push('- Complete: no remaining notes.');
  }
  lines.push('');

  await fs.writeFile(mdPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({ ok: true, jsonPath, mdPath, totalNotes: parsed.totalNotes, startSeq: parsed.startSeq, endSeq: parsed.endSeq }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
