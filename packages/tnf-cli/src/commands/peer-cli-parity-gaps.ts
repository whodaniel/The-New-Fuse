/**
 * Claude / Pi / Codex parity gap closers.
 *
 * WHAT THESE ARE, HONESTLY
 *   Two different things live in this file and they are NOT equivalent:
 *
 *     - `registerGuide(...)` registers a real command that prints where the
 *       equivalent TNF capability lives. It does not do what the peer verb
 *       does. It is a signpost.
 *     - `registerRootOptions(...)` registers a flag that is parsed and then
 *       ignored. Nothing reads it.
 *
 *   Both were previously counted by `tnf parity audit` as coverage, which is
 *   how the ledger reached "100% coverage, 0 open gaps" while the underlying
 *   features did not exist. `PARITY_SHIMS` below is exported so ParityService
 *   can subtract them from the score instead of counting them.
 *
 * MARKER OPTIONS ARE NOT FREE
 *   Commander recognises program-level options anywhere in argv unless
 *   positional-options mode is on. These markers therefore SHADOWED real
 *   subcommand flags of the same name — `tnf paths --json`, `tnf parity
 *   agents --json` and `tnf commands --limit 4` all silently lost their flag
 *   to a root marker that did nothing with it. cli.ts now calls
 *   `program.enablePositionalOptions()`, and the markers that have since been
 *   implemented for real have been removed from the lists below.
 */

import chalk from 'chalk';
import type { Command } from 'commander';
import { findCommand } from './_registry.js';

function registerGuide(program: Command, name: string, description: string, lines: string[]): void {
  if (findCommand(program, name)) return;
  program
    .command(name)
    .description(description)
    .action(() => {
      console.log(chalk.bold(`\nTNF ${name}\n`));
      for (const line of lines) console.log(`  ${line}`);
      console.log('');
    });
}

function hasRootOption(program: Command, longFlag: string): boolean {
  const needle = longFlag.toLowerCase();
  return (program.options ?? []).some((opt) => {
    const flags = String(opt.flags || '').toLowerCase();
    return flags.split(/[ ,|]+/).includes(needle);
  });
}

function registerRootOptions(
  program: Command,
  entries: Array<{ flag: string; description: string }>
): void {
  for (const entry of entries) {
    const long = entry.flag.split(/\s+/)[0];
    if (!long.startsWith('--') || long === '--') continue;
    // Guard against help-parser ghosts like `--path--`
    if (!/^--[a-z0-9][a-z0-9-]*$/i.test(long)) continue;
    if (hasRootOption(program, long)) continue;
    program.option(entry.flag, entry.description);
  }
}

/** Claude Code verbs TNF exposes as guides / thin entrypoints. */
export const CLAUDE_PARITY_GAP_COMMANDS = ['auto-mode', 'setup-token', 'ultrareview'] as const;

/** Codex verbs TNF exposes as guides / thin entrypoints. */
export const CODEX_PARITY_GAP_COMMANDS = [
  'app',
  'app-server',
  'apply',
  'archive',
  'cloud',
  'exec-server',
  'features',
  'fork',
  'mcp-server',
  'remote-control',
  'unarchive',
] as const;

/** Jules verbs TNF exposes as guides / thin entrypoints. */
export const JULES_PARITY_GAP_COMMANDS = ['new', 'teleport'] as const;

/** Cursor Agent verbs TNF exposes as guides / thin entrypoints. */
export const CURSOR_AGENT_PARITY_GAP_COMMANDS = [
  'about',
  'bedrock',
  'create-chat',
  'generate-rule',
  'install-shell-integration',
  'ls',
  'uninstall-shell-integration',
  'worker',
] as const;

/** OpenCode / Kilo shared top-level verbs TNF exposes as guides. */
export const OPENCODE_KILO_PARITY_GAP_COMMANDS = [
  'attach',
  'github',
  'pr',
  'web',
  'roll-call',
] as const;

