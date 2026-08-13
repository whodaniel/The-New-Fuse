/**
 * packages/tnf-cli/src/services/ToolPermissionService.ts
 *
 * Real implementation of the peer-CLI permission surface:
 * `--permission-mode`, `--allowed-tools`, `--disallowed-tools`.
 *
 * RELATIONSHIP TO PermissionService.ts
 *   Two different layers, deliberately kept apart. `PermissionService` decides
 *   whether a *specific bash command or file path* is allowed, by glob, from
 *   config. This decides which *tools exist at all* for a session. A tool
 *   removed here is never advertised to the model, so PermissionService is
 *   never consulted for it; a tool allowed here still has every individual
 *   invocation checked there.
 *
 * WHY THIS FILE EXISTS
 *   These three flags were previously registered on the root program by
 *   `peer-cli-parity-gaps.ts` as descriptions only — "Claude parity:
 *   permission mode hint", "tool allowlist hint". Nothing read them
 *   (`grep permissionMode src/cli.ts` returned zero hits outside the
 *   registration). They existed so `tnf parity audit` would find a
 *   same-named flag and score 100%.
 *
 *   A flag named `--permission-mode` that does not restrict permissions is
 *   worse than a missing flag: a missing flag fails loudly, a marker flag
 *   silently grants everything while looking like it granted nothing.
 *
 * WHAT IT ACTUALLY DOES
 *   Resolves a mode plus explicit allow/deny lists into a concrete tool
 *   allowlist over TNF's real builtin tool catalog, which `agents-run` and
 *   `llm-client` already honour via `builtinTools`. The catalog is the
 *   enforcement point — a tool that is not in the resolved list is never
 *   advertised to the model, and `agents-run` additionally refuses to execute
 *   one if the model asks for it anyway.
 */

/** Every builtin tool TNF can attach. Mirrors BUILTIN_TOOLS in llm-tools.ts. */
export const KNOWN_TOOLS = [
  'bash',
  'read_file',
  'write_file',
  'search_files',
  'web_search',
  'web_fetch',
  'browser_interact',
  'list_skills',
  'load_skill',
  'memory_recall',
] as const;

export type KnownTool = (typeof KNOWN_TOOLS)[number];

/** Tools that only observe. Safe under every mode including `plan`. */
const READ_ONLY_TOOLS: KnownTool[] = [
  'read_file',
  'search_files',
  'web_search',
  'web_fetch',
  'list_skills',
  'load_skill',
  'memory_recall',
];

/** Tools that change the workspace or run arbitrary code. */
const MUTATING_TOOLS: KnownTool[] = ['bash', 'write_file', 'browser_interact'];

export type PermissionMode = 'default' | 'plan' | 'acceptEdits' | 'bypassPermissions' | 'readOnly';

export const PERMISSION_MODES: PermissionMode[] = [
  'default',
  'plan',
  'acceptEdits',
  'bypassPermissions',
  'readOnly',
];

export interface PermissionResolution {
  mode: PermissionMode;
  /** Tools the model may call. Empty array means "no tools at all". */
  allowed: KnownTool[];
  /** Value to hand to `runAgentsRun({ enableTools })`. */
  enableTools: string;
  /** True when shell/file writes are permitted. */
  mutationsAllowed: boolean;
  /** Human-readable one-liner for the session banner. */
  summary: string;
  /** Names supplied by the operator that matched no known tool. */
  unknownTools: string[];
}

export function normalizePermissionMode(raw: string | undefined): PermissionMode {
  if (!raw) return 'default';
  const value = String(raw).trim();
  const match = PERMISSION_MODES.find((mode) => mode.toLowerCase() === value.toLowerCase());
  if (match) return match;
  // Accept the kebab spellings peers use (`accept-edits`, `bypass-permissions`).
  const kebab = value.toLowerCase().replace(/-/g, '');
  const kebabMatch = PERMISSION_MODES.find((mode) => mode.toLowerCase() === kebab);
  return kebabMatch ?? 'default';
}

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Resolve the effective tool allowlist.
 *
 * Order of application, most-permissive first, so a deny always wins:
 *   1. the mode establishes the baseline set
 *   2. `--allowed-tools` narrows it to an explicit intersection
 *   3. `--disallowed-tools` subtracts from whatever remains
 */
export function resolvePermissions(options: {
  mode?: string;
  allowedTools?: string;
  disallowedTools?: string;
}): PermissionResolution {
  const mode = normalizePermissionMode(options.mode);

  let baseline: KnownTool[];
  switch (mode) {
    case 'plan':
    case 'readOnly':
      baseline = [...READ_ONLY_TOOLS];
      break;
    case 'bypassPermissions':
    case 'acceptEdits':
    case 'default':
    default:
      baseline = [...READ_ONLY_TOOLS, ...MUTATING_TOOLS];
      break;
  }

  const unknownTools: string[] = [];
  const known = new Set<string>(KNOWN_TOOLS);

  const requested = parseList(options.allowedTools);
  if (requested.length > 0) {
    for (const name of requested) {
      if (!known.has(name)) unknownTools.push(name);
    }
    const allow = new Set(requested);
    baseline = baseline.filter((tool) => allow.has(tool));
  }

  const denied = parseList(options.disallowedTools);
  if (denied.length > 0) {
    for (const name of denied) {
      if (!known.has(name)) unknownTools.push(name);
    }
    const deny = new Set(denied);
    baseline = baseline.filter((tool) => !deny.has(tool));
  }

  const mutationsAllowed = baseline.some((tool) => (MUTATING_TOOLS as string[]).includes(tool));

  return {
    mode,
    allowed: baseline,
    // 'none' is the sentinel agents-run already understands for "refuse every
    // tool call"; an explicit list is intersected against the catalog.
    enableTools: baseline.length === 0 ? 'none' : baseline.join(','),
    mutationsAllowed,
    summary: describe(mode, baseline, mutationsAllowed),
    unknownTools,
  };
}

function describe(mode: PermissionMode, allowed: KnownTool[], mutationsAllowed: boolean): string {
  if (allowed.length === 0) return `${mode}: no tools (analysis only)`;
  const shape = mutationsAllowed ? 'read + write + shell' : 'read-only';
  return `${mode}: ${shape} (${allowed.length}/${KNOWN_TOOLS.length} tools)`;
}

/**
 * Whether a mode should suppress the interactive session's autonomous shell
 * auto-execution. `plan` and `readOnly` must never auto-run bash even when
 * the operator also passed --autonomous.
 */
export function modeDisablesAutonomy(mode: PermissionMode): boolean {
  return mode === 'plan' || mode === 'readOnly';
}
