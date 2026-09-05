import { CommandSourceService, type DiscoveredEntry } from './services/CommandSourceService.js';
import { ProjectConfigService, type ProjectCommandDef } from './services/ProjectConfigService.js';

export type SlashCommandSource = 'standard' | 'tnf' | 'project' | 'discovered';
export type SlashCommandMode = 'control' | 'prompt' | 'cli' | 'info';

export interface SlashCommandDefinition {
  name: string;
  aliases?: string[];
  summary: string;
  usage: string;
  source: SlashCommandSource;
  mode: SlashCommandMode;
  prompt?: string;
  cliCommand?: string[];
  content?: string;
  filePath?: string;
}

export interface ParsedSlashCommand {
  rawName: string;
  name: string;
  args: string[];
}

const STANDARD_SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    name: 'help',
    aliases: ['?'],
    summary: 'Show available slash commands.',
    usage: '/help [command]',
    source: 'standard',
    mode: 'info',
  },
  {
    name: 'clear',
    summary: 'Clear the active chat transcript while keeping the system prompt.',
    usage: '/clear',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'compact',
    summary: 'Compact the active transcript. In local TNF this resets transient chat history.',
    usage: '/compact',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'cost',
    summary: 'Show cost and token accounting status for the current session.',
    usage: '/cost',
    source: 'standard',
    mode: 'info',
  },
  {
    name: 'model',
    summary: 'Show or switch the active model for this TNF CLI session.',
    usage: '/model [model_name]',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'focus',
    aliases: ['whoami-focus'],
    summary:
      'Show or set agent focus: platform-dev | personal | personal-professional (distinct from super-admin auth).',
    usage: '/focus [platform-dev|personal|personal-professional] [--profile id] [--goal text]',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'exit',
    aliases: ['quit'],
    summary: 'End the interactive session.',
    usage: '/exit',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'exec',
    aliases: ['run', 'shell'],
    summary: 'Execute a shell command in the TNF repo root.',
    usage: '/exec <command>',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'autonomous',
    aliases: ['auto'],
    summary: 'Toggle automatic execution of bash blocks from assistant replies.',
    usage: '/autonomous [on|off]',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'window',
    aliases: ['operator-window', 'ow'],
    summary:
      'Show or set the operator takeover window (seconds). Persists to ~/.tnf/tui-mode.json.',
    usage: '/window [seconds|30s|8000ms]',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'hold',
    aliases: ['pause-auto'],
    summary: 'Pause autonomous continue so you can type freely. Use /continue to resume.',
    usage: '/hold',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'continue',
    aliases: ['resume-auto'],
    summary: 'Resume autonomous continue after /hold (or after a stall auto-hold).',
    usage: '/continue',
    source: 'standard',
    mode: 'control',
  },
  {
    name: 'review',
    summary: 'Start a code review pass over the current workspace context.',
    usage: '/review [focus]',
    source: 'standard',
    mode: 'prompt',
    prompt:
      'Review the current TNF workspace with a bug-first engineering stance. Prioritize correctness, regressions, missing verification, and public-distribution readiness. If you cannot inspect local files from this runtime, say exactly what command or tool-enabled agent should run next.',
  },
  {
    name: 'apply',
    summary: 'Apply or draft a patch from the following instruction.',
    usage: '/apply <instruction>',
    source: 'standard',
    mode: 'prompt',
    prompt:
      'Apply the following requested change to the TNF workspace. Inspect state first, keep edits scoped, and verify the result. Instruction:',
  },
  {
    name: 'new',
    summary: 'Start a new conversation with a clean state',
    usage: '/new',
    source: 'standard',
    mode: 'prompt',
    prompt:
      'Start a new conversation. Clear the current context, chat history, and any temporary state. Begin fresh with the system prompt.',
  },
];