/** Claude root long-flags accepted for parity (honest interop markers). */
export const CLAUDE_PARITY_ROOT_OPTIONS: Array<{ flag: string; description: string }> = [
  { flag: '--add-dir <path>', description: 'Claude parity: extra working directory hint' },
  { flag: '--agent <name>', description: 'Claude parity: agent name hint' },
  { flag: '--agents <list>', description: 'Claude parity: agent allowlist hint' },
  {
    flag: '--allow-dangerously-skip-permissions',
    description: 'Claude parity: skip-permissions allow marker (not recommended)',
  },
  {
    flag: '--append-system-prompt <text>',
    description: 'Claude/Pi parity: append system prompt hint',
  },
  { flag: '--autocompact', description: 'Claude parity: autocompact marker' },
  { flag: '--ax-screen-reader', description: 'Claude parity: accessibility / screen-reader mode' },
  { flag: '--background', description: 'Claude parity: background run marker' },
  { flag: '--bare', description: 'Claude parity: bare / minimal mode marker' },
  { flag: '--betas <list>', description: 'Claude parity: beta feature flags hint' },
  { flag: '--bg', description: 'Claude parity: background alias' },
  { flag: '--brief', description: 'Claude parity: brief output marker' },
  { flag: '--chrome', description: 'Claude parity: Chrome/browser integration marker' },
  { flag: '--cloud', description: 'Claude/Codex parity: cloud mode marker' },
  {
    flag: '--dangerously-skip-permissions',
    description: 'Claude parity: skip permissions marker (not recommended)',
  },
  { flag: '--debug', description: 'Claude parity: debug marker' },
  { flag: '--debug-file <path>', description: 'Claude parity: debug log file hint' },
  {
    flag: '--disable-slash-commands',
    description: 'Claude parity: disable slash commands marker',
  },
  { flag: '--effort <level>', description: 'Claude parity: effort / reasoning level hint' },
  { flag: '--environment <name>', description: 'Claude parity: environment profile hint' },
  {
    flag: '--exclude-dynamic-system-prompt-sections',
    description: 'Claude parity: strip dynamic system prompt sections',
  },
  { flag: '--fallback-model <model>', description: 'Claude parity: fallback model hint' },
  { flag: '--file <path>', description: 'Claude parity: input file hint' },
  { flag: '--fork-session', description: 'Claude parity: fork session marker' },
  {
    flag: '--forward-subagent-text',
    description: 'Claude parity: forward subagent text marker',
  },
  { flag: '--from-pr <ref>', description: 'Claude parity: bootstrap from PR hint' },
  { flag: '--ide', description: 'Claude parity: IDE integration marker' },
  { flag: '--include-hook-events', description: 'Claude parity: include hook events marker' },
  {
    flag: '--include-partial-messages',
    description: 'Claude parity: include partial messages marker',
  },
  { flag: '--input-format <fmt>', description: 'Claude parity: input format hint' },
  { flag: '--json-schema <path>', description: 'Claude parity: JSON schema constraint hint' },
  { flag: '--max-budget-usd <n>', description: 'Claude parity: budget cap hint' },
  { flag: '--mcp-config <path>', description: 'Claude parity: MCP config path hint' },
  { flag: '--name <name>', description: 'Claude/Pi parity: session/name hint' },
  { flag: '--no-chrome', description: 'Claude parity: disable Chrome marker' },
  {
    flag: '--no-session-persistence',
    description: 'Claude parity: skip session persistence marker',
  },
  { flag: '--output-format <fmt>', description: 'Claude parity: output format hint' },
  { flag: '--plugin-dir <path>', description: 'Claude parity: plugin directory hint' },
  { flag: '--plugin-url <url>', description: 'Claude parity: plugin URL hint' },
  { flag: '--print', description: 'Claude/Pi parity: print/non-interactive marker' },
  { flag: '--prompt-suggestions', description: 'Claude parity: prompt suggestions marker' },
  { flag: '--remote-control', description: 'Claude/Codex parity: remote control marker' },
  {
    flag: '--remote-control-session-name-prefix <prefix>',
    description: 'Claude parity: remote control session prefix',
  },
  {
    flag: '--replay-user-messages',
    description: 'Claude parity: replay user messages marker',
  },
  { flag: '--session-id <id>', description: 'Claude/Pi parity: session id hint' },
  { flag: '--setting-sources <list>', description: 'Claude parity: setting sources hint' },
  { flag: '--settings <path>', description: 'Claude parity: settings file hint' },
  { flag: '--strict-mcp-config', description: 'Claude parity: strict MCP config marker' },
  { flag: '--system-prompt <text>', description: 'Claude/Pi parity: system prompt hint' },
  { flag: '--teleport', description: 'Claude parity: teleport / remote session marker' },
  { flag: '--tmux', description: 'Claude parity: tmux integration marker' },
  { flag: '--tools <list>', description: 'Claude/Pi parity: tools allowlist hint' },
  { flag: '--verbose', description: 'Claude/Pi parity: verbose marker' },
];

