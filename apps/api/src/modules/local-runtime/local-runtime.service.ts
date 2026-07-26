import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Terminal heartbeat pulse fires every minute; 3x with slack = stale.
const MIRROR_STALE_MS = 3 * 60 * 1000;

export type LocalGoalTask = {
  id: string;
  description: string;
  completed: boolean;
};

export type LocalGoal = {
  id: string;
  slug: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  progress: number;
  tags: string[];
  tasks: LocalGoalTask[];
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CronJob = {
  id: string;
  schedule: string;
  command: string;
  label: string;
  scheduleHuman: string;
  nextRunAt: string | null;
  enabled: boolean;
  raw: string;
};

type Unavailable = { available: false; reason: string; generatedAt: string };

@Injectable()
export class LocalRuntimeService {
  private readonly logger = new Logger(LocalRuntimeService.name);

  private goalsDir(): string {
    return process.env.TNF_GOALS_DIR
      ? path.resolve(process.env.TNF_GOALS_DIR)
      : path.join(os.homedir(), '.tnf', 'goals');
  }

  private heartbeatStatePath(): string {
    return process.env.TNF_TERMINAL_HEARTBEAT_STATE_PATH
      ? path.resolve(process.env.TNF_TERMINAL_HEARTBEAT_STATE_PATH)
      : path.join(
          os.homedir(),
          '.tnf',
          'terminal-heartbeat',
          'state',
          'terminal-heartbeat-latest.json'
        );
  }

  private subdirectorStatePath(): string {
    return process.env.TNF_LOCAL_SUBDIRECTOR_STATE_PATH
      ? path.resolve(process.env.TNF_LOCAL_SUBDIRECTOR_STATE_PATH)
      : path.join(
          os.homedir(),
          '.tnf',
          'local-subdirector',
          'state',
          'local-subdirector-heartbeat.json'
        );
  }

  private unavailable(reason: string): Unavailable {
    return { available: false, reason, generatedAt: new Date().toISOString() };
  }

  private async readJson(filePath: string): Promise<unknown | null> {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch {
      return null;
    }
  }

  // -- Goals -----------------------------------------------------------------

  async getGoals() {
    const goalsPath = path.join(this.goalsDir(), 'goals.json');
    const raw = await this.readJson(goalsPath);
    if (!Array.isArray(raw)) {
      return this.unavailable(`local goals file not found or unreadable: ${goalsPath}`);
    }

    const config = (await this.readJson(path.join(this.goalsDir(), 'config.json'))) as {
      activeGoalId?: string;
    } | null;

    const goals: LocalGoal[] = raw
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
      .map((entry) => ({
        id: String(entry.id ?? ''),
        slug: String(entry.slug ?? ''),
        title: String(entry.title ?? ''),
        description: String(entry.description ?? ''),
        priority: String(entry.priority ?? 'medium'),
        status: String(entry.status ?? 'active'),
        category: String(entry.category ?? ''),
        progress: Number(entry.progress ?? 0),
        tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
        tasks: Array.isArray(entry.tasks)
          ? (entry.tasks as Record<string, unknown>[]).map((task) => ({
              id: String(task.id ?? ''),
              description: String(task.description ?? ''),
              completed: Boolean(task.completed),
            }))
          : [],
        dueDate: entry.dueDate ? String(entry.dueDate) : null,
        createdAt: entry.createdAt ? String(entry.createdAt) : null,
        updatedAt: entry.updatedAt ? String(entry.updatedAt) : null,
      }));

    const statusRank: Record<string, number> = { active: 0, paused: 1, completed: 2, abandoned: 3 };
    goals.sort(
      (a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) || b.progress - a.progress
    );

    return {
      available: true as const,
      source: goalsPath,
      activeGoalId: config?.activeGoalId ?? null,
      goals,
      generatedAt: new Date().toISOString(),
    };
  }

  // -- Cron ------------------------------------------------------------------

  async getCron(now: Date = new Date()) {
    let stdout: string;
    try {
      ({ stdout } = await execFileAsync('crontab', ['-l'], { timeout: 5000 }));
    } catch (error) {
      return this.unavailable(
        `crontab unavailable: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return {
      available: true as const,
      source: 'crontab',
      jobs: this.parseCrontab(stdout, now),
      generatedAt: new Date().toISOString(),
    };
  }

  parseCrontab(text: string, now: Date): CronJob[] {
    const jobs: CronJob[] = [];
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      // Environment assignments like SHELL=/bin/zsh
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(line)) continue;

      const match = line.match(/^((?:\S+\s+){4}\S+)\s+(.+)$/);
      if (!match) continue;
      const schedule = match[1].replace(/\s+/g, ' ');
      if (!this.isValidCronSchedule(schedule)) continue;
      const command = match[2];

      jobs.push({
        id: this.hashLine(line),
        schedule,
        command,
        label: this.deriveLabel(command),
        scheduleHuman: this.humanizeSchedule(schedule),
        nextRunAt: this.nextRunAt(schedule, now),
        enabled: true,
        raw: line,
      });
    }
    return jobs;
  }

  private hashLine(line: string): string {
    let hash = 0;
    for (let i = 0; i < line.length; i++) {
      hash = (hash * 31 + line.charCodeAt(i)) | 0;
    }
    return `cron-${(hash >>> 0).toString(16)}`;
  }

  private deriveLabel(command: string): string {
    // Trailing provenance comment (e.g. "# tnf-chronological:tnf-master-clock-super-cycle")
    const tagMatch = command.match(/#\s*[\w-]+:([\w./-]+)\s*$/);
    if (tagMatch) return tagMatch[1];

    const processIdMatch = command.match(/--process-id\s+"?([\w-]+)"?/);
    if (processIdMatch) return processIdMatch[1];

    const scriptMatch = command.match(/([\w-]+)\.(?:cjs|mjs|js|ts|sh|py)\b/);
    if (scriptMatch) return scriptMatch[1];

    return command.split(/\s+/)[0] ?? command;
  }

  private isValidCronSchedule(schedule: string): boolean {
    const fields = schedule.split(' ');
    if (fields.length !== 5) return false;
    return fields.every((field) => /^[\d*,/-]+$/.test(field));
  }

  humanizeSchedule(schedule: string): string {
    const [minute, hour, dom, month, dow] = schedule.split(' ');
    const pad = (value: string) => value.padStart(2, '0');

    if (dom === '*' && month === '*' && dow === '*') {
      const everyMinute = minute.match(/^\*\/(\d+)$/);
      if (everyMinute && hour === '*') return `every ${everyMinute[1]} minutes`;
      if (minute === '*' && hour === '*') return 'every minute';
      const everyHour = hour.match(/^\*\/(\d+)$/);
      if (everyHour && /^\d+$/.test(minute)) {
        return `every ${everyHour[1]} hours at :${pad(minute)}`;
      }
      if (/^\d+$/.test(minute) && hour === '*') return `hourly at :${pad(minute)}`;
      if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
        return `daily at ${pad(hour)}:${pad(minute)}`;
      }
    }
    if (
      dom === '*' &&
      month === '*' &&
      /^\d+$/.test(dow) &&
      /^\d+$/.test(minute) &&
      /^\d+$/.test(hour)
    ) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `every ${days[Number(dow) % 7]} at ${pad(hour)}:${pad(minute)}`;
    }
    return schedule;
  }

  nextRunAt(schedule: string, from: Date): string | null {
    const fields = schedule.split(' ');
    if (fields.length !== 5) return null;
    const [minuteSet, hourSet, domSet, monthSet, dowSet] = [
      this.expandField(fields[0], 0, 59),
      this.expandField(fields[1], 0, 23),
      this.expandField(fields[2], 1, 31),
      this.expandField(fields[3], 1, 12),
      this.expandField(fields[4], 0, 7),
    ];
    if (!minuteSet || !hourSet || !domSet || !monthSet || !dowSet) return null;
    // In cron, dow 7 == dow 0 == Sunday.
    if (dowSet.has(7)) dowSet.add(0);

    const domRestricted = fields[2] !== '*';
    const dowRestricted = fields[4] !== '*';

    const candidate = new Date(from.getTime());
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1);

    // Standard cron: when both dom and dow are restricted, either may match.
    const limit = from.getTime() + 366 * 24 * 60 * 60 * 1000;
    while (candidate.getTime() <= limit) {
      const monthOk = monthSet.has(candidate.getMonth() + 1);
      const domOk = domSet.has(candidate.getDate());
      const dowOk = dowSet.has(candidate.getDay());
      const dayOk = domRestricted && dowRestricted ? domOk || dowOk : domRestricted ? domOk : dowOk;
      if (
        monthOk &&
        dayOk &&
        hourSet.has(candidate.getHours()) &&
        minuteSet.has(candidate.getMinutes())
      ) {
        return candidate.toISOString();
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
    }
    return null;
  }

  private expandField(field: string, min: number, max: number): Set<number> | null {
    const values = new Set<number>();
    for (const part of field.split(',')) {
      const stepMatch = part.match(/^(.+)\/(\d+)$/);
      const step = stepMatch ? Number(stepMatch[2]) : 1;
      const base = stepMatch ? stepMatch[1] : part;
      if (step <= 0) return null;

      let start = min;
      let end = max;
      if (base !== '*') {
        const rangeMatch = base.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
          start = Number(rangeMatch[1]);
          end = Number(rangeMatch[2]);
        } else if (/^\d+$/.test(base)) {
          start = Number(base);
          end = stepMatch ? max : Number(base);
        } else {
          return null;
        }
      }
      if (start < min || end > max || start > end) return null;
      for (let value = start; value <= end; value += step) values.add(value);
    }
    return values.size > 0 ? values : null;
  }

  // -- Terminal mirror ---------------------------------------------------------

  async getTerminalMirror(options: { includeContents?: boolean } = {}) {
    const statePath = this.heartbeatStatePath();
    const state = (await this.readJson(statePath)) as {
      generatedAt?: string;
      displays?: unknown[];
      observed?: Record<string, unknown>[];
    } | null;
    if (!state || !Array.isArray(state.observed)) {
      return this.unavailable(
        `terminal heartbeat state not found: ${statePath}. Is the terminal-heartbeat-pulse cron running?`
      );
    }

    const subdirector = (await this.readJson(this.subdirectorStatePath())) as {
      sessions?: Record<string, unknown>[];
    } | null;
    const sessionsByAgentId = new Map<string, Record<string, unknown>>();
    for (const session of subdirector?.sessions ?? []) {
      if (session?.agentId) sessionsByAgentId.set(String(session.agentId), session);
    }

    const generatedAt = state.generatedAt ?? null;
    const ageMs = generatedAt ? Date.now() - Date.parse(generatedAt) : Number.POSITIVE_INFINITY;

    const windows = state.observed.map((entry) => {
      const managed = entry.agentId ? sessionsByAgentId.get(String(entry.agentId)) : undefined;
      const window: Record<string, unknown> = {
        windowId: entry.windowId ?? null,
        agentId: entry.agentId ?? null,
        tty: entry.tty ?? null,
        title: entry.title ?? null,
        busy: Boolean(entry.busy),
        agentLike: Boolean(entry.agentLike),
        cwd: entry.cwd ?? null,
        foregroundCommand: entry.foregroundCommand ?? null,
        bounds: entry.bounds ?? null,
        display: entry.display ?? null,
        zOrder: entry.zOrder ?? null,
        matched: entry.matched ?? null,
        sessionStatus: managed?.status ?? null,
        lastActivityAt: managed?.lastActivityAt ?? managed?.updatedAt ?? null,
      };
      if (options.includeContents) {
        window.contentsTail = entry.contentsTail ?? null;
      }
      return window;
    });

    return {
      available: true as const,
      source: statePath,
      generatedAt,
      stale: ageMs > MIRROR_STALE_MS,
      ageSeconds: Number.isFinite(ageMs) ? Math.round(ageMs / 1000) : null,
      displays: Array.isArray(state.displays) ? state.displays : [],
      windows,
    };
  }

  // -- Summary -----------------------------------------------------------------

  async getSummary() {
    const [goals, cron, mirror] = await Promise.all([
      this.getGoals(),
      this.getCron(),
      this.getTerminalMirror(),
    ]);

    const mirrorSummary = mirror.available
      ? {
          available: true as const,
          windowCount: mirror.windows.length,
          busyCount: mirror.windows.filter((window) => window.busy).length,
          agentCount: mirror.windows.filter((window) => window.agentLike).length,
          stale: mirror.stale,
          ageSeconds: mirror.ageSeconds,
        }
      : { available: false as const, reason: mirror.reason };

    return {
      goals,
      cron,
      terminalMirror: mirrorSummary,
      generatedAt: new Date().toISOString(),
    };
  }
}
