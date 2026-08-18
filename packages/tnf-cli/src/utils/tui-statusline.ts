/**
 * packages/tnf-cli/src/utils/tui-statusline.ts
 *
 * The one-line session status rendered above the TUI prompt.
 *
 * WHAT IT REPLACES
 *   The prompt used to read `[provider/model] `, and everything else about the
 *   session — whether autonomous execution was on, how much of the turn budget
 *   was spent, how long the operator window was, which branch the agent was
 *   about to run shell commands against — was only discoverable by typing
 *   `/status`. In a session where the agent acts between prompts, that state
 *   changes underneath the operator, so it belongs where they are already
 *   looking.
 *
 * WHY SEGMENTS RATHER THAN A FORMAT STRING
 *   The interesting fields do not fit an 80-column terminal, and truncating the
 *   whole line would cut the branch name off in a wide terminal and the model
 *   name off in a narrow one. Each segment therefore carries a priority, and
 *   the line drops whole low-priority segments until it fits. Nothing is ever
 *   half-shown: a truncated `anthropic/claude-op…` is worse than no branch.
 *
 * PURITY
 *   `renderStatusLine` is a pure function of a snapshot plus a width. Gathering
 *   the snapshot (which touches env, disk and the LLM client) lives in cli.ts;
 *   everything that decides what the operator actually sees is here and tested.
 */

/** Painters, so the same layout renders in colour or plain. */
export interface StatusTheme {
  dim: (s: string) => string;
  label: (s: string) => string;
  value: (s: string) => string;
  on: (s: string) => string;
  off: (s: string) => string;
  warn: (s: string) => string;
}

export const PLAIN_STATUS_THEME: StatusTheme = {
  dim: (s) => s,
  label: (s) => s,
  value: (s) => s,
  on: (s) => s,
  off: (s) => s,
  warn: (s) => s,
};

export interface StatusSnapshot {
  provider?: string;
  model?: string;
  /** 'agent' | 'plan' | 'ask' — the session's interaction mode. */
  mode?: string;
  /** Persisted TUI mode: INTERACTIVE / LONG_RUN / AUTONOMOUS. */
  tuiMode?: string;
  autonomous?: boolean;
  /** True while /hold is in force — outranks `autonomous` in the display. */
  hold?: boolean;
  turnsUsed?: number;
  turnsMax?: number;
  /** Estimated tokens across the live transcript. */
  tokens?: number;
  messages?: number;
  /** Operator takeover window, ms. 0 or undefined hides the segment. */
  operatorWindowMs?: number;
  branch?: string | null;
  /** Short display path for the working directory. */
  cwd?: string | null;
  /** Count of configured MCP servers. */
  mcpServers?: number;
  /** Short permission summary; omitted when unrestricted. */
  permissions?: string | null;
  /** Size of the command palette index, so `/` advertises what it can reach. */
  indexedCommands?: number;
}

interface Segment {
  /** Higher survives longer when the line has to shrink. */
  priority: number;
  text: string;
  /** Visible width, which differs from `text.length` once painted. */
  width: number;
  /**
   * Shorter rendering used only when dropping every other segment still is not
   * enough. Currently only the model has one: on a very narrow terminal the
   * provider prefix is the part worth losing, and losing the model instead
   * would defeat the point of the line.
   */
  compact?: { text: string; width: number };
}

const SEPARATOR = '  ·  ';

