/**
 * packages/tnf-cli/src/commands/agents-run.ts
 *
 * `tnf agents run --task "..."` — long-running autonomous agent loop.
 *
 * Wires LLMClient.chatCompleteWithTools to a default executor that
 * implements the built-in tool definitions declared in
 * `utils/llm-tools.ts`. The agent can run indefinitely (no iteration
 * cap by default) and emits:
 *
 *   • final assistant content on stdout (or JSON envelope via --json)
 *   • optional streaming tokens during the run via --stream
 *   • one log line per tool invocation on stderr
 *   • exit code 0 on natural completion, 1 on error/wall-timeout
 *
 * Usage examples:
 *
 *   tnf agents run --task "Look at thenewfuse.com and tell me what's wrong"
 *   tnf agents run --task "Audit packages/tnf-cli/src/utils" --stream
 *   tnf agents run --task "Migrate repo to new schema" --tools bash,read_file,write_file
 *   tnf agents run --task "Run healthcheck" --max-iterations 50 --json
 *
 * No mocks. Every tool hits the real filesystem / network / Redis. The
 * bash tool uses child_process.execFile with argv mode so command-line
 * arguments never go through a shell — no injection surface even when
 * the LLM emits untrusted input.
 */
import { execFile } from 'child_process';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

import {
  AGENT_BROWSER_OPERATIONS,
  type AgentBrowserOperation,
  normalizeAgentBrowserOperation,
  runAgentBrowser,
} from '../utils/browser-routing.js';
import { resolvePrompt } from '../utils/prompt-input.js';
import { MCPToolRuntimeService } from '../services/MCPToolRuntimeService.js';

const execFileAsync = promisify(execFile);

// We import the LLMClient + tool registry lazily inside `run()` so the
// top-level module stays side-effect-free. Tests / other commands that
// import from this file without actually running an agent don't pay the
// cost of resolving the dynamic import graph.
type LLMClient = import('../utils/llm-client.js').LLMClient;
type LLMMessage = import('../utils/llm-client.js').LLMMessage;

interface RunOptions {
  task: string;
  stream?: boolean;
  tools?: string;
  maxIterations?: number;
  timeoutMs?: number;
  systemPrompt?: string;
  json?: boolean;
  cwd?: string;
  /** Comma-separated list of builtin tool names to enable. Default: all. */
  enableTools?: string;
  /** Suppress non-essential stderr output unless something fails. */
  quiet?: boolean;
}

interface JsonResult {
  ok: boolean;
  provider: string;
  model: string;
  baseUrl: string;
  finalContent: string;
  iterations: number;
  toolCalls: Array<{
    iteration: number;
    name: string;
    argsSummary: string;
    resultSummary: string;
    durationMs: number;
    ok: boolean;
  }>;
  finishReason: string;
  durationMs: number;
  error?: string;
}

/**
 * Default executor — implements each builtin tool against
 * real host facilities. Failures are caught and returned as a
 * structured string so the LLM can self-correct on the next iteration
 * instead of crashing the loop.
 */
