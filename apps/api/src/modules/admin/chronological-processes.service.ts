import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type ProcessStatus = 'scheduled' | 'paused' | 'healthy' | 'error' | 'running' | 'manual';

interface RegistryCategory {
  category: string;
  scope: 'system_framework' | 'tenant' | string;
  description?: string;
  requires_approval?: boolean;
}

interface RegistryJob {
  schedule_id: string;
  scope: 'system_framework' | 'tenant' | string;
  category: string;
  owner_agent_id?: string;
  owner_user_id?: string;
  locked?: boolean;
}

interface CronRegistryFile {
  spec?: string;
  generated_at?: string;
  categories?: RegistryCategory[];
  jobs?: RegistryJob[];
}

interface ProcessOverrideEntry {
  enabled?: boolean;
  cadence?: string;
  timezone?: string;
  notes?: string;
  updated_at?: string;
  updated_by?: string;
}

interface ProcessRuntimeEntry {
  status?: ProcessStatus;
  lastRunAt?: string;
  lastDurationMs?: number;
  lastExitCode?: number;
  lastError?: string | null;
  lastOutputPreview?: string | null;
}

export interface ProcessRunHistoryEntry {
  runId: string;
  processId: string;
  actorId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: ProcessStatus;
  exitCode: number;
  error: string | null;
  outputPreview: string | null;
}

interface ControlPlaneStateFile {
  spec: string;
  updated_at: string;
  overrides: Record<string, ProcessOverrideEntry>;
  runtime: Record<string, ProcessRuntimeEntry>;
  history: Record<string, ProcessRunHistoryEntry[]>;
}

interface ProcessCatalogEntry {
  title: string;
  cadence: string;
  timezone: string;
  description: string;
  runNow: {
    command: string;
    args: string[];
    timeoutMs: number;
  } | null;
  docs?: {
    protocol?: string;
    runbook?: string;
  };
}

interface ProcessActorContext {
  actorId: string;
  actorRoles: string[];
}

const DEFAULT_PROCESS_CATALOG: Record<string, ProcessCatalogEntry> = {
  'tnf-master-clock-super-cycle': {
    title: 'TNF Master Clock Super Cycle',
    cadence: '*/15 * * * *',
    timezone: 'UTC',
    description:
      'Canonical system-wide federation and orchestration gate verification cycle for the TNF control plane.',
    runNow: {
      command: 'node',
      args: ['scripts/protocols/synthetic-federation-gate-check.cjs', '--json'],
      timeoutMs: 45000,
    },
    docs: {
      protocol: 'docs/protocols/tnf-cron-governance-protocol-v0.1.md',
      runbook: 'docs/operations/TNF_FEDERATED_DIRECTOR_ORCHESTRATION_RUNBOOK_2026-03-18.md',
    },
  },
  'tnf-self-improvement-scorecard': {
    title: 'TNF Self Improvement Scorecard',
    cadence: '0 */6 * * *',
    timezone: 'UTC',
    description:
      'Protocol and schema conformance loop that keeps the canonical reliability and self-improvement envelope healthy.',
    runNow: {
      command: 'node',
      args: ['scripts/validate-protocol-schemas.cjs'],
      timeoutMs: 30000,
    },
    docs: {
      protocol: 'docs/operations/tnf-self-improvement-cycle.md',
      runbook: 'docs/protocols/reports/cron-governance-review-2026-03-18.md',
    },
  },
  'tnf-twip-macro-board-refresh': {
    title: 'TWIP Macro Board Refresh',
    cadence: '*/10 * * * *',
    timezone: 'UTC',
    description:
      'Procedural scan and refresh loop that updates terminal macro-board state and visualization artifacts.',
    runNow: {
      command: 'node',
      args: ['scripts/protocols/twip-macro-board.cjs', '--json'],
      timeoutMs: 60000,
    },
    docs: {
      protocol: 'docs/protocols/twip-terminal-macro-board.md',
      runbook: 'docs/protocols/reports/twip-terminal-context-capture-2026-03-19.md',
    },
  },
  'tnf-terminal-awareness-reminder': {
    title: 'Terminal Awareness Reminder',
    cadence: '*/30 * * * *',
    timezone: 'UTC',
    description:
      'Procedural frontload/terminal context reminder loop that validates handoff and shell-start context hygiene.',
    runNow: {
      command: 'bash',
      args: ['scripts/verify_frontload_state.sh', '--json'],
      timeoutMs: 20000,
    },
    docs: {
      protocol: 'docs/TNF_SESSION_ONBOARDING.md',
      runbook: 'docs/operations/super-admin-chronological-processes.md',
    },
  },
  'tenant-terminal-awareness-default': {
    title: 'Tenant Terminal Awareness Default',
    cadence: '0 * * * *',
    timezone: 'UTC',
    description:
      'Tenant-scoped default reminder loop for user and tenant-agent terminal context continuity.',
    runNow: null,
    docs: {
      protocol: 'docs/protocols/tnf-cron-governance-protocol-v0.1.md',
    },
  },
};

