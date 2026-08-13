import React, { useEffect, useMemo, useState } from 'react';
import WebSocketService from '../../services/WebSocketService';

type EndpointStatus = 'active' | 'degraded' | 'standby';
type LayoutMode = 'grid' | 'tabs' | 'single';

interface AgentCardData {
  id: string;
  name: string;
  endpoint: string;
  modelType: string;
  status: EndpointStatus;
  uptime: string;
  role: string;
  latencyMs: number;
  capabilities: string[];
  pfp: string;
}

interface RealtimeAgentPayload {
  id?: string;
  agentId?: string;
  name?: string;
  agentName?: string;
  endpoint?: string;
  status?: string;
  state?: string;
  latency?: number;
  latencyMs?: number;
  uptime?: number | string;
  metrics?: {
    latencyMs?: number;
    latency?: number;
    uptime?: number | string;
  };
  agent?: {
    id?: string;
    name?: string;
    endpoint?: string;
    status?: string;
    latencyMs?: number;
    uptime?: number | string;
  };
}

const AGENT_CARDS: AgentCardData[] = [
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo AI',
    endpoint: 'https://duckduckgo.com/aichat',
    modelType: 'Multi-model (GPT/Claude/Llama)',
    status: 'active',
    uptime: '99.9%',
    role: 'Research Scout',
    latencyMs: 340,
    capabilities: ['Web Search', 'Fast Q&A', 'Multi-model routing'],
    pfp: '🦆',
  },
  {
    id: 'huggingchat',
    name: 'HuggingChat',
    endpoint: 'https://huggingface.co/chat/',
    modelType: 'Open-source model hub',
    status: 'active',
    uptime: '99.3%',
    role: 'OSS Specialist',
    latencyMs: 410,
    capabilities: ['Model Comparison', 'Open Models', 'Prompt Iteration'],
    pfp: '🤗',
  },
  {
    id: 'venice',
    name: 'Venice AI',
    endpoint: 'https://venice.ai/chat',
    modelType: 'Llama family',
    status: 'degraded',
    uptime: '97.4%',
    role: 'Deep Reasoner',
    latencyMs: 780,
    capabilities: ['Long-form reasoning', 'Agentic workflows', 'Tool planning'],
    pfp: '🛶',
  },
  {
    id: 'blackbox',
    name: 'Blackbox AI',
    endpoint: 'https://www.blackbox.ai/',
    modelType: 'Coding-focused',
    status: 'active',
    uptime: '99.1%',
    role: 'Code Pair',
    latencyMs: 290,
    capabilities: ['Code generation', 'Snippet search', 'Debug hints'],
    pfp: '⬛',
  },
  {
    id: 'lmsys',
    name: 'LMSYS Arena',
    endpoint: 'https://chat.lmsys.org/',
    modelType: 'Arena benchmark',
    status: 'standby',
    uptime: '96.8%',
    role: 'Benchmark Judge',
    latencyMs: 620,
    capabilities: ['A/B model tests', 'Leaderboard tracking', 'Response eval'],
    pfp: '🏟️',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    endpoint: 'https://www.perplexity.ai/',
    modelType: 'Answer engine',
    status: 'active',
    uptime: '99.7%',
    role: 'Citation Analyst',
    latencyMs: 270,
    capabilities: ['Cited answers', 'Source synthesis', 'Rapid briefings'],
    pfp: '🔎',
  },
];

const statusClasses: Record<EndpointStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  degraded: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  standby: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const statusLabel: Record<EndpointStatus, string> = {
  active: 'Active',
  degraded: 'Degraded',
  standby: 'Standby',
};

function normalizeStatus(status: unknown, currentStatus: EndpointStatus): EndpointStatus {
  if (typeof status !== 'string') return currentStatus;

  const normalized = status.toLowerCase();
  if (['active', 'online', 'healthy', 'running'].includes(normalized)) return 'active';
  if (['degraded', 'busy', 'warning', 'error'].includes(normalized)) return 'degraded';
  if (['standby', 'inactive', 'offline', 'idle'].includes(normalized)) return 'standby';
  return currentStatus;
}

