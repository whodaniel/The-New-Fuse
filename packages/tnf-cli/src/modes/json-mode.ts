/**
 * JSON output mode — mirrors pi's --mode json behavior.
 *
 * Streams structured JSONL events over stdout so other tools (CI, IDE
 * plugins, scripted workflows) can drive the tnf CLI as an orchestrator
 * without dealing with ANSI color, splash, or the REPL prompt.
 *
 * Each emitted line is a single JSON object terminated by "\n". The
 * schema mirrors pi's documented json-mode events where the names map
 * cleanly. Where pi uses a different name we expose the closest analog
 * so downstream consumers can adapt with minimal effort:
 *
 *   pi event            tnf event
 *   ---------------------  --------------------------------
 *   message_start       message_start
 *   message_delta       message_delta        (per-token)
 *   message_end         message_end
 *   tool_call_start     tool_call_start
 *   tool_call_delta     tool_call_delta
 *   tool_call_end       tool_call_end
 *   result              result_or_error
 *   error               error
 *   session_start       session_start
 *   ...                 turn_metadata
 *   ...                 provider_info
 *
 * Drive with `tnf --mode json` or `tnf --mode json --provider <p> --model <m>`.
 * The handler returns when the model emits a final assistant message or
 * the run aborts via SIGINT.
 */

import * as fs from 'fs';
import path from 'path';
import { LLMClient, type LLMMessage } from '../utils/llm-client.js';
import { stripFrontmatter, loadContextFiles } from '../context/context-files.js';

export interface JsonModeOptions {
  prompt: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  cwd?: string;
  systemPrompt?: string;
  /** Override the standard attach-and-go interactive flow. */
  interactive?: boolean;
  /** Attach a system prompt file path (resolved relative to cwd if relative). */
  systemPromptFile?: string;
  /** Append system prompt from a file rather than replace. */
  appendSystemPrompt?: boolean;
  /** When true, do not load AGENTS.md / CLAUDE.md. */
  noContextFiles?: boolean;
  /** Include tool calls in tool-loop mode (default false for json mode). */
  tools?: boolean;
  /** Temperature override. */
  temperature?: number;
  /** Max tokens override. */
  maxTokens?: number;
  /** Optional repo root for context file walking anchor. */
  repoRoot?: string;
}

export interface JsonLine {
  type: string;
  ts: string;
  data: Record<string, unknown>;
}

const encoder = (raw: string | undefined): string => JSON.stringify(raw ?? '');

function readPrompt(p: string): string {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return p;
  }
}

function resolveSystemPrompt(opts: JsonModeOptions, repoRoot: string | undefined): string {
  const explicitParts: string[] = [];

  if (opts.systemPromptFile) {
    const abs = path.isAbsolute(opts.systemPromptFile)
      ? opts.systemPromptFile
      : path.resolve(opts.cwd ?? process.cwd(), opts.systemPromptFile);
    try {
      const raw = fs.readFileSync(abs, 'utf8');
      const { body } = stripFrontmatter(raw);
      if (opts.appendSystemPrompt) explicitParts.push(body.trim());
      else explicitParts.push(body.trim());
    } catch {
      // Ignore missing file — operator gets a warning via emitted event.
    }
  } else if (opts.systemPrompt) {
    explicitParts.push(opts.systemPrompt.trim());
  }

  // Auto-loaded context files (AGENTS.md / CLAUDE.md).
  const anchors = {
    enabled: !opts.noContextFiles,
    startDir: opts.cwd ?? process.cwd(),
    walkAnchor: repoRoot ?? opts.cwd ?? process.cwd(),
  };
  const ctx = loadContextFiles(anchors);
  if (ctx.files.length) {
    explicitParts.push(ctx.combined);
  }

  if (explicitParts.length === 0) {
    return 'You are the TNF Orchestrator.';
  }
  if (opts.appendSystemPrompt || opts.systemPromptFile) {
    // When appending, prefix with the local default so the model has context.
    return ['You are the TNF Orchestrator.', ...explicitParts].join('\n\n');
  }
  return explicitParts.join('\n\n');
}

function emit(line: JsonLine): void {
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

/**
 * Drive a single non-interactive JSON-mode session.
 *
 * Behavior matches `pi --mode json`:
 *   - emits session_start with provider metadata
 *   - runs the LLM call (streaming when supported)
 *   - emits message_start, message_delta, message_end
 *   - emits result on success or error on failure
 *   - exits with code 0 on grant, non-zero on failure
 */
export async function runJsonMode(opts: JsonModeOptions): Promise<number> {
  const startedAt = new Date().toISOString();

  // Honor explicit env when present, fall back to opts.
  const systemPrompt = resolveSystemPrompt(opts, opts.repoRoot);

  const userContent = readPrompt(opts.prompt);
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  emit({
    type: 'session_start',
    ts: startedAt,
    data: {
      timestamp: startedAt,
      cwd: opts.cwd ?? process.cwd(),
      prompt_chars: userContent.length,
      context_files: opts.noContextFiles ? [] : loadContextFiles({
        startDir: opts.cwd ?? process.cwd(),
        walkAnchor: opts.repoRoot ?? opts.cwd ?? process.cwd(),
        enabled: !opts.noContextFiles,
      }).files.map((f) => ({ path: f.path, label: f.label, kind: f.kind, bytes: f.bytes })),
    },
  });

  let client: LLMClient;
  try {
    client = await LLMClient.create('orchestrator');
    if (opts.provider) client.providerName = opts.provider;
    if (opts.model) client.model = opts.model;
    if (opts.apiKey) (client as any).apiKey = opts.apiKey;
    if (opts.baseUrl) client.baseUrl = opts.baseUrl;
  } catch (err: any) {
    emit({
      type: 'error',
      ts: new Date().toISOString(),
      data: {
        phase: 'init',
        message: err?.message ?? String(err),
        code: 'provider_init_failure',
      },
    });
    return 1;
  }

  emit({
    type: 'provider_info',
    ts: new Date().toISOString(),
    data: {
      provider: client.providerName,
      model: client.model,
      base_url: client.baseUrl,
      supports_tool_choice: client.supportsToolChoice,
    },
  });

  emit({
    type: 'message_start',
    ts: new Date().toISOString(),
    data: {
      role: 'assistant',
      model: client.model,
    },
  });

  try {
    let total = '';
    for await (const chunk of client.chatStream(messages, {
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      builtinTools: opts.tools ? 'all' : 'none',
    })) {
      total += chunk;
      emit({
        type: 'message_delta',
        ts: new Date().toISOString(),
        data: { delta: chunk },
      });
    }
    emit({
      type: 'message_end',
      ts: new Date().toISOString(),
      data: { role: 'assistant', chars: total.length },
    });
    emit({
      type: 'result',
      ts: new Date().toISOString(),
      data: {
        text: total,
        success: true,
        duration_ms: Date.now() - new Date(startedAt).getTime(),
        finish_reason: 'completed',
      },
    });
    return 0;
  } catch (err: any) {
    emit({
      type: 'error',
      ts: new Date().toISOString(),
      data: {
        phase: 'chat',
        message: err?.message ?? String(err),
        code: 'chat_failure',
      },
    });
    return 1;
  }
}