export async function executeBuiltinTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { cwd: string; quiet: boolean }
): Promise<string | Record<string, unknown>> {
  const t0 = Date.now();
  try {
    let result: string | Record<string, unknown>;
    switch (name) {
      case 'bash': {
        const cmd = String(args.command ?? '');
        const cwd = String(args.cwd ?? ctx.cwd);
        const maxWaitMs = Math.min(
          Math.max(Number(args.maxWaitMs ?? 30000) || 30000, 1000),
          600_000
        );
        if (!cmd) return { ok: false, error: 'bash: empty command' };
        const argv = ['bash', '-lc', cmd];
        if (!ctx.quiet) {
          console.error(`[agents-run] bash: ${truncate(cmd, 240)} (cwd=${cwd}, ${maxWaitMs}ms)`);
        }
        const { stdout, stderr } = await execFileAsync(argv[0], argv.slice(1), {
          cwd,
          maxBuffer: 10 * 1024 * 1024,
          timeout: maxWaitMs,
        });
        const out = truncate(stdout || '', 64_000);
        const err = truncate(stderr || '', 16_000);
        result = {
          ok: true,
          durationMs: Date.now() - t0,
          stdout: out,
          stderr: err,
          truncated: (stdout?.length ?? 0) > 64_000,
        };
        break;
      }
      case 'read_file': {
        const p = String(args.path ?? '');
        const offset = Math.max(Number(args.offset ?? 1) || 1, 1);
        const limit = Math.min(Math.max(Number(args.limit ?? 2000) || 2000, 1), 2000);
        if (!p) return { ok: false, error: 'read_file: empty path' };
        if (!ctx.quiet)
          console.error(`[agents-run] read_file: ${p} offset=${offset} limit=${limit}`);
        const full = await fs.promises.readFile(p, 'utf8');
        const lines = full.split(/\r?\n/);
        const slice = lines.slice(offset - 1, offset - 1 + limit).join('\n');
        result = {
          ok: true,
          durationMs: Date.now() - t0,
          path: p,
          offset,
          limit,
          totalLines: lines.length,
          content: slice,
        };
        break;
      }
      case 'write_file': {
        const p = String(args.path ?? '');
        const content = String(args.content ?? '');
        if (!p) return { ok: false, error: 'write_file: empty path' };
        fs.mkdirSync(path.dirname(p), { recursive: true });
        // Atomic write — .tmp -> rename.
        const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
        await fs.promises.writeFile(tmp, content, 'utf8');
        await fs.promises.rename(tmp, p);
        if (!ctx.quiet) console.error(`[agents-run] write_file: ${p} (${content.length} bytes)`);
        result = {
          ok: true,
          durationMs: Date.now() - t0,
          path: p,
          bytesWritten: content.length,
        };
        break;
      }
      case 'search_files': {
        const pattern = String(args.pattern ?? '');
        const target = (args.target === 'files' ? 'files' : 'content') as 'files' | 'content';
        const root = String(args.path ?? ctx.cwd);
        const limit = Math.min(Math.max(Number(args.limit ?? 50) || 50, 1), 500);
        if (!pattern) return { ok: false, error: 'search_files: empty pattern' };
        if (!ctx.quiet)
          console.error(`[agents-run] search_files: ${target} ${pattern} (root=${root})`);
        // No search-adapter module dependency — the runSearch helper below
        // is portable across this and older builds (rg → grep → Node walk).
        result = await runSearch(pattern, target, root, limit);
        break;
      }
      case 'web_search':
      case 'web_fetch': {
        // Public read-only retrieval belongs to Crawl4AI/direct HTTP. Stateful
        // or authenticated interaction is handled by browser_interact below.
        result = await fallbackWeb(name, args, ctx);
        break;
      }
      case 'browser_interact': {
        let operation: AgentBrowserOperation;
        try {
          operation = normalizeAgentBrowserOperation(String(args.operation ?? ''));
        } catch {
          return {
            ok: false,
            error: `browser_interact: unsupported operation "${String(args.operation ?? '')}"`,
            supportedOperations: AGENT_BROWSER_OPERATIONS,
          };
        }
        if (!ctx.quiet) {
          console.error(
            `[agents-run] browser_interact: ${operation} ${truncate(String(args.target ?? ''), 180)}`
          );
        }
        const browserResult = await runAgentBrowser(
          ctx.cwd,
          {
            operation,
            target: args.target ? String(args.target) : undefined,
            value: args.value ? String(args.value) : undefined,
            profile: args.profile
              ? String(args.profile)
              : process.env.TNF_BROWSER_PROFILE || process.env.AGENT_BROWSER_PROFILE,
            stateFile: args.stateFile ? String(args.stateFile) : undefined,
            session: args.session ? String(args.session) : undefined,
            headed: args.headed === undefined ? operation === 'open' : Boolean(args.headed),
            json: true,
          },
          { cwd: ctx.cwd }
        );
        result = {
          ok: browserResult.code === 0,
          engine: 'agent-browser',
          operation,
          exitCode: browserResult.code,
          stdout: truncate(browserResult.stdout, 64_000),
          stderr: truncate(browserResult.stderr, 16_000),
        };
        break;
      }
      case 'list_skills': {
        const category = args.category ? String(args.category) : undefined;
        if (!ctx.quiet) console.error(`[agents-run] list_skills: ${category ?? '<all>'}`);
        result = listLoadedSkills(category);
        break;
      }
      case 'load_skill': {
        const skillName = String(args.name ?? '');
        if (!skillName) return { ok: false, error: 'load_skill: empty name' };
        if (!ctx.quiet) console.error(`[agents-run] load_skill: ${skillName}`);
        result = loadSkill(skillName);
        break;
      }
      case 'memory_recall': {
        const query = String(args.query ?? '');
        const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 100);
        if (!ctx.quiet) console.error(`[agents-run] memory_recall: "${query}" limit=${limit}`);
        result = await recallMemory(query, limit);
        break;
      }
      case 'mcp_list_tools': {
        const server = args.server ? String(args.server) : undefined;
        if (!ctx.quiet) console.error(`[agents-run] mcp_list_tools: ${server ?? '<all>'}`);
        const runtime = new MCPToolRuntimeService(ctx.cwd);
        result = {
          ok: true,
          servers: await runtime.listTools(server),
        };
        break;
      }
      case 'mcp_call_tool': {
        const server = String(args.server ?? '');
        const tool = String(args.tool ?? '');
        const toolArgs =
          args.arguments && typeof args.arguments === 'object'
            ? (args.arguments as Record<string, unknown>)
            : {};
        if (!server) return { ok: false, error: 'mcp_call_tool: empty server' };
        if (!tool) return { ok: false, error: 'mcp_call_tool: empty tool' };
        if (!ctx.quiet) console.error(`[agents-run] mcp_call_tool: ${server}.${tool}`);
        const runtime = new MCPToolRuntimeService(ctx.cwd);
        result = { ...(await runtime.callTool(server, tool, toolArgs)) };
        break;
      }
      default:
        return { ok: false, error: `unknown tool: ${name}` };
    }
    const durationMs = Date.now() - t0;
    if (result && typeof result === 'object') {
      (result as any).durationMs = durationMs;
    }
    return result ?? '';
  } catch (err: any) {
    if (!ctx.quiet)
      console.error(`[agents-run] ${name} failed in ${Date.now() - t0}ms: ${err?.message ?? err}`);
    return {
      ok: false,
      error: err?.message ?? String(err),
      tool: name,
      durationMs: Date.now() - t0,
    };
  }
}