/** Pi root long-flags accepted for parity. */
export const PI_PARITY_ROOT_OPTIONS: Array<{ flag: string; description: string }> = [
  { flag: '--api-key <key>', description: 'Pi parity: API key hint (prefer env/keystore)' },
  { flag: '--approve', description: 'Pi parity: auto-approve marker' },
  { flag: '--exclude-tools <list>', description: 'Pi parity: tool denylist hint' },
  { flag: '--export <path>', description: 'Pi parity: export path hint' },
  { flag: '--extension <path>', description: 'Pi parity: extension path hint' },
  { flag: '--fork', description: 'Pi/Codex parity: fork session/marker' },
  { flag: '--list-models', description: 'Pi parity: list models marker' },
  { flag: '--mode <mode>', description: 'Pi parity: interaction mode hint' },
  { flag: '--models <list>', description: 'Pi parity: model allowlist hint' },
  { flag: '--no-approve', description: 'Pi parity: require approvals marker' },
  { flag: '--no-builtin-tools', description: 'Pi parity: disable builtin tools marker' },
  { flag: '--no-context-files', description: 'Pi parity: skip context files marker' },
  { flag: '--no-extensions', description: 'Pi parity: disable extensions marker' },
  {
    flag: '--no-prompt-templates',
    description: 'Pi parity: disable prompt templates marker',
  },
  { flag: '--no-session', description: 'Pi parity: no session persistence marker' },
  { flag: '--no-skills', description: 'Pi parity: disable skills marker' },
  { flag: '--no-themes', description: 'Pi parity: disable themes marker' },
  { flag: '--no-tools', description: 'Pi parity: disable tools marker' },
  { flag: '--offline', description: 'Pi parity: offline mode marker' },
  { flag: '--prompt-template <name>', description: 'Pi parity: prompt template hint' },
  { flag: '--session <id>', description: 'Pi parity: session hint' },
  { flag: '--session-dir <path>', description: 'Pi parity: session directory hint' },
  { flag: '--skill <name>', description: 'Pi parity: skill select hint' },
  { flag: '--theme <name>', description: 'Pi parity: theme hint' },
  { flag: '--thinking <level>', description: 'Pi parity: thinking level hint' },
  { flag: '--tui-mode <mode>', description: 'Pi parity: TUI mode hint' },
];

/** Codex root long-flags accepted for parity. */
export const CODEX_PARITY_ROOT_OPTIONS: Array<{ flag: string; description: string }> = [
  {
    flag: '--ask-for-approval',
    description: 'Codex parity: ask for approval marker',
  },
  { flag: '--cd <dir>', description: 'Codex parity: working directory hint' },
  { flag: '--config <path>', description: 'Codex parity: config file hint' },
  { flag: '--image <path>', description: 'Codex parity: image input hint' },
  { flag: '--no-alt-screen', description: 'Codex parity: disable alt screen marker' },
  { flag: '--profile <name>', description: 'Codex parity: profile hint' },
  { flag: '--sandbox <mode>', description: 'Codex parity: sandbox mode hint' },
  { flag: '--search <query>', description: 'Codex parity: search hint' },
];

/** Jules root long-flags accepted for parity. */
export const JULES_PARITY_ROOT_OPTIONS: Array<{ flag: string; description: string }> = [
  { flag: '--apply', description: 'Jules parity: apply suggestion/patch marker' },
  { flag: '--assignee <name>', description: 'Jules parity: assignee hint' },
  { flag: '--parallel <n>', description: 'Jules parity: parallelism hint' },
  { flag: '--repo <slug>', description: 'Jules parity: repository hint' },
];

/** Cursor Agent root long-flags accepted for parity. */
export const CURSOR_AGENT_PARITY_ROOT_OPTIONS: Array<{ flag: string; description: string }> = [
  { flag: '--approve-mcps', description: 'Cursor Agent parity: approve MCP servers marker' },
  { flag: '--auto-review', description: 'Cursor Agent parity: auto-review marker' },
  { flag: '--endpoint <url>', description: 'Cursor Agent parity: API endpoint hint' },
  { flag: '--force', description: 'Cursor Agent parity: force marker' },
  { flag: '--header <value>', description: 'Cursor Agent parity: HTTP header hint' },
  { flag: '--plan', description: 'Cursor Agent parity: plan mode marker' },
  {
    flag: '--skip-worktree-setup',
    description: 'Cursor Agent parity: skip worktree setup marker',
  },
  {
    flag: '--stream-partial-output',
    description: 'Cursor Agent parity: stream partial output marker',
  },
  { flag: '--trust', description: 'Cursor Agent parity: trust workspace marker' },
  { flag: '--workspace <path>', description: 'Cursor Agent parity: workspace path hint' },
];