function formatUptime(uptime: unknown, currentUptime: string): string {
  if (typeof uptime === 'number' && Number.isFinite(uptime)) {
    const percentage = uptime > 1 ? uptime : uptime * 100;
    return `${Math.max(0, Math.min(100, percentage)).toFixed(1)}%`;
  }

  if (typeof uptime === 'string' && uptime.trim().length > 0) {
    return uptime;
  }

  return currentUptime;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const AgentCard = ({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentCardData;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full text-left rounded-md border p-4 backdrop-blur-md transition-all ${
      selected
        ? 'border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
        : 'border-white/10 bg-black/30 hover:bg-transparent/5 hover:border-white/20'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-md bg-transparent/10 flex items-center justify-center text-xl">
          {agent.pfp}
        </div>
        <div>
          <h3 className="text-white font-semibold">{agent.name}</h3>
          <p className="text-xs text-slate-400">{agent.role}</p>
        </div>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full border ${statusClasses[agent.status]}`}>
        {statusLabel[agent.status]}
      </span>
    </div>

    <div className="mt-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Model Type</span>
        <span className="text-slate-200">{agent.modelType}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Uptime</span>
        <span className="text-slate-200">{agent.uptime}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Latency</span>
        <span className="text-slate-200">{agent.latencyMs} ms</span>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {agent.capabilities.map((capability) => (
        <span
          key={`${agent.id}-${capability}`}
          className="px-2 py-1 text-xs rounded-md border border-white/10 bg-transparent/5 text-slate-300"
        >
          {capability}
        </span>
      ))}
    </div>
  </button>
);

const AICommandCenter: React.FC = () => {
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [cards, setCards] = useState<AgentCardData[]>(AGENT_CARDS);
  const [activeId, setActiveId] = useState<string>(AGENT_CARDS[0].id);
  const [showStandby, setShowStandby] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastRealtimeUpdate, setLastRealtimeUpdate] = useState<number | null>(null);

  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    const applyRealtimePayload = (payload: RealtimeAgentPayload) => {
      setCards((prevCards) => {
        const payloadId = String(
          payload.agent?.id ?? payload.id ?? payload.agentId ?? ''
        ).toLowerCase();
        const payloadName = String(
          payload.agent?.name ?? payload.name ?? payload.agentName ?? ''
        ).toLowerCase();
        const payloadEndpoint = String(
          payload.agent?.endpoint ?? payload.endpoint ?? ''
        ).toLowerCase();

        const matchedIndex = prevCards.findIndex((card) => {
          const cardId = card.id.toLowerCase();
          const cardName = card.name.toLowerCase();
          const cardEndpoint = card.endpoint.toLowerCase();
          return (
            (payloadId.length > 0 && payloadId === cardId) ||
            (payloadName.length > 0 && payloadName === cardName) ||
            (payloadEndpoint.length > 0 &&
              (payloadEndpoint.includes(cardId) || cardEndpoint.includes(payloadEndpoint)))
          );
        });

        if (matchedIndex === -1) return prevCards;

        const existing = prevCards[matchedIndex];
        const nextStatus = normalizeStatus(
          payload.agent?.status ?? payload.status ?? payload.state,
          existing.status
        );
        const nextLatency =
          toFiniteNumber(payload.agent?.latencyMs) ??
          toFiniteNumber(payload.latencyMs) ??
          toFiniteNumber(payload.metrics?.latencyMs) ??
          toFiniteNumber(payload.latency) ??
          toFiniteNumber(payload.metrics?.latency) ??
          existing.latencyMs;
        const nextUptime = formatUptime(
          payload.agent?.uptime ?? payload.uptime ?? payload.metrics?.uptime,
          existing.uptime
        );

        if (
          existing.status === nextStatus &&
          existing.latencyMs === nextLatency &&
          existing.uptime === nextUptime
        ) {
          return prevCards;
        }

        const nextCards = [...prevCards];
        nextCards[matchedIndex] = {
          ...existing,
          status: nextStatus,
          latencyMs: nextLatency,
          uptime: nextUptime,
        };
        return nextCards;
      });

      setLastRealtimeUpdate(Date.now());
    };

    const removeConnectionListener = wsService.onServiceEvent(
      'connectionStateChanged',
      (connected) => {
        setIsRealtimeConnected(connected);
      }
    );
    const removeAgentStatusListener = wsService.on('agent:status', applyRealtimePayload);
    const removeAgentUpdateListener = wsService.on('agent:updated', applyRealtimePayload);

    void wsService.connect().catch(() => undefined);

    return () => {
      removeAgentStatusListener();
      removeAgentUpdateListener();
      removeConnectionListener();
    };
  }, []);

  const visibleCards = useMemo(
    () => (showStandby ? cards : cards.filter((agent) => agent.status !== 'standby')),
    [cards, showStandby]
  );

  const activeCard = visibleCards.find((agent) => agent.id === activeId) ?? visibleCards[0];
  const activeCount = visibleCards.filter((agent) => agent.status === 'active').length;
  const degradedCount = visibleCards.filter((agent) => agent.status === 'degraded').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              AI Command Center
            </h1>
            <p className="text-sm text-slate-400">
              Native agent fleet cards with live-ready metadata
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs border ${
                isRealtimeConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              Agent Stream: {isRealtimeConnected ? 'Live' : 'Retrying'}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs border ${
                isRealtimeConnected
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-500/15 text-slate-300 border-slate-500/40'
              }`}
            >
              Mesh: {isRealtimeConnected ? 'Connected' : 'Disconnected'}
            </span>
            {lastRealtimeUpdate && (
              <span className="px-2 py-1 rounded-full text-xs border border-white/10 bg-transparent/5 text-slate-300">
                Last update: {new Date(lastRealtimeUpdate).toLocaleTimeString()}
              </span>
            )}
            {(['grid', 'tabs', 'single'] as LayoutMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLayout(mode)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  layout === mode
                    ? 'bg-purple-500 text-white'
                    : 'bg-transparent/5 text-gray-300 hover:bg-transparent/10'
                }`}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-slate-300 ml-2">
              <input
                type="checkbox"
                checked={showStandby}
                onChange={(e) => setShowStandby(e.target.checked)}
                className="rounded"
              />
              Show Standby
            </label>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10 bg-black/20">
        <div className="max-w-[1600px] mx-auto px-4 py-2 text-sm text-slate-300 flex flex-wrap gap-4">
          <span>Total: {visibleCards.length}</span>
          <span>Active: {activeCount}</span>
          <span>Degraded: {degradedCount}</span>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 py-6 pb-20">
        {layout === 'grid' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={agent.id === activeId}
                onSelect={() => setActiveId(agent.id)}
              />
            ))}
          </div>
        )}

        {layout === 'tabs' && (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {visibleCards.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setActiveId(agent.id)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap text-sm ${
                    activeId === agent.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-transparent/5 text-gray-300 hover:bg-transparent/10'
                  }`}
                >
                  {agent.pfp} {agent.name}
                </button>
              ))}
            </div>
            {activeCard && <AgentCard agent={activeCard} selected onSelect={() => undefined} />}
          </div>
        )}

        {layout === 'single' && (
          <div className="flex gap-4 min-h-[560px]">
            <aside className="w-72 shrink-0 space-y-2">
              {visibleCards.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setActiveId(agent.id)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-all ${
                    activeId === agent.id
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                      : 'bg-transparent/5 text-gray-300 hover:bg-transparent/10'
                  }`}
                >
                  <div className="font-medium">
                    {agent.pfp} {agent.name}
                  </div>
                  <div className="text-xs opacity-80 mt-1">{agent.modelType}</div>
                </button>
              ))}
            </aside>
            <section className="flex-1">
              {activeCard && (
                <div className="rounded-md border border-white/10 bg-black/30 p-4">
                  <AgentCard agent={activeCard} selected onSelect={() => undefined} />
                  <div className="mt-4 flex gap-3">
                    <a
                      href={activeCard.endpoint}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30 text-sm"
                    >
                      Open Agent Endpoint
                    </a>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(activeCard.endpoint)}
                      className="px-4 py-2 rounded-md bg-transparent/5 border border-white/10 hover:bg-transparent/10 text-sm"
                    >
                      Copy Endpoint URL
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AICommandCenter;
