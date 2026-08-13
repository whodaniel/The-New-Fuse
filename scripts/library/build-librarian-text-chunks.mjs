#!/usr/bin/env node
import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;

function parseArgs(argv) {
  const args = {
    sourceLabel: 'courseforge-manuscript-branches',
    sourceId: '',
    maxChars: 2400,
    overlapChars: 300,
    dryRun: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--source-label' && argv[i + 1]) {
      args.sourceLabel = argv[++i];
    } else if (token === '--source-id' && argv[i + 1]) {
      args.sourceId = argv[++i];
    } else if (token === '--max-chars' && argv[i + 1]) {
      args.maxChars = Number(argv[++i]);
    } else if (token === '--overlap-chars' && argv[i + 1]) {
      args.overlapChars = Number(argv[++i]);
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${token}`);
    }
  }

  if (!Number.isFinite(args.maxChars) || args.maxChars < 200) {
    throw new Error('--max-chars must be a number >= 200');
  }
  if (!Number.isFinite(args.overlapChars) || args.overlapChars < 0) {
    throw new Error('--overlap-chars must be a number >= 0');
  }
  if (args.overlapChars >= args.maxChars) {
    throw new Error('--overlap-chars must be smaller than --max-chars');
  }

  return args;
}

function estimateTokens(text) {
  const words = text.trim() ? text.trim().split(/\s+/g).length : 0;
  return Math.max(1, Math.ceil(words * 1.3));
}

function chooseBreak(text, start, hardEnd, minBreak) {
  const delimiters = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '];
  let best = -1;

  for (const delimiter of delimiters) {
    const idx = text.lastIndexOf(delimiter, hardEnd);
    if (idx >= minBreak && idx > best) {
      best = idx + delimiter.length;
    }
  }

  return best > start ? best : hardEnd;
}

function chunkText(input, maxChars, overlapChars) {
  const text = input.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const chunks = [];
  const len = text.length;
  const minBreakWidth = Math.floor(maxChars * 0.55);
  let start = 0;

  while (start < len) {
    const hardEnd = Math.min(len, start + maxChars);
    let end = hardEnd;

    if (hardEnd < len) {
      const minBreak = start + minBreakWidth;
      end = chooseBreak(text, start, hardEnd, minBreak);
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= len) {
      break;
    }

    let nextStart = end - overlapChars;
    if (nextStart <= start) {
      nextStart = end;
    }
    while (nextStart < len && /\s/.test(text[nextStart])) {
      nextStart += 1;
    }
    start = nextStart;
  }

  return chunks;
}

async function resolveSourceId(client, sourceId, sourceLabel) {
  if (sourceId) return sourceId;

  const result = await client.query(
    `
      SELECT source_id
      FROM librarian.source
      WHERE source_label = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [sourceLabel]
  );

  if (!result.rowCount) {
    throw new Error(`No source found for source_label=${sourceLabel}`);
  }

  return result.rows[0].source_id;
}

