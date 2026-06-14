#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { singleInstanceGuard } from '../lib/tnf-single-instance-guard.cjs';

const DEFAULT_OUT_DIR = path.join(process.cwd(), 'reports', 'personal-archaeology');
const PROGRAM_SPEC = 'tnf/personal-archaeology-program/0.2';
const DEFAULT_RELAY_CHANNEL = 'tnf:bus:ingress';
const DEFAULT_RELAY_TARGET = 'TNF:ORCHESTRATOR:001';
const DEFAULT_FINDINGS_BY_AGENT = {
  'repo-lineage-investigator': 'repo-lineage.md',
  'notes-ledger-investigator': 'notes-ledger.md',
  'media-evidence-investigator': 'media-evidence.md',
  'code-fossil-investigator': 'code-fossils.md',
  'timeline-synthesis-investigator': 'timeline-synthesis.md',
  'personal-historical-archaeologist': 'timeline-synthesis.md',
  'auth-blocker-sentinel': 'integrity-review.md',
};

const DEFAULT_TEAMS = [
  {
    id: 'source-acquisition',
    title: 'Source Acquisition Team',
    orchestrator: 'personal-archaeology-source-team-orchestrator',
    cadenceMinutes: 60,
    investigators: [
      'repo-lineage-investigator',
      'notes-ledger-investigator',
      'media-evidence-investigator',
      'code-fossil-investigator',
    ],
  },
  {
    id: 'narrative-reconstruction',
    title: 'Narrative Reconstruction Team',
    orchestrator: 'personal-archaeology-narrative-team-orchestrator',
    cadenceMinutes: 120,
    investigators: ['timeline-synthesis-investigator', 'personal-historical-archaeologist'],
  },
  {
    id: 'integrity-and-escalation',
    title: 'Integrity And Escalation Team',
    orchestrator: 'personal-archaeology-integrity-team-orchestrator',
    cadenceMinutes: 30,
    investigators: ['auth-blocker-sentinel'],
  },
];

function usage() {
  console.log(
    'Usage: node scripts/timeline/personal-archaeology-orchestrator.mjs <init|pulse|master-loop|investigator-pulse|digest|blocker-watch> [options]'
  );
  console.log('');
  console.log('Options:');
  console.log(
    '  --out-dir <path>          Output directory (default: reports/personal-archaeology)'
  );
  console.log('  --agent <id>              Agent id for pulse');
  console.log(
    '  --status <status>         planned|active|blocked|idle|completed (default: active)'
  );
  console.log('  --summary <text>          Short progress summary for pulse');
  console.log('  --team <id>               Optional team id for pulse context');
  console.log('  --blocked-reason <text>   Blocked reason to append to human-actions queue');
  console.log('  --requires-human <text>   Human action required when blocked');
  console.log('  --findings <path>         Findings path associated with the pulse');
}

function parseArgs(argv) {
  if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
    usage();
    process.exit(0);
  }

  const normalizedArgv = argv[1] === '--' ? [argv[0], ...argv.slice(2)] : argv;
  const [command, ...rest] = normalizedArgv;
  const options = {
    command,
    outDir: DEFAULT_OUT_DIR,
    agent: 'personal-archaeology-master-orchestrator',
    status: 'active',
    summary: '',
    team: null,
    blockedReason: null,
    requiresHuman: null,
    findings: null,
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--out-dir') {
      options.outDir = requireValue(rest, ++i, '--out-dir');
    } else if (arg === '--agent') {
      options.agent = requireValue(rest, ++i, '--agent');
    } else if (arg === '--status') {
      options.status = requireValue(rest, ++i, '--status');
    } else if (arg === '--summary') {
      options.summary = requireValue(rest, ++i, '--summary');
    } else if (arg === '--team') {
      options.team = requireValue(rest, ++i, '--team');
    } else if (arg === '--blocked-reason') {
      options.blockedReason = requireValue(rest, ++i, '--blocked-reason');
    } else if (arg === '--requires-human') {
      options.requiresHuman = requireValue(rest, ++i, '--requires-human');
    } else if (arg === '--findings') {
      options.findings = requireValue(rest, ++i, '--findings');
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (
    !['init', 'pulse', 'master-loop', 'investigator-pulse', 'digest', 'blocker-watch'].includes(
      options.command
    )
  ) {
    throw new Error(`Unknown command: ${options.command}`);
  }

  options.outDir = path.resolve(options.outDir);
  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureFile(filePath, contents) {
  if (!fs.existsSync(filePath)) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, contents);
  }
}

