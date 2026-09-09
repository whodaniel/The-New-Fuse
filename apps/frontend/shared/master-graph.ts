/** Shared by Pages Functions and React. Structural evidence never implies runtime health. */
export type Evidence = {
  source: string;
  observedAt: string;
  status: 'historical' | 'declared' | 'source-present' | 'unknown' | 'observed';
};
export type Observation = {
  source: string;
  observedAt: string | null;
  receivedAt: string;
  status: string;
  freshness: 'fresh' | 'stale' | 'unknown' | 'projected';
  expiresAt: string | null;
};
export type MasterNode = {
  id: string;
  label: string;
  kind: string;
  group?: string;
  href?: string;
  evidence: Evidence;
  observation?: Observation;
  metadata?: Record<string, unknown>;
};
export type MasterEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  directed: boolean;
  evidence: Evidence;
  confidence?: 'explicit' | 'candidate';
  observation?: Observation;
};
export type GraphIssue = { id: string; reason: string; source?: string; target?: string };
export type MasterGraph = {
  schemaVersion: 'tnf.master-graph/v1';
  generatedAt: string;
  snapshotAt: string;
  revision: string;
  nodes: MasterNode[];
  edges: MasterEdge[];
  issues: GraphIssue[];
  sources: {
    id: string;
    status: 'available' | 'unavailable' | 'unauthorized' | 'projected' | 'stale' | 'unknown';
    message?: string;
  }[];
};
export class GraphError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
const record = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 4096;
const date = (v: unknown): v is string => str(v) && Number.isFinite(Date.parse(v));
export function safeGraphHref(v: unknown): v is string {
  return typeof v === 'string' && /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(v) && !v.includes('..');
}
function evidence(v: unknown): v is Evidence {
  return (
    record(v) &&
    str(v.source) &&
    date(v.observedAt) &&
    ['historical', 'declared', 'source-present', 'unknown', 'observed'].includes(v.status)
  );
}
function validObservation(o: unknown): o is Observation {
  return (
    record(o) &&
    str(o.source) &&
    str(o.status) &&
    date(o.receivedAt) &&
    (o.observedAt === null || date(o.observedAt)) &&
    (o.expiresAt === null || date(o.expiresAt)) &&
    ['fresh', 'stale', 'unknown', 'projected'].includes(o.freshness)
  );
}
export function parseMasterGraph(value: unknown): MasterGraph {
  if (
    !record(value) ||
    value.schemaVersion !== 'tnf.master-graph/v1' ||
    !date(value.generatedAt) ||
    !date(value.snapshotAt) ||
    !str(value.revision) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges) ||
    !Array.isArray(value.issues) ||
    !Array.isArray(value.sources)
  )
    throw new GraphError('Invalid master graph envelope', 502);
  if (value.nodes.length > 10000 || value.edges.length > 50000)
    throw new GraphError('Graph exceeds bounded capacity', 502);
  const ids = new Set<string>();
  for (const n of value.nodes) {
    if (
      !record(n) ||
      !str(n.id) ||
      !str(n.label) ||
      !str(n.kind) ||
      !evidence(n.evidence) ||
      (n.group !== undefined && !str(n.group)) ||
      (n.metadata !== undefined && !record(n.metadata)) ||
      ids.has(n.id) ||
      (n.href !== undefined && !safeGraphHref(n.href))
    )
      throw new GraphError('Invalid or duplicate graph node', 502);
    if (n.observation !== undefined && !validObservation(n.observation))
      throw new GraphError('Invalid graph observation', 502);
    ids.add(n.id);
  }
  const edgeIds = new Set<string>();
  const issues = [...value.issues];
  const edges: MasterEdge[] = [];
  for (const e of value.edges) {
    if (
      !record(e) ||
      !str(e.id) ||
      !str(e.source) ||
      !str(e.target) ||
      !str(e.type) ||
      typeof e.directed !== 'boolean' ||
      !evidence(e.evidence) ||
      (e.observation !== undefined && !validObservation(e.observation)) ||
      edgeIds.has(e.id) ||
      (e.confidence !== undefined && !['explicit', 'candidate'].includes(e.confidence))
    )
      throw new GraphError('Invalid or duplicate graph edge', 502);
    edgeIds.add(e.id);
    if (!ids.has(e.source) || !ids.has(e.target))
      issues.push({ id: e.id, reason: 'missing-endpoint', source: e.source, target: e.target });
    else edges.push(e as MasterEdge);
  }
  if (
    issues.some(
      (i) =>
        !record(i) ||
        !str(i.id) ||
        !str(i.reason) ||
        (i.source !== undefined && !str(i.source)) ||
        (i.target !== undefined && !str(i.target))
    ) ||
    value.sources.some(
      (s) =>
        !record(s) ||
        !str(s.id) ||
        (s.message !== undefined && !str(s.message)) ||
        !['available', 'unavailable', 'unauthorized', 'projected', 'stale', 'unknown'].includes(
          s.status
        )
    )
  )
    throw new GraphError('Invalid graph diagnostics', 502);
  return { ...value, edges, issues } as MasterGraph;
}

