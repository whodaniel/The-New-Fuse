/**
 * `tnf agents announce` — interactive-session availability announce for the
 * local Subdirector (Agent Bus Contract v1 + AGENT_AVAILABILITY_ANNOUNCE).
 *
 * Thin wrapper around scripts/agents/announce-availability.cjs so operators
 * and agents share one executable path.
 */

import { Command } from 'commander';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export function registerAgentsAnnounceCommand(agentsGroup: Command, repoRoot: string): void {
  agentsGroup
    .command('announce')
    .description(
      'Announce this interactive session as available (or offline) for local Subdirector dispatch'
    )
    .option(
      '--name <name>',
      'Agent display name (default: TNF_AGENT_NAME or tnf-<platform>-worker)'
    )
    .option('--role <role>', 'DACC role (usually worker)', 'worker')
    .option(
      '--platform <platform>',
      'Platform taxonomy token (default: TNF_PLATFORM or auto-detect; not Claude-bound)'
    )
    .option('--to <agentId>', 'Local Subdirector agent id', 'tnf-cli-agent')
    .option(
      '--capabilities <list>',
      'Comma-separated capability tokens',
      'code_edit,frontend,protocol,personal_intelligence,cli,review'
    )
    .option('--agent-id <id>', 'Stable agent id (default: derived from host/tty/name)')
    .option('--tty <tty>', 'Override tty label for stable id derivation')
    .option('--cadence-sec <n>', 'Expected re-announce cadence seconds', '900')
    .option('--offline', 'Withdraw from dispatch (status=offline, dispatchable=false)')
    .option('--json', 'Emit machine-readable receipt JSON')
    .action((options: Record<string, unknown>) => {
      const script = path.join(repoRoot, 'scripts/agents/announce-availability.cjs');
      const args = [script];
      // Only forward name/platform when set so the script can TNF-auto-detect.
      if (options.name) args.push('--name', String(options.name));
      if (options.role) args.push('--role', String(options.role));
      if (options.platform) args.push('--platform', String(options.platform));
      if (options.to) args.push('--to', String(options.to));
      if (options.capabilities) args.push('--capabilities', String(options.capabilities));
      if (options.agentId) args.push('--agent-id', String(options.agentId));
      if (options.tty) args.push('--tty', String(options.tty));
      if (options.cadenceSec) args.push('--cadence-sec', String(options.cadenceSec));
      if (options.offline) args.push('--offline');
      if (options.json) args.push('--json');

      const result = spawnSync(process.execPath, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        env: process.env,
      });
      process.exit(result.status ?? 1);
    });
}