export function registerPeerCliParityGapCommands(program: Command, _repoRoot: string): void {
  // --- Claude ---
  registerGuide(program, 'auto-mode', 'Claude parity: auto / unattended mode entry', [
    'TNF unattended:  tnf full-auto --help',
    'Doctor first:    tnf doctor',
    'Authority gate:  tnf authority status',
  ]);
  registerGuide(program, 'setup-token', 'Claude parity: token / auth setup guidance', [
    'TNF onboarding:  tnf onboard',
    'Auth surfaces:   tnf auth --help',
    'Authority:       tnf authority status',
    'Never paste secrets into chat; use OS keystore / env.',
  ]);
  registerGuide(program, 'ultrareview', 'Claude parity: deep review entry', [
    'Protocol gate:   tnf protocol gate',
    'Parity:          tnf parity audit',
    'Growth audit:    tnf growth-audit',
    'Security sweep:  tnf security --sweep',
  ]);

  // --- Codex ---
  registerGuide(program, 'app', 'Codex parity: app / desktop entry', [
    'Local UI:   tnf local-ui',
    'Tauri app:  pnpm --dir apps/tauri-desktop tauri:dev',
  ]);
  registerGuide(program, 'app-server', 'Codex parity: app-server entry', [
    'API / local stack: tnf local-ui',
    'Gateway:           tnf gateway',
    'Relay:             tnf relay start',
  ]);
  registerGuide(program, 'apply', 'Codex parity: apply / patch entry', [
    'Prefer reviewed git apply / patch workflows with live operator confirmation.',
    'TNF verify:  tnf doctor && tnf protocol gate',
  ]);
  registerGuide(program, 'archive', 'Codex parity: archive entry', [
    'Export:   tnf export --help',
    'Sessions: tnf session list',
  ]);
  registerGuide(program, 'unarchive', 'Codex parity: unarchive entry', [
    'Restore via session / export tooling: tnf session --help',
  ]);
  registerGuide(program, 'cloud', 'Codex/Claude parity: cloud entry', [
    'TNF cloud surfaces are operator-gated. Start with: tnf authority status',
    'Relay / gateway: tnf relay monitor | tnf gateway',
  ]);
  registerGuide(program, 'exec-server', 'Codex parity: exec-server entry', [
    'Local execution path: tnf agent --help',
    'Relay:                tnf relay start',
  ]);
  registerGuide(program, 'features', 'Codex parity: features entry', [
    'Config:  tnf config resolved',
    'Parity:  tnf parity audit',
    'Plugins: tnf plugins --help',
  ]);
  registerGuide(program, 'fork', 'Codex/Pi parity: fork session entry', [
    'Sessions: tnf session --help',
    'Export:   tnf export --help',
  ]);
  registerGuide(program, 'mcp-server', 'Codex parity: MCP server entry', [
    'MCP bridge: tnf mcp --help',
    'Config:     tnf config resolved',
  ]);
  registerGuide(program, 'remote-control', 'Codex/Claude parity: remote-control entry', [
    'Telegram: tnf telegram status|start|send',
    'Relay:    tnf relay monitor',
    'Authority must remain operator-gated.',
  ]);

  // --- Jules ---
  registerGuide(program, 'new', 'Jules parity: start a new task / session', [
    'TNF session:  tnf session --help',
    'Agent:        tnf agent --help',
    'Onboard:      tnf onboard',
  ]);
  registerGuide(program, 'teleport', 'Jules/Claude parity: teleport / remote session entry', [
    'Remote:   tnf remote-control',
    'Relay:    tnf relay monitor',
    'Gateway:  tnf gateway',
  ]);

  // --- Cursor Agent ---
  registerGuide(program, 'about', 'Cursor Agent parity: about / version entry', [
    'Version:  tnf --version',
    'Doctor:   tnf doctor',
    'Config:   tnf config resolved',
  ]);
  registerGuide(program, 'bedrock', 'Cursor Agent parity: AWS Bedrock entry', [
    'Models:    tnf model / tnf ai models',
    'Providers: tnf config resolved',
    'Auth:      tnf auth --help',
  ]);
  registerGuide(program, 'create-chat', 'Cursor Agent parity: create chat entry', [
    'Session:  tnf session --help',
    'TUI:      tnf tui',
    'Agent:    tnf agent --help',
  ]);
  registerGuide(program, 'generate-rule', 'Cursor Agent parity: generate rule entry', [
    'Rules / skills:  tnf skill --help',
    'Harness docs:    docs/core/AGENTS.md',
    'Parity:          tnf parity audit',
  ]);
  registerGuide(
    program,
    'install-shell-integration',
    'Cursor Agent parity: install shell integration',
    [
      'TNF CLI install:  bash scripts/install-tnf-cli.sh',
      'Onboard:          tnf onboard',
      'Shell path tip:   ensure ~/.local/bin is on PATH',
    ]
  );
  registerGuide(
    program,
    'uninstall-shell-integration',
    'Cursor Agent parity: uninstall shell integration',
    [
      'Remove the local `tnf` shim only with live operator confirmation.',
      'Typical path: ~/.local/bin/tnf',
      'Prefer `tnf doctor` before removing tooling.',
    ]
  );
  registerGuide(program, 'ls', 'Cursor Agent parity: list / resume chat sessions', [
    'Sessions:  tnf session list',
    'Resume:    tnf resume  |  tnf --continue',
    'TUI:       tnf tui',
    'Nested:    tnf mcp ls  (MCP server list alias)',
  ]);
  registerGuide(program, 'worker', 'Cursor Agent parity: private/cloud worker entry', [
    'Authority workers:  tnf authority workers',
    'Relaunch:           tnf authority relaunch-workers',
    'Fleet:              tnf fleet --help',
    'Agent:              tnf agent --help',
  ]);

  // --- OpenCode / Kilo ---
  registerGuide(program, 'attach', 'OpenCode/Kilo parity: attach to a session', [
    'Session:  tnf session --help',
    'TUI:      tnf tui',
    'Agent:    tnf agent --help',
  ]);
  registerGuide(program, 'github', 'OpenCode/Kilo parity: GitHub entry', [
    'Use `gh` with live operator confirmation for mutations.',
    'TNF status:  tnf doctor',
    'Parity:      tnf parity audit',
  ]);
  registerGuide(program, 'pr', 'OpenCode/Kilo parity: pull-request entry', [
    'Create/view PRs with `gh pr` (operator-gated push/create).',
    'TNF protocol:  tnf protocol gate',
    'Handoff:       docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
  ]);
  registerGuide(program, 'web', 'OpenCode/Kilo parity: web / UI entry', [
    'Local UI:   tnf local-ui',
    'Gateway:    tnf gateway',
    'Tauri app:  pnpm --dir apps/tauri-desktop tauri:dev',
  ]);
  registerGuide(program, 'roll-call', 'Kilo parity: agent roll-call / roster', [
    'Agents:     tnf agents --help',
    'Specs:      tnf agents-specs',
    'Status:     tnf status',
  ]);

  registerRootOptions(program, CLAUDE_PARITY_ROOT_OPTIONS);
  registerRootOptions(program, PI_PARITY_ROOT_OPTIONS);
  registerRootOptions(program, CODEX_PARITY_ROOT_OPTIONS);
  registerRootOptions(program, JULES_PARITY_ROOT_OPTIONS);
  registerRootOptions(program, CURSOR_AGENT_PARITY_ROOT_OPTIONS);
}

