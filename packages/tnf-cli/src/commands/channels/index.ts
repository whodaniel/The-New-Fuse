import chalk from 'chalk';
import { Command } from 'commander';
import {
  channelConfigPath,
  channelStatus,
  loadChannelConfig,
  type ChannelStatus,
} from '../../services/channel-config.js';

/**
 * `tnf channels` — inspect messaging-channel configuration without starting
 * anything.
 *
 * Until this existed, the only way to find out whether Slack or WhatsApp were
 * configured was to run `slack start` and see whether it threw. That conflates
 * three different states — not configured, deliberately disabled, and actually
 * broken — into one stack trace, and it requires side effects to answer a
 * read-only question.
 *
 * Credential VALUES are never printed. Only the names of variables that are
 * unset, so the output is safe to paste into an issue.
 */

const READINESS_LABEL: Record<ChannelStatus['readiness'], string> = {
  ready: 'ready',
  disabled: 'disabled',
  'missing-credentials': 'missing credentials',
};

function paint(readiness: ChannelStatus['readiness'], text: string): string {
  if (readiness === 'ready') return chalk.green(text);
  if (readiness === 'disabled') return chalk.dim(text);
  return chalk.yellow(text);
}

export function registerChannelCommands(program: Command, _repoRoot: string): void {
  const channels = program
    .command('channels')
    .description('Inspect messaging-channel configuration (Slack, WhatsApp)');

  channels
    .command('status', { isDefault: true })
    .description('Show which channels are configured, disabled, or missing credentials')
    .option('--json', 'Emit JSON')
    .action((options: { json?: boolean }) => {
      const config = loadChannelConfig();
      const statuses = channelStatus(config);

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              source: config.source,
              configPath: config.configPath,
              warnings: config.warnings,
              channels: statuses,
            },
            null,
            2
          )
        );
      } else {
        console.log(chalk.bold('\nTNF messaging channels\n'));
        console.log(
          `  config: ${config.configPath}${config.source === 'defaults' ? chalk.dim(' (not present — using built-in defaults)') : ''}`
        );
        console.log('');

        for (const s of statuses) {
          console.log(
            `  ${paint(s.readiness, '●')} ${s.name.padEnd(10)} ${paint(s.readiness, READINESS_LABEL[s.readiness])}`
          );
          if (s.missing.length) {
            // Names only. Never values.
            console.log(`      unset: ${s.missing.join(', ')}`);
          }
          const settings = Object.entries(s.settings);
          if (settings.length) {
            console.log(
              chalk.dim(`      settings: ${settings.map(([k, v]) => `${k}=${v}`).join(', ')}`)
            );
          }
        }

        // Config problems are surfaced, never swallowed — a channel list that
        // quietly loses an entry is how a misconfiguration hides.
        if (config.warnings.length) {
          console.log(chalk.yellow('\n  config warnings:'));
          for (const w of config.warnings) console.log(chalk.yellow(`    - ${w}`));
        }

        const notReady = statuses.filter((s) => s.readiness === 'missing-credentials');
        if (notReady.length) {
          console.log(
            chalk.dim(
              `\n  Set the variables above (see .env.example), or disable a channel in ${config.configPath}.`
            )
          );
        }
        console.log('');
      }

      // A channel missing credentials is a configuration state, not a crash —
      // exit 0. Only a malformed config is a failure, and that is what the
      // warnings carry.
      if (config.warnings.length) process.exitCode = 1;
    });

  channels
    .command('path')
    .description('Print the channel config file path')
    .action(() => {
      console.log(channelConfigPath());
    });
}