function safeSlug(value) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
}

function manifestPath(outDir) {
  return path.join(outDir, 'program.manifest.json');
}

function statusPath(outDir, agentId) {
  return path.join(outDir, 'status', `${safeSlug(agentId)}.json`);
}

function heartbeatPath(outDir, agentId) {
  return path.join(outDir, 'heartbeats', `${safeSlug(agentId)}.json`);
}

function blockedPath(outDir) {
  return path.join(outDir, 'blocked', 'human-actions.json');
}

function alertsPath(outDir) {
  return path.join(outDir, 'notifications', 'alerts.jsonl');
}

function outboxPath(outDir) {
  return path.join(outDir, 'notifications', 'outbox.jsonl');
}

function dispatchStatePath(outDir) {
  return path.join(outDir, 'notifications', 'dispatch-state.json');
}

function progressPath(outDir) {
  return path.join(outDir, 'progress', 'iteration-log.md');
}

function digestPath(outDir) {
  return path.join(outDir, 'reports', 'periodic-digest.md');
}

function findingsDir(outDir) {
  return path.join(outDir, 'findings');
}

function buildManifest() {
  return {
    spec: PROGRAM_SPEC,
    generatedAt: new Date().toISOString(),
    title: 'TNF Personal Archaeology Program',
    org: {
      masterDirector: {
        title: 'Master Director',
        embodiment: 'tnf-cli-agent',
      },
      masterOrchestrator: {
        title: 'Master Orchestrator',
        agentId: 'personal-archaeology-master-orchestrator',
      },
    },
    teams: DEFAULT_TEAMS,
  };
}

function initialAgentStatus(agentId, role, teamId = null) {
  return {
    agentId,
    role,
    teamId,
    status: 'planned',
    lastHeartbeatAt: null,
    summary: '',
    findingsPath: null,
    blockedReason: null,
  };
}

function collectAllAgentRecords(manifest) {
  const records = [
    {
      agentId: manifest.org.masterOrchestrator.agentId,
      role: 'master_orchestrator',
      teamId: null,
    },
  ];

  for (const team of manifest.teams) {
    records.push({
      agentId: team.orchestrator,
      role: 'team_orchestrator',
      teamId: team.id,
    });
    for (const investigator of team.investigators) {
      records.push({
        agentId: investigator,
        role: investigator === 'auth-blocker-sentinel' ? 'sentinel' : 'investigator',
        teamId: team.id,
      });
    }
  }

  return records;
}

function findAgentRecord(manifest, agentId, teamId = null) {
  return (
    collectAllAgentRecords(manifest).find((record) => record.agentId === agentId) || {
      agentId,
      role: 'investigator',
      teamId,
    }
  );
}

