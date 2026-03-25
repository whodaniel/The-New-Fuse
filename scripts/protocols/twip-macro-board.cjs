#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..', '..');
const relayServerPath = path.join(repoRoot, 'apps', 'relay-server', 'src', 'mcp-server.mjs');
const snapshotPath = path.join(repoRoot, 'data', 'protocols', 'twip-inventory.snapshot.json');
const statePath = path.join(repoRoot, 'data', 'protocols', 'twip-macro-board.state.json');
const latestReportPath = path.join(
  repoRoot,
  'data',
  'protocols',
  'twip-terminal-macro-board-latest.md'
);
const reportsDir = path.join(repoRoot, 'docs', 'protocols', 'reports');
const frontendVisualizationsRoot = path.join(
  repoRoot,
  'apps',
  'frontend',
  'public',
  'visualizations'
);
const frontendTerminalDir = path.join(frontendVisualizationsRoot, 'terminals');
const frontendDataDir = path.join(frontendTerminalDir, 'data');
const frontendStatePath = path.join(frontendDataDir, 'twip-terminal-macro-board.state.json');
const frontendReportPath = path.join(frontendDataDir, 'twip-terminal-macro-board-latest.md');

const SHELL_EXECUTABLES = new Set(['login', 'zsh', 'bash', 'sh', 'fish', 'nu', 'pwsh', 'ksh']);

function parseArgs(argv) {
  const args = {
    tenantId: 'tnf-local',
    limit: 500,
    includeCommands: true,
    includeContent: true,
    contentMaxLines: 80,
    contentMaxChars: 8000,
    scan: true,
    writeHistory: false,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--tenant' || token === '--tenant-id') {
      args.tenantId = argv[++i] || args.tenantId;
    } else if (token === '--limit') {
      args.limit = Number(argv[++i] || args.limit);
    } else if (token === '--include-commands') {
      args.includeCommands = true;
    } else if (token === '--no-include-commands') {
      args.includeCommands = false;
    } else if (token === '--include-content') {
      args.includeContent = true;
    } else if (token === '--no-include-content') {
      args.includeContent = false;
    } else if (token === '--content-lines') {
      args.contentMaxLines = Number(argv[++i] || args.contentMaxLines);
    } else if (token === '--content-max-chars') {
      args.contentMaxChars = Number(argv[++i] || args.contentMaxChars);
    } else if (token === '--no-scan') {
      args.scan = false;
    } else if (token === '--history') {
      args.writeHistory = true;
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    throw new Error(`Invalid --limit value: ${args.limit}`);
  }
  if (!Number.isFinite(args.contentMaxLines) || args.contentMaxLines <= 0) {
    throw new Error(`Invalid --content-lines value: ${args.contentMaxLines}`);
  }
  if (!Number.isFinite(args.contentMaxChars) || args.contentMaxChars <= 0) {
    throw new Error(`Invalid --content-max-chars value: ${args.contentMaxChars}`);
  }

  args.limit = Math.min(1000, Math.floor(args.limit));
  args.contentMaxLines = Math.min(400, Math.floor(args.contentMaxLines));
  args.contentMaxChars = Math.min(24000, Math.floor(args.contentMaxChars));
  return args;
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node scripts/protocols/twip-macro-board.cjs [options]',
      '',
      'Options:',
      '  --tenant, --tenant-id <id>   Tenant id for scan/filter (default: tnf-local)',
      '  --limit <n>                  Max terminals to include (default: 500, max: 1000)',
      '  --include-commands           Include command fingerprints in scan (default: true)',
      '  --no-include-commands        Scan without active command fields',
      '  --include-content            Include sanitized context excerpts from tmux panes (default: true)',
      '  --no-include-content         Disable terminal context capture',
      '  --content-lines <n>          Max context lines per terminal excerpt (default: 80, max: 400)',
      '  --content-max-chars <n>      Max context chars per terminal excerpt (default: 8000, max: 24000)',
      '  --no-scan                    Reuse existing snapshot (skip relay scan)',
      '  --history                    Write timestamped history report in docs/protocols/reports',
      '  (always)                     Mirror latest state/report into apps/frontend/public/visualizations/terminals/data when present',
      '  --json                       Print resulting summary JSON',
      '  --help, -h                   Show help',
    ].join('\n')
  );
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function normalizeExecutable(command) {
  const raw = String(command || '').trim();
  if (!raw) return '';
  const token = raw.split(/\s+/)[0] || '';
  const base = path.basename(token);
  return base.replace(/^-+/, '');
}

function buildContextPreview(excerpt) {
  const text = String(excerpt?.text || '').trim();
  if (!text) return '';
  const fragments = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-2);
  return fragments.join(' | ').slice(0, 220);
}

