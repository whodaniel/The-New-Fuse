#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {
  expandHome,
  getInstallationsRegistryPath,
  listOpenClawTargets,
  resolveOpenClawTarget,
  resolveOpenClawTargets,
  resolveRepoRoot,
} = require('./openclaw-targets.cjs');

const DEFAULT_CONFIG_PATH = '~/.openclaw/openclaw.json';
const DEFAULT_CRON_PATH = '~/.openclaw/cron/jobs.json';
const DEFAULT_STATE_RELATIVE_PATH = path.join(
  'data',
  'protocols',
  'cron-jobs.control-plane-state.json'
);
const SENSITIVE_KEY_PATTERN =
  /(token|secret|password|passphrase|api[_-]?key|credential|cookie|private[_-]?key|wallet|bearer|auth[_-]?token|session[_-]?token)/i;

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function atomicWriteJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function copyFileWithMkdir(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function normalizePathExpression(input) {
  return String(input || '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((segment) => {
      if (/^\d+$/.test(segment)) return Number(segment);
      return segment;
    });
}

function getValueAtPath(target, pathExpression) {
  const segments = normalizePathExpression(pathExpression);
  let current = target;
  for (const segment of segments) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}

function setValueAtPath(target, pathExpression, value) {
  const segments = normalizePathExpression(pathExpression);
  if (segments.length === 0) throw new Error('Path must not be empty');

  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    if (current[segment] == null) {
      current[segment] = typeof nextSegment === 'number' ? [] : {};
    }
    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
}

function unsetValueAtPath(target, pathExpression) {
  const segments = normalizePathExpression(pathExpression);
  if (segments.length === 0) throw new Error('Path must not be empty');

  let current = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    current = current?.[segments[i]];
    if (current == null) return false;
  }

  const last = segments[segments.length - 1];
  if (Array.isArray(current) && typeof last === 'number') {
    if (last < 0 || last >= current.length) return false;
    current.splice(last, 1);
    return true;
  }

  if (current && Object.prototype.hasOwnProperty.call(current, last)) {
    delete current[last];
    return true;
  }
  return false;
}

