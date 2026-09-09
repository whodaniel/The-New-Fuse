import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMasterGraph, extractDeclaredRoutes } from '../scripts/build-master-graph.mjs';
import {
  attachRuntime,
  currentFreshness,
  graphAssessment,
  observation,
  parseGraphQuery,
  parseMasterGraph,
  queryMasterGraph,
  safeGraphHref,
  type MasterGraph,
} from './master-graph';
import { handleMasterGraph } from './master-graph-api';

const now = '2026-09-09T00:00:00.000Z';
const proof = { source: 'test-contract', observedAt: now, status: 'declared' as const };
function small(): MasterGraph {
  return {
    schemaVersion: 'tnf.master-graph/v1',
    generatedAt: now,
    snapshotAt: now,
    revision: 'test',
    nodes: ['a', 'b', 'c'].map((id) => ({ id, label: id, kind: 'service', evidence: proof })),
    edges: [
      { id: 'ab', source: 'a', target: 'b', type: 'depends_on', directed: true, evidence: proof },
      { id: 'bc', source: 'b', target: 'c', type: 'depends_on', directed: true, evidence: proof },
    ],
    sources: [],
    issues: [],
  };
}
const query = (s: string) => parseGraphQuery(new URLSearchParams('scope=source&' + s));

test('actual source graph preserves missing endpoints and current route evidence', () => {
  const g = parseMasterGraph(buildMasterGraph());
  assert.equal(g.issues.filter((i) => i.reason === 'missing-endpoint').length, 4);
  assert.equal(g.snapshotAt, '2026-03-09T06:56:50.490Z');
  assert.equal(
    g.nodes.find((n) => n.id === 'route:/visualizations/master-graph')?.href,
    '/visualizations/master-graph'
  );
  assert.equal(
    g.nodes.find((n) => n.id === 'route:/visualizations/master-graph')?.evidence.status,
    'declared'
  );
  assert.equal(parseMasterGraph(g).issues.length, g.issues.length);
  assert(
    g.edges.some(
      (e) => e.source === 'app:frontend' && e.target === 'route:/visualizations/master-graph'
    )
  );
});
test('directed paths, reverse impact traversal, cycles and identity candidates', () => {
  const g = small();
  assert.deepEqual(queryMasterGraph(g, query('mode=path&from=a&to=c')).path, ['a', 'b', 'c']);
  assert.equal(queryMasterGraph(g, query('mode=path&from=c&to=a')).path, null);
  assert.deepEqual(queryMasterGraph(g, query('mode=path&from=c&to=a&direction=both')).path, [
    'c',
    'b',
    'a',
  ]);
  assert.deepEqual(
    queryMasterGraph(g, query('mode=dependents&node=c&depth=2')).nodes.map((n) => n.id),
    ['a', 'b', 'c']
  );
  g.edges.push({ ...g.edges[0], id: 'ca', source: 'c', target: 'a', confidence: 'candidate' });
  assert.equal(queryMasterGraph(g, query('mode=path&from=c&to=a')).path, null);
  assert.deepEqual(
    queryMasterGraph(g, query('mode=path&from=c&to=a&includeCandidates=true')).path,
    ['c', 'a']
  );
  assert.deepEqual(queryMasterGraph(g, query('mode=path&from=a&to=a')).path, ['a']);
});
test('limits, filters and invalid queries fail explicitly', () => {
  assert.throws(() => query('mode=path&from=a'));
  assert.throws(() => query('depth=NaN'));
  assert.throws(() => query('limit=500000'));
  assert.throws(() => queryMasterGraph(small(), query('mode=neighbors&node=missing')));
  assert.equal(queryMasterGraph(small(), query('q=absent')).nodes.length, 0);
  assert.equal(queryMasterGraph(small(), query('mode=path&from=a&to=c&limit=1')).truncated, true);
});
test('validation rejects duplicate identity, invalid dates and unsafe app links', () => {
  const g = small();
  g.nodes.push(g.nodes[0]);
  assert.throws(() => parseMasterGraph(g));
  assert.throws(() => parseMasterGraph({ ...small(), snapshotAt: 'yesterday' }));
  for (const href of [
    '//evil.example',
    'javascript:alert(1)',
    '/a/../b',
    '/a\\b',
    '/agents/:id',
    '/%2fevil',
  ])
    assert.equal(safeGraphHref(href), false);
  assert.equal(safeGraphHref('/visualizations/master-graph'), true);
});
test('freshness uses observations, expires without refetch, rejects future dates and labels projections', () => {
  const o = observation('clock', now, now, 'healthy', 1000);
  assert.equal(o.freshness, 'fresh');
  assert.equal(currentFreshness(o, Date.parse(now) + 2000), 'stale');
  assert.equal(observation('clock', null, now, 'healthy', 1000).freshness, 'unknown');
  assert.equal(observation('clock', '2099-01-01', now, 'healthy', 1000).freshness, 'unknown');
  assert.equal(observation('clock', now, now, 'healthy', 1000, true).freshness, 'projected');
});
test('clock uses explicit graph identities and does not turn projected schedules into live proof', () => {
  const g = small();
  attachRuntime(
    g,
    'clock',
    {
      status: 'ok',
      timestamp: now,
      superCycle: {
        projectionMode: 'contract-fallback',
        processes: [
          {
            processId: 'p',
            name: 'P',
            status: 'healthy',
            lastHeartbeat: now,
            metadata: { graphNodeId: 'a' },
          },
        ],
      },
    },
    now
  );
  assert.equal(
    g.nodes.find((n) => n.id === 'clock-process:p')?.observation?.freshness,
    'projected'
  );
  assert(g.edges.some((e) => e.target === 'a' && e.type === 'observes'));
  assert.equal(g.nodes.find((n) => n.id === 'a')?.observation, undefined);
});
test('terminal heuristic matches remain candidates, commands are omitted and mirror time remains distinct', () => {
  const g = small();
  g.nodes.push({ id: 'agent:codex', label: 'Codex', kind: 'agent', evidence: proof });
  attachRuntime(
    g,
    'terminals',
    {
      available: true,
      generatedAt: now,
      source: { mirroredAt: null },
      safety: { commandsRedacted: true },
      graph: {
        nodes: [
          {
            id: 'runtime:codex',
            label: 'Codex',
            type: 'runtime',
            data: { matchedAgentId: 'codex', command: 'private' },
          },
        ],
        edges: [],
      },
    },
    now
  );
  assert.equal(
    g.nodes.find((n) => n.id === 'twip:runtime:codex')?.observation?.freshness,
    'unknown'
  );
  assert.equal(g.edges.find((e) => e.type === 'identity_candidate')?.confidence, 'candidate');
  assert(!JSON.stringify(g).includes('private'));
});
const context = (query = '', headers: HeadersInit = {}) => ({
  request: new Request(`https://app.thenewfuse.com/api/master-graph${query}`, { headers }),
  env: { ASSETS: { fetch: async () => Response.json(buildMasterGraph()) } },
});
test('API structural mode is offline and query uses the shared directed traversal', async () => {
  const r = await handleMasterGraph(
    context('?live=false&scope=source&mode=neighbors&node=app%3Afrontend&depth=1'),
    async () => {
      throw new Error('must not fetch');
    }
  );
  assert.equal(r.status, 200);
  const body = (await r.json()) as any;
  assert(body.query.nodes.some((n: any) => n.id === 'route:/visualizations/master-graph'));
  assert.match(r.headers.get('cache-control')!, /no-store/);
});
test('API forwards only caller auth and never accepts a caller tenant selector', async () => {
  const calls: { url: string; headers: Headers }[] = [];
  const upstream: typeof fetch = async (input, init) => {
    calls.push({
      url: input instanceof Request ? input.url : String(input),
      headers: new Headers(init?.headers),
    });
    return new Response('', { status: 403 });
  };
  const r = await handleMasterGraph(
    context('?tenantId=foreign', {
      Authorization: 'Bearer tenant-A',
      Cookie: 'session=A',
      'X-Tenant-Id': 'foreign',
    }),
    upstream
  );
  assert.equal(r.status, 200);
  assert.equal(calls.length, 2);
  for (const c of calls) {
    assert.equal(c.headers.get('authorization'), 'Bearer tenant-A');
    assert.equal(c.headers.get('x-tenant-id'), null);
    assert(!c.url.includes('foreign'));
  }
  const body = (await r.json()) as any;
  assert(body.sources.some((s: any) => s.status === 'unauthorized'));
  assert(!body.nodes.some((n: any) => n.id.startsWith('twip:')));
});
test('API does not fetch anonymous terminal data and survives upstream HTML or malformed JSON', async () => {
  let calls = 0;
  const r = await handleMasterGraph(context(), async () => {
    calls++;
    return new Response('<html>fallback</html>', { headers: { 'content-type': 'text/html' } });
  });
  assert.equal(calls, 1);
  assert.equal(r.status, 200);
  const body = (await r.json()) as any;
  assert(body.sources.some((s: any) => s.status === 'unavailable'));
  assert(body.sources.some((s: any) => s.status === 'unauthorized'));
});
test('partial invalid runtime projection is discarded atomically', async () => {
  const r = await handleMasterGraph(context(), async () =>
    Response.json({
      status: 'ok',
      timestamp: now,
      superCycle: {
        processes: [{ processId: 'valid', name: 'Valid', status: 'ok' }, { broken: true }],
      },
    })
  );
  const body = (await r.json()) as any;
  assert(!body.nodes.some((n: any) => n.id === 'runtime:master-clock'));
});
test('API returns machine-readable errors for missing assets and bad traversal', async () => {
  const c = context();
  c.env.ASSETS.fetch = async () =>
    new Response('<html/>', { headers: { 'content-type': 'text/html' } });
  assert.equal((await handleMasterGraph(c)).status, 503);
  assert.equal((await handleMasterGraph(context('?mode=path'))).status, 400);
  assert.equal(
    (await handleMasterGraph(context('?live=false&mode=neighbors&node=absent'))).status,
    404
  );
});

