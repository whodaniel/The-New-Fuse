#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

const { Client } = pg;

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const defaultInventory = path.join(repoRoot, 'data/protocols/courseforge-manuscript-inventory.2026-05-05.json');
const defaultRepoMirror = path.join(repoRoot, '.fuse/external/courseforge');

function parseArgs(argv) {
  const args = {
    inventory: defaultInventory,
    repoMirror: defaultRepoMirror,
    includeNonMarkdown: false,
    dryRun: false,
    sourceLabel: 'courseforge-manuscript-branches',
    sourceFamily: 'git_repository',
    extractorVersion: 'courseforge_git_markdown_v1',
    ownerPrincipalId: 'daniel'
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--inventory' && argv[i + 1]) {
      args.inventory = path.resolve(argv[++i]);
    } else if (token === '--repo-mirror' && argv[i + 1]) {
      args.repoMirror = path.resolve(argv[++i]);
    } else if (token === '--include-non-markdown') {
      args.includeNonMarkdown = true;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--source-label' && argv[i + 1]) {
      args.sourceLabel = argv[++i];
    } else if (token === '--extractor-version' && argv[i + 1]) {
      args.extractorVersion = argv[++i];
    } else if (token === '--owner' && argv[i + 1]) {
      args.ownerPrincipalId = argv[++i];
    } else {
      throw new Error(`Unknown or incomplete argument: ${token}`);
    }
  }

  return args;
}

function assertFile(p, label) {
  if (!fs.existsSync(p)) {
    throw new Error(`${label} not found: ${p}`);
  }
}

