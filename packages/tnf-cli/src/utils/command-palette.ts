/**
 * packages/tnf-cli/src/utils/command-palette.ts
 *
 * Flat, fuzzy command palette for TNF's interactive shells.
 *
 * WHAT WAS WRONG BEFORE
 *   The old dropdown indexed ~40 hand-curated top-level slash commands and
 *   matched them with `startsWith`. Selecting `/harness` ran `tnf harness`,
 *   which prints a help page — so the operator's "selection" was really just
 *   step one of a manual two-step: pick the namespace, read the menu, retype
 *   the command. Anything below depth 1 was unreachable by typing its own
 *   name, and 795 Markdown-defined commands/agents/skills were not indexed at
 *   all.
 *
 * WHAT THIS DOES INSTEAD
 *   One flat index over every addressable thing:
 *     - every Commander path at every depth (~410, leaves included)
 *     - the curated slash commands (kept: they carry good default arguments)
 *     - every Markdown command/prompt/agent/skill found by
 *       CommandSourceService, including the ones TNF provisioned into peer
 *       CLIs
 *   ranked by fuzzy score so `regi` lands directly on `agents register` and
 *   `cycle` lands directly on `harness cycle`. No namespace hop.
 *
 * RENDERING
 *   Drawn in place below the prompt line and erased on dismiss, rather than
 *   the old approach of appending a fresh block per keystroke (which scrolled
 *   a new copy of the menu into the scrollback on every character typed).
 *   The region is reserved up-front by emitting newlines and moving back up,
 *   so the saved cursor position stays valid when the palette opens near the
 *   bottom of the screen.
 *
 * TESTABILITY
 *   Index construction, ranking and frame composition are pure functions over
 *   plain data. `PaletteController` owns the only stateful part (cursor
 *   position + what is currently on screen) and takes its writer and terminal
 *   size by injection, so the tests drive it without a TTY.
 */

import type { Command } from 'commander';
import type { DiscoveredEntry } from '../services/CommandSourceService.js';
import { fuzzyMatchEntry, highlight } from './fuzzy.js';

/** How an entry is dispatched once chosen. */
export type PaletteAction =
  | { type: 'cli'; argv: string[] }
  | { type: 'slash'; name: string }
  | { type: 'markdown'; entry: DiscoveredEntry };

export interface PaletteEntry {
  /** Stable identity, used for dedupe and for recents. */
  id: string;
  /** What the operator types/sees, e.g. `agents register <name> <role>`. */
  label: string;
  /** Text the matcher scores against — the label without argument sigils. */
  searchText: string;
  /** Tokens inserted into the buffer on Tab-complete. */
  tokens: string[];
  description: string;
  /** Short right-aligned provenance tag, e.g. `cli`, `skill·agent`. */
  badge: string;
  /** Ordering weight; higher tiers float above lower ones at equal score. */
  tier: number;
  /** True when the command still needs a required `<arg>` before it can run. */
  needsArgs: boolean;
  action: PaletteAction;
}

export interface RankedEntry {
  entry: PaletteEntry;
  score: number;
  positions: number[];
}

/**
 * Tier weights. Real CLI verbs are what an operator means 95% of the time, so
 * they sit above the 795 Markdown definitions — otherwise a query like `age`
 * would bury `agents list` under 200 agent personas whose names start "age".
 */
const TIER_SLASH = 4;
const TIER_CLI = 3;
const TIER_MD_COMMAND = 2;
const TIER_MD_PROMPT = 2;
const TIER_MD_AGENT = 1;
const TIER_MD_SKILL = 0;

/** Points added per tier. Large enough to order tiers, small enough that a
 *  much better fuzzy hit in a lower tier can still win. */
const TIER_WEIGHT = 120;

/* ------------------------------------------------------------------ */
/* Index construction                                                  */
/* ------------------------------------------------------------------ */

/** Render a command's argument signature, e.g. `<name> [role...]`. */
function argSignature(command: Command): string {
  const args = (command as unknown as { registeredArguments?: unknown[] }).registeredArguments as
    | Array<{ name(): string; required: boolean; variadic: boolean }>
    | undefined;
  if (!args?.length) return '';
  return args
    .map((arg) => {
      const name = `${arg.name()}${arg.variadic ? '...' : ''}`;
      return arg.required ? `<${name}>` : `[${name}]`;
    })
    .join(' ');
}

