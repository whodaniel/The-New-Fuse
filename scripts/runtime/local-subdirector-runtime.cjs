#!/usr/bin/env node

const { createHash } = require('crypto');
const { execFile } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const KNOWN_SHELLS = new Set(['bash', 'fish', 'sh', 'zsh']);
const AGENT_COMMAND_HINTS = ['codex', 'claude', 'gemini', 'goose', 'aider'];
const defaultStaffopsRoot = resolveStaffopsRoot();

const config = {
  actorId: process.env.LOCAL_SUBDIRECTOR_ACTOR_ID || 'tnf-local-subdirector',
  intervalMs: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_INTERVAL_MS, 30000),
  stallThresholdMs: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_STALL_THRESHOLD_MS, 180000),
  idleThresholdMs: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_IDLE_THRESHOLD_MS, 300000),
  maxCycles: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_MAX_CYCLES, 0),
  wakePingCooldownMs: parsePositiveInt(
    process.env.LOCAL_SUBDIRECTOR_WAKE_PING_COOLDOWN_MS,
    120000
  ),
  contentTailChars: parsePositiveInt(process.env.LOCAL_SUBDIRECTOR_CONTENT_TAIL_CHARS, 4000),
  relayUrl: process.env.LOCAL_SUBDIRECTOR_RELAY_URL || 'ws://localhost:3000/ws',
  relayChannel: process.env.LOCAL_SUBDIRECTOR_RELAY_CHANNEL || 'fuse-activity-log',
  relayOutboxDir: process.env.LOCAL_SUBDIRECTOR_RELAY_OUTBOX_DIR || '/tmp/thefuse/terminal',
  staffopsRootDir: process.env.LOCAL_SUBDIRECTOR_STAFFOPS_ROOT_DIR || defaultStaffopsRoot,
  quotaThresholdPercent: parsePercent(
    process.env.LOCAL_SUBDIRECTOR_QUOTA_THRESHOLD_PERCENT,
    10
  ),
  quotaHandoffCooldownMs: parsePositiveInt(
    process.env.LOCAL_SUBDIRECTOR_QUOTA_HANDOFF_COOLDOWN_MS,
    900000
  ),
  quotaProbeCommand: String(process.env.LOCAL_SUBDIRECTOR_QUOTA_PROBE_COMMAND || '').trim(),
  llmApiRunnerAgentId:
    process.env.LOCAL_SUBDIRECTOR_LLM_API_RUNNER_AGENT_ID || 'tnf-staffops-llm-api-runner-01',
  identityRegistryPath:
    process.env.LOCAL_SUBDIRECTOR_IDENTITY_REGISTRY_PATH ||
    path.join(os.homedir(), '.tnf', 'session-discovery', 'terminal-identity-registry.json'),
  roleMapPath:
    process.env.LOCAL_SUBDIRECTOR_ROLE_MAP_PATH ||
    path.join(os.homedir(), '.tnf', 'session-discovery', 'terminal-role-map.json'),
  ownerAgentId: String(process.env.LOCAL_SUBDIRECTOR_OWNER_AGENT_ID || '').trim() || null,
  ownerTty: String(process.env.LOCAL_SUBDIRECTOR_OWNER_TTY || '').trim() || null,
  stateDir:
    process.env.LOCAL_SUBDIRECTOR_STATE_DIR ||
    path.join(os.homedir(), '.tnf', 'local-subdirector', 'state'),
  staffopsPolicyPath:
    process.env.LOCAL_SUBDIRECTOR_STAFFOPS_POLICY_PATH ||
    path.join(defaultStaffopsRoot, 'data', 'staffops', 'staffops-role-policy.json'),
  providerCatalogPath:
    process.env.LOCAL_SUBDIRECTOR_PROVIDER_CATALOG_PATH ||
    path.join(defaultStaffopsRoot, 'data', 'staffops', 'llm-provider-catalog.json'),
  quotaStateTemplatePath:
    process.env.LOCAL_SUBDIRECTOR_QUOTA_STATE_TEMPLATE_PATH ||
    path.join(defaultStaffopsRoot, 'data', 'staffops', 'llm-quota-state.template.json'),
  quotaStatePath:
    process.env.LOCAL_SUBDIRECTOR_QUOTA_STATE_PATH ||
    path.join(defaultStaffopsRoot, 'data', 'staffops', 'llm-quota-state.json'),
  llmRoutingLedgerPath:
    process.env.LOCAL_SUBDIRECTOR_LLM_ROUTING_LEDGER_PATH ||
    path.join(defaultStaffopsRoot, 'logs', 'staffops-llm-routing.jsonl'),
};

const state = new Map();
let cycle = 0;
let loopTimer = null;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePercent(value, fallback) {
  const parsed = Number.parseFloat(String(value || ''));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, parsed));
}

function resolveStaffopsRoot() {
  const candidates = [
    process.env.LOCAL_SUBDIRECTOR_STAFFOPS_ROOT_DIR,
    path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse'),
    process.cwd(),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (
      fs.existsSync(path.join(candidate, 'docs', 'operations')) &&
      fs.existsSync(path.join(candidate, 'data'))
    ) {
      return candidate;
    }
  }
  return path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse');
}