function parseTypedValue(raw, type) {
  const normalized = String(type || 'string').toLowerCase();
  if (normalized === 'string') return raw;
  if (normalized === 'number') {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid number value: ${raw}`);
    return parsed;
  }
  if (normalized === 'boolean') {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    throw new Error(`Invalid boolean value: ${raw}`);
  }
  if (normalized === 'null') return null;
  if (normalized === 'json') return JSON.parse(raw);
  throw new Error(`Unsupported value type: ${type}`);
}

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key || ''));
}

function redactValue(value, keyPath = []) {
  const currentKey = keyPath[keyPath.length - 1];
  if (currentKey && isSensitiveKey(currentKey)) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(item, [...keyPath, String(index)]));
  }

  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      output[key] = redactValue(child, [...keyPath, key]);
    }
    return output;
  }

  return value;
}

function loadLegacyScheduleMap(repoRoot) {
  const catalogPath = path.join(repoRoot, 'data', 'protocols', 'chronological-process-catalog.json');
  const catalog = readJson(catalogPath, { entries: {} });
  const map = new Map();
  for (const [scheduleId, entry] of Object.entries(catalog.entries || {})) {
    const jobName = entry?.metadata?.legacySource?.jobName;
    if (jobName) {
      map.set(jobName, scheduleId);
    }
  }
  return map;
}

function summarizeCronJob(job, legacyMap) {
  return {
    id: job.id || null,
    name: job.name || null,
    enabled: Boolean(job.enabled),
    schedule: job.schedule || null,
    sessionTarget: job.sessionTarget || null,
    wakeMode: job.wakeMode || null,
    payloadKind: job.payload?.kind || null,
    tnfScheduleId: legacyMap.get(job.name) || null,
    state: {
      lastStatus: job.state?.lastStatus || job.state?.lastRunStatus || null,
      nextRunAtMs: job.state?.nextRunAtMs || null,
      consecutiveErrors: job.state?.consecutiveErrors ?? null,
    },
  };
}

function buildOverview(config, jobs, legacyMap) {
  const summarizedJobs = jobs.map((job) => summarizeCronJob(job, legacyMap));
  return {
    config: {
      topLevelKeys: Object.keys(config || {}).sort(),
      channels: Object.keys(config?.channels || {}).sort(),
      gatewayKeys: Object.keys(config?.gateway || {}).sort(),
      modelsKeys: Object.keys(config?.models || {}).sort(),
      redacted: redactValue(config || {}),
    },
    cron: {
      totalJobs: summarizedJobs.length,
      enabledJobs: summarizedJobs.filter((job) => job.enabled).length,
      disabledJobs: summarizedJobs.filter((job) => !job.enabled).length,
      jobs: summarizedJobs,
    },
  };
}

function normalizeControlPlaneState(payload) {
  const parsed = payload && typeof payload === 'object' ? payload : {};
  return {
    spec: parsed.spec || 'tnf/cron-jobs-control-plane-state/0.1',
    updated_at: parsed.updated_at || new Date(0).toISOString(),
    overrides: parsed.overrides || {},
    runtime: parsed.runtime || {},
    history: parsed.history || {},
    integrations: parsed.integrations || {},
  };
}

function getStatePath(repoRoot) {
  return path.join(repoRoot, DEFAULT_STATE_RELATIVE_PATH);
}

function readControlPlaneState(repoRoot) {
  return normalizeControlPlaneState(readJson(getStatePath(repoRoot), {}));
}

function writeControlPlaneState(repoRoot, state) {
  atomicWriteJson(getStatePath(repoRoot), state);
}

function getWorstStatus(jobs) {
  const normalized = jobs
    .map((job) => String(job.state?.lastStatus || job.state?.lastRunStatus || '').toLowerCase())
    .filter(Boolean);
  if (normalized.includes('error')) return 'error';
  if (normalized.includes('warning')) return 'warning';
  if (normalized.includes('ok')) return 'ok';
  if (normalized.includes('disabled-by-tnf')) return 'disabled-by-tnf';
  return null;
}

function buildTargetSummary(target) {
  return {
    targetId: target.targetId,
    installationId: target.installationId,
    installationLabel: target.installationLabel,
    installationTransport: target.installationTransport,
    installationBinaryPath: target.installationBinaryPath,
    installationHost: target.installationHost,
    instanceId: target.instanceId,
    instanceLabel: target.instanceLabel,
    profile: target.profile,
    stateDir: target.stateDir,
    configPath: target.configPath,
    cronPath: target.cronPath,
    exists: target.exists,
    default: target.default,
    source: target.source,
  };
}

function buildOpenClawInstanceSnapshot(target, config, jobs, legacyMap, context = {}) {
  const summarizedJobs = jobs.map((job) => summarizeCronJob(job, legacyMap));
  const mappedSchedules = {};
  const unmatchedJobs = [];

  for (const job of summarizedJobs) {
    if (!job.tnfScheduleId) {
      unmatchedJobs.push(job);
      continue;
    }

    if (!mappedSchedules[job.tnfScheduleId]) {
      mappedSchedules[job.tnfScheduleId] = {
        scheduleId: job.tnfScheduleId,
        jobCount: 0,
        duplicateCount: 0,
        enabledJobs: 0,
        disabledJobs: 0,
        anyEnabled: false,
        worstStatus: null,
        maxConsecutiveErrors: 0,
        nextRunAtMs: null,
        liveJobs: [],
      };
    }

    const group = mappedSchedules[job.tnfScheduleId];
    group.jobCount += 1;
    group.liveJobs.push(job);
    if (job.enabled) {
      group.enabledJobs += 1;
      group.anyEnabled = true;
    } else {
      group.disabledJobs += 1;
    }
    group.maxConsecutiveErrors = Math.max(
      group.maxConsecutiveErrors,
      Number(job.state?.consecutiveErrors || 0)
    );
    const nextRunAtMs = job.state?.nextRunAtMs == null ? null : Number(job.state.nextRunAtMs);
    if (
      nextRunAtMs != null &&
      Number.isFinite(nextRunAtMs) &&
      (group.nextRunAtMs == null || nextRunAtMs < Number(group.nextRunAtMs))
    ) {
      group.nextRunAtMs = nextRunAtMs;
    }
  }

  for (const group of Object.values(mappedSchedules)) {
    group.duplicateCount = Math.max(0, group.jobCount - 1);
    group.worstStatus = getWorstStatus(group.liveJobs);
  }

  return {
    ...buildTargetSummary(target),
    updatedAt: context.updatedAt || new Date().toISOString(),
    syncedBy: context.actor || 'system',
    configSummary: {
      topLevelKeys: Object.keys(config || {}).sort(),
      channels: Object.keys(config?.channels || {}).sort(),
      gatewayKeys: Object.keys(config?.gateway || {}).sort(),
      modelsKeys: Object.keys(config?.models || {}).sort(),
    },
    cronSummary: {
      totalJobs: summarizedJobs.length,
      enabledJobs: summarizedJobs.filter((job) => job.enabled).length,
      disabledJobs: summarizedJobs.filter((job) => !job.enabled).length,
    },
    mappedSchedules,
    unmatchedJobs,
    cleanup: context.cleanup || null,
  };
}

function aggregateMappedSchedules(instanceSnapshots) {
  const aggregate = {};

  for (const snapshot of instanceSnapshots) {
    for (const [scheduleId, entry] of Object.entries(snapshot.mappedSchedules || {})) {
      if (!aggregate[scheduleId]) {
        aggregate[scheduleId] = {
          scheduleId,
          installationCount: 0,
          instanceCount: 0,
          jobCount: 0,
          duplicateCount: 0,
          enabledJobs: 0,
          disabledJobs: 0,
          anyEnabled: false,
          worstStatus: null,
          maxConsecutiveErrors: 0,
          nextRunAtMs: null,
          instances: [],
          liveJobs: [],
        };
      }

      const group = aggregate[scheduleId];
      group.installationCount += 0;
      group.instanceCount += 1;
      group.jobCount += Number(entry.jobCount || 0);
      group.duplicateCount += Number(entry.duplicateCount || 0);
      group.enabledJobs += Number(entry.enabledJobs || 0);
      group.disabledJobs += Number(entry.disabledJobs || 0);
      group.anyEnabled = group.anyEnabled || Boolean(entry.anyEnabled);
      group.maxConsecutiveErrors = Math.max(
        group.maxConsecutiveErrors,
        Number(entry.maxConsecutiveErrors || 0)
      );
      const nextRunAtMs = entry.nextRunAtMs == null ? null : Number(entry.nextRunAtMs);
      if (
        nextRunAtMs != null &&
        Number.isFinite(nextRunAtMs) &&
        (group.nextRunAtMs == null || nextRunAtMs < Number(group.nextRunAtMs))
      ) {
        group.nextRunAtMs = nextRunAtMs;
      }
      group.instances.push({
        targetId: snapshot.targetId,
        installationId: snapshot.installationId,
        installationLabel: snapshot.installationLabel,
        instanceId: snapshot.instanceId,
        instanceLabel: snapshot.instanceLabel,
        stateDir: snapshot.stateDir,
        configPath: snapshot.configPath,
        cronPath: snapshot.cronPath,
        ...entry,
      });
      group.liveJobs.push(...(entry.liveJobs || []));
    }
  }

  for (const group of Object.values(aggregate)) {
    group.installationCount = new Set(group.instances.map((instance) => instance.installationId)).size;
    group.worstStatus = getWorstStatus(group.liveJobs);
  }

  return aggregate;
}

function buildOpenClawIntegrationSnapshot(discovery, instanceSnapshots, context = {}) {
  const installations = {};
  for (const [installationId, installation] of Object.entries(discovery.installations || {})) {
    installations[installationId] = {
      installationId,
      label: installation.label,
      transport: installation.transport,
      binaryPath: installation.binaryPath,
      host: installation.host,
      instanceIds: installation.instanceIds || [],
    };
  }

  const instances = {};
  for (const snapshot of instanceSnapshots) {
    instances[snapshot.targetId] = snapshot;
  }

  const summary = {
    installationCount: new Set(instanceSnapshots.map((snapshot) => snapshot.installationId)).size,
    instanceCount: instanceSnapshots.length,
    totalJobs: instanceSnapshots.reduce(
      (sum, snapshot) => sum + Number(snapshot.cronSummary?.totalJobs || 0),
      0
    ),
    enabledJobs: instanceSnapshots.reduce(
      (sum, snapshot) => sum + Number(snapshot.cronSummary?.enabledJobs || 0),
      0
    ),
    disabledJobs: instanceSnapshots.reduce(
      (sum, snapshot) => sum + Number(snapshot.cronSummary?.disabledJobs || 0),
      0
    ),
  };

  return {
    updatedAt: context.updatedAt || new Date().toISOString(),
    syncedBy: context.actor || 'system',
    summary,
    installations,
    instances,
    mappedSchedules: aggregateMappedSchedules(instanceSnapshots),
  };
}

function findCronJob(cronFile, reference) {
  const jobs = Array.isArray(cronFile.jobs) ? cronFile.jobs : [];
  const exactId = jobs.find((job) => job.id === reference);
  if (exactId) return exactId;

  const exactName = jobs.find((job) => job.name === reference);
  if (exactName) return exactName;

  const lowerReference = String(reference || '').toLowerCase();
  const partial = jobs.filter((job) => String(job.name || '').toLowerCase().includes(lowerReference));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    throw new Error(
      `Cron job reference '${reference}' is ambiguous: ${partial.map((job) => job.name).join(', ')}`
    );
  }
  throw new Error(`Cron job '${reference}' not found`);
}

function formatScheduleMutation(options) {
  if (options.cron) {
    return {
      kind: 'cron',
      expr: options.cron,
      ...(options.tz ? { tz: options.tz } : {}),
      ...(options.staggerMs != null ? { staggerMs: options.staggerMs } : {}),
    };
  }
  if (options.everyMs != null) {
    return {
      kind: 'every',
      everyMs: options.everyMs,
      anchorMs: options.anchorMs != null ? options.anchorMs : Date.now(),
    };
  }
  if (options.at) {
    return {
      kind: 'at',
      at: options.at,
    };
  }
  throw new Error('Provide one of --cron, --every-ms, or --at');
}

function selectionWasExplicit(options) {
  return Boolean(options.installationId || options.instanceId || options.stateDir);
}

function buildSelectionMetadata(options, targets, allInstances) {
  return {
    allInstances: Boolean(allInstances),
    installationId: options.installationId || null,
    instanceId: options.instanceId || null,
    stateDir: options.stateDir ? path.resolve(expandHome(options.stateDir)) : null,
    targetIds: targets.map((target) => target.targetId),
  };
}

function getTargetsForRead(options, defaultAllInstances) {
  const allInstances = options.allInstances || (!selectionWasExplicit(options) && defaultAllInstances);
  const targets = resolveOpenClawTargets({
    repoRoot: options.repoRoot,
    installationId: options.installationId,
    instanceId: options.instanceId,
    stateDir: options.stateDir,
    configPath: options.configPath,
    cronPath: options.cronPath,
    allInstances,
  });
  return {
    allInstances,
    targets,
  };
}

function syncControlPlaneState(options, context = {}) {
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const discovery = listOpenClawTargets({ repoRoot });
  const targets = resolveOpenClawTargets({
    repoRoot,
    installationId: options.installationId,
    instanceId: options.instanceId,
    stateDir: options.stateDir,
    configPath: options.configPath,
    cronPath: options.cronPath,
    allInstances:
      options.allInstances || !selectionWasExplicit({
        installationId: options.installationId,
        instanceId: options.instanceId,
        stateDir: options.stateDir,
      }),
  });
  const legacyMap = loadLegacyScheduleMap(repoRoot);
  const updatedAt = context.updatedAt || new Date().toISOString();
  const cleanupByTarget = context.cleanupByTarget || {};
  const instanceSnapshots = targets.map((target) => {
    const config = readJson(target.configPath, {});
    const cron = readJson(target.cronPath, { jobs: [] });
    const jobs = Array.isArray(cron.jobs) ? cron.jobs : [];
    return buildOpenClawInstanceSnapshot(target, config, jobs, legacyMap, {
      updatedAt,
      actor: options.actor || context.actor || 'system',
      cleanup: cleanupByTarget[target.targetId] || null,
    });
  });
  const snapshot = buildOpenClawIntegrationSnapshot(discovery, instanceSnapshots, {
    updatedAt,
    actor: options.actor || context.actor || 'system',
  });

  const nextState = readControlPlaneState(repoRoot);
  nextState.integrations = {
    ...(nextState.integrations || {}),
    openclaw: snapshot,
  };
  nextState.updated_at = updatedAt;
  writeControlPlaneState(repoRoot, nextState);

  return {
    ok: true,
    repoRoot,
    statePath: getStatePath(repoRoot),
    selection: buildSelectionMetadata(options, targets, true),
    snapshot,
  };
}

function cleanupCronJobs(options) {
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const targets = resolveOpenClawTargets({
    repoRoot,
    installationId: options.installationId,
    instanceId: options.instanceId,
    stateDir: options.stateDir,
    configPath: options.configPath,
    cronPath: options.cronPath,
    allInstances: Boolean(options.allInstances),
  });
  const legacyMap = loadLegacyScheduleMap(repoRoot);
  const perTarget = [];
  const cleanupByTarget = {};

  for (const target of targets) {
    const cron = readJson(target.cronPath, { version: 1, jobs: [] });
    const jobs = Array.isArray(cron.jobs) ? cron.jobs : [];
    const nextJobs = [];
    const removedJobs = [];
    const disabledJobs = [];
    let keptLaunchValidation = false;

    for (const job of jobs) {
      const scheduleId = legacyMap.get(job.name) || null;
      const isLaunchValidation = scheduleId === 'tenant-launch-validation';
      if (options.pruneLaunchValidationDuplicates && isLaunchValidation) {
        if (keptLaunchValidation) {
          removedJobs.push({
            id: job.id || null,
            name: job.name || null,
            reason: 'duplicate_launch_validation',
          });
          continue;
        }
        keptLaunchValidation = true;
      }
      nextJobs.push(job);
    }

    if (options.disableFailing) {
      for (const job of nextJobs) {
        const scheduleId = legacyMap.get(job.name) || null;
        const lastStatus = String(job?.state?.lastStatus || job?.state?.lastRunStatus || '')
          .trim()
          .toLowerCase();
        if (scheduleId && job.enabled && lastStatus === 'error') {
          job.enabled = false;
          disabledJobs.push({
            id: job.id || null,
            name: job.name || null,
            scheduleId,
            reason: 'failing_tnf_managed_job',
          });
        }
      }
    }

    const changed = removedJobs.length > 0 || disabledJobs.length > 0;
    let backupPath = null;

    if (changed && !options.dryRun) {
      if (fs.existsSync(target.cronPath)) {
        backupPath = `${target.cronPath}.bak.${new Date().toISOString().replace(/[:]/g, '-')}`;
        copyFileWithMkdir(target.cronPath, backupPath);
      }
      atomicWriteJson(target.cronPath, {
        ...cron,
        jobs: nextJobs,
      });
    }

    const cleanup = {
      targetId: target.targetId,
      lastRunAt: new Date().toISOString(),
      actor: options.actor || 'system',
      dryRun: Boolean(options.dryRun),
      removedJobs,
      disabledJobs,
      backupPath,
    };
    cleanupByTarget[target.targetId] = cleanup;
    perTarget.push({
      ...buildTargetSummary(target),
      changed,
      remainingJobs: nextJobs.length,
      cleanup,
    });
  }

  const syncResult = options.dryRun
    ? {
        ok: true,
        repoRoot,
        statePath: getStatePath(repoRoot),
        snapshot: buildOpenClawIntegrationSnapshot(
          listOpenClawTargets({ repoRoot }),
          targets.map((target) => {
            const config = readJson(target.configPath, {});
            const cron = readJson(target.cronPath, { version: 1, jobs: [] });
            const jobs = Array.isArray(cron.jobs) ? cron.jobs : [];
            const perTargetResult = perTarget.find((entry) => entry.targetId === target.targetId);
            return buildOpenClawInstanceSnapshot(target, config, jobs, legacyMap, {
              updatedAt: new Date().toISOString(),
              actor: options.actor || 'system',
              cleanup: perTargetResult?.cleanup || null,
            });
          }),
          {
            updatedAt: new Date().toISOString(),
            actor: options.actor || 'system',
          }
        ),
      }
    : syncControlPlaneState(
        {
          ...options,
          repoRoot,
          allInstances: true,
        },
        {
          updatedAt: new Date().toISOString(),
          actor: options.actor || 'system',
          cleanupByTarget,
        }
      );

  return {
    ok: true,
    repoRoot,
    selection: buildSelectionMetadata(options, targets, Boolean(options.allInstances)),
    changed: perTarget.some((entry) => entry.changed),
    targets: perTarget,
    sync: syncResult,
  };
}

function parseArgs(argv) {
  const options = {
    command: 'overview',
    json: false,
    path: '',
    value: '',
    valueType: 'string',
    job: '',
    cron: '',
    tz: '',
    at: '',
    everyMs: null,
    anchorMs: null,
    staggerMs: null,
    dryRun: false,
    actor: '',
    disableFailing: false,
    pruneLaunchValidationDuplicates: true,
    allInstances: false,
    installationId: '',
    instanceId: '',
    stateDir: '',
    repoRoot: '',
    configPath: '',
    cronPath: '',
  };

  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--path') options.path = argv[++i] || '';
    else if (arg === '--value') options.value = argv[++i] || '';
    else if (arg === '--type') options.valueType = argv[++i] || 'string';
    else if (arg === '--job') options.job = argv[++i] || '';
    else if (arg === '--cron') options.cron = argv[++i] || '';
    else if (arg === '--tz') options.tz = argv[++i] || '';
    else if (arg === '--at') options.at = argv[++i] || '';
    else if (arg === '--every-ms') options.everyMs = Number(argv[++i] || '');
    else if (arg === '--anchor-ms') options.anchorMs = Number(argv[++i] || '');
    else if (arg === '--stagger-ms') options.staggerMs = Number(argv[++i] || '');
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--actor') options.actor = argv[++i] || '';
    else if (arg === '--disable-failing') options.disableFailing = true;
    else if (arg === '--keep-launch-validation-duplicates')
      options.pruneLaunchValidationDuplicates = false;
    else if (arg === '--all-instances') options.allInstances = true;
    else if (arg === '--installation') options.installationId = argv[++i] || '';
    else if (arg === '--instance') options.instanceId = argv[++i] || '';
    else if (arg === '--state-dir') options.stateDir = argv[++i] || '';
    else if (arg === '--repo-root') options.repoRoot = argv[++i] || '';
    else if (arg === '--config-path') options.configPath = argv[++i] || '';
    else if (arg === '--cron-path') options.cronPath = argv[++i] || '';
    else if (arg === '-h' || arg === '--help') options.command = 'help';
    else positional.push(arg);
  }

  if (positional.length > 0) {
    options.command = positional[0];
  }
  if (!options.path && positional.length > 1) {
    options.path = positional[1];
  }
  if (!options.value && positional.length > 2) {
    options.value = positional[2];
  }
  if (!options.job && positional.length > 1 && options.command.startsWith('cron-')) {
    options.job = positional[1];
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  node scripts/openclaw/tnf-openclaw-control.cjs instances [--json]
  node scripts/openclaw/tnf-openclaw-control.cjs overview [--json] [--all-instances|--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs config-show [--path <dot.path>] [--json] [--all-instances|--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs config-set <path> <value> [--type string|number|boolean|json|null] [--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs config-unset <path> [--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs cron-list [--json] [--all-instances|--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs cron-enable <job> [--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs cron-disable <job> [--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs cron-schedule <job> (--cron <expr> [--tz <tz>] [--stagger-ms <ms>] | --every-ms <ms> [--anchor-ms <ms>] | --at <iso>) [--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs sync-control-plane [--json] [--actor <id>] [--all-instances|--installation <id> --instance <id>]
  node scripts/openclaw/tnf-openclaw-control.cjs cleanup-cron [--json] [--actor <id>] [--disable-failing] [--dry-run] [--all-instances|--installation <id> --instance <id>]

Options:
  --all-instances       Target every discovered OpenClaw instance
  --installation <id>   Installation id from openclaw-installations.registry.json
  --instance <id>       Instance/profile id within an installation
  --state-dir <path>    Ad hoc OpenClaw state root when not using the registry
  --config-path <path>  Override OpenClaw config path (default: ~/.openclaw/openclaw.json)
  --cron-path <path>    Override OpenClaw cron path (default: ~/.openclaw/cron/jobs.json)
  --repo-root <path>    Override TNF repo root used for schedule mapping
  --actor <id>          Actor id recorded in TNF control-plane sync metadata
  --disable-failing     Disable TNF-managed OpenClaw cron jobs currently in error state
  --dry-run             Compute mutations without writing OpenClaw cron files`);
}

