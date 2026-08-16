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
  /** Normalised frecency (0..1) that contributed to `score`. Drives the ★ mark. */
  recency?: number;
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

/** Anything that can answer "how recently/often was this chosen?" in 0..1. */
export interface RecentsLike {
  scoreFor(id: string): number;
  /** Called when an entry is chosen. Optional so tests can pass a bare stub. */
  record?(id: string): void;
}

export interface RankOptions {
  /** Frecency source. Omitted in tests and on first run. */
  recents?: RecentsLike | null;
}

/**
 * How much a perfectly-frecent entry is worth.
 *
 * Deliberately below TIER_WEIGHT: history nudges ties, it does not overrule
 * what the operator actually typed. A command you ran 50 times still loses to
 * an exact-segment hit you just spelled out.
 */
const RECENCY_WEIGHT = 90;

/**
 * With an empty query every entry scores 0, so the list would otherwise be
 * ordered by tier and then alphabetically — the same 20 rows forever. Leaning
 * harder on frecency here turns the bare `/` into a useful "what do I run"
 * view without affecting any typed query.
 */
const RECENCY_WEIGHT_EMPTY_QUERY = 600;

export function rankPalette(
  index: PaletteEntry[],
  line: string,
  limit = 200,
  options: RankOptions = {}
): RankedEntry[] {
  const { query, kinds } = parseQuery(line);
  const pool = kinds ? index.filter((entry) => kinds.has(entryKind(entry))) : index;
  const ranked: RankedEntry[] = [];
  const recents = options.recents ?? null;
  const recencyWeight = query ? RECENCY_WEIGHT : RECENCY_WEIGHT_EMPTY_QUERY;

  for (const entry of pool) {
    const match = fuzzyMatchEntry(entry.searchText, entry.description, query);
    if (!match) continue;
    const recency = recents ? recents.scoreFor(entry.id) : 0;
    ranked.push({
      entry,
      score: match.score + entry.tier * TIER_WEIGHT + recency * recencyWeight,
      positions: match.positions,
      recency,
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
  /** Optional: the scrollbar thumb. Falls back to `accent`. */
  scrollbar?: (s: string) => string;
  /** Optional: the ★ frecency mark. Falls back to `dim`. */
  recent?: (s: string) => string;
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
  /** Max rows of results (excluding header/detail/footer). */
  visibleRows: number;
  /** Terminal width, used to truncate descriptions rather than wrap them. */
  columns: number;
  theme: PaletteTheme;
  /** Total index size, shown when the query is empty. */
  totalCount: number;
  /** Offset into the ranked list for smooth scrolling. */
  scrollOffset?: number;
  /** Max rows allowed for the palette (0 = auto-calculate from terminal). */
  maxHeight?: number;
  /** Kind filter currently in force, surfaced in the header. */
  kinds?: Set<string> | null;
  /** Suppress the per-selection detail row (small terminals). */
  showDetail?: boolean;
}

function truncate(text: string, max: number): string {
  if (max <= 1) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * The visible slice of the ranked list.
 *
 * Both the controller (which owns `scrollOffset`) and the frame composer need
 * this, and they used to compute it separately with different rules — the
 * controller snapped the offset to the selection while the composer snapped it
 * to `selection - 1`, so a Down keypress at the bottom edge scrolled a whole
 * page instead of one line and the highlighted row jumped position. One pure
 * function, used by both, is the fix.
 *
 * Contract: the returned window always contains `selectedIndex`, is exactly
 * `visibleRows` long whenever the list is long enough, and never runs off
 * either end.
 */
export function resolveWindow(
  count: number,
  selectedIndex: number,
  visibleRows: number,
  scrollOffset: number
): { start: number; end: number } {
  const rows = Math.max(1, visibleRows);
  if (count <= rows) return { start: 0, end: count };

  const maxStart = count - rows;
  let start = Math.max(0, Math.min(scrollOffset, maxStart));

  // Scroll by the minimum needed to bring the selection back into view, so a
  // single Down at the bottom edge advances the window by exactly one row.
  if (selectedIndex < start) start = selectedIndex;
  else if (selectedIndex >= start + rows) start = selectedIndex - rows + 1;

  start = Math.max(0, Math.min(start, maxStart));
  return { start, end: start + rows };
}

/**
 * One scrollbar cell per visible row.
 *
 * Replaces the old "▲ N more above" / "▼ N more below" lines, which changed
 * the frame's height depending on scroll position — the renderer erases a
 * fixed region, so a frame that grows and shrinks under the prompt flickers.
 * A fixed-width gutter column carries the same information for free.
 */
export function scrollbarColumn(
  count: number,
  start: number,
  visibleRows: number
): Array<'thumb' | 'track' | 'none'> {
  if (count <= visibleRows) return new Array(visibleRows).fill('none');
  const thumbSize = Math.max(1, Math.round((visibleRows / count) * visibleRows));
  const maxStart = count - visibleRows;
  const travel = visibleRows - thumbSize;
  const thumbStart = maxStart <= 0 ? 0 : Math.round((start / maxStart) * travel);
  return Array.from({ length: visibleRows }, (_, i) =>
    i >= thumbStart && i < thumbStart + thumbSize ? 'thumb' : 'track'
  );
}

/**
 * Compose the palette frame as an array of lines.
 *
 * Wrapping is deliberately avoided: every row is truncated to one terminal
 * line so the frame's height is exactly predictable, which is what lets the
 * in-place erase know how much to clear.
 *
 * Scrolling: selection is kept in view with smooth scrolling. The palette
 * scrolls when the selection would otherwise be outside the visible window.
 */
export const PALETTE_FOOTER_HINT =
  '  ↑↓/^p^n move · ⇞⇟ page · ⇱⇲ ends · ⏎ run · ⇥ complete · @agents #skills !cli · esc';

export function composeFrame(options: FrameOptions): string[] {
  const {
    ranked,
    selectedIndex,
    visibleRows,
    columns,
    theme,
    totalCount,
    scrollOffset = 0,
    maxHeight,
    kinds = null,
    showDetail = true,
  } = options;

  const paintScrollbar = theme.scrollbar ?? theme.accent;
  const paintRecent = theme.recent ?? theme.dim;

  if (ranked.length === 0) {
    return [
      theme.dim(`  no match — esc to dismiss · ${totalCount} commands indexed`),
      theme.dim(PALETTE_FOOTER_HINT),
    ];
  }

  const count = ranked.length;
  const rows =
    maxHeight && maxHeight > 0 ? Math.max(1, Math.min(visibleRows, maxHeight)) : visibleRows;

  const { start, end } = resolveWindow(count, selectedIndex, rows, scrollOffset);
  const window = ranked.slice(start, end);
  const bar = scrollbarColumn(count, start, window.length);

  // Widths are measured across the WHOLE ranked list, not just the rows
  // currently on screen. Measuring the window made the label and badge columns
  // resize as the operator scrolled, so descriptions slid left and right under
  // a stationary cursor — the single most distracting thing about scrolling a
  // long result set. The label cap keeps this bounded no matter how long the
  // worst path in the list is.
  const labelWidth = Math.min(
    Math.max(...ranked.map((r) => r.entry.label.length), 10),
    Math.max(20, Math.floor(columns * 0.5))
  );
  const badgeWidth = Math.min(
    Math.max(...ranked.map((r) => r.entry.badge.length), 3),
    Math.max(6, Math.floor(columns * 0.2))
  );

  const lines: string[] = [];
  const shown = `${count}${count >= 200 ? '+' : ''}`;
  const filter = kinds && kinds.size > 0 ? ` · filter ${[...kinds].sort().join('+')}` : '';

  if (count > window.length) {
    lines.push(
      theme.dim(
        `  ${shown} matches${filter} · ${start + 1}-${end} · ${selectedIndex + 1}/${count} selected`
      )
    );
  } else {
    lines.push(theme.dim(`  ${shown} matches${filter} · ${selectedIndex + 1}/${count} selected`));
  }

  for (let i = 0; i < window.length; i++) {
    const { entry, positions, recency = 0 } = window[i];
    const globalIndex = start + i;
    const isSelected = globalIndex === selectedIndex;

    const rawLabel = truncate(entry.label, labelWidth);
    const kept = positions.filter((p) => p < rawLabel.length);
    const painted = highlight(rawLabel, kept, theme.match);
    const label = painted + ' '.repeat(Math.max(0, labelWidth - rawLabel.length));

    const badge = theme.badge(truncate(entry.badge, badgeWidth).padStart(badgeWidth));
    const marker = isSelected ? theme.accent('▸') : ' ';
    // ★ marks something this operator actually runs, so a familiar command is
    // recognisable at a glance among near-identical neighbours.
    const star = recency >= 0.15 ? paintRecent('★') : ' ';
    const argHint = entry.needsArgs ? theme.dim('⟳') : ' ';

    const gutter =
      bar[i] === 'thumb' ? paintScrollbar('┃') : bar[i] === 'track' ? theme.dim('│') : ' ';

    // Reserve: marker+space(2) star(1) space(1) label badge 2×space argHint(1)
    // space(1) gutter(1). Descriptions absorb whatever is left.
    const descWidth = Math.max(0, columns - labelWidth - badgeWidth - 11);
    const rawDesc = truncate(entry.description, descWidth);
    const desc = theme.dim(rawDesc + ' '.repeat(Math.max(0, descWidth - rawDesc.length)));

    const body = `${isSelected ? theme.selected(label) : theme.accent(label)} ${badge}  ${desc}`;
    lines.push(`${marker} ${star} ${body}${argHint} ${gutter}`);
  }

  if (showDetail) {
    const selected = ranked[Math.max(0, Math.min(selectedIndex, count - 1))];
    lines.push(theme.dim(truncate(describeSelection(selected), Math.max(10, columns - 2))));
  }

  lines.push(theme.dim(PALETTE_FOOTER_HINT));

  return lines;
}

/**
 * The detail row under the list.
 *
 * The list truncates hard to keep every row one terminal line; without this the
 * operator can see that `agents register <name> <role>` exists but not what it
 * wants, and has to run it to find out. One dedicated full-width row costs one
 * line and removes that guess.
 */
export function describeSelection(selected: RankedEntry | undefined): string {
  if (!selected) return '  —';
  const { entry } = selected;
  const bits: string[] = [];

  if (entry.action.type === 'cli') bits.push(`tnf ${entry.tokens.join(' ')}`);
  else if (entry.action.type === 'slash') bits.push(entry.label);
  else bits.push(`${entry.action.entry.runtime}:${entry.action.entry.name}`);

  if (entry.needsArgs) bits.push('needs arguments');
  if ((selected.recency ?? 0) >= 0.15) bits.push('recent');
  if (entry.description) bits.push(entry.description);

  return `  ${bits.join(' · ')}`;
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

/** Header + detail + footer. Must match what `composeFrame` emits. */
export const PALETTE_CHROME_ROWS = 3;

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

  /**
   * Max result rows that fit under the prompt on this terminal.
   *
   * `composeFrame` adds three chrome lines (header, detail, footer) on top of
   * these, and `PALETTE_CHROME_ROWS` is what keeps the two in agreement.
   */
  visibleRows(): number {
    const rows = this.deps.rows();
    const maxRows = rows - PALETTE_CHROME_ROWS - 5;
    return Math.max(5, Math.min(24, maxRows));
  }

  /** True when the terminal is too short to spare a row on the detail line. */
  showDetail(): boolean {
    return this.deps.rows() >= 16;
  }

  /** Height reserved for the palette display (header, results, detail, footer). */
  getPaletteHeight(): number {
    return this.visibleRows() + PALETTE_CHROME_ROWS;
  }

  /**
   * Check if there's enough room below the cursor for the palette.
   * Returns the number of free rows below the cursor.
   */
  private getFreeRowsBelow(): number {
    const rows = this.deps.rows();
    // We can't reliably detect cursor position, so assume we're at the bottom
    // of the prompt line. Reserve space for prompt (1) + palette height.
    return rows - 4; // Conservative estimate
  }

  draw(lines: string[]): void {
    const height = lines.length;
    if (height === 0) {
      this.clear();
      return;
    }

    // Only reserve space if we're growing AND there's not enough room.
    // This avoids the "scroll flash" when opening near terminal bottom.
    if (height > this.drawnHeight) {
      const needed = height - this.drawnHeight;
      const free = this.getFreeRowsBelow();
      if (needed > free) {
        this.reserve(needed - free);
      }
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
  | 'halfup'
  | 'halfdown'
  | 'home'
  | 'end'
  | 'enter'
  | 'tab'
  | 'escape'
  | 'other';

const NAV_KEYS: ReadonlySet<PaletteKey> = new Set<PaletteKey>([
  'up',
  'down',
  'pageup',
  'pagedown',
  'halfup',
  'halfdown',
  'home',
  'end',
]);

export function isNavKey(key: PaletteKey): boolean {
  return NAV_KEYS.has(key);
}

/**
 * The buffer text Tab should leave behind.
 *
 * A trailing space is appended when there is obviously more to type — a branch
 * node (`/agents ` still needs a verb) or a command with a required `<arg>`.
 * Without it the operator Tab-completes and then has to press space before the
 * palette will treat the next character as a new token, which reads as the
 * completion having jammed.
 */
export function completionFor(entry: PaletteEntry): string {
  const base = entry.action.type === 'slash' ? entry.tokens[0] : `/${entry.tokens.join(' ')}`;
  const wantsMore = entry.needsArgs || entry.badge.endsWith('▸');
  return wantsMore ? `${base} ` : base;
}

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
  private scrollOffset = 0;
  private open = false;
  private line = '';
  /**
   * Set by Escape, cleared when the operator abandons the query.
   *
   * Without this, Escape only hid the palette until the very next keystroke — `handle()`
   * reopens on any printable key — so dismissing it and continuing to type brought it
   * straight back. Escape now means "stay out of my way for this line"; clearing the
   * line (or submitting it) re-arms the palette.
   */
  private suppressed = false;

  constructor(
    private readonly renderer: PaletteRenderer,
    private readonly theme: PaletteTheme = PLAIN_THEME,
    /** Frecency source. Null keeps ranking purely fuzzy (tests, first run). */
    private readonly recents: RecentsLike | null = null
  ) {}

  setIndex(index: PaletteEntry[]): void {
    this.index = index;
  }

  private rank(line: string): RankedEntry[] {
    return rankPalette(this.index, line, 200, { recents: this.recents });
  }

  get isOpen(): boolean {
    return this.open;
  }

  get selected(): PaletteEntry | null {
    return this.ranked[this.selectedIndex]?.entry ?? null;
  }

  /** Get the current scroll offset (number of items hidden above the visible window). */
  get scrollPosition(): number {
    return this.scrollOffset;
  }

  /** True when a line should drive the palette at all. */
  static triggers(line: string): boolean {
    return line.startsWith('/');
  }

  /**
   * Keep the selection in view, moving the window as little as possible.
   *
   * Delegates to the same `resolveWindow` the renderer uses. The previous
   * version snapped `scrollOffset` to `selectedIndex` on downward overflow,
   * which put the newly-selected row at the TOP of the window — so one Down
   * keypress at the bottom edge scrolled a full page and the highlight
   * teleported.
   */
  private updateScroll(): void {
    const { start } = resolveWindow(
      this.ranked.length,
      this.selectedIndex,
      this.renderer.visibleRows(),
      this.scrollOffset
    );
    this.scrollOffset = start;
  }

  /**
   * Apply a navigation key to the selection.
   *
   * Up/Down wrap around: at 1300 indexed entries, pressing Up on the first row
   * to reach the last match is the fastest route there, and every palette the
   * operator uses elsewhere behaves this way. Page and Home/End clamp instead,
   * because wrapping a page jump is disorienting rather than fast.
   */
  private moveSelection(key: PaletteKey, count: number): void {
    const page = Math.max(1, this.renderer.visibleRows());
    const half = Math.max(1, Math.floor(page / 2));

    switch (key) {
      case 'up':
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : count - 1;
        break;
      case 'down':
        this.selectedIndex = this.selectedIndex < count - 1 ? this.selectedIndex + 1 : 0;
        break;
      case 'pageup':
        this.selectedIndex = Math.max(0, this.selectedIndex - page);
        break;
      case 'pagedown':
        this.selectedIndex = Math.min(count - 1, this.selectedIndex + page);
        break;
      case 'halfup':
        this.selectedIndex = Math.max(0, this.selectedIndex - half);
        break;
      case 'halfdown':
        this.selectedIndex = Math.min(count - 1, this.selectedIndex + half);
        break;
      case 'home':
        this.selectedIndex = 0;
        break;
      case 'end':
        this.selectedIndex = count - 1;
        break;
      default:
        break;
    }
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

    if (key === 'enter') this.suppressed = false;

    if (this.suppressed && key !== 'enter') {
      this.line = line;
      return { type: 'none' };
    }

    const nav = isNavKey(key);

    if (!nav && line !== this.line) {
      this.line = line;
      this.ranked = this.rank(line);
      this.selectedIndex = 0;
      this.scrollOffset = 0;
    }

    if (this.ranked.length === 0 && !nav) {
      this.ranked = this.rank(line);
      this.selectedIndex = 0;
      this.scrollOffset = 0;
    }

    if (nav && this.ranked.length > 0) {
      this.moveSelection(key, this.ranked.length);
      this.updateScroll();
    }

    if (key === 'enter') {
      if (!this.open) return { type: 'none' };
      const entry = this.selected;
      this.close();
      return entry ? { type: 'run', entry } : { type: 'none' };
    }

    if (key === 'tab') {
      const entry = this.selected;
      if (!entry) return { type: 'none' };
      const completed = completionFor(entry);
      this.line = completed;
      this.ranked = this.rank(completed);
      this.selectedIndex = 0;
      this.scrollOffset = 0;
      this.open = true;
      this.render();
      return { type: 'complete', line: completed };
    }

    this.open = true;
    this.updateScroll();
    this.render();
    return { type: 'none' };
  }

  close(): void {
    this.open = false;
    this.scrollOffset = 0;
    this.renderer.clear();
  }

  /** Public render method for resize handling. */
  render(): void {
    this.renderer.draw(
      composeFrame({
        ranked: this.ranked,
        selectedIndex: this.selectedIndex,
        visibleRows: this.renderer.visibleRows(),
        columns: this.renderer.columns(),
        theme: this.theme,
        totalCount: this.index.length,
        scrollOffset: this.scrollOffset,
        kinds: parseQuery(this.line).kinds,
        showDetail: this.renderer.showDetail(),
      })
    );
  }
}
