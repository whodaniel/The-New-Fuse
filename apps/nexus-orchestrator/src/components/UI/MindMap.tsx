import { Bot, Building, Check, Circle, Network, Settings, X } from 'lucide-react';
import React from 'react';
import { useStore } from '../../store/useStore';

export const MindMap: React.FC = () => {
  const isMindMapOpen = useStore((state) => state.isMindMapOpen);
  const setMindMapOpen = useStore((state) => state.setMindMapOpen);
  const projects = useStore((state) => state.projects);
  const agents = useStore((state) => state.agents);
  const setSelectedEntity = useStore((state) => state.setSelectedEntity);

  if (!isMindMapOpen) return null;

  const handleEntityClick = (id: string, type: 'project' | 'agent') => {
    setSelectedEntity({ id, type });
    setMindMapOpen(false);
  };

  const idleAgents = agents.filter((a) => !a.currentProject);

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/95 backdrop-blur-md overflow-auto pointer-events-auto p-10">
      <div className="flex justify-between items-center mb-10 sticky top-0 bg-slate-900/90 py-4 z-50 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Network className="w-6 h-6 text-indigo-500 mr-2" /> Global Orchestration Map
        </h2>
        <button
          onClick={() => setMindMapOpen(false)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center"
        >
          <X className="w-4 h-4 mr-2" /> Close Map
        </button>
      </div>
      <div className="tree flex justify-center">
        <ul>
          <li>
            <a
              href="#"
              className="font-bold text-lg border-indigo-500 !bg-indigo-900/50 inline-flex items-center"
            >
              <Network className="w-4 h-4 mr-2" /> Nexus Root
            </a>
            <ul>
              {projects.map((proj) => {
                const colorHex = '#' + proj.color.toString(16).padStart(6, '0');
                return (
                  <li key={proj.id}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEntityClick(proj.id, 'project');
                      }}
                      style={{ borderTop: `3px solid ${colorHex}` }}
                      className="inline-flex items-center"
                    >
                      <Building className="w-4 h-4 mr-1" style={{ color: colorHex }} /> {proj.name}
                    </a>
                    {proj.tasks.length > 0 && (
                      <ul>
                        {proj.tasks.map((task) => {
                          let agentNode = null;
                          if (task.assignee) {
                            const ag = agents.find((a) => a.id === task.assignee);
                            if (ag) {
                              const agColor = '#' + ag.color.toString(16).padStart(6, '0');
                              agentNode = (
                                <ul>
                                  <li>
                                    <a
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleEntityClick(ag.id, 'agent');
                                      }}
                                      className="inline-flex items-center"
                                    >
                                      <Bot className="w-3 h-3 mr-1" style={{ color: agColor }} />{' '}
                                      {ag.name}
                                    </a>
                                  </li>
                                </ul>
                              );
                            }
                          }

                          let StatusIcon = Circle;
                          let iconColor = 'text-slate-400';
                          if (task.status === 'done') {
                            StatusIcon = Check;
                            iconColor = 'text-emerald-500';
                          } else if (task.status === 'in-progress') {
                            StatusIcon = Settings;
                            iconColor = 'text-yellow-500';
                          }

                          return (
                            <li key={task.id}>
                              <a
                                href="#"
                                className="inline-flex items-center"
                                onClick={(e) => e.preventDefault()}
                              >
                                <StatusIcon
                                  className={`w-3 h-3 mr-1 ${iconColor} ${task.status === 'in-progress' ? 'animate-spin-slow' : ''}`}
                                />
                                {task.title}
                              </a>
                              {agentNode}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
              {idleAgents.length > 0 && (
                <li>
                  <a
                    href="#"
                    className="border-slate-500 inline-flex items-center"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Bot className="w-4 h-4 mr-1 text-slate-400" /> Idle Agents
                  </a>
                  <ul>
                    {idleAgents.map((ag) => {
                      const agColor = '#' + ag.color.toString(16).padStart(6, '0');
                      return (
                        <li key={ag.id}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEntityClick(ag.id, 'agent');
                            }}
                            className="inline-flex items-center"
                          >
                            <Bot className="w-3 h-3 mr-1" style={{ color: agColor }} /> {ag.name}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};