function initProgram(outDir) {
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'status'));
  ensureDir(path.join(outDir, 'heartbeats'));
  ensureDir(path.join(outDir, 'blocked'));
  ensureDir(path.join(outDir, 'notifications'));
  ensureDir(path.join(outDir, 'progress'));
  ensureDir(findingsDir(outDir));
  ensureDir(path.join(outDir, 'reports'));

  const manifest = buildManifest();
  fs.writeFileSync(manifestPath(outDir), JSON.stringify(manifest, null, 2));

  for (const record of collectAllAgentRecords(manifest)) {
    ensureFile(
      statusPath(outDir, record.agentId),
      JSON.stringify(initialAgentStatus(record.agentId, record.role, record.teamId), null, 2)
    );
    ensureFile(
      heartbeatPath(outDir, record.agentId),
      JSON.stringify(
        {
          agentId: record.agentId,
          role: record.role,
          teamId: record.teamId,
          state: 'planned',
          updatedAt: null,
          summary: '',
        },
        null,
        2
      )
    );
  }

  ensureFile(blockedPath(outDir), '[]\n');
  ensureFile(alertsPath(outDir), '');
  ensureFile(outboxPath(outDir), '');
  ensureFile(dispatchStatePath(outDir), '{}\n');
  ensureFile(progressPath(outDir), '# Personal Archaeology Iteration Log\n\n');
  ensureFile(digestPath(outDir), '# Personal Archaeology Periodic Digest\n\n- Pending first run.\n');

  const findingsTemplates = [
    'repo-lineage.md',
    'notes-ledger.md',
    'media-evidence.md',
    'code-fossils.md',
    'timeline-synthesis.md',
    'integrity-review.md',
  ];
  for (const file of findingsTemplates) {
    ensureFile(path.join(findingsDir(outDir), file), `# ${file.replace(/[-.]/g, ' ')}\n\n`);
  }

  return {
    ok: true,
    manifestPath: manifestPath(outDir),
    outDir,
    agents: collectAllAgentRecords(manifest).length,
  };
}