/**
 * Everything in this file that is a SIGNPOST rather than an implementation.
 *
 * `tnf parity audit` uses this to stop counting shims as coverage. Before
 * this existed the ledger read "100% coverage, 0 open gaps" across 8 reference
 * CLIs while `tnf fork`, `tnf worker` and `tnf cloud` printed a few lines of
 * pointer text and `--permission-mode` did nothing at all — the audit was
 * measuring name collisions, not capability.
 *
 * The contract: when a name here graduates to a real implementation, delete it
 * from this list in the same change. A name that is absent here is claimed as
 * genuinely implemented, and the audit will score it.
 */
export function getPeerParityShims(): { commands: Set<string>; options: Set<string> } {
  const commands = new Set<string>([
    ...CLAUDE_PARITY_GAP_COMMANDS,
    ...CODEX_PARITY_GAP_COMMANDS,
    ...JULES_PARITY_GAP_COMMANDS,
    ...CURSOR_AGENT_PARITY_GAP_COMMANDS,
    ...OPENCODE_KILO_PARITY_GAP_COMMANDS,
  ]);

  const options = new Set<string>();
  for (const list of [
    CLAUDE_PARITY_ROOT_OPTIONS,
    PI_PARITY_ROOT_OPTIONS,
    CODEX_PARITY_ROOT_OPTIONS,
    JULES_PARITY_ROOT_OPTIONS,
    CURSOR_AGENT_PARITY_ROOT_OPTIONS,
  ]) {
    for (const entry of list) options.add(entry.flag.split(/\s+/)[0].toLowerCase());
  }
  return { commands, options };
}
