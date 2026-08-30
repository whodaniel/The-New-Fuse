#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function usage() {
  console.log(
    [
      'Usage: node scripts/protocols/staffops-schedule-sync.cjs <install|uninstall|status|render> [options]',
      '',
      'Options:',
      '  --repo-root <path>      Repository root (default: cwd)',
      '  --actor-id <id>         Actor id for run-chronological-process (default: tnf-master-clock)',
      '  --scope <scope>         Schedule scope filter (default: system_framework)',
      '  --category <name>       Category filter (repeatable)',
      '  --process-id <id>       Process id filter (repeatable)',
      '  --dry-run               Print mutations without writing crontab',
      '  --json                  Output JSON',
      '  -h, --help              Show help',
    ].join('\n')
  );
}

function parseArgs(argv) {
  if (argv.length < 3 || argv.includes('-h') || argv.includes('--help')) {
    usage();
    process.exit(0);
  }

  const options = {
    action: String(argv[2] || '').trim(),
    repoRoot: process.cwd(),
    actorId: 'tnf-master-clock',
    scope: 'system_framework',
    categories: [],
    processIds: [],
    dryRun: false,
    json: false,
  };

  for (let i = 3; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--repo-root') {
      options.repoRoot = path.resolve(String(argv[++i] || '').trim() || options.repoRoot);
    } else if (token === '--actor-id') {
      options.actorId = String(argv[++i] || '').trim() || options.actorId;
    } else if (token === '--scope') {
      options.scope = String(argv[++i] || '').trim() || options.scope;
    } else if (token === '--category') {
      const value = String(argv[++i] || '').trim();
      if (value) options.categories.push(value);
    } else if (token === '--process-id') {
      const value = String(argv[++i] || '').trim();
      if (value) options.processIds.push(value);
    } else if (token === '--dry-run') {
      options.dryRun = true;
    } else if (token === '--json') {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!['install', 'uninstall', 'status', 'render'].includes(options.action)) {
    throw new Error(`Unsupported action: ${options.action}`);
  }

  if (!options.categories.length) {
    options.categories = ['staff_coordination', 'staff_architecture', 'staff_review'];
  }

  return options;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function normalizeCadence(rawCadence) {
  const raw = String(rawCadence || '').trim();
  if (!raw) return null;
  const lowered = raw.toLowerCase();
  if (lowered === 'manual' || lowered === '@never' || lowered === 'disabled') {
    return null;
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 5) return parts.join(' ');
  if (parts.length === 6 && parts[0] === '0') return parts.slice(1).join(' ');
  return null;
}

function listSelectedSchedules(options, registry, catalog, state) {
  const jobs = Array.isArray(registry.jobs) ? registry.jobs : [];
  const entries = catalog.entries || {};
  const overrides = state.overrides || {};

  const selected = [];

  for (const job of jobs) {
    const processId = String(job.schedule_id || '').trim();
    if (!processId) continue;

    if (options.processIds.length && !options.processIds.includes(processId)) {
      continue;
    }

    if (!options.processIds.length) {
      if (options.scope && String(job.scope || '') !== options.scope) continue;
      if (options.categories.length && !options.categories.includes(String(job.category || ''))) continue;
    }

    const entry = entries[processId];
    if (!entry || !entry.runNow || !entry.runNow.command) continue;

    const override = overrides[processId] || {};
    const enabled = override.enabled ?? true;
    if (!enabled) continue;

    const cadence = normalizeCadence(override.cadence || entry.cadence);
    if (!cadence) continue;

    selected.push({
      processId,
      cadence,
      category: String(job.category || ''),
      scope: String(job.scope || ''),
    });
  }

  selected.sort((left, right) => left.processId.localeCompare(right.processId));
  return selected;
}

function buildCronLine(schedule, options) {
  const nodeBin = process.execPath;
  const nodeDir = path.dirname(nodeBin);
  const repoRootEscaped = options.repoRoot.replace(/"/g, '\\"');
  const actorEscaped = options.actorId.replace(/"/g, '\\"');
  const processEscaped = schedule.processId.replace(/"/g, '\\"');
  const logDir = `$HOME/.tnf/poll-jobs/tnf-chronological-${processEscaped}`;

  return `${schedule.cadence} mkdir -p "${logDir}" && cd "${repoRootEscaped}" && PATH="${nodeDir}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" "${nodeBin}" "scripts/protocols/run-chronological-process.cjs" --repo-root "${repoRootEscaped}" --process-id "${processEscaped}" --actor-id "${actorEscaped}" >> "${logDir}/cron.log" 2>&1 # tnf-chronological:${processEscaped}`;
}

function readCrontab() {
  const result = spawnSync('crontab', ['-l'], { encoding: 'utf8' });
  if (result.status !== 0) return '';
  return String(result.stdout || '');
}

function writeCrontab(content) {
  const tempPath = path.join('/tmp', `tnf-staffops-cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`);
  fs.writeFileSync(tempPath, content, 'utf8');
  const result = spawnSync('crontab', [tempPath], { encoding: 'utf8' });
  fs.rmSync(tempPath, { force: true });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to write crontab');
  }
}

function filterCrontabLines(lines, processIdsToRemove) {
  const tags = new Set(processIdsToRemove.map((id) => `# tnf-chronological:${id}`));
  return lines.filter((line) => {
    for (const tag of tags) {
      if (line.includes(tag)) return false;
    }
    return true;
  });
}

function appendJsonl(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function main() {
  const options = parseArgs(process.argv);
  const registry = readJson(path.join(options.repoRoot, 'data', 'protocols', 'cron-jobs.registry.json'), { jobs: [] });
  const catalog = readJson(path.join(options.repoRoot, 'data', 'protocols', 'chronological-process-catalog.json'), { entries: {} });
  const state = readJson(path.join(options.repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json'), {
    overrides: {},
  });

  const schedules = listSelectedSchedules(options, registry, catalog, state);
  const processIds = schedules.map((item) => item.processId);
  const renderedLines = schedules.map((item) => buildCronLine(item, options));

  const existingCrontab = readCrontab();
  const existingLines = existingCrontab.split('\n').filter((line) => line.length > 0);

  const installedLines = existingLines.filter((line) => line.includes('# tnf-chronological:'));
  const matchingInstalledLines = installedLines.filter((line) =>
    processIds.some((processId) => line.includes(`# tnf-chronological:${processId}`))
  );

  let nextLines = existingLines.slice();

  if (options.action === 'install') {
    nextLines = filterCrontabLines(nextLines, processIds);
    nextLines.push(...renderedLines);
  } else if (options.action === 'uninstall') {
    nextLines = filterCrontabLines(nextLines, processIds);
  }

  const output = {
    ok: true,
    action: options.action,
    scope: options.scope,
    categories: options.categories,
    processIds,
    selectedSchedules: schedules,
    existingMatchedCount: matchingInstalledLines.length,
    renderedCount: renderedLines.length,
    dryRun: options.dryRun,
  };

  if (options.action === 'install' || options.action === 'uninstall') {
    const content = nextLines.length ? `${nextLines.join('\n')}\n` : '';
    if (!options.dryRun) {
      writeCrontab(content);
      appendJsonl(path.join(options.repoRoot, 'logs', 'staffops-schedule-sync.jsonl'), {
        generatedAt: new Date().toISOString(),
        action: options.action,
        processIds,
        categories: options.categories,
        scope: options.scope,
      });
    }
    output.wroteCrontab = !options.dryRun;
    output.crontabLineCount = nextLines.length;
  }

  if (options.action === 'status') {
    output.matchedInstalledLines = matchingInstalledLines;
  }

  if (options.action === 'render') {
    output.renderedLines = renderedLines;
  }

  if (options.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
}

main();