const TNF_SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    name: 'commands',
    aliases: ['slash'],
    summary: 'List standard, TNF, and project slash commands.',
    usage: '/commands',
    source: 'tnf',
    mode: 'info',
  },
  {
    name: 'status',
    summary: 'Run the TNF doctor/status surface.',
    usage: '/status',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['doctor'],
  },
  {
    name: 'doctor',
    summary: 'Run TNF environment diagnostics.',
    usage: '/doctor',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['doctor'],
  },
  {
    name: 'state',
    summary: 'Show canonical TNF living state, ledger, handoff, and runtime snapshot.',
    usage: '/state',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['state', 'show'],
  },
  {
    name: 'handoff',
    summary: 'Show the canonical TNF session handoff.',
    usage: '/handoff',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['handoff', 'show'],
  },
  {
    name: 'protocol',
    summary: 'Run TNF protocol schema validation.',
    usage: '/protocol',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['protocol', 'schemas'],
  },
  {
    name: 'agents',
    summary: 'List configured TNF agent paths.',
    usage: '/agents',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['agents', 'list'],
  },
  {
    name: 'announce',
    aliases: ['availability-announce', 'dispatchable'],
    summary:
      'Announce this interactive TNF session as available for local Subdirector dispatch (or --offline).',
    usage: '/announce [--offline] [--json] [--name <name>] [--platform <platform>]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['agents', 'announce'],
  },
  {
    name: 'sessions',
    aliases: ['session'],
    summary: 'List stored TNF sessions.',
    usage: '/sessions',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['session', 'list'],
  },
  {
    name: 'halt',
    summary: 'Halt the TNF agent daemon gracefully.',
    usage: '/halt',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['halt'],
  },
  {
    name: 'heartbeat',
    summary: 'Show or control the TNF agent heartbeat subsystem.',
    usage: '/heartbeat [status|start|stop|interval <ms>]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['heartbeat'],
  },
  {
    name: 'ledger',
    summary: 'Show the TNF agent entity ledger (UFTE federatedId tracking).',
    usage: '/ledger [--agent <id>] [--limit <n>] [--json]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['ledger'],
  },
  {
    name: 'orient',
    summary: 'Show or set the TNF living state orientation (who/what/why/when/where/how).',
    usage:
      '/orient [show|set] [--who <text>] [--what <text>] [--why <text>] [--when <text>] [--where <text>] [--how <text>]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['orient'],
  },
  {
    name: 'start',
    summary: 'Start the TNF agent daemon in background mode.',
    usage:
      '/start [--profile <name>] [--interval <seconds>] [--agent-id <id>] [--agent-name <name>]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['start'],
  },
  {
    name: 'models',
    summary: 'List available model/provider information.',
    usage: '/models [query]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['models'],
  },
  {
    name: 'config',
    summary: 'Show resolved TNF configuration.',
    usage: '/config',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['config', 'show'],
  },
  {
    name: 'mcp',
    summary: 'List configured MCP servers.',
    usage: '/mcp',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['mcp', 'list'],
  },
  {
    name: 'skills',
    summary: 'Show TNF skill-bank status.',
    usage: '/skills',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['skills', 'bank', 'status'],
  },
  {
    name: 'logs',
    summary: 'Show TNF live-agent log paths/status.',
    usage: '/logs',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['live', 'logs'],
  },
  {
    name: 'agent',
    summary: 'Create a project-scoped TNF agent definition scaffold.',
    usage: '/agent <name>',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['project', 'create', 'agent'],
  },
  {
    name: 'skill',
    summary: 'Create a project-scoped TNF skill scaffold.',
    usage: '/skill <name>',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['project', 'create', 'skill'],
  },
  {
    name: 'workflow',
    summary: 'Create a project-scoped n8n workflow definition scaffold.',
    usage: '/workflow <name>',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['project', 'create', 'workflow'],
  },
  {
    name: 'mcp-server',
    aliases: ['mcpserver'],
    summary: 'Create a project-scoped MCP server implementation scaffold.',
    usage: '/mcp-server <name>',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['project', 'create', 'mcp-server'],
  },
  {
    name: 'boot',
    summary: 'Boot the full TNF stack and attach the interactive agent.',
    usage: '/boot [profile]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['boot'],
  },
  {
    name: 'tui',
    summary: 'Launch the TNF TUI always-on agent session.',
    usage: '/tui [--autonomous]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['tui'],
  },
  {
    name: 'harness',
    aliases: ['h'],
    summary: 'Harness master loop: inspect, loop, cycle, or boot.',
    usage: '/harness inspect|loop|cycle|boot [flags]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['harness'],
  },
  {
    name: 'gate',
    summary: 'Run all TNF protocol gates (Turn Zero, handoff drift, session handoff).',
    usage: '/gate',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['protocol', 'gate'],
  },
  {
    name: 'turn-end',
    aliases: ['end', 'handoff-end'],
    summary: 'Run Turn End: refresh LIVING_STATE and SESSION_HANDOFF artifacts.',
    usage: '/turn-end',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['turn-end'],
  },
  {
    name: 'cycle',
    aliases: ['master-loop'],
    summary: 'Run one full harness master loop (inspect → act → verify).',
    usage: '/cycle [--skip-live-loop]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['harness', 'cycle'],
  },
  {
    name: 'clean',
    summary: 'Remove build artifacts (dist, .next, *.{d.ts,js.map}, .vite, *.log).',
    usage: '/clean [--dry-run] [--include-node-modules]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['clean'],
  },
  {
    name: 'tree',
    summary: 'Print the monorepo apps/ and packages/ directories as a tree.',
    usage: '/tree [--depth N] [--root PATH]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['tree'],
  },
  {
    name: 'find',
    summary: 'Search file contents across the monorepo using ripgrep (falls back to grep).',
    usage: '/find <pattern> [--path PATH] [--glob GLOB] [--limit N]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['find'],
  },
  {
    name: 'department',
    aliases: ['dept'],
    summary: 'List or show operator-facing departments (HR, Marketing, Legal, Tech, …).',
    usage: '/department [list|show <id>|route <text>|apply]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department'],
  },
  {
    name: 'hr',
    summary: 'Show the HR department card.',
    usage: '/hr',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'hr'],
  },
  {
    name: 'marketing',
    summary: 'Show the Marketing department card.',
    usage: '/marketing',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'marketing'],
  },
  {
    name: 'design',
    summary: 'Show the Design department card.',
    usage: '/design',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'design'],
  },
  {
    name: 'legal',
    summary: 'Show the Legal department card.',
    usage: '/legal',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'legal'],
  },
  {
    name: 'tech',
    summary: 'Show the Tech department card.',
    usage: '/tech',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'tech'],
  },
  {
    name: 'finance',
    summary: 'Show the Finance department card.',
    usage: '/finance',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'finance'],
  },
  {
    name: 'product',
    summary: 'Show the Product department card.',
    usage: '/product',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'product'],
  },
  {
    name: 'ops',
    summary: 'Show the Ops department card.',
    usage: '/ops',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['department', 'show', 'ops'],
  },
  {
    name: 'remember',
    summary: 'Retain or recall a durable operator fact.',
    usage: '/remember [retain|recall|status] <text>',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['remember'],
  },
  {
    name: 'scout',
    summary: 'Show or staff ecosystem scout missions for tnf-cli-agent.',
    usage: '/scout [queue|staff|status|host-profiles]',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['scout'],
  },
];

