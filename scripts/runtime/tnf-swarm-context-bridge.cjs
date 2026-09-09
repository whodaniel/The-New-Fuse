#!/usr/bin/env node

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('util');
const { execFile, execFileSync } = require('child_process');

const execFileAsync = promisify(execFile);

// --- Fleet-wide pause gate (2026-07-21) ---
// Note: this script only reads state and synthesizes swarm-context.md — it
// doesn't take autonomous action on its own. Gated anyway for consistency
// and because a paused fleet's context snapshot going stale is itself a
// useful, honest signal (rather than a swarm-context.md that keeps looking
// "current" while everything else is paused).
const { isFleetPaused } = require('../lib/tnf-fleet-mode.cjs');
if (isFleetPaused()) {
  console.log(JSON.stringify({ ok: true, skipped: 'fleet-paused' }));
  process.exit(0);
}

const { RedisAgentClient } = require('../lib/redis-agent-client.cjs');

const ROOT_DIR = process.env.TNF_REPO_ROOT || path.resolve(__dirname, '../..');
const TNF_HOME = path.join(os.homedir(), '.tnf');

const config = {
  heartbeatStateDir:
    process.env.TNF_TERMINAL_HEARTBEAT_STATE_DIR ||
    path.join(TNF_HOME, 'terminal-heartbeat', 'state'),
  swarmContextPath: process.env.TNF_SWARM_CONTEXT_PATH || path.join(TNF_HOME, 'swarm-context.md'),
  livingStatePath: process.env.TNF_LIVING_STATE_PATH || path.join(ROOT_DIR, 'docs', 'protocols', 'LIVING_STATE.md'),
  handoffPath: process.env.TNF_HANDOFF_PATH || path.join(TNF_HOME, 'handoff-current.json'),
  runtimeStatePath: process.env.TNF_RUNTIME_STATE_PATH || path.join(TNF_HOME, 'runtime-state.json'),
  redisChannel: process.env.TNF_SWARM_CONTEXT_CHANNEL || 'tnf:swarm:context:updated',
};

function nowIso() {
  return new Date().toISOString();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return '';
  }
}

function readMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').slice(0, 50).join('\n');
  } catch {
    return null;
  }
}

function summarizeDirective(line) {
  const match = line.match(/^\d+\.\s*\[.*?\]\s*(.+)/);
  return match ? match[1].trim() : line.trim();
}

function extractActiveDirectives(livingStateContent) {
  if (!livingStateContent) return [];
  const lines = livingStateContent.split('\n');
  const directiveLines = [];
  let inActiveSteps = false;

  for (const line of lines) {
    if (line.includes('## ⚡ Active Steps') || line.includes('## Active Steps')) {
      inActiveSteps = true;
      continue;
    }
    if (inActiveSteps && line.startsWith('## ')) {
      break;
    }
    if (inActiveSteps && line.includes('[✅]') && line.trim()) {
      directiveLines.push(summarizeDirective(line));
    }
  }
  return directiveLines.slice(0, 10);
}

