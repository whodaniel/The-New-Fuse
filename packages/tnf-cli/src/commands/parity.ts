/**
 * packages/tnf-cli/src/commands/parity.ts
 *
 * `tnf parity` — cross-agent CLI feature parity.
 *
 *   tnf parity agents              List the reference agent roster and reachability
 *   tnf parity audit               Measure TNF against every reachable agent, write the ledger
 *   tnf parity status              Read the last ledger; --strict fails on gaps
 *   tnf parity gaps --agent codex  Show the concrete gap list for one agent
 *   tnf parity sync-goals          Turn open gaps into tracked goals
 *
 * The audit is the unit the self-improvement loop runs each cycle; the other
 * verbs are for humans reading what it produced.
 */

import chalk from 'chalk';
import type { Command } from 'commander';
import { GoalsService } from '../services/GoalsService.js';
import { ParityService, REFERENCE_AGENTS, type ParityLedger } from '../services/ParityService.js';
import { getOrCreateCommand } from './_registry.js';

function coverageColor(coverage: number): (s: string) => string {
  if (coverage >= 90) return chalk.green;
  if (coverage >= 70) return chalk.yellow;
  return chalk.red;
}

function renderLedger(ledger: ParityLedger): void {
  console.log(chalk.bold.blue('\n  TNF Cross-Agent Parity\n'));
  console.log(
    `  TNF surface : ${chalk.cyan(ledger.tnf.commandCount)} commands, ` +
      `${chalk.cyan(ledger.tnf.rootOptionCount)} root options`
  );
  console.log(
    `  Agents      : ${chalk.cyan(ledger.totals.agentsAvailable)} tracked, ` +
      `${chalk.dim(`${ledger.totals.agentsUnavailable} unreachable`)}`
  );
  console.log(
    `  Coverage    : ${coverageColor(ledger.totals.meanCoverage)(`${ledger.totals.meanCoverage}%`)} mean, ` +
      `${chalk.bold(ledger.totals.totalGaps)} open gaps`
  );
  console.log('  ' + '-'.repeat(68));

  for (const a of ledger.agents) {
    if (!a.available) {
      console.log(
        `  ${chalk.dim('○')} ${chalk.dim(a.agent.padEnd(14))} ${chalk.dim(a.error ?? 'unreachable')}`
      );
      continue;
    }
    const gaps = a.missingCommands.length + a.missingOptions.length;
    const mark = gaps === 0 ? chalk.green('●') : coverageColor(a.coverage)('●');
    const caveat = a.commandsMeasured ? '' : chalk.dim(' (options only)');
    console.log(
      `  ${mark} ${chalk.bold(a.agent.padEnd(14))} ` +
        `${coverageColor(a.coverage)(`${String(a.coverage).padStart(3)}%`)}  ` +
        `${String(gaps).padStart(3)} gaps  ${chalk.dim(a.version ?? '')}${caveat}`
    );
  }
  console.log('');
}

/** Flatten a ledger into individual gap records. */
function collectGaps(
  ledger: ParityLedger,
  agentFilter?: string
): Array<{ agent: string; feature: string; kind: 'command' | 'option'; note?: string }> {
  const out: Array<{ agent: string; feature: string; kind: 'command' | 'option'; note?: string }> =
    [];
  for (const a of ledger.agents) {
    if (!a.available) continue;
    if (agentFilter && a.agent.toLowerCase() !== agentFilter.toLowerCase()) continue;
    for (const feature of a.missingCommands) {
      out.push({ agent: a.agent, feature, kind: 'command', note: a.note });
    }
    for (const feature of a.missingOptions) {
      out.push({ agent: a.agent, feature, kind: 'option', note: a.note });
    }
  }
  return out;
}

