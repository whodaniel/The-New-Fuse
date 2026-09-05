// @ts-nocheck — recovered from dist; types restored incrementally
/**
 * DurableTask HTTP surface — wait callbacks, webhook→task, realtime SSE.
 * Mirrors ServeService createServer pattern; does NOT replace tnf serve or
 * workflow webhooks (/workflows/:id/webhook remains the visual path).
 */
import * as http from 'node:http';
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}
function json(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload),
    });
    res.end(payload);
}
export function startDurableTaskHttpServer(service, options = {}) {
    const host = options.host || '127.0.0.1';
    const port = options.port ?? 0;
    const webhookSecret = options.webhookSecret || process.env.TNF_DURABLE_WEBHOOK_SECRET || '';
    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url || '/', `http://${host}`);
            const method = (req.method || 'GET').toUpperCase();
            if (method === 'GET' && url.pathname === '/health') {
                return json(res, 200, { ok: true, service: 'durable-tasks' });
            }
            // Builder graph store (same shape as POST /workflows definition)
            if (method === 'GET' && url.pathname === '/workflows') {
                const { WorkflowGraphBridge } = await import('./WorkflowGraphBridge.js');
                const bridge = new WorkflowGraphBridge();
                const workflows = bridge.list();
                return json(res, 200, { workflows, total: workflows.length });
            }
            const wfMatch = /^\/workflows\/([^/]+)$/.exec(url.pathname);
            if (wfMatch && method === 'GET') {
                const { WorkflowGraphBridge } = await import('./WorkflowGraphBridge.js');
                const bridge = new WorkflowGraphBridge();
                const id = decodeURIComponent(wfMatch[1]);
                const doc = bridge.get(id);
                if (!doc)
                    return json(res, 404, { error: 'workflow not found' });
                return json(res, 200, doc);
            }
            // POST /workflows/from-design-run/:runId
            const fromRun = /^\/workflows\/from-design-run\/([^/]+)$/.exec(url.pathname);
            if (fromRun && method === 'POST') {
                const runId = decodeURIComponent(fromRun[1]);
                const run = service.getRun(runId);
                if (!run)
                    return json(res, 404, { error: 'run not found' });
                const output = run.output;
                const { WorkflowGraphBridge } = await import('./WorkflowGraphBridge.js');
                const bridge = new WorkflowGraphBridge();
                const applied = bridge.applyDesign({
                    prompt: output?.prompt,
                    projectId: output?.projectId || run.ownership.projectId,
                    roomId: output?.roomId,
                    toolCalls: output?.toolCalls,
                    workflowSpec: output?.workflowSpec,
                });
                return json(res, 200, applied);
            }
            // Wait token complete: POST /durable-tasks/wait-tokens/:id/complete
            const waitMatch = /^\/durable-tasks\/wait-tokens\/([^/]+)\/complete$/.exec(url.pathname);
            if (waitMatch && method === 'POST') {
                const tokenId = decodeURIComponent(waitMatch[1]);
                const raw = await readBody(req);
                let data = {};
                if (raw.trim()) {
                    try {
                        data = JSON.parse(raw);
                    }
                    catch {
                        return json(res, 400, { error: 'invalid JSON body' });
                    }
                }
                const publicToken = req.headers['x-wait-public-token'] ||
                    url.searchParams.get('publicToken') ||
                    undefined;
                try {
                    const token = service.completeWaitToken(tokenId, data, { publicToken });
                    return json(res, 200, { ok: true, token });
                }
                catch (err) {
                    return json(res, 400, { error: err?.message || String(err) });
                }
            }
            // Webhook ingress → DurableTask (code-first). Visual workflows keep their own route.
            // POST /durable-tasks/webhook/:taskId
            const whMatch = /^\/durable-tasks\/webhook\/([^/]+)$/.exec(url.pathname);
            if (whMatch && method === 'POST') {
                if (webhookSecret) {
                    const provided = String(req.headers['x-tnf-durable-secret'] || '');
                    if (provided !== webhookSecret) {
                        return json(res, 401, { error: 'unauthorized' });
                    }
                }
                const taskId = decodeURIComponent(whMatch[1]);
                const raw = await readBody(req);
                let payload = {};
                if (raw.trim()) {
                    try {
                        const parsed = JSON.parse(raw);
                        payload =
                            parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                                ? parsed
                                : { body: parsed };
                    }
                    catch {
                        payload = { raw };
                    }
                }
                payload._webhook = {
                    at: new Date().toISOString(),
                    headers: {
                        'content-type': req.headers['content-type'],
                        'user-agent': req.headers['user-agent'],
                    },
                };
                try {
                    const result = service.trigger(taskId, payload, {
                        userId: String(url.searchParams.get('user') || 'webhook'),
                        projectId: url.searchParams.get('project') || undefined,
                    });
                    return json(res, 202, {
                        ok: true,
                        runId: result.run.id,
                        publicRunToken: result.publicRunToken,
                        status: result.run.status,
                    });
                }
                catch (err) {
                    return json(res, 400, { error: err?.message || String(err) });
                }
            }
            // Thin enqueue API (Ghost AI pattern)
            // POST /durable-tasks/enqueue/:taskId
            const enqMatch = /^\/durable-tasks\/enqueue\/([^/]+)$/.exec(url.pathname);
            if (enqMatch && method === 'POST') {
                const taskId = decodeURIComponent(enqMatch[1]);
                const raw = await readBody(req);
                let body = {};
                if (raw.trim()) {
                    try {
                        body = JSON.parse(raw);
                    }
                    catch {
                        return json(res, 400, { error: 'invalid JSON' });
                    }
                }
                const payload = body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
                    ? body.payload
                    : body;
                try {
                    // Ensure Ghost AI tasks exist for design-agent / generate-spec enqueues
                    if (taskId === 'design-agent' || taskId === 'generate-spec') {
                        service.ensureGhostAiTasks();
                    }
                    const result = service.trigger(taskId, payload, {
                        userId: body.userId ? String(body.userId) : undefined,
                        projectId: body.projectId ? String(body.projectId) : undefined,
                    });
                    return json(res, 202, {
                        runId: result.run.id,
                        publicRunToken: result.publicRunToken,
                        status: result.run.status,
                    });
                }
                catch (err) {
                    return json(res, 400, { error: err?.message || String(err) });
                }
            }
            // GET /durable-tasks/runs/:id — public token optional
            const runGet = /^\/durable-tasks\/runs\/([^/]+)$/.exec(url.pathname);
            if (runGet && method === 'GET') {
                const runId = decodeURIComponent(runGet[1]);
                const token = url.searchParams.get('token') || '';
                const run = token ? service.resolvePublicRunToken(token) : service.getRun(runId);
                if (!run || run.id !== runId) {
                    return json(res, 401, { error: 'unauthorized or unknown run' });
                }
                return json(res, 200, run);
            }
            // Realtime-ish: GET /durable-tasks/runs/:id/events?token=&since=
            const evMatch = /^\/durable-tasks\/runs\/([^/]+)\/events$/.exec(url.pathname);
            if (evMatch && method === 'GET') {
                const runId = decodeURIComponent(evMatch[1]);
                const token = url.searchParams.get('token') || '';
                const since = Number(url.searchParams.get('since') || '0') || 0;
                const run = token ? service.resolvePublicRunToken(token) : service.getRun(runId);
                if (!run || run.id !== runId) {
                    return json(res, 401, { error: 'unauthorized or unknown run' });
                }
                const events = service.listRunEvents(runId, since);
                return json(res, 200, { runId, events, cursor: since + events.length });
            }
            // SSE stream
            const sseMatch = /^\/durable-tasks\/runs\/([^/]+)\/stream$/.exec(url.pathname);
            if (sseMatch && method === 'GET') {
                const runId = decodeURIComponent(sseMatch[1]);
                const token = url.searchParams.get('token') || '';
                const run = token ? service.resolvePublicRunToken(token) : service.getRun(runId);
                if (!run || run.id !== runId) {
                    return json(res, 401, { error: 'unauthorized or unknown run' });
                }
                res.writeHead(200, {
                    'content-type': 'text/event-stream',
                    'cache-control': 'no-cache',
                    connection: 'keep-alive',
                });
                let cursor = Number(url.searchParams.get('since') || '0') || 0;
                const push = () => {
                    const events = service.listRunEvents(runId, cursor);
                    for (const ev of events) {
                        res.write(`data: ${JSON.stringify(ev)}\n\n`);
                        cursor += 1;
                    }
                    const latest = service.getRun(runId);
                    if (latest &&
                        (latest.status === 'COMPLETED' ||
                            latest.status === 'FAILED' ||
                            latest.status === 'CANCELLED')) {
                        res.write(`event: terminal\ndata: ${JSON.stringify({ status: latest.status, output: latest.output })}\n\n`);
                        res.end();
                        clearInterval(timer);
                    }
                };
                push();
                const timer = setInterval(push, 250);
                req.on('close', () => clearInterval(timer));
                return;
            }
            json(res, 404, { error: 'not found', path: url.pathname });
        }
        catch (err) {
            json(res, 500, { error: err?.message || String(err) });
        }
    });
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
            const addr = server.address();
            const actualPort = typeof addr === 'object' && addr ? addr.port : port;
            const url = `http://${host}:${actualPort}`;
            resolve({
                server,
                url,
                close: () => new Promise((resClose, rejClose) => {
                    server.close((err) => (err ? rejClose(err) : resClose()));
                }),
            });
        });
    });
}
