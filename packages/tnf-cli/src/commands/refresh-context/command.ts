// Command surface: `tnf refresh-context`
//
// Discover onboarded agents → verify declared protocols → publish a
// TNF envelope per agent to `tnf:bus:egress:<agentId>` plus a broadcast
// announce to `tnf:bus:ingress` → atomically rewrite
// `~/.tnf/.context-injected` with the new injection record.

import { Command } from 'commander';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  RefreshContextOptions,
  RefreshContextReport,
  RefreshContextRunResult,
  runRefreshAndReport,
} from '../../refresh-context-runtime/orchestrator.js';

function defaultTnfHome(): string {
  return process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
}

interface CliOptions {
  repoRoot?: string;
  tnfHome?: string;
  agent?: string;
  protocol?: string;
  dryRun?: boolean;
  json?: boolean;
  fromAgentId?: string;
  fromAgentName?: string;
}

function formatHumanReport(report: RefreshContextReport): string {
  const lines: string[] = [];
  lines.push('TNF Refresh Context');
  lines.push('===================');
  lines.push(`TNF Home:       ${report.after.filePath}`);
  lines.push(`Started:        ${report.diff.startedAt}`);
  lines.push(`Finished:       ${report.diff.finishedAt}`);
  lines.push(`From agent:     ${report.diff.fromAgent}`);
  lines.push(
    `Redis:          ${report.diff.redis.available ? 'connected' : 'unreachable'} (${report.diff.redis.url})`
  );
  lines.push(`Registry agents: ${report.diff.registryAgentCount}`);
  lines.push(`Reached:        ${report.diff.agentsReached}`);
  if (report.diff.agentsNotReached.length > 0) {
    lines.push(`Not reached:    ${report.diff.agentsNotReached.join(', ')}`);
  }
  lines.push('');
  lines.push(`Protocols verified: ${report.after.protocolsInjected.length}`);
  for (const proto of report.after.protocolsInjected) {
    const c = report.protocolContracts[proto];
    const sym = c?.contractPresent ? '✓' : '✗';
    const where = c?.path ? c.path : 'missing';
    lines.push(`  ${sym} ${proto.padEnd(28)} ${where}`);
  }
  lines.push('');
  lines.push(`Agents processed: ${report.agents.length}`);
  for (const agent of report.agents) {
    const live = agent.isOnline ? '●' : '○';
    const who = `${agent.id}${agent.platform ? ` (${agent.platform})` : ''}`;
    lines.push(`  ${live} ${who.padEnd(48)} src=${agent.source}`);
  }
  lines.push('');
  lines.push(`Validation status: ${report.after.validationStatus}`);
  if (report.after.degradations.length > 0) {
    lines.push('Degradations:');
    for (const d of report.after.degradations) {
      lines.push(`  ! ${d}`);
    }
  }
  lines.push('');
  lines.push(`Snapshot id anchors: ${report.diff.envelopeIds.length}`);
  lines.push(`Previous injection: ${report.before.lastInjection || '(none)'}`);
  lines.push(`New injection:      ${report.after.lastInjection}`);
  return lines.join('\n');
}

export function registerRefreshContextCommand(program: Command, repoRoot: string): void {
  const cmd = program
    .command('refresh-context')
    .description(
      'Reinject TNF runtime context (protocols + agent tree) into all onboarded agents via the TNF bus.'
    )
    .option('--tnf-home <path>', 'Override TNF home directory', defaultTnfHome())
    .option('--agent <id>', 'Filter: only refresh these agents (substring match on id)')
    .option('--protocol <id>', 'Filter: only refresh these protocols (substring match on id)')
    .option(
      '--dry-run',
      'Compute the diff and snapshot, but do not touch Redis or write the state file'
    )
    .option('--json', 'Output machine-readable JSON report')
    .option('--from-agent-id <id>', 'Override sender agentId', 'agent:tnf-cli')
    .option('--from-agent-name <name>', 'Override sender agentName', 'TNF CLI Refresh Context')
    .action(async (options: CliOptions) => {
      try {
        const opts: RefreshContextOptions = {
          repoRoot: options.repoRoot || repoRoot,
          tnfHome: options.tnfHome || defaultTnfHome(),
          onlyAgent: options.agent,
          onlyProtocol: options.protocol,
          dryRun: Boolean(options.dryRun),
          json: Boolean(options.json),
          agentId: options.fromAgentId,
          agentName: options.fromAgentName,
          agentRole: 'orchestrator',
          agentPlatform: 'tnf-cli',
        };
        const result: RefreshContextRunResult = await runRefreshAndReport(opts);
        if (!result.ok || !result.report) {
          const msg = result.error || 'unknown error';
          if (options.json) {
            console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
          } else {
            console.error(`✗ refresh-context failed: ${msg}`);
          }
          process.exit(1);
        }
        if (options.json) {
          console.log(JSON.stringify({ ok: true, report: result.report }, null, 2));
        } else {
          console.log(formatHumanReport(result.report));
        }
      } catch (err: any) {
        if (options.json) {
          console.log(JSON.stringify({ ok: false, error: err?.message ?? String(err) }, null, 2));
        } else {
          console.error(`✗ refresh-context failed: ${err?.message ?? String(err)}`);
        }
        process.exit(1);
      }
    });

  // Alias: `tnf refresh_context` (snake_case preferred by some shells)
  cmd.command('list').action(() => {
    console.log('Use `tnf refresh-context --help` for options.');
  });
}