test('route evidence excludes commented JSX and dormant catalog entries', () => {
  assert.deepEqual(
    extractDeclaredRoutes(`// <Route path="/commented" />
const route = { path: '/catalog' };
const page = <Route key="x" path="/actual" element={<div />} />;`),
    ['/actual']
  );
});

test('all-node filtering is independent of a previously selected node', () => {
  assert.equal(queryMasterGraph(small(), query('mode=all&node=a&q=absent')).nodes.length, 0);
});

test('Pages fetch retains the global receiver and refuses to follow upstream redirects', async () => {
  const saved = globalThis.fetch;
  let called = false;
  globalThis.fetch = async function (input, init) {
    assert.equal(this, globalThis);
    assert(input instanceof Request);
    assert.equal(input.url, 'https://api.thenewfuse.com/api/system/master-clock');
    assert.equal(init?.redirect, 'manual');
    called = true;
    return new Response(null, { status: 302, headers: { Location: 'https://example.invalid' } });
  };
  try {
    const response = await handleMasterGraph(context());
    const result = (await response.json()) as any;
    assert(called);
    assert(result.sources.some((s: any) => s.message === 'Runtime source returned HTTP 302'));
  } finally {
    globalThis.fetch = saved;
  }
});

test('default traversal excludes source declarations, legacy relationships and stale telemetry', () => {
  const g = small();
  g.edges[0].evidence = { ...proof, status: 'historical' };
  assert.equal(
    queryMasterGraph(g, parseGraphQuery(new URLSearchParams()), Date.parse(now)).nodes.length,
    0
  );
  assert.equal(queryMasterGraph(g, query('mode=path&from=a&to=c'), Date.parse(now)).path, null);
  assert.deepEqual(
    queryMasterGraph(
      g,
      parseGraphQuery(new URLSearchParams('scope=all&mode=path&from=a&to=c')),
      Date.parse(now)
    ).path,
    ['a', 'b', 'c']
  );
  assert.equal(graphAssessment(g).functionalWiring, 'unverified');
  assert.throws(() => parseGraphQuery(new URLSearchParams('scope=verified')));
});

