"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ChronologicalProcessesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChronologicalProcessesService = void 0;
const common_1 = require("@nestjs/common");
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const node_fs_1 = require("node:fs");
const path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const DEFAULT_PROCESS_CATALOG = {
    'tnf-master-clock-super-cycle': {
        title: 'TNF Master Clock Super Cycle',
        cadence: '*/15 * * * *',
        timezone: 'UTC',
        description: 'Canonical system-wide federation and orchestration gate verification cycle for the TNF control plane.',
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
        description: 'Protocol and schema conformance loop that keeps the canonical reliability and self-improvement envelope healthy.',
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
        description: 'Procedural scan and refresh loop that updates terminal macro-board state and visualization artifacts.',
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
        description: 'Procedural frontload/terminal context reminder loop that validates handoff and shell-start context hygiene.',
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
        description: 'Tenant-scoped default reminder loop for user and tenant-agent terminal context continuity.',
        runNow: null,
        docs: {
            protocol: 'docs/protocols/tnf-cron-governance-protocol-v0.1.md',
        },
    },
    'tenant-personal-archaeology-master-loop': {
        title: 'Personal Archaeology Master Loop',
        cadence: '*/30 * * * *',
        timezone: 'UTC',
        description: 'Master Orchestrator supervision loop for the personal archaeology fleet, team health, and blocker counts.',
        runNow: {
            command: 'node',
            args: ['scripts/timeline/personal-archaeology-orchestrator.mjs', 'master-loop'],
            timeoutMs: 30000,
        },
        docs: {
            protocol: 'docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml',
            runbook: 'docs/operations/tnf-personal-archaeology-runbook.md',
        },
    },
    'tenant-personal-archaeology-investigator-pulse': {
        title: 'Personal Archaeology Investigator Pulse',
        cadence: '15 */2 * * *',
        timezone: 'UTC',
        description: 'Periodic heartbeat refresh for archaeology investigators and sentinels based on findings-state continuity.',
        runNow: {
            command: 'node',
            args: ['scripts/timeline/personal-archaeology-orchestrator.mjs', 'investigator-pulse'],
            timeoutMs: 30000,
        },
        docs: {
            protocol: 'docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml',
            runbook: 'docs/operations/tnf-personal-archaeology-runbook.md',
        },
    },
    'tenant-personal-archaeology-digest': {
        title: 'Personal Archaeology Digest',
        cadence: '0 */12 * * *',
        timezone: 'UTC',
        description: 'Narrative reconstruction digest summarizing current findings, progress, and pending human actions.',
        runNow: {
            command: 'node',
            args: ['scripts/timeline/personal-archaeology-orchestrator.mjs', 'digest'],
            timeoutMs: 30000,
        },
        docs: {
            protocol: 'docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml',
            runbook: 'docs/operations/tnf-personal-archaeology-runbook.md',
        },
    },
    'tenant-personal-archaeology-blocker-watch': {
        title: 'Personal Archaeology Blocker Watch',
        cadence: '*/15 * * * *',
        timezone: 'UTC',
        description: 'Human-escalation sentinel that monitors blocked archaeology work and relays pending actions through TNF channels.',
        runNow: {
            command: 'node',
            args: ['scripts/timeline/personal-archaeology-orchestrator.mjs', 'blocker-watch'],
            timeoutMs: 30000,
        },
        docs: {
            protocol: 'docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml',
            runbook: 'docs/operations/tnf-personal-archaeology-runbook.md',
        },
    },
};
let ChronologicalProcessesService = ChronologicalProcessesService_1 = class ChronologicalProcessesService {
    constructor() {
        this.logger = new common_1.Logger(ChronologicalProcessesService_1.name);
        this.repoRoot = this.resolveRepoRoot();
        this.registryPath = path.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
        this.statePath = path.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');
        this.catalogPath = path.join(this.repoRoot, 'data', 'protocols', 'chronological-process-catalog.json');
        this.dtfCache = new Map();
    }
    async listProcesses() {
        const registry = await this.readRegistry();
        const state = await this.readState();
        const catalogEntries = await this.readCatalogEntries();
        const categories = new Map((registry.categories || []).map((category) => [category.category, category]));
        const registryJobs = Array.isArray(registry.jobs) ? registry.jobs : [];
        const jobIds = new Set(registryJobs.map((job) => job.schedule_id));
        const syntheticJobs = Object.keys(DEFAULT_PROCESS_CATALOG)
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
        const processes = jobs.map((job) => this.buildProcess(job, categories.get(job.category), state, catalogEntries));
        const summary = {
            total: processes.length,
            enabled: processes.filter((process) => process.procedural.enabled).length,
            disabled: processes.filter((process) => !process.procedural.enabled).length,
            locked: processes.filter((process) => process.canonical.locked).length,
            healthy: processes.filter((process) => process.runtime.status === 'healthy').length,
            errored: processes.filter((process) => process.runtime.status === 'error').length,
            externalRuntimes: this.buildExternalRuntimeSummary(state),
        };
        return {
            generatedAt: new Date().toISOString(),
            summary,
            processes,
        };
    }
    async updateProcess(processId, patch, actor) {
        const process = await this.getProcessById(processId);
        const isSuperAdmin = this.isSuperAdmin(actor.actorRoles);
        if ((process.canonical.locked || process.canonical.scope === 'system_framework') &&
            !isSuperAdmin) {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN may modify system framework or locked chronological processes.');
        }
        if (patch.cadence !== undefined && !this.isCronExpressionLikelyValid(patch.cadence)) {
            throw new common_1.BadRequestException('Invalid cadence. Use @preset form (@hourly, @daily, etc.) or a 5-7 token cron expression.');
        }
        const state = await this.readState();
        const current = state.overrides[processId] || {};
        const next = {
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
    async runProcessNow(processId, actor) {
        const process = await this.getProcessById(processId);
        const isSuperAdmin = this.isSuperAdmin(actor.actorRoles);
        if ((process.canonical.locked || process.canonical.scope === 'system_framework') &&
            !isSuperAdmin) {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN may execute system framework or locked chronological processes.');
        }
        if (!process.controls.canRunNow || !process.procedural.runNowCommand) {
            throw new common_1.BadRequestException('This process does not expose a run-now command.');
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
        const absoluteArgs = commandSpec.args.map((arg) => arg.startsWith('scripts/') || arg.startsWith('docs/') || arg.startsWith('data/')
            ? path.join(this.repoRoot, arg)
            : arg);
        const startedMs = Date.now();
        let exitCode = 0;
        let status = 'healthy';
        let errorMessage = null;
        let outputPreview = '';
        try {
            const result = await execFileAsync(commandSpec.command, absoluteArgs, {
                cwd: this.repoRoot,
                timeout: commandSpec.timeoutMs,
                maxBuffer: 1024 * 1024 * 2,
            });
            outputPreview = this.buildOutputPreview(result.stdout, result.stderr);
        }
        catch (error) {
            const execError = error;
            exitCode = typeof execError.code === 'number' ? execError.code : 1;
            status = 'error';
            errorMessage = execError.message || 'Process execution failed';
            outputPreview = this.buildOutputPreview(execError.stdout, execError.stderr);
            this.logger.warn(`Chronological run-now failed for ${processId}: ${errorMessage}`);
        }
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - startedMs;
        const runRecord = {
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
    async getProcessHistory(processId, limitRaw) {
        const process = await this.getProcessById(processId);
        const state = await this.readState();
        const history = Array.isArray(state.history[processId]) ? state.history[processId] : [];
        const limit = Number.isFinite(limitRaw) && Number(limitRaw) > 0
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
    async auditChronologicalProcesses(actor) {
        this.logger.log('Initiating Chronological Process Governance Audit...');
        const snapshot = await this.listProcesses();
        const warnings = [];
        const processes = snapshot.processes;
        for (const process of processes) {
            if (process.canonical.layer === 'canonical' && !process.canonical.ownerAgentId && !process.canonical.ownerUserId) {
                warnings.push(`[ORPHANED] Process '${process.id}' has no assigned owner. All jobs must have accountable owners.`);
            }
            if (process.runtime.status === 'error') {
                warnings.push(`[UNHEALTHY] Process '${process.id}' is currently failing. Last error: ${process.runtime.lastError}`);
            }
            const recentRuns = process.runtime.recentRuns || [];
            const failingRuns = recentRuns.filter(r => r.status === 'error');
            if (recentRuns.length > 0 && failingRuns.length === recentRuns.length) {
                warnings.push(`[OPTIMAL UTILITY WARNING] Process '${process.id}' has failed continuously on recent runs. Consider pausing or refactoring to save compute resources.`);
            }
            if (process.canonical.locked) {
                this.logger.debug(`[LOCKED] Process '${process.id}' is protected by governance policy.`);
            }
        }
        if (warnings.length > 0) {
            this.logger.warn(`Governance Audit found ${warnings.length} issues:`);
            warnings.forEach((w) => this.logger.warn(w));
        }
        else {
            this.logger.log('Governance Audit passed successfully. No anomalies detected.');
        }
        // Log the audit event
        const state = await this.readState();
        state.updated_at = new Date().toISOString();
        await this.writeState(state);
        return {
            status: warnings.length === 0 ? 'healthy' : 'degraded',
            auditedAt: new Date().toISOString(),
            issuesFound: warnings.length,
            warnings,
        };
    }
    async getProcessById(processId) {
        const snapshot = await this.listProcesses();
        const process = snapshot.processes.find((item) => item.id === processId);
        if (!process) {
            throw new common_1.NotFoundException(`Chronological process '${processId}' not found.`);
        }
        return process;
    }
    buildProcess(job, category, state, catalogEntries) {
        const catalog = catalogEntries[job.schedule_id] || this.buildFallbackCatalog(job.schedule_id);
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
        const openClaw = state.integrations?.openclaw?.mappedSchedules?.[job.schedule_id] || null;
        const status = runtime.status ||
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
            integrations: {
                openclaw: openClaw
                    ? {
                        updatedAt: state.integrations?.openclaw?.updatedAt || null,
                        syncedBy: state.integrations?.openclaw?.syncedBy || null,
                        installationCount: state.integrations?.openclaw?.summary?.installationCount || 0,
                        totalInstanceCount: state.integrations?.openclaw?.summary?.instanceCount || 0,
                        ...openClaw,
                    }
                    : null,
            },
            updatedAt: override.updated_at || state.updated_at,
            updatedBy: override.updated_by || 'system',
        };
    }
    buildExternalRuntimeSummary(state) {
        const openClaw = state.integrations?.openclaw;
        if (!openClaw)
            return null;
        const mappedSchedules = Object.values(openClaw.mappedSchedules || {});
        return {
            openclaw: {
                updatedAt: openClaw.updatedAt || null,
                syncedBy: openClaw.syncedBy || null,
                installationCount: openClaw.summary?.installationCount || 0,
                instanceCount: openClaw.summary?.instanceCount || 0,
                totalJobs: openClaw.summary?.totalJobs || 0,
                trackedSchedules: mappedSchedules.length,
                duplicatedSchedules: mappedSchedules.filter((entry) => entry.duplicateCount > 0).length,
                failingSchedules: mappedSchedules.filter((entry) => entry.worstStatus === 'error').length,
            },
        };
    }
    buildFallbackCatalog(scheduleId) {
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
    formatScheduleId(scheduleId) {
        return scheduleId
            .split('-')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }
    isSuperAdmin(roles) {
        const normalized = new Set((roles || []).map((role) => String(role || '').toLowerCase()));
        return (normalized.has('super_admin') ||
            normalized.has('super-admin') ||
            normalized.has('superadmin') ||
            normalized.has('system'));
    }
    isCronExpressionLikelyValid(value) {
        const normalized = String(value || '').trim();
        if (!normalized)
            return false;
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
    buildOutputPreview(stdout, stderr) {
        const combined = [stdout || '', stderr || ''].join('\n').trim();
        if (!combined)
            return '';
        const normalized = combined.replace(/\s+/g, ' ').trim();
        return normalized.length > 420 ? `${normalized.slice(0, 420)}...` : normalized;
    }
    async readRegistry() {
        try {
            const raw = await node_fs_1.promises.readFile(this.registryPath, 'utf8');
            return JSON.parse(raw);
        }
        catch {
            return {
                spec: 'tnf/cron-jobs-registry/0.1',
                generated_at: new Date().toISOString(),
                categories: [],
                jobs: [],
            };
        }
    }
    async readCatalogEntries() {
        try {
            const raw = await node_fs_1.promises.readFile(this.catalogPath, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_PROCESS_CATALOG,
                ...(parsed.entries || {}),
            };
        }
        catch {
            return { ...DEFAULT_PROCESS_CATALOG };
        }
    }
    async readState() {
        try {
            const raw = await node_fs_1.promises.readFile(this.statePath, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                spec: parsed.spec || 'tnf/cron-jobs-control-plane-state/0.1',
                updated_at: parsed.updated_at || new Date(0).toISOString(),
                overrides: parsed.overrides || {},
                runtime: parsed.runtime || {},
                history: parsed.history || {},
                integrations: parsed.integrations && typeof parsed.integrations === 'object' ? parsed.integrations : {},
            };
        }
        catch {
            return {
                spec: 'tnf/cron-jobs-control-plane-state/0.1',
                updated_at: new Date(0).toISOString(),
                overrides: {},
                runtime: {},
                history: {},
                integrations: {},
            };
        }
    }
    async writeState(nextState) {
        await node_fs_1.promises.mkdir(path.dirname(this.statePath), { recursive: true });
        await node_fs_1.promises.writeFile(this.statePath, JSON.stringify(nextState, null, 2), 'utf8');
    }
    resolveRepoRoot() {
        const registryRelative = path.join('data', 'protocols', 'cron-jobs.registry.json');
        let current = process.cwd();
        for (let i = 0; i < 8; i += 1) {
            const candidate = path.join(current, registryRelative);
            if (fs.existsSync(candidate))
                return current;
            const next = path.dirname(current);
            if (next === current)
                break;
            current = next;
        }
        return process.cwd();
    }
    createRunId() {
        return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
    getNextRunAt(cadence, timezone) {
        const normalized = this.normalizeCronExpression(cadence);
        if (!normalized || normalized === 'manual')
            return null;
        const fields = normalized.split(/\s+/).filter(Boolean);
        if (fields.length !== 5)
            return null;
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
            const weekdayMatch = this.matchesCronField(weekdayValue, weekdayExpr, 0, 7, this.weekdayNameMap(), true);
            const dayIsWildcard = dayExpr.trim() === '*';
            const weekdayIsWildcard = weekdayExpr.trim() === '*';
            const dayConstraintMatch = dayIsWildcard || weekdayIsWildcard ? dayMatch && weekdayMatch : dayMatch || weekdayMatch;
            if (minuteMatch && hourMatch && monthMatch && dayConstraintMatch) {
                return probe.toISOString();
            }
            probe.setMinutes(probe.getMinutes() + 1);
        }
        return null;
    }
    normalizeCronExpression(cadence) {
        const raw = String(cadence || '').trim();
        if (!raw)
            return null;
        if (raw.toLowerCase() === 'manual')
            return 'manual';
        const preset = raw.toLowerCase();
        const presetMap = {
            '@yearly': '0 0 1 1 *',
            '@annually': '0 0 1 1 *',
            '@monthly': '0 0 1 * *',
            '@weekly': '0 0 * * 0',
            '@daily': '0 0 * * *',
            '@hourly': '0 * * * *',
            '@reboot': 'manual',
        };
        if (presetMap[preset])
            return presetMap[preset];
        const tokens = raw.split(/\s+/).filter(Boolean);
        if (tokens.length === 5)
            return tokens.join(' ');
        if (tokens.length === 6)
            return tokens.slice(1).join(' ');
        if (tokens.length === 7)
            return tokens.slice(1, 6).join(' ');
        return null;
    }
    getZonedDateParts(date, timezone) {
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
        const getNumber = (type) => {
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
    safeTimezone(input) {
        try {
            const normalized = String(input || '').trim() || 'UTC';
            Intl.DateTimeFormat('en-US', { timeZone: normalized });
            return normalized;
        }
        catch {
            return 'UTC';
        }
    }
    monthNameMap() {
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
    weekdayNameMap() {
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
    matchesCronField(value, expression, min, max, names, normalizeSevenToZero = false) {
        const raw = String(expression || '')
            .trim()
            .toLowerCase();
        if (!raw || raw === '*')
            return true;
        const parts = raw.split(',');
        for (const part of parts) {
            if (this.matchesCronSegment(value, part.trim(), min, max, names, normalizeSevenToZero)) {
                return true;
            }
        }
        return false;
    }
    matchesCronSegment(value, segment, min, max, names, normalizeSevenToZero = false) {
        if (!segment)
            return false;
        const [rangeToken, stepToken] = segment.split('/');
        const step = stepToken ? Number.parseInt(stepToken, 10) : 1;
        if (!Number.isFinite(step) || step <= 0)
            return false;
        if (rangeToken === '*') {
            return (value - min) % step === 0;
        }
        if (rangeToken.includes('-')) {
            const [startToken, endToken] = rangeToken.split('-');
            const start = this.parseCronToken(startToken, names, normalizeSevenToZero);
            const end = this.parseCronToken(endToken, names, normalizeSevenToZero);
            if (start === null || end === null)
                return false;
            if (start > end)
                return false;
            if (start < min || end > max)
                return false;
            if (value < start || value > end)
                return false;
            return (value - start) % step === 0;
        }
        const single = this.parseCronToken(rangeToken, names, normalizeSevenToZero);
        if (single === null)
            return false;
        if (single < min || single > max)
            return false;
        return value === single;
    }
    parseCronToken(token, names, normalizeSevenToZero = false) {
        const cleaned = String(token || '')
            .trim()
            .toLowerCase();
        if (!cleaned)
            return null;
        if (names && cleaned in names) {
            return names[cleaned];
        }
        const parsed = Number.parseInt(cleaned, 10);
        if (!Number.isFinite(parsed))
            return null;
        if (normalizeSevenToZero && parsed === 7)
            return 0;
        return parsed;
    }
};
exports.ChronologicalProcessesService = ChronologicalProcessesService;
exports.ChronologicalProcessesService = ChronologicalProcessesService = ChronologicalProcessesService_1 = __decorate([
    (0, common_1.Injectable)()
], ChronologicalProcessesService);
//# sourceMappingURL=chronological-processes.service.js.map