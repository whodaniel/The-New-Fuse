/**
 * Phase-2.1 (tnf pi parity): `.pi`-style declarative run-mode file loader.
 *
 * Mirrors `.pi`'s run-mode system at docs/usage.md: `.pi`'s interactive
 * shell can be configured with a declarative run-mode file that sets
 *   - defaultProvider / defaultModel
 *   - defaultThinkingLevel
 *   - httpIdleTimeoutMs
 *   - tool-level overrides
 *   - shell-level aliases/macros
 *
 * For `tnf`, this module ONLY owns the discovery + parse layer. It does
 * NOT replace `tnf tui` or `tnf --mode json`; it provides a uniform
 * overlay config that `tnf run-mode <list|show|use>` reveals/dumps.
 *
 * Discovery topology (matches `.pi`):
 *   - ~/.pi/agent/modes/**
 *   - ~/.tnf/modes/**
 *
 * Schema (deliberately a subset of `.pi`'s settings.json shape so a
 * `pi settings.json` could later be fed directly):
 *   {
 *     "name": "research-deep",
 *     "description": "Deep research session profile.",
 *     "extends": "default",
 *     "settings": {
 *       "defaultProvider": "nvidia",
 *       "defaultModel": "minimaxai/minimax-m3",
 *       "defaultThinkingLevel": "high"
 *     },
 *     "toolOverrides": { "bash": { "timeout": 600 } },
 *     "shellAliases": { "list-mods": "/model list" }
 *   }
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface RunModeFile {
  name: string;
  description?: string;
  extends?: string;
  settings: Record<string, unknown>;
  toolOverrides?: Record<string, Record<string, unknown>>;
  shellAliases?: Record<string, string>;
}

export interface DiscoveredRunMode {
  name: string;
  source: string;
  path: string;
  file: RunModeFile;
}

export function loadRunModeFile(absPath: string): RunModeFile {
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<RunModeFile>;
  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error(`Run-mode file missing required 'name' string: ${absPath}`);
  }
  return {
    name: parsed.name,
    description: typeof parsed.description === 'string' ? parsed.description : undefined,
    extends: typeof parsed.extends === 'string' ? parsed.extends : undefined,
    settings: (parsed.settings && typeof parsed.settings === 'object'
      ? parsed.settings
      : {}) as Record<string, unknown>,
    toolOverrides: parsed.toolOverrides ?? {},
    shellAliases: parsed.shellAliases ?? {},
  };
}

export function discoverRunModes(repoRootArg?: string): DiscoveredRunMode[] {
  const home = os.homedir();
  const roots: Array<{ source: string; dir: string }> = [
    { source: 'tnf', dir: path.join(home, '.tnf', 'modes') },
    { source: 'pi', dir: path.join(home, '.pi', 'agent', 'modes') },
  ];
  if (repoRootArg) {
    roots.push({ source: 'repo', dir: path.join(repoRootArg, 'data', 'run-modes') });
  }
  const seen = new Set<string>();
  const out: DiscoveredRunMode[] = [];
  for (const { source, dir } of roots) {
    if (!fs.existsSync(dir)) continue;
    const walk = (cur: string): void => {
      const entries = fs.readdirSync(cur, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(cur, e.name);
        let probe = full;
        if (e.isSymbolicLink()) {
          try {
            probe = fs.realpathSync(full);
          } catch {}
        }
        let isDir = false;
        try {
          isDir = fs.statSync(probe).isDirectory();
        } catch {}
        if (isDir) {
          walk(probe);
          continue;
        }
        if (!probe.endsWith('.json') && !probe.endsWith('.yaml') && !probe.endsWith('.yml'))
          continue;
        const key = `${source}::${probe}`;
        if (seen.has(key)) continue;
        seen.add(key);
        try {
          const file = loadRunModeFile(probe);
          out.push({
            name: path.relative(dir, probe).replace(/\.(json|ya?ml)$/, ''),
            source,
            path: probe,
            file,
          });
        } catch {
          // skip invalid files silently — they're enumerated by `tnf run-mode list`
          // with the loader output path; a missing/broken file should not block discovery.
        }
      }
    };
    walk(dir);
  }
  return out;
}

export interface ResolvedRunMode extends DiscoveredRunMode {
  inheritedFrom: string[];
}

export function resolveRunMode(mode: DiscoveredRunMode, all: DiscoveredRunMode[]): ResolvedRunMode {
  const inherited: string[] = [];
  let current: DiscoveredRunMode | undefined = mode;
  const visited = new Set<string>();
  while (current && typeof current.file.extends === 'string' && !visited.has(current.name)) {
    visited.add(current.name);
    const parent = all.find(
      (m) => m.name === current!.file.extends || m.file.name === current!.file.extends
    );
    if (!parent) break;
    inherited.push(parent.name);
    current = parent;
  }
  return { ...mode, inheritedFrom: inherited.reverse() };
}
