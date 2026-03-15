import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { agentApi, agentRegistryApi } from '../api';

interface BotOrchestrationProps {
  onNotify: (type: string, title: string, message: string) => void;
}

const LOGIC_MODELS = [
  { id: 'tight_aggressive', name: 'GTO - Tight Aggressive' },
  { id: 'loose_aggressive', name: 'Loose Aggressive' },
  { id: 'tight_passive', name: 'Tight Passive' },
  { id: 'exploitative', name: 'Node Exploitative' },
  { id: 'icm_focused', name: 'ICM Optimizer' },
];

const SOURCES = ['ui_manual', 'self_play', 'probe', 'head_to_head'];

const INITIAL_ROSTER = [
  {
    id: 'agent-1',
    name: 'CYBER-9',
    temperament: 'tight_aggressive',
    style: 'TAG Shark',
    riskBps: 600,
  },
  {
    id: 'agent-2',
    name: 'GHOST',
    temperament: 'loose_aggressive',
    style: 'LAG Maniac',
    riskBps: 1200,
  },
  { id: 'agent-3', name: 'V-SYNC', temperament: 'tight_passive', style: 'Nit Rock', riskBps: 400 },
  { id: 'agent-4', name: 'NULLSEC', temperament: 'balanced', style: 'GTO Solver', riskBps: 800 },
  {
    id: 'agent-5',
    name: 'PROXY',
    temperament: 'loose_aggressive',
    style: 'Bluff Engine',
    riskBps: 1000,
  },
];

