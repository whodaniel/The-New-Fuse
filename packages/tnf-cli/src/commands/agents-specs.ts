/**
 * packages/tnf-cli/src/commands/agents-specs.ts
 *
 * `tnf agents specs` — enumerate agent spec files in `.agent/agents/` (and
 * `.claude/agents/`) without ingesting frontmatter. This is the lightweight
 * bridge between the 191 agent markdown specs and the CLI surface so the
 * `tnf-cli-with-agents` sync script can identify the registry without
 * needing to count each spec as a missing CLI command.
 *
 * Subcommands:
 *   specs                  List all spec filenames (one per line)
 *   specs --json           Emit { count, specs: [...] }
 *   specs --search <sub>   Filter spec filenames by substring
 *   specs --paths          Include `.claude/agents/` in addition to `.agent/agents/`
 *
 * No external dependencies beyond `commander` and `fs`. Pure read-only.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

function listSpecFiles(repoRoot: string, includeClaude: boolean): string[] {
  const dirs = [path.join(repoRoot, '.agent', 'agents')];
  if (includeClaude) dirs.push(path.join(repoRoot, '.claude', 'agents'));

  const out: string[] = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.endsWith('.md')) {
        out.push(path.join(dir, entry));
      }
    }
  }
  return out.sort();
}

export function registerAgentsSpecsCommand(program: Command, repoRoot: string): void {
  program
    .command('agents-specs')
    .description('List agent spec files in .agent/agents/ (and optionally .claude/agents/)')
    .option('--json', 'Emit machine-readable JSON')
    .option('--search <substring>', 'Filter spec filenames containing substring')
    .option('--paths', 'Include .claude/agents/ in addition to .agent/agents/')
    .action((options: { json?: boolean; search?: string; paths?: boolean } = {}) => {
      let specs = listSpecFiles(repoRoot, !!options.paths).map((p) => path.basename(p, '.md'));
      if (options.search) {
        const needle = options.search.toLowerCase();
        specs = specs.filter((s) => s.toLowerCase().includes(needle));
      }
      if (options.json) {
        console.log(JSON.stringify({ count: specs.length, specs }, null, 2));
      } else {
        for (const s of specs) console.log(s);
      }
    });
}