export function registerParityCommand(program: Command, repoRoot: string): void {
  const parity = getOrCreateCommand(
    program,
    'parity',
    'Cross-agent CLI feature parity: audit, ledger, and backlog sync'
  );
  const service = new ParityService(repoRoot);

  parity
    .command('agents')
    .description('List the reference agent roster and whether each is reachable')
    .option('--json', 'Emit machine-readable JSON')
    .action(async (opts: { json?: boolean } = {}) => {
      if (opts.json) {
        console.log(JSON.stringify(REFERENCE_AGENTS, null, 2));
        return;
      }
      console.log(chalk.bold.blue('\n  Reference agents tracked for parity\n'));
      for (const ref of REFERENCE_AGENTS) {
        console.log(
          `  ${chalk.bold(ref.agent.padEnd(14))} ${chalk.dim(ref.binary.padEnd(14))} ${ref.note}`
        );
      }
      console.log(chalk.dim('\n  Reachability is measured by `tnf parity audit`.\n'));
    });

  parity
    .command('audit')
    .description('Measure TNF against every reachable reference agent and write the ledger')
    .option('--agents <list>', 'Comma-separated subset of agents to audit')
    .option('--timeout-ms <n>', 'Per-CLI help timeout', '30000')
    .option('--no-write', 'Do not persist the ledger to docs/operations/parity/')
    .option('--json', 'Emit the ledger as JSON')
    .option('--strict', 'Exit non-zero when any gap is open')
    .action(
      async (opts: {
        agents?: string;
        timeoutMs?: string;
        write?: boolean;
        json?: boolean;
        strict?: boolean;
      }) => {
        try {
          const agents = opts.agents
            ? opts.agents
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
            : undefined;
          const ledger = await service.audit(program, {
            agents,
            timeoutMs: Number(opts.timeoutMs ?? 30_000),
          });

          if (opts.write !== false) {
            const written = service.write(ledger);
            if (!opts.json) {
              console.log(chalk.dim(`\n  Ledger: ${written.markdown}`));
            }
          }

          if (opts.json) {
            console.log(JSON.stringify(ledger, null, 2));
          } else {
            renderLedger(ledger);
          }

          if (opts.strict && ledger.totals.totalGaps > 0) {
            console.error(chalk.red(`Parity gaps open: ${ledger.totals.totalGaps} (--strict)`));
            process.exit(1);
          }
        } catch (err: any) {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        }
      }
    );

  parity
    .command('status')
    .description('Show the last recorded parity ledger without re-running the audit')
    .option('--json', 'Emit machine-readable JSON')
    .option('--strict', 'Exit non-zero when any gap is open or no ledger exists')
    .action((opts: { json?: boolean; strict?: boolean } = {}) => {
      const ledger = service.readLedger();
      if (!ledger) {
        const message = 'No parity ledger found. Run `tnf parity audit` first.';
        if (opts.json) console.log(JSON.stringify({ error: message }, null, 2));
        else console.log(chalk.yellow(`\n  ${message}\n`));
        if (opts.strict) process.exit(1);
        return;
      }
      if (opts.json) console.log(JSON.stringify(ledger, null, 2));
      else {
        renderLedger(ledger);
        console.log(chalk.dim(`  Generated: ${ledger.generatedAt}\n`));
      }
      if (opts.strict && ledger.totals.totalGaps > 0) process.exit(1);
    });

  parity
    .command('gaps')
    .description('List the concrete parity gaps from the last ledger')
    .option('--agent <name>', 'Restrict to a single agent')
    .option('--json', 'Emit machine-readable JSON')
    .action((opts: { agent?: string; json?: boolean } = {}) => {
      const ledger = service.readLedger();
      if (!ledger) {
        console.log(chalk.yellow('\n  No parity ledger found. Run `tnf parity audit` first.\n'));
        process.exit(1);
        return;
      }
      const gaps = collectGaps(ledger, opts.agent);
      if (opts.json) {
        console.log(JSON.stringify({ count: gaps.length, gaps }, null, 2));
        return;
      }
      if (gaps.length === 0) {
        console.log(chalk.green('\n  No open parity gaps.\n'));
        return;
      }
      console.log(chalk.bold.blue(`\n  ${gaps.length} open parity gap(s)\n`));
      let currentAgent = '';
      for (const gap of gaps) {
        if (gap.agent !== currentAgent) {
          currentAgent = gap.agent;
          console.log(`  ${chalk.bold(currentAgent)}`);
        }
        console.log(`    ${chalk.dim(gap.kind.padEnd(7))} ${gap.feature}`);
      }
      console.log('');
    });

  parity
    .command('sync-goals')
    .description('Create tracked goals for parity gaps that do not have one yet')
    .option('--agent <name>', 'Restrict to a single agent')
    .option('--priority <level>', 'Priority for newly created goals', 'medium')
    .option('--dry-run', 'Show what would be created without writing')
    .option('--json', 'Emit machine-readable JSON')
    .action(
      async (opts: { agent?: string; priority?: any; dryRun?: boolean; json?: boolean } = {}) => {
        try {
          const ledger = service.readLedger();
          if (!ledger) {
            console.error(chalk.red('No parity ledger found. Run `tnf parity audit` first.'));
            process.exit(1);
            return;
          }
          const gaps = collectGaps(ledger, opts.agent);
          const goalsService = new GoalsService();
          const result = await goalsService.syncFromParityGaps(gaps, {
            priority: opts.priority,
            dryRun: opts.dryRun,
          });

          if (opts.json) {
            console.log(
              JSON.stringify(
                {
                  dryRun: !!opts.dryRun,
                  created: result.created.map((g) => ({
                    id: g.id,
                    title: g.title,
                    parity: g.parity,
                  })),
                  skipped: result.skipped,
                },
                null,
                2
              )
            );
            return;
          }

          const verb = opts.dryRun ? 'Would create' : 'Created';
          console.log(chalk.bold.blue(`\n  Parity backlog sync\n`));
          console.log(`  ${verb}: ${chalk.green(result.created.length)} goal(s)`);
          console.log(`  Already tracked: ${chalk.dim(result.skipped.length)}`);
          for (const g of result.created) {
            console.log(`    ${chalk.cyan('+')} ${g.title}`);
          }
          console.log('');
        } catch (err: any) {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        }
      }
    );
}