export type GraphScope = 'runtime' | 'source' | 'all';
export type GraphQuery = {
  scope: GraphScope;
  mode: 'all' | 'neighbors' | 'dependents' | 'path';
  node?: string;
  from?: string;
  to?: string;
  direction: 'out' | 'in' | 'both';
  depth: number;
  limit: number;
  q: string;
  kind: string;
  includeCandidates: boolean;
};
export function parseGraphQuery(params: URLSearchParams): GraphQuery {
  const scope = params.get('scope') || 'runtime';
  if (!['runtime', 'source', 'all'].includes(scope)) throw new GraphError('Invalid evidence scope');
  const mode = params.get('mode') || 'all',
    direction = params.get('direction') || 'out';
  const depth = Number(params.get('depth') || 1),
    limit = Number(params.get('limit') || 2000);
  if (
    !['all', 'neighbors', 'dependents', 'path'].includes(mode) ||
    !['out', 'in', 'both'].includes(direction) ||
    !Number.isInteger(depth) ||
    depth < 1 ||
    depth > 8 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 2000
  )
    throw new GraphError('Invalid mode, direction, depth (1–8), or limit (1–2000)');
  if (params.toString().length > 8192) throw new GraphError('Query too long');
  if (mode === 'path' && (!params.get('from') || !params.get('to')))
    throw new GraphError('Path requires from and to node IDs');
  if (['neighbors', 'dependents'].includes(mode) && !params.get('node'))
    throw new GraphError('Traversal requires a node ID');
  return {
    scope: scope as GraphScope,
    mode: mode as GraphQuery['mode'],
    direction: direction as GraphQuery['direction'],
    depth,
    limit,
    node: params.get('node') || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    q: params.get('q') || '',
    kind: params.get('kind') || '',
    includeCandidates: params.get('includeCandidates') === 'true',
  };
}
export function inEvidenceScope(
  item: MasterNode | MasterEdge,
  scope: GraphScope,
  now = Date.now()
) {
  if (scope === 'all') return true;
  if (scope === 'runtime')
    return !!item.observation && currentFreshness(item.observation, now) === 'fresh';
  return !item.observation && ['declared', 'source-present'].includes(item.evidence.status);
}

export function graphAssessment(graph: MasterGraph, now = Date.now()) {
  const count = (freshness: Observation['freshness']) =>
    graph.nodes.filter((n) => n.observation && currentFreshness(n.observation, now) === freshness)
      .length;
  return {
    functionalWiring: 'unverified' as const,
    explanation:
      'Source presence, route declarations, and telemetry do not verify end-to-end functional wiring. Historical relationships are unverified claims.',
    historicalNodes: graph.nodes.filter((n) => n.evidence.status === 'historical').length,
    historicalRelationships: graph.edges.filter((e) => e.evidence.status === 'historical').length,
    sourceNodes: graph.nodes.filter((n) => inEvidenceScope(n, 'source', now)).length,
    freshObservations: count('fresh'),
    staleObservations: count('stale'),
    unknownObservations: count('unknown'),
    projectedObservations: count('projected'),
  };
}