function summarizeTerminal(terminal) {
  const commandLines = Array.isArray(terminal.active_commands) ? terminal.active_commands : [];
  const executables = [...new Set(commandLines.map(normalizeExecutable).filter(Boolean))];
  const workExecutables = executables.filter((name) => !SHELL_EXECUTABLES.has(name));
  const bypassApproval = commandLines.some((line) =>
    String(line).includes('--dangerously-bypass-approvals-and-sandbox')
  );
  const usesRemoteMcp = commandLines.some((line) => /mcp-remote/i.test(String(line)));
  const contextPreview = buildContextPreview(terminal?.context_excerpt);
  const contextRedactions = Number(terminal?.context_excerpt?.redaction_count || 0);
  const hasContext = contextPreview.length > 0;

  return {
    twid: terminal.twid,
    tty: terminal?.pty?.path || 'unknown',
    paneId: terminal?.scope?.pane_id || null,
    shellPid: terminal?.process?.shell_pid ?? null,
    processCount: terminal?.process?.process_count ?? null,
    multiplexer: terminal?.multiplexer?.kind || 'none',
    workExecutables,
    bypassApproval,
    usesRemoteMcp,
    contextPreview,
    contextRedactions,
    hasContext,
  };
}

function buildSummary(snapshot) {
  const terminals = Array.isArray(snapshot?.terminals) ? snapshot.terminals : [];
  const sessions = terminals.map(summarizeTerminal);
  const activeSessions = sessions.filter((session) => session.workExecutables.length > 0);
  const idleTerminals = sessions.length - activeSessions.length;

  const executableCounts = new Map();
  for (const session of activeSessions) {
    for (const executable of session.workExecutables) {
      executableCounts.set(executable, (executableCounts.get(executable) || 0) + 1);
    }
  }

  const topWorkExecutables = [...executableCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const safetySignals = {
    approvalsBypassTerminals: activeSessions.filter((s) => s.bypassApproval).length,
    remoteMcpTerminals: activeSessions.filter((s) => s.usesRemoteMcp).length,
    contextCapturedTerminals: activeSessions.filter((s) => s.hasContext).length,
    contextRedactions: activeSessions.reduce((acc, session) => acc + session.contextRedactions, 0),
  };

  return {
    totalTerminals: sessions.length,
    activeTerminals: activeSessions.length,
    idleTerminals,
    activeRatio:
      sessions.length > 0 ? Number((activeSessions.length / sessions.length).toFixed(3)) : 0,
    topWorkExecutables,
    activeSessions,
    safetySignals,
  };
}

function buildDelta(previousState, currentState) {
  if (!previousState) {
    return {
      hasBaseline: false,
      notes: ['No previous macro-board state found; baseline established.'],
    };
  }

  const prevSessions = Array.isArray(previousState.summary?.activeSessions)
    ? previousState.summary.activeSessions
    : [];
  const currSessions = Array.isArray(currentState.summary?.activeSessions)
    ? currentState.summary.activeSessions
    : [];

  const prevSet = new Set(prevSessions.map((s) => s.twid));
  const currSet = new Set(currSessions.map((s) => s.twid));
  const gained = currSessions.filter((s) => !prevSet.has(s.twid));
  const lost = prevSessions.filter((s) => !currSet.has(s.twid));

  return {
    hasBaseline: true,
    terminalDelta:
      currentState.summary.totalTerminals - (previousState.summary?.totalTerminals || 0),
    activeDelta: currSessions.length - prevSessions.length,
    activeGained: gained.map((s) => ({
      twid: s.twid,
      tty: s.tty,
      workExecutables: s.workExecutables,
    })),
    activeLost: lost.map((s) => ({ twid: s.twid, tty: s.tty, workExecutables: s.workExecutables })),
  };
}

function formatExecutableLine(items) {
  if (!items || items.length === 0) return 'none';
  return items.map((item) => `${item.name}(${item.count})`).join(', ');
}

function renderReport(state, delta, args) {
  const timestamp = new Date(state.generatedAt).toISOString();
  const scanMeta = state.snapshotMeta || {};
  const lines = [];
  lines.push('# TWIP Terminal Macro Board (Latest)');
  lines.push('');
  lines.push(`Generated: ${timestamp}`);
  lines.push(`Tenant: \`${args.tenantId}\``);
  lines.push(`Source: \`${scanMeta.source || 'unknown'}\``);
  lines.push(`Snapshot: \`data/protocols/twip-inventory.snapshot.json\``);
  lines.push(`Context capture: \`${args.includeContent ? 'enabled' : 'disabled'}\``);
  lines.push('');
  lines.push('## Current Macro View');
  lines.push('');
  lines.push(`- Total terminals: ${state.summary.totalTerminals}`);
  lines.push(`- Active work terminals: ${state.summary.activeTerminals}`);
  lines.push(`- Idle terminals: ${state.summary.idleTerminals}`);
  lines.push(`- Active ratio: ${state.summary.activeRatio}`);
  lines.push(`- Top work executables: ${formatExecutableLine(state.summary.topWorkExecutables)}`);
  lines.push('');
  lines.push('## Safety Signals');
  lines.push('');
  lines.push(
    `- Terminals with approval bypass flags: ${state.summary.safetySignals.approvalsBypassTerminals}`
  );
  lines.push(
    `- Terminals using remote MCP clients: ${state.summary.safetySignals.remoteMcpTerminals}`
  );
  lines.push(
    `- Terminals with captured context: ${state.summary.safetySignals.contextCapturedTerminals}`
  );
  lines.push(`- Total redactions applied: ${state.summary.safetySignals.contextRedactions}`);
  lines.push('');
  lines.push('## Active Sessions (Sanitized)');
  lines.push('');
  for (const session of state.summary.activeSessions) {
    const executables =
      session.workExecutables.length > 0 ? session.workExecutables.join(', ') : 'none';
    const contextLine = session.contextPreview ? ` | ctx: ${session.contextPreview}` : '';
    lines.push(`- \`${session.tty}\` -> ${executables}${contextLine}`);
  }
  if (state.summary.activeSessions.length === 0) {
    lines.push('- none');
  }
  lines.push('');
  lines.push('## Delta vs Previous Run');
  lines.push('');
  if (!delta.hasBaseline) {
    for (const note of delta.notes || []) lines.push(`- ${note}`);
  } else {
    lines.push(
      `- Terminal count delta: ${delta.terminalDelta >= 0 ? '+' : ''}${delta.terminalDelta}`
    );
    lines.push(`- Active terminal delta: ${delta.activeDelta >= 0 ? '+' : ''}${delta.activeDelta}`);
    lines.push(`- Active gained: ${delta.activeGained.length}`);
    lines.push(`- Active lost: ${delta.activeLost.length}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function runScan(args) {
  const { TNFRelayMCPServer } = await import(pathToFileURL(relayServerPath).href);
  const relay = new TNFRelayMCPServer();
  await relay.twipScanTerminals({
    tenant_id: args.tenantId,
    limit: args.limit,
    include_commands: args.includeCommands,
    include_content: args.includeContent,
    content_max_lines: args.contentMaxLines,
    content_max_chars: args.contentMaxChars,
    publish_to_store: true,
  });
}

function writeReport(reportBody, writeHistory) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(latestReportPath, reportBody, 'utf8');

  let historyPath = null;
  if (writeHistory) {
    const stamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, 'Z');
    historyPath = path.join(reportsDir, `twip-terminal-macro-board-${stamp}.md`);
    fs.writeFileSync(historyPath, reportBody, 'utf8');
  }
  return { latestReportPath, historyPath };
}

function writeFrontendArtifacts(state, reportBody) {
  if (!fs.existsSync(frontendVisualizationsRoot)) {
    return { published: false, reason: 'frontend_visualizations_missing' };
  }

  fs.mkdirSync(frontendDataDir, { recursive: true });
  fs.writeFileSync(frontendReportPath, reportBody, 'utf8');
  writeJson(frontendStatePath, state);

  return {
    published: true,
    statePath: frontendStatePath,
    reportPath: frontendReportPath,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.scan) {
    await runScan(args);
  }

  const snapshot = readJson(snapshotPath);
  if (!snapshot || !Array.isArray(snapshot.terminals)) {
    throw new Error(
      'TWIP inventory snapshot missing or invalid. Run with scan enabled or verify data/protocols/twip-inventory.snapshot.json.'
    );
  }

  const previousState = readJson(statePath, null);
  const summary = buildSummary(snapshot);
  const currentState = {
    generatedAt: new Date().toISOString(),
    args,
    snapshotMeta: snapshot.meta || {},
    summary,
  };
  const delta = buildDelta(previousState, currentState);
  currentState.delta = delta;

  const reportBody = renderReport(currentState, delta, args);
  const reportTargets = writeReport(reportBody, args.writeHistory);
  writeJson(statePath, currentState);
  const frontendTargets = writeFrontendArtifacts(currentState, reportBody);

  const output = {
    ok: true,
    generatedAt: currentState.generatedAt,
    totals: {
      terminals: summary.totalTerminals,
      active: summary.activeTerminals,
      idle: summary.idleTerminals,
    },
    report: {
      latest: path.relative(repoRoot, reportTargets.latestReportPath),
      history: reportTargets.historyPath
        ? path.relative(repoRoot, reportTargets.historyPath)
        : null,
    },
    state: path.relative(repoRoot, statePath),
    frontend: frontendTargets.published
      ? {
          state: path.relative(repoRoot, frontendTargets.statePath),
          report: path.relative(repoRoot, frontendTargets.reportPath),
        }
      : null,
    delta,
  };

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(
      [
        'TWIP macro board refreshed.',
        `- terminals: ${summary.totalTerminals}`,
        `- active: ${summary.activeTerminals}`,
        `- report: ${output.report.latest}`,
        `- state: ${output.state}`,
        output.frontend ? `- ui-state: ${output.frontend.state}` : null,
      ].join('\n')
    );
  }
}

main().catch((error) => {
  console.error(`twip-macro-board failed: ${error.message}`);
  process.exit(1);
});