/** Compact large token counts: 12480 → `12.5k`, 1_240_000 → `1.2M`. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

/** `claude-opus-5` out of `anthropic/claude-opus-5:beta`. */
export function shortModelName(model: string): string {
  return model.replace(/^.*\//, '').replace(/:.*$/, '');
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m${rest}s` : `${minutes}m`;
}

/**
 * Build the ordered, prioritised segment list for a snapshot.
 *
 * Exported so a test can assert on the semantics (is autonomy shown as HOLD?)
 * without reasoning about padding and separators.
 */
export function statusSegments(snapshot: StatusSnapshot, theme: StatusTheme): Segment[] {
  const segments: Segment[] = [];
  const push = (priority: number, plain: string, painted: string) =>
    segments.push({ priority, text: painted, width: plain.length });

  // Model — the one thing that must never be dropped, and the reason the
  // operator asked for a status line at all.
  const provider = snapshot.provider || 'model';
  const model = snapshot.model ? shortModelName(snapshot.model) : 'unknown';
  segments.push({
    priority: 100,
    text: `${theme.dim(provider)}${theme.dim('/')}${theme.value(model)}`,
    width: provider.length + 1 + model.length,
    compact: { text: theme.value(model), width: model.length },
  });

  // Autonomy. HOLD beats ON: a held session looks idle but is not off, and
  // conflating the two is how an operator ends up waiting for a turn that
  // will never fire.
  if (snapshot.hold) {
    push(90, 'HOLD', theme.warn('⏸ HOLD'));
  } else if (snapshot.autonomous) {
    push(90, 'auto ON', `${theme.label('auto')} ${theme.on('ON')}`);
  } else {
    push(60, 'auto off', `${theme.label('auto')} ${theme.off('off')}`);
  }

  if (snapshot.mode && snapshot.mode !== 'agent') {
    push(85, snapshot.mode, theme.warn(snapshot.mode));
  }

  if (typeof snapshot.turnsUsed === 'number' && typeof snapshot.turnsMax === 'number') {
    const plain = `turn ${snapshot.turnsUsed}/${snapshot.turnsMax}`;
    // The last 10% of the budget is when it matters; flag it before the cap
    // lands mid-task rather than after.
    const near = snapshot.turnsMax > 0 && snapshot.turnsUsed / snapshot.turnsMax >= 0.9;
    push(
      80,
      plain,
      `${theme.label('turn')} ${(near ? theme.warn : theme.value)(
        `${snapshot.turnsUsed}/${snapshot.turnsMax}`
      )}`
    );
  }

  if (typeof snapshot.tokens === 'number') {
    const messages = typeof snapshot.messages === 'number' ? ` ${snapshot.messages}msg` : '';
    const plain = `ctx ${formatCount(snapshot.tokens)}${messages}`;
    push(
      70,
      plain,
      `${theme.label('ctx')} ${theme.value(formatCount(snapshot.tokens))}${theme.dim(messages)}`
    );
  }

  if (snapshot.operatorWindowMs && snapshot.operatorWindowMs > 0) {
    const plain = `win ${formatDuration(snapshot.operatorWindowMs)}`;
    push(
      50,
      plain,
      `${theme.label('win')} ${theme.value(formatDuration(snapshot.operatorWindowMs))}`
    );
  }

  if (snapshot.permissions) {
    push(75, snapshot.permissions, theme.warn(snapshot.permissions));
  }

  if (snapshot.tuiMode && snapshot.tuiMode !== 'INTERACTIVE') {
    push(40, snapshot.tuiMode, theme.dim(snapshot.tuiMode));
  }

  if (snapshot.branch) {
    push(45, `⎇ ${snapshot.branch}`, `${theme.dim('⎇')} ${theme.value(snapshot.branch)}`);
  }

  if (snapshot.cwd) {
    push(30, snapshot.cwd, theme.dim(snapshot.cwd));
  }

  if (typeof snapshot.mcpServers === 'number' && snapshot.mcpServers > 0) {
    const plain = `mcp ${snapshot.mcpServers}`;
    push(20, plain, `${theme.label('mcp')} ${theme.value(String(snapshot.mcpServers))}`);
  }

  if (typeof snapshot.indexedCommands === 'number' && snapshot.indexedCommands > 0) {
    const plain = `/ ${formatCount(snapshot.indexedCommands)} cmds`;
    push(
      10,
      plain,
      `${theme.dim('/')} ${theme.value(formatCount(snapshot.indexedCommands))}${theme.dim(' cmds')}`
    );
  }

  return segments;
}

/**
 * Render the status line, dropping the least important segments until it fits.
 *
 * Order is preserved; only membership shrinks. The result never contains a
 * newline and never exceeds `columns`, so the caller can print it directly
 * above the prompt without disturbing the palette's height arithmetic.
 */
export function renderStatusLine(
  snapshot: StatusSnapshot,
  columns: number,
  theme: StatusTheme = PLAIN_STATUS_THEME,
  indent = '  '
): string {
  const budget = Math.max(20, columns) - indent.length;
  let segments = statusSegments(snapshot, theme);

  // Some providers name their models exhaustively — `nvidia-nemotron-3-ultra/
  // nemotron-3-ultra-550b-a55b` is 49 columns, most of it repeated. Letting one
  // segment eat two-fifths of the line pushes out everything the operator
  // actually needs to watch, so an oversized segment goes compact up front
  // rather than only as a last resort.
  const HOG_SHARE = 0.4;
  segments = segments.map((seg) =>
    seg.compact && seg.width > budget * HOG_SHARE
      ? { ...seg, text: seg.compact.text, width: seg.compact.width }
      : seg
  );

  const fits = (chosen: Segment[]): boolean =>
    chosen.reduce((sum, seg) => sum + seg.width, 0) +
      Math.max(0, chosen.length - 1) * SEPARATOR.length <=
    budget;

  let chosen = segments;
  if (!fits(chosen)) {
    // Drop whole segments, lowest priority first, but never the last one —
    // an empty status line is not a useful answer to "what model am I on".
    // Ties break toward the later segment so the line shortens from the right,
    // which reads as truncation rather than as fields shuffling around.
    const order = segments
      .map((seg, i) => ({ seg, i }))
      .sort((a, b) => a.seg.priority - b.seg.priority || b.i - a.i)
      .slice(0, Math.max(0, segments.length - 1));
    const dropped = new Set<number>();
    for (const { i } of order) {
      dropped.add(i);
      chosen = segments.filter((_, index) => !dropped.has(index));
      if (fits(chosen)) break;
    }
  }

  // Last resort: a terminal so narrow that even the surviving segment
  // overflows. Fall back to each segment's compact form (for the model, that
  // means dropping the provider prefix and keeping the name) rather than
  // ellipsising the one thing the line exists to show.
  if (!fits(chosen)) {
    chosen = chosen.map((seg) =>
      seg.compact ? { ...seg, text: seg.compact.text, width: seg.compact.width } : seg
    );
  }

  if (chosen.length === 0) return '';
  return indent + chosen.map((seg) => seg.text).join(theme.dim(SEPARATOR));
}
