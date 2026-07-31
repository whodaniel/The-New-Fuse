/**
 * Agent-browser backend for the TNF desktop browser console.
 *
 * Primary path for interactive browser control. Replaces the legacy
 * packages/tnf-browser extension + ws://127.0.0.1:7331 stack unless
 * TNF_BROWSER_BACKEND=legacy is set by the operator.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type AgentBrowserBackendStatus = {
  listening: boolean;
  hasToken: boolean;
  connected: boolean;
  runtimeConnected: boolean;
  lastError: string | null;
  port: number;
  tokenPath: string;
  backend: 'agent-browser';
};

function repoRoot(): string {
  return path.resolve(__dirname, '../../..');
}

function resolveAgentBrowserBin(): string {
  if (process.env.AGENT_BROWSER_BIN) return process.env.AGENT_BROWSER_BIN;
  const candidates = [
    path.join(repoRoot(), 'node_modules', '.bin', 'agent-browser'),
    path.join(repoRoot(), 'packages', 'tnf-cli', 'node_modules', '.bin', 'agent-browser'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'agent-browser';
}

function runAgentBrowser(
  args: string[],
  options: { timeoutMs?: number } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  const bin = resolveAgentBrowserBin();
  const timeoutMs = options.timeoutMs ?? 32000;
  return new Promise((resolve, reject) => {
    const child: ChildProcessWithoutNullStreams = spawn(bin, args, {
      cwd: repoRoot(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`agent-browser timed out: ${args.join(' ')}`));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (error.code === 'ENOENT') {
        reject(
          new Error(
            'agent-browser not found. Install with `pnpm --filter @the-new-fuse/tnf-cli add agent-browser@0.26.0` or set AGENT_BROWSER_BIN.'
          )
        );
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function parseJsonSafe(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some commands print banners before JSON — try last {...} block.
    const start = trimmed.lastIndexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return { raw: trimmed };
      }
    }
    return { raw: trimmed };
  }
}

export async function agentBrowserAvailable(): Promise<boolean> {
  try {
    const result = await runAgentBrowser(['--version'], { timeoutMs: 8000 });
    return result.code === 0;
  } catch {
    return false;
  }
}

export async function startAgentBrowser(url = 'about:blank'): Promise<{
  ok: boolean;
  message: string;
  command: string;
  already_running?: boolean;
}> {
  const profile = process.env.TNF_BROWSER_PROFILE || process.env.AGENT_BROWSER_PROFILE;
  const state = process.env.TNF_BROWSER_STATE || process.env.AGENT_BROWSER_STATE;
  const args = ['open', url, '--headed', '--json'];
  if (profile) args.unshift('--profile', profile);
  if (state) args.unshift('--state', state);
  const command = `agent-browser ${args.join(' ')}`;
  try {
    const result = await runAgentBrowser(args, { timeoutMs: 45000 });
    if (result.code !== 0) {
      return {
        ok: false,
        message: result.stderr || result.stdout || `agent-browser exited ${result.code}`,
        command,
      };
    }
    return {
      ok: true,
      message: 'agent-browser session started (headed). Use Discover / Navigate in the console.',
      command,
      already_running: false,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
      command,
    };
  }
}

export async function statusAgentBrowser(
  lastError: string | null
): Promise<AgentBrowserBackendStatus> {
  const available = await agentBrowserAvailable();
  return {
    listening: available,
    hasToken: true,
    connected: available,
    runtimeConnected: available,
    lastError,
    port: 0,
    tokenPath: path.join(os.homedir(), '.tnf', 'agent-browser-session'),
    backend: 'agent-browser',
  };
}

function refOrSelector(value: string): string {
  if (value.startsWith('@') || value.startsWith('el_')) {
    return value.startsWith('el_') ? `@${value}` : value;
  }
  return value;
}

export async function runMappedCommand(
  action: string,
  params: Record<string, unknown> = {}
): Promise<unknown> {
  switch (action) {
    case 'tabs.navigate': {
      const url = String(params.url || '');
      if (!url) throw new Error('url required');
      const result = await runAgentBrowser(['open', url, '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'navigate failed');
      return parseJsonSafe(result.stdout) || { ok: true, url };
    }
    case 'tabs.reload': {
      const result = await runAgentBrowser(['reload', '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'reload failed');
      return parseJsonSafe(result.stdout) || { ok: true };
    }
    case 'tabs.goBack': {
      const result = await runAgentBrowser(['back', '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'back failed');
      return parseJsonSafe(result.stdout) || { ok: true };
    }
    case 'tabs.goForward': {
      const result = await runAgentBrowser(['forward', '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'forward failed');
      return parseJsonSafe(result.stdout) || { ok: true };
    }
    case 'tabs.list': {
      // agent-browser is single-page oriented; synthesize one active tab from URL/title when possible.
      const urlResult = await runAgentBrowser(['get', 'url', '--json']);
      const titleResult = await runAgentBrowser(['get', 'title', '--json']);
      const urlParsed = parseJsonSafe(urlResult.stdout) as Record<string, unknown> | string | null;
      const titleParsed = parseJsonSafe(titleResult.stdout) as
        | Record<string, unknown>
        | string
        | null;
      const url =
        typeof urlParsed === 'string'
          ? urlParsed
          : String(
              (urlParsed as any)?.value || (urlParsed as any)?.url || (urlParsed as any)?.raw || ''
            );
      const title =
        typeof titleParsed === 'string'
          ? titleParsed
          : String(
              (titleParsed as any)?.value ||
                (titleParsed as any)?.title ||
                (titleParsed as any)?.raw ||
                ''
            );
      return [
        {
          id: 1,
          url: url || 'about:blank',
          title: title || 'agent-browser',
          active: true,
          index: 0,
        },
      ];
    }
    case 'tabs.create': {
      const url = params.url ? String(params.url) : 'about:blank';
      await runMappedCommand('tabs.navigate', { url });
      return { id: 1, url, title: '', active: true, index: 0 };
    }
    case 'tabs.close':
    case 'tabs.activate':
      return { ok: true };
    case 'tabs.screenshot': {
      const out = path.join(os.tmpdir(), `tnf-agent-browser-${Date.now()}.png`);
      const result = await runAgentBrowser(['screenshot', out, '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'screenshot failed');
      const buf = fs.readFileSync(out);
      const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      try {
        fs.unlinkSync(out);
      } catch {
        /* ignore */
      }
      return { dataUrl };
    }
    case 'dom.discoverElements': {
      const result = await runAgentBrowser(['snapshot', '-i', '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'snapshot failed');
      const parsed = parseJsonSafe(result.stdout);
      if (Array.isArray(parsed)) return { elements: parsed };
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).elements)) {
        return parsed;
      }
      // Normalize common agent-browser snapshot shapes into the panel's elements list.
      const raw = typeof parsed === 'object' && parsed ? (parsed as any) : { raw: result.stdout };
      const refs = Array.isArray(raw.refs) ? raw.refs : Array.isArray(raw.nodes) ? raw.nodes : [];
      const elements = refs.map((node: any, index: number) => ({
        handleId: node.ref || node.id || `@e${index + 1}`,
        tag: node.role || node.tag || 'element',
        text: node.name || node.text || '',
        role: node.role,
      }));
      return { elements, raw };
    }
    case 'dom.getHTML': {
      const htmlResult = await runAgentBrowser(['get', 'html', '--json']);
      const titleResult = await runAgentBrowser(['get', 'title', '--json']);
      const urlResult = await runAgentBrowser(['get', 'url', '--json']);
      const htmlParsed = parseJsonSafe(htmlResult.stdout) as any;
      const titleParsed = parseJsonSafe(titleResult.stdout) as any;
      const urlParsed = parseJsonSafe(urlResult.stdout) as any;
      return {
        html: String(
          htmlParsed?.value || htmlParsed?.html || htmlParsed?.raw || htmlResult.stdout || ''
        ),
        title: String(titleParsed?.value || titleParsed?.title || titleParsed?.raw || ''),
        url: String(urlParsed?.value || urlParsed?.url || urlParsed?.raw || ''),
      };
    }
    case 'dom.click': {
      const target = String(params.handleId || params.selector || '');
      if (!target) throw new Error('selector or handleId required');
      const result = await runAgentBrowser(['click', refOrSelector(target), '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'click failed');
      return parseJsonSafe(result.stdout) || { ok: true };
    }
    case 'dom.type': {
      const text = String(params.text || '');
      const target =
        params.handleId || params.selector ? String(params.handleId || params.selector) : '';
      if (target) {
        const result = await runAgentBrowser(['fill', refOrSelector(target), text, '--json']);
        if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'fill failed');
        return parseJsonSafe(result.stdout) || { ok: true };
      }
      const result = await runAgentBrowser(['type', text, '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'type failed');
      return parseJsonSafe(result.stdout) || { ok: true };
    }
    case 'dom.keyPress': {
      const key = String(params.key || '');
      if (!key) throw new Error('key required');
      const result = await runAgentBrowser(['press', key, '--json']);
      if (result.code !== 0) throw new Error(result.stderr || result.stdout || 'press failed');
      return parseJsonSafe(result.stdout) || { ok: true };
    }
    default:
      throw new Error(
        `Unsupported action "${action}" on agent-browser backend. Use TNF_BROWSER_BACKEND=legacy only for the old :7331 extension runtime.`
      );
  }
}

export function preferredBackend(): 'agent-browser' | 'legacy' {
  const raw = String(process.env.TNF_BROWSER_BACKEND || 'agent-browser').toLowerCase();
  return raw === 'legacy' || raw === 'tnf-browser' || raw === 'webpilot'
    ? 'legacy'
    : 'agent-browser';
}