function extractCurrentDirective(livingStateContent) {
  if (!livingStateContent) return null;
  const match = livingStateContent.match(/\*\*Current Directive:\*\*\s*(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : null;
}

function formatTerminalSummary(heartbeat) {
  if (!heartbeat || !heartbeat.observed) return 'No terminals observed';

  const summary = heartbeat.summary || {};
  const terminals = heartbeat.observed || [];

  const lines = [];
  lines.push(`| TTY | Window | Status | CWD | Task Hint |`);
  lines.push(`|-----|--------|--------|-----|-----------|`);

  for (const terminal of terminals.slice(0, 10)) {
    const status = terminal.busy ? 'busy' : 'idle';
    const taskHint = terminal.foregroundArgs || terminal.foregroundCommand || '-';
    const cwd = terminal.cwd ? path.basename(terminal.cwd) : '-';
    lines.push(`| ${terminal.tty || '-'} | ${terminal.windowId || '-'} | ${status} | ${cwd} | ${taskHint.slice(0, 40)} |`);
  }

  if (terminals.length > 10) {
    lines.push(`| ... | | | | (${terminals.length - 10} more) |`);
  }

  return lines.join('\n');
}

function detectCoordinationIssues(heartbeat) {
  if (!heartbeat || !heartbeat.targets) return [];

  const issues = [];
  const targets = heartbeat.targets || [];

  for (const target of targets) {
    if (target.skippedReason) {
      issues.push({
        agentId: target.agentId,
        tty: target.tty,
        reason: target.skippedReason,
        conflictRisk: target.coordinationPoll?.conflictRisk || null,
      });
    }
  }

  return issues;
}

function extractConflictRisks(heartbeat) {
  if (!heartbeat || !heartbeat.targets) return [];

  const risks = [];
  for (const target of heartbeat.targets || []) {
    if (target.coordinationPoll?.conflictRisk) {
      const risk = target.coordinationPoll.conflictRisk;
      risks.push({
        code: risk.code,
        reason: risk.reason,
        peerAgentIds: risk.peerAgentIds || [],
        cwd: risk.cwd,
      });
    }
  }
  return risks;
}

async function publishContextUpdate(heartbeat, swarmContext) {
  try {
    const client = new RedisAgentClient();
    await client.initialize();

    await client.publisher.publish(
      config.redisChannel,
      JSON.stringify({
        type: 'swarm_context_updated',
        generatedAt: nowIso(),
        heartbeatAge: heartbeat?.generatedAt,
        terminalCount: heartbeat?.summary?.observedSessions || 0,
        agentCount: heartbeat?.summary?.agentSessions || 0,
        contextPath: config.swarmContextPath,
        coherenceScore: swarmContext.coherenceScore,
        activeDirectiveCount: swarmContext.activeDirectives.length,
        coordinationIssues: swarmContext.coordinationIssues.length,
        conflictRisks: swarmContext.conflictRisks.length,
      })
    );

    await client.cleanup();
  } catch (error) {
    console.error(`[swarm-context-bridge] Redis publish failed: ${error.message}`);
  }
}

function computeContextCoherence(heartbeat, handoff) {
  let score = 100;
  const factors = [];

  if (!heartbeat || heartbeat.status === 'skipped-locked') {
    score -= 30;
    factors.push('heartbeat-locked');
  }

  if (heartbeat?.summary?.queueHintFailures > 0) {
    score -= 15;
    factors.push('queue-hint-failures');
  }

  const observed = heartbeat?.summary?.observedSessions || 0;
  if (observed === 0) {
    score -= 20;
    factors.push('no-terminals-observed');
  } else if (observed > 8) {
    score -= 5;
    factors.push('high-terminal-count');
  }

  if (handoff) {
    const handoffAge = (Date.now() - new Date(handoff.generatedAt || 0).getTime()) / 3600000;
    if (handoffAge > 24) {
      score -= 10;
      factors.push('handoff-stale');
    }
  }

  const issues = detectCoordinationIssues(heartbeat);
  if (issues.length > 0) {
    score -= issues.length * 5;
    factors.push('coordination-issues');
  }

  score = Math.max(0, Math.min(100, score));
  return { score, level: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low', factors };
}

/**
 * Worktree registry for the heartbeat's worktree-routing rule: agents with a
 * dedicated worktree (.tnf/worktrees/, .claude/worktrees/) must work there,
 * not in the shared checkout. Rendered from `git worktree list --porcelain`;
 * fail-open to a placeholder so context generation never breaks on git.
 */
function formatWorktreeSummary() {
  try {
    const out = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: ROOT_DIR, encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'],
    });
    const entries = [];
    let cur = null;
    for (const line of out.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (cur) entries.push(cur);
        cur = { path: line.slice(9) };
      } else if (cur && line.startsWith('HEAD ')) cur.head = line.slice(5).slice(0, 9);
      else if (cur && line.startsWith('branch ')) cur.branch = line.slice(7).replace('refs/heads/', '');
      else if (cur && line.startsWith('locked')) cur.locked = true;
      else if (line === '') { if (cur) { entries.push(cur); cur = null; } }
    }
    if (cur) entries.push(cur);
    if (!entries.length) return '_No worktrees provisioned (shared checkout only)_';
    const rows = entries.map((e) => {
      const agentPrivate = /\/(\.tnf|\.claude)\/worktrees\//.test(e.path);
      const role = agentPrivate ? 'agent-private' : e.locked ? 'locked' : 'auxiliary';
      return `| ${e.path.replace(os.homedir(), '~')} | ${e.branch || '(detached)'} | ${e.head || ''} | ${role} |`;
    });
    return ['| Worktree | Branch | HEAD | Role |', '|---|---|---|---|', ...rows].join('\n');
  } catch {
    return '_Worktree listing unavailable_';
  }
}

