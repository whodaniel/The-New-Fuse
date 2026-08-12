/**
 * packages/tnf-cli/src/services/ParityService.ts
 *
 * Cross-agent CLI feature parity.
 *
 * TNF's stated goal is parity with the newest and best capabilities of *every*
 * agent CLI in the ecosystem — not just Hermes. This service measures that:
 * it captures TNF's own command surface by introspecting the live Commander
 * tree (exact, no help-text parsing), captures each reference agent's surface
 * by parsing its `--help`, and diffs them into a per-agent gap ledger.
 *
 * Design notes:
 *  - TNF's surface is read from the `Command` object, so it is always exact and
 *    costs no subprocess. Only reference CLIs are shelled out.
 *  - A reference command counts as covered if its name appears ANYWHERE in
 *    TNF's tree (any depth, including aliases). TNF routinely nests what other
 *    CLIs expose at the root — `login` lives under `auth`, `run` under `agents`
 *    — and a flat comparison would report those as gaps.
 *  - Reference CLIs are spawned with a hard timeout and a non-interactive
 *    environment. A missing or hanging CLI degrades to `available: false`; it
 *    never fails the audit.
 *
 * SHIMS ARE NOT COVERAGE (added 2026-08-12)
 *   Until this change the audit counted any TNF command or root option whose
 *   NAME matched the reference, which included the ~40 signpost commands and
 *   ~130 marker flags registered by `peer-cli-parity-gaps.ts` and
 *   `hermes-parity-gaps.ts` purely so the names would exist. The ledger
 *   therefore read "Mean coverage 100%, 0 open gaps" across 8 reachable CLIs
 *   while `tnf fork` printed two lines of pointer text and `--permission-mode`
 *   was never read by anything.
 *
 *   A parity number that cannot go down is not a measurement. Shim names are
 *   now excluded from the covered set and surface as gaps, and each report
 *   carries `shimmedCommands` / `shimmedOptions` so the ledger can say which
 *   part of the old 100% was signage.
 */

