const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_INSTALLATIONS_REGISTRY_RELATIVE_PATH = path.join(
  'data',
  'protocols',
  'openclaw-installations.registry.json'
);

function expandHome(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
  return inputPath;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function resolveRepoRoot(explicitRoot) {
  if (explicitRoot) return path.resolve(explicitRoot);
  const marker = path.join('data', 'protocols', 'chronological-process-catalog.json');
  let current = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(current, marker))) return current;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function getInstallationsRegistryPath(repoRoot) {
  return path.join(repoRoot, DEFAULT_INSTALLATIONS_REGISTRY_RELATIVE_PATH);
}

function normalizeInstallationsRegistry(payload) {
  const parsed = payload && typeof payload === 'object' ? payload : {};
  return {
    spec: parsed.spec || 'tnf/openclaw-installations-registry/0.1',
    generated_at: parsed.generated_at || new Date(0).toISOString(),
    installations: parsed.installations && typeof parsed.installations === 'object'
      ? parsed.installations
      : {},
  };
}

function readInstallationsRegistry(repoRoot) {
  return normalizeInstallationsRegistry(readJson(getInstallationsRegistryPath(repoRoot), {}));
}

function toProfileNameFromDirName(dirName) {
  if (dirName === '.openclaw') return 'main';
  if (dirName.startsWith('.openclaw-')) return dirName.slice('.openclaw-'.length) || 'main';
  return dirName.replace(/^\./, '') || 'main';
}

