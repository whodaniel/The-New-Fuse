"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperCycleSchedulerService = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
// ============================================================================
// SuperCycleSchedulerService
// ============================================================================
class SuperCycleSchedulerService {
    constructor(config, log, redisClient, selfPromptService, emitActivityEvent, getOrchestratorEnvelopeIdentity) {
        this.chronologicalPollingInterval = null;
        this.config = config;
        this.log = log;
        this.redisClient = redisClient;
        this.selfPromptService = selfPromptService;
        this.emitActivityEvent = emitActivityEvent;
        this.getOrchestratorEnvelopeIdentity = getOrchestratorEnvelopeIdentity;
        this.scheduledProcesses = new Map();
        this.repoRoot = this.resolveRepoRoot();
        this.dtfCache = new Map();
    }
    // --------------------------------------------------------------------------
    // CHRONOLOGICAL PROCESS SCHEDULING
    // --------------------------------------------------------------------------
    startChronologicalPolling() {
        if (this.chronologicalPollingInterval)
            return;
        this.log('info', 'CHRONO', `Starting chronological scheduler poller (every ${this.config.CHRONOLOGICAL_POLL_INTERVAL_MS}ms)`);
        const run = () => {
            void this.pollAndRunChronologicalProcesses().catch((error) => {
                this.log('warn', 'CHRONO', `Chronological scheduler poll failed: ${error.message || String(error)}`);
            });
        };
        this.chronologicalPollingInterval = setInterval(run, this.config.CHRONOLOGICAL_POLL_INTERVAL_MS);
        run();
    }
    async pollAndRunChronologicalProcesses() {
        const snapshots = await this.loadChronologicalProcessSnapshots();
        const now = new Date();
        for (const snapshot of snapshots) {
            this.handleSuperCycleHeartbeat({
                payload: {
                    processId: snapshot.processId,
                    name: snapshot.title,
                    kind: 'chronological-job',
                    owner: snapshot.owner,
                    status: snapshot.enabled ? 'scheduled' : 'paused',
                    lastHeartbeat: now.toISOString(),
                    lastRunAt: snapshot.runtime?.lastRunAt || null,
                    nextExpectedAt: snapshot.enabled
                        ? this.getNextRunAt(snapshot.cadence, snapshot.timezone, now)
                        : null,
                    metadata: {
                        ...snapshot.metadata,
                        cadence: snapshot.cadence,
                        timezone: snapshot.timezone,
                        scope: snapshot.scope,
                        category: snapshot.category,
                        governanceSource: 'chronological-registry',
                        intendedIntervalMs: this.deriveCadenceIntervalMs(snapshot.cadence),
                    },
                },
            });
        }
        const due = snapshots.filter((snapshot) => this.shouldRunChronologicalProcess(snapshot, now));
        for (const snapshot of due) {
            await this.executeChronologicalProcess(snapshot);
        }
    }
    async loadChronologicalProcessSnapshots() {
        const registryPath = path_1.default.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
        const statePath = path_1.default.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');
        const catalogPath = path_1.default.join(this.repoRoot, 'data', 'protocols', 'chronological-process-catalog.json');
        const registryRaw = await fs_1.promises
            .readFile(registryPath, 'utf8')
            .then((value) => JSON.parse(value))
            .catch(() => ({ jobs: [] }));
        const stateRaw = await fs_1.promises
            .readFile(statePath, 'utf8')
            .then((value) => JSON.parse(value))
            .catch(() => ({ overrides: {}, runtime: {} }));
        const catalogRaw = await fs_1.promises
            .readFile(catalogPath, 'utf8')
            .then((value) => JSON.parse(value))
            .catch(() => ({ entries: {} }));
        const jobs = Array.isArray(registryRaw.jobs) ? registryRaw.jobs : [];
        const overrides = stateRaw.overrides || {};
        const runtime = stateRaw.runtime || {};
        const entries = catalogRaw.entries || {};
        return jobs
            .map((job) => {
            const catalogEntry = entries[job.schedule_id];
            if (!catalogEntry)
                return null;
            const override = overrides[job.schedule_id] || {};
            return {
                processId: job.schedule_id,
                title: catalogEntry.title,
                cadence: override.cadence || catalogEntry.cadence,
                timezone: override.timezone || catalogEntry.timezone || 'UTC',
                enabled: override.enabled ?? true,
                runNow: catalogEntry.runNow,
                owner: job.owner_agent_id || 'unknown',
                scope: job.scope || 'tenant',
                category: job.category || 'tenant_automation',
                runtime: runtime[job.schedule_id] || {},
                metadata: catalogEntry.metadata || {},
            };
        })
            .filter(Boolean);
    }
    shouldRunChronologicalProcess(snapshot, now) {
        if (!snapshot.enabled || !snapshot.runNow)
            return false;
        const normalizedCadence = this.normalizeCronExpression(snapshot.cadence);
        if (!normalizedCadence || normalizedCadence === 'manual')
            return false;
        const lastRunAtMs = this.parseTimestampMs(snapshot.runtime?.lastRunAt);
        if (snapshot.runtime?.status === 'running' && lastRunAtMs) {
            const lockWindowMs = Math.max(Number(snapshot.runNow.timeoutMs || 30000) * 2, this.config.CHRONOLOGICAL_POLL_INTERVAL_MS * 2);
            if (Date.now() - lastRunAtMs < lockWindowMs) {
                return false;
            }
        }
        const currentSlot = this.getScheduleSlot(now, normalizedCadence, snapshot.timezone);
        if (!currentSlot.matches || !currentSlot.key)
            return false;
        if (!lastRunAtMs)
            return true;
        const lastRunSlot = this.getScheduleSlot(new Date(lastRunAtMs), normalizedCadence, snapshot.timezone);
        return currentSlot.key !== lastRunSlot.key;
    }
    async executeChronologicalProcess(snapshot) {
        const runnerPath = path_1.default.join(this.repoRoot, 'scripts', 'protocols', 'run-chronological-process.cjs');
        const startedAt = new Date().toISOString();
        let status = 'healthy';
        let lastResult = 'ok';
        try {
            const result = await execFileAsync('node', ['--', runnerPath, '--process-id', snapshot.processId, '--actor-id', 'tnf-master-clock'], {
                cwd: this.repoRoot,
                timeout: Number(snapshot.runNow?.timeoutMs || 30000) + 5000,
                maxBuffer: 1024 * 1024 * 2,
                env: process.env,
            });
            const parsed = this.parseJsonOutput(result.stdout);
            if (parsed?.run?.status) {
                status = parsed.run.status;
                lastResult = status;
            }
            await this.emitActivityEvent('chronological_process_executed', `Executed chronological process ${snapshot.processId}`, {
                processId: snapshot.processId,
                title: snapshot.title,
                status,
            });
        }
        catch (error) {
            status = 'error';
            lastResult = error.message || 'execution_failed';
            this.log('warn', 'CHRONO', `Chronological execution failed for ${snapshot.processId}: ${lastResult}`);
            await this.emitActivityEvent('chronological_process_error', `Chronological process ${snapshot.processId} failed`, {
                processId: snapshot.processId,
                title: snapshot.title,
                error: lastResult,
            });
        }
        this.handleSuperCycleHeartbeat({
            payload: {
                processId: snapshot.processId,
                name: snapshot.title,
                kind: 'chronological-job',
                owner: snapshot.owner,
                status,
                lastHeartbeat: new Date().toISOString(),
                lastRunAt: startedAt,
                lastResult,
                nextExpectedAt: this.getNextRunAt(snapshot.cadence, snapshot.timezone, new Date()),
                metadata: {
                    ...snapshot.metadata,
                    cadence: snapshot.cadence,
                    timezone: snapshot.timezone,
                    scope: snapshot.scope,
                    category: snapshot.category,
                    governanceSource: 'chronological-registry',
                    intendedIntervalMs: this.deriveCadenceIntervalMs(snapshot.cadence),
                },
            },
        });
    }
    parseJsonOutput(stdout) {
        try {
            return stdout ? JSON.parse(stdout) : null;
        }
        catch {
            return null;
        }
    }
    deriveCadenceIntervalMs(cadence) {
        const normalized = this.normalizeCronExpression(cadence);
        if (!normalized || normalized === 'manual')
            return undefined;
        if (normalized === '0 * * * *')
            return 60 * 60 * 1000;
        if (normalized === '*/10 * * * *')
            return 10 * 60 * 1000;
        if (normalized === '*/15 * * * *')
            return 15 * 60 * 1000;
        if (normalized === '*/30 * * * *')
            return 30 * 60 * 1000;
        if (normalized === '0 */2 * * *')
            return 2 * 60 * 60 * 1000;
        if (normalized === '0 */4 * * *')
            return 4 * 60 * 60 * 1000;
        if (normalized === '0 */6 * * *')
            return 6 * 60 * 60 * 1000;
        if (normalized === '0 0 * * *')
            return 24 * 60 * 60 * 1000;
        return undefined;
    }
    getScheduleSlot(date, cadence, timezone) {
        const normalized = this.normalizeCronExpression(cadence);
        if (!normalized || normalized === 'manual') {
            return { matches: false, key: null };
        }
        const fields = normalized.split(/\s+/).filter(Boolean);
        if (fields.length !== 5) {
            return { matches: false, key: null };
        }
        const [minuteExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = fields;
        const parts = this.getZonedDateParts(date, timezone);
        const minuteMatch = this.matchesCronField(parts.minute, minuteExpr, 0, 59);
        const hourMatch = this.matchesCronField(parts.hour, hourExpr, 0, 23);
        const monthMatch = this.matchesCronField(parts.month, monthExpr, 1, 12, this.monthNameMap());
        const dayMatch = this.matchesCronField(parts.day, dayExpr, 1, 31);
        const weekdayMatch = this.matchesCronField(parts.weekday, weekdayExpr, 0, 7, this.weekdayNameMap(), true);
        const dayIsWildcard = dayExpr.trim() === '*';
        const weekdayIsWildcard = weekdayExpr.trim() === '*';
        const dayConstraintMatch = dayIsWildcard || weekdayIsWildcard ? dayMatch && weekdayMatch : dayMatch || weekdayMatch;
        const matches = minuteMatch && hourMatch && monthMatch && dayConstraintMatch;
        return {
            matches,
            key: matches
                ? `${this.safeTimezone(timezone)}:${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}:${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
                : null,
        };
    }
    getNextRunAt(cadence, timezone, fromDate = new Date()) {
        const normalized = this.normalizeCronExpression(cadence);
        if (!normalized || normalized === 'manual')
            return null;
        const probe = new Date(fromDate.getTime());
        probe.setSeconds(0, 0);
        probe.setMinutes(probe.getMinutes() + 1);
        const maxIterations = 60 * 24 * 31;
        for (let i = 0; i < maxIterations; i += 1) {
            const slot = this.getScheduleSlot(probe, normalized, timezone);
            if (slot.matches) {
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
        return {
            year: getNumber('year'),
            month: getNumber('month'),
            day: getNumber('day'),
            hour: getNumber('hour'),
            minute: getNumber('minute'),
            weekday: this.weekdayNameMap()[weekdayName] ?? 0,
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
            if (start === null || end === null || start > end)
                return false;
            if (start < min || end > max || value < start || value > end)
                return false;
            return (value - start) % step === 0;
        }
        const single = this.parseCronToken(rangeToken, names, normalizeSevenToZero);
        if (single === null || single < min || single > max)
            return false;
        return value === single;
    }
    parseCronToken(token, names, normalizeSevenToZero = false) {
        const cleaned = String(token || '')
            .trim()
            .toLowerCase();
        if (!cleaned)
            return null;
        if (names && cleaned in names)
            return names[cleaned];
        const parsed = Number.parseInt(cleaned, 10);
        if (!Number.isFinite(parsed))
            return null;
        if (normalizeSevenToZero && parsed === 7)
            return 0;
        return parsed;
    }
    resolveRepoRoot() {
        const marker = path_1.default.join('data', 'protocols', 'chronological-process-catalog.json');
        let current = process.cwd();
        for (let i = 0; i < 8; i += 1) {
            if ((0, fs_1.existsSync)(path_1.default.join(current, marker))) {
                return current;
            }
            const next = path_1.default.dirname(current);
            if (next === current)
                break;
            current = next;
        }
        return process.cwd();
    }
    checkForStaleScheduledProcesses() {
        const now = Date.now();
        for (const [processId, process] of this.scheduledProcesses) {
            const isStale = now - process.lastHeartbeat > this.config.SUPER_CYCLE_STALE_THRESHOLD;
            if (isStale && !process.stale) {
                process.stale = true;
                process.status = 'stalled';
                this.log('warn', 'SUPER-CYCLE', `Scheduled process stale: ${processId}`, {
                    processId,
                    ageMs: now - process.lastHeartbeat,
                });
                void this.emitActivityEvent('super_cycle_process_stale', `Scheduled process ${processId} marked stale`, {
                    processId,
                    ageMs: now - process.lastHeartbeat,
                    staleThresholdMs: this.config.SUPER_CYCLE_STALE_THRESHOLD,
                    intendedIntervalMs: process.intendedIntervalMs || null,
                    intervalSource: process.intervalSource || 'inferred',
                    intervalExact: Boolean(process.intervalExact),
                    lastRunAt: process.lastRunAt ? new Date(process.lastRunAt).toISOString() : null,
                    nextExpectedAt: process.nextExpectedAt
                        ? new Date(process.nextExpectedAt).toISOString()
                        : null,
                });
                const processChannel = process.metadata?.channel || 'General';
                const prompt = `⏱️ [SELF-PROMPT] Scheduled process ${processId} is stale. Resume heartbeat and continue next actionable step immediately.`;
                // Removed broadcastToChannel as it's a RelayConnectionManager concern, not SuperCycleSchedulerService
                void this.selfPromptService.emitSelfPrompt({
                    kind: 'process-stall',
                    channel: processChannel,
                    prompt,
                    reason: 'scheduled_process_stalled',
                    targetProcessId: processId,
                    metadata: {
                        ageMs: now - process.lastHeartbeat,
                        staleThresholdMs: this.config.SUPER_CYCLE_STALE_THRESHOLD,
                        processStatus: process.status,
                    },
                });
            }
        }
    }
    getSuperCycleStats() {
        const processes = Array.from(this.scheduledProcesses.values());
        return {
            total: processes.length,
            healthy: processes.filter((p) => !p.stale).length,
            stale: processes.filter((p) => p.stale).length,
        };
    }
    async persistSuperCycleState(now) {
        if (!this.redisClient.rawRedisClient && !this.redisClient.rawUpstashClient)
            return;
        const processes = Array.from(this.scheduledProcesses.values()).sort((a, b) => a.processId.localeCompare(b.processId));
        const statePayload = JSON.stringify({
            lastUpdated: now,
            staleThresholdMs: this.config.SUPER_CYCLE_STALE_THRESHOLD,
            stats: this.getSuperCycleStats(),
            processes,
        });
        await this.redisClient.hset(this.config.REDIS_KEYS.STATE, 'superCycle', statePayload);
        const processState = {};
        for (const process of processes) {
            processState[process.processId] = JSON.stringify(process);
        }
        await this.redisClient.del(this.config.REDIS_KEYS.SUPER_CYCLE);
        if (Object.keys(processState).length > 0) {
            await this.redisClient.hset(this.config.REDIS_KEYS.SUPER_CYCLE, processState);
        }
    }
    handleSuperCycleRegistration(msg) {
        const payload = msg.payload || {};
        const processId = payload.processId || payload.name || msg.source;
        if (!processId)
            return;
        const existing = this.scheduledProcesses.get(processId);
        const now = Date.now();
        const metadata = { ...(existing?.metadata || {}), ...(payload.metadata || {}) };
        const lastHeartbeat = this.parseTimestampMs(payload.lastHeartbeat) || now;
        const lastRunAt = this.parseTimestampMs(payload.lastRunAt) || existing?.lastRunAt;
        const interval = this.resolveScheduledProcessInterval(payload, metadata, existing);
        const nextExpectedAt = this.resolveNextExpectedAt(payload, lastRunAt || lastHeartbeat, interval.intendedIntervalMs) || existing?.nextExpectedAt;
        const next = {
            processId,
            name: payload.name || existing?.name || processId,
            kind: payload.kind || existing?.kind || 'scheduled-job',
            owner: payload.owner || existing?.owner || 'unknown',
            status: payload.status || existing?.status || 'registered',
            registeredAt: existing?.registeredAt || now,
            lastHeartbeat,
            lastRunAt,
            lastResult: payload.lastResult || existing?.lastResult,
            intendedIntervalMs: interval.intendedIntervalMs,
            intervalSource: interval.intervalSource,
            intervalExact: interval.intervalExact,
            nextExpectedAt,
            metadata,
            stale: false,
            heartbeatCount: (existing?.heartbeatCount || 0) + 1,
        };
        this.scheduledProcesses.set(processId, next);
        this.log('info', 'SUPER-CYCLE', `Registered process ${processId}`, {
            processId,
            kind: next.kind,
            owner: next.owner,
        });
        void this.emitActivityEvent('super_cycle_process_registered', `Registered scheduled process ${processId}`, {
            processId,
            status: next.status,
            kind: next.kind,
            owner: next.owner,
            intendedIntervalMs: next.intendedIntervalMs || null,
            intervalSource: next.intervalSource || 'inferred',
            intervalExact: Boolean(next.intervalExact),
            lastRunAt: next.lastRunAt ? new Date(next.lastRunAt).toISOString() : null,
            nextExpectedAt: next.nextExpectedAt ? new Date(next.nextExpectedAt).toISOString() : null,
        });
    }
    handleSuperCycleHeartbeat(msg) {
        const payload = msg.payload || {};
        const processId = payload.processId || payload.name || msg.source;
        if (!processId)
            return;
        const existing = this.scheduledProcesses.get(processId);
        if (!existing) {
            this.handleSuperCycleRegistration({
                ...msg,
                payload: { ...payload, processId, status: payload.status || 'running' },
            });
            return;
        }
        const metadata = { ...existing.metadata, ...(payload.metadata || {}) };
        const interval = this.resolveScheduledProcessInterval(payload, metadata, existing);
        const heartbeatTimestamp = this.parseTimestampMs(payload.lastHeartbeat) || Date.now();
        const lastRunAt = this.parseTimestampMs(payload.lastRunAt) || existing.lastRunAt;
        const nextExpectedAt = this.resolveNextExpectedAt(payload, lastRunAt || heartbeatTimestamp, interval.intendedIntervalMs || existing.intendedIntervalMs) || existing.nextExpectedAt;
        existing.lastHeartbeat = heartbeatTimestamp;
        existing.status = payload.status || existing.status || 'running';
        existing.lastRunAt = lastRunAt;
        existing.lastResult = payload.lastResult || existing.lastResult;
        existing.intendedIntervalMs = interval.intendedIntervalMs || existing.intendedIntervalMs;
        existing.intervalSource = interval.intervalSource;
        existing.intervalExact = interval.intervalExact;
        existing.nextExpectedAt = nextExpectedAt;
        existing.metadata = metadata;
        existing.stale = false;
        existing.heartbeatCount += 1;
        void this.emitActivityEvent('super_cycle_process_heartbeat', `Heartbeat for ${processId}`, {
            processId,
            status: existing.status,
            heartbeatCount: existing.heartbeatCount,
            intendedIntervalMs: existing.intendedIntervalMs || null,
            intervalSource: existing.intervalSource || 'inferred',
            intervalExact: Boolean(existing.intervalExact),
            lastRunAt: existing.lastRunAt ? new Date(existing.lastRunAt).toISOString() : null,
            nextExpectedAt: existing.nextExpectedAt
                ? new Date(existing.nextExpectedAt).toISOString()
                : null,
            lastResult: existing.lastResult || null,
        });
    }
    handleSuperCycleUnregister(msg) {
        const payload = msg.payload || {};
        const processId = payload.processId || payload.name || msg.source;
        if (!processId)
            return;
        const existing = this.scheduledProcesses.get(processId);
        if (this.scheduledProcesses.delete(processId)) {
            this.log('info', 'SUPER-CYCLE', `Unregistered process ${processId}`, { processId });
            void this.emitActivityEvent('super_cycle_process_unregistered', `Unregistered scheduled process ${processId}`, {
                processId,
                intendedIntervalMs: existing?.intendedIntervalMs || null,
                intervalSource: existing?.intervalSource || 'inferred',
                intervalExact: Boolean(existing?.intervalExact),
                lastRunAt: existing?.lastRunAt ? new Date(existing.lastRunAt).toISOString() : null,
                nextExpectedAt: existing?.nextExpectedAt
                    ? new Date(existing.nextExpectedAt).toISOString()
                    : null,
                finalStatus: existing?.status || payload.status || 'unknown',
            });
        }
    }
    async shutdown() {
        this.log('info', 'SUPER-CYCLE', 'Shutting down Super Cycle Scheduler...');
        if (this.chronologicalPollingInterval) {
            clearInterval(this.chronologicalPollingInterval);
            this.chronologicalPollingInterval = null;
        }
        // Any other cleanup for SuperCycleSchedulerService can go here
    }
    parseTimestampMs(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return value;
        }
        if (typeof value === 'string') {
            const isoValue = Date.parse(value);
            if (Number.isFinite(isoValue) && isoValue > 0)
                return isoValue;
            const numericValue = Number.parseInt(value, 10);
            if (Number.isFinite(numericValue) && numericValue > 0)
                return numericValue;
        }
        return undefined;
    }
    readCadenceMs(source) {
        if (!source || typeof source !== 'object')
            return undefined;
        const valueMs = Number(source.intendedIntervalMs ||
            source.expectedIntervalMs ||
            source.intervalMs ||
            source.heartbeatIntervalMs ||
            0);
        if (Number.isFinite(valueMs) && valueMs > 0)
            return valueMs;
        const valueSeconds = Number(source.intendedIntervalSeconds ||
            source.intervalSeconds ||
            source.heartbeatIntervalSeconds ||
            source.cadenceSeconds ||
            0);
        if (Number.isFinite(valueSeconds) && valueSeconds > 0)
            return valueSeconds * 1000;
        return undefined;
    }
    resolveScheduledProcessInterval(payload, metadata, existing) {
        const producerInterval = this.readCadenceMs(payload);
        if (producerInterval) {
            return {
                intendedIntervalMs: producerInterval,
                intervalSource: 'producer',
                intervalExact: true,
            };
        }
        const metadataInterval = this.readCadenceMs(metadata);
        if (metadataInterval) {
            return {
                intendedIntervalMs: metadataInterval,
                intervalSource: 'metadata',
                intervalExact: true,
            };
        }
        if (existing?.intendedIntervalMs) {
            return {
                intendedIntervalMs: existing.intendedIntervalMs,
                intervalSource: existing.intervalSource || 'inferred',
                intervalExact: Boolean(existing.intervalExact),
            };
        }
        return {
            intendedIntervalMs: undefined,
            intervalSource: 'inferred',
            intervalExact: false,
        };
    }
    resolveNextExpectedAt(payload, anchorMs, intervalMs) {
        const explicit = this.parseTimestampMs(payload.nextExpectedAt);
        if (explicit)
            return explicit;
        if (anchorMs && intervalMs && intervalMs > 0) {
            return anchorMs + intervalMs;
        }
        return undefined;
    }
}
exports.SuperCycleSchedulerService = SuperCycleSchedulerService;
//# sourceMappingURL=super-cycle-scheduler.service.js.map