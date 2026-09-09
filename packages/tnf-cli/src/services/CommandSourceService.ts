/**
 * packages/tnf-cli/src/services/CommandSourceService.ts
 *
 * Unified discovery of every Markdown-defined command, agent, skill and
 * prompt template this workspace exposes — from ALL runtimes, not just TNF's
 * own.
 *
 * THE BUG THIS FIXES
 *   TNF provisions a large command surface into the peer CLIs it runs beside:
 *   `.claude/commands/*.md`, `.claude/agents/*.md`, `.agent/agents/*.md`,
 *   `.agent/skills/<name>/SKILL.md`, `.gemini/skills/`, `.pi/prompts/`. Those
 *   are TNF-authored artifacts describing TNF operations — and every one of
 *   them was invisible from inside the `tnf` CLI itself, because
 *   `ProjectConfigService.getCommands()` reads exactly one directory
 *   (`.tnf/command/*.md` — TNF-canonical command surface; peer dirs like
 *   `.claude/commands` are adapters) and
 *   `discoverPromptTemplates()` reads exactly one more (`.pi/prompts`).
 *
 *   Net effect: `tnf` was the only agent on the box that could not see the
 *   commands TNF wrote for the other agents. This service is the shared index
 *   that closes that gap; the palette and `tnf commands` both read from it.
 *
 * PRECEDENCE AND DEDUPE
 *   Sources are searched project-first, then user-home. A name claimed by an
 *   earlier root wins; later duplicates are dropped but counted, so
 *   `tnf commands --json` can show that a project command is shadowing a
 *   global one rather than silently hiding it.
 *
 * NOT AN EXECUTOR
 *   Discovery only. Whether a given entry is *runnable* depends on its kind:
 *   commands and prompts expand into a prompt, agents and skills are context
 *   the agent loads. `kind` carries that distinction to the caller.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type DiscoveredKind = 'command' | 'agent' | 'skill' | 'prompt';

/** Which runtime's directory convention an entry was found under. */
export type DiscoveredRuntime = 'tnf' | 'claude' | 'gemini' | 'pi' | 'agent' | 'cursor' | 'codex';

export interface DiscoveredEntry {
  /** Bare name, no extension, no leading slash. */
  name: string;
  kind: DiscoveredKind;
  runtime: DiscoveredRuntime;
  /** 'project' when found under the repo, 'user' when under $HOME. */
  scope: 'project' | 'user';
  description: string;
  filePath: string;
  /** Body with frontmatter stripped. Loaded lazily — empty until read. */
  body?: string;
}

interface SourceRoot {
  runtime: DiscoveredRuntime;
  kind: DiscoveredKind;
  scope: 'project' | 'user';
  dir: string;
  /** 'flat' = *.md in dir; 'nested' = dir/<name>/SKILL.md */
  layout: 'flat' | 'nested';
}

/**
 * Minimal YAML frontmatter reader.
 *
 * Handles the three shapes that actually occur across these runtimes:
 *   description: text
 *   description: "quoted text"
 *   description:
 *     folded text continued
 *     on following indented lines
 *
 * A real YAML parse would be heavier and no more correct for this input; the
 * only keys read are `name` and `description`.
 */
export function parseFrontmatter(text: string): {
  fields: Record<string, string>;
  body: string;
} {
  if (!text.startsWith('---')) return { fields: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fields: {}, body: text };

  const head = text.slice(3, end);
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const fields: Record<string, string> = {};

  let currentKey: string | null = null;
  for (const rawLine of head.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;

    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (keyMatch && !/^\s/.test(line)) {
      currentKey = keyMatch[1].toLowerCase();
      const value = keyMatch[2].trim();
      fields[currentKey] = stripQuotes(value);
      continue;
    }

    // Indented continuation. List items (`- foo`) belong to keys we do not
    // read, so only fold plain text into a key that already has a value slot.
    if (currentKey && /^\s+/.test(line) && !/^\s*-\s/.test(line)) {
      const cont = line.trim();
      fields[currentKey] = (fields[currentKey] ? `${fields[currentKey]} ` : '') + stripQuotes(cont);
      continue;
    }

    // Anything else (list items, nested maps) ends the folded run.
    if (/^\s*-\s/.test(line)) currentKey = null;
  }

  return { fields, body };
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

/** First non-empty, non-heading prose line — the fallback description. */
function firstProseLine(body: string): string {
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('```')) continue;
    if (trimmed.startsWith('<!--')) continue;
    return trimmed.replace(/^[*_>-]+\s*/, '');
  }
  return '';
}