test('fresh runtime traversal requires fresh edge observations and expires without a new response', () => {
  const g = small();
  const o = observation('runtime', now, now, 'reported', 1000);
  for (const n of g.nodes) n.observation = o;
  g.edges[0].observation = o;
  const q = parseGraphQuery(new URLSearchParams('mode=path&from=a&to=c'));
  assert.equal(queryMasterGraph(g, q, Date.parse(now)).path, null);
  g.edges[1].observation = o;
  assert.deepEqual(queryMasterGraph(g, q, Date.parse(now)).path, ['a', 'b', 'c']);
  assert.equal(
    queryMasterGraph(g, parseGraphQuery(new URLSearchParams()), Date.parse(now) + 2000).nodes
      .length,
    0
  );
  assert.equal(graphAssessment(g, Date.parse(now) + 2000).staleObservations, 3);
  const invalid = structuredClone(g);
  invalid.edges[0].observation!.receivedAt = 'not-a-date';
  assert.throws(() => parseMasterGraph(invalid));
});

test('reachable clock with old records is stale and does not create inferred route wiring', () => {
  const g = small();
  g.nodes.push({
    id: 'route:/visualizations',
    label: 'Visualizations',
    kind: 'route',
    evidence: proof,
  });
  attachRuntime(
    g,
    'clock',
    {
      status: 'ok',
      timestamp: now,
      superCycle: {
        projectionMode: 'live',
        lastUpdated: '2026-08-06T00:00:00Z',
        processes: [
          {
            processId: 'old',
            name: 'Old process',
            status: 'scheduled',
            lastHeartbeat: '2026-08-06T00:00:00Z',
          },
        ],
      },
    },
    now
  );
  assert.equal(g.sources[0].status, 'stale');
  assert(!g.edges.some((e) => e.type === 'displays' || e.type === 'schedules'));
  assert.equal(
    queryMasterGraph(g, parseGraphQuery(new URLSearchParams()), Date.parse(now)).nodes.length,
    0
  );
  assert.equal(graphAssessment(g, Date.parse(now)).staleObservations, 2);
});