export function queryMasterGraph(graph: MasterGraph, q: GraphQuery, now = Date.now()) {
  const nodes = graph.nodes.filter(
    (n) =>
      inEvidenceScope(n, q.scope, now) &&
      (!q.kind || n.kind === q.kind) &&
      (!q.q || `${n.id} ${n.label}`.toLowerCase().includes(q.q.toLowerCase()))
  );
  const allowed = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter(
    (e) =>
      inEvidenceScope(e, q.scope, now) &&
      allowed.has(e.source) &&
      allowed.has(e.target) &&
      (q.includeCandidates || e.confidence !== 'candidate')
  );
  const adj = new Map<string, { node: string; edge: MasterEdge }[]>();
  const add = (a: string, b: string, edge: MasterEdge) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ node: b, edge });
  };
  const direction = q.mode === 'dependents' ? 'in' : q.direction;
  for (const e of edges) {
    if (direction !== 'in' || !e.directed) add(e.source, e.target, e);
    if (direction !== 'out' || !e.directed) add(e.target, e.source, e);
  }
  const start = q.mode === 'all' ? undefined : q.mode === 'path' ? q.from : q.node;
  for (const id of [start, q.mode === 'path' ? q.to : undefined])
    if (id && !allowed.has(id)) throw new GraphError('Node not found in the filtered graph', 404);
  let selected = new Set<string>(),
    path: string[] | null = null;
  let truncated = false;
  if (q.mode === 'all') {
    selected = new Set(nodes.slice(0, q.limit).map((n) => n.id));
    truncated = nodes.length > q.limit;
  } else {
    const queue = [{ id: start!, depth: 0 }],
      prev = new Map<string, string | null>([[start!, null]]);
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      if (q.mode === 'path' && current.id === q.to) break;
      if (q.mode !== 'path' && current.depth >= q.depth) continue;
      for (const next of adj.get(current.id) || []) {
        if (prev.has(next.node)) continue;
        if (prev.size >= q.limit) {
          truncated = true;
          continue;
        }
        prev.set(next.node, current.id);
        queue.push({ id: next.node, depth: current.depth + 1 });
      }
    }
    selected = new Set(prev.keys());
    if (q.mode === 'path') {
      path = prev.has(q.to!) ? [] : null;
      if (path) {
        let id: string | null = q.to!;
        while (id !== null) {
          path.unshift(id);
          id = prev.get(id)!;
        }
      }
      selected = new Set(path || []);
    }
  }
  return {
    nodes: nodes.filter((n) => selected.has(n.id)),
    edges: edges.filter((e) => selected.has(e.source) && selected.has(e.target)),
    path,
    truncated,
    matchedNodes: nodes.length,
    scope: q.scope,
    functionalWiring: 'unverified' as const,
    direction,
  };
}

export function observation(
  source: string,
  observedAt: unknown,
  receivedAt: string,
  status: string,
  ttlMs: number,
  projected = false
): Observation {
  const valid = date(observedAt) && Date.parse(observedAt) <= Date.parse(receivedAt) + 5000;
  const expiresAt = valid ? new Date(Date.parse(observedAt) + ttlMs).toISOString() : null;
  return {
    source,
    observedAt: valid ? observedAt : null,
    receivedAt,
    status,
    expiresAt,
    freshness: projected
      ? 'projected'
      : !valid
        ? 'unknown'
        : Date.parse(expiresAt!) < Date.parse(receivedAt)
          ? 'stale'
          : 'fresh',
  };
}
export function currentFreshness(o: Observation, now = Date.now()): Observation['freshness'] {
  return o.freshness === 'fresh' && o.expiresAt && Date.parse(o.expiresAt) < now
    ? 'stale'
    : o.freshness;
}