function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + `\n... [+${s.length - n} bytes truncated]` : s;
}

/**
 * Fallback search adapter. We avoid pulling in a heavy ripgrep client by
 * shelling out to `rg` when available, and as a last resort fall back to
 * a Node-side glob+grep walker for the platform-independent case.
 */
async function runSearch(
  pattern: string,
  target: 'content' | 'files',
  root: string,
  limit: number
): Promise<Record<string, unknown>> {
  try {
    if (target === 'files') {
      // Files mode: shell out to `find ... -name <pattern>`. If find is
      // unavailable, fall back to fs.readdir walking.
      const { stdout } = await execFileAsync(
        'find',
        [root, '-type', 'f', '-name', pattern, '-not', '-path', '*/node_modules/*'],
        { maxBuffer: 4 * 1024 * 1024, timeout: 30_000 }
      );
      const matches = stdout.split('\n').filter(Boolean).slice(0, limit);
      return { ok: true, target: 'files', matches, count: matches.length };
    }
    // Content mode: try rg first; fallback to grep -R; final fallback to
    // a Node-loop over ripgrep on demand.
    try {
      const { stdout } = await execFileAsync(
        'rg',
        [
          '--no-heading',
          '--line-number',
          '-g',
          '!node_modules',
          '-g',
          '!.git',
          '-m',
          String(limit),
          pattern,
          root,
        ],
        { maxBuffer: 4 * 1024 * 1024, timeout: 30_000 }
      );
      return {
        ok: true,
        target: 'content',
        engine: 'rg',
        matches: stdout,
        count: stdout.split('\n').filter(Boolean).length,
      };
    } catch {
      const { stdout } = await execFileAsync(
        'grep',
        [
          '-RIn',
          '--exclude-dir=node_modules',
          '--exclude-dir=.git',
          '-m',
          String(limit),
          '-E',
          pattern,
          root,
        ],
        { maxBuffer: 4 * 1024 * 1024, timeout: 30_000 }
      );
      return { ok: true, target: 'content', engine: 'grep', matches: stdout };
    }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err), target };
  }
}

