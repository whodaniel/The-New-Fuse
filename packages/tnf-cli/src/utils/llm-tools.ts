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
  category: 'filesystem' | 'shell' | 'search' | 'web' | 'agent' | 'observability' | 'mcp';
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
          description:
            'Shell command line to execute. Multi-line allowed; pass as a single string.',
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
    description: 'Search file contents by regex or list files by glob. Equivalent to ripgrep / fd.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regex (for content) or glob (for files: target="files").',
        },
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
      'Read a public HTTP/HTTPS URL. Prefers the local Crawl4AI service for LLM-optimized Markdown and falls back to a direct text fetch.',
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
    name: 'browser_interact',
    category: 'web',
    defaultEnabled: true,
    description:
      'Interact with a stateful browser through agent-browser. Use for authenticated pages, navigation, forms, clicks, and other UI actions. Use web_fetch instead for read-only public URLs.',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: [
            'open',
            'snapshot',
            'click',
            'fill',
            'type',
            'press',
            'wait',
            'get',
            'back',
            'forward',
            'reload',
            'close',
            'state_load',
            'state_save',
            'profiles',
          ],
        },
        target: {
          type: 'string',
          description: 'URL, element reference/selector, key, wait condition, or state-file path.',
        },
        value: {
          type: 'string',
          description: 'Text/value used by fill, type, and supported get operations.',
        },
        profile: {
          type: 'string',
          description:
            'Chrome profile name (for a read-only snapshot such as Default) or persistent agent profile directory.',
        },
        stateFile: {
          type: 'string',
          description:
            'Playwright-compatible storage-state file exported by browser-session-auth-bridge.',
        },
        session: {
          type: 'string',
          description: 'Optional isolated agent-browser session name.',
        },
        headed: {
          type: 'boolean',
          description: 'Show the browser window when opening. Defaults to true for TNF local runs.',
        },
      },
      required: ['operation'],
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
    category: 'observability',
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
  },
  {
    name: 'mcp_list_tools',
    category: 'mcp',
    defaultEnabled: true,
    description:
      'Start a configured local stdio MCP server, initialize the MCP session, and return the tools it advertises. Optionally filter to one server by name.',
    parameters: {
      type: 'object',
      properties: {
        server: {
          type: 'string',
          description: 'Optional configured MCP server name. Omit to list tools from every enabled server.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'mcp_call_tool',
    category: 'mcp',
    defaultEnabled: true,
    description:
      'Call a tool exposed by a configured local stdio MCP server. MCP tools may mutate external systems, so only use this when the permission mode allows mutating tools.',
    parameters: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'Configured MCP server name.' },
        tool: { type: 'string', description: 'MCP tool name advertised by the server.' },
        arguments: {
          type: 'object',
          description: 'JSON object passed as the MCP tools/call arguments payload.',
        },
      },
      required: ['server', 'tool'],
      additionalProperties: false,
    },
  },
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