/** Runtime payloads are tenant-authorized by their existing APIs; never persist or publicly cache them. */
export function attachRuntime(
  graph: MasterGraph,
  kind: 'clock' | 'terminals',
  payload: unknown,
  now: string
): void {
  if (!record(payload)) throw new GraphError('Invalid runtime response', 502);
  const source = kind === 'clock' ? '/api/system/master-clock' : '/api/terminals/graph';
  const proof: Evidence = { source, observedAt: now, status: 'observed' };
  const existing = new Set(graph.nodes.map((n) => n.id));
  const root = kind === 'clock' ? 'runtime:master-clock' : 'runtime:terminal-inventory';
  const append = (node: MasterNode) => {
    if (!existing.has(node.id)) {
      graph.nodes.push(node);
      existing.add(node.id);
    }
  };
  const link = (
    a: string,
    b: string,
    type: string,
    confidence: 'explicit' | 'candidate' = 'explicit',
    observed?: Observation
  ) => {
    if (existing.has(a) && existing.has(b))
      graph.edges.push({
        id: `${source}:${a}:${type}:${b}`,
        source: a,
        target: b,
        type,
        directed: true,
        evidence: proof,
        confidence,
        observation: observed,
      });
  };
  if (kind === 'clock') {
    if (
      !record(payload.superCycle) ||
      !Array.isArray(payload.superCycle.processes) ||
      payload.superCycle.processes.length > 1000 ||
      !['ok', 'degraded'].includes(payload.status) ||
      !date(payload.timestamp)
    )
      throw new GraphError('Invalid master-clock telemetry', 502);
    const projected = payload.superCycle.projectionMode !== 'live';
    const ttl = Number(payload.superCycle.staleThresholdMs);
    const ttlMs = Number.isFinite(ttl) && ttl > 0 ? Math.min(ttl, 86400000) : 90000;
    append({
      id: root,
      label: 'Master clock',
      kind: 'runtime',
      href: '/visualizations',
      evidence: proof,
      observation: observation(
        source,
        payload.superCycle.lastUpdated,
        now,
        payload.status,
        ttlMs,
        projected
      ),
    });
    // Listing telemetry does not prove that a route displays or operates this process.
    for (const p of payload.superCycle.processes) {
      if (!record(p) || !str(p.processId) || !str(p.name) || !str(p.status))
        throw new GraphError('Invalid clock process', 502);
      const id = `clock-process:${p.processId}`;
      const o = observation(
        source,
        p.lastHeartbeat || p.lastRunAt,
        now,
        p.status,
        ttlMs,
        projected
      );
      if (p.stale === true && o.freshness === 'fresh') o.freshness = 'stale';
      append({ id, label: p.name, kind: 'scheduled-process', evidence: proof, observation: o });
      link(root, id, 'reports_process', 'explicit', o);
      const target = record(p.metadata) ? p.metadata.graphNodeId : undefined;
      if (str(target)) {
        if (existing.has(target)) link(id, target, 'observes', 'explicit', o);
        else graph.issues.push({ id, target, reason: 'unresolved-explicit-runtime-identity' });
      }
    }
    const observed = graph.nodes.filter((n) => n.observation?.source === source);
    const hasFresh = observed.some(
      (n) => currentFreshness(n.observation!, Date.parse(now)) === 'fresh'
    );
    const hasStale = observed.some(
      (n) => currentFreshness(n.observation!, Date.parse(now)) === 'stale'
    );
    graph.sources.push({
      id: source,
      status: projected
        ? 'projected'
        : payload.status !== 'ok'
          ? 'unavailable'
          : hasFresh
            ? 'available'
            : hasStale
              ? 'stale'
              : 'unknown',
      message: projected
        ? 'Contract projection; not live process evidence'
        : 'Endpoint reachable; observation freshness is evaluated separately. Reported schedules do not prove execution or functional wiring.',
    });
  } else {
    if (
      payload.available !== true ||
      !record(payload.graph) ||
      !Array.isArray(payload.graph.nodes) ||
      !Array.isArray(payload.graph.edges) ||
      payload.graph.nodes.length > 2000 ||
      payload.graph.edges.length > 5000 ||
      !record(payload.safety) ||
      payload.safety.commandsRedacted !== true
    )
      throw new GraphError('Terminal inventory unavailable or invalid', 502);
    // Response generation time is not observation time. Use the inventory mirror timestamp.
    const seen = record(payload.source) ? payload.source.mirroredAt : null;
    const o = observation(source, seen, now, 'observed', 90000);
    append({
      id: root,
      label: 'Terminal inventory',
      kind: 'runtime',
      href: '/terminals',
      evidence: proof,
      observation: o,
    });

    for (const n of payload.graph.nodes) {
      if (!record(n) || !str(n.id) || !str(n.label) || !str(n.type))
        throw new GraphError('Invalid terminal node', 502);
      const id = `twip:${n.id}`;
      append({
        id,
        label: n.label,
        kind: `terminal-${n.type}`,
        evidence: proof,
        observation: o,
        href: '/terminals',
      });
      link(root, id, 'contains', 'explicit', o);
      const data = record(n.data) ? n.data : {};
      if (str(data.graphNodeId)) {
        if (existing.has(data.graphNodeId)) link(id, data.graphNodeId, 'observes', 'explicit', o);
        else
          graph.issues.push({
            id,
            target: data.graphNodeId,
            reason: 'unresolved-explicit-runtime-identity',
          });
      } else if (str(data.matchedAgentId)) {
        // Existing registry matching is heuristic. It is a candidate, never proof of execution.
        const target = data.matchedAgentId.startsWith('agent:')
          ? data.matchedAgentId
          : `agent:${data.matchedAgentId}`;
        if (existing.has(target)) link(id, target, 'identity_candidate', 'candidate', o);
        else graph.issues.push({ id, target, reason: 'unresolved-identity-candidate' });
      }
    }
    for (const e of payload.graph.edges) {
      if (!record(e) || !str(e.source) || !str(e.target) || !str(e.type))
        throw new GraphError('Invalid terminal edge', 502);
      link(
        `twip:${e.source}`,
        `twip:${e.target}`,
        e.type,
        e.type.endsWith('_hint') ? 'candidate' : 'explicit',
        o
      );
    }
    graph.sources.push({
      id: source,
      status: o.freshness === 'fresh' ? 'available' : o.freshness,
      message:
        o.freshness === 'fresh' ? undefined : 'Inventory observation is stale or has no timestamp',
    });
  }
}
