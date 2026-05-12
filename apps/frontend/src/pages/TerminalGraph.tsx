import { fetchTerminalGraph } from '@/services/terminalGraph.service';
import type { TerminalGraphResponse } from '@/types/terminal-graph';
import {
  AlertCircle,
  ArrowLeft,
  Cable,
  Cpu,
  Network,
  RefreshCw,
  Shield,
  TerminalSquare,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_LIMIT = 200;
const NODE_COLUMN_ORDER = ['tenant', 'host', 'terminal', 'pane', 'process', 'runtime'] as const;
const NODE_COLOR: Record<string, string> = {
  tenant: '#22d3ee',
  host: '#60a5fa',
  terminal: '#34d399',
  pane: '#f59e0b',
  process: '#f97316',
  runtime: '#a78bfa',
};

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString();
};

const TerminalGraphPage: React.FC = () => {
  const [data, setData] = useState<TerminalGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('tnf-local');
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [includeCommands, setIncludeCommands] = useState(false);
  const [includeProcessNodes, setIncludeProcessNodes] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchTerminalGraph({
        tenantId: tenantId.trim() || undefined,
        limit,
        includeCommands,
        includeProcessNodes,
      });
      setData(payload);
    } catch (loadError) {
      setError((loadError as Error).message || 'Failed to fetch terminal graph');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryItems = useMemo(
    () => [
      {
        id: 'terminals',
        label: 'Terminals',
        value: data?.summary.returnedTerminals ?? 0,
        icon: TerminalSquare,
      },
      {
        id: 'nodes',
        label: 'Graph Nodes',
        value: data?.summary.nodeCount ?? 0,
        icon: Network,
      },
      {
        id: 'edges',
        label: 'Graph Edges',
        value: data?.summary.edgeCount ?? 0,
        icon: Cable,
      },
      {
        id: 'runtime-hints',
        label: 'Runtime Hints',
        value: data?.summary.runtimeHintCount ?? 0,
        icon: Cpu,
      },
    ],
    [data]
  );

  const layout = useMemo(() => {
    const nodes = data?.graph.nodes || [];
    const edges = data?.graph.edges || [];
    const width = 1200;
    const rowHeight = 86;
    const topPadding = 36;
    const columnGap = width / (NODE_COLUMN_ORDER.length + 1);
    const grouped = new Map<string, typeof nodes>();

    const columnTypes = new Set<string>(NODE_COLUMN_ORDER);
    for (const node of nodes) {
      const type = columnTypes.has(node.type) ? node.type : 'runtime';
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(node);
    }

    for (const [type, list] of grouped.entries()) {
      grouped.set(
        type,
        [...list].sort((a, b) => a.label.localeCompare(b.label))
      );
    }

    const positioned = new Map<
      string,
      {
        x: number;
        y: number;
        node: (typeof nodes)[number];
      }
    >();

    let maxRows = 1;
    NODE_COLUMN_ORDER.forEach((type, columnIndex) => {
      const list = grouped.get(type) || [];
      maxRows = Math.max(maxRows, list.length);
      const x = columnGap * (columnIndex + 1);
      list.forEach((node, rowIndex) => {
        positioned.set(node.id, {
          x,
          y: topPadding + rowHeight * rowIndex,
          node,
        });
      });
    });

    const height = Math.max(280, topPadding + rowHeight * maxRows + 36);

    return {
      width,
      height,
      nodes: positioned,
      edges: edges
        .filter((edge) => positioned.has(edge.source) && positioned.has(edge.target))
        .map((edge) => ({
          edge,
          source: positioned.get(edge.source)!,
          target: positioned.get(edge.target)!,
        })),
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/visualizations"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Visualizations
            </Link>
            <h1 className="text-3xl font-semibold text-white">Terminal Graph</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Holistic TWIP projection of terminal identities, process topology, and runtime
              ownership hints for TNF agent orchestration.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
            <div className="font-semibold uppercase tracking-[0.2em]">Safety Default</div>
            <div className="mt-1">Commands remain redacted unless explicitly requested.</div>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Tenant ID</span>
              <input
                className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                placeholder="tnf-local"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Limit</span>
              <input
                className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                type="number"
                min={1}
                max={1000}
                value={limit}
                onChange={(event) => setLimit(Math.max(1, Number(event.target.value) || 1))}
              />
            </label>
            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={includeProcessNodes}
                onChange={(event) => setIncludeProcessNodes(event.target.checked)}
              />
              Include process nodes
            </label>
            <label className="flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <input
                type="checkbox"
                checked={includeCommands}
                onChange={(event) => setIncludeCommands(event.target.checked)}
              />
              Include commands (sensitive)
            </label>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Graph
            </button>
          </div>
        </section>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">Failed to load terminal graph</div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          </div>
        ) : null}

        {!error && data?.available === false ? (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
            <div className="font-semibold">Terminal inventory unavailable</div>
            <div className="mt-1 text-sm">{data.message || 'TWIP snapshot not found.'}</div>
          </div>
        ) : null}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </span>
                <item.icon className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Generated</div>
              <div className="mt-1 text-sm text-slate-200">
                {formatTimestamp(data?.generatedAt)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Snapshot Path</div>
              <div className="mt-1 break-all text-sm text-slate-200">
                {data?.source.snapshotPath || 'n/a'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Mirrored At</div>
              <div className="mt-1 text-sm text-slate-200">
                {formatTimestamp(data?.source.mirroredAt)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Registry Agents Indexed
              </div>
              <div className="mt-1 text-sm text-slate-200">
                {data?.registryContext.indexedAgents ?? 0}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-300">Topology Canvas</div>
            <div className="text-xs text-slate-400">
              Column layout: tenant to host to terminal to pane/process/runtime
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-2">
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="h-[420px] min-w-[980px] w-full"
              role="img"
              aria-label="Terminal topology graph"
            >
              {layout.edges.map(({ edge, source, target }, index) => (
                <line
                  key={`${edge.id}-${index}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth={1.4}
                />
              ))}
              {Array.from(layout.nodes.values()).map(({ node, x, y }) => (
                <g key={node.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    fill={NODE_COLOR[node.type] || '#94a3b8'}
                    fillOpacity={0.28}
                    stroke={NODE_COLOR[node.type] || '#94a3b8'}
                    strokeWidth={1.6}
                  />
                  <text x={x + 19} y={y + 4} fill="#e2e8f0" fontSize="12">
                    {node.label}
                  </text>
                  <text x={x + 19} y={y - 10} fill="#94a3b8" fontSize="10">
                    {node.type}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
            <Shield className="h-4 w-4 text-cyan-200" />
            Terminal identities ({data?.terminals.length ?? 0})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-auto border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-3 py-2">TWID</th>
                  <th className="px-3 py-2">Tenant</th>
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2">PTY</th>
                  <th className="px-3 py-2">Pane</th>
                  <th className="px-3 py-2">Shell PID</th>
                  <th className="px-3 py-2">Runtime Hints</th>
                  <th className="px-3 py-2">Commands</th>
                </tr>
              </thead>
              <tbody>
                {(data?.terminals || []).map((terminal, index) => (
                  <tr
                    key={String(terminal.twid || `terminal-${index}`)}
                    className="border-b border-white/10"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-cyan-100">
                      {String(terminal.twid || 'n/a')}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {terminal.scope?.tenant_id || 'n/a'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-200">
                      {terminal.scope?.host_id || 'n/a'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-200">
                      {terminal.pty?.path || 'n/a'}
                    </td>
                    <td className="px-3 py-2 text-slate-200">{terminal.scope?.pane_id || 'n/a'}</td>
                    <td className="px-3 py-2 text-slate-200">
                      {typeof terminal.process?.shell_pid === 'number'
                        ? terminal.process.shell_pid
                        : 'n/a'}
                    </td>
                    <td className="px-3 py-2">
                      {(terminal.ownershipHints || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(terminal.ownershipHints || []).map((hint, idx) => (
                            <span
                              key={`${hint.runtimeId}-${idx}`}
                              className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-100"
                            >
                              {hint.runtimeLabel} ({Math.round(hint.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {Array.isArray(terminal.active_commands) ? (
                        <div className="space-y-1">
                          {terminal.active_commands.slice(0, 3).map((command, idx) => (
                            <div key={idx} className="font-mono text-xs text-amber-100">
                              {command}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Redacted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TerminalGraphPage;
