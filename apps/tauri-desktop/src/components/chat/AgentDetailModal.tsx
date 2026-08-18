import { Bot, Check, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Agent } from '../../types';

interface AgentDetailModalProps {
  agent: Agent | null;
  onClose: () => void;
  onUpdateAgent?: (id: string, updates: Partial<Agent>) => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onUpdateAgent,
}) => {
  if (!agent) return null;

  const [systemPrompt, setSystemPrompt] = useState(agent.config?.systemPrompt || '');
  const [temperature, setTemperature] = useState(agent.config?.temperature ?? 0.7);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (onUpdateAgent) {
      onUpdateAgent(agent.id, {
        config: {
          ...agent.config,
          systemPrompt,
          temperature,
        },
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {agent.name}
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                  {agent.type}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{agent.description || 'TNF Swarm Fleet Agent'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
              <div className="text-sm font-semibold capitalize text-emerald-400 mt-0.5">
                {agent.status}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Model</span>
              <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
                {agent.config?.model || agent.type}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tasks</span>
              <div className="text-sm font-semibold text-indigo-400 mt-0.5">{agent.tasks || 0}</div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
              Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities && agent.capabilities.length > 0 ? (
                agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono"
                  >
                    ⚡ {cap}
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-slate-500">General Assistant Capabilities</span>
              )}
            </div>
          </div>

          {/* Temperature Parameter */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Temperature ({temperature})
              </label>
              <span className="text-[10px] text-slate-500">
                {temperature < 0.3 ? 'Deterministic' : temperature > 0.8 ? 'Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* System Prompt Override */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
              System Instruction
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter custom agent behavior or system persona..."
              className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Persisted in agent config</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              {isSaved ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetailModal;
