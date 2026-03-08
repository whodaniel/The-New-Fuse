import {
  Bot,
  Check,
  CheckCircle,
  Cpu,
  List,
  Plus,
  Settings,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  analyzeProjectRiskWithAI,
  breakDownTaskWithAI,
  generateAgentStatusReport,
} from '../../services/geminiService';
import { useStore } from '../../store/useStore';

export const ContextPanel: React.FC = () => {
  const selectedEntity = useStore((state) => state.selectedEntity);
  const projects = useStore((state) => state.projects);
  const agents = useStore((state) => state.agents);
  const setSelectedEntity = useStore((state) => state.setSelectedEntity);
  const updateTaskStatus = useStore((state) => state.updateTaskStatus);
  const setActiveModal = useStore((state) => state.setActiveModal);
  const breakDownTask = useStore((state) => state.breakDownTask);
  const addLog = useStore((state) => state.addLog);

  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskReport, setRiskReport] = useState<string | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusReport, setStatusReport] = useState<string | null>(null);

  if (!selectedEntity) {
    return (
      <aside className="pointer-events-auto glass-panel w-96 rounded-xl h-full flex flex-col transform translate-x-[120%] transition-transform duration-300 absolute right-0 top-0" />
    );
  }

  const handleBreakdown = async (
    projectId: string,
    taskId: string,
    taskTitle: string,
    projectName: string
  ) => {
    setLoadingTask(taskId);
    addLog(`Requesting AI breakdown for task: ${taskTitle}...`, 'info');
    try {
      const result = await breakDownTaskWithAI(taskTitle, projectName);
      if (result.subtasks && result.subtasks.length > 0) {
        breakDownTask(projectId, taskId, result.subtasks);
        addLog(
          `✨ AI broke down "${taskTitle}" into ${result.subtasks.length} subtasks.`,
          'success'
        );
      }
    } catch (err) {
      addLog(`Failed to break down task "${taskTitle}". API Interference.`, 'alert');
    } finally {
      setLoadingTask(null);
    }
  };

  const handleRiskAssessment = async (project: any) => {
    setLoadingRisk(true);
    try {
      const result = await analyzeProjectRiskWithAI(project);
      setRiskReport(result);
      addLog(`✨ AI Project Assessment complete for ${project.name}.`, 'success');
    } catch (err) {
      setRiskReport('Assessment failed due to api interference.');
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleStatusReport = async (agent: any, project: any) => {
    setLoadingStatus(true);
    try {
      const result = await generateAgentStatusReport(agent, project);
      setStatusReport(result);
      addLog(`Received AI status transmission from ${agent.name}.`, 'info');
    } catch (err) {
      setStatusReport('Error establishing comms link. Interference detected.');
    } finally {
      setLoadingStatus(false);
    }
  };

  if (selectedEntity.type === 'project') {
    const project = projects.find((p) => p.id === selectedEntity.id);
    if (!project) return null;

    const todo = project.tasks.filter((t) => t.status === 'todo');
    const inProgress = project.tasks.filter((t) => t.status === 'in-progress');
    const done = project.tasks.filter((t) => t.status === 'done');
    const hexColor = '#' + project.color.toString(16).padStart(6, '0');

    return (
      <aside className="pointer-events-auto glass-panel w-96 rounded-xl h-full flex flex-col transform translate-x-0 transition-transform duration-300 absolute right-0 top-0">
        <div
          className="p-4 border-b border-slate-700/50 flex justify-between items-center"
          style={{ background: `linear-gradient(90deg, rgba(15,23,42,1) 0%, ${hexColor}33 100%)` }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Project Node
            </span>
            <h2 className="font-bold text-lg text-white">{project.name}</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveModal('task', { projectId: project.id })}
              className="text-emerald-400 hover:text-emerald-300 text-sm bg-slate-800 px-2 py-1 rounded flex items-center"
              title="Add Task"
            >
              <Plus className="w-4 h-4 mr-1" /> Task
            </button>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Completion Target</span>
              <span className="text-white">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%`, backgroundColor: hexColor }}
              ></div>
            </div>
          </div>

          {/* Kanban */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase flex items-center">
                <Settings className="w-3 h-3 text-yellow-500 mr-2 animate-spin-slow" /> In Progress
                ({inProgress.length})
              </h3>
              <div className="min-h-[2rem]">
                {inProgress.length ? (
                  inProgress.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-800 p-2 rounded mb-2 border border-slate-700 text-xs group relative"
                    >
                      <div className="font-medium text-slate-200">{task.title}</div>
                      <div className="flex justify-between items-center mt-2">
                        {task.assignee ? (
                          <div className="flex items-center text-indigo-300">
                            <Bot className="w-3 h-3 mr-1" />{' '}
                            {agents.find((a) => a.id === task.assignee)?.name || task.assignee}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Unassigned</div>
                        )}
                        <div className="flex space-x-1">
                          <button
                            onClick={() =>
                              handleBreakdown(project.id, task.id, task.title, project.name)
                            }
                            className="text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 transition"
                            title="✨ AI Breakdown"
                          >
                            {loadingTask === task.id ? (
                              <Settings className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3 text-yellow-400" />
                            )}
                          </button>
                          <button
                            onClick={() => updateTaskStatus(project.id, task.id, 'done')}
                            className="text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 transition"
                            title="Complete Task"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 italic">No active tasks</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase flex items-center">
                <List className="w-3 h-3 text-slate-400 mr-2" /> To Do ({todo.length})
              </h3>
              <div className="min-h-[2rem]">
                {todo.length ? (
                  todo.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-800 p-2 rounded mb-2 border border-slate-700 text-xs group relative"
                    >
                      <div className="font-medium text-slate-200">{task.title}</div>
                      <div className="flex justify-between items-center mt-2">
                        {task.assignee ? (
                          <div className="flex items-center text-indigo-300">
                            <Bot className="w-3 h-3 mr-1" />{' '}
                            {agents.find((a) => a.id === task.assignee)?.name || task.assignee}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Unassigned</div>
                        )}
                        <div className="flex space-x-1">
                          <button
                            onClick={() =>
                              handleBreakdown(project.id, task.id, task.title, project.name)
                            }
                            className="text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 transition"
                            title="✨ AI Breakdown"
                          >
                            {loadingTask === task.id ? (
                              <Settings className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3 text-yellow-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 italic">Queue empty</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase flex items-center">
                <CheckCircle className="w-3 h-3 text-emerald-500 mr-2" /> Done ({done.length})
              </h3>
              <div className="min-h-[2rem]">
                {done.length ? (
                  done.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-800 p-2 rounded mb-2 border border-slate-700 text-xs group relative"
                    >
                      <div className="font-medium text-slate-200">{task.title}</div>
                      <div className="flex justify-between items-center mt-2">
                        {task.assignee ? (
                          <div className="flex items-center text-indigo-300">
                            <Bot className="w-3 h-3 mr-1" />{' '}
                            {agents.find((a) => a.id === task.assignee)?.name || task.assignee}
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Unassigned</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600 italic">No completed tasks</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleRiskAssessment(project)}
            disabled={loadingRisk}
            className="w-full mt-4 py-2 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/50 rounded text-xs text-indigo-200 transition font-bold flex items-center justify-center"
          >
            {loadingRisk ? (
              <>
                <Settings className="w-3 h-3 animate-spin mr-2" /> Analyzing Variables...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1 text-yellow-400" /> ✨ AI Project Assessment
              </>
            )}
          </button>
          {riskReport && (
            <div className="mt-3 p-3 bg-slate-900 border border-indigo-500/30 rounded text-xs text-indigo-200 shadow-inner whitespace-pre-wrap">
              {riskReport}
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (selectedEntity.type === 'agent') {
    const agent = agents.find((a) => a.id === selectedEntity.id);
    if (!agent) return null;

    const proj = projects.find((p) => p.id === agent.currentProject);
    const hexColor = '#' + agent.color.toString(16).padStart(6, '0');

    return (
      <aside className="pointer-events-auto glass-panel w-96 rounded-xl h-full flex flex-col transform translate-x-0 transition-transform duration-300 absolute right-0 top-0">
        <div
          className="p-4 border-b border-slate-700/50 flex justify-between items-center"
          style={{ background: `linear-gradient(90deg, rgba(15,23,42,1) 0%, ${hexColor}33 100%)` }}
        >
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8" style={{ color: hexColor }} />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Agent Unit
              </span>
              <h2 className="font-bold text-lg text-white">{agent.name}</h2>
            </div>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase">Class Role</div>
              <div className="text-sm font-medium text-slate-200 truncate">{agent.role}</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase">Compute Load</div>
              <div
                className={`text-sm font-medium ${agent.load > 80 ? 'text-red-400' : 'text-emerald-400'} font-mono`}
              >
                {agent.load}%
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wider flex items-center">
              <Cpu className="w-3 h-3 mr-1" /> Execution Context
            </h3>
            <div className="mb-3">
              <label className="block text-[10px] text-slate-500 mb-1">Target Project Node</label>
              <div
                className="bg-slate-800 p-2 rounded text-sm text-slate-200 border-l-2"
                style={{ borderColor: hexColor }}
              >
                {proj?.name || 'Unassigned / Idle'}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Current Process</label>
              <div className="bg-slate-800 p-2 rounded text-sm text-slate-200">
                {agent.currentTask || 'Awaiting Orders'}
                {agent.currentTask && (
                  <div className="mt-2 w-full bg-slate-900 rounded-full h-1">
                    <div
                      className="h-1 rounded-full animate-pulse"
                      style={{ width: `${Math.random() * 40 + 30}%`, backgroundColor: hexColor }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStatusReport(agent, proj)}
            disabled={loadingStatus}
            className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/50 rounded text-xs text-indigo-200 transition font-bold flex items-center justify-center"
          >
            {loadingStatus ? (
              <>
                <Settings className="w-3 h-3 animate-spin mr-2" /> Opening Quantum Comm Link...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1 text-yellow-400" /> ✨ AI Status Report
              </>
            )}
          </button>
          {statusReport && (
            <div className="mt-3 p-3 bg-slate-900 border border-indigo-500/30 rounded text-xs text-indigo-200 italic shadow-inner">
              "{statusReport}"
            </div>
          )}
        </div>
      </aside>
    );
  }

  return null;
};
