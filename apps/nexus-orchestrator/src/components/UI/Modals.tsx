import { Settings, Wand2 } from 'lucide-react';
import React, { useState } from 'react';
import { scaffoldProjectWithAI } from '../../services/geminiService';
import { useStore } from '../../store/useStore';

export const Modals: React.FC = () => {
  const activeModal = useStore((state) => state.activeModal);
  const modalData = useStore((state) => state.modalData);
  const setActiveModal = useStore((state) => state.setActiveModal);
  const addProject = useStore((state) => state.addProject);
  const addAgent = useStore((state) => state.addAgent);
  const addTask = useStore((state) => state.addTask);
  const scaffoldProject = useStore((state) => state.scaffoldProject);
  const addLog = useStore((state) => state.addLog);
  const agents = useStore((state) => state.agents);
  const setCameraTarget = useStore((state) => state.setCameraTarget);

  // Form states
  const [pName, setPName] = useState('');
  const [pColor, setPColor] = useState('0x3b82f6');

  const [aName, setAName] = useState('');
  const [aRole, setARole] = useState('');
  const [aColor, setAColor] = useState('0x60a5fa');

  const [tTitle, setTTitle] = useState('');
  const [tAssignee, setTAssignee] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isScaffolding, setIsScaffolding] = useState(false);

  if (!activeModal) return null;

  const close = () => setActiveModal(null);

  const handleCreateProject = () => {
    if (!pName) return;
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 20;
    addProject({
      name: pName,
      color: parseInt(pColor, 16),
      status: 'Active',
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
    });
    addLog(`Project Created: <span class="text-white">${pName}</span>`, 'success');
    setPName('');
    close();
  };

  const handleCreateAgent = () => {
    if (!aName || !aRole) return;
    addAgent({
      name: aName,
      role: aRole,
      color: parseInt(aColor, 16),
      load: 10,
    });
    addLog(`Agent Deployed: <span class="text-white">${aName}</span>`, 'success');
    setAName('');
    setARole('');
    close();
  };

  const handleCreateTask = () => {
    if (!tTitle || !modalData?.projectId) return;
    addTask(modalData.projectId, {
      title: tTitle,
      status: tAssignee ? 'in-progress' : 'todo',
      assignee: tAssignee || null,
    });
    if (tAssignee) {
      const agent = agents.find((a) => a.id === tAssignee);
      addLog(`Task assigned to ${agent?.name}: ${tTitle}`, 'alert');
    } else {
      addLog(`Task added: ${tTitle}`, 'info');
    }
    setTTitle('');
    setTAssignee('');
    close();
  };

  const handleScaffold = async () => {
    if (!aiPrompt) return;
    setIsScaffolding(true);
    try {
      const existingAgents = agents.map((a) => ({ id: a.id, role: a.role, name: a.name }));
      const result = await scaffoldProjectWithAI(aiPrompt, existingAgents);

      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      scaffoldProject({ ...result, x, z });
      addLog(
        `✨ AI generated and scaffolded project: <span class="text-white">${result.name}</span>. Agents dispatched.`,
        'alert'
      );

      setCameraTarget({ x: x + 20, y: 25, z: z + 25 });
      setAiPrompt('');
      close();
    } catch (err) {
      addLog('AI Scaffolding encountered a temporal disruption. Try again.', 'alert');
    } finally {
      setIsScaffolding(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
      {activeModal === 'project' && (
        <div className="glass-panel w-96 rounded-xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold mb-4 text-emerald-400">Initialize New Project</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Project Name"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:border-emerald-500 outline-none"
            />
            <select
              value={pColor}
              onChange={(e) => setPColor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm outline-none"
            >
              <option value="0x3b82f6">Blue</option>
              <option value="0xef4444">Red</option>
              <option value="0x10b981">Green</option>
              <option value="0xf59e0b">Yellow</option>
              <option value="0x8b5cf6">Purple</option>
            </select>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={close}
                className="px-4 py-2 rounded text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-bold text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'agent' && (
        <div className="glass-panel w-96 rounded-xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold mb-4 text-blue-400">Deploy New Agent</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Agent Name (e.g. Logic Bot)"
              value={aName}
              onChange={(e) => setAName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Role (e.g. QA Tester)"
              value={aRole}
              onChange={(e) => setARole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
            />
            <select
              value={aColor}
              onChange={(e) => setAColor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm outline-none"
            >
              <option value="0x60a5fa">Light Blue</option>
              <option value="0xf87171">Light Red</option>
              <option value="0x34d399">Mint Green</option>
              <option value="0xc084fc">Lavender</option>
              <option value="0xfcd34d">Gold</option>
            </select>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={close}
                className="px-4 py-2 rounded text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold text-white"
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'task' && (
        <div className="glass-panel w-96 rounded-xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold mb-4 text-indigo-400">Add Task to Project</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task Title"
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
            />
            <select
              value={tAssignee}
              onChange={(e) => setTAssignee(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm outline-none"
            >
              <option value="">-- Unassigned --</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={close}
                className="px-4 py-2 rounded text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-bold text-white"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'ai-scaffold' && (
        <div className="glass-panel w-96 rounded-xl p-6 shadow-2xl border-indigo-500/50">
          <h3 className="text-lg font-bold mb-2 text-indigo-300 flex items-center">
            <Wand2 className="w-5 h-5 text-yellow-400 mr-2" /> AI Project Scaffolder
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Describe what you want to build. Gemini will generate the project structure and
            automatically route active agents to matching tasks.
          </p>
          <div className="space-y-3">
            <textarea
              rows={4}
              placeholder="e.g. A mobile app for users to track their daily water intake and connect with friends."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-indigo-500/50 rounded p-3 text-white text-sm focus:border-indigo-400 outline-none resize-none"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={close}
                className="px-4 py-2 rounded text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleScaffold}
                disabled={isScaffolding}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-bold text-white transition-colors flex items-center"
              >
                {isScaffolding ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>✨ Scaffold Project</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