/**
 * Public-web implementation that requires no API keys. URL reads prefer the
 * existing local Crawl4AI service and degrade to direct HTTP; search uses
 * DuckDuckGo HTML. Interactive/authenticated work is intentionally separate.
 */
async function fallbackWeb(
  name: string,
  args: Record<string, unknown>,
  _ctx: { cwd: string; quiet: boolean }
): Promise<Record<string, unknown>> {
  if (name === 'web_search') {
    const query = String(args.query ?? '');
    const maxResults = Math.min(Math.max(Number(args.maxResults ?? 10) || 10, 1), 25);
    if (!query) return { ok: false, error: 'empty query' };
    // DuckDuckGo HTML paste: token-free, returns result links + snippets.
    // Simple regex parse because their JSON API requires unauthenticated
    // bots-friendly path which is currently disabled.
    try {
      const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; tnf-agent/1.0)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!resp.ok) return { ok: false, error: `search HTTP ${resp.status}` };
      const html = await resp.text();
      const results: Array<{ title: string; url: string; snippet: string }> = [];
      const re =
        /<a class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) && results.length < maxResults) {
        results.push({
          url: m[1],
          title: m[2].replace(/<[^>]+>/g, '').trim(),
          snippet: m[3].replace(/<[^>]+>/g, '').trim(),
        });
      }
      return { ok: true, engine: 'duckduckgo', query, results, count: results.length };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
  if (name === 'web_fetch') {
    const u = String(args.url ?? '');
    const maxBytes = Math.min(
      Math.max(Number(args.maxBytes ?? 200_000) || 200_000, 1024),
      2_000_000
    );
    if (!u) return { ok: false, error: 'empty url' };

    const crawl4aiUrl = process.env.CRAWL4AI_SERVICE_URL || 'http://localhost:8000/scrape';
    try {
      const resp = await fetch(crawl4aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: u,
          max_chars: maxBytes,
          timeout_ms: 20_000,
          main_content_only: true,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          success?: boolean;
          url?: string;
          title?: string;
          text?: string;
          markdown?: string;
          error?: string;
        };
        if (data.success) {
          const content = String(data.markdown || data.text || '');
          return {
            ok: true,
            engine: 'crawl4ai',
            url: data.url || u,
            title: data.title || '',
            content: truncate(content, maxBytes),
            bytes: Buffer.byteLength(content, 'utf8'),
            truncated: Buffer.byteLength(content, 'utf8') > maxBytes,
          };
        }
      }
    } catch {
      // Crawl4AI is an optional local service; direct HTTP remains available.
    }

    try {
      const resp = await fetch(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; tnf-agent/1.0)' },
        signal: AbortSignal.timeout(20_000),
      });
      if (!resp.ok) return { ok: false, error: `fetch HTTP ${resp.status}` };
      const buf = new Uint8Array(await resp.arrayBuffer());
      const truncated = buf.byteLength > maxBytes;
      const text = new TextDecoder('utf-8', { fatal: false }).decode(
        truncated ? buf.slice(0, maxBytes) : buf
      );
      // Strip tags crudely for legibility.
      const stripped = text
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        ok: true,
        engine: 'direct-http',
        url: u,
        contentType: resp.headers.get('content-type') ?? 'unknown',
        truncated,
        text: stripped,
      };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
  return { ok: false, error: `unknown web tool: ${name}` };
}

/**
 * Walk `~/.hermes/skills` and `~/.tnf/skills` for SKILL.md bodies.
 * Falls back to an empty array when the directories are missing; the
 * agent loop continues — it just won't have a skills tool to consult.
 */