async function main() {
  const cfg = parseArgs(process.argv);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in environment');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const startedAt = new Date();
  const ingestionRunId = crypto.randomUUID();

  const summary = {
    ingestionRunId,
    sourceId: '',
    sourceLabel: cfg.sourceLabel,
    dryRun: cfg.dryRun,
    maxChars: cfg.maxChars,
    overlapChars: cfg.overlapChars,
    textRecords: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    chunksCreated: 0
  };

  try {
    summary.sourceId = await resolveSourceId(client, cfg.sourceId, cfg.sourceLabel);

    const texts = await client.query(
      `
        SELECT
          a.artifact_id,
          a.external_ref,
          t.text_id,
          t.full_text
        FROM librarian.artifact a
        JOIN librarian.artifact_text t
          ON t.artifact_id = a.artifact_id
        WHERE a.source_id = $1
        ORDER BY a.external_ref ASC, t.created_at ASC
      `,
      [summary.sourceId]
    );

    summary.textRecords = texts.rowCount;

    await client.query(
      `
        INSERT INTO librarian_ingest.ingestion_run (
          ingestion_run_id,
          run_type,
          source_id,
          started_at,
          status,
          notes,
          created_at
        ) VALUES ($1, 'repair', $2, $3, 'running', $4, $3)
      `,
      [
        ingestionRunId,
        summary.sourceId,
        startedAt.toISOString(),
        cfg.dryRun
          ? 'librarian-text-chunk-build dry-run initialized'
          : 'librarian-text-chunk-build initialized'
      ]
    );

    for (const row of texts.rows) {
      const chunks = chunkText(row.full_text ?? '', cfg.maxChars, cfg.overlapChars);
      const detailBase = `text_id=${row.text_id} external_ref=${row.external_ref}`;

      if (!chunks.length) {
        summary.skipped += 1;
        await client.query(
          `
            INSERT INTO librarian_ingest.ingestion_artifact_result (
              ingestion_run_id,
              artifact_id,
              result_status,
              detail,
              created_at
            ) VALUES ($1, $2, 'skipped', $3, now())
          `,
          [ingestionRunId, row.artifact_id, `${detailBase} reason=empty_text`]
        );
        continue;
      }

      if (cfg.dryRun) {
        summary.created += 1;
        summary.chunksCreated += chunks.length;
        await client.query(
          `
            INSERT INTO librarian_ingest.ingestion_artifact_result (
              ingestion_run_id,
              artifact_id,
              result_status,
              detail,
              created_at
            ) VALUES ($1, $2, 'created', $3, now())
          `,
          [
            ingestionRunId,
            row.artifact_id,
            `${detailBase} dry_run=true chunks=${chunks.length}`
          ]
        );
        continue;
      }

      try {
        await client.query('BEGIN');

        const deleteResult = await client.query(
          `
            DELETE FROM librarian.text_chunk
            WHERE text_id = $1
          `,
          [row.text_id]
        );

        for (let i = 0; i < chunks.length; i += 1) {
          const chunkTextValue = chunks[i];
          await client.query(
            `
              INSERT INTO librarian.text_chunk (
                chunk_id,
                text_id,
                chunk_index,
                chunk_text,
                token_estimate,
                created_at
              ) VALUES ($1, $2, $3, $4, $5, now())
            `,
            [
              crypto.randomUUID(),
              row.text_id,
              i,
              chunkTextValue,
              estimateTokens(chunkTextValue)
            ]
          );
        }

        const resultStatus = deleteResult.rowCount > 0 ? 'updated' : 'created';
        await client.query(
          `
            INSERT INTO librarian_ingest.ingestion_artifact_result (
              ingestion_run_id,
              artifact_id,
              result_status,
              detail,
              created_at
            ) VALUES ($1, $2, $3, $4, now())
          `,
          [
            ingestionRunId,
            row.artifact_id,
            resultStatus,
            `${detailBase} prior_chunks=${deleteResult.rowCount} chunks=${chunks.length}`
          ]
        );

        await client.query('COMMIT');

        if (resultStatus === 'updated') {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
        summary.chunksCreated += chunks.length;
      } catch (error) {
        await client.query('ROLLBACK');
        summary.failed += 1;

        await client.query(
          `
            INSERT INTO librarian_ingest.ingestion_artifact_result (
              ingestion_run_id,
              artifact_id,
              result_status,
              detail,
              created_at
            ) VALUES ($1, $2, 'failed', $3, now())
          `,
          [
            ingestionRunId,
            row.artifact_id,
            `${detailBase} error=${error instanceof Error ? error.message : String(error)}`
          ]
        );
      }
    }

    const endedAt = new Date();
    const runStatus = summary.failed > 0 ? 'warning' : 'success';
    const runNotes = [
      `text_records=${summary.textRecords}`,
      `created=${summary.created}`,
      `updated=${summary.updated}`,
      `skipped=${summary.skipped}`,
      `failed=${summary.failed}`,
      `chunks_created=${summary.chunksCreated}`,
      `dry_run=${cfg.dryRun}`
    ].join('; ');

    await client.query(
      `
        UPDATE librarian_ingest.ingestion_run
        SET ended_at = $2,
            status = $3,
            notes = $4
        WHERE ingestion_run_id = $1
      `,
      [ingestionRunId, endedAt.toISOString(), runStatus, runNotes]
    );

    summary.status = runStatus;
    summary.startedAt = startedAt.toISOString();
    summary.endedAt = endedAt.toISOString();
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`[chunk-build] ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 1;
});