function toTitleCase(input) {
  return String(input || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function normalizeInstanceRecord(installationId, installation, instanceId, instance, source) {
  const profile = String(instance.profile || instanceId || 'main');
  const stateDir = path.resolve(expandHome(instance.stateDir || ''));
  const configPath = path.resolve(
    expandHome(instance.configPath || path.join(stateDir, 'openclaw.json'))
  );
  const cronPath = path.resolve(
    expandHome(instance.cronPath || path.join(stateDir, 'cron', 'jobs.json'))
  );
  return {
    targetId: `${installationId}:${instanceId}`,
    installationId,
    installationLabel: installation.label || installation.title || installationId,
    installationTransport: installation.transport || 'local_filesystem',
    installationBinaryPath: installation.binaryPath || 'openclaw',
    installationHost: installation.host || 'localhost',
    instanceId,
    instanceLabel: instance.label || toTitleCase(profile),
    profile,
    stateDir,
    configPath,
    cronPath,
    exists: fs.existsSync(stateDir),
    default: Boolean(instance.default),
    source,
  };
}

function buildDefaultLocalInstallation() {
  return {
    label: 'Local OpenClaw CLI',
    transport: 'local_filesystem',
    binaryPath: 'openclaw',
    host: 'localhost',
    discovery: {
      includeHomeProfiles: true,
    },
    instances: {
      main: {
        label: 'Main',
        profile: 'main',
        stateDir: '~/.openclaw',
        default: true,
      },
    },
  };
}

function discoverHomeProfileInstances(homeDir) {
  const results = {};
  let entries = [];
  try {
    entries = fs.readdirSync(homeDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name !== '.openclaw' && !entry.name.startsWith('.openclaw-')) continue;
    const profile = toProfileNameFromDirName(entry.name);
    results[profile] = {
      label: profile === 'main' ? 'Main' : toTitleCase(profile),
      profile,
      stateDir: path.join(homeDir, entry.name),
      default: profile === 'main',
    };
  }

  return results;
}

function listOpenClawTargets(options = {}) {
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const registry = readInstallationsRegistry(repoRoot);
  const homeDir = os.homedir();
  const installations = {
    'local-openclaw-cli': buildDefaultLocalInstallation(),
    ...registry.installations,
  };

  const normalizedInstallations = {};
  const instances = [];

  for (const [installationId, rawInstallation] of Object.entries(installations)) {
    const installation = {
      label: rawInstallation.label || rawInstallation.title || installationId,
      transport: rawInstallation.transport || 'local_filesystem',
      binaryPath: rawInstallation.binaryPath || 'openclaw',
      host: rawInstallation.host || 'localhost',
      discovery: rawInstallation.discovery || {},
      instances:
        rawInstallation.instances && typeof rawInstallation.instances === 'object'
          ? rawInstallation.instances
          : {},
    };

    const mergedInstances = {};
    if (installation.discovery.includeHomeProfiles !== false && installationId === 'local-openclaw-cli') {
      Object.assign(mergedInstances, discoverHomeProfileInstances(homeDir));
    }
    Object.assign(mergedInstances, installation.instances);

    normalizedInstallations[installationId] = {
      installationId,
      label: installation.label,
      transport: installation.transport,
      binaryPath: installation.binaryPath,
      host: installation.host,
      discovery: installation.discovery,
      instanceIds: [],
    };

    for (const [instanceId, rawInstance] of Object.entries(mergedInstances)) {
      const source = installation.instances[instanceId] ? 'registry' : 'discovered';
      const normalized = normalizeInstanceRecord(
        installationId,
        installation,
        instanceId,
        rawInstance,
        source
      );
      normalizedInstallations[installationId].instanceIds.push(instanceId);
      instances.push(normalized);
    }

    normalizedInstallations[installationId].instanceIds.sort();
  }

  instances.sort((a, b) => a.targetId.localeCompare(b.targetId));

  return {
    repoRoot,
    registryPath: getInstallationsRegistryPath(repoRoot),
    installations: normalizedInstallations,
    instances,
  };
}

function resolveOpenClawTargets(options = {}) {
  if (options.stateDir) {
    const stateDir = path.resolve(expandHome(options.stateDir));
    return [
      {
        targetId: `adhoc:${stateDir}`,
        installationId: options.installationId || 'adhoc',
        installationLabel: options.installationLabel || 'Ad Hoc OpenClaw Target',
        installationTransport: 'local_filesystem',
        installationBinaryPath: options.binaryPath || 'openclaw',
        installationHost: 'localhost',
        instanceId: options.instanceId || path.basename(stateDir).replace(/^\./, '') || 'adhoc',
        instanceLabel: options.instanceLabel || path.basename(stateDir),
        profile: options.instanceId || path.basename(stateDir).replace(/^\./, '') || 'adhoc',
        stateDir,
        configPath: path.resolve(
          expandHome(options.configPath || path.join(stateDir, 'openclaw.json'))
        ),
        cronPath: path.resolve(
          expandHome(options.cronPath || path.join(stateDir, 'cron', 'jobs.json'))
        ),
        exists: fs.existsSync(stateDir),
        default: false,
        source: 'adhoc',
      },
    ];
  }

  const discovery = listOpenClawTargets(options);
  let targets = discovery.instances.slice();

  if (options.installationId) {
    targets = targets.filter((target) => target.installationId === options.installationId);
  }

  if (options.instanceId) {
    targets = targets.filter((target) => target.instanceId === options.instanceId);
  }

  if (options.allInstances) {
    return targets;
  }

  if (targets.length === 0) return [];

  const explicitSelection = Boolean(options.installationId || options.instanceId);
  if (explicitSelection) {
    if (targets.length > 1) {
      throw new Error(
        `Target selection is ambiguous. Provide --installation and --instance together. Matches: ${targets
          .map((target) => target.targetId)
          .join(', ')}`
      );
    }
    return targets;
  }

  const defaultTarget = targets.find((target) => target.default) || targets[0];
  return defaultTarget ? [defaultTarget] : [];
}

function resolveOpenClawTarget(options = {}) {
  const targets = resolveOpenClawTargets(options);
  if (targets.length === 0) {
    throw new Error('No OpenClaw instance target found');
  }
  if (targets.length > 1) {
    throw new Error(
      `Expected one OpenClaw instance target but resolved ${targets.length}: ${targets
        .map((target) => target.targetId)
        .join(', ')}`
    );
  }
  return targets[0];
}

module.exports = {
  DEFAULT_INSTALLATIONS_REGISTRY_RELATIVE_PATH,
  expandHome,
  getInstallationsRegistryPath,
  listOpenClawTargets,
  normalizeInstallationsRegistry,
  readInstallationsRegistry,
  resolveOpenClawTarget,
  resolveOpenClawTargets,
  resolveRepoRoot,
  toProfileNameFromDirName,
};
