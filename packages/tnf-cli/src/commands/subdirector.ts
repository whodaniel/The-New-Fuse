import chalk from 'chalk';
import type { Command } from 'commander';
import * as path from 'node:path';

type RunCommand = (
  cmd: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    isBackground?: boolean;
    captureStderr?: boolean;
    intent?: string;
  }
) => Promise<void>;

/**
 * Local Subdirector (tnf-cli-agent) control-plane surface.
 * Drains review / direct / specialty queues used by the local authority path.
 */
export function registerSubdirectorCommand(
  program: Command,
  deps: { repoRoot: string; runCommand: RunCommand }
): void {
  const { repoRoot, runCommand } = deps;

  const subdirector = program
    .command('subdirector')
    .description('Local Subdirector (tnf-cli-agent) control-plane utilities');

  subdirector
    .command('drain')
    .description(
      'Drain Local Subdirector review/direct/specialty queues (acks watchdog + analytics/maintenance reports)'
    )
    .option('--max-per-queue <n>', 'Max items per queue', '25')
    .option('--json', 'Emit full JSON drain report')
    .option('--skip-register', 'Skip registry heartbeat refresh')
    .action(async (options: { maxPerQueue?: string; json?: boolean; skipRegister?: boolean }) => {
      try {
        const script = path.join(repoRoot, 'scripts/sub-director/drain_local_subdirector.py');
        const args = [script, '--max-per-queue', String(options.maxPerQueue || '25')];
        if (options.json) args.push('--json');
        if (options.skipRegister) args.push('--skip-register');
        await runCommand('python3', args, {
          env: {
            ...process.env,
            TNF_AGENT_ID: process.env.TNF_AGENT_ID || 'tnf-cli-agent',
            TNF_LOCAL_SUBDIRECTOR_AGENT_ID:
              process.env.TNF_LOCAL_SUBDIRECTOR_AGENT_ID ||
              process.env.TNF_AGENT_ID ||
              'tnf-cli-agent',
          },
        });
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    });

  subdirector
    .command('cycle')
    .description('Run the Local Subdirector cron cycle wrapper (sync + drain + log)')
    .action(async () => {
      try {
        await runCommand('bash', ['scripts/agents/subdirector-local-cli-agent-cycle.sh']);
      } catch (err: any) {
        console.error(chalk.red(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