function hasRequiredArgs(command: Command): boolean {
  const args = (command as unknown as { registeredArguments?: unknown[] }).registeredArguments as
    | Array<{ required: boolean }>
    | undefined;
  return Boolean(args?.some((arg) => arg.required));
}

/**
 * Flatten the Commander tree into one entry per node at every depth.
 *
 * Both branch nodes (`agents`) and leaves (`agents register`) are indexed.
 * Branches stay in because some of them do useful work on their own; leaves
 * are the point of the exercise.
 */
export function collectCliEntries(root: Command, lineage: string[] = []): PaletteEntry[] {
  const out: PaletteEntry[] = [];

  for (const sub of root.commands) {
    const name = sub.name();
    if (!name || name === 'help') continue;
    // Commander marks internal/hidden commands; respect that here too.
    if ((sub as unknown as { _hidden?: boolean })._hidden) continue;

    const tokens = [...lineage, name];
    const path = tokens.join(' ');
    const signature = argSignature(sub);
    const isBranch = sub.commands.length > 0;

    out.push({
      id: `cli:${path}`,
      label: signature ? `${path} ${signature}` : path,
      searchText: path,
      tokens,
      description: sub.description() || '',
      // A branch that also has subcommands is worth flagging: choosing it
      // shows its own help, which is exactly the dead end this palette exists
      // to route around.
      badge: isBranch ? 'cli▸' : 'cli',
      tier: TIER_CLI,
      needsArgs: hasRequiredArgs(sub),
      action: { type: 'cli', argv: tokens },
    });

    out.push(...collectCliEntries(sub, tokens));
  }

  return out;
}

/** Minimal shape needed from slashCommands.ts, kept structural to avoid a cycle. */
export interface SlashLike {
  name: string;
  aliases?: string[];
  summary: string;
  usage: string;
  mode: string;
  cliCommand?: string[];
}

export function collectSlashEntries(commands: SlashLike[]): PaletteEntry[] {
  return commands.map((command) => ({
    id: `slash:${command.name}`,
    // Usage carries the argument hints (`/find <pattern> [--limit N]`), which
    // is strictly more informative than the bare name.
    label: command.usage || `/${command.name}`,
    searchText: `${command.name} ${(command.aliases || []).join(' ')}`.trim(),
    tokens: [`/${command.name}`],
    description: command.summary,
    badge: 'slash',
    tier: TIER_SLASH,
    needsArgs: /<[^>]+>/.test(command.usage || ''),
    action: { type: 'slash', name: command.name },
  }));
}

const MD_TIERS: Record<DiscoveredEntry['kind'], number> = {
  command: TIER_MD_COMMAND,
  prompt: TIER_MD_PROMPT,
  agent: TIER_MD_AGENT,
  skill: TIER_MD_SKILL,
};

export function collectMarkdownEntries(entries: DiscoveredEntry[]): PaletteEntry[] {
  return entries.map((entry) => ({
    id: `${entry.kind}:${entry.runtime}:${entry.name}`,
    label: entry.name,
    searchText: entry.name,
    tokens: [entry.name],
    description: entry.description,
    badge: `${entry.kind}·${entry.runtime}`,
    tier: MD_TIERS[entry.kind],
    needsArgs: false,
    action: { type: 'markdown', entry },
  }));
}

