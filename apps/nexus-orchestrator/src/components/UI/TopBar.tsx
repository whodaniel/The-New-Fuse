import { Bot, Building, GitMerge, Network, Wand2 } from 'lucide-react';
import React from 'react';
import { useStore } from '../../store/useStore';

export const TopBar: React.FC = () => {
  const agents = useStore((state) => state.agents);
  const setActiveModal = useStore((state) => state.setActiveModal);
  const setMindMapOpen = useStore((state) => state.setMindMapOpen);
  const isMindMapOpen = useStore((state) => state.isMindMapOpen);

  return (
    <header className="pointer-events-auto flex justify-between items-start mb-4">
      <div className="flex flex-col space-y-2">
        <div className="glass-panel px-6 py-3 rounded-xl flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
            <Network className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">
              Nexus<span className="text-indigo-400">Orchestrator</span>
            </h1>
          </div>
        </div>
        {/* Tooling Bar */}
        <div className="glass-panel p-2 rounded-xl flex space-x-2">
          <button
            onClick={() => setActiveModal('project')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors flex items-center"
          >
            <Building className="w-3 h-3 mr-1 text-emerald-400" /> New Project
          </button>
          <button
            onClick={() => setActiveModal('ai-scaffold')}
            className="px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/50 rounded-lg text-xs font-semibold text-indigo-300 transition-colors flex items-center"
          >
            <Wand2 className="w-3 h-3 mr-1 text-yellow-400" /> ✨ Auto-Scaffold
          </button>
          <button
            onClick={() => setActiveModal('agent')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors flex items-center"
          >
            <Bot className="w-3 h-3 mr-1 text-blue-400" /> Deploy Agent
          </button>
          <button
            onClick={() => setMindMapOpen(!isMindMapOpen)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors flex items-center"
          >
            <GitMerge className="w-3 h-3 mr-1" /> Mind Map
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end space-y-2">
        <div className="glass-panel px-4 py-2 rounded-xl flex space-x-4 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200">System Online</span>
          </div>
          <div className="text-slate-400 border-l border-slate-700 pl-4">
            <span className="text-white">{agents.length}</span> Agents Active
          </div>
        </div>
        <div className="glass-panel px-4 py-2 rounded-xl text-xs text-slate-400">
          <span className="font-mono text-slate-200">WASD</span> to pan | Drag to orbit
        </div>
      </div>
    </header>
  );
};