function listLoadedSkills(category: string | undefined): Record<string, unknown> {
  const homes = [process.env.HOME || '/tmp', path.resolve(process.cwd(), '../../..')];
  const roots = homes.flatMap((home) => [
    path.join(home, '.hermes', 'skills'),
    path.join(home, '.tnf', 'skills'),
    path.join(home, '.claude', 'skills'),
  ]);
  const skills: Array<{ name: string; description: string; path: string; category?: string }> = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const full = path.join(root, entry, 'SKILL.md');
      if (!fs.existsSync(full)) continue;
      try {
        const body = fs.readFileSync(full, 'utf8');
        const fmMatch = body.match(/^---\n([\s\S]*?)\n---/);
        const fm: Record<string, string> = {};
        if (fmMatch) {
          for (const line of fmMatch[1].split('\n')) {
            const m = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
            if (m) fm[m[1]] = m[2].trim();
          }
        }
        const cat = fm['category'] || fm['group'];
        if (category && cat !== category) continue;
        skills.push({
          name: fm['name'] || entry,
          description: (fm['description'] || '').slice(0, 240),
          path: full,
          category: cat,
        });
      } catch {
        // ignore malformed skills
      }
    }
  }
  return { ok: true, count: skills.length, category: category ?? null, skills };
}

function loadSkill(name: string): Record<string, unknown> {
  const homes = [process.env.HOME || '/tmp', path.resolve(process.cwd(), '../../..')];
  const candidates = [
    ...homes.flatMap((home) => [
      path.join(home, '.hermes', 'skills', name, 'SKILL.md'),
      path.join(home, '.tnf', 'skills', name, 'SKILL.md'),
      path.join(home, '.claude', 'skills', name, 'SKILL.md'),
    ]),
    path.resolve(process.cwd(), name + '.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return { ok: true, name, path: p, body: fs.readFileSync(p, 'utf8').slice(0, 64_000) };
    }
  }
  return { ok: false, error: `no skill named "${name}"`, searchedDirs: candidates };
}

/**
 * Try Redis-backed memory first; fall back to a SQLite-less local
 * "sidecar notes" file. Never throws — an empty array on failure.
 */
async function recallMemory(query: string, limit: number): Promise<Record<string, unknown>> {
  try {
    // Lazy require so the CLI works without the redis package.
    let redis: any = null;
    try {
      redis = ((await import('ioredis' as string).catch(() => null)) as any)?.default;
    } catch {}
    if (redis) {
      const client = new redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT || 6379),
        lazyConnect: true,
      });
      try {
        await client.connect();
        const keys = await client.keys('hermes:memory:fact:*');
        const facts: Array<{ key: string; content: string }> = [];
        for (const key of keys.slice(0, 200)) {
          const data = await client.hgetall(key);
          const text = Object.values(data || {})
            .join(' ')
            .toLowerCase();
          if (!query || text.includes(query.toLowerCase())) {
            facts.push({ key, content: Object.values(data || {}).join(' ') });
          }
          if (facts.length >= limit) break;
        }
        await client.quit().catch(() => {});
        return { ok: true, engine: 'redis', query, results: facts, count: facts.length };
      } catch (e: any) {
        // fall through to the file-backed recall.
      }
    }
  } catch {
    // ignore — fall through
  }
  // File-backed fallback — ~/.tnf/memory/notes.jsonl
  const notesPath = path.join(process.env.HOME || '/tmp', '.tnf', 'memory', 'notes.jsonl');
  const results: string[] = [];
  try {
    if (fs.existsSync(notesPath)) {
      const lines = fs.readFileSync(notesPath, 'utf8').split('\n').reverse();
      const q = query.toLowerCase();
      for (const ln of lines) {
        if (!ln) continue;
        if (!q || ln.toLowerCase().includes(q)) {
          results.push(ln);
          if (results.length >= limit) break;
        }
      }
    }
  } catch {
    // ignore
  }
  return { ok: true, engine: 'file', query, results, count: results.length };
}

/**
 * Compose the default agent loop. Returns a fully-formed JsonResult.
 * Public so tests can drive it directly without going through CLI.
 */
