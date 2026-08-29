import { Bot, Check, Globe, Info, Search, Shield, Zap } from 'lucide-react';
import React, { useState } from 'react';
import type { Agent } from '../../types';

interface AgentSelectorPanelProps {
  agents: Agent[];
  selectedAgents: string[];
  onToggleAgent: (agentId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onInspectAgent: (agent: Agent) => void;
  getAgentColor: (platform: string) => string;
  synergy: {
    relayRegistered: boolean;
    apiOnline: boolean;
  };
  isConnected: boolean;
  localFallbackReady: boolean;
}

export const AgentSelectorPanel: React.FC<AgentSelectorPanelProps> = ({
  agents,
  selectedAgents,
  onToggleAgent,
  onSelectAll,
  onClearAll,
  onInspectAgent,
  getAgentColor,
  synergy,
  isConnected,
  localFallbackReady,
}) => {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [search, setSearch] = useState('');

  const activeAgents = agents.filter((a) => a.status !== 'error' && a.status !== 'offline');

  const filteredAgents = activeAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.type.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform =
      filterPlatform === 'all' || agent.type.toLowerCase() === filterPlatform.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  return (
    <aside
      className="w-72 border-r flex flex-col h-full z-10 shrink-0 backdrop-blur-sm"
      style={{
        background: 'var(--tnf-surface-card, var(--tnf-surface))',
        borderColor: 'var(--tnf-border)',
        color: 'var(--tnf-text-primary)',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--tnf-border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h3
            className="font-bold text-sm flex items-center gap-2"
            style={{ color: 'var(--tnf-text-primary)' }}
          >
            <Zap className="w-4 h-4 text-indigo-400" />
            Swarm Fleet
          </h3>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--tnf-surface-hover)', color: 'var(--tnf-text-secondary)' }}
          >
            {selectedAgents.length}/{activeAgents.length} Active
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--tnf-text-muted)' }}>
          Select agents for multi-agent execution
        </p>

        {/* Quick Selection Actions */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={activeAgents.length === 0}
            className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors"
            style={{ background: 'var(--tnf-surface-hover)', color: 'var(--tnf-text-secondary)' }}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={selectedAgents.length === 0}
            className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors"
            style={{ background: 'var(--tnf-surface-hover)', color: 'var(--tnf-text-muted)' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Platform Filter & Search */}
      <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--tnf-border)' }}>
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-2.5"
            style={{ color: 'var(--tnf-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none"
            style={{
              background: 'var(--tnf-obsidian)',
              borderColor: 'var(--tnf-border)',
              color: 'var(--tnf-text-primary)',
            }}
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px] font-medium">
          {[
            'all',
            'nvidia',
            'groq',
            'sambanova',
            'cerebras',
            'deepseek',
            'gemini',
            'openai',
            'openrouter',
            'custom',
          ].map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setFilterPlatform(cat)}
              aria-pressed={filterPlatform === cat}
              className="px-2.5 py-1 rounded-md capitalize transition-colors"
              style={
                filterPlatform === cat
                  ? { background: 'var(--tnf-primary)', color: '#fff', fontWeight: 600 }
                  : {
                      background: 'var(--tnf-surface-hover)',
                      color: 'var(--tnf-text-muted)',
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--tnf-text-muted)' }}>
            No agents match your filter
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const isSelected = selectedAgents.includes(agent.id);
            const color = getAgentColor(agent.type);

            return (
              <div
                key={agent.id}
                onClick={() => onToggleAgent(agent.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onToggleAgent(agent.id);
                  }
                }}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                className="group relative flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-all"
                style={
                  isSelected
                    ? {
                        background: 'rgba(99, 102, 241, 0.12)',
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                      }
                    : {
                        background: 'var(--tnf-surface)',
                        borderColor: 'var(--tnf-border)',
                      }
                }
              >
                {/* Agent Avatar */}
                <div
                  className="w-9 h-9 rounded-xl border-2 shrink-0 flex items-center justify-center text-base"
                  style={{ borderColor: color, background: 'var(--tnf-obsidian)' }}
                >
                  {agent.id.includes('fed') ? (
                    <Globe className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                  )}
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-medium text-xs truncate"
                      style={{ color: 'var(--tnf-text-primary)' }}
                    >
                      {agent.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 font-bold shrink-0" />
                    )}
                  </div>
                  <div
                    className="text-[10px] font-mono capitalize"
                    style={{ color: 'var(--tnf-text-muted)' }}
                  >
                    {agent.type} · {agent.tasks || 0} tasks
                  </div>
                </div>

                {/* Inspect Info Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectAgent(agent);
                  }}
                  title="View agent details"
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  style={{ color: 'var(--tnf-text-muted)' }}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Connection Status */}
      <div
        className="p-3 border-t text-[11px] flex items-center justify-between"
        style={{ borderColor: 'var(--tnf-border)', color: 'var(--tnf-text-muted)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              synergy.apiOnline && isConnected
                ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                : synergy.relayRegistered
                  ? 'bg-purple-400 shadow-[0_0_8px_#a855f7]'
                  : localFallbackReady
                    ? 'bg-amber-400'
                    : 'bg-red-400'
            }`}
          />
          <span className="font-medium">
            {synergy.apiOnline && isConnected
              ? 'API + WebSocket'
              : synergy.relayRegistered
                ? 'Federation Swarm'
                : localFallbackReady
                  ? 'Local JIT Engine'
                  : 'Runtime setup required'}
          </span>
        </div>
        <Shield className="w-3.5 h-3.5 text-slate-500" />
      </div>
    </aside>
  );
};

export default AgentSelectorPanel;