function condense(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export class CommandSourceService {
  private cache: DiscoveredEntry[] | null = null;

  constructor(
    private readonly projectRoot: string,
    private readonly home: string = os.homedir()
  ) {}

  /**
   * Every root searched, in precedence order. Project beats user; within a
   * scope, TNF-native beats peer-runtime directories, so a `.tnf/command`
   * entry shadows a same-named `.claude/commands` entry rather than the
   * reverse.
   */
  private roots(): SourceRoot[] {
    const p = (...parts: string[]) => path.join(this.projectRoot, ...parts);
    const u = (...parts: string[]) => path.join(this.home, ...parts);

    return [
      // --- project scope ---
      // TNF-native first, then .agent (TNF skill/agent bank), then peer CLIs.
      {
        runtime: 'tnf',
        kind: 'command',
        scope: 'project',
        dir: p('.tnf', 'command'),
        layout: 'flat',
      },
      { runtime: 'tnf', kind: 'agent', scope: 'project', dir: p('.tnf', 'agent'), layout: 'flat' },
      {
        runtime: 'agent',
        kind: 'agent',
        scope: 'project',
        dir: p('.agent', 'agents'),
        layout: 'flat',
      },
      {
        runtime: 'agent',
        kind: 'skill',
        scope: 'project',
        dir: p('.agent', 'skills'),
        layout: 'nested',
      },
      {
        runtime: 'claude',
        kind: 'command',
        scope: 'project',
        dir: p('.claude', 'commands'),
        layout: 'flat',
      },
      {
        runtime: 'claude',
        kind: 'agent',
        scope: 'project',
        dir: p('.claude', 'agents'),
        layout: 'flat',
      },
      {
        runtime: 'claude',
        kind: 'skill',
        scope: 'project',
        dir: p('.claude', 'skills'),
        layout: 'nested',
      },
      {
        runtime: 'gemini',
        kind: 'command',
        scope: 'project',
        dir: p('.gemini', 'commands'),
        layout: 'flat',
      },
      {
        runtime: 'gemini',
        kind: 'skill',
        scope: 'project',
        dir: p('.gemini', 'skills'),
        layout: 'nested',
      },
      {
        runtime: 'cursor',
        kind: 'command',
        scope: 'project',
        dir: p('.cursor', 'commands'),
        layout: 'flat',
      },
      {
        runtime: 'codex',
        kind: 'prompt',
        scope: 'project',
        dir: p('.codex', 'prompts'),
        layout: 'flat',
      },
      { runtime: 'pi', kind: 'prompt', scope: 'project', dir: p('.pi', 'prompts'), layout: 'flat' },

      // --- user scope ---
      { runtime: 'tnf', kind: 'command', scope: 'user', dir: u('.tnf', 'command'), layout: 'flat' },
      {
        runtime: 'agent',
        kind: 'skill',
        scope: 'user',
        dir: u('.agents', 'skills'),
        layout: 'nested',
      },
      {
        runtime: 'claude',
        kind: 'command',
        scope: 'user',
        dir: u('.claude', 'commands'),
        layout: 'flat',
      },
      {
        runtime: 'claude',
        kind: 'agent',
        scope: 'user',
        dir: u('.claude', 'agents'),
        layout: 'flat',
      },
      {
        runtime: 'claude',
        kind: 'skill',
        scope: 'user',
        dir: u('.claude', 'skills'),
        layout: 'nested',
      },
      {
        runtime: 'gemini',
        kind: 'command',
        scope: 'user',
        dir: u('.gemini', 'commands'),
        layout: 'flat',
      },
      {
        runtime: 'codex',
        kind: 'prompt',
        scope: 'user',
        dir: u('.codex', 'prompts'),
        layout: 'flat',
      },
      {
        runtime: 'pi',
        kind: 'prompt',
        scope: 'user',
        dir: u('.pi', 'agent', 'prompts'),
        layout: 'flat',
      },
    ];
  }

  /**
   * Discover every entry, deduped by `kind:name`.
   *
   * Nested (skill) roots are walked one level deep for grouped libraries —
   * `.agent/skills/anthropic/pdf/SKILL.md` is real in this repo, so a
   * single-level scan would miss most of the 500+ skills present.
   */
  discover(options: { refresh?: boolean } = {}): DiscoveredEntry[] {
    if (this.cache && !options.refresh) return this.cache;

    const out: DiscoveredEntry[] = [];
    const claimed = new Set<string>();

    for (const root of this.roots()) {
      if (!this.isDir(root.dir)) continue;
      const found = root.layout === 'flat' ? this.scanFlat(root) : this.scanNested(root);
      for (const entry of found) {
        const key = `${entry.kind}:${entry.name.toLowerCase()}`;
        if (claimed.has(key)) continue;
        claimed.add(key);
        out.push(entry);
      }
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    this.cache = out;
    return out;
  }

  /** Read and cache an entry's body on demand. Discovery stays cheap. */
  loadBody(entry: DiscoveredEntry): string {
    if (entry.body !== undefined) return entry.body;
    try {
      const raw = fs.readFileSync(entry.filePath, 'utf8');
      entry.body = parseFrontmatter(raw).body;
    } catch {
      entry.body = '';
    }
    return entry.body;
  }

  /** Counts per runtime/kind, for `tnf commands --stats` and doctor output. */
  summary(): Array<{ runtime: DiscoveredRuntime; kind: DiscoveredKind; count: number }> {
    const counts = new Map<string, number>();
    for (const entry of this.discover()) {
      const key = `${entry.runtime}:${entry.kind}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([key, count]) => {
        const [runtime, kind] = key.split(':');
        return { runtime: runtime as DiscoveredRuntime, kind: kind as DiscoveredKind, count };
      })
      .sort((a, b) => b.count - a.count);
  }

  private isDir(dir: string): boolean {
    try {
      return fs.statSync(dir).isDirectory();
    } catch {
      return false;
    }
  }

  private scanFlat(root: SourceRoot): DiscoveredEntry[] {
    const out: DiscoveredEntry[] = [];
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(root.dir, { withFileTypes: true });
    } catch {
      return out;
    }

    for (const dirent of entries) {
      if (!dirent.name.endsWith('.md')) continue;
      if (dirent.name === 'README.md') continue;
      const filePath = path.join(root.dir, dirent.name);
      const built = this.buildEntry(root, filePath, dirent.name.replace(/\.md$/, ''));
      if (built) out.push(built);
    }
    return out;
  }

  /**
   * Walk `<dir>/**\/SKILL.md` to a bounded depth. Grouped libraries nest one
   * level (`anthropic/pdf/SKILL.md`); depth 3 covers that with headroom while
   * keeping the scan off the deep end of a 500-entry tree.
   */
  private scanNested(root: SourceRoot, dir = root.dir, depth = 0, prefix = ''): DiscoveredEntry[] {
    const out: DiscoveredEntry[] = [];
    if (depth > 3) return out;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return out;
    }

    for (const dirent of entries) {
      if (!dirent.isDirectory()) continue;
      if (dirent.name.startsWith('.')) continue;
      const childDir = path.join(dir, dirent.name);
      const name = prefix ? `${prefix}/${dirent.name}` : dirent.name;
      const skillFile = path.join(childDir, 'SKILL.md');

      if (fs.existsSync(skillFile)) {
        const built = this.buildEntry(root, skillFile, name);
        if (built) out.push(built);
        continue;
      }
      out.push(...this.scanNested(root, childDir, depth + 1, name));
    }
    return out;
  }

  private buildEntry(
    root: SourceRoot,
    filePath: string,
    fallbackName: string
  ): DiscoveredEntry | null {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }

    const { fields, body } = parseFrontmatter(raw);
    const description = condense(fields.description || firstProseLine(body));

    return {
      // Frontmatter `name` is authoritative for agents/skills (it is what the
      // peer runtime dispatches on); commands are addressed by filename.
      name:
        root.kind === 'command' || root.kind === 'prompt'
          ? fallbackName
          : fields.name || fallbackName,
      kind: root.kind,
      runtime: root.runtime,
      scope: root.scope,
      description,
      filePath,
    };
  }
}