import { spawn } from 'child_process';
import type { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { getHermesParityShims } from '../commands/hermes-parity-gaps.js';
import { getPeerParityShims } from '../commands/peer-cli-parity-gaps.js';

export interface ReferenceAgent {
  /** Stable identifier used in the ledger and in goal records. */
  agent: string;
  /** Executable to invoke. */
  binary: string;
  /** Human-readable note about what this agent is a reference for. */
  note: string;
}

/**
 * The agent CLIs TNF tracks parity against.
 *
 * Adding an entry here is all that is required to bring a new agent into every
 * downstream surface: the audit, the ledger, the scorecard and the goals
 * backlog all iterate this roster.
 */
export const REFERENCE_AGENTS: ReferenceAgent[] = [
  { agent: 'claude', binary: 'claude', note: 'Anthropic Claude Code' },
  { agent: 'codex', binary: 'codex', note: 'OpenAI Codex CLI' },
  { agent: 'gemini', binary: 'gemini', note: 'Google Gemini CLI' },
  { agent: 'opencode', binary: 'opencode', note: 'OpenCode' },
  { agent: 'kilo', binary: 'kilo', note: 'Kilo CLI' },
  { agent: 'jules', binary: 'jules', note: 'Google Jules' },
  { agent: 'hermes', binary: 'hermes', note: 'Hermes Agent CLI' },
  { agent: 'openclaw', binary: 'openclaw', note: 'OpenClaw gateway' },
  { agent: 'pi', binary: 'pi', note: 'pi CLI' },
  { agent: 'cursor-agent', binary: 'cursor-agent', note: 'Cursor Agent' },
  { agent: 'amp', binary: 'amp', note: 'Sourcegraph Amp' },
  { agent: 'crush', binary: 'crush', note: 'Charm Crush' },
  { agent: 'aider', binary: 'aider', note: 'Aider' },
];

/**
 * Names and flags that every CLI has and that carry no parity signal.
 * Kept deliberately small — over-filtering hides real gaps.
 */
const UNIVERSAL_COMMANDS = new Set(['help', 'command', 'commands', 'version']);
const UNIVERSAL_OPTIONS = new Set(['--help', '--version']);

/**
 * Names TNF registers as signposts or inert markers rather than behaviour.
 *
 * Merged from both gap-closer modules and memoised: the audit calls this once
 * per reference agent, and the underlying arrays are static.
 */
let shimCache: { commands: Set<string>; options: Set<string> } | null = null;

export function parityShims(): { commands: Set<string>; options: Set<string> } {
  if (shimCache) return shimCache;
  const peer = getPeerParityShims();
  const hermes = getHermesParityShims();
  shimCache = {
    commands: new Set([...peer.commands, ...hermes.commands]),
    options: new Set([...peer.options, ...hermes.options]),
  };
  return shimCache;
}

/**
 * Reject help-example placeholders (e.g. Pi's `sessions/--path--/session.jsonl`)
 * and other non-flag tokens the long-option regex can accidentally harvest.
 */
export function isPlausibleLongOption(flag: string): boolean {
  const normalized = flag.toLowerCase();
  if (!normalized.startsWith('--')) return false;
  // Must be `--` + kebab tokens; no trailing dash, no internal `--` (placeholder ghosts).
  return /^--[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(normalized);
}

/** One command as documented by a reference CLI, with every name it answers to. */
export interface CapturedCommand {
  /** Canonical name, used for reporting. */
  name: string;
  /** Every name this command answers to, including `name`. Covered if ANY matches. */
  names: string[];
}

export interface CapturedSurface {
  commands: string[];
  /** Structured form of `commands`, carrying alias information. */
  entries: CapturedCommand[];
  options: string[];
  /**
   * False when the help page exposed no parseable command section at all.
   *
   * Prompt-first CLIs (hermes, opencode, claude) document their surface as a
   * usage cheat-sheet rather than a `Commands:` block. Treating that as "zero
   * commands, all missing" would report a fabricated 0% coverage, so the
   * command axis is marked unmeasured and excluded from the score instead.
   */
  commandsParsed: boolean;
}

export interface AgentParityReport {
  agent: string;
  binary: string;
  note: string;
  available: boolean;
  version: string | null;
  error?: string;
  /** Reference commands with no counterpart anywhere in TNF's tree. */
  missingCommands: string[];
  /** Reference root options TNF does not expose at its root. */
  missingOptions: string[];
  /**
   * Reference commands TNF answers to by NAME only, via a signpost command
   * that prints where the real capability lives. Counted as missing, but
   * reported separately so the backlog can distinguish "no entry point at all"
   * from "entry point exists, behaviour does not".
   */
  shimmedCommands: string[];
  /** Reference root options TNF parses and ignores. Counted as missing. */
  shimmedOptions: string[];
  /** Reference surface size, after filtering universals. */
  referenceCommandCount: number;
  referenceOptionCount: number;
  /**
   * False when this agent's help exposed no parseable command section, so the
   * command axis was not measured and does not contribute to `coverage`.
   */
  commandsMeasured: boolean;
  /** 0-100. Share of the *measured* reference surface TNF covers. */
  coverage: number;
  capturedAt: string;
}

export interface ParityLedger {
  generatedAt: string;
  tnf: {
    commandCount: number;
    rootOptionCount: number;
  };
  totals: {
    agentsTracked: number;
    agentsAvailable: number;
    agentsUnavailable: number;
    totalGaps: number;
    /** Mean coverage across available agents, 0-100. */
    meanCoverage: number;
  };
  agents: AgentParityReport[];
}

interface SpawnResult {
  ok: boolean;
  stdout: string;
  error?: string;
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

/**
 * Run `<binary> <args>` and capture stdout+stderr.
 *
 * Never rejects: a missing binary, a non-zero exit or a hang all resolve to
 * `{ ok: false }` so one broken reference CLI cannot fail the whole audit.
 */
function runHelp(binary: string, args: string[], timeoutMs: number): Promise<SpawnResult> {
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(binary, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Discourage interactive/TUI rendering and pagers.
          CI: '1',
          NO_COLOR: '1',
          TERM: 'dumb',
          PAGER: 'cat',
        },
      });
    } catch (err: any) {
      resolve({ ok: false, stdout: '', error: err?.message ?? String(err) });
      return;
    }

    let stdout = '';
    let settled = false;
    const finish = (result: SpawnResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish({ ok: false, stdout, error: `timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      // Several CLIs print help to stderr; treat both streams as help text.
      stdout += d.toString();
    });

    child.on('error', (err: any) => {
      finish({ ok: false, stdout, error: err?.code === 'ENOENT' ? 'not installed' : err?.message });
    });

    child.on('close', () => {
      // Exit code is deliberately ignored: many CLIs exit non-zero on `--help`.
      finish({ ok: stdout.trim().length > 0, stdout });
    });
  });
}

/**
 * Parse a Commander/Cobra/clap-style help page into a command+option surface.
 *
 * Ported from `.agent/skills/tnf-cli-parity-upgrade/scripts/cli_parity_audit.py`
 * so the audit runs in-process with no Python dependency.
 */
export function parseHelpSurface(rawText: string, selfName?: string): CapturedSurface {
  const text = stripAnsi(rawText);
  const entries = new Map<string, Set<string>>();
  const options = new Set<string>();
  let sawCommandSection = false;
  const self = selfName?.toLowerCase();

  let section = '';
  // Indentation of the first entry row in the current section. Help
  // generators (clap especially) wrap long descriptions onto more-indented
  // continuation lines; those are prose, not entries, and parsing them yields
  // garbage commands like `the` and `working` and phantom flags from
  // sentences. Anything indented deeper than the first row is a continuation.
  let sectionBaseIndent: number | null = null;
  let lastCommandNames: Set<string> | null = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    const stripped = line.trim();
    if (!stripped) continue;

    const header = /^([A-Za-z][A-Za-z ]+):$/.exec(stripped);
    if (header) {
      section = header[1].toLowerCase().trim();
      sectionBaseIndent = null;
      lastCommandNames = null;
      continue;
    }

    // Accept the common section spellings across help generators.
    // Argparse (Hermes) uses "positional arguments" / "options" / "optional arguments".
    const isCommandSection = section.endsWith('commands') || section === 'positional arguments';
    const isOptionSection =
      section.endsWith('options') || section.endsWith('flags') || section === 'optional arguments';
    if (isCommandSection) sawCommandSection = true;
    if (!isCommandSection && !isOptionSection) {
      // Hermes-style usage line embeds flags even before section headers.
      const usageLongs = stripped.match(/--[a-zA-Z0-9][a-zA-Z0-9-]*/g) ?? [];
      for (const flag of usageLongs) {
        const normalized = flag.toLowerCase();
        if (!UNIVERSAL_OPTIONS.has(normalized) && isPlausibleLongOption(normalized)) {
          options.add(normalized);
        }
      }
      continue;
    }
    if (!line.startsWith(' ')) continue;

    const indent = line.length - line.trimStart().length;
    if (sectionBaseIndent === null) sectionBaseIndent = indent;

    if (indent > sectionBaseIndent) {
      // Continuation line. It carries no entry, but clap does push trailing
      // "[aliases: x]" onto it, so salvage that for the preceding command.
      const wrappedAliases = /\[aliases?:\s*([^\]]+)\]/i.exec(stripped);
      if (isCommandSection && wrappedAliases && lastCommandNames) {
        for (const alias of wrappedAliases[1].split(',')) {
          const name = alias.trim().toLowerCase();
          if (name && !UNIVERSAL_COMMANDS.has(name)) lastCommandNames.add(name);
        }
      }
      continue;
    }

    const spec = stripped.split(/\s{2,}/)[0];
    if (!spec) continue;

    if (isCommandSection) {
      // Argparse subparser: `{chat,model,moa,...}` or `{chat,model}` with nested aliases in parens.
      const braceGroup = /\{([^{}]+)\}/.exec(stripped);
      if (braceGroup) {
        sawCommandSection = true;
        for (const raw of braceGroup[1].split(',')) {
          const token = raw
            .replace(/\(.*?\)/g, '')
            .trim()
            .toLowerCase();
          if (!token || UNIVERSAL_COMMANDS.has(token)) continue;
          if (token.startsWith('<') || token.startsWith('[') || token.startsWith('-')) continue;
          if (!entries.has(token)) entries.set(token, new Set([token]));
        }
        continue;
      }

      const tokens = spec.split(/\s+/).filter(Boolean);
      // yargs/Cobra-style help repeats the binary on every row
      // ("opencode run [message..]", "pi install <source>"). The command is
      // the token *after* the binary name, not the binary itself.
      if (self && tokens[0]?.toLowerCase() === self) tokens.shift();

      const head = tokens[0];
      if (!head) continue;

      // Commander writes aliases inline as "list|ls"; yargs appends
      // "[aliases: auth]" further along the row. Collect both.
      const names = new Set<string>();
      for (const part of head.split('|')) {
        const name = part.trim().toLowerCase();
        if (!name) continue;
        if (name.startsWith('<') || name.startsWith('[') || name.startsWith('-')) continue;
        if (UNIVERSAL_COMMANDS.has(name)) continue;
        names.add(name);
      }
      if (names.size === 0) continue;

      const aliasBlock = /\[aliases?:\s*([^\]]+)\]/i.exec(stripped);
      if (aliasBlock) {
        for (const alias of aliasBlock[1].split(',')) {
          const name = alias.trim().toLowerCase();
          if (name && !UNIVERSAL_COMMANDS.has(name)) names.add(name);
        }
      }

      const canonical = [...names][0];
      const existing = entries.get(canonical);
      if (existing) {
        for (const n of names) existing.add(n);
        lastCommandNames = existing;
      } else {
        entries.set(canonical, names);
        lastCommandNames = names;
      }
      continue;
    }

    const longs = spec.match(/--[a-zA-Z0-9][a-zA-Z0-9-]*/g) ?? [];
    for (const flag of longs) {
      const normalized = flag.toLowerCase();
      if (UNIVERSAL_OPTIONS.has(normalized)) continue;
      if (!isPlausibleLongOption(normalized)) continue;
      options.add(normalized);
    }
  }

  const captured: CapturedCommand[] = [...entries.entries()]
    .map(([name, names]) => ({ name, names: [...names].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    commands: captured.map((c) => c.name),
    entries: captured,
    options: [...options].sort(),
    commandsParsed: sawCommandSection,
  };
}

/**
 * Capture TNF's own surface directly from the live Commander tree.
 *
 * `commands` is every command name and alias at every depth — this is the set
 * a reference command is checked against, because TNF nests aggressively.
 * `rootOptions` is root-level long flags only, which is the fair comparison
 * against another CLI's root options.
 */
export function captureTnfSurface(program: Command): {
  commands: string[];
  rootOptions: string[];
} {
  const commands = new Set<string>();

  const walk = (cmd: Command): void => {
    for (const child of cmd.commands) {
      const name = child.name().toLowerCase();
      if (!UNIVERSAL_COMMANDS.has(name)) commands.add(name);
      for (const alias of child.aliases?.() ?? []) {
        const a = alias.toLowerCase();
        if (!UNIVERSAL_COMMANDS.has(a)) commands.add(a);
      }
      walk(child);
    }
  };
  walk(program);

  const rootOptions = new Set<string>();
  const collectOptions = (cmd: Command): void => {
    for (const opt of cmd.options ?? []) {
      const long = (opt as any).long as string | undefined;
      if (!long) continue;
      const normalized = long.toLowerCase();
      if (UNIVERSAL_OPTIONS.has(normalized)) continue;
      rootOptions.add(normalized);
    }
  };
  collectOptions(program);

  // Options on `tui` count as root-reachable, because cli.ts routes a leading
  // flag with no subcommand into a `tui` session — `tnf --permission-mode plan`
  // is literally `tnf tui --permission-mode plan`. Peer CLIs expose these same
  // settings at their root, so measuring only `program.options` would report
  // implemented behaviour as a gap, which is the mirror image of the
  // shims-counted-as-coverage bug this audit was fixed for.
  const sessionCommand = program.commands.find((cmd) => cmd.name() === 'tui');
  if (sessionCommand) collectOptions(sessionCommand);

  return { commands: [...commands].sort(), rootOptions: [...rootOptions].sort() };
}

export interface AuditOptions {
  /** Restrict the audit to these agent ids. Defaults to the full roster. */
  agents?: string[];
  /** Per-help-invocation timeout. */
  timeoutMs?: number;
}

export class ParityService {
  private readonly repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  get ledgerDir(): string {
    return path.join(this.repoRoot, 'docs/operations/parity');
  }

  get ledgerJsonPath(): string {
    return path.join(this.ledgerDir, 'parity-ledger.json');
  }

  get ledgerMarkdownPath(): string {
    return path.join(this.ledgerDir, 'parity-ledger.md');
  }

  get runLogPath(): string {
    return path.join(this.ledgerDir, 'parity-runs.jsonl');
  }

  resolveRoster(agents?: string[]): ReferenceAgent[] {
    if (!agents || agents.length === 0) return REFERENCE_AGENTS;
    const wanted = new Set(agents.map((a) => a.trim().toLowerCase()).filter(Boolean));
    const roster = REFERENCE_AGENTS.filter((r) => wanted.has(r.agent.toLowerCase()));
    const unknown = [...wanted].filter(
      (w) => !REFERENCE_AGENTS.some((r) => r.agent.toLowerCase() === w)
    );
    if (unknown.length > 0) {
      throw new Error(
        `Unknown agent(s): ${unknown.join(', ')}. Known: ${REFERENCE_AGENTS.map((r) => r.agent).join(', ')}`
      );
    }
    return roster;
  }

  private async captureAgent(
    ref: ReferenceAgent,
    tnfCommands: Set<string>,
    tnfRootOptions: Set<string>,
    timeoutMs: number
  ): Promise<AgentParityReport> {
    const capturedAt = new Date().toISOString();
    const base: AgentParityReport = {
      agent: ref.agent,
      binary: ref.binary,
      note: ref.note,
      available: false,
      version: null,
      missingCommands: [],
      missingOptions: [],
      shimmedCommands: [],
      shimmedOptions: [],
      referenceCommandCount: 0,
      referenceOptionCount: 0,
      commandsMeasured: false,
      coverage: 0,
      capturedAt,
    };

    const help = await runHelp(ref.binary, ['--help'], timeoutMs);
    if (!help.ok) {
      return { ...base, error: help.error ?? 'no help output' };
    }

    const surface = parseHelpSurface(help.stdout, ref.binary);
    const versionResult = await runHelp(ref.binary, ['--version'], Math.min(timeoutMs, 15_000));
    const version = versionResult.ok
      ? stripAnsi(versionResult.stdout).trim().split('\n')[0].slice(0, 80) || null
      : null;

    // A reference command is covered if ANY of its names appears anywhere in
    // TNF's tree — `opencode providers` is satisfied by TNF's `auth`, and
    // `plugin` by TNF's `plugins`. A name TNF only answers to via a signpost
    // command is NOT covered: the entry point exists, the behaviour does not.
    const shims = parityShims();
    const matches = (name: string): boolean =>
      tnfCommands.has(name) ||
      (name.endsWith('s') && tnfCommands.has(name.slice(0, -1))) ||
      tnfCommands.has(`${name}s`);
    const isShimCommand = (name: string): boolean =>
      shims.commands.has(name) ||
      (name.endsWith('s') && shims.commands.has(name.slice(0, -1))) ||
      shims.commands.has(`${name}s`);
    const covers = (name: string): boolean => matches(name) && !isShimCommand(name);

    const uncovered = surface.entries.filter((entry) => !entry.names.some(covers));
    const missingCommands = uncovered.map((entry) => entry.name);
    // Split the uncovered set for reporting: a name TNF signposts is a
    // different backlog item from a name TNF has never heard of.
    const shimmedCommands = uncovered
      .filter((entry) => entry.names.some((name) => matches(name) && isShimCommand(name)))
      .map((entry) => entry.name);

    const optionCovers = (flag: string): boolean =>
      tnfRootOptions.has(flag) && !shims.options.has(flag.toLowerCase());
    const missingOptions = surface.options.filter((o) => !optionCovers(o));
    const shimmedOptions = surface.options.filter(
      (o) => tnfRootOptions.has(o) && shims.options.has(o.toLowerCase())
    );

    // Score only what was actually measured. If the help page had no command
    // section, commands contribute neither to the numerator nor denominator —
    // otherwise a prompt-first CLI would score a fabricated 0%.
    const measuredTotal =
      (surface.commandsParsed ? surface.commands.length : 0) + surface.options.length;
    const measuredMissing =
      (surface.commandsParsed ? missingCommands.length : 0) + missingOptions.length;
    const coverage =
      measuredTotal === 0
        ? 100
        : Math.round(((measuredTotal - measuredMissing) / measuredTotal) * 100);

    return {
      ...base,
      available: true,
      version,
      missingCommands: surface.commandsParsed ? missingCommands : [],
      missingOptions,
      shimmedCommands: surface.commandsParsed ? shimmedCommands : [],
      shimmedOptions,
      referenceCommandCount: surface.commands.length,
      referenceOptionCount: surface.options.length,
      commandsMeasured: surface.commandsParsed,
      coverage,
    };
  }

  /** Run the full cross-agent audit. Never throws on an individual agent. */
  async audit(program: Command, options: AuditOptions = {}): Promise<ParityLedger> {
    const timeoutMs = options.timeoutMs ?? 30_000;
    const roster = this.resolveRoster(options.agents);

    const tnf = captureTnfSurface(program);
    const tnfCommands = new Set(tnf.commands);
    const tnfRootOptions = new Set(tnf.rootOptions);

    // Reference CLIs are independent subprocesses; run them concurrently so a
    // full 13-agent sweep stays inside a self-improvement cycle's budget.
    const agents = await Promise.all(
      roster.map((ref) => this.captureAgent(ref, tnfCommands, tnfRootOptions, timeoutMs))
    );

    const available = agents.filter((a) => a.available);
    const totalGaps = available.reduce(
      (sum, a) => sum + a.missingCommands.length + a.missingOptions.length,
      0
    );
    const meanCoverage =
      available.length === 0
        ? 0
        : Math.round(available.reduce((sum, a) => sum + a.coverage, 0) / available.length);

    return {
      generatedAt: new Date().toISOString(),
      tnf: {
        commandCount: tnf.commands.length,
        rootOptionCount: tnf.rootOptions.length,
      },
      totals: {
        agentsTracked: agents.length,
        agentsAvailable: available.length,
        agentsUnavailable: agents.length - available.length,
        totalGaps,
        meanCoverage,
      },
      agents: agents.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        return a.coverage - b.coverage;
      }),
    };
  }

  renderMarkdown(ledger: ParityLedger): string {
    const lines: string[] = [];
    lines.push('# TNF Cross-Agent Parity Ledger');
    lines.push('');
    lines.push(`Generated: ${ledger.generatedAt}`);
    lines.push('');
    lines.push(
      `TNF surface: **${ledger.tnf.commandCount}** commands (all depths), ` +
        `**${ledger.tnf.rootOptionCount}** root options.`
    );
    lines.push('');
    lines.push(
      `Tracking **${ledger.totals.agentsTracked}** agents — ` +
        `${ledger.totals.agentsAvailable} available, ` +
        `${ledger.totals.agentsUnavailable} not installed. ` +
        `Mean coverage **${ledger.totals.meanCoverage}%**, ` +
        `**${ledger.totals.totalGaps}** open gaps.`
    );
    lines.push('');
    lines.push('## Coverage');
    lines.push('');
    lines.push('| Agent | Status | Version | Coverage | Missing commands | Missing options |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const a of ledger.agents) {
      const status = a.available ? 'tracked' : `unavailable (${a.error ?? 'unknown'})`;
      const coverage = a.available ? `${a.coverage}%` : '—';
      const commandCell = !a.available
        ? '—'
        : a.commandsMeasured
          ? String(a.missingCommands.length)
          : 'not measured';
      lines.push(
        `| \`${a.agent}\` | ${status} | ${a.version ?? '—'} | ${coverage} | ` +
          `${commandCell} | ` +
          `${a.available ? a.missingOptions.length : '—'} |`
      );
    }
    lines.push('');

    const unmeasured = ledger.agents.filter((a) => a.available && !a.commandsMeasured);
    if (unmeasured.length > 0) {
      lines.push(
        `> Command coverage is not measured for ${unmeasured
          .map((a) => `\`${a.agent}\``)
          .join(', ')}: these CLIs are prompt-first and document their surface as a usage ` +
          'cheat-sheet rather than a parseable command section. Their coverage score reflects ' +
          'root options only.'
      );
      lines.push('');
    }

    const withGaps = ledger.agents.filter(
      (a) => a.available && (a.missingCommands.length > 0 || a.missingOptions.length > 0)
    );
    if (withGaps.length > 0) {
      lines.push('## Gaps by agent');
      lines.push('');
      for (const a of withGaps) {
        lines.push(`### ${a.agent} — ${a.note}`);
        lines.push('');
        // Split the report so the backlog can tell the two kinds apart: a
        // shimmed name already has an entry point and needs behaviour behind
        // it; an absent name needs both.
        const shimmedCommandSet = new Set(a.shimmedCommands);
        const absentCommands = a.missingCommands.filter((c) => !shimmedCommandSet.has(c));
        const shimmedOptionSet = new Set(a.shimmedOptions);
        const absentOptions = a.missingOptions.filter((o) => !shimmedOptionSet.has(o));

        if (absentCommands.length > 0) {
          lines.push(`- Commands TNF lacks: ${absentCommands.map((c) => `\`${c}\``).join(', ')}`);
        }
        if (a.shimmedCommands.length > 0) {
          lines.push(
            `- Commands TNF only signposts (entry point exists, behaviour does not): ` +
              `${a.shimmedCommands.map((c) => `\`${c}\``).join(', ')}`
          );
        }
        if (absentOptions.length > 0) {
          lines.push(
            `- Root options TNF lacks: ${absentOptions.map((o) => `\`${o}\``).join(', ')}`
          );
        }
        if (a.shimmedOptions.length > 0) {
          lines.push(
            `- Root options TNF parses and ignores: ` +
              `${a.shimmedOptions.map((o) => `\`${o}\``).join(', ')}`
          );
        }
        lines.push('');
      }
    }

    const unavailable = ledger.agents.filter((a) => !a.available);
    if (unavailable.length > 0) {
      lines.push('## Not measured');
      lines.push('');
      lines.push('These agents are in the roster but were not reachable on this host:');
      lines.push('');
      for (const a of unavailable) {
        lines.push(`- \`${a.agent}\` (${a.binary}) — ${a.error ?? 'unknown'}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /** Persist the ledger as JSON + Markdown and append a run-log line. */
  write(ledger: ParityLedger): { json: string; markdown: string; runLog: string } {
    fs.mkdirSync(this.ledgerDir, { recursive: true });
    fs.writeFileSync(this.ledgerJsonPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
    fs.writeFileSync(this.ledgerMarkdownPath, `${this.renderMarkdown(ledger)}\n`, 'utf8');
    fs.appendFileSync(
      this.runLogPath,
      `${JSON.stringify({
        generatedAt: ledger.generatedAt,
        agentsAvailable: ledger.totals.agentsAvailable,
        totalGaps: ledger.totals.totalGaps,
        meanCoverage: ledger.totals.meanCoverage,
      })}\n`,
      'utf8'
    );
    return {
      json: this.ledgerJsonPath,
      markdown: this.ledgerMarkdownPath,
      runLog: this.runLogPath,
    };
  }

  readLedger(): ParityLedger | null {
    if (!fs.existsSync(this.ledgerJsonPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(this.ledgerJsonPath, 'utf8')) as ParityLedger;
    } catch {
      return null;
    }
  }
}
