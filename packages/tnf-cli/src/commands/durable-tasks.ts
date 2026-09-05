// @ts-nocheck — recovered from dist; types restored incrementally
/**
 * tnf durable-tasks — Phase 1 DurableTask CLI surface.
 * Authority: docs/protocols/TNF_DURABLE_TASK_EXECUTION_PROTOCOL.md
 *
 * Naming: intentionally NOT `tnf tasks` — that noun is reserved for
 * EcosystemHydration handoff/scout work items under ~/.tnf/tasks and for
 * GoalsService Goal.tasks. Store lives at ~/.tnf/durable-tasks/ only.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DurableTaskService, } from '../services/DurableTaskService.js';
import { getOrCreateCommand } from './_registry.js';
function parseJsonObject(raw, label) {
    if (!raw)
        return {};
    try {
        const value = JSON.parse(raw);
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error(`${label} must be a JSON object`);
        }
        return value;
    }
    catch (err) {
        throw new Error(`${label}: ${err?.message || String(err)}`);
    }
}
function parseTimeoutMs(spec) {
    if (!spec)
        return undefined;
    const m = /^(\d+)(ms|s|m|h)?$/i.exec(spec.trim());
    if (!m)
        throw new Error(`Invalid timeout: ${spec}`);
    const n = Number(m[1]);
    const unit = (m[2] || 'ms').toLowerCase();
    if (unit === 'ms')
        return n;
    if (unit === 's')
        return n * 1000;
    if (unit === 'm')
        return n * 60_000;
    return n * 3_600_000;
}
export function registerDurableTasksCommand(program) {
    const cmd = getOrCreateCommand(program, 'durable-tasks', 'DurableTask runtime — Ghost AI design/spec, waits, HTTP, sessions, batch (Phases 1–6)');
    // Idempotent: cli.ts / splash may call registration more than once.
    if ((cmd.commands?.length ?? 0) > 0) {
        return;
    }
    // Short alias only — never alias as `tasks` (ecosystem / goals collision).
    if (!(cmd.aliases?.() ?? []).includes('dtasks')) {
        cmd.alias('dtasks');
    }
    const serviceFor = (dir) => new DurableTaskService(dir || path.join(os.homedir(), '.tnf', 'durable-tasks'));
    cmd
        .command('define <id>')
        .description('Create or version-bump a DurableTask definition')
        .option('--handler <name>', 'Builtin handler: echo | fail | fail-once | sleep:<ms> | wait-token | idempotent:<key>', 'echo')
        .option('--description <text>', 'Human description')
        .option('--max-attempts <n>', 'Retry max attempts', '3')
        .option('--queue <name>', 'Queue name', 'default')
        .option('--concurrency <n>', 'Queue concurrency limit', '5')
        .option('--machine <preset>', 'Machine preset: small|medium|large', 'small')
        .option('--dir <path>', 'Override durable-tasks store directory')
        .option('--json', 'Machine-readable JSON')
        .action((id, options) => {
        const service = serviceFor(options.dir);
        const def = service.defineTask({
            id,
            handler: options.handler,
            description: options.description,
            retry: { maxAttempts: Number(options.maxAttempts) || 3 },
            queueName: options.queue,
            concurrencyLimit: Number(options.concurrency) || 5,
            machine: options.machine || 'small',
        });
        if (options.json) {
            console.log(JSON.stringify(def, null, 2));
            return;
        }
        console.log(`Defined DurableTask ${def.id} v${def.version} handler=${def.handler} queue=${def.queue.name} concurrency=${def.queue.concurrencyLimit}`);
    });
    cmd
        .command('list')
        .description('List DurableTask definitions')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((options) => {
        const service = serviceFor(options.dir);
        const list = service.listTasks();
        if (options.json) {
            console.log(JSON.stringify(list, null, 2));
            return;
        }
        if (list.length === 0) {
            console.log('No DurableTasks defined. Try: tnf durable-tasks define demo --handler echo');
            return;
        }
        for (const t of list) {
            console.log(`- ${t.id} v${t.version}  handler=${t.handler}  queue=${t.queue.name}`);
        }
    });
    cmd
        .command('trigger <id>')
        .description('Enqueue a TaskRun (thin enqueue — does not execute inline)')
        .option('--payload <json>', 'JSON object payload', '{}')
        .option('--user <userId>', 'Ownership user id')
        .option('--project <projectId>', 'Ownership project id')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((id, options) => {
        const service = serviceFor(options.dir);
        const payload = parseJsonObject(options.payload, 'payload');
        const result = service.trigger(id, payload, {
            userId: options.user,
            projectId: options.project,
        });
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }
        console.log(`Enqueued ${result.run.id} for task ${result.run.taskId} (v${result.run.taskVersion})`);
        console.log(`publicRunToken=${result.publicRunToken}`);
        console.log(`status=${result.run.status} — run a worker: tnf durable-tasks worker`);
    });
    cmd
        .command('runs')
        .description('List TaskRuns')
        .option('--task <id>', 'Filter by task id')
        .option('--status <status>', 'Filter by status')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((options) => {
        const service = serviceFor(options.dir);
        const status = options.status;
        const runs = service.listRuns({ taskId: options.task, status });
        if (options.json) {
            console.log(JSON.stringify(runs, null, 2));
            return;
        }
        if (runs.length === 0) {
            console.log('No runs.');
            return;
        }
        for (const r of runs) {
            console.log(`- ${r.id}  ${r.taskId}@v${r.taskVersion}  ${r.status}  attempt=${r.attempt}`);
        }
    });
    cmd
        .command('status <runId>')
        .description('Show one TaskRun (optionally authorize with --public-token)')
        .option('--public-token <token>', 'Public run token (client-scoped read)')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((runId, options) => {
        const service = serviceFor(options.dir);
        let run = service.getRun(runId);
        if (options.publicToken) {
            const viaToken = service.resolvePublicRunToken(options.publicToken);
            if (!viaToken || viaToken.id !== runId) {
                throw new Error('public token does not authorize this run');
            }
            run = viaToken;
        }
        if (!run)
            throw new Error(`Unknown run: ${runId}`);
        if (options.json) {
            console.log(JSON.stringify(run, null, 2));
            return;
        }
        console.log(JSON.stringify(run, null, 2));
    });
    cmd
        .command('cancel <runId>')
        .description('Cancel a non-terminal TaskRun')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((runId, options) => {
        const service = serviceFor(options.dir);
        const run = service.cancelRun(runId);
        if (options.json)
            console.log(JSON.stringify(run, null, 2));
        else
            console.log(`Cancelled ${run.id} → ${run.status}`);
    });
    cmd
        .command('wait-create')
        .description('Create a WaitToken (HITL / callback)')
        .option('--timeout <spec>', 'Timeout e.g. 30s, 10m', '10m')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((options) => {
        const service = serviceFor(options.dir);
        const token = service.createWaitToken({
            timeoutMs: parseTimeoutMs(options.timeout),
        });
        if (options.json) {
            console.log(JSON.stringify(token, null, 2));
            return;
        }
        console.log(`waitToken=${token.id}`);
        console.log(`publicToken=${token.publicToken}`);
        console.log(`callbackPath=${token.callbackPath}`);
        console.log(`Complete: tnf durable-tasks wait-complete ${token.id} --data '{"status":"approved"}'`);
    });
    cmd
        .command('wait-complete <tokenId>')
        .description('Complete a WaitToken and resume WAITING runs')
        .option('--data <json>', 'JSON payload returned to the run', '{}')
        .option('--public-token <token>', 'Optional wait public token auth')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((tokenId, options) => {
        const service = serviceFor(options.dir);
        let data = {};
        if (options.data) {
            try {
                data = JSON.parse(options.data);
            }
            catch (err) {
                throw new Error(`data: ${err?.message || String(err)}`);
            }
        }
        const token = service.completeWaitToken(tokenId, data, {
            publicToken: options.publicToken,
        });
        if (options.json)
            console.log(JSON.stringify(token, null, 2));
        else
            console.log(`Completed ${token.id} status=${token.status}`);
    });
    cmd
        .command('mint-token <runId>')
        .description('Mint a PublicRunToken for client status reads')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((runId, options) => {
        const service = serviceFor(options.dir);
        if (!service.getRun(runId))
            throw new Error(`Unknown run: ${runId}`);
        const row = service.mintPublicRunToken(runId);
        if (options.json)
            console.log(JSON.stringify(row, null, 2));
        else
            console.log(`publicRunToken=${row.token}`);
    });
    cmd
        .command('worker')
        .description('Run the local DurableTask worker (required for QUEUED runs to execute)')
        .option('--once', 'Process at most one run then exit')
        .option('--poll-ms <n>', 'Idle poll interval', '200')
        .option('--idle-stop <n>', 'Stop after N idle ticks (useful in scripts)')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Emit tick events as JSON lines')
        .action(async (options) => {
        const service = serviceFor(options.dir);
        if (!options.json) {
            console.log(`DurableTask worker started (store=${options.dir || path.join(os.homedir(), '.tnf', 'durable-tasks')})`);
        }
        await service.runWorker({
            once: options.once,
            pollMs: Number(options.pollMs) || 200,
            idleStopAfter: options.idleStop ? Number(options.idleStop) : undefined,
            onTick: (advanced) => {
                if (options.json) {
                    console.log(JSON.stringify({ at: new Date().toISOString(), advanced }));
                }
                else if (advanced > 0) {
                    console.log(`[worker] advanced ${advanced} run(s)`);
                }
            },
        });
        if (!options.json)
            console.log('DurableTask worker stopped');
    });
    cmd
        .command('demo')
        .description('End-to-end smoke: echo, retry, Ghost AI design+spec')
        .option('--dir <path>', 'Store directory (default: temp under /tmp)')
        .option('--json', 'Machine-readable JSON')
        .action(async (options) => {
        const dir = options.dir ||
            fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-durable-demo-'));
        const service = new DurableTaskService(dir);
        service.resetForTests();
        service.defineTask({ id: 'demo-echo', handler: 'echo' });
        service.defineTask({ id: 'demo-retry', handler: 'fail-once', retry: { maxAttempts: 3 } });
        service.ensureGhostAiTasks();
        const echo = service.trigger('demo-echo', { hello: 'world' }, { userId: 'demo' });
        const retry = service.trigger('demo-retry', { n: 1 }, { projectId: 'demo' });
        const design = service.trigger('design-agent', { prompt: 'Payments API with ledger', roomId: 'room-demo' }, { userId: 'demo', projectId: 'ghost' });
        const spec = service.trigger('generate-spec', {
            projectId: 'ghost',
            roomId: 'room-demo',
            nodes: [{ id: 'api', label: 'Payments API', kind: 'service' }],
            edges: [],
            chatHistory: [{ role: 'user', content: 'Need PCI-aware ledger' }],
        }, { projectId: 'ghost' });
        await service.runWorker({ once: false, idleStopAfter: 40, pollMs: 10 });
        const echoRun = service.getRun(echo.run.id);
        const retryRun = service.getRun(retry.run.id);
        const designRun = service.getRun(design.run.id);
        const specRun = service.getRun(spec.run.id);
        const ok = echoRun.status === 'COMPLETED' &&
            retryRun.status === 'COMPLETED' &&
            designRun.status === 'COMPLETED' &&
            specRun.status === 'COMPLETED';
        const report = {
            ok,
            dir,
            echo: { id: echoRun.id, status: echoRun.status },
            retry: { id: retryRun.id, status: retryRun.status, attempt: retryRun.attempt },
            design: {
                id: designRun.id,
                status: designRun.status,
                toolCalls: designRun.output?.toolCalls?.length,
            },
            spec: {
                id: specRun.id,
                status: specRun.status,
                artifactPath: specRun.output?.artifactPath,
            },
            publicRunToken: echo.publicRunToken,
        };
        if (options.json)
            console.log(JSON.stringify(report, null, 2));
        else {
            console.log(JSON.stringify(report, null, 2));
            if (!ok)
                process.exitCode = 1;
        }
    });
    cmd
        .command('ghost-setup')
        .description('Ensure design-agent + generate-spec DurableTasks exist')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((options) => {
        const service = serviceFor(options.dir);
        const defs = service.ensureGhostAiTasks();
        if (options.json)
            console.log(JSON.stringify(defs, null, 2));
        else
            for (const d of defs)
                console.log(`- ${d.id} v${d.version} handler=${d.handler}`);
    });
    cmd
        .command('batch <id>')
        .description('Batch-enqueue payloads (JSON array, max 1000)')
        .option('--payloads <json>', 'JSON array of payload objects', '[]')
        .option('--user <userId>', 'Ownership user id')
        .option('--project <projectId>', 'Ownership project id')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((id, options) => {
        const service = serviceFor(options.dir);
        let payloads = [];
        try {
            const parsed = JSON.parse(options.payloads || '[]');
            if (!Array.isArray(parsed))
                throw new Error('payloads must be a JSON array');
            payloads = parsed;
        }
        catch (err) {
            throw new Error(`payloads: ${err?.message || String(err)}`);
        }
        const results = service.triggerBatch(id, payloads, {
            userId: options.user,
            projectId: options.project,
        });
        if (options.json)
            console.log(JSON.stringify(results, null, 2));
        else
            console.log(`Enqueued ${results.length} runs for ${id}`);
    });
    cmd
        .command('query <trql>')
        .description('TRQL-lite run query (e.g. status:COMPLETED taskId:demo limit:10)')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((trql, options) => {
        const service = serviceFor(options.dir);
        const runs = service.queryRuns(trql);
        if (options.json)
            console.log(JSON.stringify(runs, null, 2));
        else {
            for (const r of runs) {
                console.log(`- ${r.id}  ${r.taskId}@v${r.taskVersion}  ${r.status}`);
            }
        }
    });
    cmd
        .command('replay <runId>')
        .description('Replay a prior run (new run id, same payload)')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((runId, options) => {
        const service = serviceFor(options.dir);
        const result = service.replayRun(runId);
        if (options.json)
            console.log(JSON.stringify(result, null, 2));
        else
            console.log(`Replayed → ${result.run.id} (token=${result.publicRunToken})`);
    });
    cmd
        .command('deploy <id>')
        .description('Pin deployedVersion for skew protection on new triggers')
        .option('--env <name>', 'Environment label', 'local')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((id, options) => {
        const service = serviceFor(options.dir);
        const row = service.deployTask(id, options.env || 'local');
        if (options.json)
            console.log(JSON.stringify(row, null, 2));
        else
            console.log(`Deployed ${row.taskId} v${row.version} env=${row.env}`);
    });
    cmd
        .command('events <runId>')
        .description('List realtime run events (since seq)')
        .option('--since <n>', 'Only events with seq > n', '0')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((runId, options) => {
        const service = serviceFor(options.dir);
        const events = service.listRunEvents(runId, Number(options.since) || 0);
        if (options.json)
            console.log(JSON.stringify(events, null, 2));
        else
            for (const e of events)
                console.log(`${e.seq} ${e.at} ${e.type}`);
    });
    cmd
        .command('steer <runId>')
        .description('Send mid-run steering input')
        .option('--message <text>', 'Steering message', '')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((runId, options) => {
        const service = serviceFor(options.dir);
        service.steerRun(runId, options.message || '');
        if (options.json)
            console.log(JSON.stringify({ ok: true, runId }));
        else
            console.log(`Steered ${runId}`);
    });
    cmd
        .command('session-create')
        .description('Create a DurableSession channel (not SessionManager chat)')
        .option('--channel <name>', 'Channel name', 'default')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((options) => {
        const service = serviceFor(options.dir);
        const s = service.createSession(options.channel || 'default');
        if (options.json)
            console.log(JSON.stringify(s, null, 2));
        else
            console.log(`session=${s.id} channel=${s.channel}`);
    });
    cmd
        .command('session-append <sessionId>')
        .description('Append a message to a DurableSession')
        .option('--role <role>', 'Role', 'user')
        .option('--content <text>', 'Message content', '')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((sessionId, options) => {
        const service = serviceFor(options.dir);
        const s = service.appendSessionMessage(sessionId, options.role || 'user', options.content || '');
        if (options.json)
            console.log(JSON.stringify(s, null, 2));
        else
            console.log(`session=${s.id} messages=${s.messages.length}`);
    });
    cmd
        .command('schedule-add <id>')
        .description('Add interval schedule that triggers a DurableTask')
        .requiredOption('--task <taskId>', 'DurableTask id')
        .option('--every-ms <n>', 'Interval milliseconds', '60000')
        .option('--payload <json>', 'Payload JSON object', '{}')
        .option('--dir <path>', 'Override store directory')
        .option('--json', 'Machine-readable JSON')
        .action((id, options) => {
        const service = serviceFor(options.dir);
        const payload = parseJsonObject(options.payload, 'payload');
        const row = service.addSchedule({
            id,
            taskId: options.task,
            everyMs: Number(options.everyMs) || 60_000,
            payload,
        });
        if (options.json)
            console.log(JSON.stringify(row, null, 2));
        else
            console.log(`schedule=${row.id} everyMs=${row.everyMs} → ${row.taskId}`);
    });
    cmd
        .command('serve')
        .description('HTTP: wait callbacks, enqueue, webhook ingress, run event SSE')
        .option('--host <host>', 'Bind host', '127.0.0.1')
        .option('--port <n>', 'Bind port (0 = ephemeral)', '8787')
        .option('--dir <path>', 'Override store directory')
        .option('--webhook-secret <secret>', 'Require x-tnf-durable-secret on webhook routes')
        .option('--json', 'Machine-readable JSON')
        .action(async (options) => {
        const { startDurableTaskHttpServer } = await import('../services/DurableTaskHttpServer.js');
        const service = serviceFor(options.dir);
        service.ensureGhostAiTasks();
        const handle = await startDurableTaskHttpServer(service, {
            host: options.host || '127.0.0.1',
            port: Number(options.port) || 8787,
            webhookSecret: options.webhookSecret,
        });
        // Keep a worker ticking so enqueued runs execute
        const stop = { v: false };
        const worker = service.runWorker({
            pollMs: 200,
            shouldStop: () => stop.v,
        });
        if (options.json) {
            console.log(JSON.stringify({ ok: true, url: handle.url }));
        }
        else {
            console.log(`DurableTask HTTP listening at ${handle.url}`);
            console.log(`  POST ${handle.url}/durable-tasks/enqueue/:taskId`);
            console.log(`  POST ${handle.url}/durable-tasks/webhook/:taskId`);
            console.log(`  POST ${handle.url}/durable-tasks/wait-tokens/:id/complete`);
            console.log(`  GET  ${handle.url}/durable-tasks/runs/:id/events?token=`);
            console.log(`  GET  ${handle.url}/durable-tasks/runs/:id/stream?token=`);
            console.log('Local worker running beside HTTP (Ctrl+C to stop)');
        }
        const shutdown = async () => {
            stop.v = true;
            await handle.close();
            process.exit(0);
        };
        process.on('SIGINT', () => void shutdown());
        process.on('SIGTERM', () => void shutdown());
        await worker;
    });
    cmd
        .command('apply-workflow')
        .description('Apply design-agent output into builder store; --sync-api POSTs Nest /api/workflows')
        .option('--prompt <text>', 'Design prompt (runs design-agent then applies)')
        .option('--run <runId>', 'Apply from an existing completed design-agent run')
        .option('--project <projectId>', 'Project id')
        .option('--sync-api', 'POST/PATCH Nest workflows (requires TNF_API_URL; optional TNF_API_TOKEN)')
        .option('--dir <path>', 'Override durable-tasks store directory')
        .option('--json', 'Machine-readable JSON')
        .action(async (options) => {
        const { WorkflowGraphBridge } = await import('../services/WorkflowGraphBridge.js');
        const service = serviceFor(options.dir);
        service.ensureGhostAiTasks();
        const bridge = new WorkflowGraphBridge();
        const syncApi = options.syncApi === true;
        let applied;
        if (options.run) {
            const run = service.getRun(options.run);
            if (!run)
                throw new Error(`Unknown run: ${options.run}`);
            if (run.status !== 'COMPLETED')
                throw new Error(`Run not completed: ${run.status}`);
            const output = run.output;
            applied = await bridge.applyDesignAndSync({
                prompt: output?.prompt,
                projectId: options.project || output?.projectId,
                roomId: output?.roomId,
                toolCalls: output?.toolCalls,
                workflowSpec: output?.workflowSpec,
                syncApi,
            });
        }
        else if (options.prompt) {
            const triggered = service.trigger('design-agent', {
                prompt: options.prompt,
                projectId: options.project,
                applyToBuilder: true,
                syncApi,
            }, { projectId: options.project });
            await service.runWorker({ idleStopAfter: 40, pollMs: 10 });
            const run = service.getRun(triggered.run.id);
            if (run.status !== 'COMPLETED') {
                throw new Error(`design-agent failed: ${run.error || run.status}`);
            }
            const output = run.output;
            applied = {
                spec: output.workflowSpec,
                graph: bridge.get(output.appliedWorkflow?.id) || bridge.latest(),
                builderPath: output.appliedWorkflow?.builderPath,
                apiSynced: Boolean(output.apiSync?.ok),
                apiId: output.apiSync?.id,
                apiSync: output.apiSync,
            };
            // If worker path skipped sync (no flag on older runs), sync now
            if (syncApi && applied.graph && !applied.apiSynced) {
                const synced = await bridge.applyDesignAndSync({
                    workflowSpec: output.workflowSpec,
                    prompt: options.prompt,
                    projectId: options.project,
                    syncApi: true,
                    workflowId: applied.graph.id,
                });
                applied = synced;
            }
        }
        else {
            throw new Error('Provide --prompt or --run');
        }
        if (options.json)
            console.log(JSON.stringify(applied, null, 2));
        else {
            console.log(`workflow=${applied.graph?.id}`);
            console.log(`nodes=${applied.graph?.nodes?.length} edges=${applied.graph?.edges?.length}`);
            console.log(`open ${applied.builderPath}`);
            if (syncApi) {
                console.log(applied.apiSynced
                    ? `apiSynced=true id=${applied.apiId}`
                    : `apiSynced=false ${JSON.stringify(applied.apiSync)}`);
            }
        }
        if (syncApi && !applied.apiSynced)
            process.exitCode = 1;
    });
    cmd
        .command('workflows')
        .description('List AI-applied builder graphs (~/.tnf/workflow-graphs)')
        .option('--json', 'Machine-readable JSON')
        .action(async (options) => {
        const { WorkflowGraphBridge } = await import('../services/WorkflowGraphBridge.js');
        const bridge = new WorkflowGraphBridge();
        const list = bridge.list();
        if (options.json)
            console.log(JSON.stringify(list, null, 2));
        else {
            for (const w of list) {
                console.log(`- ${w.id}  ${w.name}  nodes=${w.nodes.length} edges=${w.edges.length}  ${w.updatedAt}`);
            }
        }
    });
    cmd
        .command('mcp-serve')
        .description('Stdio MCP-ish JSON-RPC tools for DurableTask (register via tnf mcp add)')
        .option('--dir <path>', 'Override store directory')
        .action(async (options) => {
        const service = serviceFor(options.dir);
        service.ensureGhostAiTasks();
        await runDurableTasksMcpStdio(service);
    });
}
/** Minimal JSON-RPC MCP surface over stdin/stdout — no parallel registry. */
async function runDurableTasksMcpStdio(service) {
    const tools = [
        {
            name: 'durable_task_list',
            description: 'List DurableTask definitions',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'durable_task_trigger',
            description: 'Enqueue a DurableTask run (thin enqueue)',
            inputSchema: {
                type: 'object',
                properties: {
                    taskId: { type: 'string' },
                    payload: { type: 'object' },
                    userId: { type: 'string' },
                    projectId: { type: 'string' },
                },
                required: ['taskId'],
            },
        },
        {
            name: 'durable_task_status',
            description: 'Get TaskRun by id',
            inputSchema: {
                type: 'object',
                properties: { runId: { type: 'string' } },
                required: ['runId'],
            },
        },
        {
            name: 'durable_task_ghost_setup',
            description: 'Ensure design-agent and generate-spec tasks exist',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'durable_design_agent',
            description: 'Enqueue Ghost AI design-agent with prompt/roomId',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string' },
                    roomId: { type: 'string' },
                    projectId: { type: 'string' },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'durable_generate_spec',
            description: 'Enqueue Ghost AI generate-spec',
            inputSchema: {
                type: 'object',
                properties: {
                    projectId: { type: 'string' },
                    roomId: { type: 'string' },
                    nodes: { type: 'array' },
                    edges: { type: 'array' },
                    chatHistory: { type: 'array' },
                },
            },
        },
    ];
    const rl = await import('node:readline');
    const iface = rl.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    const respond = (id, result) => {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
    };
    const fail = (id, message) => {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message } }) + '\n');
    };
    for await (const line of iface) {
        if (!line.trim())
            continue;
        let msg;
        try {
            msg = JSON.parse(line);
        }
        catch {
            continue;
        }
        const { id, method, params } = msg;
        try {
            if (method === 'initialize') {
                respond(id, {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'tnf-durable-tasks', version: '1.0.0' },
                });
            }
            else if (method === 'tools/list') {
                respond(id, { tools });
            }
            else if (method === 'tools/call') {
                const name = params?.name;
                const args = (params?.arguments || {});
                let text = '';
                if (name === 'durable_task_list') {
                    text = JSON.stringify(service.listTasks(), null, 2);
                }
                else if (name === 'durable_task_trigger') {
                    const r = service.trigger(String(args.taskId), args.payload || {}, {
                        userId: args.userId ? String(args.userId) : undefined,
                        projectId: args.projectId ? String(args.projectId) : undefined,
                    });
                    text = JSON.stringify(r, null, 2);
                }
                else if (name === 'durable_task_status') {
                    text = JSON.stringify(service.getRun(String(args.runId)) || null, null, 2);
                }
                else if (name === 'durable_task_ghost_setup') {
                    text = JSON.stringify(service.ensureGhostAiTasks(), null, 2);
                }
                else if (name === 'durable_design_agent') {
                    service.ensureGhostAiTasks();
                    const r = service.trigger('design-agent', {
                        prompt: String(args.prompt || ''),
                        roomId: args.roomId,
                        projectId: args.projectId,
                    }, { projectId: args.projectId ? String(args.projectId) : undefined });
                    text = JSON.stringify(r, null, 2);
                }
                else if (name === 'durable_generate_spec') {
                    service.ensureGhostAiTasks();
                    const r = service.trigger('generate-spec', { ...args }, {
                        projectId: args.projectId ? String(args.projectId) : undefined,
                    });
                    text = JSON.stringify(r, null, 2);
                }
                else {
                    fail(id, `unknown tool ${name}`);
                    continue;
                }
                respond(id, { content: [{ type: 'text', text }] });
            }
            else if (method === 'notifications/initialized' || method === 'ping') {
                if (id !== undefined)
                    respond(id, {});
            }
            else {
                fail(id, `unsupported method ${method}`);
            }
        }
        catch (err) {
            fail(id, err?.message || String(err));
        }
    }
}
