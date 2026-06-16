import { ProjectConfigService, type ProjectCommandDef } from './services/ProjectConfigService.js';

export type SlashCommandSource = 'standard' | 'tnf' | 'project';
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
    name: 'exit',
    aliases: ['quit'],
    summary: 'End the interactive session.',
    usage: '/exit',
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
    name: 'sessions',
    aliases: ['session'],
    summary: 'List stored TNF sessions.',
    usage: '/sessions',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['session', 'list'],
  },
  {
    name: 'models',
    summary: 'List available model/provider information.',
    usage: '/models',
    source: 'tnf',
    mode: 'cli',
    cliCommand: ['ai', 'models'],
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
    name: 'models',
    summary: 'List available model/provider information.',
    usage: '/models',
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
];

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const [rawName = '', ...args] = trimmed.slice(1).split(/\s+/).filter(Boolean);
  if (!rawName) return null;
  return {
    rawName,
    name: normalizeSlashName(rawName),
    args,
  };
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

export function getAllSlashCommands(projectRoot: string): SlashCommandDefinition[] {
  return [...getStandardSlashCommands(), ...getProjectSlashCommands(projectRoot)];
}

export function findSlashCommand(name: string, projectRoot: string): SlashCommandDefinition | null {
  const normalized = normalizeSlashName(name);
  return (
    getAllSlashCommands(projectRoot).find(
      (command) =>
        command.name === normalized ||
        command.aliases?.some((alias) => normalizeSlashName(alias) === normalized)
    ) || null
  );
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
  if (command.source === 'project') {
    return suffix
      ? `${command.content || ''}\n\nArguments:\n${suffix}`.trim()
      : (command.content || '').trim();
  }

  return suffix
    ? `${command.prompt || command.summary}\n\n${suffix}`
    : command.prompt || command.summary;
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
