/**
 * Hermes-parity gap closers that map onto existing TNF capability.
 *
 * Thin / honest top-level verbs so `hermes <name>` users land on a real TNF
 * path instead of "command not found". Channel verbs are entrypoints that
 * point at live TNF surfaces (telegram today) rather than fake integrations.
 */

import chalk from 'chalk';
import { execFileSync } from 'child_process';
import type { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { findCommand } from './_registry.js';

/** Top-level Hermes verbs this module registers (kept in sync for the auditor). */
export const HERMES_PARITY_GAP_COMMANDS = [
  'model',
  'monitoring',
  'security',
  'dump',
  'prompt-size',
  'update',
  'logout',
  'approvals',
  // Round 2 — remaining honest wrappers
  'backup',
  'checkpoints',
  'console',
  'dashboard',
  'lsp',
  'migrate',
  'secrets',
  'profile',
  'portal',
  'proxy',
  'slack',
  'whatsapp',
  'whatsapp-cloud',
  'bundles',
  'curator',
  'pairing',
  'pets',
  'skin',
  'egress',
  'fallback',
  'import-agent',
  'moa',
] as const;

/** Commander aliases attached onto existing TNF top-level verbs. */
export const HERMES_PARITY_GAP_ALIASES: Record<string, string> = {
  sessions: 'session',
  insights: 'growth-audit',
  'computer-use': 'browser-control',
  setup: 'onboard',
  console: 'tui',
  dashboard: 'local-ui',
  backup: 'export',
};

function attachAlias(program: Command, existingName: string, alias: string): boolean {
  const cmd = findCommand(program, existingName);
  if (!cmd) return false;
  const aliases = cmd.aliases?.() ?? [];
  if (aliases.includes(alias) || cmd.name() === alias) return true;
  if (findCommand(program, alias)) return false;
  cmd.alias(alias);
  return true;
}

function registerGuide(program: Command, name: string, description: string, lines: string[]): void {
  if (findCommand(program, name)) return;
  program
    .command(name)
    .description(description)
    .action(() => {
      console.log(chalk.bold(`\nTNF ${name}\n`));
      for (const line of lines) console.log(`  ${line}`);
      console.log('');
    });
}

export function registerHermesParityGapCommands(program: Command, repoRoot: string): void {
  for (const [alias, existing] of Object.entries(HERMES_PARITY_GAP_ALIASES)) {
    attachAlias(program, existing, alias);
  }

  // --- Thin top-level verbs that Hermes exposes and TNF already can do ---

  if (!findCommand(program, 'model')) {
    program
      .command('model')
      .description('List / inspect models (Hermes parity; delegates to `tnf ai models`)')
      .action(async () => {
        const { LLMClient } = await import('../utils/llm-client.js');
        const client = await LLMClient.create();
        console.log(chalk.blue('\nFetching available models...'));
        const models = await client.fetchAvailableModels();
        if (models.length === 0) {
          console.log(chalk.yellow('No models found or provider does not support listing.'));
        } else {
          console.log(chalk.green('\nAvailable models:'));
          for (const m of models) console.log(` - ${m}`);
        }
        console.log(chalk.dim('\nTip: `tnf ai models` is the canonical TNF verb.\n'));
      });
  }

  if (!findCommand(program, 'monitoring')) {
    program
      .command('monitoring')
      .description('Fleet / relay monitoring snapshot (Hermes parity)')
      .option('--json', 'Emit machine-readable JSON')
      .action((opts: { json?: boolean } = {}) => {
        const home = path.join(os.homedir(), '.tnf');
        const snapshot = {
          redis: (() => {
            try {
              return (
                execFileSync('redis-cli', ['PING'], {
                  encoding: 'utf8',
                  stdio: ['ignore', 'pipe', 'ignore'],
                  timeout: 1000,
                }).trim() === 'PONG'
              );
            } catch {
              return false;
            }
          })(),
          directorLog: fs.existsSync(path.join(home, 'director', 'logs', 'director.log')),
          swarmContext: fs.existsSync(path.join(home, 'swarm-context.md')),
          handoff: fs.existsSync(path.join(home, 'handoff-current.json')),
          tips: ['tnf status', 'tnf relay monitor', 'tnf growth-audit', 'tnf doctor'],
        };
        if (opts.json) {
          console.log(JSON.stringify(snapshot, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Monitoring\n'));
        console.log(`  Redis        : ${snapshot.redis ? chalk.green('up') : chalk.red('down')}`);
        console.log(
          `  Director log : ${snapshot.directorLog ? chalk.green('present') : chalk.yellow('missing')}`
        );
        console.log(
          `  Swarm context: ${snapshot.swarmContext ? chalk.green('present') : chalk.yellow('missing')}`
        );
        console.log(
          `  Handoff cache: ${snapshot.handoff ? chalk.green('present') : chalk.yellow('missing')}`
        );
        console.log(chalk.dim('\n  Deeper probes:'));
        for (const t of snapshot.tips) console.log(chalk.dim(`    ${t}`));
        console.log('');
      });
  }

  if (!findCommand(program, 'security')) {
    program
      .command('security')
      .description('Security audit entrypoints (Hermes parity; read-only guidance + staged sweeps)')
      .option('--sweep', 'Run staged secret + privacy sweeps now')
      .action(async (opts: { sweep?: boolean } = {}) => {
        if (opts.sweep) {
          const { spawnSync } = await import('child_process');
          const sweeps: Array<[string, string[]]> = [
            ['node', ['scripts/security/privacy-guard.cjs', '--mode=staged']],
            ['node', ['scripts/security/secret-sweep.cjs', '--mode=staged']],
          ];
          for (const [bin, args] of sweeps) {
            console.log(chalk.dim(`$ ${bin} ${args.join(' ')}`));
            const r = spawnSync(bin, args, { cwd: repoRoot, encoding: 'utf8', stdio: 'inherit' });
            if (r.status !== 0) process.exit(r.status ?? 1);
          }
          return;
        }
        console.log(chalk.bold('\nTNF Security\n'));
        console.log('  Read-only sweeps (safe):');
        console.log('    tnf security --sweep');
        console.log('    pnpm secret:sweep:staged');
        console.log('    pnpm privacy:guard:staged');
        console.log('  Authority / isolation:');
        console.log('    tnf authority status');
        console.log('    tnf authority confirm-isolation   # operator-gated');
        console.log('');
      });
  }

  if (!findCommand(program, 'dump')) {
    program
      .command('dump')
      .description('Dump key TNF orientation paths (Hermes parity)')
      .option('--json', 'Emit machine-readable JSON')
      .action((opts: { json?: boolean } = {}) => {
        const home = path.join(os.homedir(), '.tnf');
        const dump = {
          repoRoot,
          branch: (() => {
            try {
              return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
                cwd: repoRoot,
                encoding: 'utf8',
              }).trim();
            } catch {
              return null;
            }
          })(),
          head: (() => {
            try {
              return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
                cwd: repoRoot,
                encoding: 'utf8',
              }).trim();
            } catch {
              return null;
            }
          })(),
          paths: {
            livingState: path.join(repoRoot, 'docs/protocols/LIVING_STATE.md'),
            sessionHandoff: path.join(
              repoRoot,
              'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'
            ),
            handoffCache: path.join(home, 'handoff-current.json'),
            swarmContext: path.join(home, 'swarm-context.md'),
            cliSyncReport: path.join(home, 'cli-sync', 'latest-report.json'),
          },
        };
        if (opts.json) {
          console.log(JSON.stringify(dump, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Dump\n'));
        console.log(`  repo   : ${dump.repoRoot}`);
        console.log(`  branch : ${dump.branch ?? 'unknown'}`);
        console.log(`  head   : ${dump.head ?? 'unknown'}`);
        for (const [k, v] of Object.entries(dump.paths)) {
          const ok = fs.existsSync(v);
          console.log(`  ${k.padEnd(14)}: ${ok ? chalk.green(v) : chalk.yellow(`${v} (missing)`)}`);
        }
        console.log('');
      });
  }

  if (!findCommand(program, 'prompt-size')) {
    program
      .command('prompt-size')
      .description('Estimate token size of a file or stdin (Hermes parity; ~4 chars/token)')
      .argument('[file]', 'File path (default: stdin if piped, else handoff JSON)')
      .option('--json', 'Emit machine-readable JSON')
      .action((file: string | undefined, opts: { json?: boolean } = {}) => {
        let text = '';
        let source = file ?? '';
        if (file) {
          text = fs.readFileSync(path.resolve(file), 'utf8');
        } else if (!process.stdin.isTTY) {
          text = fs.readFileSync(0, 'utf8');
          source = 'stdin';
        } else {
          source = path.join(repoRoot, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
          text = fs.existsSync(source) ? fs.readFileSync(source, 'utf8') : '';
        }
        const chars = text.length;
        const approxTokens = Math.ceil(chars / 4);
        const result = { source, chars, approxTokens, heuristic: 'chars/4' };
        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        console.log(`source : ${source || '(empty)'}`);
        console.log(`chars  : ${chars}`);
        console.log(`tokens : ~${approxTokens} (chars/4 heuristic)`);
      });
  }

  if (!findCommand(program, 'update')) {
    program
      .command('update')
      .description('Show how to update TNF CLI (Hermes parity; does not auto-mutate)')
      .action(() => {
        console.log(chalk.bold('\nTNF Update\n'));
        console.log('  Install / refresh local CLI entrypoint:');
        console.log('    bash scripts/install-tnf-cli.sh');
        console.log('  Rebuild package:');
        console.log('    pnpm --filter @the-new-fuse/tnf-cli run build');
        console.log('  Hermes itself:');
        console.log('    tnf hermes update');
        console.log(chalk.dim('\n  Auto-update is intentionally not run from this verb.\n'));
      });
  }

  if (!findCommand(program, 'logout')) {
    program
      .command('logout')
      .description('Explain how to clear TNF auth tokens (Hermes parity; no silent deletes)')
      .action(() => {
        console.log(chalk.bold('\nTNF Logout\n'));
        console.log('  Clear shell tokens for this session:');
        console.log(
          '    unset TNF_SUPER_ADMIN_TOKEN TNF_SUPER_ADMIN_INPUT_TOKEN CI_SUPER_ADMIN_TOKEN'
        );
        console.log('  Provider credentials live in OS keystores / env files — remove only with');
        console.log('  live operator confirmation. Prefer `tnf authority status` to inspect.');
        console.log('');
      });
  }

  if (!findCommand(program, 'approvals')) {
    program
      .command('approvals')
      .description('Approval / elevation entrypoints (Hermes parity)')
      .action(() => {
        console.log(chalk.bold('\nTNF Approvals\n'));
        console.log('  Authority elevation and grants:');
        console.log('    tnf authority status');
        console.log('    tnf authority --help');
        console.log('  Commits/pushes always require live operator confirmation');
        console.log('  (docs/core/AGENTS.md).');
        console.log('');
      });
  }

  // --- Round 2: remaining gaps ---

  if (!findCommand(program, 'checkpoints')) {
    program
      .command('checkpoints')
      .description('Session checkpoints (Hermes parity; lists TNF sessions)')
      .option('--json', 'Emit machine-readable JSON')
      .action(async (opts: { json?: boolean } = {}) => {
        const { SessionManagerService } = await import('../services/SessionManagerService.js');
        const mgr = new SessionManagerService();
        const sessions = mgr.list();
        if (opts.json) {
          console.log(JSON.stringify({ sessions }, null, 2));
          return;
        }
        console.log(chalk.bold('\nTNF Checkpoints (sessions)\n'));
        if (sessions.length === 0) {
          console.log(chalk.dim('  No sessions found. Use `tnf session` / `tnf tui`.'));
        } else {
          for (const s of sessions) {
            console.log(
              `  ${chalk.cyan(s.name || s.id)} (${s.provider}/${s.model}): ${s.messageCount} msgs`
            );
          }
        }
        console.log(chalk.dim('\n  Export: tnf export [sessionId] --output <path>\n'));
      });
  }

  if (!findCommand(program, 'lsp')) {
    program
      .command('lsp')
      .description('LSP status (Hermes parity; same as `tnf debug lsp`)')
      .option('--json', 'Emit machine-readable JSON')
      .action(async (opts: { json?: boolean } = {}) => {
        const { DebugService } = await import('../services/DebugService.js');
        const debugService = new DebugService();
        const lsp = debugService.debugLSP();
        if (opts.json) {
          console.log(JSON.stringify(lsp, null, 2));
          return;
        }
        console.log(chalk.bold('\nLSP Status\n'));
        console.log(`  Available: ${lsp.available ? chalk.green('yes') : chalk.red('no')}`);
        if (lsp.path) console.log(`  Path: ${chalk.dim(lsp.path)}`);
        if (lsp.version) console.log(`  Version: ${chalk.dim(lsp.version)}`);
        if (lsp.error) console.log(`  Error: ${chalk.red(lsp.error)}`);
        console.log('');
      });
  }

  if (!findCommand(program, 'migrate')) {
    program
      .command('migrate')
      .description('Data migrate entrypoint (Hermes parity; runs `tnf db migrate`)')
      .action(async () => {
        const { DatabaseService } = await import('../services/DatabaseService.js');
        const db = new DatabaseService();
        const result = await db.migrate();
        console.log(chalk.green(`✅ Migrated ${result.migrated} files`));
        for (const err of result.errors) console.log(chalk.yellow(err));
      });
  }

  if (!findCommand(program, 'secrets')) {
    program
      .command('secrets')
      .description('Secrets guidance (Hermes parity; no silent secret mutation)')
      .action(() => {
        console.log(chalk.bold('\nTNF Secrets\n'));
        console.log('  Inspect / rotate with live operator confirmation:');
        console.log('    tnf authority status');
        console.log('    tnf security --sweep');
        console.log('    tnf config resolved');
        console.log('  OS keystore / env files are never rewritten by this verb.');
        console.log('');
      });
  }

  if (!findCommand(program, 'profile')) {
    program
      .command('profile')
      .description('Operator profile / config view (Hermes parity)')
      .action(() => {
        console.log(chalk.bold('\nTNF Profile\n'));
        console.log('  Config:   tnf config resolved');
        console.log('  Browser:  tnf browser profiles   (if browser stack enabled)');
        console.log('  Session:  tnf session list');
        console.log('');
      });
  }

  // Channels — honest entrypoints (telegram is live; others route guidance)
  registerGuide(program, 'portal', 'Portal / gateway entry (Hermes parity)', [
    'TNF gateway:  tnf gateway',
    'Relay:        tnf relay start | tnf relay monitor',
    'Local UI:     tnf local-ui',
  ]);
  registerGuide(program, 'proxy', 'Proxy / relay entry (Hermes parity)', [
    'Relay core:   tnf relay start',
    'Monitor:      tnf relay monitor',
    'Gateway:      tnf gateway',
  ]);
  registerGuide(program, 'slack', 'Slack channel status (Hermes parity)', [
    'Native Slack bot is not shipped as a first-party TNF service yet.',
    'Live messaging channel today: tnf telegram status|start|send',
    'OpenClaw route (if installed): tnf openclaw / tnf claw',
  ]);
  registerGuide(program, 'whatsapp', 'WhatsApp channel status (Hermes parity)', [
    'Native WhatsApp bot is not a first-party TNF service yet.',
    'Live messaging channel today: tnf telegram status|start|send',
    'OpenClaw route (if installed): tnf openclaw / tnf claw',
  ]);
  registerGuide(program, 'whatsapp-cloud', 'WhatsApp Cloud API status (Hermes parity)', [
    'WhatsApp Cloud API is not a first-party TNF service yet.',
    'Live messaging channel today: tnf telegram status|start|send',
    'OpenClaw route (if installed): tnf openclaw / tnf claw',
  ]);

  // Extension / niche Hermes verbs — honest roadmap stubs
  registerGuide(program, 'bundles', 'Skill / plugin bundles (Hermes parity)', [
    'Skills:   tnf skill list',
    'Plugins:  tnf plugins --help',
    'Skill-bank: tnf skill-bank --help',
  ]);
  registerGuide(program, 'curator', 'Curator entry (Hermes parity)', [
    'No separate curator daemon yet. Closest surfaces:',
    '  tnf assimilate',
    '  tnf growth-audit',
    '  tnf parity audit',
  ]);
  registerGuide(program, 'pairing', 'Device / agent pairing (Hermes parity)', [
    'Authority / identity: tnf authority status',
    'Agent register:       tnf register --help',
  ]);
  registerGuide(program, 'pets', 'Pets / companion agents (Hermes parity)', [
    'TNF does not ship Hermes-style pets. Use agent roster:',
    '  tnf agents-specs --search <name>',
    '  tnf agents --help',
  ]);
  registerGuide(program, 'skin', 'UI skin / theme (Hermes parity)', [
    'Themes:  tnf theme --help',
    'TUI:     tnf tui',
    'Splash:  tnf splash --theme <name>',
  ]);
  registerGuide(program, 'egress', 'Egress / outbound policy (Hermes parity)', [
    'Security sweeps: tnf security --sweep',
    'Authority:       tnf authority status',
  ]);
  registerGuide(program, 'fallback', 'Model fallback guidance (Hermes parity)', [
    'Models:   tnf model   /  tnf ai models',
    'Config:   tnf config resolved',
  ]);
  registerGuide(program, 'import-agent', 'Import agent specs (Hermes parity)', [
    'List specs:  tnf agents-specs',
    'Classify:    tnf agents-classify --help',
    'Register:    tnf register --help',
  ]);
  registerGuide(program, 'moa', 'Mixture-of-agents entry (Hermes parity)', [
    'TNF multi-agent: tnf agents-run --help',
    'Orchestrate:     tnf mapreduce --help',
    'Parity:          tnf parity audit',
  ]);
}