export const BotOrchestration: React.FC<BotOrchestrationProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'DISCOVERY' | 'ROSTER'>('CONSOLE');
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState('agent-omega');
  const [logicModel, setLogicModel] = useState('tight_aggressive');

  // Roster State
  const [systemRoster, setSystemRoster] = useState<any[]>(() => {
    const saved = localStorage.getItem('aiArcadeSystemBots');
    return saved ? JSON.parse(saved) : INITIAL_ROSTER;
  });

  // Nurture State
  const [nurtureState, setNurtureState] = useState<any>(null);
  const [form, setForm] = useState({
    targetBbps: 2.0,
    bb100: 1.2,
    exploitability: 55,
    entropy: 0.33,
    latency: 220,
    violations: 0,
    showdownError: 8,
    volatility: 900,
    source: 'self_play',
    actors: 4,
    traversals: 1200,
    batch: 2048,
  });

  // Discovery State
  const [remoteAgents, setRemoteAgents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'CONSOLE') {
      fetchNurtureState();
    } else {
      fetchRemoteAgents();
    }
  }, [activeTab]);

  const fetchNurtureState = async () => {
    try {
      setLoading(true);
      const res = await agentApi.nurtureState(agentId);
      setNurtureState(res.program || null);
    } catch (err) {
      console.error('Failed to fetch nurture state', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemoteAgents = async () => {
    try {
      setLoading(true);
      const res = await agentRegistryApi.search({ q: searchQuery });
      setRemoteAgents(res.agents || []);
    } catch (err) {
      onNotify('SYSTEM', 'Search Failed', 'Could not fetch agents from TNF registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitNurture = async () => {
    try {
      setLoading(true);
      await agentApi.nurtureInit({
        agentId,
        ownerId: 'system',
        objective: 'cash_nlhe_6max',
        targetBbps: form.targetBbps,
      });
      onNotify('SUCCESS', 'Nurture Init', `Started session for ${agentId}`);
      fetchNurtureState();
    } catch (err) {
      onNotify('ERROR', 'Init Failed', String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogEpisode = async () => {
    try {
      setLoading(true);
      await agentApi.nurtureEpisode({
        agentId,
        bb100: form.bb100,
        exploitabilityProxy: form.exploitability,
        policyEntropy: form.entropy,
        showdownErrorRateBps: form.showdownError,
        decisionLatencyMsP95: form.latency,
        legalViolationRateBps: form.violations,
        volatilityBps: form.volatility,
        episodeSource: form.source,
        learnerActors: form.actors,
        traversalsPerIteration: form.traversals,
        miniBatchSize: form.batch,
      });
      onNotify('SUCCESS', 'Episode Logged', `Recorded telemetry for ${agentId}`);
      fetchNurtureState();
    } catch (err) {
      onNotify('ERROR', 'Log Failed', String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0c1a]/90 border border-indigo-500/30 rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
              Admin Only
            </p>
            <h3 className="text-2xl font-black text-white uppercase italic">Bot Orchestration</h3>
          </div>
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('CONSOLE')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'CONSOLE'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Control Console
            </button>
            <button
              onClick={() => setActiveTab('DISCOVERY')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'DISCOVERY'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              TNF Discovery
            </button>
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'ROSTER'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Default Roster
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'CONSOLE' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config Panel */}
          <div className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">
                  Target Agent ID
                </label>
                <input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-indigo-400 font-mono outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">
                  Logic Model
                </label>
                <select
                  value={logicModel}
                  onChange={(e) => setLogicModel(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                >
                  {LOGIC_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">bb/100</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.bb100}
                  onChange={(e) => setForm({ ...form, bb100: Number(e.target.value) })}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">
                  Exploitability
                </label>
                <input
                  type="number"
                  value={form.exploitability}
                  onChange={(e) => setForm({ ...form, exploitability: Number(e.target.value) })}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Entropy</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.entropy}
                  onChange={(e) => setForm({ ...form, entropy: Number(e.target.value) })}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">
                  Latency (p95 ms)
                </label>
                <input
                  type="number"
                  value={form.latency}
                  onChange={(e) => setForm({ ...form, latency: Number(e.target.value) })}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500">
                  Episode Source
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleInitNurture}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Init Nurture'}
              </button>
              <button
                onClick={handleLogEpisode}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Log Episode
              </button>
            </div>
          </div>

          {/* Status Panel */}
          <div className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-tighter">
                Live Program State
              </h4>
              {nurtureState && (
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                  {nurtureState.stage}
                </span>
              )}
            </div>

            {nurtureState ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Episodes</p>
                    <p className="text-2xl font-black text-white">
                      {nurtureState.metrics?.episodes || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Avg bb/100</p>
                    <p className="text-2xl font-black text-cyan-400">
                      {(
                        nurtureState.metrics?.bb100?.[nurtureState.metrics.bb100.length - 1] || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-slate-500">Exploitability Proxy</span>
                    <span className="text-orange-400">
                      {(
                        nurtureState.metrics?.exploitabilityProxy?.[
                          nurtureState.metrics.exploitabilityProxy.length - 1
                        ] || 0
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (nurtureState.metrics?.exploitabilityProxy?.[0] || 100) / 2)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-700 tracking-widest">
                  Awaiting Initialization...
                </p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'ROSTER' ? (
        <div className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black uppercase text-slate-400">System Bot Defaults</h4>
            <button
              onClick={() => {
                const newBot = {
                  id: `agent-${Date.now()}`,
                  name: 'New Bot',
                  temperament: 'balanced',
                  style: 'Custom',
                  riskBps: 500,
                };
                const updated = [...systemRoster, newBot];
                setSystemRoster(updated);
                localStorage.setItem('aiArcadeSystemBots', JSON.stringify(updated));
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 text-[9px] font-black uppercase flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add Bot Profile
            </button>
          </div>

          <div className="space-y-3">
            {systemRoster.map((bot, idx) => (
              <div
                key={bot.id}
                className="grid grid-cols-12 gap-3 items-center bg-black/40 border border-white/5 p-3 rounded-xl"
              >
                <div className="col-span-3">
                  <input
                    value={bot.name}
                    onChange={(e) => {
                      const updated = [...systemRoster];
                      updated[idx].name = e.target.value;
                      setSystemRoster(updated);
                      localStorage.setItem('aiArcadeSystemBots', JSON.stringify(updated));
                    }}
                    className="w-full bg-transparent text-sm font-black text-white outline-none"
                  />
                  <span className="text-[8px] font-mono text-slate-600 block">{bot.id}</span>
                </div>
                <div className="col-span-3">
                  <select
                    value={bot.temperament}
                    onChange={(e) => {
                      const updated = [...systemRoster];
                      updated[idx].temperament = e.target.value;
                      setSystemRoster(updated);
                      localStorage.setItem('aiArcadeSystemBots', JSON.stringify(updated));
                    }}
                    className="w-full bg-transparent text-xs text-indigo-400 outline-none"
                  >
                    {LOGIC_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={bot.riskBps}
                    onChange={(e) => {
                      const updated = [...systemRoster];
                      updated[idx].riskBps = Number(e.target.value);
                      setSystemRoster(updated);
                      localStorage.setItem('aiArcadeSystemBots', JSON.stringify(updated));
                    }}
                    className="w-full bg-transparent text-xs text-slate-400 outline-none"
                  />
                  <span className="text-[7px] uppercase text-slate-600 block">Risk Bps</span>
                </div>
                <div className="col-span-3">
                  <input
                    value={bot.style}
                    onChange={(e) => {
                      const updated = [...systemRoster];
                      updated[idx].style = e.target.value;
                      setSystemRoster(updated);
                      localStorage.setItem('aiArcadeSystemBots', JSON.stringify(updated));
                    }}
                    className="w-full bg-transparent text-xs text-slate-500 outline-none"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => {
                      const updated = systemRoster.filter((_, i) => i !== idx);
                      setSystemRoster(updated);
                      localStorage.setItem('aiArcadeSystemBots', JSON.stringify(updated));
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
            <p className="text-[10px] text-indigo-300 font-medium">
              These overrides apply globally across the current session's default bot assignments.
            </p>
            <button
              onClick={() => {
                onNotify(
                  'SUCCESS',
                  'Roster Synchronized',
                  'Default bot roster updated in active session memory.'
                );
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
            >
              Push To Engine
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-4 flex gap-3">
            <input
              placeholder="Search TNF Agent Registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRemoteAgents()}
              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={fetchRemoteAgents}
              className="px-6 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full h-40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 opacity-50" />
              </div>
            ) : remoteAgents.length > 0 ? (
              remoteAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 block">
                        Identity Token
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300">
                        {agent.id.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-white mt-3 uppercase truncate">
                    {agent.name || agent.id}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                    {agent.description || 'No description provided.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(agent.capabilities || []).slice(0, 3).map((cap: string) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase text-slate-500"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setAgentId(agent.id);
                      setActiveTab('CONSOLE');
                      onNotify('INFO', 'Agent Selected', `Active context set to ${agent.id}`);
                    }}
                    className="w-full mt-5 py-2 rounded-xl bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all"
                  >
                    Load Into Console
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full h-40 flex flex-col items-center justify-center text-slate-600">
                <p className="text-[10px] font-black uppercase tracking-widest">No agents found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