/** Build the whole index. Callers cache this; it walks 1200+ nodes. */
export function buildPaletteIndex(input: {
  program?: Command;
  slash?: SlashLike[];
  markdown?: DiscoveredEntry[];
}): PaletteEntry[] {
  const out: PaletteEntry[] = [
    ...(input.slash ? collectSlashEntries(input.slash) : []),
    ...(input.program ? collectCliEntries(input.program) : []),
    ...(input.markdown ? collectMarkdownEntries(input.markdown) : []),
  ];

  const seen = new Set<string>();
  return out.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* Ranking                                                             */
/* ------------------------------------------------------------------ */

/**
 * Strip the palette trigger and any kind sigil from the raw input line.
 *
 * Sigils narrow the index without making the operator remember a syntax:
 *   `/@foo`  → agents only
 *   `/#foo`  → skills only
 *   `/!foo`  → CLI commands only
 */
export function parseQuery(line: string): { query: string; kinds: Set<string> | null } {
  let rest = line.startsWith('/') ? line.slice(1) : line;
  const kinds = new Set<string>();

  while (rest.length > 0) {
    const sigil = rest[0];
    if (sigil === '@') kinds.add('agent');
    else if (sigil === '#') kinds.add('skill');
    else if (sigil === '!') kinds.add('cli');
    else break;
    rest = rest.slice(1);
  }

  return { query: rest.trim(), kinds: kinds.size > 0 ? kinds : null };
}

function entryKind(entry: PaletteEntry): string {
  if (entry.action.type === 'cli') return 'cli';
  if (entry.action.type === 'slash') return 'slash';
  return entry.action.entry.kind;
}

export function rankPalette(index: PaletteEntry[], line: string, limit = 200): RankedEntry[] {
  const { query, kinds } = parseQuery(line);
  const pool = kinds ? index.filter((entry) => kinds.has(entryKind(entry))) : index;
  const ranked: RankedEntry[] = [];

  for (const entry of pool) {
    const match = fuzzyMatchEntry(entry.searchText, entry.description, query);
    if (!match) continue;
    ranked.push({
      entry,
      score: match.score + entry.tier * TIER_WEIGHT,
      positions: match.positions,
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.entry.label.length !== b.entry.label.length) {
      return a.entry.label.length - b.entry.label.length;
    }
    return a.entry.label.localeCompare(b.entry.label);
  });

  return ranked.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Frame composition                                                   */
/* ------------------------------------------------------------------ */

export interface PaletteTheme {
  dim: (s: string) => string;
  accent: (s: string) => string;
  match: (s: string) => string;
  selected: (s: string) => string;
  badge: (s: string) => string;
}

/** Identity theme — used by tests and by non-colour terminals. */
export const PLAIN_THEME: PaletteTheme = {
  dim: (s) => s,
  accent: (s) => s,
  match: (s) => s,
  selected: (s) => s,
  badge: (s) => s,
};

export interface FrameOptions {
  ranked: RankedEntry[];
  selectedIndex: number;
  /** Max rows of results (excluding header/footer). */
  visibleRows: number;
  /** Terminal width, used to truncate descriptions rather than wrap them. */
  columns: number;
  theme: PaletteTheme;
  /** Total index size, shown when the query is empty. */
  totalCount: number;
}

function truncate(text: string, max: number): string {
  if (max <= 1) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Compose the palette frame as an array of lines.
 *
 * Wrapping is deliberately avoided: every row is truncated to one terminal
 * line so the frame's height is exactly predictable, which is what lets the
 * in-place erase know how much to clear.
 */
export function composeFrame(options: FrameOptions): string[] {
  const { ranked, selectedIndex, visibleRows, columns, theme, totalCount } = options;

  if (ranked.length === 0) {
    return [theme.dim(`  no match — esc to dismiss · ${totalCount} commands indexed`)];
  }

  const safeIndex = Math.min(Math.max(selectedIndex, 0), ranked.length - 1);
  const start = Math.max(
    0,
    Math.min(safeIndex - visibleRows + 1, Math.max(0, ranked.length - visibleRows))
  );
  const window = ranked.slice(start, start + visibleRows);

  const labelWidth = Math.min(
    Math.max(...window.map((r) => r.entry.label.length), 10),
    Math.max(20, Math.floor(columns * 0.45))
  );
  const badgeWidth = Math.max(...window.map((r) => r.entry.badge.length), 3);

  const lines: string[] = [];
  const shown = `${ranked.length}${ranked.length >= 200 ? '+' : ''}`;
  lines.push(theme.dim(`  ${shown} matches${start > 0 ? ` · ${start} above` : ''}`));

  for (let i = 0; i < window.length; i++) {
    const { entry, positions } = window[i];
    const isSelected = start + i === safeIndex;

    const rawLabel = truncate(entry.label, labelWidth);
    // Highlight only survives truncation when the match is inside the kept
    // slice; positions past the cut are dropped rather than mis-painted.
    const kept = positions.filter((p) => p < rawLabel.length);
    const painted = highlight(rawLabel, kept, theme.match);
    const label = painted + ' '.repeat(Math.max(0, labelWidth - rawLabel.length));

    const badge = theme.badge(entry.badge.padStart(badgeWidth));
    const marker = isSelected ? theme.accent('›') : ' ';
    const argHint = entry.needsArgs ? theme.dim(' ·needs args') : '';

    // 4 = marker + spaces; keep one column of slack so a full-width row never
    // wraps and desynchronises the frame height.
    const descWidth = Math.max(0, columns - labelWidth - badgeWidth - 8);
    const desc = theme.dim(truncate(entry.description, descWidth));

    const body = `${isSelected ? theme.selected(label) : theme.accent(label)} ${badge}  ${desc}${argHint}`;
    lines.push(`${marker} ${body}`);
  }

  if (ranked.length > start + window.length) {
    lines.push(theme.dim(`  ${ranked.length - start - window.length} more below`));
  }
  lines.push(theme.dim('  ↑↓ move · ⏎ run · ⇥ complete · @agents #skills !cli · esc dismiss'));

  return lines;
}

/* ------------------------------------------------------------------ */
/* In-place renderer                                                   */
/* ------------------------------------------------------------------ */

const ESC = '\x1b';
const SAVE_CURSOR = `${ESC}7`;
const RESTORE_CURSOR = `${ESC}8`;
const CLEAR_LINE = `${ESC}[2K`;
const CLEAR_BELOW = `${ESC}[0J`;

export interface RendererDeps {
  write: (chunk: string) => void;
  columns: () => number;
  rows: () => number;
}

/**
 * Draws the palette into the region directly below the prompt line and erases
 * it cleanly.
 *
 * The tricky case is opening near the bottom of the viewport: the saved cursor
 * position is invalidated if the terminal scrolls mid-draw. `reserve()` forces
 * that scroll to happen first — emit N newlines, then move back up N — so by
 * the time the cursor is saved there is guaranteed room below it.
 */
export class PaletteRenderer {
  private drawnHeight = 0;

  constructor(private readonly deps: RendererDeps) {}

  get isDrawn(): boolean {
    return this.drawnHeight > 0;
  }

  /** Terminal width, clamped to something the frame can lay out in. */
  columns(): number {
    return Math.max(40, this.deps.columns());
  }

  /** Max result rows that fit under the prompt on this terminal. */
  visibleRows(): number {
    // 3 = header + footer + the prompt line itself.
    return Math.max(3, Math.min(14, this.deps.rows() - 4));
  }

  draw(lines: string[]): void {
    const height = lines.length;
    if (height === 0) {
      this.clear();
      return;
    }

    if (height > this.drawnHeight) {
      this.reserve(height - this.drawnHeight);
    }

    let out = SAVE_CURSOR;
    for (const line of lines) {
      out += `\n${CLEAR_LINE}${line}`;
    }
    // Erase whatever a taller previous frame left behind.
    out += `\n${CLEAR_BELOW}`;
    out += RESTORE_CURSOR;

    this.deps.write(out);
    this.drawnHeight = height;
  }

  clear(): void {
    if (this.drawnHeight === 0) return;
    this.deps.write(`${SAVE_CURSOR}\n${CLEAR_BELOW}${RESTORE_CURSOR}`);
    this.drawnHeight = 0;
  }

  /** Scroll `count` lines into existence below the cursor, then come back. */
  private reserve(count: number): void {
    if (count <= 0) return;
    this.deps.write('\n'.repeat(count) + `${ESC}[${count}A`);
  }
}

/* ------------------------------------------------------------------ */
/* Controller                                                          */
/* ------------------------------------------------------------------ */

export type PaletteKey =
  | 'up'
  | 'down'
  | 'pageup'
  | 'pagedown'
  | 'enter'
  | 'tab'
  | 'escape'
  | 'other';

export type PaletteOutcome =
  | { type: 'none' }
  | { type: 'dismissed' }
  | { type: 'complete'; line: string }
  | { type: 'run'; entry: PaletteEntry };

/**
 * Keyboard state machine for the palette.
 *
 * Kept free of readline and of `process.stdout` so the tests can drive it as a
 * plain object. The host wires real keypresses in and applies the outcome.
 */
export class PaletteController {
  private index: PaletteEntry[] = [];
  private ranked: RankedEntry[] = [];
  private selectedIndex = 0;
  private open = false;
  private line = '';
  /**
   * Set by Escape, cleared when the operator abandons the query.
   *
   * Without this, Escape only hid the palette until the very next keystroke —
   * `handle()` reopens on any printable key — so dismissing it and continuing
   * to type brought it straight back. Escape now means "stay out of my way for
   * this line"; clearing the line (or submitting it) re-arms the palette.
   */
  private suppressed = false;

  constructor(
    private readonly renderer: PaletteRenderer,
    private readonly theme: PaletteTheme = PLAIN_THEME
  ) {}

  setIndex(index: PaletteEntry[]): void {
    this.index = index;
  }

  get isOpen(): boolean {
    return this.open;
  }

  get selected(): PaletteEntry | null {
    return this.ranked[this.selectedIndex]?.entry ?? null;
  }

  /** True when a line should drive the palette at all. */
  static triggers(line: string): boolean {
    return line.startsWith('/');
  }

  /**
   * Feed the current input line and the key that produced it.
   *
   * Returns what the host should do. The palette stays open across spaces so
   * `/agents reg` keeps filtering — the old dropdown closed on the first
   * space, which is precisely why a subcommand could never be reached.
   */
  handle(line: string, key: PaletteKey): PaletteOutcome {
    if (!PaletteController.triggers(line)) {
      // The query was abandoned (line cleared, or no longer a slash command),
      // so a previous Escape no longer applies — re-arm for the next `/`.
      this.suppressed = false;
      if (this.open) {
        this.close();
        return { type: 'dismissed' };
      }
      return { type: 'none' };
    }

    if (key === 'escape') {
      this.suppressed = true;
      this.close();
      return { type: 'dismissed' };
    }

    // Enter always re-arms: whatever the operator does next is a new line.
    if (key === 'enter') this.suppressed = false;

    // Stay dismissed while the operator keeps editing the same line. Enter is
    // handled below so a suppressed palette still submits the typed text.
    if (this.suppressed && key !== 'enter') {
      this.line = line;
      return { type: 'none' };
    }

    // Re-rank whenever the query text changed; navigation keys keep the
    // existing result set so the selection does not jump under the cursor.
    const isNav = key === 'up' || key === 'down' || key === 'pageup' || key === 'pagedown';
    if (!isNav && line !== this.line) {
      this.line = line;
      this.ranked = rankPalette(this.index, line);
      this.selectedIndex = 0;
    }

    if (this.ranked.length === 0 && !isNav) {
      this.ranked = rankPalette(this.index, line);
    }

    const count = this.ranked.length;
    if (isNav && count > 0) {
      const page = this.renderer.visibleRows();
      if (key === 'up') this.selectedIndex = (this.selectedIndex - 1 + count) % count;
      else if (key === 'down') this.selectedIndex = (this.selectedIndex + 1) % count;
      else if (key === 'pageup') this.selectedIndex = Math.max(0, this.selectedIndex - page);
      else this.selectedIndex = Math.min(count - 1, this.selectedIndex + page);
    }

    if (key === 'enter') {
      // A dismissed palette must not claim the line. Escape means "run what I
      // typed, not what you highlighted" — without this guard the last ranked
      // selection survived the dismissal and hijacked the next Enter.
      if (!this.open) return { type: 'none' };
      const entry = this.selected;
      this.close();
      return entry ? { type: 'run', entry } : { type: 'none' };
    }

    if (key === 'tab') {
      const entry = this.selected;
      if (!entry) return { type: 'none' };
      // Tab completes without running so the operator can append arguments.
      // The palette stays open and re-ranks against the completed text.
      const completed =
        entry.action.type === 'slash' ? entry.tokens[0] : `/${entry.tokens.join(' ')}`;
      this.line = completed;
      this.ranked = rankPalette(this.index, completed);
      this.selectedIndex = 0;
      this.render();
      return { type: 'complete', line: completed };
    }

    this.open = true;
    this.render();
    return { type: 'none' };
  }

  close(): void {
    this.open = false;
    this.renderer.clear();
  }

  private render(): void {
    this.renderer.draw(
      composeFrame({
        ranked: this.ranked,
        selectedIndex: this.selectedIndex,
        visibleRows: this.renderer.visibleRows(),
        columns: this.renderer.columns(),
        theme: this.theme,
        totalCount: this.index.length,
      })
    );
  }
}