function buildSwarmContext(heartbeat, livingState, handoff) {
  const directives = extractActiveDirectives(livingState);
  const currentDirective = extractCurrentDirective(livingState);
  const conflictRisks = extractConflictRisks(heartbeat);
  const coordinationIssues = detectCoordinationIssues(heartbeat);
  const coherence = computeContextCoherence(heartbeat, handoff);
  const terminalSummary = formatTerminalSummary(heartbeat);
  const worktreeSummary = formatWorktreeSummary();

  const now = nowIso();
  const heartbeatAge = heartbeat
    ? Math.round((Date.now() - new Date(heartbeat.generatedAt).getTime()) / 1000)
    : null;

  const lines = [
    `# TNF Swarm Context`,
    ``,
    `**Generated:** ${now}`,
    `**Heartbeat Age:** ${heartbeatAge != null ? `${heartbeatAge}s ago` : 'N/A'}`,
    `**Coherence:** ${coherence.score}/100 (${coherence.level}) ${coherence.factors.length ? `- ${coherence.factors.join(', ')}` : ''}`,
    ``,
    `---`,
    ``,
    `## Current Directive`,
    ``,
    currentDirective || '_No active directive_',
    ``,
    `---`,
    ``,
    `## Active Steps (${directives.length})`,
    ``,
    ...directives.map((d, i) => `${i + 1}. ${d}`),
    ``,
    `---`,
    ``,
    `## Agent Worktrees`,
    ``,
    worktreeSummary,
    ``,
    `---`,
    ``,
    `## Swarm Terminals (${heartbeat?.summary?.observedSessions || 0} observed, ${heartbeat?.summary?.agentSessions || 0} agent-like)`,
    ``,
    terminalSummary,
    ``,
    `---`,
    ``,
    `## Coordination Status`,
    ``,
  ];

  if (coordinationIssues.length === 0 && conflictRisks.length === 0) {
    lines.push('_No coordination issues detected_');
  } else {
    if (coordinationIssues.length > 0) {
      lines.push(`### Skipped/Blocked Terminals (${coordinationIssues.length})`);
      lines.push('');
      for (const issue of coordinationIssues) {
        lines.push(`- **${issue.agentId}** (${issue.tty}): ${issue.reason}`);
        if (issue.conflictRisk) {
          lines.push(`  - Risk: ${issue.conflictRisk.reason}`);
          lines.push(`  - Peers: ${(issue.conflictRisk.peerAgentIds || []).join(', ')}`);
        }
      }
      lines.push('');
    }

    if (conflictRisks.length > 0) {
      lines.push(`### Conflict Risks (${conflictRisks.length})`);
      lines.push('');
      for (const risk of conflictRisks) {
        lines.push(`- **${risk.code}**: ${risk.reason}`);
        lines.push(`  - CWD: ${risk.cwd}`);
        lines.push(`  - Peers: ${risk.peerAgentIds.join(', ')}`);
      }
      lines.push('');
    }
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`## Session Handoff`);
  lines.push(``);

  if (handoff) {
    lines.push(`**Session:** ${handoff.sessionKey || handoff.handoff_id || 'unknown'}`);
    lines.push(`**Generated:** ${handoff.generatedAt || 'unknown'}`);
    if (handoff.owner) {
      lines.push(`**Owner:** ${handoff.owner}`);
    }
    if (handoff.projectIds?.length) {
      lines.push(`**Projects:** ${handoff.projectIds.join(', ')}`);
    }
    lines.push(``);
    if (handoff.IMMEDIATE_TASKS?.length) {
      lines.push(`### Immediate Tasks`);
      handoff.IMMEDIATE_TASKS.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
      lines.push(``);
    }
    if (handoff.MISSION?.length) {
      lines.push(`### Mission`);
      handoff.MISSION.forEach(m => lines.push(`- ${m}`));
      lines.push(``);
    }
    lines.push(`**Full Handoff Path:** ${config.handoffPath}`);
  } else {
    lines.push('_No active session handoff_');
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Injection Status`);
  lines.push(``);
  lines.push(`- **Status:** ${heartbeat?.status || 'unknown'}`);
  lines.push(`- **Targeted:** ${heartbeat?.summary?.targetedSessions || 0}`);
  lines.push(`- **Injected:** ${heartbeat?.summary?.injections || 0}`);
  lines.push(`- **Queue Failures:** ${heartbeat?.summary?.queueHintFailures || 0}`);
  lines.push(`- **Safety Holds:** ${heartbeat?.summary?.appleScriptHoldActive || 0}`);

  return {
    markdown: lines.join('\n'),
    coherenceScore: coherence.score,
    activeDirectives: directives,
    coordinationIssues,
    conflictRisks,
    terminalCount: heartbeat?.summary?.observedSessions || 0,
    agentCount: heartbeat?.summary?.agentSessions || 0,
  };
}

async function pruneSwarmContextHistory(canonicalPath, keep) {
  const dir = path.dirname(canonicalPath);
  const base = path.basename(canonicalPath, '.md');
  let entries = [];
  try {
    entries = await fsp.readdir(dir);
  } catch {
    return;
  }
  const history = entries
    .filter((name) => name.startsWith(`${base}-`) && name.endsWith('.md'))
    .map((name) => path.join(dir, name));
  if (history.length <= keep) return;
  const stamped = await Promise.all(
    history.map(async (filePath) => {
      try {
        const st = await fsp.stat(filePath);
        return { filePath, mtimeMs: st.mtimeMs };
      } catch {
        return { filePath, mtimeMs: 0 };
      }
    })
  );
  stamped.sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const item of stamped.slice(keep)) {
    try {
      await fsp.unlink(item.filePath);
    } catch {
      // best-effort
    }
  }
}

async function main() {
  const heartbeat = readJson(path.join(config.heartbeatStateDir, 'terminal-heartbeat-latest.json'));
  const livingState = readMarkdown(config.livingStatePath);
  const handoff = readJson(config.handoffPath);

  const swarmContext = buildSwarmContext(heartbeat, livingState, handoff);

  await fsp.writeFile(config.swarmContextPath, swarmContext.markdown);

  // History copies were unbounded (~77k files / ENOSPC class). Default keep=0
  // (canonical swarm-context.md only). Cap with TNF_SWARM_CONTEXT_HISTORY_KEEP.
  const historyKeep = Math.max(
    0,
    Number.parseInt(String(process.env.TNF_SWARM_CONTEXT_HISTORY_KEEP || '0'), 10) || 0
  );
  if (historyKeep > 0) {
    const historyPath = config.swarmContextPath.replace(
      '.md',
      `-${nowIso().replace(/[:.]/g, '-')}.md`
    );
    await fsp.writeFile(historyPath, swarmContext.markdown);
    await pruneSwarmContextHistory(config.swarmContextPath, historyKeep);
  }

  console.log(
    `[swarm-context-bridge] coherence=${swarmContext.coherenceScore} terminals=${swarmContext.terminalCount} agents=${swarmContext.agentCount} directives=${swarmContext.activeDirectives.length} historyKeep=${historyKeep}`
  );

  await publishContextUpdate(heartbeat, swarmContext);
}

main().catch((error) => {
  console.error(`[swarm-context-bridge] fatal: ${error.message}`);
  process.exit(1);
});