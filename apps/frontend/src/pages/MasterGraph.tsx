import { useMasterGraph } from '@/hooks/useMasterGraph';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  currentFreshness,
  graphAssessment,
  inEvidenceScope,
  parseGraphQuery,
  queryMasterGraph,
  type GraphScope,
  type MasterNode,
} from '../../shared/master-graph';

const button =
  'rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700 disabled:opacity-40';
const input = 'w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100';
const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#2dd4bf', '#f472b6'];

export default function MasterGraph({ embedded = false }: { embedded?: boolean }) {
  const { graph, error, loading, now, reload } = useMasterGraph();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<GraphScope>('runtime');
  const [selected, setSelected] = useState(params.get('node') || '');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [mode, setMode] = useState<'all' | 'neighbors' | 'dependents' | 'path'>('all');
  const [depth, setDepth] = useState('1');
  const [direction, setDirection] = useState('out');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [candidates, setCandidates] = useState(false);
  const [tab, setTab] = useState<'nodes' | 'issues'>('nodes');
  const kinds = useMemo(() => [...new Set(graph?.nodes.map((n) => n.kind) || [])].sort(), [graph]);
  const result = useMemo(() => {
    if (!graph) return null;
    try {
      const query = parseGraphQuery(
        new URLSearchParams({
          mode,
          scope,
          node: selected,
          from,
          to,
          direction,
          depth,
          limit: '2000',
          q: search,
          kind,
          includeCandidates: String(candidates),
        })
      );
      return { ...queryMasterGraph(graph, query, now), error: '' };
    } catch (e) {
      return {
        nodes: [],
        edges: [],
        path: null,
        truncated: false,
        error: e instanceof Error ? e.message : 'Invalid traversal',
      };
    }
  }, [graph, mode, selected, from, to, direction, depth, search, kind, candidates, scope, now]);
  const scene = useMemo(() => {
    if (!result) return { nodes: [], edges: [] };
    const counts = new Map<string, number>();
    const nodes: Node[] = result.nodes.map((n) => {
      const column = kinds.indexOf(n.kind),
        row = counts.get(n.kind) || 0;
      counts.set(n.kind, row + 1);
      return {
        id: n.id,
        data: {
          label: `${n.label} · ${n.observation ? currentFreshness(n.observation, now) + ' observation' : n.evidence.status}`,
        },
        position: { x: column * 300 + (row % 2) * 130, y: Math.floor(row / 2) * 90 },
        style: {
          width: 125,
          background: '#0f172a',
          color: '#f1f5f9',
          border: `2px solid ${colors[column % colors.length]}`,
          fontSize: 11,
          overflowWrap: 'anywhere',
        },
        selected: n.id === selected,
      };
    });
    const edges: Edge[] = result.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: result.nodes.length < 35 ? e.type : undefined,
      markerEnd: e.directed ? { type: MarkerType.ArrowClosed } : undefined,
      style: {
        stroke: e.confidence === 'candidate' ? '#fbbf24' : '#64748b',
        strokeDasharray:
          e.confidence === 'candidate' || e.evidence.status === 'historical' ? '5 5' : undefined,
      },
      labelStyle: { fill: '#e2e8f0' },
      labelBgStyle: { fill: '#0f172a' },
    }));
    return { nodes, edges };
  }, [result, kinds, selected, now]);
  const assessment = graph ? graphAssessment(graph, now) : null;
  const scopedNodes = graph?.nodes.filter((n) => inEvidenceScope(n, scope, now)) || [];
  const chosen = scopedNodes.find((n) => n.id === selected);
  const neighbors =
    graph?.edges.filter(
      (e) =>
        (e.source === selected || e.target === selected) &&
        inEvidenceScope(e, scope, now) &&
        (candidates || e.confidence !== 'candidate') &&
        scopedNodes.some((n) => n.id === e.source) &&
        scopedNodes.some((n) => n.id === e.target)
    ) || [];
  const choose = (id: string) => {
    setSelected(id);
    if (!embedded) {
      const next = new URLSearchParams(params);
      next.set('node', id);
      setParams(next, { replace: true });
    }
  };
  const status = (n: MasterNode) =>
    n.observation
      ? `${currentFreshness(n.observation, now)} · ${n.observation.status}`
      : n.evidence.status;
  return (
    <div className={`${embedded ? '' : 'min-h-screen'} bg-slate-950 p-4 text-slate-100 md:p-6`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {!embedded && (
            <Link to="/visualizations" className="text-sm text-cyan-300">
              ← Visualizations
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-semibold">Master graph</h1>
          <p className="mt-1 text-sm text-slate-400">
            Evidence explorer · functional wiring has not been verified.
          </p>
          {graph && (
            <p className="mt-2 text-xs text-slate-400">
              {graph.nodes.length} nodes · {graph.edges.length} relationships with resolved
              endpoints · legacy snapshot {graph.snapshotAt.slice(0, 10)} · build{' '}
              {graph.revision.slice(0, 12)}
            </p>
          )}
        </div>
        <button className={button} onClick={reload} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-rose-950 p-3 text-rose-200">
          {error}
          {graph ? '. Showing the previous response; freshness continues to age.' : ''}
        </p>
      )}
      {!graph && !error && <p role="status">Loading graph…</p>}
      {graph && (
        <>
          <div
            className="mb-4 rounded-lg border border-amber-700 bg-amber-950/30 p-3 text-sm"
            aria-label="Verification coverage"
          >
            <strong>Functional wiring: unverified</strong>
            <p>
              Fresh telemetry is an observation, not proof that a feature works end to end. Source
              declarations and historical relationships require separate verification.
            </p>
            <p className="mt-2">
              {assessment?.freshObservations} fresh observations · {assessment?.staleObservations}{' '}
              stale · {assessment?.unknownObservations} without a reliable timestamp ·{' '}
              {assessment?.projectedObservations} projected
            </p>
            <p>
              {assessment?.historicalNodes} legacy nodes · {assessment?.historicalRelationships}{' '}
              legacy relationships excluded from fresh and source views.
            </p>
          </div>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="Graph sources">
            {graph.sources.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-700 px-3 py-2 text-xs">
                <span className={s.status === 'available' ? 'text-cyan-300' : 'text-amber-300'}>
                  {s.id.startsWith('/api/') ? s.id.split('/').pop() : 'Evidence file'}: {s.status}
                </span>
                {s.message && <p className="mt-1 max-w-lg text-slate-400">{s.message}</p>}
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
            <aside className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-3">
              <label className="block text-sm">
                Evidence scope
                <select
                  className={`${input} mt-1`}
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as GraphScope);
                    setSelected('');
                    setFrom('');
                    setTo('');
                    setMode('all');
                  }}
                >
                  <option value="runtime">Fresh runtime observations</option>
                  <option value="source">Current source declarations (unverified behavior)</option>
                  <option value="all">All evidence, including legacy and stale</option>
                </select>
              </label>
              <label className="block text-sm">
                Search nodes
                <input
                  className={`${input} mt-1`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or ID"
                />
              </label>
              <label className="block text-sm">
                Node type
                <select
                  className={`${input} mt-1`}
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="">All types</option>
                  {kinds.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Traversal
                <select
                  className={`${input} mt-1`}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
                >
                  <option value="all">All matching nodes</option>
                  <option value="neighbors">Neighbors of selected node</option>
                  <option value="dependents">Incoming relationships (impact candidates)</option>
                  <option value="path">Shortest path</option>
                </select>
              </label>
              {mode !== 'all' && (
                <>
                  <label className="block text-sm">
                    Direction
                    <select
                      className={`${input} mt-1`}
                      value={mode === 'dependents' ? 'in' : direction}
                      disabled={mode === 'dependents'}
                      onChange={(e) => setDirection(e.target.value)}
                    >
                      <option value="out">Outgoing</option>
                      <option value="in">Incoming</option>
                      <option value="both">Either direction</option>
                    </select>
                  </label>
                  {mode !== 'path' && (
                    <label className="block text-sm">
                      Depth
                      <select
                        className={`${input} mt-1`}
                        value={depth}
                        onChange={(e) => setDepth(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
              {mode === 'path' && (
                <>
                  <label className="block text-sm">
                    From
                    <select
                      className={input}
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                    >
                      <option value="">Select start</option>
                      {scopedNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    To
                    <select className={input} value={to} onChange={(e) => setTo(e.target.value)}>
                      <option value="">Select destination</option>
                      {scopedNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <label className="flex gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={candidates}
                  onChange={(e) => setCandidates(e.target.checked)}
                />
                Include unverified identity candidates
              </label>
              <div className="flex gap-2">
                <button className={button} onClick={() => setTab('nodes')}>
                  Nodes ({result?.nodes.length || 0})
                </button>
                <button className={button} onClick={() => setTab('issues')}>
                  Issues ({graph.issues.length})
                </button>
              </div>
              <div
                className="max-h-80 overflow-auto"
                aria-label={tab === 'nodes' ? 'Matching nodes' : 'Graph issues'}
              >
                {tab === 'nodes'
                  ? result?.nodes.map((n) => (
                      <button
                        key={n.id}
                        aria-label={`Inspect ${n.label}`}
                        className={`mb-1 block w-full rounded p-2 text-left text-xs ${selected === n.id ? 'bg-cyan-950' : 'hover:bg-slate-800'}`}
                        onClick={() => choose(n.id)}
                      >
                        <span className="block break-all">{n.label}</span>
                        <span className="text-slate-400">
                          {n.kind} · {status(n)}
                        </span>
                      </button>
                    ))
                  : graph.issues.map((i, index) => (
                      <div
                        key={`${i.id}:${index}`}
                        className="mb-2 break-all rounded border border-amber-900 p-2 text-xs"
                      >
                        <b>{i.reason}</b>
                        <p>
                          {i.source || i.id} → {i.target || 'unknown'}
                        </p>
                      </div>
                    ))}
              </div>
            </aside>
            <section
              className="min-w-0 rounded-xl border border-slate-700"
              aria-label="Interactive master graph"
            >
              <div className="border-b border-slate-700 p-3 text-xs text-slate-400">
                Scroll to zoom · drag to pan · select a node for evidence. Arrows show relationship
                direction.
              </div>
              {result?.error && (
                <p role="alert" className="p-3 text-amber-300">
                  {result.error}
                </p>
              )}
              {!result?.error && result?.nodes.length === 0 && (
                <p role="status" className="p-3">
                  {mode === 'path'
                    ? 'No path found with these filters and direction.'
                    : scope === 'runtime'
                      ? 'No fresh runtime observations match. Functional wiring remains unverified; inspect the other evidence scopes for source and stale records.'
                      : 'No nodes match these filters.'}
                </p>
              )}
              {result?.truncated && (
                <p className="p-3 text-amber-300">
                  Result reached its node limit. Narrow the filters.
                </p>
              )}
              {result?.path && (
                <p className="break-all p-3 text-xs text-cyan-300">{result.path.join(' → ')}</p>
              )}
              <div style={{ height: embedded ? 480 : 650 }}>
                <ReactFlow
                  key={`${scope}:${mode}:${kind}:${search}:${depth}:${direction}:${from}:${to}:${candidates}:${mode === 'all' ? '' : selected}:${graph.revision}`}
                  nodes={scene.nodes}
                  edges={scene.edges}
                  onNodeClick={(_, n) => choose(n.id)}
                  fitView
                  minZoom={0.02}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  attributionPosition="bottom-left"
                >
                  <Background color="#334155" />
                  <Controls showInteractive={false} />
                  <MiniMap nodeColor="#38bdf8" maskColor="#020617aa" />
                </ReactFlow>
              </div>
            </section>
            <aside
              className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-3 text-sm"
              aria-label="Node evidence"
            >
              {chosen ? (
                <>
                  <h2 className="break-all text-lg font-semibold">{chosen.label}</h2>
                  <p className="break-all text-xs text-slate-400">{chosen.id}</p>
                  <p>{status(chosen)}</p>
                  <p className="break-all text-xs text-slate-400">
                    Evidence: {chosen.evidence.source}
                    <br />
                    Evidence recorded at {chosen.evidence.observedAt}
                  </p>
                  <p className="text-xs text-slate-400">
                    Historical means an unverified legacy claim. Source presence and declarations
                    establish only that source exists. Telemetry reports an observation. None
                    establishes completed functional wiring.
                  </p>
                  {chosen.observation && (
                    <p className="text-xs">
                      Observed: {chosen.observation.observedAt || 'unknown'}
                      <br />
                      Received: {chosen.observation.receivedAt}
                      <br />
                      Source: {chosen.observation.source}
                    </p>
                  )}
                  {chosen.href && (
                    <Link className="block text-cyan-300 underline" to={chosen.href}>
                      Open app destination →
                    </Link>
                  )}
                  <button
                    className={button}
                    onClick={() => {
                      setSearch('');
                      setKind('');
                      setMode('neighbors');
                    }}
                  >
                    Explore neighbors
                  </button>
                  <h3 className="font-semibold">Relationships ({neighbors.length})</h3>
                  <div className="max-h-72 overflow-auto">
                    {neighbors.map((e) => {
                      const id = e.source === chosen.id ? e.target : e.source;
                      return (
                        <button
                          key={e.id}
                          className="mb-2 block w-full break-all text-left text-xs text-cyan-200"
                          onClick={() => choose(id)}
                        >
                          {e.source === chosen.id ? '→' : '←'} {e.type}·{' '}
                          {e.observation
                            ? currentFreshness(e.observation, now) + ' observation'
                            : e.evidence.status}
                          {e.confidence === 'candidate' ? ' (identity candidate)' : ''}
                          <span className="block text-slate-400">
                            {graph.nodes.find((n) => n.id === id)?.label || id}
                            <br />
                            {e.evidence.source} ·{' '}
                            {e.observation?.observedAt || e.evidence.observedAt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-slate-400">
                  Select a node to inspect its evidence, runtime freshness, relationships, and app
                  destination.
                </p>
              )}
              <Link className="block text-xs text-cyan-300" to="/terminals">
                Open terminal graph
              </Link>
              <a
                className="block text-xs text-cyan-300"
                href="/api/master-graph?live=false&scope=source"
              >
                Machine-readable structural graph
              </a>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