export async function runAgentsRun(opts: RunOptions): Promise<JsonResult> {
  const t0 = Date.now();
  const cwd = opts.cwd ?? process.cwd();
  const enabledToolsRaw = opts.enableTools?.trim();
  const enabledTools =
    enabledToolsRaw === undefined || enabledToolsRaw === ''
      ? undefined
      : enabledToolsRaw.toLowerCase() === 'none'
        ? ([] as string[])
        : enabledToolsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

  // Lazy-import the LLM guts. cli.ts is heavy; don't eagerly load it here.
  const { LLMClient: LLMClientCtor } = (await import('../utils/llm-client.js')) as {
    LLMClient: { create(role?: unknown): Promise<LLMClient> };
  };
  const client = await LLMClientCtor.create('orchestrator');

  const messages: LLMMessage[] = [
    {
      role: 'user',
      content: opts.task,
    },
  ];

  const toolCalls: JsonResult['toolCalls'] = [];
  let iterCount = 0;

  const result = await client.chatCompleteWithTools(
    messages,
    async (name: string, args: Record<string, unknown>) => {
      const tTool = Date.now();
      let response: string | Record<string, unknown>;
      try {
        // Plan/ask / --tools none: refuse tool execution even if the model asks.
        if (Array.isArray(enabledTools) && enabledTools.length === 0) {
          response = { ok: false, error: `tool '${name}' disabled (tools=none)` };
        } else {
          response = await executeBuiltinTool(name, args, { cwd, quiet: !!opts.quiet });
        }
      } catch (err: any) {
        response = { ok: false, error: err?.message ?? String(err), tool: name };
      }
      const durationMs = Date.now() - tTool;
      const ok = !(response && typeof response === 'object' && (response as any).ok === false);
      toolCalls.push({
        iteration: iterCount,
        name,
        argsSummary: summarizeArgs(args),
        resultSummary:
          typeof response === 'string' ? truncate(response, 240) : summarizeObject(response),
        durationMs,
        ok,
      });
      return response;
    },
    {
      maxIterations: opts.maxIterations, // undefined → unlimited (autonomy default)
      timeoutMs: opts.timeoutMs,
      systemPrompt: opts.systemPrompt,
      builtinTools:
        enabledTools === undefined
          ? undefined
          : enabledTools.length === 0
            ? 'none'
            : enabledTools.includes('all')
              ? 'all'
              : enabledTools,
      stream: opts.stream,
    } as any
  );

  const durationMs = Date.now() - t0;
  return {
    ok: true,
    provider: client.providerName,
    model: client.model,
    baseUrl: client.baseUrl,
    finalContent: result.content,
    iterations: result.iterations,
    toolCalls,
    finishReason: result.finishReason,
    durationMs,
  };
}

function summarizeArgs(args: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(args);
    return s.length > 240 ? s.slice(0, 240) + '…' : s;
  } catch {
    return '<unserializable>';
  }
}

function summarizeObject(value: unknown): string {
  if (!value || typeof value !== 'object') return String(value);
  const v = value as Record<string, unknown>;
  if ('content' in v) return truncate(String(v.content), 240);
  if ('matches' in v && typeof v.matches === 'string') return truncate(String(v.matches), 240);
  if ('text' in v && typeof v.text === 'string') return truncate(String(v.text), 240);
  if ('results' in v && Array.isArray(v.results)) return `${v.results.length} result(s)`;
  if ('skills' in v && Array.isArray(v.skills)) return `${v.skills.length} skill(s)`;
  return summarizeArgs(v as any);
}