@Injectable()
export class ChronologicalProcessesService {
  private readonly logger = new Logger(ChronologicalProcessesService.name);
  private readonly repoRoot = this.resolveRepoRoot();
  private readonly registryPath = path.join(
    this.repoRoot,
    'data',
    'protocols',
    'cron-jobs.registry.json'
  );
  private readonly statePath = path.join(
    this.repoRoot,
    'data',
    'protocols',
    'cron-jobs.control-plane-state.json'
  );
  private readonly dtfCache = new Map<string, Intl.DateTimeFormat>();

  async listProcesses() {
    const registry = await this.readRegistry();
    const state = await this.readState();
    const categories = new Map(
      (registry.categories || []).map((category) => [category.category, category])
    );

    const registryJobs = Array.isArray(registry.jobs) ? registry.jobs : [];
    const jobIds = new Set(registryJobs.map((job) => job.schedule_id));
    const syntheticJobs: RegistryJob[] = Object.keys(DEFAULT_PROCESS_CATALOG)
      .filter((scheduleId) => !jobIds.has(scheduleId))
      .map((scheduleId) => ({
        schedule_id: scheduleId,
        scope: 'system_framework',
        category: 'observability',
        owner_agent_id: 'tnf-super-admin',
        owner_user_id: 'super-admin',
        locked: false,
      }));

    const jobs = [...registryJobs, ...syntheticJobs];
    const processes = jobs.map((job) =>
      this.buildProcess(job, categories.get(job.category), state)
    );

    const summary = {
      total: processes.length,
      enabled: processes.filter((process) => process.procedural.enabled).length,
      disabled: processes.filter((process) => !process.procedural.enabled).length,
      locked: processes.filter((process) => process.canonical.locked).length,
      healthy: processes.filter((process) => process.runtime.status === 'healthy').length,
      errored: processes.filter((process) => process.runtime.status === 'error').length,
    };

    return {
      generatedAt: new Date().toISOString(),
      summary,
      processes,
    };
  }

