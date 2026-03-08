import { Bot, ChevronLeft, ChevronRight, Server } from 'lucide-react';
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

export const FleetPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const agents = useStore((state) => state.agents);
  const projects = useStore((state) => state.projects);
  const setSelectedEntity = useStore((state) => state.setSelectedEntity);

  return (
    <div className="pointer-events-auto flex h-full">
      <aside
        className={`glass-panel rounded-xl h-full flex flex-col transition-all duration-300 transform origin-left ${
          isOpen ? 'w-80' : 'w-0 px-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
          <h2 className="font-semibold text-slate-100 flex items-center">
            <Server className="w-4 h-4 mr-2 text-indigo-400" /> Active Fleet
          </h2>
          <button className="text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 flex-1 overflow-y-auto">
          {agents.map((agent) => {
            const proj = projects.find((p) => p.id === agent.currentProject);
            const colorHex = '#' + agent.color.toString(16).padStart(6, '0');
            return (
              <div
                key={agent.id}
                className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedEntity({ id: agent.id, type: 'agent' })}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5" style={{ color: colorHex }} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {agent.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded p-2 border border-slate-800 text-xs">
                  <p className="text-slate-300 truncate">
                    <span className="text-slate-500">Task:</span> {agent.currentTask || 'Idle'}
                  </p>
                  <p className="text-slate-300 truncate mt-1">
                    <span className="text-slate-500">Loc:</span> {proj ? proj.name : 'Unassigned'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
      {!isOpen && (
        <button
          className="glass-panel h-10 px-2 rounded-r-xl self-start mt-4 border-l-0 text-slate-400 hover:text-white"
          onClick={() => setIsOpen(true)}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
