// @ts-nocheck — recovered from dist; types restored incrementally
/**
 * DurableTaskService — Phase 1 local durable task runtime.
 *
 * Authority: docs/protocols/TNF_DURABLE_TASK_EXECUTION_PROTOCOL.md
 *
 * File-backed under ~/.tnf/durable-tasks/ (same local-first pattern as
 * CronService / WebhookService). Not a Trigger.dev SDK clone — TNF nouns only.
 *
 * Compatibility: NEVER use ~/.tnf/tasks — that path is the EcosystemHydration
 * handoff/scout work-item slice. DurableTask state stays under durable-tasks/.
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runDesignAgent, runGenerateSpec } from './DurableAiHandlers.js';
const DEFAULT_RETRY = {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 50,
    maxTimeoutInMs: 5_000,
    randomize: false,
};
function nowIso() {
    return new Date().toISOString();
}
function newId(prefix) {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class DurableTaskService {
    constructor(rootDir) {
        this.root = path.resolve(rootDir || path.join(os.homedir(), '.tnf', 'durable-tasks'));
        const forbidden = path.resolve(path.join(os.homedir(), '.tnf', 'tasks'));
        if (this.root === forbidden) {
            throw new Error('DurableTask store must not use ~/.tnf/tasks (reserved for EcosystemHydration handoff/scout tasks). Use ~/.tnf/durable-tasks instead.');
        }
        this.tasksPath = path.join(this.root, 'tasks.json');
        this.runsPath = path.join(this.root, 'runs.json');
        this.waitsPath = path.join(this.root, 'wait-tokens.json');
        this.tokensPath = path.join(this.root, 'public-run-tokens.json');
        this.idempotencyPath = path.join(this.root, 'idempotency.json');
        this.eventsPath = path.join(this.root, 'run-events.jsonl');
        this.sessionsPath = path.join(this.root, 'sessions.json');
        this.schedulesPath = path.join(this.root, 'schedules.json');
        this.deploymentsPath = path.join(this.root, 'deployments.json');
        this.steeringPath = path.join(this.root, 'steering.json');
        this.artifactsDir = path.join(this.root, 'artifacts');
        fs.mkdirSync(this.root, { recursive: true });
        fs.mkdirSync(this.artifactsDir, { recursive: true });
    }
    /** Test helper: wipe all durable-task state under this root. */
    resetForTests() {
        fs.mkdirSync(this.root, { recursive: true });
        fs.mkdirSync(this.artifactsDir, { recursive: true });
        for (const p of [
            this.tasksPath,
            this.runsPath,
            this.waitsPath,
            this.tokensPath,
            this.idempotencyPath,
            this.eventsPath,
            this.sessionsPath,
            this.schedulesPath,
            this.deploymentsPath,
            this.steeringPath,
        ]) {
            if (fs.existsSync(p))
                fs.unlinkSync(p);
        }
    }
    readJson(filePath, fallback) {
        if (!fs.existsSync(filePath))
            return fallback;
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        catch {
            return fallback;
        }
    }
    writeJson(filePath, value) {
        const tmp = `${filePath}.${process.pid}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
        fs.renameSync(tmp, filePath);
    }
    readTasks() {
        return this.readJson(this.tasksPath, []);
    }
    writeTasks(tasks) {
        this.writeJson(this.tasksPath, tasks);
    }
    readRuns() {
        return this.readJson(this.runsPath, []);
    }
    writeRuns(runs) {
        this.writeJson(this.runsPath, runs);
    }
    readWaits() {
        return this.readJson(this.waitsPath, []);
    }
    writeWaits(waits) {
        this.writeJson(this.waitsPath, waits);
    }
    readPublicTokens() {
        return this.readJson(this.tokensPath, []);
    }
    writePublicTokens(tokens) {
        this.writeJson(this.tokensPath, tokens);
    }
    readIdempotency() {
        return this.readJson(this.idempotencyPath, []);
    }
    writeIdempotency(rows) {
        this.writeJson(this.idempotencyPath, rows);
    }
    defineTask(input) {
        const id = input.id.trim();
        if (!id)
            throw new Error('task id required');
        if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id)) {
            throw new Error('task id must be alphanumeric with ._-:');
        }
        const tasks = this.readTasks();
        const existing = tasks.find((t) => t.id === id);
        const version = existing ? existing.version + 1 : 1;
        const def = {
            id,
            version,
            handler: input.handler || existing?.handler || 'echo',
            description: input.description ?? existing?.description,
            retry: { ...DEFAULT_RETRY, ...(existing?.retry || {}), ...(input.retry || {}) },
            queue: {
                name: input.queueName || existing?.queue.name || 'default',
                concurrencyLimit: input.concurrencyLimit ?? existing?.queue.concurrencyLimit ?? 5,
            },
            machine: input.machine || existing?.machine || 'small',
            deployedVersion: existing?.deployedVersion ?? version,
            createdAt: existing?.createdAt || nowIso(),
            updatedAt: nowIso(),
        };
        if (existing) {
            Object.assign(existing, def);
        }
        else {
            tasks.push(def);
        }
        this.writeTasks(tasks);
        this.appendEvent({
            runId: '',
            type: 'task.defined',
            data: { taskId: id, version },
        });
        return def;
    }
    /** Register Ghost AI design + spec tasks if missing (no unnecessary version bump). */
    ensureGhostAiTasks() {
        const out = [];
        for (const [id, handler, description] of [
            ['design-agent', 'design-agent', 'Ghost AI design agent (tool-per-mutation canvas)'],
            ['generate-spec', 'generate-spec', 'Ghost AI tech-spec generator (markdown artifact)'],
        ]) {
            const existing = this.getTask(id);
            if (existing && existing.handler === handler) {
                out.push(existing);
                continue;
            }
            out.push(this.defineTask({ id, handler, description, queueName: 'ai', concurrencyLimit: 3, machine: 'medium' }));
        }
        return out;
    }
    listTasks() {
        return this.readTasks().sort((a, b) => a.id.localeCompare(b.id));
    }
    getTask(id) {
        return this.readTasks().find((t) => t.id === id);
    }
    mintPublicRunToken(runId, scopes = ['read']) {
        const token = `prt_${crypto.randomBytes(16).toString('hex')}`;
        const row = {
            token,
            runId,
            scopes,
            createdAt: nowIso(),
        };
        const tokens = this.readPublicTokens();
        tokens.push(row);
        this.writePublicTokens(tokens);
        const runs = this.readRuns();
        const run = runs.find((r) => r.id === runId);
        if (run) {
            run.publicTokenHash = crypto.createHash('sha256').update(token).digest('hex');
            run.updatedAt = nowIso();
            this.writeRuns(runs);
        }
        return row;
    }
    resolvePublicRunToken(token) {
        const row = this.readPublicTokens().find((t) => t.token === token);
        if (!row)
            return undefined;
        return this.getRun(row.runId);
    }
    trigger(taskId, payload = {}, ownership = {}) {
        const task = this.getTask(taskId);
        if (!task)
            throw new Error(`Unknown DurableTask: ${taskId}`);
        const pinVersion = task.deployedVersion ?? task.version;
        const run = {
            id: newId('run'),
            taskId: task.id,
            taskVersion: pinVersion,
            status: 'QUEUED',
            payload,
            attempt: 0,
            ownership,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        const runs = this.readRuns();
        runs.push(run);
        this.writeRuns(runs);
        this.appendEvent({
            runId: run.id,
            type: 'run.queued',
            data: { taskId: task.id, taskVersion: pinVersion },
        });
        const publicToken = this.mintPublicRunToken(run.id);
        return { run: this.getRun(run.id), publicRunToken: publicToken.token };
    }
    /** Batch enqueue (Trigger batch parody; local cap 1000). */
    triggerBatch(taskId, payloads, ownership = {}) {
        if (payloads.length > 1000)
            throw new Error('batch limit is 1000');
        return payloads.map((p) => this.trigger(taskId, p, ownership));
    }
    /** Replay a prior run with the same payload (new run id; pins current deployed version). */
    replayRun(runId) {
        const prior = this.getRun(runId);
        if (!prior)
            throw new Error(`Unknown run: ${runId}`);
        return this.trigger(prior.taskId, { ...prior.payload }, { ...prior.ownership });
    }
    listRuns(filter = {}) {
        return this.readRuns()
            .filter((r) => (filter.taskId ? r.taskId === filter.taskId : true))
            .filter((r) => (filter.status ? r.status === filter.status : true))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    getRun(runId) {
        return this.readRuns().find((r) => r.id === runId);
    }
    cancelRun(runId) {
        const runs = this.readRuns();
        const run = runs.find((r) => r.id === runId);
        if (!run)
            throw new Error(`Unknown run: ${runId}`);
        if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
            return run;
        }
        run.status = 'CANCELLED';
        run.updatedAt = nowIso();
        run.completedAt = nowIso();
        this.writeRuns(runs);
        this.appendEvent({ runId, type: 'run.cancelled' });
        return run;
    }
    appendEvent(input) {
        const seq = this.nextEventSeq();
        const ev = {
            seq,
            runId: input.runId,
            type: input.type,
            at: nowIso(),
            data: input.data,
        };
        fs.appendFileSync(this.eventsPath, `${JSON.stringify(ev)}\n`, 'utf8');
        return ev;
    }
    nextEventSeq() {
        if (!fs.existsSync(this.eventsPath))
            return 1;
        const lines = fs.readFileSync(this.eventsPath, 'utf8').split('\n').filter(Boolean);
        if (lines.length === 0)
            return 1;
        try {
            const last = JSON.parse(lines[lines.length - 1]);
            return (last.seq || lines.length) + 1;
        }
        catch {
            return lines.length + 1;
        }
    }
    listRunEvents(runId, sinceSeq = 0) {
        if (!fs.existsSync(this.eventsPath))
            return [];
        const out = [];
        for (const line of fs.readFileSync(this.eventsPath, 'utf8').split('\n')) {
            if (!line.trim())
                continue;
            try {
                const ev = JSON.parse(line);
                if (ev.runId === runId && ev.seq > sinceSeq)
                    out.push(ev);
            }
            catch {
                /* skip */
            }
        }
        return out;
    }
    /** TRQL-lite: space-separated filters like status:COMPLETED taskId:demo limit:20 */
    queryRuns(trql) {
        const parts = trql.trim().split(/\s+/).filter(Boolean);
        let runs = this.readRuns();
        let limit = 100;
        for (const part of parts) {
            const [k, ...rest] = part.split(':');
            const v = rest.join(':');
            if (k === 'status')
                runs = runs.filter((r) => r.status === v);
            else if (k === 'taskId' || k === 'task')
                runs = runs.filter((r) => r.taskId === v);
            else if (k === 'userId')
                runs = runs.filter((r) => r.ownership.userId === v);
            else if (k === 'projectId')
                runs = runs.filter((r) => r.ownership.projectId === v);
            else if (k === 'limit')
                limit = Math.max(1, Number(v) || 100);
        }
        return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    }
    deployTask(taskId, env = 'local') {
        const tasks = this.readTasks();
        const task = tasks.find((t) => t.id === taskId);
        if (!task)
            throw new Error(`Unknown DurableTask: ${taskId}`);
        task.deployedVersion = task.version;
        task.updatedAt = nowIso();
        this.writeTasks(tasks);
        const row = {
            taskId,
            version: task.version,
            env,
            deployedAt: nowIso(),
        };
        const rows = this.readJson(this.deploymentsPath, []);
        rows.push(row);
        this.writeJson(this.deploymentsPath, rows);
        this.appendEvent({
            runId: '',
            type: 'task.deployed',
            data: { taskId, version: task.version, env },
        });
        return row;
    }
    listDeployments(taskId) {
        const rows = this.readJson(this.deploymentsPath, []);
        return taskId ? rows.filter((r) => r.taskId === taskId) : rows;
    }
    // --- Durable sessions (duplex channel; not SessionManager chat transcripts) ---
    createSession(channel = 'default') {
        const session = {
            id: newId('dsess'),
            channel,
            status: 'open',
            messages: [],
            runIds: [],
            createdAt: nowIso(),
            updatedAt: nowIso(),
        };
        const all = this.readJson(this.sessionsPath, []);
        all.push(session);
        this.writeJson(this.sessionsPath, all);
        return session;
    }
    getSession(id) {
        return this.readJson(this.sessionsPath, []).find((s) => s.id === id);
    }
    listSessions() {
        return this.readJson(this.sessionsPath, []);
    }
    appendSessionMessage(sessionId, role, content) {
        const all = this.readJson(this.sessionsPath, []);
        const session = all.find((s) => s.id === sessionId);
        if (!session)
            throw new Error(`Unknown durable session: ${sessionId}`);
        if (session.status === 'closed')
            throw new Error('session closed');
        session.messages.push({ role, content, at: nowIso() });
        session.updatedAt = nowIso();
        this.writeJson(this.sessionsPath, all);
        return session;
    }
    suspendSession(sessionId) {
        const all = this.readJson(this.sessionsPath, []);
        const session = all.find((s) => s.id === sessionId);
        if (!session)
            throw new Error(`Unknown durable session: ${sessionId}`);
        session.status = 'suspended';
        session.updatedAt = nowIso();
        this.writeJson(this.sessionsPath, all);
        return session;
    }
    resumeSession(sessionId) {
        const all = this.readJson(this.sessionsPath, []);
        const session = all.find((s) => s.id === sessionId);
        if (!session)
            throw new Error(`Unknown durable session: ${sessionId}`);
        session.status = 'open';
        session.updatedAt = nowIso();
        this.writeJson(this.sessionsPath, all);
        return session;
    }
    linkSessionRun(sessionId, runId) {
        const all = this.readJson(this.sessionsPath, []);
        const session = all.find((s) => s.id === sessionId);
        if (!session)
            throw new Error(`Unknown durable session: ${sessionId}`);
        if (!session.runIds.includes(runId))
            session.runIds.push(runId);
        session.updatedAt = nowIso();
        this.writeJson(this.sessionsPath, all);
        return session;
    }
    /** Mid-run steering input (Trigger input-stream parody). */
    steerRun(runId, message) {
        const run = this.getRun(runId);
        if (!run)
            throw new Error(`Unknown run: ${runId}`);
        if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
            throw new Error('cannot steer terminal run');
        }
        const map = this.readJson(this.steeringPath, {});
        map[runId] = map[runId] || [];
        map[runId].push(message);
        this.writeJson(this.steeringPath, map);
        this.appendEvent({ runId, type: 'run.steer', data: { message } });
    }
    consumeSteering(runId) {
        const map = this.readJson(this.steeringPath, {});
        const msgs = map[runId] || [];
        if (msgs.length) {
            delete map[runId];
            this.writeJson(this.steeringPath, map);
        }
        return msgs;
    }
    // --- Interval schedules (CronService remains shell-command ledger; this is DurableTask-native) ---
    addSchedule(input) {
        if (!this.getTask(input.taskId))
            throw new Error(`Unknown DurableTask: ${input.taskId}`);
        const all = this.readJson(this.schedulesPath, []);
        if (all.find((s) => s.id === input.id))
            throw new Error(`Schedule exists: ${input.id}`);
        const row = {
            id: input.id,
            taskId: input.taskId,
            everyMs: Math.max(1000, input.everyMs),
            payload: input.payload,
            enabled: input.enabled !== false,
            createdAt: nowIso(),
        };
        all.push(row);
        this.writeJson(this.schedulesPath, all);
        return row;
    }
    listSchedules() {
        return this.readJson(this.schedulesPath, []);
    }
    /** Fire due schedules; returns triggered run ids. */
    fireDueSchedules(now = Date.now()) {
        const all = this.readJson(this.schedulesPath, []);
        const fired = [];
        let changed = false;
        for (const s of all) {
            if (!s.enabled)
                continue;
            const last = s.lastFiredAt ? Date.parse(s.lastFiredAt) : 0;
            if (now - last < s.everyMs)
                continue;
            const result = this.trigger(s.taskId, { ...(s.payload || {}), _scheduleId: s.id });
            s.lastFiredAt = nowIso();
            fired.push(result.run.id);
            changed = true;
        }
        if (changed)
            this.writeJson(this.schedulesPath, all);
        return fired;
    }
    /**
     * Bridge: register a CronService job whose command triggers a DurableTask.
     * Does not replace CronService — writes via optional callback or returns the command string.
     */
    cronCommandForTask(taskId, payload = {}) {
        const p = JSON.stringify(payload).replace(/'/g, `'\\''`);
        return `tnf durable-tasks trigger ${taskId} --payload '${p}'`;
    }
    createWaitToken(options = {}) {
        const id = newId('wait');
        const publicToken = `wpt_${crypto.randomBytes(12).toString('hex')}`;
        const token = {
            id,
            status: 'WAITING',
            publicToken,
            callbackPath: `/durable-tasks/wait-tokens/${id}/complete`,
            createdAt: nowIso(),
            tags: options.tags,
            timeoutAt: options.timeoutMs && options.timeoutMs > 0
                ? new Date(Date.now() + options.timeoutMs).toISOString()
                : undefined,
        };
        const waits = this.readWaits();
        waits.push(token);
        this.writeWaits(waits);
        return token;
    }
    completeWaitToken(tokenId, data = {}, auth) {
        const waits = this.readWaits();
        const token = waits.find((w) => w.id === tokenId);
        if (!token)
            throw new Error(`Unknown wait token: ${tokenId}`);
        if (auth?.publicToken && auth.publicToken !== token.publicToken) {
            throw new Error('Invalid wait public token');
        }
        if (token.status === 'COMPLETED')
            return token;
        token.status = 'COMPLETED';
        token.output = data;
        token.completedAt = nowIso();
        this.writeWaits(waits);
        // Resume any WAITING runs blocked on this token
        const runs = this.readRuns();
        let changed = false;
        for (const run of runs) {
            if (run.status === 'WAITING' && run.waitTokenId === tokenId) {
                run.waitResult = data;
                run.status = 'QUEUED';
                run.updatedAt = nowIso();
                changed = true;
            }
        }
        if (changed)
            this.writeRuns(runs);
        return token;
    }
    getWaitToken(tokenId) {
        return this.readWaits().find((w) => w.id === tokenId);
    }
    putIdempotent(key, runId, output) {
        const rows = this.readIdempotency().filter((r) => r.key !== key);
        rows.push({ key, runId, output, createdAt: nowIso() });
        this.writeIdempotency(rows);
    }
    getIdempotent(key) {
        return this.readIdempotency().find((r) => r.key === key);
    }
    executingCount(queueName) {
        const tasks = this.readTasks();
        const taskIds = new Set(tasks.filter((t) => t.queue.name === queueName).map((t) => t.id));
        return this.readRuns().filter((r) => r.status === 'EXECUTING' && taskIds.has(r.taskId)).length;
    }
    nextRetryDelay(task, attempt) {
        const { factor, minTimeoutInMs, maxTimeoutInMs, randomize } = task.retry;
        let delay = minTimeoutInMs * Math.pow(factor, Math.max(0, attempt - 1));
        delay = Math.min(delay, maxTimeoutInMs);
        if (randomize)
            delay = delay * (0.5 + Math.random());
        return Math.floor(delay);
    }
    async executeHandler(task, run) {
        const handler = task.handler;
        const payload = { ...run.payload };
        if (run.waitResult !== undefined) {
            // Resuming after wait — treat as success carrying wait result unless handler says otherwise
            if (handler === 'wait-token' || handler.startsWith('wait-token')) {
                return { kind: 'ok', output: { resumed: true, waitResult: run.waitResult, payload } };
            }
        }
        try {
            if (handler === 'echo') {
                return { kind: 'ok', output: { echo: payload } };
            }
            if (handler === 'fail') {
                return { kind: 'fail', error: 'builtin fail handler' };
            }
            if (handler === 'fail-once') {
                if (run.attempt <= 1)
                    return { kind: 'fail', error: 'fail-once: deliberate first failure' };
                return { kind: 'ok', output: { recovered: true, attempt: run.attempt } };
            }
            if (handler.startsWith('sleep:')) {
                const ms = Number(handler.slice('sleep:'.length)) || 0;
                await sleep(Math.max(0, Math.min(ms, 60_000)));
                return { kind: 'ok', output: { sleptMs: ms } };
            }
            if (handler === 'wait-token' || handler.startsWith('wait-token')) {
                if (run.waitResult !== undefined) {
                    return { kind: 'ok', output: { waitResult: run.waitResult } };
                }
                const timeoutMs = Number(payload.timeoutMs) || 60_000;
                const token = this.createWaitToken({ timeoutMs, tags: ['auto', run.taskId] });
                return { kind: 'wait', tokenId: token.id };
            }
            if (handler.startsWith('idempotent:')) {
                const key = String(payload.idempotencyKey || handler.slice('idempotent:'.length));
                const cached = this.getIdempotent(key);
                if (cached)
                    return { kind: 'ok', output: { cached: true, value: cached.output } };
                const value = { computedAt: nowIso(), payload };
                this.putIdempotent(key, run.id, value);
                return { kind: 'ok', output: { cached: false, value } };
            }
            if (handler === 'design-agent') {
                const steered = this.consumeSteering(run.id);
                const out = runDesignAgent({
                    prompt: String(payload.prompt || payload.message || 'Untitled design'),
                    roomId: payload.roomId ? String(payload.roomId) : undefined,
                    projectId: payload.projectId
                        ? String(payload.projectId)
                        : run.ownership.projectId,
                    nodes: Array.isArray(payload.nodes)
                        ? payload.nodes
                        : undefined,
                    edges: Array.isArray(payload.edges)
                        ? payload.edges
                        : undefined,
                    artifactsDir: this.artifactsDir,
                });
                if (steered.length) {
                    out.steeringConsumed = steered;
                }
                // Default: materialize into builder graph store (opt-out with applyToBuilder:false)
                const applyToBuilder = payload.applyToBuilder !== false;
                if (applyToBuilder) {
                    const { WorkflowGraphBridge } = await import('./WorkflowGraphBridge.js');
                    const bridge = new WorkflowGraphBridge();
                    const applied = await bridge.applyDesignAndSync({
                        prompt: out.prompt,
                        projectId: out.projectId,
                        roomId: out.roomId,
                        toolCalls: out.toolCalls,
                        workflowSpec: out.workflowSpec,
                        workflowId: payload.workflowId ? String(payload.workflowId) : undefined,
                        name: out.workflowSpec.name,
                        description: out.workflowSpec.description,
                        syncApi: payload.syncApi === true ||
                            process.env.TNF_DURABLE_SYNC_WORKFLOW_API === '1' ||
                            process.env.TNF_DURABLE_SYNC_WORKFLOW_API === 'true',
                    });
                    out.appliedWorkflow = {
                        id: applied.graph.id,
                        name: applied.graph.name,
                        builderPath: applied.builderPath,
                        nodeCount: applied.graph.nodes.length,
                        edgeCount: applied.graph.edges.length,
                    };
                    out.apiSync = applied.apiSync;
                    out.collabEvents.push({
                        feed: 'workflow-builder',
                        type: 'applied',
                        at: new Date().toISOString(),
                        payload: {
                            ...out.appliedWorkflow,
                            apiSynced: applied.apiSynced,
                            apiId: applied.apiId,
                        },
                    });
                }
                this.appendEvent({
                    runId: run.id,
                    type: 'design.toolCalls',
                    data: {
                        count: out.toolCalls.length,
                        workflowId: out.appliedWorkflow?.id,
                        builderPath: out.appliedWorkflow?.builderPath,
                    },
                });
                return { kind: 'ok', output: out };
            }
            if (handler === 'generate-spec') {
                const out = runGenerateSpec({
                    projectId: payload.projectId
                        ? String(payload.projectId)
                        : run.ownership.projectId,
                    roomId: payload.roomId ? String(payload.roomId) : undefined,
                    title: payload.title ? String(payload.title) : undefined,
                    chatHistory: Array.isArray(payload.chatHistory)
                        ? payload.chatHistory
                        : undefined,
                    nodes: Array.isArray(payload.nodes)
                        ? payload.nodes
                        : undefined,
                    edges: Array.isArray(payload.edges)
                        ? payload.edges
                        : undefined,
                    artifactsDir: this.artifactsDir,
                });
                this.appendEvent({
                    runId: run.id,
                    type: 'spec.written',
                    data: { artifactPath: out.artifactPath },
                });
                return { kind: 'ok', output: out };
            }
            return { kind: 'fail', error: `Unknown handler: ${handler}` };
        }
        catch (err) {
            return { kind: 'fail', error: err?.message || String(err) };
        }
    }
    /** Process wait timeouts → TIMED_OUT and fail attached runs. */
    reapTimedOutWaits() {
        const waits = this.readWaits();
        const now = Date.now();
        let n = 0;
        for (const w of waits) {
            if (w.status !== 'WAITING' || !w.timeoutAt)
                continue;
            if (Date.parse(w.timeoutAt) > now)
                continue;
            w.status = 'TIMED_OUT';
            w.completedAt = nowIso();
            n += 1;
            const runs = this.readRuns();
            for (const run of runs) {
                if (run.status === 'WAITING' && run.waitTokenId === w.id) {
                    run.status = 'FAILED';
                    run.error = `Wait token timed out: ${w.id}`;
                    run.completedAt = nowIso();
                    run.updatedAt = nowIso();
                }
            }
            this.writeRuns(runs);
        }
        if (n)
            this.writeWaits(waits);
        return n;
    }
    /**
     * Process up to `limit` queued runs once. Returns number of runs advanced.
     */
    async tick(limit = 1) {
        this.reapTimedOutWaits();
        this.fireDueSchedules();
        let advanced = 0;
        for (let i = 0; i < limit; i += 1) {
            const did = await this.tickOne();
            if (!did)
                break;
            advanced += 1;
        }
        return advanced;
    }
    async tickOne() {
        const runs = this.readRuns();
        const queued = runs
            .filter((r) => r.status === 'QUEUED')
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        if (queued.length === 0)
            return false;
        for (const candidate of queued) {
            const task = this.getTask(candidate.taskId);
            if (!task) {
                candidate.status = 'FAILED';
                candidate.error = `Task definition missing: ${candidate.taskId}`;
                candidate.completedAt = nowIso();
                candidate.updatedAt = nowIso();
                this.writeRuns(runs);
                return true;
            }
            if (this.executingCount(task.queue.name) >= task.queue.concurrencyLimit) {
                continue;
            }
            // Pin version: use definition version recorded at trigger time for skew awareness
            candidate.status = 'EXECUTING';
            candidate.attempt += 1;
            candidate.startedAt = candidate.startedAt || nowIso();
            candidate.updatedAt = nowIso();
            this.writeRuns(runs);
            this.appendEvent({
                runId: candidate.id,
                type: 'run.executing',
                data: { attempt: candidate.attempt, taskVersion: candidate.taskVersion },
            });
            const result = await this.executeHandler(task, candidate);
            const fresh = this.readRuns();
            const run = fresh.find((r) => r.id === candidate.id);
            if (!run)
                return true;
            if (run.status === 'CANCELLED')
                return true;
            if (result.kind === 'wait') {
                run.status = 'WAITING';
                run.waitTokenId = result.tokenId;
                run.updatedAt = nowIso();
                this.writeRuns(fresh);
                this.appendEvent({
                    runId: run.id,
                    type: 'run.waiting',
                    data: { waitTokenId: result.tokenId },
                });
                return true;
            }
            if (result.kind === 'ok') {
                run.status = 'COMPLETED';
                run.output = result.output;
                run.completedAt = nowIso();
                run.updatedAt = nowIso();
                this.writeRuns(fresh);
                this.appendEvent({ runId: run.id, type: 'run.completed' });
                return true;
            }
            // fail
            if (run.attempt < task.retry.maxAttempts) {
                const delay = this.nextRetryDelay(task, run.attempt);
                run.status = 'QUEUED';
                run.error = result.error;
                run.updatedAt = nowIso();
                this.writeRuns(fresh);
                this.appendEvent({
                    runId: run.id,
                    type: 'run.retry',
                    data: { attempt: run.attempt, error: result.error },
                });
                if (delay > 0)
                    await sleep(delay);
                return true;
            }
            run.status = 'FAILED';
            run.error = result.error;
            run.completedAt = nowIso();
            run.updatedAt = nowIso();
            this.writeRuns(fresh);
            this.appendEvent({
                runId: run.id,
                type: 'run.failed',
                data: { error: result.error },
            });
            return true;
        }
        return false;
    }
    /** Polling worker. Stops when `shouldStop` returns true, or after idleTicks with no work if set. */
    async runWorker(options = {}) {
        const pollMs = options.pollMs ?? 200;
        let idle = 0;
        for (;;) {
            if (options.shouldStop?.())
                return;
            const advanced = await this.tick(1);
            options.onTick?.(advanced);
            if (options.once)
                return;
            if (advanced === 0) {
                idle += 1;
                if (options.idleStopAfter && idle >= options.idleStopAfter)
                    return;
                await sleep(pollMs);
            }
            else {
                idle = 0;
            }
        }
    }
}
