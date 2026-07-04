/**
 * Built-in Tool Registry
 *
 * A canonical set of tool definitions the tnf CLI can hand to a
 * provider that supports OpenAI-style tool_choice:"auto". Each tool
 * describes a wrapper around an existing capability the CLI already
 * has — bash/file/web/etc. — so a single LLM call can drive an
 * autonomous loop without constructing bespoke scaffolds in every
 * call site.
 *
 * Autonomy-first defaults:
 *   • Every tool definition is always available
 *   • The registry is opt-out via LLMOptions.builtinTools = 'none'
 *     or per-tool filtering via LLMOptions.builtinTools = ['bash', …]
 *   • We never include dangerous tools (e.g. raw sh with full
 *     privilege) by default. Bash is sandboxed through the same
 *     terminal toolset the agent already exposes.
 */

import type { LLMOptions } from './llm-client.js';

export interface BuiltinTool {
  name: string;
  description: string;
  /** OpenAI tool parameter schema. */
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  /** What capability group this tool belongs to (for filtering). */
  category: 'filesystem' | 'shell' | 'search' | 'web' | 'agent' | 'observability';
  /**
   * Whether the tool is considered safe by default for fully autonomous
   * loops. False here means callers must opt-in via LLMOptions.toolFilter.
   */
  defaultEnabled: boolean;
}

export const BUILTIN_TOOLS: readonly BuiltinTool[] = Object.freeze([
  {
    name: 'bash',
    category: 'shell',
    defaultEnabled: true,
    description:
      'Run a shell command on the orchestrator host. The shell already enforces the standard TNF sandbox: time-limited, no interactive PTY, no privileged expansion, output is truncated to 64 KiB.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command line to execute. Multi-line allowed; pass as a single string.',
        },
        cwd: {
          type: 'string',
          description: 'Working directory. Defaults to the orchestrator CWD.',
        },
        maxWaitMs: {
          type: 'integer',
          description: 'Hard timeout in milliseconds. Defaults to 30s if omitted; max 10 min.',
        },
      },
      required: ['command'],
      additionalProperties: false,
    },
  },
  {
    name: 'read_file',
    category: 'filesystem',
    defaultEnabled: true,
    description:
      'Read up to 2000 lines of a file at the requested offset. Returns plain UTF-8 (binary files are rejected).',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the file.' },
        offset: { type: 'integer', description: '1-indexed line offset (default 1).' },
        limit: { type: 'integer', description: 'Max lines to return (default 2000, max 2000).' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
  {
    name: 'write_file',
    category: 'filesystem',
    defaultEnabled: true,
    description:
      'Atomically write a file. Parent directories are created automatically. Will not overwrite binary files.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_files',
    category: 'search',
    defaultEnabled: true,
    description:
      'Search file contents by regex or list files by glob. Equivalent to ripgrep / fd.',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Regex (for content) or glob (for files: target="files").' },
        target: {
          type: 'string',
          enum: ['content', 'files'],
          description: '"content" -> grep inside files; "files" -> find by name. Default: content.',
        },
        path: { type: 'string', description: 'Search root (default ".").' },
        limit: { type: 'integer', description: 'Cap results (default 50).' },
      },
      required: ['pattern'],
      additionalProperties: false,
    },
  },
  {
    name: 'web_search',
    category: 'web',
    defaultEnabled: true,
    description:
      'Run a free-text search against the public web. Returns titles, URLs, and excerpts. Use this when no local context answers the question.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        maxResults: { type: 'integer', description: 'Default 10, max 25.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'web_fetch',
    category: 'web',
    defaultEnabled: true,
    description:
      'Fetch a single HTTP/HTTPS URL and return its text content (HTML stripped to plain text, capped at 200KB).',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        maxBytes: { type: 'integer', description: 'Default 200_000, max 2_000_000.' },
      },
      required: ['url'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_skills',
    category: 'observability',
    defaultEnabled: true,
    description:
      'List all TNF skills currently loaded in the agent harness, with their descriptions. Use this to discover which tool wrappers are already available before inventing new primitives.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category filter.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'load_skill',
    category: 'observability',
    defaultEnabled: true,
    description:
      'Load a named TNF skill by name and return its full body so the agent can consult the procedure in-band.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'memory_recall',
    category: 'observer-builtin',
    defaultEnabled: true,
    description:
      'Read durable notes saved to the agent memory provider (Hermes / Redis / holistic) that match a query. Use this to remember decisions made in earlier sessions.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'integer', description: 'Default 10.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  }
]) as readonly BuiltinTool[];

/**
 * Convert an internal BuiltinTool definition into the wire shape an
 * OpenAI-compatible provider expects (`{type:"function", function:{…}}`).
 */
export function toOpenAITool(tool: BuiltinTool): Record<string, unknown> {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

/**
 * Resolve which builtin tools to attach for a given call.
 *
 * Auto-include semantics:
 *   • options.builtinTools === 'none'      → empty list
 *   • options.builtinTools === 'all'       → every default-on tool
 *   • options.builtinTools === undefined   → every default-on tool (autonomy default)
 *   • options.builtinTools is an array of names → intersect with catalog
 *   • options.tools already supplied        → empty list (caller's choices win)
 *
 * The catalog is always filtered against `defaultEnabled`, so even an
 * "all" opt-in cannot include a tool marked `defaultEnabled:false`.
 */
export function resolveBuiltinTools(options: LLMOptions): BuiltinTool[] {
  if (Array.isArray(options.tools) && options.tools.length > 0) return [];
  const selection = options.builtinTools;
  if (selection === 'none') return [];
  const all = BUILTIN_TOOLS.filter((t) => t.defaultEnabled);
  if (selection === undefined || selection === 'all') return [...all];
  if (Array.isArray(selection)) {
    const allow = new Set(selection);
    return all.filter((t) => allow.has(t.name));
  }
  return [...all];
}

/**
 * Same as resolveBuiltinTools but returns the OpenAI wire shape, ready
 * to be dropped into `payload.tools`.
 */
export function resolveBuiltinToolsAsOpenAI(options: LLMOptions): Array<Record<string, unknown>> {
  return resolveBuiltinTools(options).map(toOpenAITool);
}
