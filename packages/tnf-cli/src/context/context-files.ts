/**
 * Context-file loader.
 *
 * Mirrors pi's behavior for AGENTS.md / CLAUDE.md discovery so the tnf CLI
 * can pick up the same project-level agent instructions at startup.
 *
 * Discovery rules (matches docs/context-files in the pi-coding-agent):
 *   1. Global file at ~/.pi/agent/AGENTS.md            (we allow ~/.tnf too)
 *   2. Walk UP from cwd through every parent directory,
 *      collecting any AGENTS.md / CLAUDE.md encountered.
 *   3. The cwd itself.
 *
 * Files are concatenated in walk order:
 *   - global first
 *   - then furthest ancestor → nearest parent → cwd
 *   so that closer-in files take precedence semantically (more specific
 *   instructions appear last, which is the LLM's "freshest" input).
 *
 * Loading can be disabled by:
 *   - Cli flag  --no-context-files / -nc  (handled in cli.ts)
 *   - Env var   TNF_NO_CONTEXT_FILES=1
 *
 * APPEND_SYSTEM.md / SYSTEM.md overrides are honored on top of this.
 *
 * This is the same way pi treats AGENTS.md / CLAUDE.md as "context files"
 * without baking them into the static SYSTEM_PROMPT.md.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface LoadedContextFile {
  /** Absolute path on disk. */
  path: string;
  /** Effective label for diagnostic output, e.g. "~/.tnf/AGENTS.md" or "AGENTS.md". */
  label: string;
  /** Source file, normalized to one of: AGENTS.md | CLAUDE.md | OTHER */
  kind: 'AGENTS.md' | 'CLAUDE.md' | 'OTHER';
  bytes: number;
  content: string;
}

export interface ContextFilesOptions {
  /** Root directory to start walking from. Defaults to process.cwd(). */
  startDir?: string;
  /** Anchor for the upward walk. Defaults to the lesser of startDir and repoRoot. */
  walkAnchor?: string;
  /** Whether loading is enabled. Defaults to true. */
  enabled?: boolean;
  /** Override the home directory (used by tests). */
  homeDir?: string;
}

const DEFAULT_FILENAMES = ['AGENTS.md', 'CLAUDE.md'] as const;

function isDisabled(): boolean {
  const flag = (process.env.TNF_NO_CONTEXT_FILES || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(flag);
}

function walkUp(fromDir: string, stopAt: string): string[] {
  const stops = new Set<string>();
  let cur = path.resolve(fromDir);
  const limit = path.resolve(stopAt);
  const out: string[] = [];
  while (true) {
    out.push(cur);
    stops.add(cur);
    if (cur === limit || cur === path.dirname(cur)) break;
    cur = path.dirname(cur);
  }
  return out;
}

function maybeRead(filePath: string): { kind: LoadedContextFile['kind']; content: string } | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  const base = path.basename(filePath);
  if (base === 'AGENTS.md') return { kind: 'AGENTS.md', content };
  if (base === 'CLAUDE.md') return { kind: 'CLAUDE.md', content };
  return { kind: 'OTHER', content };
}

function labelFor(filePath: string, homeDir: string, repoRoot: string): string {
  const norm = (s: string) => s.replace(/\\/g, '/').replace(/\/+$/, '');
  const rel = (a: string, b: string) => {
    const aN = norm(a);
    const bN = norm(b);
    if (aN === bN) return path.basename(a);
    if (bN.startsWith(aN + '/')) {
      const rest = bN.slice(aN.length + 1);
      return rest || path.basename(a);
    }
    return b;
  };
  if (filePath.startsWith(homeDir)) return `~${rel(homeDir, filePath)}`;
  if (repoRoot && filePath.startsWith(repoRoot)) return rel(repoRoot, filePath);
  return filePath;
}

/**
 * Discover and load AGENTS.md / CLAUDE.md context files using pi's rules.
 *
 * @returns the loaded files in declaration order, plus the combined body.
 */