function printResult(payload, asJson) {
  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(JSON.stringify(payload, null, 2));
}

function runCli(argv) {
  const options = parseArgs(argv);
  if (options.command === 'help') {
    printUsage();
    return { ok: true, help: true };
  }

  const repoRoot = resolveRepoRoot(options.repoRoot);
  const legacyMap = loadLegacyScheduleMap(repoRoot);

  if (options.command === 'instances') {
    const discovery = listOpenClawTargets({ repoRoot });
    const result = {
      ok: true,
      repoRoot,
      registryPath: getInstallationsRegistryPath(repoRoot),
      installations: discovery.installations,
      instances: discovery.instances,
    };
    printResult(result, options.json || true);
    return result;
  }

  if (options.command === 'overview') {
    const { allInstances, targets } = getTargetsForRead(options, true);
    const targetResults = targets.map((target) => {
      const config = readJson(target.configPath, {});
      const cron = readJson(target.cronPath, { jobs: [] });
      return {
        ...buildTargetSummary(target),
        overview: buildOverview(config, Array.isArray(cron.jobs) ? cron.jobs : [], legacyMap),
      };
    });
    const result = {
      ok: true,
      repoRoot,
      registryPath: getInstallationsRegistryPath(repoRoot),
      selection: buildSelectionMetadata(options, targets, allInstances),
      summary: {
        installationCount: new Set(targetResults.map((target) => target.installationId)).size,
        instanceCount: targetResults.length,
        totalJobs: targetResults.reduce(
          (sum, target) => sum + Number(target.overview.cron.totalJobs || 0),
          0
        ),
      },
      targets: targetResults,
    };
    printResult(result, options.json || true);
    return result;
  }

  if (options.command === 'config-show') {
    const { allInstances, targets } = getTargetsForRead(options, Boolean(options.allInstances));
    const values = targets.map((target) => {
      const config = readJson(target.configPath, {});
      const value = options.path ? getValueAtPath(config, options.path) : config;
      return {
        ...buildTargetSummary(target),
        path: options.path || null,
        value: redactValue(value),
      };
    });
    const result = {
      ok: true,
      selection: buildSelectionMetadata(options, targets, allInstances),
      targets: values,
    };
    printResult(result, options.json || true);
    return result;
  }

  if (options.command === 'config-set') {
    const target = resolveOpenClawTarget({
      repoRoot,
      installationId: options.installationId,
      instanceId: options.instanceId,
      stateDir: options.stateDir,
      configPath: options.configPath,
      cronPath: options.cronPath,
    });
    const config = readJson(target.configPath, {});
    const value = parseTypedValue(options.value, options.valueType);
    setValueAtPath(config, options.path, value);
    atomicWriteJson(target.configPath, config);
    const result = {
      ok: true,
      ...buildTargetSummary(target),
      path: options.path,
      value: redactValue(getValueAtPath(config, options.path)),
    };
    printResult(result, true);
    return result;
  }

  if (options.command === 'config-unset') {
    const target = resolveOpenClawTarget({
      repoRoot,
      installationId: options.installationId,
      instanceId: options.instanceId,
      stateDir: options.stateDir,
      configPath: options.configPath,
      cronPath: options.cronPath,
    });
    const config = readJson(target.configPath, {});
    const removed = unsetValueAtPath(config, options.path);
    atomicWriteJson(target.configPath, config);
    const result = {
      ok: true,
      ...buildTargetSummary(target),
      path: options.path,
      removed,
    };
    printResult(result, true);
    return result;
  }

  if (options.command === 'cron-list') {
    const { allInstances, targets } = getTargetsForRead(options, true);
    let totalJobs = 0;
    const targetResults = targets.map((target) => {
      const cron = readJson(target.cronPath, { jobs: [] });
      const jobs = Array.isArray(cron.jobs) ? cron.jobs : [];
      const summarized = jobs.map((job) => summarizeCronJob(job, legacyMap));
      totalJobs += jobs.length;
      return {
        ...buildTargetSummary(target),
        total: jobs.length,
        jobs: summarized,
      };
    });
    const result = {
      ok: true,
      selection: buildSelectionMetadata(options, targets, allInstances),
      total: totalJobs,
      targets: targetResults,
    };
    printResult(result, options.json || true);
    return result;
  }

  if (options.command === 'cron-enable' || options.command === 'cron-disable') {
    const target = resolveOpenClawTarget({
      repoRoot,
      installationId: options.installationId,
      instanceId: options.instanceId,
      stateDir: options.stateDir,
      configPath: options.configPath,
      cronPath: options.cronPath,
    });
    const cron = readJson(target.cronPath, { version: 1, jobs: [] });
    const job = findCronJob(cron, options.job);
    job.enabled = options.command === 'cron-enable';
    atomicWriteJson(target.cronPath, cron);
    const result = {
      ok: true,
      ...buildTargetSummary(target),
      job: summarizeCronJob(job, legacyMap),
    };
    printResult(result, true);
    return result;
  }

  if (options.command === 'cron-schedule') {
    const target = resolveOpenClawTarget({
      repoRoot,
      installationId: options.installationId,
      instanceId: options.instanceId,
      stateDir: options.stateDir,
      configPath: options.configPath,
      cronPath: options.cronPath,
    });
    const cron = readJson(target.cronPath, { version: 1, jobs: [] });
    const job = findCronJob(cron, options.job);
    job.schedule = formatScheduleMutation(options);
    atomicWriteJson(target.cronPath, cron);
    const result = {
      ok: true,
      ...buildTargetSummary(target),
      job: summarizeCronJob(job, legacyMap),
    };
    printResult(result, true);
    return result;
  }

  if (options.command === 'sync-control-plane') {
    const result = syncControlPlaneState(options);
    printResult(result, options.json || true);
    return result;
  }

  if (options.command === 'cleanup-cron') {
    const result = cleanupCronJobs(options);
    printResult(result, options.json || true);
    return result;
  }

  throw new Error(`Unknown command: ${options.command}`);
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error.message || String(error),
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

module.exports = {
  redactValue,
  buildOverview,
  getValueAtPath,
  setValueAtPath,
  unsetValueAtPath,
  parseTypedValue,
  summarizeCronJob,
  formatScheduleMutation,
  buildOpenClawInstanceSnapshot,
  buildOpenClawIntegrationSnapshot,
  readControlPlaneState,
  syncControlPlaneState,
  cleanupCronJobs,
  runCli,
};