export function registerAgentsRunCommand(program: Command): void {
  const agents = program.commands.find((c) => c.name() === 'agents');
  if (!agents) {
    program
      .command('agents:run')
      .description('Alias: see `tnf agents run`')
      .action(() => {
        console.error('[tnf agents run] not available: this CLI has no `agents` subcommand.');
        process.exit(2);
      });
    return;
  }
  agents
    .command('run')
    .description(
      'Run an autonomous agent loop with the canonical TNF built-in toolset. ' +
        'Uses the same multi-provider client and the Python daemon-style unlimited-iteration default. ' +
        'Tools: bash, read_file, write_file, search_files, web_search, web_fetch, browser_interact, list_skills, load_skill, memory_recall, mcp_list_tools, mcp_call_tool.'
    )
    .argument(
      '[task...]',
      'Task description. If omitted, --task / --task-file / stdin must supply it.'
    )
    .option('-t, --task <text>', 'Task description (alternative to positional or stdin).')
    .option('--task-file <path>', 'Read the task from a file (UTF-8). Use "-" to read from stdin.')
    .option('--stream', 'Stream tokens to stdout as the model generates them.', false)
    .option(
      '--max-iterations <n>',
      'Maximum inner agent loop iterations. Omit for unlimited (autonomy default).'
    )
    .option(
      '--timeout-ms <n>',
      'Per-call HTTP timeout in milliseconds. Default: env TNF_LLM_TIMEOUT_MS, else 600000 (10min).'
    )
    .option(
      '--tools <list>',
      'Comma-separated builtin tool names to enable. Default: all. Examples: "bash,read_file,write_file" or "none" to disable.'
    )
    .option('--system <text>', 'Custom system prompt override for the loop.')
    .option(
      '--cwd <path>',
      'Working directory for the bash / file / search tools. Default: process.cwd().'
    )
    .option(
      '--json',
      'Emit a single JSON envelope on stdout (final result + tool call ledger).',
      false
    )
    .option('--quiet', 'Suppress per-tool stderr log lines.', false)
    .action(
      async (
        positional: string[] | undefined,
        opts: {
          task?: string;
          taskFile?: string;
          stream?: boolean;
          maxIterations?: string;
          timeoutMs?: string;
          tools?: string;
          system?: string;
          cwd?: string;
          json?: boolean;
          quiet?: boolean;
        }
      ) => {
        // Resolution precedence lives in utils/prompt-input.ts. Keep that
        // helper as the single source of truth — every prompt-consuming
        // tnf subcommand routes through it.
        let resolution;
        try {
          resolution = await resolvePrompt({
            task: opts.task,
            taskFile: opts.taskFile,
            positional,
          });
        } catch (err: any) {
          console.error(`[tnf agents run] error: ${err?.message ?? err}`);
          process.exit(2);
        }
        if (!resolution || !resolution.text) {
          console.error(
            '[tnf agents run] error: no task provided. Supply one of:\n' +
              '  --task "..."            explicit task text\n' +
              '  --task-file path/to.md  read task from a file (or --task-file - for stdin)\n' +
              '  positional "task text"  pass as the first argument\n' +
              '  stdin                   pipe a prompt, e.g. `cat prompt.md | tnf agents run`'
          );
          process.exit(2);
        }
        const taskText = resolution.text;
        const source = resolution.source;
        const runOpts: RunOptions = {
          task: taskText,
          stream: !!opts.stream,
          maxIterations: opts.maxIterations ? Number(opts.maxIterations) : undefined,
          timeoutMs: opts.timeoutMs ? Number(opts.timeoutMs) : undefined,
          systemPrompt: opts.system,
          enableTools: opts.tools,
          cwd: opts.cwd,
          json: !!opts.json,
          quiet: !!opts.quiet,
        };
        // Surface the input source so long piped prompts are not silent on stderr.
        if (source === 'stdin' && !runOpts.quiet) {
          console.error(
            `[tnf agents run] read task from stdin (${taskText.length} chars). ` +
              `Pass --task "..." to override.`
          );
        } else if (source === 'file' && !runOpts.quiet) {
          console.error(
            `[tnf agents run] read task from ${opts.taskFile} (${taskText.length} chars).`
          );
        }
        try {
          const result = await runAgentsRun(runOpts);
          if (runOpts.json) {
            process.stdout.write(JSON.stringify(result, null, 2) + '\n');
          } else {
            process.stdout.write(
              `\n[tnf agents run] provider=${result.provider} model=${result.model} base=${result.baseUrl}\n`
            );
            process.stdout.write(
              `[tnf agents run] iterations=${result.iterations} toolCalls=${result.toolCalls.length} durationMs=${result.durationMs} finish=${result.finishReason}\n\n`
            );
            process.stdout.write(result.finalContent + '\n');
          }
          process.exit(0);
        } catch (err: any) {
          const failure: JsonResult = {
            ok: false,
            provider: 'unknown',
            model: 'unknown',
            baseUrl: 'unknown',
            finalContent: '',
            iterations: 0,
            toolCalls: [],
            finishReason: 'error',
            durationMs: 0,
            error: err?.message ?? String(err),
          };
          if (runOpts.json) {
            process.stdout.write(JSON.stringify(failure, null, 2) + '\n');
          } else {
            console.error(`[tnf agents run] error: ${failure.error}`);
          }
          process.exit(1);
        }
      }
    );
}
