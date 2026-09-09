#!/usr/bin/env node
'use strict';

// Readiness is demonstrated behavior, never a percentage inferred from file presence.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REQUIRED_JOURNEYS = [
  ['first-run', 'Clean-machine install or signup reaches a usable workspace'],
  ['agent-tool-result', 'A real agent invokes a tool and returns an attributable useful result'],
  [
    'orchestration-recovery',
    'A persisted multi-agent run resumes after interruption without duplicate side effects',
  ],
  ['tenant-isolation', "Two authenticated tenants cannot read or execute each other's resources"],
  ['deployment-recovery', 'The release can be rolled back and persisted data restored'],
  [
    'load-and-abuse',
    'Measured load, quotas, rate limits and failure handling meet the declared launch capacity',
  ],
  [
    'public-product',
    'Public documentation, support, privacy, entitlement and billing promises match tested behavior',
  ],
];

function assessClock(body, now = Date.now()) {
  const cycle = body?.superCycle;
  const updated = Date.parse(cycle?.lastUpdated);
  const ttl = Number(cycle?.staleThresholdMs);
  if (!cycle || !Array.isArray(cycle.processes) || !Number.isFinite(ttl) || ttl <= 0)
    return { status: 'fail', detail: 'Clock response has no valid observation contract' };
  const fresh = (t) => {
    const n = Date.parse(t);
    return Number.isFinite(n) && n <= now + 5000 && now - n <= ttl;
  };
  const freshProcesses = cycle.processes.filter(
    (p) => p.stale !== true && fresh(p.lastHeartbeat || p.lastRunAt)
  ).length;
  const live =
    body.status === 'ok' &&
    cycle.projectionMode === 'live' &&
    fresh(cycle.lastUpdated) &&
    freshProcesses > 0;
  return {
    status: live ? 'pass' : 'fail',
    detail: live
      ? 'Timestamped clock observations are fresh; this does not prove task execution'
      : 'Clock telemetry is stale, projected, absent, or degraded',
    evidence: {
      lastUpdated: Number.isFinite(updated) ? new Date(updated).toISOString() : null,
      processes: cycle.processes.length,
      freshProcesses,
      projectionMode: cycle.projectionMode || 'unknown',
    },
  };
}

async function request(base, pathname, init, fetcher = fetch, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(new URL(pathname, base), {
      ...init,
      redirect: 'manual',
      signal: controller.signal,
    });
    // Keep the timeout active while consuming the body. Never persist raw response bodies.
    const reader = response.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 2 * 1024 * 1024) {
          await reader.cancel();
          throw new Error('response-limit');
        }
        chunks.push(value);
      }
    }
    const text = Buffer.concat(chunks).toString('utf8');
    let json;
    if (response.headers.get('content-type')?.includes('json')) {
      try {
        json = JSON.parse(text);
      } catch {}
    }
    return { status: response.status, json, text };
  } finally {
    clearTimeout(timeout);
  }
}

function summarize(checks, revision, base, now = Date.now()) {
  const requiredIds = [
    'app-shell',
    'edge-health',
    'anonymous-execution-denied',
    'clock-freshness',
    ...REQUIRED_JOURNEYS.map(([id]) => id),
  ];
  checks = checks.map((c) => ({ ...c, required: requiredIds.includes(c.id) || c.required }));
  for (const id of requiredIds)
    if (!checks.some((c) => c.id === id))
      checks.push({
        id,
        required: true,
        status: 'unknown',
        detail: 'Required check missing from assessment',
      });
  const blockers = checks.filter((c) => c.required && c.status !== 'pass');
  return {
    schemaVersion: 'tnf.public-launch-readiness/v1',
    assessedAt: new Date(now).toISOString(),
    assessorRevision: revision,
    target: base,
    decision: blockers.length ? 'NO_GO' : 'GO',
    scope:
      'Live public probes plus explicitly unverified end-to-end launch obligations; no capacity or security certification',
    checks,
    criticalIssues: blockers.map((c) => `${c.id}: ${c.detail}`),
  };
}

async function assess({
  base = 'https://app.thenewfuse.com',
  fetcher = fetch,
  now = Date.now(),
  revision = 'unknown',
} = {}) {
  const url = new URL(base);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('Target must be an HTTPS origin without credentials, path, or query');
  const probe = async (id, required, work) => {
    try {
      return { id, required, ...(await work()) };
    } catch {
      return {
        id,
        required,
        status: 'fail',
        detail: 'Probe failed, timed out, or exceeded the response limit',
      };
    }
  };
  const checks = await Promise.all([
    probe('app-shell', true, async () => {
      const r = await request(base, '/auth/login', {}, fetcher);
      return {
        status: r.status === 200 && /id=["']root["']/.test(r.text) ? 'pass' : 'fail',
        detail:
          'Public login serves the app shell; signup and login behavior require a separate journey',
      };
    }),
    probe('edge-health', true, async () => {
      const r = await request(base, '/health', {}, fetcher);
      return {
        status:
          r.status === 200 && (r.json?.status === 'ok' || r.json?.ok === true) ? 'pass' : 'fail',
        detail:
          'Edge health must return successful structured JSON; HTML 200 is not health evidence',
      };
    }),
    probe('anonymous-execution-denied', true, async () => {
      const r = await request(
        base,
        '/api/orchestration/chat',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
        fetcher
      );
      return {
        status: [401, 403].includes(r.status) ? 'pass' : 'fail',
        detail: 'Anonymous orchestration request must be rejected before execution',
        evidence: { httpStatus: r.status },
      };
    }),
    probe('clock-freshness', true, async () =>
      assessClock((await request(base, '/api/system/master-clock', {}, fetcher)).json, now)
    ),
  ]);
  for (const [id, detail] of REQUIRED_JOURNEYS)
    checks.push({
      id,
      required: true,
      status: 'unknown',
      detail: `Not executed by this probe: ${detail}`,
    });
  // These obligations deliberately have no --assume-pass or receipt-import shortcut.
  // Extend this existing gate with real journey runners as each integration is verified.
  return summarize(checks, revision, url.origin, now);
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!['--base', '--output'].includes(arg) || !args[i + 1])
      throw new Error(
        'Usage: node scripts/production-readiness-checklist.js [--base https://host] [--output report.json]'
      );
    options[arg.slice(2)] = args[++i];
  }
  let revision = 'unknown';
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {}
  const report = await assess({ base: options.base, revision });
  const serialized = JSON.stringify(report, null, 2) + '\n';
  if (options.output) fs.writeFileSync(options.output, serialized, { mode: 0o600 });
  process.stdout.write(serialized);
  process.exitCode = report.decision === 'GO' ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === __filename)
  main().catch(() => {
    console.error(
      'Readiness assessment failed; no launch approval issued. Check arguments, target, and output path.'
    );
    process.exitCode = 1;
  });
export { assess, assessClock, request, REQUIRED_JOURNEYS, summarize };