export type SlashChainDirection = 'forward' | 'reverse';

export interface SlashCommandChain {
  version: 'tnf.slash-chain/v1';
  direction: SlashChainDirection;
  steps: ParsedSlashCommand[];
}

interface SlashToken {
  value: string;
  quoted: boolean;
}

function tokenizeSlashInput(input: string): SlashToken[] {
  const tokens: SlashToken[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    while (i < len && /\s/.test(input[i])) {
      i++;
    }
    if (i >= len) break;

    const char = input[i];
    if (char === '"' || char === "'") {
      const quoteChar = char;
      i++; // skip opening quote
      let value = '';
      while (i < len && input[i] !== quoteChar) {
        if (input[i] === '\\' && i + 1 < len) {
          i++;
          value += input[i];
        } else {
          value += input[i];
        }
        i++;
      }
      if (i < len && input[i] === quoteChar) {
        i++; // skip closing quote
      }
      tokens.push({ value, quoted: true });
    } else {
      let value = '';
      while (i < len && !/\s/.test(input[i])) {
        if (input[i] === '\\' && i + 1 < len) {
          i++;
          value += input[i];
        } else {
          value += input[i];
        }
        i++;
      }
      tokens.push({ value, quoted: false });
    }
  }

  return tokens;
}

export function parseSlashCommands(input: string): ParsedSlashCommand[] {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return [];

  const tokens = tokenizeSlashInput(trimmed);
  const commands: ParsedSlashCommand[] = [];
  let currentCmd: ParsedSlashCommand | null = null;

  for (const token of tokens) {
    if (
      !token.quoted &&
      token.value.startsWith('/') &&
      token.value.length > 1 &&
      token.value.indexOf('/', 1) === -1
    ) {
      const rawName = token.value.slice(1);
      currentCmd = {
        rawName,
        name: normalizeSlashName(rawName),
        args: [],
      };
      commands.push(currentCmd);
    } else if (currentCmd) {
      currentCmd.args.push(token.value);
    }
  }

  return commands;
}

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const commands = parseSlashCommands(input);
  return commands[0] || null;
}

export function parseSlashCommandChain(
  input: string,
  direction: SlashChainDirection = 'forward'
): SlashCommandChain {
  const steps = parseSlashCommands(input);
  if (direction === 'reverse') {
    steps.reverse();
  }
  return {
    version: 'tnf.slash-chain/v1',
    direction,
    steps,
  };
}

