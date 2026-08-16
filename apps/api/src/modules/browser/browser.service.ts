import { Injectable, Logger } from '@nestjs/common';
import { execFile, spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const OPERATIONS = [
  'open',
  'snapshot',
  'screenshot',
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
] as const;

export type BrowserOperation = (typeof OPERATIONS)[number];

export interface BrowserInteractDto {
  operation: BrowserOperation;
  target?: string;
  value?: string;
  profile?: string;
  headed?: boolean;
}

export type BrowserSession = {
  controlling: boolean;
  available: boolean;
  engine: string;
  url: string | null;
  title: string | null;
  lastTask: string | null;
  lastError: string | null;
  screenshotDataUrl: string | null;
  snapshot: unknown;
  updatedAt: string | null;
};

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);
  private readonly repoRoot: string;
  private session: BrowserSession = {
    controlling: false,
    available: false,
    engine: 'agent-browser',
    url: null,
    title: null,
    lastTask: null,
    lastError: null,
    screenshotDataUrl: null,
    snapshot: null,
    updatedAt: null,
  };

  constructor() {
    this.repoRoot = path.resolve(process.cwd(), '../..');
  }

  private resolveBin(): string {
    if (process.env.AGENT_BROWSER_BIN) return process.env.AGENT_BROWSER_BIN;
    const candidates = [
      path.join(this.repoRoot, 'node_modules', '.bin', 'agent-browser'),
      path.join(this.repoRoot, 'packages', 'tnf-cli', 'node_modules', '.bin', 'agent-browser'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return 'agent-browser';
  }

  private buildArgs(dto: BrowserInteractDto): string[] {
    const op = dto.operation;
    const args: string[] = [];
    if (dto.profile) args.push('--profile', dto.profile);
    const opMap: Record<BrowserOperation, string[]> = {
      open: ['open'],
      snapshot: ['snapshot', '-i'],
      screenshot: ['screenshot'],
      click: ['click'],
      fill: ['fill'],
      type: ['type'],
      press: ['press'],
      wait: ['wait'],
      get: ['get'],
      back: ['back'],
      forward: ['forward'],
      reload: ['reload'],
      close: ['close'],
    };
    args.push(...opMap[op]);
    if (dto.target) args.push(dto.target);
    if (dto.value) args.push(dto.value);
    if (dto.headed && op === 'open') args.push('--headed');
    args.push('--json');
    return args;
  }

  async available(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync(this.resolveBin(), ['--version'], {
        timeout: 8000,
      });
      const ok = Boolean(stdout?.trim());
      this.session.available = ok;
      return ok;
    } catch {
      this.session.available = false;
      return false;
    }
  }

  getSession(includeScreenshot = false): BrowserSession {
    return {
      ...this.session,
      screenshotDataUrl: includeScreenshot ? this.session.screenshotDataUrl : null,
    };
  }

  async interact(dto: BrowserInteractDto) {
    if (dto.operation === 'screenshot') {
      return this.captureScreenshot();
    }
    const bin = this.resolveBin();
    const args = this.buildArgs(dto);
    const result = await this.spawn(bin, args);
    this.session.controlling = dto.operation !== 'close';
    this.session.updatedAt = new Date().toISOString();
    if (dto.operation === 'open' && dto.target) {
      this.session.url = dto.target;
    }
    if (dto.operation === 'snapshot') {
      this.session.snapshot = result.parsed;
    }
    if (dto.operation === 'close') {
      this.session.controlling = false;
    }
    if (result.code !== 0) {
      this.session.lastError = result.stderr || result.stdout || `exit ${result.code}`;
    } else {
      this.session.lastError = null;
    }
    return result;
  }

  async ensureStarted(headed = true) {
    const result = await this.interact({ operation: 'open', target: 'about:blank', headed });
    this.session.controlling = result.code === 0;
    return result;
  }

  /**
   * Chat-native browser task: boot if needed, open URL when detected, snapshot page.
   */
  async runNaturalLanguageTask(message: string) {
    this.session.lastTask = message;
    const url = this.extractUrl(message);

    const steps: Array<{ step: string; ok: boolean; detail?: unknown }> = [];

    const boot = await this.ensureStarted(true);
    steps.push({ step: 'start', ok: boot.code === 0, detail: boot.parsed });

    if (url) {
      const nav = await this.interact({ operation: 'open', target: url, headed: true });
      steps.push({ step: 'navigate', ok: nav.code === 0, detail: { url, ...nav.parsed } });
      this.session.url = url;
    }

    const snap = await this.interact({ operation: 'snapshot' });
    steps.push({ step: 'snapshot', ok: snap.code === 0, detail: snap.parsed });
    this.session.snapshot = snap.parsed;

    let screenshotDataUrl: string | null = null;
    try {
      const shot = await this.captureScreenshot();
      screenshotDataUrl = shot.dataUrl;
      steps.push({ step: 'screenshot', ok: shot.code === 0 });
    } catch (err) {
      this.logger.warn(`Screenshot skipped: ${err instanceof Error ? err.message : err}`);
      steps.push({ step: 'screenshot', ok: false });
    }

    const title = this.pickTitle(snap.parsed);
    if (title) this.session.title = title;

    return {
      ok: steps.every((s) => s.ok),
      url: url ?? this.session.url,
      title: this.session.title,
      steps,
      snapshot: snap.parsed,
      screenshotDataUrl,
      session: this.getSession(true),
      hint: 'Controlled Chromium is headed on the operator machine. Take over from this page or the desktop Computer Use console.',
    };
  }

  private extractUrl(message: string): string | undefined {
    const absolute = message.match(/https?:\/\/[^\s]+/i);
    if (absolute) return absolute[0].replace(/[),.;]+$/, '');
    const spoken = message.match(/\b(?:open|go to|visit|navigate to)\s+([^\s]+)/i);
    if (!spoken?.[1]) return undefined;
    const raw = spoken[1].replace(/[),.;]+$/, '');
    if (raw.startsWith('http')) return raw;
    if (raw.includes('.')) return `https://${raw}`;
    return undefined;
  }

  private pickTitle(parsed: unknown): string | null {
    if (!parsed || typeof parsed !== 'object') return null;
    const rec = parsed as Record<string, unknown>;
    const title = rec.title ?? rec.name;
    return typeof title === 'string' ? title : null;
  }

  private async captureScreenshot(): Promise<{
    code: number;
    stdout: string;
    stderr: string;
    parsed: unknown;
    dataUrl: string | null;
  }> {
    const out = path.join(os.tmpdir(), `tnf-computer-use-${Date.now()}.png`);
    const bin = this.resolveBin();
    const result = await this.spawn(bin, ['screenshot', out, '--json']);
    let dataUrl: string | null = null;
    try {
      if (fs.existsSync(out)) {
        const buf = fs.readFileSync(out);
        dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
        fs.unlinkSync(out);
      }
    } catch (err) {
      this.logger.warn(
        `Could not read screenshot file: ${err instanceof Error ? err.message : err}`
      );
    }
    this.session.screenshotDataUrl = dataUrl;
    this.session.controlling = true;
    this.session.updatedAt = new Date().toISOString();
    return { ...result, dataUrl };
  }

  private spawn(
    bin: string,
    args: string[]
  ): Promise<{ code: number; stdout: string; stderr: string; parsed: unknown }> {
    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, {
        cwd: this.repoRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`agent-browser timed out: ${args.join(' ')}`));
      }, 60_000);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          code: code ?? 1,
          stdout,
          stderr,
          parsed: this.parseJson(stdout),
        });
      });
    });
  }

  private parseJson(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      const start = trimmed.lastIndexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(trimmed.slice(start, end + 1));
        } catch {
          return { raw: trimmed.slice(0, 4000) };
        }
      }
      return { raw: trimmed.slice(0, 4000) };
    }
  }
}