function ensureProgram(outDir) {
  if (!fs.existsSync(manifestPath(outDir))) {
    initProgram(outDir);
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function appendJsonl(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`);
}

function appendMarkdownLine(filePath, line) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${line}\n`);
}

function readManifest(outDir) {
  ensureProgram(outDir);
  return readJson(manifestPath(outDir), buildManifest());
}

function readAgentStatus(outDir, agentId, teamId = null) {
  const manifest = readManifest(outDir);
  const record = findAgentRecord(manifest, agentId, teamId);
  return readJson(statusPath(outDir, agentId), initialAgentStatus(agentId, record.role, record.teamId));
}

function readAllAgentStatuses(outDir) {
  const manifest = readManifest(outDir);
  return collectAllAgentRecords(manifest).map((record) =>
    readJson(statusPath(outDir, record.agentId), initialAgentStatus(record.agentId, record.role, record.teamId))
  );
}

function getDefaultFindingsPath(outDir, agentId) {
  const fileName = DEFAULT_FINDINGS_BY_AGENT[agentId];
  return fileName ? path.join(findingsDir(outDir), fileName) : null;
}

function summarizeFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    relativePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

function upsertAgentState(outDir, payload) {
  const now = payload.timestamp || new Date().toISOString();
  const manifest = readManifest(outDir);
  const record = findAgentRecord(manifest, payload.agentId, payload.teamId || null);
  const currentStatus = readJson(
    statusPath(outDir, payload.agentId),
    initialAgentStatus(payload.agentId, record.role, record.teamId)
  );

  const nextStatus = {
    ...currentStatus,
    role: currentStatus.role || record.role,
    teamId: payload.teamId !== undefined ? payload.teamId : currentStatus.teamId,
    status: payload.status,
    lastHeartbeatAt: now,
    summary: payload.summary ?? currentStatus.summary,
    findingsPath: payload.findingsPath ?? currentStatus.findingsPath,
    blockedReason: payload.blockedReason ?? null,
  };
  fs.writeFileSync(statusPath(outDir, payload.agentId), JSON.stringify(nextStatus, null, 2));

  fs.writeFileSync(
    heartbeatPath(outDir, payload.agentId),
    JSON.stringify(
      {
        agentId: payload.agentId,
        role: nextStatus.role || record.role,
        teamId: nextStatus.teamId || null,
        state: payload.status,
        updatedAt: now,
        summary: payload.summary || '',
      },
      null,
      2
    )
  );

  if (payload.recordProgress !== false) {
    appendMarkdownLine(
      progressPath(outDir),
      `- ${now} | ${payload.agentId} | ${payload.status} | ${payload.summary || '(no summary)'}`
    );
  }

  return nextStatus;
}

function queueBlockedRecord(outDir, payload) {
  const queue = readJson(blockedPath(outDir), []);
  const blockedRecord = {
    id: `${safeSlug(payload.agentId)}-${safeSlug(payload.timestamp)}`,
    timestamp: payload.timestamp,
    agentId: payload.agentId,
    teamId: payload.teamId || null,
    reason: payload.reason || 'Human action required',
    requiresHuman: payload.requiresHuman || null,
    findingsPath: payload.findingsPath || null,
    status: 'pending-human',
  };
  queue.push(blockedRecord);
  fs.writeFileSync(blockedPath(outDir), JSON.stringify(queue, null, 2));

  appendJsonl(alertsPath(outDir), {
    type: 'human_escalation_required',
    timestamp: payload.timestamp,
    agentId: payload.agentId,
    teamId: payload.teamId || null,
    reason: blockedRecord.reason,
    requiresHuman: blockedRecord.requiresHuman,
    recommendedChannelRef: '.agent/context/human-handoff.md',
  });

  return blockedRecord;
}

function pulseProgram(options) {
  ensureProgram(options.outDir);
  const now = new Date().toISOString();
  const currentStatus = readAgentStatus(options.outDir, options.agent, options.team);
  const findingsPath =
    options.findings || currentStatus.findingsPath || getDefaultFindingsPath(options.outDir, options.agent);
  const nextStatus = upsertAgentState(options.outDir, {
    agentId: options.agent,
    teamId: options.team || currentStatus.teamId,
    status: options.status,
    summary: options.summary || currentStatus.summary,
    findingsPath,
    blockedReason: options.blockedReason || null,
    timestamp: now,
  });

  let blockedRecord = null;
  if (options.blockedReason || options.requiresHuman) {
    blockedRecord = queueBlockedRecord(options.outDir, {
      timestamp: now,
      agentId: options.agent,
      teamId: options.team || currentStatus.teamId,
      reason: options.blockedReason,
      requiresHuman: options.requiresHuman,
      findingsPath,
    });
  }

  return {
    ok: true,
    agent: options.agent,
    status: nextStatus.status,
    blocked: Boolean(blockedRecord),
    statusFile: statusPath(options.outDir, options.agent),
    heartbeatFile: heartbeatPath(options.outDir, options.agent),
  };
}

function countByStatus(statuses) {
  return statuses.reduce((acc, entry) => {
    const key = entry.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function runMasterLoop(options) {
  ensureProgram(options.outDir);
  const now = new Date().toISOString();
  const manifest = readManifest(options.outDir);
  const statuses = readAllAgentStatuses(options.outDir);
  const statusByAgent = new Map(statuses.map((entry) => [entry.agentId, entry]));
  const blockedQueue = readJson(blockedPath(options.outDir), []);
  const pendingHuman = blockedQueue.filter((entry) => entry.status === 'pending-human');
  const teamSummaries = [];
  let blockedInvestigators = 0;
  let totalInvestigators = 0;

  for (const team of manifest.teams) {
    const investigatorStatuses = team.investigators.map((agentId) =>
      statusByAgent.get(agentId) || initialAgentStatus(agentId, 'investigator', team.id)
    );
    const byStatus = countByStatus(investigatorStatuses);
    blockedInvestigators += byStatus.blocked || 0;
    totalInvestigators += investigatorStatuses.length;
    const teamPendingHuman = pendingHuman.filter((entry) => entry.teamId === team.id).length;
    const summary = `Investigators ${investigatorStatuses.length}; active ${byStatus.active || 0}; blocked ${byStatus.blocked || 0}; pending human ${teamPendingHuman}`;
    const status = byStatus.blocked === investigatorStatuses.length && investigatorStatuses.length > 0 ? 'blocked' : 'active';
    upsertAgentState(options.outDir, {
      agentId: team.orchestrator,
      teamId: team.id,
      status,
      summary,
      timestamp: now,
    });
    teamSummaries.push({
      teamId: team.id,
      status,
      summary,
    });
  }

  const masterSummary = `Coordinated ${manifest.teams.length} teams; blocked investigators ${blockedInvestigators}/${totalInvestigators}; pending human actions ${pendingHuman.length}`;
  upsertAgentState(options.outDir, {
    agentId: manifest.org.masterOrchestrator.agentId,
    status: pendingHuman.length > 0 ? 'active' : 'active',
    summary: masterSummary,
    timestamp: now,
  });

  return {
    ok: true,
    command: 'master-loop',
    generatedAt: now,
    pendingHumanActions: pendingHuman.length,
    blockedInvestigators,
    totalInvestigators,
    teams: teamSummaries,
  };
}

function runInvestigatorPulse(options) {
  ensureProgram(options.outDir);
  const now = new Date().toISOString();
  const manifest = readManifest(options.outDir);
  const investigatorRecords = collectAllAgentRecords(manifest).filter(
    (record) => record.role === 'investigator' || record.role === 'sentinel'
  );
  const results = [];

  for (const record of investigatorRecords) {
    const currentStatus = readJson(
      statusPath(options.outDir, record.agentId),
      initialAgentStatus(record.agentId, record.role, record.teamId)
    );
    const findingsPath =
      currentStatus.findingsPath || getDefaultFindingsPath(options.outDir, record.agentId);
    const fileSummary = summarizeFile(findingsPath);

    let status = currentStatus.status;
    let summary = currentStatus.summary;
    let blockedReason = currentStatus.blockedReason || null;

    if (currentStatus.status === 'blocked') {
      summary = blockedReason ? `Blocked: ${blockedReason}` : summary || 'Blocked pending human action';
    } else if (currentStatus.status === 'completed') {
      summary = summary || 'Completed current archaeology lane';
    } else if (fileSummary) {
      status = 'active';
      summary = `Evidence tracked at ${fileSummary.relativePath} (updated ${fileSummary.modifiedAt})`;
      blockedReason = null;
    } else {
      status = 'idle';
      summary = 'Awaiting next evidence capture cycle';
      blockedReason = null;
    }

    upsertAgentState(options.outDir, {
      agentId: record.agentId,
      teamId: record.teamId,
      status,
      summary,
      findingsPath,
      blockedReason,
      timestamp: now,
    });

    results.push({
      agentId: record.agentId,
      status,
      findingsPath: findingsPath || null,
    });
  }

  return {
    ok: true,
    command: 'investigator-pulse',
    generatedAt: now,
    investigators: results.length,
    byStatus: countByStatus(results),
  };
}

function tailLines(filePath, limit) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return lines.slice(-limit);
}

function scanFindings(outDir) {
  const dir = findingsDir(outDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((fileName) => path.join(dir, fileName))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .map((filePath) => summarizeFile(filePath))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt));
}

function renderDigestMarkdown(payload) {
  const lines = [
    '# Personal Archaeology Periodic Digest',
    '',
    `Generated at: ${payload.generatedAt}`,
    '',
    '## Program Status',
    '',
  ];

  for (const [status, count] of Object.entries(payload.byStatus)) {
    lines.push(`- ${status}: ${count}`);
  }

  lines.push('', '## Pending Human Actions', '');
  if (payload.pendingHuman.length === 0) {
    lines.push('- None');
  } else {
    for (const item of payload.pendingHuman.slice(0, 10)) {
      lines.push(
        `- ${item.agentId}: ${item.reason}${item.requiresHuman ? ` | requires human: ${item.requiresHuman}` : ''}`
      );
    }
  }

  lines.push('', '## Recent Progress', '');
  if (payload.recentProgress.length === 0) {
    lines.push('- No progress logged yet.');
  } else {
    for (const line of payload.recentProgress) lines.push(line);
  }

  lines.push('', '## Findings Surfaces', '');
  if (payload.findings.length === 0) {
    lines.push('- No findings files detected.');
  } else {
    for (const item of payload.findings.slice(0, 10)) {
      lines.push(`- ${item.relativePath} | updated ${item.modifiedAt} | ${item.sizeBytes} bytes`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function runDigest(options) {
  ensureProgram(options.outDir);
  const now = new Date().toISOString();
  const statuses = readAllAgentStatuses(options.outDir);
  const pendingHuman = readJson(blockedPath(options.outDir), []).filter(
    (entry) => entry.status === 'pending-human'
  );
  const recentProgress = tailLines(progressPath(options.outDir), 12).filter((line) =>
    line.startsWith('- ')
  );
  const findings = scanFindings(options.outDir);
  const markdown = renderDigestMarkdown({
    generatedAt: now,
    byStatus: countByStatus(statuses),
    pendingHuman,
    recentProgress,
    findings,
  });
  fs.writeFileSync(digestPath(options.outDir), markdown);

  upsertAgentState(options.outDir, {
    agentId: 'personal-archaeology-narrative-team-orchestrator',
    teamId: 'narrative-reconstruction',
    status: 'active',
    summary: `Published digest with ${pendingHuman.length} pending human actions`,
    findingsPath: digestPath(options.outDir),
    timestamp: now,
  });

  return {
    ok: true,
    command: 'digest',
    generatedAt: now,
    digestPath: digestPath(options.outDir),
    pendingHumanActions: pendingHuman.length,
  };
}

function getRelayMode() {
  const raw = (process.env.TNF_PERSONAL_ARCHAEOLOGY_RELAY_MODE || 'auto').trim().toLowerCase();
  if (['auto', 'redis-bus', 'file-only', 'off'].includes(raw)) return raw;
  return 'auto';
}

function readDispatchState(outDir) {
  return readJson(dispatchStatePath(outDir), {});
}

function shouldAttemptDispatch(dispatchEntry) {
  if (!dispatchEntry) return true;
  if (dispatchEntry.status === 'delivered') return false;
  const retryMinutesRaw = Number.parseInt(
    process.env.TNF_PERSONAL_ARCHAEOLOGY_RELAY_RETRY_MINUTES || '15',
    10
  );
  const retryMinutes = Number.isFinite(retryMinutesRaw) && retryMinutesRaw > 0 ? retryMinutesRaw : 15;
  if (!dispatchEntry.lastAttemptAt) return true;
  return Date.now() - Date.parse(dispatchEntry.lastAttemptAt) >= retryMinutes * 60 * 1000;
}

function buildRelayMessage(blockedRecord) {
  return {
    id: crypto.randomUUID(),
    type: 'message',
    from: 'auth-blocker-sentinel',
    to: DEFAULT_RELAY_TARGET,
    content: [
      'Personal archaeology human escalation required.',
      `Agent: ${blockedRecord.agentId}`,
      `Reason: ${blockedRecord.reason}`,
      blockedRecord.requiresHuman ? `Required action: ${blockedRecord.requiresHuman}` : null,
      blockedRecord.findingsPath ? `Findings: ${blockedRecord.findingsPath}` : null,
      'Channel reference: .agent/context/human-handoff.md',
    ]
      .filter(Boolean)
      .join(' | '),
    metadata: {
      program: 'personal-archaeology',
      blockedActionId: blockedRecord.id,
      teamId: blockedRecord.teamId || null,
      recommendedChannelRef: '.agent/context/human-handoff.md',
    },
    timestamp: new Date().toISOString(),
  };
}

async function dispatchRelayMessage(blockedRecord) {
  const relayMode = getRelayMode();
  if (relayMode === 'off') {
    return {
      status: 'disabled',
      mode: relayMode,
      reason: 'Relay mode disabled',
    };
  }

  const relayUrl =
    process.env.TNF_PERSONAL_ARCHAEOLOGY_RELAY_URL || process.env.REDIS_URL || null;
  if (relayMode === 'file-only' || !relayUrl) {
    return {
      status: relayUrl ? 'pending' : 'pending_config',
      mode: relayMode,
      reason: relayUrl ? 'Configured for file-only delivery' : 'Redis relay URL is not configured',
    };
  }

  const { default: Redis } = await import('ioredis');
  const channel = process.env.TNF_PERSONAL_ARCHAEOLOGY_RELAY_CHANNEL || DEFAULT_RELAY_CHANNEL;
  const client = new Redis(relayUrl);
  try {
    await client.publish(channel, JSON.stringify(buildRelayMessage(blockedRecord)));
    return {
      status: 'delivered',
      mode: relayMode,
      channel,
    };
  } catch (error) {
    return {
      status: 'failed',
      mode: relayMode,
      reason: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await client.quit().catch(() => client.disconnect());
  }
}

async function runBlockerWatch(options) {
  ensureProgram(options.outDir);
  const now = new Date().toISOString();
  const blockedQueue = readJson(blockedPath(options.outDir), []).filter(
    (entry) => entry.status === 'pending-human'
  );
  const dispatchState = readDispatchState(options.outDir);
  const dispatchResults = [];

  for (const blockedRecord of blockedQueue) {
    const currentDispatch = dispatchState[blockedRecord.id];
    if (!shouldAttemptDispatch(currentDispatch)) {
      dispatchResults.push({
        blockedActionId: blockedRecord.id,
        status: currentDispatch.status,
        skipped: true,
      });
      continue;
    }

    const delivery = await dispatchRelayMessage(blockedRecord);
    const nextState = {
      status: delivery.status,
      mode: delivery.mode,
      attempts: (currentDispatch?.attempts || 0) + 1,
      lastAttemptAt: now,
      lastReason: delivery.reason || null,
      channel: delivery.channel || null,
    };
    dispatchState[blockedRecord.id] = nextState;
    appendJsonl(outboxPath(options.outDir), {
      timestamp: now,
      blockedActionId: blockedRecord.id,
      agentId: blockedRecord.agentId,
      result: nextState,
    });
    appendJsonl(alertsPath(options.outDir), {
      type:
        delivery.status === 'delivered'
          ? 'human_escalation_dispatched'
          : 'human_escalation_delivery_pending',
      timestamp: now,
      agentId: blockedRecord.agentId,
      teamId: blockedRecord.teamId || null,
      blockedActionId: blockedRecord.id,
      status: delivery.status,
      reason: delivery.reason || null,
      channel: delivery.channel || null,
      recommendedChannelRef: '.agent/context/human-handoff.md',
    });
    dispatchResults.push({
      blockedActionId: blockedRecord.id,
      status: delivery.status,
      channel: delivery.channel || null,
    });
  }

  fs.writeFileSync(dispatchStatePath(options.outDir), JSON.stringify(dispatchState, null, 2));

  const delivered = dispatchResults.filter((entry) => entry.status === 'delivered').length;
  const summary =
    blockedQueue.length === 0
      ? 'No pending human escalations'
      : `Pending human escalations ${blockedQueue.length}; delivered this run ${delivered}`;

  upsertAgentState(options.outDir, {
    agentId: 'auth-blocker-sentinel',
    teamId: 'integrity-and-escalation',
    status: 'active',
    summary,
    findingsPath: blockedPath(options.outDir),
    timestamp: now,
  });

  return {
    ok: true,
    command: 'blocker-watch',
    generatedAt: now,
    pendingHumanActions: blockedQueue.length,
    delivered,
    dispatchResults,
  };
}

async function main() {
  const guard = singleInstanceGuard({ lockName: 'personal-archaeology-orchestrator' });
  if (!guard.acquired) {
    console.error(JSON.stringify({ ok: false, skipped: 'already-running', lock: guard.existingLock }, null, 2));
    process.exit(0);
  }

  try {
  const options = parseArgs(process.argv.slice(2));
  let result;
  if (options.command === 'init') {
    result = initProgram(options.outDir);
  } else if (options.command === 'pulse') {
    result = pulseProgram(options);
  } else if (options.command === 'master-loop') {
    result = runMasterLoop(options);
  } else if (options.command === 'investigator-pulse') {
    result = runInvestigatorPulse(options);
  } else if (options.command === 'digest') {
    result = runDigest(options);
  } else {
    result = await runBlockerWatch(options);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
}).finally(() => {
  guard.release();
});
