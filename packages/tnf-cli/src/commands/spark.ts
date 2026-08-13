/**
 * Optional Gemini Spark adapter surface.
 *
 * Generalized for any TNF deployer. Connection details come from env/config —
 * never bake operator-personal workspace state, user PII, or tenant secrets
 * into the OSS tree. Personal sync targets belong in the deploying tenant's
 * store (e.g. app.thenewfuse.com Supabase) or local-only config.
 */

import chalk from 'chalk';
import { Command } from 'commander';

export type SparkConfig = {
  enabled: boolean;
  busUrl: string | null;
  workspaceMcpConfigured: boolean;
  cloudEngine: string | null;
};

/** Resolve Spark adapter config from env (deployer-local; not committed). */
export function resolveSparkConfig(env: NodeJS.ProcessEnv = process.env): SparkConfig {
  const enabled = /^(1|true|yes)$/i.test(String(env.TNF_SPARK_ENABLED || ''));
  const busUrl = (env.TNF_SPARK_BUS_URL || '').trim() || null;
  const workspaceMcpConfigured = Boolean(
    (env.TNF_SPARK_WORKSPACE_MCP_URL || '').trim() ||
    (env.TNF_SPARK_WORKSPACE_MCP_CONFIG || '').trim()
  );
  const cloudEngine = (env.TNF_SPARK_CLOUD_ENGINE || '').trim() || null;
  return { enabled, busUrl, workspaceMcpConfigured, cloudEngine };
}

function printStatus(cfg: SparkConfig): void {
  console.log(chalk.bold('\nTNF Spark adapter (optional)\n'));
  console.log(`  Enabled:          ${cfg.enabled ? chalk.green('yes') : chalk.dim('no')}`);
  console.log(
    `  Cloud engine:     ${cfg.cloudEngine ? cfg.cloudEngine : chalk.dim('(unset — TNF_SPARK_CLOUD_ENGINE)')}`
  );
  console.log(
    `  Bus URL:          ${cfg.busUrl ? cfg.busUrl : chalk.dim('(unset — TNF_SPARK_BUS_URL)')}`
  );
  console.log(
    `  Workspace MCP:    ${
      cfg.workspaceMcpConfigured
        ? chalk.green('configured')
        : chalk.dim('not configured — TNF_SPARK_WORKSPACE_MCP_URL')
    }`
  );

  if (!cfg.enabled) {
    console.log(
      chalk.dim(
        '\n  Opt in with TNF_SPARK_ENABLED=1 and deployer-local MCP/bus env.\n' +
          '  Tenant/personal sync targets stay outside the OSS tree.\n'
      )
    );
    return;
  }

  if (!cfg.busUrl && !cfg.workspaceMcpConfigured) {
    console.log(
      chalk.yellow('\n  Enabled but no bus/MCP endpoint configured — bridge is not connected.\n')
    );
    return;
  }

  console.log(
    chalk.dim(
      '\n  Config present. Live probes are deployer-specific; this command reports config only.\n'
    )
  );
}

export function registerSparkCommand(program: Command): void {
  const spark = program
    .command('spark')
    .description('Optional Gemini Spark / Workspace MCP adapter (config via TNF_SPARK_* env)');

  spark
    .command('status')
    .description('Show Spark adapter config / enablement (no personal workspace claims)')
    .action(() => {
      printStatus(resolveSparkConfig());
    });

  spark
    .command('sync')
    .description('Sync guidance: map TNF handoff artifacts to deployer-configured Workspace MCP')
    .action(() => {
      const cfg = resolveSparkConfig();
      console.log(chalk.bold('\nTNF Spark sync\n'));
      if (!cfg.enabled || !cfg.workspaceMcpConfigured) {
        console.log('  Sync is inactive until TNF_SPARK_ENABLED=1 and Workspace MCP env are set.');
        console.log(
          '  Do not commit operator personal docs into the OSS repo; use tenant DB or local config.'
        );
        console.log('');
        return;
      }
      console.log('  Configured Workspace MCP detected.');
      console.log('  Prefer syncing handoff summaries to tenant-scoped destinations only.');
      console.log('  Canonical sources remain docs/protocols/* in the local workspace.');
      console.log(
        chalk.dim('  (Wire the actual MCP push in a deployer plugin — not shipped here.)')
      );
      console.log('');
    });

  spark
    .command('delegate <goal...>')
    .description('Print how to hand a long-horizon goal to a configured Spark worker')
    .action((goalParts: string[]) => {
      const cfg = resolveSparkConfig();
      const goal = goalParts.join(' ');
      console.log(chalk.bold('\nTNF Spark delegate\n'));
      console.log(`  Goal: ${goal}`);
      if (!cfg.enabled || !cfg.busUrl) {
        console.log(
          '  Delegation inactive until TNF_SPARK_ENABLED=1 and TNF_SPARK_BUS_URL are set.'
        );
        console.log('');
        return;
      }
      console.log(`  Would route via bus: ${cfg.busUrl}`);
      console.log(
        chalk.dim('  (Wire the actual enqueue in a deployer plugin — not shipped here.)')
      );
      console.log('');
    });
}