export function loadContextFiles(options: ContextFilesOptions = {}): {
  files: LoadedContextFile[];
  combined: string;
  disabled: boolean;
} {
  const enabled = options.enabled ?? !isDisabled();
  const startDir = options.startDir ?? process.cwd();
  const homeDir = options.homeDir ?? os.homedir();
  const anchor =
    options.walkAnchor ??
    (() => {
      // Default anchor: try repoRoot, else fall back to home.
      return path.resolve(startDir);
    })();

  if (!enabled) {
    return { files: [], combined: '', disabled: true };
  }

  const out: LoadedContextFile[] = [];

  // 1. Global ~/.pi/agent/AGENTS.md and ~/.tnf/AGENTS.md (both supported
  //    so existing operators don't have to migrate).
  for (const globalRoot of [path.join(homeDir, '.pi', 'agent'), path.join(homeDir, '.tnf')]) {
    for (const base of DEFAULT_FILENAMES) {
      const candidate = path.join(globalRoot, base);
      const found = maybeRead(candidate);
      if (found) {
        const content = stripFrontmatter(found.content).body;
        out.push({
          path: candidate,
          label: labelFor(candidate, homeDir, anchor),
          kind: found.kind,
          bytes: Buffer.byteLength(content, 'utf8'),
          content,
        });
      }
    }
  }

  // 2. Walk UP from cwd through anchor, collecting every AGENTS.md / CLAUDE.md
  //    that exists. Order is furthest ancestor → anchor (so closer files
  //    appear later). When the walker reaches the anchor, it stops.
  const walked = walkUp(startDir, anchor).reverse();
  const seenPath = new Set(out.map((f) => f.path));
  for (const dir of walked) {
    for (const base of DEFAULT_FILENAMES) {
      const candidate = path.join(dir, base);
      if (seenPath.has(candidate)) continue;
      const found = maybeRead(candidate);
      if (found) {
        const content = stripFrontmatter(found.content).body;
        out.push({
          path: candidate,
          label: labelFor(candidate, homeDir, anchor),
          kind: found.kind,
          bytes: Buffer.byteLength(content, 'utf8'),
          content,
        });
        seenPath.add(candidate);
      }
    }
  }

  if (out.length === 0) {
    return { files: [], combined: '', disabled: false };
  }

  const header =
    '# Context Files (auto-loaded, in walk order)\n\n' +
    out.map((f) => `- \`${f.label}\` (${f.kind}, ${f.bytes} bytes)`).join('\n') +
    '\n';
  const combined =
    header +
    '\n' +
    out.map((f) => `## ${f.label}\n\n${f.content.trim()}`).join('\n\n---\n\n');

  return { files: out, combined, disabled: false };
}

/**
 * Strip YAML frontmatter at the top of a markdown file (e.g. `--- ... ---`).
 * Mirrors the optional frontmatter-handling behavior of pi AGENTS.md.
 *
 * Returns the parsed frontmatter keys (flat k:v only) plus the body
 * with the frontmatter removed.
 */
export function stripFrontmatter(raw: string): {
  body: string;
  frontmatter: Record<string, string>;
} {
  const trimmed = raw.replace(/^\uFEFF/, '');
  const lines = trimmed.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { body: raw, frontmatter: {} };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { body: raw, frontmatter: {} };
  }
  const front: Record<string, string> = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^['"]|['"]$/g, '');
      front[key] = val;
    }
  }
  const body = lines.slice(end + 1).join('\n');
  return { body, frontmatter: front };
}

/**
 * Composite builder: returns the assembled context-file payload suitable
 * for appending into the system prompt. Empty when no files were found
 * and disabled is false.
 */
export function buildContextFilesPromptSection(options: ContextFilesOptions = {}): string {
  const { files, combined } = loadContextFiles(options);
  if (files.length === 0) return '';
  return combined;
}
