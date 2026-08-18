/**
 * packages/tnf-cli/src/commands/config.ts
 *
 * `tnf config` — view the local TNF config (Hermes parity: `hermes config`).
 *
 *   tnf config                  Print resolved config (read-only)
 *   tnf config --json           Machine-readable
 *   tnf config --path           Print the location of the resolved config
 *
 * This is intentionally minimal: the full config-edit surface is gated
 * behind `tnf setup` and external tools. Here we just inspect.
 */

import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerOrNest } from './_registry.js';
import { redactSensitiveConfig } from '../services/DebugService.js';

function resolveConfigPath(repoRoot: string): string {
  const candidates = [
    process.env.TNF_CONFIG,
    path.join(repoRoot, 'tnf.config.json'),
    path.join(repoRoot, '.tnfrc'),
    path.join(repoRoot, '.tnf', 'config.json'),
    path.join(os.homedir(), '.tnf', 'config.json'),
  ].filter(Boolean) as string[];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[1]; // default to repoRoot/tnf.config.json (may not exist)
}

interface ConfigView {
  repoRoot: string;
  configPath: string;
  configExists: boolean;
  config: Record<string, unknown> | null;
  env: Record<string, string>;
}

export function registerConfigCommand(program: Command, repoRoot: string): void {
  // cli.ts already owns a top-level `config` group (kilo parity). Nest the
  // Hermes-parity view underneath it as `tnf config resolved` rather than
  // re-registering `config`, which Commander rejects as a duplicate.
  const { command } = registerOrNest(program, 'config', 'resolved');
  command
    .description('View the resolved TNF configuration (Hermes parity)')
    .option('--json', 'Emit machine-readable JSON')
    .option('--path', 'Print only the config path')
    .action((opts: { json?: boolean; path?: boolean } = {}) => {
      const configPath = resolveConfigPath(repoRoot);
      let parsed: Record<string, unknown> | null = null;
      if (fs.existsSync(configPath)) {
        try {
          parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch {
          parsed = null;
        }
      }
      const view: ConfigView = {
        repoRoot,
        configPath,
        configExists: fs.existsSync(configPath),
        config: parsed ? redactSensitiveConfig(parsed) : null,
        env: {
          TNF_CONFIG: process.env.TNF_CONFIG ?? '',
          HOME: os.homedir(),
        },
      };
      if (opts.path) {
        console.log(configPath);
      } else if (opts.json) {
        console.log(JSON.stringify(view, null, 2));
      } else {
        console.log(`config path : ${configPath}`);
        console.log(`exists      : ${view.configExists}`);
        if (view.config) {
          for (const [k, v] of Object.entries(view.config)) {
            console.log(`  ${k.padEnd(20)} = ${JSON.stringify(v)}`);
          }
        } else {
          console.log('  (no config file found)');
        }
      }
    });
}