export function reverseSlashCommandChain(chain: SlashCommandChain): SlashCommandChain {
  const reversedDirection: SlashChainDirection =
    chain.direction === 'forward' ? 'reverse' : 'forward';
  return {
    version: 'tnf.slash-chain/v1',
    direction: reversedDirection,
    steps: [...chain.steps].reverse(),
  };
}

function formatSlashArg(arg: string): string {
  if (arg === '' || /\s/.test(arg) || arg.startsWith('/') || arg.includes('"')) {
    return JSON.stringify(arg);
  }
  return arg;
}

export function serializeSlashCommandChain(chain: SlashCommandChain): string {
  return chain.steps
    .map((step) => {
      const formattedArgs = step.args.map(formatSlashArg).join(' ');
      return `/${step.rawName}${formattedArgs ? ' ' + formattedArgs : ''}`;
    })
    .join(' ');
}

export function normalizeSlashName(name: string): string {
  return name.replace(/^\//, '').trim().toLowerCase();
}

export function getStandardSlashCommands(): SlashCommandDefinition[] {
  return [...STANDARD_SLASH_COMMANDS, ...TNF_SLASH_COMMANDS];
}

export function getProjectSlashCommands(projectRoot: string): SlashCommandDefinition[] {
  const project = new ProjectConfigService(projectRoot);
  return project.getCommands().map(projectCommandToSlashCommand);
}

/**
 * Markdown commands/prompts/agents/skills discovered across every runtime's
 * directory convention — including the ones TNF provisions into peer CLIs.
 *
 * Kept OUT of `getAllSlashCommands` on purpose. There are ~800 of them in this
 * repo; folding them into the curated list would turn `/help` into an
 * unreadable wall and make `findSlashCommand` walk 800 entries per keystroke.
 * They are resolved on demand by `findSlashCommand` (after the curated list
 * misses) and indexed separately by the palette, which can rank them.
 */
const discoveredCache = new Map<string, SlashCommandDefinition[]>();

export function getDiscoveredSlashCommands(projectRoot: string): SlashCommandDefinition[] {
  const cached = discoveredCache.get(projectRoot);
  if (cached) return cached;

  const service = new CommandSourceService(projectRoot);
  const mapped = service.discover().map((entry) => discoveredToSlashCommand(entry, service));
  discoveredCache.set(projectRoot, mapped);
  return mapped;
}

function discoveredToSlashCommand(
  entry: DiscoveredEntry,
  service: CommandSourceService
): SlashCommandDefinition {
  const noun = entry.kind === 'agent' ? 'agent' : entry.kind === 'skill' ? 'skill' : 'command';
  return {
    name: normalizeSlashName(entry.name),
    summary: entry.description || `${entry.runtime} ${noun} (${entry.scope})`,
    usage: `/${normalizeSlashName(entry.name)} [args]`,
    source: 'discovered',
    mode: 'prompt',
    // Body is read lazily: discovery must stay cheap enough to run on every
    // interactive launch, and 800 file reads is not that.
    get content() {
      return service.loadBody(entry);
    },
    filePath: entry.filePath,
  } as SlashCommandDefinition;
}

export function getAllSlashCommands(projectRoot: string): SlashCommandDefinition[] {
  return [...getStandardSlashCommands(), ...getProjectSlashCommands(projectRoot)];
}

export function findSlashCommand(name: string, projectRoot: string): SlashCommandDefinition | null {
  const normalized = normalizeSlashName(name);
  const curated = getAllSlashCommands(projectRoot).find(
    (command) =>
      command.name === normalized ||
      command.aliases?.some((alias) => normalizeSlashName(alias) === normalized)
  );
  if (curated) return curated;

  // Curated names win on collision (a hand-written /skills entry should keep
  // beating a Markdown file literally named "skills"), so this runs second.
  return getDiscoveredSlashCommands(projectRoot).find((c) => c.name === normalized) || null;
}

export function renderSlashCommandList(projectRoot: string): string {
  const commands = getAllSlashCommands(projectRoot);
  const groups: SlashCommandSource[] = ['standard', 'tnf', 'project'];
  const lines = ['Slash Commands', ''];

  for (const group of groups) {
    const groupCommands = commands.filter((command) => command.source === group);
    if (groupCommands.length === 0) continue;
    lines.push(`${titleCase(group)}:`);
    for (const command of groupCommands.sort((a, b) => a.name.localeCompare(b.name))) {
      const aliases = command.aliases?.length
        ? ` (${command.aliases.map((a) => `/${a}`).join(', ')})`
        : '';
      lines.push(`  /${command.name}${aliases}`);
      lines.push(`    ${command.summary}`);
    }
    lines.push('');
  }

  // The discovered set is summarised rather than listed: ~800 entries would
  // bury the curated commands. The palette (`/` then type) is the way in, and
  // `tnf commands --all` prints the full inventory when it is actually wanted.
  const discovered = getDiscoveredSlashCommands(projectRoot);
  if (discovered.length > 0) {
    lines.push(`Discovered (${discovered.length}):`);
    lines.push('  Markdown commands, agents and skills from .tnf/, .claude/,');
    lines.push('  .agent/, .gemini/, .cursor/, .codex/ and .pi/ — project and user scope.');
    lines.push('  Each is addressable as /<name>. Press / and type to search them.');
    lines.push('');
  }

  lines.push('Press / and type to open the command palette (fuzzy, all depths).');
  lines.push('Use /help <command> or tnf slash show <command> for details.');
  return lines.join('\n');
}

export function renderSlashCommandDetail(command: SlashCommandDefinition): string {
  const lines = [`/${command.name}`, '', command.summary, '', `Usage: ${command.usage}`];
  if (command.aliases?.length) {
    lines.push(`Aliases: ${command.aliases.map((alias) => `/${alias}`).join(', ')}`);
  }
  lines.push(`Source: ${command.source}`);
  lines.push(`Mode: ${command.mode}`);
  if (command.cliCommand?.length) {
    lines.push(`Runs: tnf ${command.cliCommand.join(' ')}`);
  }
  if (command.filePath) {
    lines.push(`File: ${command.filePath}`);
  }
  if (command.content) {
    lines.push('', command.content);
  }
  return lines.join('\n');
}

export function formatPromptSlashCommand(command: SlashCommandDefinition, args: string[]): string {
  const suffix = args.join(' ').trim();
  // File-backed commands (project `.tnf/command`, and everything discovered
  // under .claude/.agent/.gemini/.pi) expand to their body; curated commands
  // expand to their hard-coded prompt.
  if (command.source === 'project' || command.source === 'discovered') {
    return suffix
      ? `${command.content || ''}\n\nArguments:\n${suffix}`.trim()
      : (command.content || '').trim();
  }

  return suffix
    ? `${command.prompt || command.summary}\n\n${suffix}`
    : command.prompt || command.summary;
}

export function formatPromptSlashCommandChain(
  steps: Array<{ command: SlashCommandDefinition; args: string[] }>
): string {
  if (steps.length === 0) return '';
  if (steps.length === 1) {
    return formatPromptSlashCommand(steps[0].command, steps[0].args);
  }

  const invocation = steps
    .map((s) => {
      const argStr = s.args.map(formatSlashArg).join(' ');
      return `/${s.command.name}${argStr ? ' ' + argStr : ''}`;
    })
    .join(' ');

  const lines: string[] = [
    '# tnf.slash-chain/v1',
    `Invocation: ${invocation}`,
    '',
    'Execute the following prompt skill chain in order.',
    'Execution rules:',
    '- Run steps sequentially in the listed order.',
    '- Every prompt step after the first receives the prior step output as `upstream` context (e.g. step 2 receives step 1 output as `upstream`).',
    '- Stop on the first failed validation and report the failing step.',
    '- The final step supplies the overall chain result.',
    '',
  ];

  steps.forEach((step, index) => {
    const stepNum = index + 1;
    const stepBody = formatPromptSlashCommand(step.command, step.args);
    lines.push(`## Step ${stepNum}: /${step.command.name}`);
    if (index > 0) {
      lines.push(`Input: step ${index} output as \`upstream\``);
    }
    if (step.args.length > 0) {
      lines.push(`Arguments: ${step.args.join(' ')}`);
    }
    lines.push('', stepBody, '');
  });

  return lines.join('\n').trim();
}

function projectCommandToSlashCommand(command: ProjectCommandDef): SlashCommandDefinition {
  const firstHeading = command.content
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0)
    ?.replace(/^#+\s*/, '')
    .trim();

  return {
    name: normalizeSlashName(command.name),
    summary: firstHeading || `Run project command from ${command.filePath}`,
    usage: `/${normalizeSlashName(command.name)} [args]`,
    source: 'project',
    mode: 'prompt',
    content: command.content,
    filePath: command.filePath,
  };
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