function gitShow(repoMirror, refPath) {
  return execFileSync('git', ['-c', 'gc.auto=0', 'show', refPath], {
    cwd: repoMirror,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
}

function gitHeadCommitTimestamp(repoMirror, branch) {
  return execFileSync('git', ['-c', 'gc.auto=0', 'show', '-s', '--format=%cI', `origin/${branch}`], {
    cwd: repoMirror,
    encoding: 'utf8'
  }).trim();
}

function toTokenEstimate(text) {
  // Cheap deterministic estimate compatible with existing archive style.
  const words = text.trim() ? text.trim().split(/\s+/g).length : 0;
  return Math.max(1, Math.ceil(words * 1.3));
}

function isMarkdownFile(filePath) {
  return filePath.toLowerCase().endsWith('.md');
}

function inferTitle(filePath, content) {
  const h1 = content
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));

  if (h1) {
    return h1.replace(/^#\s+/, '').trim().slice(0, 500);
  }

  const base = path.basename(filePath).replace(/\.[^.]+$/, '');
  return base.replace(/[-_]+/g, ' ').trim().slice(0, 500);
}

async function ensureSource(client, cfg) {
  const existing = await client.query(
    `
      SELECT source_id
      FROM librarian.source
      WHERE source_family = $1
        AND source_label = $2
        AND owner_principal_id = $3
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [cfg.sourceFamily, cfg.sourceLabel, cfg.ownerPrincipalId]
  );

  if (existing.rowCount && existing.rows[0]?.source_id) {
    return { sourceId: existing.rows[0].source_id, created: false };
  }

  const sourceId = crypto.randomUUID();
  await client.query(
    `
      INSERT INTO librarian.source (
        source_id,
        source_family,
        source_label,
        owner_principal_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, now(), now())
    `,
    [sourceId, cfg.sourceFamily, cfg.sourceLabel, cfg.ownerPrincipalId]
  );

  return { sourceId, created: true };
}

async function main() {
  const cfg = parseArgs(process.argv);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in environment.');
  }

  assertFile(cfg.inventory, 'Inventory');
  assertFile(path.join(cfg.repoMirror, '.git'), 'Courseforge mirror git dir');

  const inventory = JSON.parse(fs.readFileSync(cfg.inventory, 'utf8'));
  if (!Array.isArray(inventory.branches) || inventory.branches.length === 0) {
    throw new Error('Inventory branches array is empty.');
  }

  const branchCapturedAt = new Map();
  for (const branch of inventory.branches) {
    branchCapturedAt.set(branch.branch, gitHeadCommitTimestamp(cfg.repoMirror, branch.branch));
  }

  const allEntries = [];
  for (const branch of inventory.branches) {
    for (const file of branch.files ?? []) {
      allEntries.push({
        laneId: branch.lane_id,
        branch: branch.branch,
        branchHead: branch.head_commit,
        path: file.path,
        blobSha: file.blob_sha,
        type: file.type
      });
    }
  }

  const fileEntries = cfg.includeNonMarkdown
    ? allEntries
    : allEntries.filter((f) => isMarkdownFile(f.path));

  const duplicatesByExternalRef = new Map();
  for (const entry of fileEntries) {
    const key = `${entry.branch}::${entry.path}`;
    if (duplicatesByExternalRef.has(key)) {
      throw new Error(`Duplicate branch/path in inventory: ${key}`);
    }
    duplicatesByExternalRef.set(key, true);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const counters = {
    totalCandidates: fileEntries.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    duplicateShaSkips: 0,
    nonMarkdownSkipped: allEntries.length - fileEntries.length
  };

  const startedAt = new Date();
  const ingestionRunId = crypto.randomUUID();

  try {
    await client.query('BEGIN');

    const { sourceId, created: sourceCreated } = await ensureSource(client, cfg);

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
        ) VALUES ($1, 'incremental', $2, $3, 'running', $4, $3)
      `,
      [
        ingestionRunId,
        sourceId,
        startedAt.toISOString(),
        cfg.dryRun
          ? 'courseforge-manuscript-ingest dry-run initialized'
          : 'courseforge-manuscript-ingest initialized'
      ]
    );

    for (const entry of fileEntries) {
      const externalRef = `courseforge|branch:${entry.branch}|path:${entry.path}|blob:${entry.blobSha}`;
      const gitRefPath = `origin/${entry.branch}:${entry.path}`;

      try {
        const content = gitShow(cfg.repoMirror, gitRefPath);
        const contentBuffer = Buffer.from(content, 'utf8');
        const sha256 = crypto.createHash('sha256').update(contentBuffer).digest('hex');
        const byteSize = contentBuffer.length;
        const tokenEstimate = toTokenEstimate(content);
        const title = inferTitle(entry.path, content);
        const capturedAt = branchCapturedAt.get(entry.branch) ?? startedAt.toISOString();

        const existingBySha = await client.query(
          `
            SELECT artifact_id, source_id, external_ref
            FROM librarian.artifact
            WHERE sha256 = $1
            LIMIT 1
          `,
          [sha256]
        );

        if (
          existingBySha.rowCount > 0 &&
          !(existingBySha.rows[0].source_id === sourceId && existingBySha.rows[0].external_ref === externalRef)
        ) {
          counters.skipped += 1;
          counters.duplicateShaSkips += 1;

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
            [
              ingestionRunId,
              existingBySha.rows[0].artifact_id,
              `duplicate_sha_conflict external_ref=${externalRef} existing_ref=${existingBySha.rows[0].external_ref}`
            ]
          );
          continue;
        }

        if (cfg.dryRun) {
          counters.skipped += 1;
          await client.query(
            `
              INSERT INTO librarian_ingest.ingestion_artifact_result (
                ingestion_run_id,
                artifact_id,
                result_status,
                detail,
                created_at
              ) VALUES ($1, NULL, 'skipped', $2, now())
            `,
            [ingestionRunId, `dry_run external_ref=${externalRef}`]
          );
          continue;
        }

        const existingByExternalRef = await client.query(
          `
            SELECT artifact_id
            FROM librarian.artifact
            WHERE source_id = $1
              AND external_ref = $2
            LIMIT 1
          `,
          [sourceId, externalRef]
        );

        const artifactId = existingByExternalRef.rowCount > 0
          ? existingByExternalRef.rows[0].artifact_id
          : crypto.randomUUID();

        const status = existingByExternalRef.rowCount > 0 ? 'updated' : 'created';

        await client.query(
          `
            INSERT INTO librarian.artifact (
              artifact_id,
              source_id,
              external_ref,
              artifact_type,
              title,
              mime_type,
              byte_size,
              sha256,
              captured_at,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3,
              'markdown',
              $4,
              'text/markdown',
              $5,
              $6,
              $7,
              now(),
              now()
            )
            ON CONFLICT (source_id, external_ref)
            DO UPDATE SET
              artifact_type = EXCLUDED.artifact_type,
              title = EXCLUDED.title,
              mime_type = EXCLUDED.mime_type,
              byte_size = EXCLUDED.byte_size,
              sha256 = EXCLUDED.sha256,
              captured_at = EXCLUDED.captured_at,
              updated_at = now()
          `,
          [artifactId, sourceId, externalRef, title, byteSize, sha256, capturedAt]
        );

        await client.query('DELETE FROM librarian.artifact_text WHERE artifact_id = $1', [artifactId]);

        const textId = crypto.randomUUID();
        await client.query(
          `
            INSERT INTO librarian.artifact_text (
              text_id,
              artifact_id,
              extractor_version,
              language_code,
              full_text,
              token_estimate,
              redaction_level,
              created_at
            ) VALUES (
              $1,
              $2,
              $3,
              'en',
              $4,
              $5,
              'none',
              now()
            )
          `,
          [textId, artifactId, cfg.extractorVersion, content, tokenEstimate]
        );

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
            artifactId,
            status,
            `branch=${entry.branch}; path=${entry.path}; lane=${entry.laneId}; blob=${entry.blobSha}`
          ]
        );

        if (status === 'created') {
          counters.created += 1;
        } else {
          counters.updated += 1;
        }
      } catch (error) {
        counters.failed += 1;
        const detail = `error branch=${entry.branch}; path=${entry.path}; message=${(error instanceof Error ? error.message : String(error)).slice(0, 1500)}`;
        await client.query(
          `
            INSERT INTO librarian_ingest.ingestion_artifact_result (
              ingestion_run_id,
              artifact_id,
              result_status,
              detail,
              created_at
            ) VALUES ($1, NULL, 'failed', $2, now())
          `,
          [ingestionRunId, detail]
        );
      }
    }

    const endedAt = new Date();
    const status = counters.failed > 0 || counters.skipped > 0 ? 'warning' : 'success';
    const notes = [
      'courseforge-manuscript-ingest completed',
      `source_created=${String(sourceCreated)}`,
      `created=${counters.created}`,
      `updated=${counters.updated}`,
      `skipped=${counters.skipped}`,
      `failed=${counters.failed}`,
      `duplicate_sha_skips=${counters.duplicateShaSkips}`,
      `non_markdown_skipped=${counters.nonMarkdownSkipped}`,
      `dry_run=${String(cfg.dryRun)}`
    ].join('; ');

    await client.query(
      `
        UPDATE librarian_ingest.ingestion_run
        SET
          ended_at = $2,
          status = $3,
          notes = $4
        WHERE ingestion_run_id = $1
      `,
      [ingestionRunId, endedAt.toISOString(), status, notes]
    );

    await client.query('COMMIT');

    const summary = {
      ingestionRunId,
      sourceLabel: cfg.sourceLabel,
      sourceFamily: cfg.sourceFamily,
      counters,
      status,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      dryRun: cfg.dryRun
    };

    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`[courseforge-ingest] ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
