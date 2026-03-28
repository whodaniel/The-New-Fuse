#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function usage() {
  console.log(
    'Usage: node scripts/protocols/build-staff-master-calendar.cjs [--repo-root <path>] [--json]'
  );
}

function parseArgs(argv) {
  const args = {
    repoRoot: process.cwd(),
    json: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--repo-root') {
      args.repoRoot = String(argv[++i] || '').trim() || args.repoRoot;
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function cadenceRank(cadence = '') {
  const value = String(cadence || '').trim();
  if (!value) return 999;
  if (value.includes('*/5')) return 5;
  if (value.includes('*/10')) return 10;
  if (value.includes('*/15')) return 15;
  if (value.includes('*/30')) return 30;
  if (value.startsWith('0 *')) return 60;
  if (value.includes('*/2')) return 120;
  if (value.includes('*/6')) return 360;
  if (value.includes('*/12')) return 720;
  if (value.includes('0 9') || value.includes('30 3')) return 1440;
  return 500;
}

function valueOr(value, fallback = null) {
  return value === undefined || value === null ? fallback : value;
}

function collectStaleRunWarnings(syncAudit) {
  const stale = new Set();
  const processes = Array.isArray(syncAudit?.processes) ? syncAudit.processes : [];
  for (const item of processes) {
    const checks = Array.isArray(item?.verification?.checks) ? item.verification.checks : [];
    if (checks.some((check) => check?.code === 'stale_run_window' && check?.ok === false)) {
      stale.add(String(item.processId || ''));
    }
  }
  return stale;
}

function buildInterrelationships(scheduleRows) {
  const edges = [];
  const ownerGroups = new Map();
  const subroutineGroups = new Map();
  const categoryGroups = new Map();

  for (const row of scheduleRows) {
    const owner = row.owner?.agentId || 'unknown-owner';
    const subroutine = row.runNow?.script || 'unknown-subroutine';
    const category = row.category || 'uncategorized';
    if (!ownerGroups.has(owner)) ownerGroups.set(owner, []);
    if (!subroutineGroups.has(subroutine)) subroutineGroups.set(subroutine, []);
    if (!categoryGroups.has(category)) categoryGroups.set(category, []);
    ownerGroups.get(owner).push(row.scheduleId);
    subroutineGroups.get(subroutine).push(row.scheduleId);
    categoryGroups.get(category).push(row.scheduleId);
  }

  const appendEdges = (type, map, reasonPrefix) => {
    for (const [key, ids] of map.entries()) {
      if (!Array.isArray(ids) || ids.length < 2) continue;
      const sorted = [...ids].sort();
      for (let i = 0; i < sorted.length; i += 1) {
        for (let j = i + 1; j < sorted.length; j += 1) {
          edges.push({
            type,
            from: sorted[i],
            to: sorted[j],
            key,
            reason: `${reasonPrefix}: ${key}`,
          });
        }
      }
    }
  };

  appendEdges('shared-owner', ownerGroups, 'Shared owner');
  appendEdges('shared-subroutine', subroutineGroups, 'Shared subroutine');
  appendEdges('shared-category', categoryGroups, 'Shared category');

  return edges;
}

function buildMarkdown(calendar) {
  const lines = [];
  lines.push('# TNF Staff Master Calendar and Master Schedule');
  lines.push('');
  lines.push(`Generated: ${calendar.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total schedules: ${calendar.summary.totalSchedules}`);
  lines.push(`- Enabled schedules: ${calendar.summary.enabledSchedules}`);
  lines.push(`- Disabled schedules: ${calendar.summary.disabledSchedules}`);
  lines.push(`- Locked schedules: ${calendar.summary.lockedSchedules}`);
  lines.push(`- Schedules with stale-run warning: ${calendar.summary.staleRunWarnings}`);
  lines.push(`- Interrelationship edges: ${calendar.summary.interrelationshipEdges}`);
  lines.push('');

  lines.push('## Schedule Table');
  lines.push('');
  lines.push(
    '| Schedule ID | Scope | Category | Owner | Cadence | TZ | Enabled | Runtime | Lock | Subroutine |'
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const row of calendar.scheduleRows) {
    lines.push(
      `| ${row.scheduleId} | ${row.scope} | ${row.category} | ${row.owner?.agentId || 'unknown'} | ${row.schedule.cadence || 'n/a'} | ${row.schedule.timezone || 'UTC'} | ${row.schedule.enabled ? 'yes' : 'no'} | ${row.runtime?.status || 'unknown'} | ${row.locked ? 'locked' : 'open'} | ${row.runNow?.script || 'n/a'} |`
    );
  }
  lines.push('');

  lines.push('## Interrelationships');
  lines.push('');
  for (const edge of calendar.interrelationships.slice(0, 120)) {
    lines.push(`- [${edge.type}] ${edge.from} -> ${edge.to} (${edge.reason})`);
  }
  if (calendar.interrelationships.length > 120) {
    lines.push(
      `- ... truncated ${calendar.interrelationships.length - 120} additional edges; see JSON artifact for full set.`
    );
  }
  lines.push('');

  lines.push('## Potential Growth-Limiting Constraints');
  lines.push('');
  if (!calendar.growthLimitCandidates.length) {
    lines.push('- No candidates flagged in this run.');
  } else {
    for (const item of calendar.growthLimitCandidates) {
      lines.push(
        `- ${item.scheduleId}: ${item.reason} (enabled=${item.enabled}, lock=${item.locked}, runtime=${item.runtimeStatus || 'unknown'})`
      );
    }
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(args.repoRoot);
  const registryPath = path.join(repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
  const catalogPath = path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json');
  const statePath = path.join(repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');
  const syncAuditPath = path.join(
    repoRoot,
    'reports',
    'protocols',
    'master-clock-sync',
    'master-clock-sync-latest.json'
  );
  const outputJsonPath = path.join(repoRoot, 'data', 'protocols', 'tnf-staff-master-calendar.json');
  const outputMdPath = path.join(
    repoRoot,
    'docs',
    'operations',
    'TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md'
  );

  const registry = readJson(registryPath, { categories: [], jobs: [] });
  const catalog = readJson(catalogPath, { entries: {} });
  const state = readJson(statePath, { overrides: {}, runtime: {} });
  const syncAudit = readJson(syncAuditPath, { processes: [] });
  const staleRunWarnings = collectStaleRunWarnings(syncAudit);

  const categories = new Map(
    (Array.isArray(registry.categories) ? registry.categories : []).map((item) => [item.category, item])
  );
  const jobs = Array.isArray(registry.jobs) ? registry.jobs : [];

  const scheduleRows = jobs.map((job) => {
    const scheduleId = String(job.schedule_id || '').trim();
    const category = categories.get(job.category) || null;
    const catalogEntry = catalog?.entries?.[scheduleId] || {};
    const override = state?.overrides?.[scheduleId] || {};
    const runtime = state?.runtime?.[scheduleId] || {};
    const effectiveEnabled =
      typeof override.enabled === 'boolean' ? override.enabled : valueOr(catalogEntry.enabled, true);
    const cadence = valueOr(override.cadence, catalogEntry.cadence || null);
    const timezone = valueOr(override.timezone, catalogEntry.timezone || 'UTC');
    const runNowCommand = catalogEntry?.runNow?.command || null;
    const runNowArgs = Array.isArray(catalogEntry?.runNow?.args) ? catalogEntry.runNow.args : [];
    const scriptFromArgs = runNowArgs.find((arg) => String(arg).includes('scripts/')) || null;
    return {
      scheduleId,
      scope: job.scope || 'unknown',
      category: job.category || 'unknown',
      categoryDescription: category?.description || null,
      requiresApproval: Boolean(category?.requires_approval),
      owner: {
        agentId: job.owner_agent_id || null,
        userId: job.owner_user_id || null,
      },
      schedule: {
        cadence,
        timezone,
        enabled: Boolean(effectiveEnabled),
      },
      runtime: {
        status: runtime.status || 'unknown',
        lastRunAt: runtime.lastRunAt || null,
        lastExitCode: valueOr(runtime.lastExitCode, null),
      },
      locked: Boolean(job.locked),
      staleRunWarning: staleRunWarnings.has(scheduleId),
      runNow: {
        command: runNowCommand,
        script: scriptFromArgs,
      },
      docs: catalogEntry.docs || {},
      notes: override.notes || null,
    };
  });

  scheduleRows.sort((left, right) => {
    const byEnabled = Number(right.schedule.enabled) - Number(left.schedule.enabled);
    if (byEnabled !== 0) return byEnabled;
    const byCadence = cadenceRank(left.schedule.cadence) - cadenceRank(right.schedule.cadence);
    if (byCadence !== 0) return byCadence;
    return left.scheduleId.localeCompare(right.scheduleId);
  });

  const growthLimitCandidates = scheduleRows
    .filter((row) => {
      if (!row.schedule.enabled) return true;
      if (row.locked && row.scope === 'system_framework') return true;
      if (row.runtime.status === 'error' || row.runtime.status === 'paused' || row.runtime.status === 'manual') return true;
      if (row.staleRunWarning) return true;
      return false;
    })
    .map((row) => {
      let reason = 'review-recommended';
      if (!row.schedule.enabled) reason = 'disabled-schedule';
      else if (row.runtime.status === 'error' || row.runtime.status === 'paused' || row.runtime.status === 'manual') reason = `runtime-${row.runtime.status}`;
      else if (row.staleRunWarning) reason = 'stale-run-window';
      else if (row.locked && row.scope === 'system_framework') reason = 'system-lock-review';
      return {
        scheduleId: row.scheduleId,
        reason,
        enabled: row.schedule.enabled,
        locked: row.locked,
        runtimeStatus: row.runtime.status,
      };
    });

  const interrelationships = buildInterrelationships(scheduleRows);

  const calendar = {
    spec: 'tnf/staff-master-calendar/0.1',
    generatedAt: new Date().toISOString(),
    sources: {
      registryPath: path.relative(repoRoot, registryPath),
      catalogPath: path.relative(repoRoot, catalogPath),
      statePath: path.relative(repoRoot, statePath),
      syncAuditPath: path.relative(repoRoot, syncAuditPath),
    },
    summary: {
      totalSchedules: scheduleRows.length,
      enabledSchedules: scheduleRows.filter((row) => row.schedule.enabled).length,
      disabledSchedules: scheduleRows.filter((row) => !row.schedule.enabled).length,
      lockedSchedules: scheduleRows.filter((row) => row.locked).length,
      staleRunWarnings: scheduleRows.filter((row) => row.staleRunWarning).length,
      interrelationshipEdges: interrelationships.length,
    },
    scheduleRows,
    interrelationships,
    growthLimitCandidates,
  };

  writeJson(outputJsonPath, calendar);
  writeText(outputMdPath, buildMarkdown(calendar));

  if (args.json) {
    console.log(JSON.stringify(calendar, null, 2));
  } else {
    console.log(
      JSON.stringify(
        {
          ok: true,
          outputJsonPath: path.relative(repoRoot, outputJsonPath),
          outputMdPath: path.relative(repoRoot, outputMdPath),
          summary: calendar.summary,
        },
        null,
        2
      )
    );
  }
}

main();
