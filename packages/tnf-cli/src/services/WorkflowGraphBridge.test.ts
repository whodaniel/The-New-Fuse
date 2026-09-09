/**
 * WorkflowGraphBridge — Nest /api/workflows sync tests (mock HTTP).
 */
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  WorkflowGraphBridge,
  resolveWorkflowsApiBase,
} from './WorkflowGraphBridge.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

async function withMockApi(
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    body: any
  ) => void
): Promise<{ base: string; close: () => Promise<void>; calls: Array<{ method?: string; url?: string; body: any }> }> {
  const calls: Array<{ method?: string; url?: string; body: any }> = [];
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => {
      let body: any = null;
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = { raw };
      }
      calls.push({ method: req.method, url: req.url, body });
      handler(req, res, body);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return {
    base: `http://127.0.0.1:${port}`,
    calls,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

async function main(): Promise<void> {
  console.log('\nworkflow graph bridge api sync');

  check(
    'resolve base from host',
    resolveWorkflowsApiBase('http://localhost:3001') === 'http://localhost:3001/api/workflows'
  );
  check(
    'resolve base from /api',
    resolveWorkflowsApiBase('http://localhost:3001/api') ===
      'http://localhost:3001/api/workflows'
  );
  check(
    'resolve base from /api/workflows',
    resolveWorkflowsApiBase('http://localhost:3001/api/workflows') ===
      'http://localhost:3001/api/workflows'
  );

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-wf-bridge-'));
  const bridge = new WorkflowGraphBridge(dir);

  const mock = await withMockApi((req, res, body) => {
    if (req.method === 'POST' && req.url === '/api/workflows') {
      if (!body?.name || !Array.isArray(body.nodes)) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'bad body' }));
        return;
      }
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          id: '11111111-2222-4333-8444-555555555555',
          name: body.name,
          definition: { nodes: body.nodes, edges: body.edges },
        })
      );
      return;
    }
    if (req.method === 'PATCH' && req.url?.startsWith('/api/workflows/')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: req.url.split('/').pop(), ok: true }));
      return;
    }
    res.writeHead(404);
    res.end('no');
  });

  const prevUrl = process.env.TNF_API_URL;
  const prevVite = process.env.VITE_API_URL;
  process.env.TNF_API_URL = mock.base;
  delete process.env.VITE_API_URL;

  const applied = await bridge.applyDesignAndSync({
    prompt: 'Sync test pipeline',
    syncApi: true,
  });

  check('sync ok', applied.apiSynced === true, JSON.stringify(applied.apiSync));
  check(
    'api id is uuid',
    applied.apiId === '11111111-2222-4333-8444-555555555555'
  );
  check(
    'builder path uses api id',
    applied.builderPath ===
      '/workflows/builder?id=11111111-2222-4333-8444-555555555555'
  );
  check(
    'POST hit /api/workflows',
    mock.calls.some((c) => c.method === 'POST' && c.url === '/api/workflows')
  );
  check(
    'POST body has nodes/edges/name/status',
    mock.calls[0]?.body?.name &&
      Array.isArray(mock.calls[0]?.body?.nodes) &&
      Array.isArray(mock.calls[0]?.body?.edges) &&
      mock.calls[0]?.body?.status === 'DRAFT'
  );
  check(
    'local store rewritten to api id',
    Boolean(bridge.get('11111111-2222-4333-8444-555555555555'))
  );

  // Patch path when id already UUID
  const patched = await bridge.syncToApi(
    bridge.get('11111111-2222-4333-8444-555555555555')!,
    { forcePatch: true }
  );
  check('patch ok', patched.ok === true && patched.method === 'PATCH', JSON.stringify(patched));

  await mock.close();

  // Missing URL fails clearly
  delete process.env.TNF_API_URL;
  delete process.env.VITE_API_URL;
  const noUrl = await bridge.syncToApi(bridge.latest()!);
  check('missing TNF_API_URL fails', noUrl.ok === false && /TNF_API_URL/.test(noUrl.error || ''));

  if (prevUrl === undefined) delete process.env.TNF_API_URL;
  else process.env.TNF_API_URL = prevUrl;
  if (prevVite === undefined) delete process.env.VITE_API_URL;
  else process.env.VITE_API_URL = prevVite;

  console.log(`\nworkflow graph bridge api sync: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