function normalizeTty(tty) {
  return String(tty || '').replace(/^\/dev\//, '');
}

function normalizeTtyPath(tty) {
  const normalized = normalizeTty(tty);
  return normalized ? `/dev/${normalized}` : null;
}

function getSessionKey(terminal) {
  return terminal.tty ? `tty:${normalizeTty(terminal.tty)}` : `window:${terminal.windowId}`;
}

function getAgentId(terminal) {
  const raw = terminal.tty ? normalizeTty(terminal.tty) : `window-${terminal.windowId}`;
  return `tnf-local-terminal-${raw.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function hashSignature(payload) {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

function isAgentCommand(commandName, args) {
  const haystack = `${commandName || ''} ${args || ''}`.toLowerCase();
  return AGENT_COMMAND_HINTS.some((hint) => haystack.includes(hint));
}

function isAgentLike(foregroundCommand, foregroundArgs, contentsTail) {
  const haystacks = [
    String(foregroundCommand || '').toLowerCase(),
    String(foregroundArgs || '').toLowerCase(),
    String(contentsTail || '').toLowerCase(),
  ];
  return AGENT_COMMAND_HINTS.some((hint) => haystacks.some((value) => value.includes(hint)));
}

function isInteractiveReady(contentsTail) {
  const haystack = String(contentsTail || '').toLowerCase();
  if (!haystack) return false;
  return [
    'type your message or @path/to/file',
    'summarize recent commits',
    'improve documentation in @filename',
    'write tests for @filename',
    'use /skills to list available skills',
    '? for shortcuts',
    'context left',
    'interactive shell awaiting input',
    'tab to focus',
    'tab to queue message',
  ].some((hint) => haystack.includes(hint));
}

function classifyStatus({ agentLike, busy, activityAgeMs, interactiveReady }) {
  if (!agentLike) return 'observed';
  if (interactiveReady) return 'active';
  if (busy && activityAgeMs >= config.stallThresholdMs) return 'stalled';
  if (busy || activityAgeMs < config.idleThresholdMs) return 'active';
  return 'idle';
}

async function ensureDirectories() {
  await fsp.mkdir(config.stateDir, { recursive: true });
  await fsp.mkdir(config.relayOutboxDir, { recursive: true });
  await fsp.mkdir(path.dirname(config.identityRegistryPath), { recursive: true });
  await fsp.mkdir(path.dirname(config.roleMapPath), { recursive: true });
  await fsp.mkdir(path.dirname(config.quotaStatePath), { recursive: true });
  await fsp.mkdir(path.dirname(config.llmRoutingLedgerPath), { recursive: true });
}

function resolvePath(fileName) {
  return path.join(config.stateDir, fileName);
}

async function writeHeartbeat(payload) {
  await fsp.writeFile(resolvePath('local-subdirector-heartbeat.json'), JSON.stringify(payload, null, 2));
  await fsp.writeFile(resolvePath('local-subdirector-heartbeat.md'), buildMarkdown(payload));
}

async function writeIdentityRegistry(payload) {
  await fsp.writeFile(config.identityRegistryPath, JSON.stringify(payload, null, 2));
}

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_error) {
    return fallback;
  }
}

function loadRoleMap() {
  return readJsonFile(config.roleMapPath, {
    schemaVersion: 'tnf-terminal-role-map/v1',
    owner: {},
    aliases: {},
  });
}

function loadIdentityRegistry() {
  const parsed = readJsonFile(config.identityRegistryPath, null);
  if (!parsed) {
    return {
      schemaVersion: 'tnf-terminal-identity-registry/v1',
      counter: 0,
      sessions: {},
    };
  }
  return {
    schemaVersion: parsed.schemaVersion || 'tnf-terminal-identity-registry/v1',
    counter: Number.isFinite(Number(parsed.counter)) ? Number(parsed.counter) : 0,
    sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
  };
}

function defaultStaffopsPolicy() {
  return {
    schemaVersion: 'tnf-staffops-role-policy/v1',
    allowedActorIds: ['tnf-local-subdirector', 'tnf-staffops-local-subdirector-01'],
    allowedActorPatterns: ['tnf-staffops-*'],
    resources: {
      'data/staffops/llm-provider-catalog.json': {
        read: ['tnf-local-subdirector', 'tnf-staffops-*'],
        write: ['tnf-staffops-*'],
      },
      'data/staffops/llm-provider-test-results.json': {
        read: ['tnf-local-subdirector', 'tnf-staffops-*'],
        write: ['tnf-staffops-*'],
      },
      'data/staffops/llm-quota-state.json': {
        read: ['tnf-local-subdirector', 'tnf-staffops-*'],
        write: ['tnf-local-subdirector', 'tnf-staffops-*'],
      },
      'logs/staffops-llm-routing.jsonl': {
        read: ['tnf-local-subdirector', 'tnf-staffops-*'],
        write: ['tnf-local-subdirector', 'tnf-staffops-*'],
      },
    },
  };
}

function loadStaffopsPolicy() {
  return readJsonFile(config.staffopsPolicyPath, defaultStaffopsPolicy());
}

function actorMatchesPattern(actorId, pattern) {
  const normalized = String(pattern || '').trim();
  if (!normalized) return false;
  if (normalized.endsWith('*')) {
    return actorId.startsWith(normalized.slice(0, -1));
  }
  return actorId === normalized;
}

function isActorAllowed(actorId, patterns = []) {
  return patterns.some((pattern) => actorMatchesPattern(actorId, pattern));
}

function relativePathFromStaffopsRoot(filePath) {
  const rel = path.relative(config.staffopsRootDir, filePath);
  if (rel.startsWith('..')) {
    return String(filePath || '').replace(/\\/g, '/');
  }
  return rel.replace(/\\/g, '/');
}

function isStaffopsAccessAllowed(actorId, action, filePath, policy) {
  const resolvedPolicy = policy && typeof policy === 'object' ? policy : defaultStaffopsPolicy();
  const actorPatterns = [
    ...(Array.isArray(resolvedPolicy.allowedActorIds) ? resolvedPolicy.allowedActorIds : []),
    ...(Array.isArray(resolvedPolicy.allowedActorPatterns)
      ? resolvedPolicy.allowedActorPatterns
      : []),
  ];
  if (!isActorAllowed(actorId, actorPatterns)) {
    return false;
  }

  const relPath = relativePathFromStaffopsRoot(filePath);
  const resourceRule =
    resolvedPolicy?.resources && typeof resolvedPolicy.resources === 'object'
      ? resolvedPolicy.resources[relPath]
      : null;
  if (!resourceRule) {
    return true;
  }
  const actionPatterns = Array.isArray(resourceRule[action]) ? resourceRule[action] : [];
  if (actionPatterns.length === 0) {
    return false;
  }
  return isActorAllowed(actorId, actionPatterns);
}

async function ensureQuotaStateInitialized() {
  if (fs.existsSync(config.quotaStatePath)) {
    return;
  }
  const fromTemplate = readJsonFile(config.quotaStateTemplatePath, null);
  const baseState =
    fromTemplate ||
    {
      schemaVersion: 'tnf-staffops-llm-quota-state/v1',
      visibility: 'staffops-only',
      generatedAt: new Date().toISOString(),
      agents: {},
    };
  await fsp.writeFile(config.quotaStatePath, JSON.stringify(baseState, null, 2));
}

async function appendJsonl(filePath, payload) {
  await fsp.appendFile(filePath, `${JSON.stringify(payload)}\n`);
}

function parseContextLeftPercent(contentsTail) {
  const text = String(contentsTail || '');
  const regex = /(\d{1,3})%\s+context left/gi;
  let match;
  let lastPercent = null;
  while ((match = regex.exec(text)) !== null) {
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isFinite(parsed)) {
      lastPercent = Math.max(0, Math.min(100, parsed));
    }
  }
  return lastPercent;
}

function parseQuotaProbeStdout(stdout) {
  const trimmed = String(stdout || '').trim();
  if (!trimmed) return null;

  if (/^-?[0-9]+([.][0-9]+)?$/.test(trimmed)) {
    return {
      quotaRemainingPercent: parsePercent(trimmed, null),
      providerId: null,
      source: 'quota-probe-command:number',
    };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const quotaRemainingPercent = parsePercent(parsed?.quotaRemainingPercent, null);
    if (!Number.isFinite(quotaRemainingPercent)) {
      return null;
    }
    return {
      quotaRemainingPercent,
      providerId: String(parsed?.providerId || '').trim() || null,
      source: 'quota-probe-command:json',
    };
  } catch (_error) {
    return null;
  }
}

async function runQuotaProbeCommand() {
  if (!config.quotaProbeCommand) {
    return null;
  }
  try {
    const { stdout } = await execFileAsync('bash', ['-lc', config.quotaProbeCommand], {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
    return parseQuotaProbeStdout(stdout);
  } catch (error) {
    console.warn(`[local-subdirector] quota probe command failed: ${String(error.message || error)}`);
    return null;
  }
}

async function detectQuotaState(ownerSession, ownerContentsTail) {
  const commandProbe = await runQuotaProbeCommand();
  if (commandProbe && Number.isFinite(commandProbe.quotaRemainingPercent)) {
    return {
      quotaRemainingPercent: commandProbe.quotaRemainingPercent,
      source: commandProbe.source,
      providerId: commandProbe.providerId || null,
      ownerAgentId: ownerSession?.agentId || null,
    };
  }

  const contextLeftPercent = parseContextLeftPercent(ownerContentsTail);
  if (Number.isFinite(contextLeftPercent)) {
    return {
      quotaRemainingPercent: contextLeftPercent,
      source: 'owner-terminal-context-left',
      providerId: null,
      ownerAgentId: ownerSession?.agentId || null,
    };
  }

  return {
    quotaRemainingPercent: null,
    source: ownerSession ? 'no-quota-signal' : 'no-owner-session',
    providerId: null,
    ownerAgentId: ownerSession?.agentId || null,
  };
}

function selectPreferredProvider(catalog) {
  const providers = Array.isArray(catalog?.providers) ? catalog.providers : [];
  const enabled = providers.filter((provider) => provider && provider.enabled !== false);
  if (enabled.length === 0) {
    return null;
  }
  const tierRank = (tier) => {
    if (tier === 'free-oauth') return 0;
    if (tier === 'approved-paid') return 1;
    return 2;
  };
  const sorted = enabled.sort((left, right) => {
    const tierDiff = tierRank(left.tier) - tierRank(right.tier);
    if (tierDiff !== 0) return tierDiff;
    const leftPriority = Number.isFinite(Number(left.priority)) ? Number(left.priority) : 9999;
    const rightPriority = Number.isFinite(Number(right.priority)) ? Number(right.priority) : 9999;
    return leftPriority - rightPriority;
  });
  return sorted[0];
}

function asRoleAliasMap(roleMap) {
  if (roleMap?.aliases && typeof roleMap.aliases === 'object') {
    return roleMap.aliases;
  }
  return {};
}

function resolveRoleAssignment(agentId, tty, roleMap) {
  const aliases = asRoleAliasMap(roleMap);
  const ttyPath = normalizeTtyPath(tty);
  const aliasEntry =
    aliases[agentId] ||
    (ttyPath ? aliases[ttyPath] : null) ||
    aliases[normalizeTty(tty)] ||
    null;

  const ownerAgentId =
    config.ownerAgentId ||
    String(roleMap?.owner?.agentId || '').trim() ||
    null;
  const ownerTtyPath = normalizeTtyPath(config.ownerTty || roleMap?.owner?.tty || '');

  const isOwner =
    (ownerAgentId && agentId === ownerAgentId) ||
    (ownerTtyPath && ttyPath && ownerTtyPath === ttyPath) ||
    String(aliasEntry?.alias || '').trim() === 'local-subdirector-owner' ||
    String(aliasEntry?.role || '').trim() === 'local-subdirector-owner';

  const roleTags = Array.isArray(aliasEntry?.tags)
    ? aliasEntry.tags.map((tag) => String(tag))
    : [];

  if (isOwner && !roleTags.includes('local-subdirector-owner')) {
    roleTags.push('local-subdirector-owner');
  }

  return {
    roleAlias: String(aliasEntry?.alias || aliasEntry?.role || '').trim() || null,
    roleTags,
    isLocalSubdirectorOwner: Boolean(isOwner),
  };
}

function assignTempTnfId(identityRegistry) {
  const next = Number(identityRegistry.counter || 0) + 1;
  identityRegistry.counter = next;
  return `tnf-temp-${String(next).padStart(4, '0')}`;
}

function buildMarkdown(payload) {
  const lines = [
    '# Local Terminal Sub-Director Heartbeat',
    '',
    `Generated: ${payload.generatedAt}`,
    `Actor: ${payload.actor.id}`,
    `Status: ${payload.status}`,
    `Cycle: ${payload.cycle}`,
    '',
    '## Summary',
    '',
    `- Observed sessions: ${payload.summary.observedSessions}`,
    `- Agent sessions: ${payload.summary.agentSessions}`,
    `- Active: ${payload.summary.activeSessions}`,
    `- Idle: ${payload.summary.idleSessions}`,
    `- Stalled: ${payload.summary.stalledSessions}`,
    `- Local Sub-Director owners: ${payload.summary.localSubdirectorOwners || 0}`,
    `- Wake pings emitted: ${payload.summary.wakePingsEmitted}`,
    '',
    '## Functional Gaps',
    '',
    ...payload.functionalGaps.map((gap) => `- ${gap}`),
    '',
    '## Recommendations',
    '',
    ...payload.recommendations.map((item) => `- ${item}`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function pollTerminalWindows(contentTailChars) {
  if (process.platform !== 'darwin') return [];

  const script = `
    const Terminal = Application('Terminal');
    const windows = [];
    Terminal.windows().forEach((window) => {
      try {
        const tab = window.selectedTab();
        const contents = String(tab.contents() || '');
        windows.push({
          windowId: Number(window.id()),
          tty: String(tab.tty() || '') || null,
          busy: Boolean(tab.busy()),
          customTitle: String(tab.customTitle() || '') || null,
          contentsTail: contents.length > ${contentTailChars} ? contents.slice(-${contentTailChars}) : contents
        });
      } catch (_error) {}
    });
    JSON.stringify(windows);
  `;

  try {
    const { stdout } = await execFileAsync('osascript', ['-l', 'JavaScript', '-e', script], {
      maxBuffer: 16 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`[local-subdirector] terminal polling failed: ${String(error.message || error)}`);
    return [];
  }
}

async function collectProcessTable() {
  try {
    const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,ppid=,tty=,comm=,args='], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)(?:\s+(.*))?$/);
        if (!match) return null;
        const command = match[4];
        return {
          pid: Number(match[1]),
          ppid: Number(match[2]),
          tty: String(match[3] || ''),
          command,
          commandName: path.basename(command).replace(/^-+/, ''),
          args: String(match[5] || command),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error(`[local-subdirector] process inventory failed: ${String(error.message || error)}`);
    return [];
  }
}

function collectDescendants(rootPid, processTable) {
  const childrenByParent = new Map();
  for (const process of processTable) {
    const bucket = childrenByParent.get(process.ppid) || [];
    bucket.push(process);
    childrenByParent.set(process.ppid, bucket);
  }

  const descendants = [];
  const visit = (pid) => {
    const children = childrenByParent.get(pid) || [];
    for (const child of children) {
      descendants.push(child);
      visit(child.pid);
    }
  };
  visit(rootPid);
  return descendants;
}

function resolveProcessContext(terminal, processTable) {
  const tty = normalizeTty(terminal.tty);
  const ttyProcesses = processTable.filter((process) => normalizeTty(process.tty) === tty);
  const shell = ttyProcesses.find((process) => KNOWN_SHELLS.has(process.commandName)) || null;

  if (!shell) {
    const fallback = ttyProcesses.sort((left, right) => right.pid - left.pid)[0] || null;
    return {
      shellPid: fallback ? fallback.pid : null,
      foregroundPid: fallback ? fallback.pid : null,
      foregroundCommand: fallback ? fallback.commandName : null,
      foregroundArgs: fallback ? fallback.args : null,
    };
  }

  const descendants = collectDescendants(shell.pid, ttyProcesses);
  const preferredForeground =
    descendants.find((process) => isAgentCommand(process.commandName, process.args)) ||
    descendants.sort((left, right) => right.pid - left.pid)[0] ||
    shell;

  return {
    shellPid: shell.pid,
    foregroundPid: preferredForeground.pid,
    foregroundCommand: preferredForeground.commandName,
    foregroundArgs: preferredForeground.args,
  };
}

async function resolveCwd(shellPid) {
  try {
    const { stdout } = await execFileAsync('lsof', ['-a', '-d', 'cwd', '-p', String(shellPid)], {
      maxBuffer: 1024 * 1024,
    });
    const line = stdout
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .find((entry) => /\scwd\s/.test(entry));
    if (!line) return null;
    const match = line.match(/cwd\s+DIR\s+\S+\s+\S+\s+\S+\s+(.+)$/);
    return match ? match[1] : null;
  } catch (_error) {
    return null;
  }
}

async function emitWakePing(nowIso, sessionKey, sessionState, terminal) {
  const previousWakeAt = sessionState.lastWakePingAt
    ? new Date(sessionState.lastWakePingAt).getTime()
    : 0;
  const nowMs = new Date(nowIso).getTime();
  if (previousWakeAt && nowMs - previousWakeAt < config.wakePingCooldownMs) {
    return null;
  }

  const wakeId = `wake-${sessionState.agentId}-${Date.now()}`;
  await publishWakePingToRelay({
    wakeId,
    nowIso,
    sessionKey,
    sessionState,
    terminal,
  });

  const record = {
    id: wakeId,
    createdAt: nowIso,
    targetAgentId: sessionState.agentId,
    sessionKey,
    tty: terminal.tty,
    windowId: terminal.windowId,
    reason: 'stall-watchdog',
    transport: 'relay-ws',
    relayUrl: config.relayUrl,
    relayChannel: config.relayChannel,
  };
  await fsp.appendFile(resolvePath('local-subdirector-wake-events.jsonl'), `${JSON.stringify(record)}\n`);
  return record;
}

async function publishWakePingToRelay({ wakeId, nowIso, sessionKey, sessionState, terminal }) {
  const relayAgentId = `${config.actorId}-relay`;
  const directPayload = {
    type: 'MESSAGE_SEND',
    source: relayAgentId,
    channel: config.relayChannel,
    payload: {
      to: sessionState.agentId,
      content: `[WAKE_PING ${wakeId}] ${sessionState.agentId} stalled on ${sessionKey}`,
      messageType: 'event',
      metadata: {
        senderId: relayAgentId,
        eventType: 'wake_ping',
        pingId: wakeId,
        reason: 'stall-watchdog',
        targetAgentId: sessionState.agentId,
        sessionKey,
        tty: terminal.tty,
        windowId: terminal.windowId,
        sourceActorId: config.actorId,
      },
    },
  };
  const auditPayload = {
    type: 'MESSAGE_SEND',
    source: relayAgentId,
    channel: 'fuse-activity-log',
    payload: {
      to: 'broadcast',
      content: `[WAKE_PING ${wakeId}] ${sessionState.agentId} stalled on ${sessionKey}`,
      messageType: 'event',
      metadata: {
        senderId: relayAgentId,
        eventType: 'wake_ping_dispatched',
        pingId: wakeId,
        reason: 'stall-watchdog',
        targetAgentId: sessionState.agentId,
        sessionKey,
        tty: terminal.tty,
        windowId: terminal.windowId,
        sourceActorId: config.actorId,
        deliveryMode: 'direct',
      },
    },
  };

  await new Promise((resolve, reject) => {
    const socket = new WebSocket(config.relayUrl);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch (_error) {}
      reject(new Error(`relay publish timed out (${config.relayUrl})`));
    }, 5000);

    const finalize = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch (_closeError) {}
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      resolve();
    };

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'AGENT_REGISTER',
          source: relayAgentId,
          payload: {
            agent: {
              id: relayAgentId,
              name: 'Local Sub-Director',
              platform: 'daemon',
              status: 'active',
              capabilities: ['stall-defense', 'wake-publisher'],
              channels: [],
            },
          },
        })
      );
      socket.send(JSON.stringify(directPayload));
      socket.send(JSON.stringify(auditPayload));
      setTimeout(() => finalize(null), 150);
    };

    socket.onerror = (event) => {
      const error = event && typeof event.message === 'string' ? event.message : 'relay socket error';
      finalize(new Error(error));
    };
  });
}

async function publishQuotaHandoffToRelay({
  handoffId,
  nowIso,
  ownerAgentId,
  quotaRemainingPercent,
  selectedProvider,
}) {
  const relayAgentId = `${config.actorId}-relay`;
  const directPayload = {
    type: 'MESSAGE_SEND',
    source: relayAgentId,
    channel: config.relayChannel,
    payload: {
      to: config.llmApiRunnerAgentId,
      content: `TNF quota handoff ${handoffId}: owner=${ownerAgentId || 'unknown'} quota=${quotaRemainingPercent}% threshold=${config.quotaThresholdPercent}% provider=${selectedProvider?.providerId || 'unresolved'}`,
      messageType: 'event',
      metadata: {
        senderId: relayAgentId,
        eventType: 'llm_quota_handoff',
        handoffId,
        sourceActorId: config.actorId,
        ownerAgentId: ownerAgentId || null,
        quotaRemainingPercent,
        thresholdPercent: config.quotaThresholdPercent,
        selectedProviderId: selectedProvider?.providerId || null,
        selectedTier: selectedProvider?.tier || null,
      },
    },
  };

  const auditPayload = {
    type: 'MESSAGE_SEND',
    source: relayAgentId,
    channel: 'fuse-activity-log',
    payload: {
      to: 'broadcast',
      content: `TNF quota handoff ${handoffId}: dispatched to ${config.llmApiRunnerAgentId}`,
      messageType: 'event',
      metadata: {
        senderId: relayAgentId,
        eventType: 'llm_quota_handoff_dispatched',
        handoffId,
        sourceActorId: config.actorId,
        targetAgentId: config.llmApiRunnerAgentId,
        quotaRemainingPercent,
        thresholdPercent: config.quotaThresholdPercent,
        selectedProviderId: selectedProvider?.providerId || null,
        dispatchedAt: nowIso,
      },
    },
  };

  await new Promise((resolve, reject) => {
    const socket = new WebSocket(config.relayUrl);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch (_error) {}
      reject(new Error(`relay publish timed out (${config.relayUrl})`));
    }, 5000);

    const finalize = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch (_closeError) {}
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }
      resolve();
    };

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'AGENT_REGISTER',
          source: relayAgentId,
          payload: {
            agent: {
              id: relayAgentId,
              name: 'Local Sub-Director',
              platform: 'daemon',
              status: 'active',
              capabilities: ['stall-defense', 'wake-publisher', 'quota-handoff'],
              channels: [],
            },
          },
        })
      );
      socket.send(JSON.stringify(directPayload));
      socket.send(JSON.stringify(auditPayload));
      setTimeout(() => finalize(null), 150);
    };

    socket.onerror = (event) => {
      const error = event && typeof event.message === 'string' ? event.message : 'relay socket error';
      finalize(new Error(error));
    };
  });
}

async function maybeTriggerQuotaHandoff({ nowIso, summary, ownerSession, ownerContentsTail }) {
  const policy = loadStaffopsPolicy();
  const aclAllowed = isStaffopsAccessAllowed(
    config.actorId,
    'write',
    config.quotaStatePath,
    policy
  );
  if (!aclAllowed) {
    return {
      quotaRemainingPercent: null,
      quotaSource: 'acl-denied',
      triggered: false,
      reason: 'staffops-acl-denied',
      selectedProviderId: null,
    };
  }

  await ensureQuotaStateInitialized();
  const quotaSnapshot = await detectQuotaState(ownerSession, ownerContentsTail);
  const quotaState = readJsonFile(config.quotaStatePath, {
    schemaVersion: 'tnf-staffops-llm-quota-state/v1',
    visibility: 'staffops-only',
    generatedAt: nowIso,
    agents: {},
  });

  if (!quotaState.agents || typeof quotaState.agents !== 'object') {
    quotaState.agents = {};
  }

  const agentStateKey = ownerSession?.agentId || config.actorId;
  const previousAgentState =
    quotaState.agents[agentStateKey] && typeof quotaState.agents[agentStateKey] === 'object'
      ? quotaState.agents[agentStateKey]
      : {};

  const nextAgentState = {
    ...previousAgentState,
    quotaRemainingPercent: quotaSnapshot.quotaRemainingPercent,
    quotaSource: quotaSnapshot.source,
    ownerAgentId: ownerSession?.agentId || null,
    currentProviderId: quotaSnapshot.providerId || previousAgentState.currentProviderId || null,
    lastCheckedAt: nowIso,
    thresholdPercent: config.quotaThresholdPercent,
    handoffState: 'idle',
  };

  let triggered = false;
  let triggerReason = 'quota-above-threshold-or-missing';
  let selectedProvider = null;
  const nowMs = new Date(nowIso).getTime();
  const lastTriggerMs = previousAgentState.lastHandoffTriggeredAt
    ? new Date(previousAgentState.lastHandoffTriggeredAt).getTime()
    : 0;
  const cooldownElapsed =
    !lastTriggerMs || nowMs - lastTriggerMs >= config.quotaHandoffCooldownMs;
  const hasQuotaSignal = Number.isFinite(quotaSnapshot.quotaRemainingPercent);
  const belowThreshold =
    hasQuotaSignal && quotaSnapshot.quotaRemainingPercent <= config.quotaThresholdPercent;

  if (belowThreshold && cooldownElapsed) {
    const catalog = readJsonFile(config.providerCatalogPath, {
      providers: [],
    });
    selectedProvider = selectPreferredProvider(catalog);
    const handoffId = `llm-handoff-${Date.now()}`;

    try {
      await publishQuotaHandoffToRelay({
        handoffId,
        nowIso,
        ownerAgentId: ownerSession?.agentId || null,
        quotaRemainingPercent: quotaSnapshot.quotaRemainingPercent,
        selectedProvider,
      });
      triggered = true;
      triggerReason = 'quota-threshold-triggered';
      nextAgentState.handoffState = 'triggered';
      nextAgentState.lastHandoffTriggeredAt = nowIso;
      nextAgentState.lastHandoffId = handoffId;
      nextAgentState.lastHandoffTarget = config.llmApiRunnerAgentId;
      nextAgentState.lastHandoffSelectedProviderId = selectedProvider?.providerId || null;
      nextAgentState.lastHandoffQuotaPercent = quotaSnapshot.quotaRemainingPercent;

      const event = {
        timestamp: nowIso,
        event: 'llm_quota_handoff_triggered',
        actorId: config.actorId,
        ownerAgentId: ownerSession?.agentId || null,
        targetAgentId: config.llmApiRunnerAgentId,
        handoffId,
        quotaRemainingPercent: quotaSnapshot.quotaRemainingPercent,
        thresholdPercent: config.quotaThresholdPercent,
        selectedProviderId: selectedProvider?.providerId || null,
        selectedTier: selectedProvider?.tier || null,
      };
      await appendJsonl(config.llmRoutingLedgerPath, event);
      await appendJsonl(resolvePath('local-subdirector-quota-events.jsonl'), event);
    } catch (error) {
      triggerReason = `quota-threshold-dispatch-failed:${String(error.message || error)}`;
      nextAgentState.handoffState = 'dispatch-failed';
      nextAgentState.lastHandoffFailureAt = nowIso;
      nextAgentState.lastHandoffFailure = String(error.message || error);
      const event = {
        timestamp: nowIso,
        event: 'llm_quota_handoff_failed',
        actorId: config.actorId,
        ownerAgentId: ownerSession?.agentId || null,
        targetAgentId: config.llmApiRunnerAgentId,
        quotaRemainingPercent: quotaSnapshot.quotaRemainingPercent,
        thresholdPercent: config.quotaThresholdPercent,
        error: String(error.message || error),
      };
      await appendJsonl(config.llmRoutingLedgerPath, event);
      await appendJsonl(resolvePath('local-subdirector-quota-events.jsonl'), event);
    }
  } else if (belowThreshold && !cooldownElapsed) {
    triggerReason = 'quota-below-threshold-cooldown-active';
    nextAgentState.handoffState = previousAgentState.handoffState || 'cooldown';
  } else if (hasQuotaSignal) {
    triggerReason = 'quota-healthy';
    nextAgentState.handoffState = 'idle';
  } else {
    triggerReason = quotaSnapshot.source;
    nextAgentState.handoffState = 'no-signal';
  }

  quotaState.generatedAt = nowIso;
  quotaState.generatedBy = config.actorId;
  quotaState.agents[agentStateKey] = nextAgentState;
  await fsp.writeFile(config.quotaStatePath, JSON.stringify(quotaState, null, 2));

  return {
    quotaRemainingPercent: quotaSnapshot.quotaRemainingPercent,
    quotaSource: quotaSnapshot.source,
    triggered,
    reason: triggerReason,
    selectedProviderId: selectedProvider?.providerId || null,
    targetAgentId: config.llmApiRunnerAgentId,
  };
}

function pruneMissingSessions(seenKeys) {
  for (const key of Array.from(state.keys())) {
    if (!seenKeys.has(key)) {
      state.delete(key);
    }
  }
}

async function scanOnce() {
  cycle += 1;
  await ensureDirectories();
  const now = new Date();
  const nowIso = now.toISOString();
  const terminals = await pollTerminalWindows(config.contentTailChars);
  const processTable = await collectProcessTable();
  const roleMap = loadRoleMap();
  const identityRegistry = loadIdentityRegistry();
  const hostName = os.hostname();
  const userName = os.userInfo().username;
  const wakePings = [];
  const sessions = [];
  const seenKeys = new Set();
  const sessionTailByAgentId = new Map();

  for (const terminal of terminals) {
    const sessionKey = getSessionKey(terminal);
    seenKeys.add(sessionKey);
    const processContext = resolveProcessContext(terminal, processTable);
    const cwd = processContext.shellPid ? await resolveCwd(processContext.shellPid) : null;
    const agentLike = isAgentLike(
      processContext.foregroundCommand,
      processContext.foregroundArgs,
      terminal.contentsTail
    );
    const interactiveReady = isInteractiveReady(terminal.contentsTail);
    const signature = hashSignature({
      busy: terminal.busy,
      contentsTail: terminal.contentsTail,
      cwd,
      foreground: processContext.foregroundArgs,
    });

    const previous = state.get(sessionKey);
    const signatureChanged = !previous || previous.lastSignature !== signature;
    const nextState = previous
      ? {
          ...previous,
          lastSeenAt: nowIso,
          lastActivityAt: signatureChanged ? nowIso : previous.lastActivityAt,
          lastSignature: signature,
          noChangeCycles: signatureChanged ? 0 : previous.noChangeCycles + 1,
        }
      : {
          agentId: getAgentId(terminal),
          sessionKey,
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          lastActivityAt: nowIso,
          lastWakePingAt: null,
          lastSignature: signature,
          noChangeCycles: 0,
          wakePingCount: 0,
      };

    const roleAssignment = resolveRoleAssignment(nextState.agentId, terminal.tty, roleMap);
    sessionTailByAgentId.set(nextState.agentId, terminal.contentsTail || '');
    const existingIdentity = identityRegistry.sessions[nextState.agentId];
    const tempTnfId =
      String(existingIdentity?.tempTnfId || '').trim() || assignTempTnfId(identityRegistry);
    identityRegistry.sessions[nextState.agentId] = {
      tempTnfId,
      agentId: nextState.agentId,
      tty: terminal.tty || null,
      firstSeenAt: existingIdentity?.firstSeenAt || nowIso,
      lastSeenAt: nowIso,
      lastWindowId: terminal.windowId,
      lastShellPid: processContext.shellPid,
      lastForegroundPid: processContext.foregroundPid,
      lastForegroundCommand: processContext.foregroundCommand,
      lastCwd: cwd || null,
      roleAlias: roleAssignment.roleAlias,
      roleTags: roleAssignment.roleTags,
      isLocalSubdirectorOwner: roleAssignment.isLocalSubdirectorOwner,
      customTitle: terminal.customTitle || null,
      hostname: hostName,
      username: userName,
      updatedBy: config.actorId,
    };

    const activityAgeMs = Math.max(0, now.getTime() - new Date(nextState.lastActivityAt).getTime());
    const rawStatus = classifyStatus({
      agentLike,
      busy: terminal.busy,
      activityAgeMs,
      interactiveReady,
    });
    const status = rawStatus;

    if (status === 'stalled') {
      const wakePing = await emitWakePing(nowIso, sessionKey, nextState, terminal);
      if (wakePing) {
        nextState.lastWakePingAt = wakePing.createdAt;
        nextState.wakePingCount += 1;
        wakePings.push(wakePing);
      }
    }

    state.set(sessionKey, nextState);
    sessions.push({
      agentId: nextState.agentId,
      tempTnfId,
      sessionKey,
      windowId: terminal.windowId,
      tty: terminal.tty,
      busy: terminal.busy,
      status,
      cwd,
      shellPid: processContext.shellPid,
      foregroundPid: processContext.foregroundPid,
      foregroundCommand: processContext.foregroundCommand,
      agentLike,
      interactiveReady,
      firstSeenAt: nextState.firstSeenAt,
      lastSeenAt: nextState.lastSeenAt,
      lastActivityAt: nextState.lastActivityAt,
      lastWakePingAt: nextState.lastWakePingAt,
      noChangeCycles: nextState.noChangeCycles,
      wakePingCount: nextState.wakePingCount,
      activityAgeMs,
      customTitle: terminal.customTitle,
      roleAlias: roleAssignment.roleAlias,
      roleTags: roleAssignment.roleTags,
      isLocalSubdirectorOwner: roleAssignment.isLocalSubdirectorOwner,
    });
  }

  pruneMissingSessions(seenKeys);

  const summary = {
    observedSessions: sessions.length,
    agentSessions: sessions.filter((session) => session.agentLike).length,
    activeSessions: sessions.filter((session) => session.status === 'active').length,
    idleSessions: sessions.filter((session) => session.status === 'idle').length,
    stalledSessions: sessions.filter((session) => session.status === 'stalled').length,
    wakePingsEmitted: wakePings.length,
    localSubdirectorOwners: sessions.filter((session) => session.isLocalSubdirectorOwner).length,
  };
  const ownerSession = sessions.find((session) => session.isLocalSubdirectorOwner) || null;
  const ownerContentsTail = ownerSession
    ? sessionTailByAgentId.get(ownerSession.agentId) || ''
    : '';
  const quotaHandoff = await maybeTriggerQuotaHandoff({
    nowIso,
    summary,
    ownerSession,
    ownerContentsTail,
  });
  summary.llmQuotaRemainingPercent =
    Number.isFinite(quotaHandoff.quotaRemainingPercent) ? quotaHandoff.quotaRemainingPercent : null;
  summary.llmQuotaSource = quotaHandoff.quotaSource;
  summary.llmQuotaThresholdPercent = config.quotaThresholdPercent;
  summary.llmQuotaHandoffTriggered = quotaHandoff.triggered ? 1 : 0;
  summary.llmQuotaHandoffTarget = quotaHandoff.targetAgentId || null;
  summary.llmQuotaHandoffProviderId = quotaHandoff.selectedProviderId || null;
  summary.llmQuotaHandoffReason = quotaHandoff.reason;

  const identityRegistryPayload = {
    schemaVersion: 'tnf-terminal-identity-registry/v1',
    generatedAt: nowIso,
    host: hostName,
    user: userName,
    actorId: config.actorId,
    roleMapPath: config.roleMapPath,
    sourceHeartbeatPath: resolvePath('local-subdirector-heartbeat.json'),
    counter: identityRegistry.counter,
    sessions: identityRegistry.sessions,
  };

  const payload = {
    generatedAt: nowIso,
    actor: {
      id: config.actorId,
      role: 'tnf-sub-director',
      lane: 'local-terminal-runtime',
    },
    status:
      summary.stalledSessions > 0 ? 'critical' : summary.agentSessions > 0 ? 'healthy' : 'warning',
    cycle,
    config,
    summary,
    sessions,
    wakePings,
    functionalGaps: [
      'Wake transport now uses direct TNF relay delivery, but terminal wake action still depends on resident per-agent relay consumers.',
      'Lane ownership still depends on separate coordination artifacts; this loop establishes liveness and stall defense, not semantic task understanding.',
      'Session role aliases and Local Sub-Director owner status are persisted via role-map + identity-registry, but they still require explicit operator upkeep.',
      'Direct terminal prompt injection remains intentionally out-of-band and is not used as the default wake transport.',
      Number.isFinite(quotaHandoff.quotaRemainingPercent)
        ? `Quota guard active: owner quota=${quotaHandoff.quotaRemainingPercent}% source=${quotaHandoff.quotaSource} threshold=${config.quotaThresholdPercent}%.`
        : `Quota guard active, but no quota signal was detected (source=${quotaHandoff.quotaSource}).`,
    ],
    recommendations: [
      summary.stalledSessions > 0
        ? 'Keep the resident relay monitor running with per-agent aliases so each observed agent session receives direct wake coverage.'
        : 'Keep the local Sub-Director running so terminal heartbeats and wake queue stay current.',
      summary.idleSessions > 0
        ? 'Use idle sessions as assignable capacity through the local director once lane selection is wired.'
        : 'No idle terminal agent capacity is currently visible.',
      quotaHandoff.triggered
        ? `LLM quota handoff dispatched to ${config.llmApiRunnerAgentId}; keep workstreams pinned and let runner execute provider failover.`
        : Number.isFinite(quotaHandoff.quotaRemainingPercent) &&
            quotaHandoff.quotaRemainingPercent <= config.quotaThresholdPercent
          ? `Quota is below threshold; dispatch is currently suppressed (${quotaHandoff.reason}).`
          : 'Quota remains above threshold or unavailable; no LLM runner handoff required this cycle.',
    ],
    quotaHandoff,
  };

  await writeHeartbeat(payload);
  await writeIdentityRegistry(identityRegistryPayload);
}

async function main() {
  await scanOnce();
  console.log(`[local-subdirector] started interval=${config.intervalMs} stateDir=${config.stateDir}`);
  if (config.maxCycles > 0 && cycle >= config.maxCycles) {
    shutdown();
    return;
  }
  loopTimer = setInterval(() => {
    void scanOnce()
      .then(() => {
        if (config.maxCycles > 0 && cycle >= config.maxCycles) {
          shutdown();
        }
      })
      .catch((error) => {
        console.error(`[local-subdirector] scan failed: ${String(error.message || error)}`);
      });
  }, config.intervalMs);
}

function shutdown() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((error) => {
  console.error(`[local-subdirector] fatal: ${String(error.message || error)}`);
  process.exit(1);
});