  async updateProcess(
    processId: string,
    patch: {
      enabled?: boolean;
      cadence?: string;
      timezone?: string;
      notes?: string;
    },
    actor: ProcessActorContext
  ) {
    const process = await this.getProcessById(processId);
    const isSuperAdmin = this.isSuperAdmin(actor.actorRoles);

    if (
      (process.canonical.locked || process.canonical.scope === 'system_framework') &&
      !isSuperAdmin
    ) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN may modify system framework or locked chronological processes.'
      );
    }

    if (patch.cadence !== undefined && !this.isCronExpressionLikelyValid(patch.cadence)) {
      throw new BadRequestException(
        'Invalid cadence. Use @preset form (@hourly, @daily, etc.) or a 5-7 token cron expression.'
      );
    }

    const state = await this.readState();
    const current = state.overrides[processId] || {};
    const next: ProcessOverrideEntry = {
      ...current,
      ...(patch.enabled !== undefined ? { enabled: Boolean(patch.enabled) } : {}),
      ...(patch.cadence !== undefined ? { cadence: String(patch.cadence).trim() } : {}),
      ...(patch.timezone !== undefined ? { timezone: String(patch.timezone).trim() } : {}),
      ...(patch.notes !== undefined ? { notes: String(patch.notes).trim() } : {}),
      updated_at: new Date().toISOString(),
      updated_by: actor.actorId,
    };

    state.overrides[processId] = next;
    state.updated_at = new Date().toISOString();
    await this.writeState(state);

    return this.getProcessById(processId);
  }

  async runProcessNow(processId: string, actor: ProcessActorContext) {
    const process = await this.getProcessById(processId);
    const isSuperAdmin = this.isSuperAdmin(actor.actorRoles);

    if (
      (process.canonical.locked || process.canonical.scope === 'system_framework') &&
      !isSuperAdmin
    ) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN may execute system framework or locked chronological processes.'
      );
    }

    if (!process.controls.canRunNow || !process.procedural.runNowCommand) {
      throw new BadRequestException('This process does not expose a run-now command.');
    }

    const state = await this.readState();
    const startedAt = new Date().toISOString();
    state.runtime[processId] = {
      ...(state.runtime[processId] || {}),
      status: 'running',
      lastRunAt: startedAt,
      lastError: null,
    };
    await this.writeState(state);

    const commandSpec = process.procedural.runNowCommand;
    const absoluteArgs = commandSpec.args.map((arg) =>
      arg.startsWith('scripts/') || arg.startsWith('docs/') || arg.startsWith('data/')
        ? path.join(this.repoRoot, arg)
        : arg
    );

    const startedMs = Date.now();
    let exitCode = 0;
    let status: ProcessStatus = 'healthy';
    let errorMessage: string | null = null;
    let outputPreview = '';

    try {
      const result = await execFileAsync(commandSpec.command, absoluteArgs, {
        cwd: this.repoRoot,
        timeout: commandSpec.timeoutMs,
        maxBuffer: 1024 * 1024 * 2,
      });
      outputPreview = this.buildOutputPreview(result.stdout, result.stderr);
    } catch (error) {
      const execError = error as Error & {
        code?: number | string;
        stdout?: string;
        stderr?: string;
      };
      exitCode = typeof execError.code === 'number' ? execError.code : 1;
      status = 'error';
      errorMessage = execError.message || 'Process execution failed';
      outputPreview = this.buildOutputPreview(execError.stdout, execError.stderr);
      this.logger.warn(`Chronological run-now failed for ${processId}: ${errorMessage}`);
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startedMs;
    const runRecord: ProcessRunHistoryEntry = {
      runId: this.createRunId(),
      processId,
      actorId: actor.actorId,
      startedAt,
      finishedAt,
      durationMs,
      status,
      exitCode,
      error: errorMessage,
      outputPreview: outputPreview || null,
    };
    const nextState = await this.readState();
    nextState.runtime[processId] = {
      ...(nextState.runtime[processId] || {}),
      status,
      lastRunAt: finishedAt,
      lastDurationMs: durationMs,
      lastExitCode: exitCode,
      lastError: errorMessage,
      lastOutputPreview: outputPreview || null,
    };
    const existingHistory = Array.isArray(nextState.history[processId])
      ? nextState.history[processId]
      : [];
    nextState.history[processId] = [runRecord, ...existingHistory].slice(0, 25);
    nextState.updated_at = finishedAt;
    await this.writeState(nextState);

    return {
      process: await this.getProcessById(processId),
      run: {
        startedAt,
        finishedAt,
        durationMs,
        status,
        exitCode,
        error: errorMessage,
        outputPreview,
      },
    };
  }

  async getProcessHistory(processId: string, limitRaw?: number) {
    const process = await this.getProcessById(processId);
    const state = await this.readState();
    const history = Array.isArray(state.history[processId]) ? state.history[processId] : [];
    const limit =
      Number.isFinite(limitRaw) && Number(limitRaw) > 0
        ? Math.min(250, Math.trunc(Number(limitRaw)))
        : 100;

    return {
      process: {
        id: process.id,
        title: process.title,
      },
      total: history.length,
      runs: history.slice(0, limit),
    };
  }

  private async getProcessById(processId: string) {
    const snapshot = await this.listProcesses();
    const process = snapshot.processes.find((item) => item.id === processId);
    if (!process) {
      throw new NotFoundException(`Chronological process '${processId}' not found.`);
    }
    return process;
  }

  private buildProcess(
    job: RegistryJob,
    category: RegistryCategory | undefined,
    state: ControlPlaneStateFile
  ) {
    const catalog =
      DEFAULT_PROCESS_CATALOG[job.schedule_id] || this.buildFallbackCatalog(job.schedule_id);
    const override = state.overrides[job.schedule_id] || {};
    const runtime = state.runtime[job.schedule_id] || {};
    const recentRuns = (state.history[job.schedule_id] || []).slice(0, 5);
    const enabled = override.enabled ?? true;
    const cadence = override.cadence || catalog.cadence;
    const timezone = override.timezone || catalog.timezone;
    const nextRunAt = enabled ? this.getNextRunAt(cadence, timezone) : null;
    const runNowCommand = catalog.runNow
      ? {
          command: catalog.runNow.command,
          args: [...catalog.runNow.args],
          timeoutMs: catalog.runNow.timeoutMs,
        }
      : null;

    const status: ProcessStatus =
      runtime.status ||
      (!enabled
        ? 'paused'
        : cadence === 'manual'
          ? 'manual'
          : runtime.lastExitCode === 0
            ? 'healthy'
            : 'scheduled');
    const nextRunHint = enabled
      ? cadence === 'manual'
        ? 'Manual execution only'
        : nextRunAt
          ? `Cron ${cadence} (${timezone})`
          : `Cron ${cadence} (${timezone}) — next run unresolved`
      : 'Paused until re-enabled';

    const canEdit = !job.locked;
    const canRunNow = Boolean(runNowCommand);

    return {
      id: job.schedule_id,
      title: catalog.title,
      description: catalog.description,
      canonical: {
        layer: 'canonical',
        scope: job.scope,
        category: job.category,
        categoryDescription: category?.description || null,
        ownerAgentId: job.owner_agent_id || null,
        ownerUserId: job.owner_user_id || null,
        locked: Boolean(job.locked),
        requiresApproval: Boolean(category?.requires_approval),
      },
      procedural: {
        layer: 'procedural',
        enabled,
        cadence,
        timezone,
        nextRunAt,
        nextRunHint,
        runNowCommand,
      },
      runtime: {
        status,
        lastRunAt: runtime.lastRunAt || null,
        lastDurationMs: runtime.lastDurationMs ?? null,
        lastExitCode: runtime.lastExitCode ?? null,
        lastError: runtime.lastError || null,
        lastOutputPreview: runtime.lastOutputPreview || null,
        recentRuns,
      },
      controls: {
        canEdit,
        canRunNow,
        editDeniedReason: canEdit ? null : 'Locked by governance policy',
        runDeniedReason: canRunNow ? null : 'No run-now command is registered',
      },
      docs: {
        protocol: catalog.docs?.protocol || null,
        runbook: catalog.docs?.runbook || null,
      },
      updatedAt: override.updated_at || state.updated_at,
      updatedBy: override.updated_by || 'system',
    };
  }

  private buildFallbackCatalog(scheduleId: string): ProcessCatalogEntry {
    return {
      title: this.formatScheduleId(scheduleId),
      cadence: 'manual',
      timezone: 'UTC',
      description: 'No procedural metadata has been registered for this schedule.',
      runNow: null,
      docs: {
        protocol: 'docs/protocols/tnf-cron-governance-protocol-v0.1.md',
      },
    };
  }

  private formatScheduleId(scheduleId: string): string {
    return scheduleId
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private isSuperAdmin(roles: string[]): boolean {
    const normalized = new Set((roles || []).map((role) => String(role || '').toLowerCase()));
    return (
      normalized.has('super_admin') ||
      normalized.has('super-admin') ||
      normalized.has('superadmin') ||
      normalized.has('system')
    );
  }

  private isCronExpressionLikelyValid(value: string): boolean {
    const normalized = String(value || '').trim();
    if (!normalized) return false;
    if (normalized.startsWith('@')) {
      return [
        '@yearly',
        '@annually',
        '@monthly',
        '@weekly',
        '@daily',
        '@hourly',
        '@reboot',
      ].includes(normalized.toLowerCase());
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    return tokens.length >= 5 && tokens.length <= 7;
  }

  private buildOutputPreview(stdout?: string, stderr?: string): string {
    const combined = [stdout || '', stderr || ''].join('\n').trim();
    if (!combined) return '';
    const normalized = combined.replace(/\s+/g, ' ').trim();
    return normalized.length > 420 ? `${normalized.slice(0, 420)}...` : normalized;
  }

  private async readRegistry(): Promise<CronRegistryFile> {
    try {
      const raw = await fsPromises.readFile(this.registryPath, 'utf8');
      return JSON.parse(raw) as CronRegistryFile;
    } catch {
      return {
        spec: 'tnf/cron-jobs-registry/0.1',
        generated_at: new Date().toISOString(),
        categories: [],
        jobs: [],
      };
    }
  }

  private async readState(): Promise<ControlPlaneStateFile> {
    try {
      const raw = await fsPromises.readFile(this.statePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ControlPlaneStateFile>;
      return {
        spec: parsed.spec || 'tnf/cron-jobs-control-plane-state/0.1',
        updated_at: parsed.updated_at || new Date(0).toISOString(),
        overrides: parsed.overrides || {},
        runtime: parsed.runtime || {},
        history: parsed.history || {},
      };
    } catch {
      return {
        spec: 'tnf/cron-jobs-control-plane-state/0.1',
        updated_at: new Date(0).toISOString(),
        overrides: {},
        runtime: {},
        history: {},
      };
    }
  }

  private async writeState(nextState: ControlPlaneStateFile) {
    await fsPromises.mkdir(path.dirname(this.statePath), { recursive: true });
    await fsPromises.writeFile(this.statePath, JSON.stringify(nextState, null, 2), 'utf8');
  }

  private resolveRepoRoot(): string {
    const registryRelative = path.join('data', 'protocols', 'cron-jobs.registry.json');
    let current = process.cwd();

    for (let i = 0; i < 8; i += 1) {
      const candidate = path.join(current, registryRelative);
      if (fs.existsSync(candidate)) return current;
      const next = path.dirname(current);
      if (next === current) break;
      current = next;
    }

    return process.cwd();
  }

  private createRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private getNextRunAt(cadence: string, timezone: string): string | null {
    const normalized = this.normalizeCronExpression(cadence);
    if (!normalized || normalized === 'manual') return null;

    const fields = normalized.split(/\s+/).filter(Boolean);
    if (fields.length !== 5) return null;

    const [minuteExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = fields;
    const now = new Date();
    const probe = new Date(now.getTime());
    probe.setSeconds(0, 0);
    probe.setMinutes(probe.getMinutes() + 1);

    const maxIterations = 60 * 24 * 31; // up to 31 days
    for (let i = 0; i < maxIterations; i += 1) {
      const parts = this.getZonedDateParts(probe, timezone);
      const minuteMatch = this.matchesCronField(parts.minute, minuteExpr, 0, 59);
      const hourMatch = this.matchesCronField(parts.hour, hourExpr, 0, 23);
      const monthMatch = this.matchesCronField(parts.month, monthExpr, 1, 12, this.monthNameMap());
      const dayMatch = this.matchesCronField(parts.day, dayExpr, 1, 31);
      const weekdayValue = parts.weekday;
      const weekdayMatch = this.matchesCronField(
        weekdayValue,
        weekdayExpr,
        0,
        7,
        this.weekdayNameMap(),
        true
      );

      const dayIsWildcard = dayExpr.trim() === '*';
      const weekdayIsWildcard = weekdayExpr.trim() === '*';
      const dayConstraintMatch =
        dayIsWildcard || weekdayIsWildcard ? dayMatch && weekdayMatch : dayMatch || weekdayMatch;

      if (minuteMatch && hourMatch && monthMatch && dayConstraintMatch) {
        return probe.toISOString();
      }

      probe.setMinutes(probe.getMinutes() + 1);
    }

    return null;
  }

  private normalizeCronExpression(cadence: string): string | null {
    const raw = String(cadence || '').trim();
    if (!raw) return null;
    if (raw.toLowerCase() === 'manual') return 'manual';

    const preset = raw.toLowerCase();
    const presetMap: Record<string, string> = {
      '@yearly': '0 0 1 1 *',
      '@annually': '0 0 1 1 *',
      '@monthly': '0 0 1 * *',
      '@weekly': '0 0 * * 0',
      '@daily': '0 0 * * *',
      '@hourly': '0 * * * *',
      '@reboot': 'manual',
    };
    if (presetMap[preset]) return presetMap[preset];

    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length === 5) return tokens.join(' ');
    if (tokens.length === 6) return tokens.slice(1).join(' ');
    if (tokens.length === 7) return tokens.slice(1, 6).join(' ');
    return null;
  }

  private getZonedDateParts(date: Date, timezone: string) {
    const resolvedTimezone = this.safeTimezone(timezone);
    const cacheKey = `tz:${resolvedTimezone}`;
    let formatter = this.dtfCache.get(cacheKey);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: resolvedTimezone,
        hour12: false,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
      });
      this.dtfCache.set(cacheKey, formatter);
    }

    const parts = formatter.formatToParts(date);
    const getNumber = (type: string): number => {
      const part = parts.find((entry) => entry.type === type)?.value || '0';
      const parsed = Number.parseInt(part, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const weekdayName = (parts.find((entry) => entry.type === 'weekday')?.value || 'Sun')
      .slice(0, 3)
      .toLowerCase();
    const weekday = this.weekdayNameMap()[weekdayName] ?? 0;

    return {
      minute: getNumber('minute'),
      hour: getNumber('hour'),
      day: getNumber('day'),
      month: getNumber('month'),
      weekday,
    };
  }

  private safeTimezone(input: string): string {
    try {
      const normalized = String(input || '').trim() || 'UTC';
      Intl.DateTimeFormat('en-US', { timeZone: normalized });
      return normalized;
    } catch {
      return 'UTC';
    }
  }

  private monthNameMap(): Record<string, number> {
    return {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };
  }

  private weekdayNameMap(): Record<string, number> {
    return {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
  }

  private matchesCronField(
    value: number,
    expression: string,
    min: number,
    max: number,
    names?: Record<string, number>,
    normalizeSevenToZero = false
  ): boolean {
    const raw = String(expression || '')
      .trim()
      .toLowerCase();
    if (!raw || raw === '*') return true;

    const parts = raw.split(',');
    for (const part of parts) {
      if (this.matchesCronSegment(value, part.trim(), min, max, names, normalizeSevenToZero)) {
        return true;
      }
    }
    return false;
  }

  private matchesCronSegment(
    value: number,
    segment: string,
    min: number,
    max: number,
    names?: Record<string, number>,
    normalizeSevenToZero = false
  ): boolean {
    if (!segment) return false;

    const [rangeToken, stepToken] = segment.split('/');
    const step = stepToken ? Number.parseInt(stepToken, 10) : 1;
    if (!Number.isFinite(step) || step <= 0) return false;

    if (rangeToken === '*') {
      return (value - min) % step === 0;
    }

    if (rangeToken.includes('-')) {
      const [startToken, endToken] = rangeToken.split('-');
      const start = this.parseCronToken(startToken, names, normalizeSevenToZero);
      const end = this.parseCronToken(endToken, names, normalizeSevenToZero);
      if (start === null || end === null) return false;
      if (start > end) return false;
      if (start < min || end > max) return false;
      if (value < start || value > end) return false;
      return (value - start) % step === 0;
    }

    const single = this.parseCronToken(rangeToken, names, normalizeSevenToZero);
    if (single === null) return false;
    if (single < min || single > max) return false;
    return value === single;
  }

  private parseCronToken(
    token: string,
    names?: Record<string, number>,
    normalizeSevenToZero = false
  ): number | null {
    const cleaned = String(token || '')
      .trim()
      .toLowerCase();
    if (!cleaned) return null;
    if (names && cleaned in names) {
      return names[cleaned];
    }
    const parsed = Number.parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return null;
    if (normalizeSevenToZero && parsed === 7) return 0;
    return parsed;
  }
}
