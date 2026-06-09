#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Redis = require('ioredis');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'impetus');
const INBOX_KEY = process.env.TNF_IMPETUS_INBOX_KEY || 'tnf:impetus:inbox';
const PROCESSED_HASH = process.env.TNF_IMPETUS_PROCESSED_HASH || 'tnf:impetus:processed';
const ARTIFACT_INDEX = process.env.TNF_IMPETUS_ARTIFACT_INDEX || 'tnf:impetus:artifacts:index';
const PLANNING_QUEUE = process.env.TNF_IMPETUS_PLANNING_QUEUE || 'tnf:master:tasks:planning';
const STATUS_KEY = process.env.TNF_IMPETUS_STATUS_KEY || 'tnf:impetus:status';
const INTERVAL_MS = Number.parseInt(process.env.TNF_IMPETUS_INTERVAL_MS || '60000', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TENANT_ID = process.env.TNF_TENANT_ID || 'tnf-prod';

function usage() {
  console.log(`TNF Impetus Loop

Usage:
  node scripts/orchestrator/impetus-loop.cjs capture --question "..." --answer "..." [--source chat]
  node scripts/orchestrator/impetus-loop.cjs once
  node scripts/orchestrator/impetus-loop.cjs loop
  node scripts/orchestrator/impetus-loop.cjs status

Purpose:
  Capture useful reasoning, assure it with deterministic checks, emit an artifact,
  and queue concrete follow-up work for the fleet.`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function stableId(input) {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16);
}

function nowIso() {
  return new Date().toISOString();
}

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function normalizeRecord(raw) {
  const record = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const question = String(record.question || record.prompt || record.title || '').trim();
  const answer = String(record.answer || record.response || record.content || '').trim();
  const source = String(record.source || 'unknown').trim();
  const objective = String(record.objective || 'advance TNF coherence and autonomous execution').trim();
  const capturedAt = record.capturedAt || nowIso();
  const id = record.id || `impetus-${stableId({ question, answer, source })}`;

  return {
    id,
    question,
    answer,
    source,
    objective,
    capturedAt,
    metadata: record.metadata && typeof record.metadata === 'object' ? record.metadata : {},
  };
}

function assuranceFor(record) {
  const checks = [
    {
      id: 'question-present',
      passed: record.question.length >= 12,
      detail: 'The originating question is specific enough to preserve intent.',
    },
    {
      id: 'answer-present',
      passed: record.answer.length >= 80,
      detail: 'The answer has enough substance to convert into work.',
    },
    {
      id: 'actionable-language',
      passed: /\b(add|build|fix|wire|run|verify|create|capture|audit|schedule|queue|implement|measure|review)\b/i.test(
        record.answer
      ),
      detail: 'The answer contains action verbs, not only explanation.',
    },
    {
      id: 'recurrence-or-verification',
      passed: /\b(regular|continuous|cadence|schedule|verify|assure|check|audit|scorecard|artifact)\b/i.test(
        `${record.question}\n${record.answer}`
      ),
      detail: 'The exchange includes ongoing verification or recurrence.',
    },
  ];

  const passed = checks.filter((check) => check.passed).length;
  return {
    passed: passed >= 3,
    score: passed / checks.length,
    checks,
  };
}

function buildFollowUpTask(record, assurance, artifactPath) {
  const title = `Operationalize impetus: ${record.question.slice(0, 72)}`;
  const description = [
    `Convert the captured exchange into observable TNF progress.`,
    `Question: ${record.question}`,
    `Answer summary: ${record.answer.slice(0, 1200)}`,
    `Assurance score: ${Math.round(assurance.score * 100)}%.`,
    `Artifact: ${path.relative(ROOT_DIR, artifactPath)}`,
  ].join('\n\n');

  return {
    id: `impetus-task-${stableId({ id: record.id, artifactPath })}`,
    title,
    description,
    priority: assurance.passed ? 'high' : 'normal',
    status: 'queued',
    source: 'impetus-loop',
    acceptanceCriteria: [
      'A concrete artifact or code change is produced.',
      'The result references the originating impetus artifact.',
      'The result states whether the proposed action worked.',
      'If incomplete, a smaller follow-up task is queued.',
    ],
    requiredCapabilities: ['planning'],
    scope: {
      tenantId: TENANT_ID,
      tenant_id: TENANT_ID,
    },
    metadata: {
      impetusId: record.id,
      impetusArtifact: path.relative(ROOT_DIR, artifactPath),
      assurancePassed: assurance.passed,
      assuranceScore: assurance.score,
    },
    createdAt: nowIso(),
  };
}

function toMarkdown(artifact) {
  const relArtifact = path.relative(ROOT_DIR, artifact.artifactPath);
  const lines = [
    '# TNF Impetus Assurance',
    '',
    `- Impetus ID: ${artifact.record.id}`,
    `- Captured: ${artifact.record.capturedAt}`,
    `- Processed: ${artifact.processedAt}`,
    `- Source: ${artifact.record.source}`,
    `- Objective: ${artifact.record.objective}`,
    `- Assurance: ${artifact.assurance.passed ? 'PASS' : 'REVIEW'} (${Math.round(
      artifact.assurance.score * 100
    )}%)`,
    `- Artifact: ${relArtifact}`,
    '',
    '## Question',
    '',
    artifact.record.question,
    '',
    '## Answer',
    '',
    artifact.record.answer,
    '',
    '## Assurance Checks',
    '',
    ...artifact.assurance.checks.map(
      (check) => `- ${check.passed ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`
    ),
    '',
    '## Queued Work',
    '',
    `- Task ID: ${artifact.queuedTask.id}`,
    `- Queue: ${PLANNING_QUEUE}`,
    `- Title: ${artifact.queuedTask.title}`,
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function updateStatus(redis, patch) {
  const status = {
    updatedAt: nowIso(),
    inboxKey: INBOX_KEY,
    processedHash: PROCESSED_HASH,
    artifactIndex: ARTIFACT_INDEX,
    planningQueue: PLANNING_QUEUE,
    intervalMs: INTERVAL_MS,
    ...patch,
  };
  await redis.set(STATUS_KEY, JSON.stringify(status));
  return status;
}

async function capture(redis, args) {
  const record = normalizeRecord({
    question: args.question || args.q || args._.join(' '),
    answer: args.answer || args.a || '',
    source: args.source || 'manual',
    objective: args.objective,
    metadata: {
      capturedBy: 'impetus-loop',
    },
  });

  if (!record.question || !record.answer) {
    throw new Error('capture requires --question and --answer');
  }

  await redis.lpush(INBOX_KEY, JSON.stringify(record));
  await updateStatus(redis, { lastCaptureId: record.id });
  console.log(JSON.stringify({ ok: true, queued: INBOX_KEY, id: record.id }, null, 2));
}

async function processOne(redis) {
  const raw = await redis.rpop(INBOX_KEY);
  if (!raw) {
    await updateStatus(redis, { lastRunAt: nowIso(), processed: 0 });
    return { processed: 0 };
  }

  const record = normalizeRecord(raw);
  const alreadyProcessed = await redis.hexists(PROCESSED_HASH, record.id);
  if (alreadyProcessed) {
    await updateStatus(redis, { lastRunAt: nowIso(), skippedDuplicate: record.id, processed: 0 });
    return { processed: 0, skippedDuplicate: record.id };
  }

  ensureReportDir();
  const processedAt = nowIso();
  const artifactPath = path.join(REPORT_DIR, `${record.id}.json`);
  const assurance = assuranceFor(record);
  const queuedTask = buildFollowUpTask(record, assurance, artifactPath);
  const artifact = {
    spec: 'tnf/impetus-assurance/1.0',
    artifactPath,
    processedAt,
    record,
    assurance,
    queuedTask,
  };

  fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(artifactPath.replace(/\.json$/, '.md'), toMarkdown(artifact));

  await redis.hset(PROCESSED_HASH, record.id, JSON.stringify({
    processedAt,
    assurancePassed: assurance.passed,
    assuranceScore: assurance.score,
    artifactPath: path.relative(ROOT_DIR, artifactPath),
    queuedTaskId: queuedTask.id,
  }));
  await redis.lpush(ARTIFACT_INDEX, record.id);
  await redis.ltrim(ARTIFACT_INDEX, 0, 199);
  await redis.lpush(PLANNING_QUEUE, JSON.stringify(queuedTask));
  await updateStatus(redis, {
    lastRunAt: processedAt,
    lastProcessedId: record.id,
    lastQueuedTaskId: queuedTask.id,
    lastArtifactPath: path.relative(ROOT_DIR, artifactPath),
    lastAssurancePassed: assurance.passed,
    processed: 1,
  });

  return {
    processed: 1,
    id: record.id,
    artifactPath: path.relative(ROOT_DIR, artifactPath),
    queuedTaskId: queuedTask.id,
    assurancePassed: assurance.passed,
  };
}

async function once(redis) {
  const result = await processOne(redis);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

async function loop(redis) {
  console.log(`[impetus-loop] online inbox=${INBOX_KEY} interval=${INTERVAL_MS}ms`);
  await updateStatus(redis, { state: 'online', pid: process.pid });
  while (true) {
    try {
      const result = await processOne(redis);
      if (result.processed) {
        console.log(`[impetus-loop] processed ${result.id} -> ${result.queuedTaskId}`);
      }
    } catch (error) {
      console.error(`[impetus-loop] error: ${error.message}`);
      await updateStatus(redis, { state: 'error', error: error.message });
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

async function status(redis) {
  const [statusRaw, inboxLength, artifactIds] = await Promise.all([
    redis.get(STATUS_KEY),
    redis.llen(INBOX_KEY),
    redis.lrange(ARTIFACT_INDEX, 0, 9),
  ]);
  const statusPayload = statusRaw ? JSON.parse(statusRaw) : null;
  console.log(JSON.stringify({ ok: true, status: statusPayload, inboxLength, recentArtifactIds: artifactIds }, null, 2));
}

async function main() {
  const [command = 'status', ...rest] = process.argv.slice(2);
  if (command === 'help' || command === '--help' || command === '-h') {
    usage();
    return;
  }

  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  try {
    const args = parseArgs(rest);
    if (command === 'capture') await capture(redis, args);
    else if (command === 'once') await once(redis);
    else if (command === 'loop') await loop(redis);
    else if (command === 'status') await status(redis);
    else {
      usage();
      process.exitCode = 1;
    }
  } finally {
    if (command !== 'loop') {
      await redis.quit();
    }
  }
}

main().catch((error) => {
  console.error(`[impetus-loop] fatal: ${error.message}`);
  process.exit(1);
});
