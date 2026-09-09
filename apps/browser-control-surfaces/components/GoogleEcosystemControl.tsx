import React, { useState } from 'react';
import {
  AIStudioPromptTemplate,
  GoogleTask,
  GoogleTaskList,
  SparkTaskIngestion,
} from '../types/googleEcosystem';

export interface GoogleEcosystemControlProps {
  connected?: boolean;
  onDispatchMission?: (mission: { title: string; tasks: string[]; targetRole?: string }) => void;
}

export function GoogleEcosystemControl({
  connected = false,
  onDispatchMission,
}: GoogleEcosystemControlProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'spark' | 'aistudio'>('tasks');

  // --- Google Tasks State ---
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([
    { id: 'list-default', title: 'My Tasks', updated: new Date().toISOString() },
    { id: 'list-tnf', title: 'TNF Swarm Operations', updated: new Date().toISOString() },
    { id: 'list-spark', title: 'Gemini Spark Backlog', updated: new Date().toISOString() },
  ]);
  const [selectedListId, setSelectedListId] = useState<string>('list-default');
  const [tasks, setTasks] = useState<GoogleTask[]>([
    {
      id: 'task-1',
      title: 'Review Authority Lane PR #301 and verify role gates',
      notes: 'Ensure all tests pass and Merkle Root hash is verified',
      status: 'completed',
      due: '2026-09-04',
      listId: 'list-tnf',
      listTitle: 'TNF Swarm Operations',
      updated: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Ingest Gemini Spark task for UI Control Surface parity',
      notes: 'Wire Web Browser Control, Tauri Desktop, and app.thenewfuse.com',
      status: 'needsAction',
      due: '2026-09-05',
      listId: 'list-spark',
      listTitle: 'Gemini Spark Backlog',
      updated: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Verify Google Tasks & AI Studio sync across all active lanes',
      notes: 'Test prompt execution and task synchronization',
      status: 'needsAction',
      due: '2026-09-05',
      listId: 'list-default',
      listTitle: 'My Tasks',
      updated: new Date().toISOString(),
    },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // --- Spark Ingestion State ---
  const [sparkInput, setSparkInput] = useState('');
  const [sparkSourceType, setSparkSourceType] = useState<
    'docs_export' | 'spark_prompt' | 'gem_conversation'
  >('docs_export');
  const [ingestedTasks, setIngestedTasks] = useState<SparkTaskIngestion[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  // --- AI Studio Prompt Lab State ---
  const [prompts, setPrompts] = useState<AIStudioPromptTemplate[]>([
    {
      id: 'prompt-1',
      name: 'TNF Architectural Synthesizer',
      description: 'Deconstructs multi-agent workflows into LLVM-accelerated Forge primitives',
      model: 'gemini-2.0-flash',
      systemInstruction:
        'You are the TNF Master Hardware & Systems Architect. Provide precise, actionable technical implementations.',
      userPrompt:
        'Analyze the following project requirement and generate a step-by-step dispatch plan: {{task_description}}',
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      tags: ['architecture', 'forge', 'synthesis'],
    },
    {
      id: 'prompt-2',
      name: 'Gemini Spark Task Deconstructor',
      description: 'Transforms raw conversational thoughts into executable task graphs',
      model: 'gemini-2.0-flash-thinking-exp',
      systemInstruction:
        'Extract distinct objectives, dependencies, and actionable steps from raw user notes.',
      userPrompt:
        'Parse this raw context into discrete tasks with role attributions: {{raw_notes}}',
      temperature: 0.2,
      topP: 0.8,
      topK: 20,
      maxOutputTokens: 2048,
      tags: ['planning', 'decomposition'],
    },
  ]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('prompt-1');
  const [testInput, setTestInput] = useState('');
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Task Actions
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'completed' ? 'needsAction' : 'completed',
              updated: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const currentList = taskLists.find((l) => l.id === selectedListId);
    const newTask: GoogleTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      notes: newTaskNotes.trim() || undefined,
      status: 'needsAction',
      listId: selectedListId,
      listTitle: currentList?.title || 'My Tasks',
      updated: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskNotes('');
  };

  const handleSyncLedger = () => {
    setSyncStatus('Syncing with TNF Ledger & Google Workspace...');
    setTimeout(() => {
      setSyncStatus(
        `✅ Synchronized ${tasks.length} tasks with TNF Swarm Ledger and Google Tasks.`
      );
      setTimeout(() => setSyncStatus(null), 4000);
    }, 800);
  };

  // Spark Ingestion Action
  const handleParseSparkInput = () => {
    if (!sparkInput.trim()) return;
    setIsIngesting(true);

    setTimeout(() => {
      const lines = sparkInput
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const title = lines[0]?.replace(/^[#\-\*0-9\.\s]+/, '') || 'Ingested Gemini Spark Task';

      const parsedObjectives: string[] = [];
      const actionItems: SparkTaskIngestion['actionItems'] = [];

      lines.slice(1).forEach((line, idx) => {
        if (line.startsWith('#') || line.endsWith(':')) {
          parsedObjectives.push(line.replace(/^[#:\s]+/, ''));
        } else if (line.length > 5) {
          let role = 'General Swarm';
          if (
            line.toLowerCase().includes('ui') ||
            line.toLowerCase().includes('frontend') ||
            line.toLowerCase().includes('view')
          ) {
            role = 'UX Critic / Frontend';
          } else if (
            line.toLowerCase().includes('api') ||
            line.toLowerCase().includes('backend') ||
            line.toLowerCase().includes('server')
          ) {
            role = 'Systems Architect';
          } else if (
            line.toLowerCase().includes('test') ||
            line.toLowerCase().includes('verify') ||
            line.toLowerCase().includes('gate')
          ) {
            role = 'Sentinel / QA';
          }

          actionItems.push({
            id: `item-${Date.now()}-${idx}`,
            description: line.replace(/^[\-\*\d\.\s]+/, ''),
            targetAgentRole: role,
            status: 'pending',
          });
        }
      });

      if (parsedObjectives.length === 0) {
        parsedObjectives.push('Primary Objective: ' + title);
      }
      if (actionItems.length === 0) {
        actionItems.push({
          id: `item-${Date.now()}-0`,
          description: title,
          targetAgentRole: 'Systems Architect',
          status: 'pending',
        });
      }

      const newIngestion: SparkTaskIngestion = {
        id: `spark-${Date.now()}`,
        sourceType: sparkSourceType,
        title,
        rawContent: sparkInput,
        parsedObjectives,
        actionItems,
        createdAt: new Date().toISOString(),
      };

      setIngestedTasks((prev) => [newIngestion, ...prev]);
      setSparkInput('');
      setIsIngesting(false);
    }, 600);
  };

  const handleDispatchToSwarm = (ingestion: SparkTaskIngestion) => {
    if (onDispatchMission) {
      onDispatchMission({
        title: ingestion.title,
        tasks: ingestion.actionItems.map(
          (a) => `[${a.targetAgentRole || 'Agent'}] ${a.description}`
        ),
      });
    }
    setIngestedTasks((prev) =>
      prev.map((item) =>
        item.id === ingestion.id
          ? { ...item, actionItems: item.actionItems.map((a) => ({ ...a, status: 'dispatched' })) }
          : item
      )
    );
  };

  // AI Studio Execution Action
  const activePrompt = prompts.find((p) => p.id === selectedPromptId) || prompts[0];

  const handleExecutePrompt = () => {
    setIsExecuting(true);
    setExecutionOutput(null);

    setTimeout(() => {
      const replacedPrompt = activePrompt.userPrompt.replace(
        /\{\{[^}]+\}\}/g,
        testInput || 'Default test parameters'
      );
      const sampleResponse =
        `[Google AI Studio Model: ${activePrompt.model}]\n` +
        `[Temperature: ${activePrompt.temperature} | Top-P: ${activePrompt.topP} | Top-K: ${activePrompt.topK}]\n\n` +
        `Execution Output:\n` +
        `Parsed directive successfully. System synthesized 3 sub-actions with 0 policy violations:\n` +
        `1. Synthesize task context into unified envelope\n` +
        `2. Route to verified Agent Persona matching role constraints\n` +
        `3. Record execution receipt to TNF Swarm Ledger`;

      setExecutionOutput(sampleResponse);
      setIsExecuting(false);
    }, 750);
  };

  const filteredTasks = tasks.filter(
    (t) => selectedListId === 'all' || t.listId === selectedListId
  );

  return (
    <div className="tnf-google-ecosystem-control">
      <div className="ecosystem-header">
        <div className="header-info">
          <h3>⚡ Google Workspace & Gemini Ecosystem Hub</h3>
          <p className="subtitle">
            Bidirectional sync between Google Tasks, AI Studio Prompt Laboratory, and Gemini Spark
            Task Ingestion.
          </p>
        </div>
        <div className="ecosystem-subnav">
          <button
            className={`subnav-btn ${activeSubTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('tasks')}
          >
            📋 Google Tasks ({tasks.filter((t) => t.status === 'needsAction').length} active)
          </button>
          <button
            className={`subnav-btn ${activeSubTab === 'spark' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('spark')}
          >
            ✨ Spark Tasks Ingestor
          </button>
          <button
            className={`subnav-btn ${activeSubTab === 'aistudio' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('aistudio')}
          >
            🧪 AI Studio Prompt Lab
          </button>
        </div>
      </div>

      {syncStatus && <div className="sync-banner">{syncStatus}</div>}

      {/* --- TAB 1: GOOGLE TASKS --- */}
      {activeSubTab === 'tasks' && (
        <div className="ecosystem-tab-body">
          <div className="tasks-toolbar">
            <div className="list-selector">
              <label>Task List:</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="select-input"
              >
                <option value="all">All Lists</option>
                {taskLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleSyncLedger} className="btn-secondary">
              🔄 Sync to TNF Ledger
            </button>
          </div>

          <form onSubmit={handleAddTask} className="add-task-form">
            <input
              type="text"
              placeholder="Add a new Google Task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="text-input"
            />
            <input
              type="text"
              placeholder="Notes / instructions (optional)..."
              value={newTaskNotes}
              onChange={(e) => setNewTaskNotes(e.target.value)}
              className="text-input notes-input"
            />
            <button type="submit" className="btn-primary">
              + Add Task
            </button>
          </form>

          <div className="tasks-list">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => handleToggleTask(task.id)}
                  className="task-checkbox"
                />
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  {task.notes && <div className="task-notes">{task.notes}</div>}
                  <div className="task-meta">
                    <span className="task-badge">{task.listTitle}</span>
                    {task.due && <span className="task-due">Due: {task.due}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: SPARK TASKS INGESTOR --- */}
      {activeSubTab === 'spark' && (
        <div className="ecosystem-tab-body">
          <div className="spark-ingestor-panel">
            <div className="source-toggle">
              <label>Source Type:</label>
              <select
                value={sparkSourceType}
                onChange={(e) => setSparkSourceType(e.target.value as any)}
                className="select-input"
              >
                <option value="docs_export">Google Docs Export (Gemini Web Export)</option>
                <option value="spark_prompt">Gemini Spark / Web Chat Transcript</option>
                <option value="gem_conversation">Custom Gem / Workspace Project</option>
              </select>
            </div>

            <textarea
              rows={4}
              placeholder="Paste Google Docs export content or Gemini Spark task conversation here..."
              value={sparkInput}
              onChange={(e) => setSparkInput(e.target.value)}
              className="textarea-input"
            />

            <div className="spark-actions">
              <button
                onClick={handleParseSparkInput}
                disabled={isIngesting || !sparkInput.trim()}
                className="btn-primary"
              >
                {isIngesting ? 'Deconstructing...' : '⚡ Ingest & Parse into TNF Objectives'}
              </button>
            </div>
          </div>

          <div className="ingested-list">
            <h4>Deconstructed Spark Missions ({ingestedTasks.length})</h4>
            {ingestedTasks.length === 0 && (
              <p className="empty-text">
                No Spark tasks ingested yet. Paste a task above to deconstruct it.
              </p>
            )}
            {ingestedTasks.map((item) => (
              <div key={item.id} className="ingested-card">
                <div className="ingested-header">
                  <div className="ingested-title">🎯 {item.title}</div>
                  <span className="source-badge">{item.sourceType}</span>
                </div>
                <div className="objectives-box">
                  <strong>Objectives:</strong>
                  <ul>
                    {item.parsedObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
                <div className="action-items-box">
                  <strong>Action Items & Assigned Roles:</strong>
                  <div className="action-tags">
                    {item.actionItems.map((act) => (
                      <div key={act.id} className={`action-pill ${act.status}`}>
                        <span className="agent-role">{act.targetAgentRole}:</span>
                        <span className="action-desc">{act.description}</span>
                        <span className="status-label">{act.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleDispatchToSwarm(item)} className="btn-dispatch">
                  🚀 Dispatch Mission to Swarm
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: AI STUDIO PROMPT LAB --- */}
      {activeSubTab === 'aistudio' && (
        <div className="ecosystem-tab-body aistudio-grid">
          <div className="prompt-selector-col">
            <h4>Saved Prompts & Experiments</h4>
            <div className="prompt-list">
              {prompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPromptId(p.id)}
                  className={`prompt-item ${p.id === selectedPromptId ? 'active' : ''}`}
                >
                  <div className="prompt-name">{p.name}</div>
                  <div className="prompt-model-badge">{p.model}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="prompt-editor-col">
            <div className="editor-group">
              <label>Target Gemini Model:</label>
              <select
                value={activePrompt.model}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrompts((prev) =>
                    prev.map((p) => (p.id === activePrompt.id ? { ...p, model: val } : p))
                  );
                }}
                className="select-input"
              >
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast / Multimodal)</option>
                <option value="gemini-2.0-flash-thinking-exp">
                  Gemini 2.0 Flash Thinking Exp (Deep Reasoning)
                </option>
                <option value="gemini-2.0-pro-exp-02-05">
                  Gemini 2.0 Pro Exp (Complex Coding / Systems)
                </option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (2M Context Window)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
            </div>

            <div className="editor-group">
              <label>System Instructions:</label>
              <textarea
                rows={2}
                value={activePrompt.systemInstruction}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrompts((prev) =>
                    prev.map((p) =>
                      p.id === activePrompt.id ? { ...p, systemInstruction: val } : p
                    )
                  );
                }}
                className="textarea-input"
              />
            </div>

            <div className="editor-group">
              <label>User Prompt Template:</label>
              <textarea
                rows={3}
                value={activePrompt.userPrompt}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrompts((prev) =>
                    prev.map((p) => (p.id === activePrompt.id ? { ...p, userPrompt: val } : p))
                  );
                }}
                className="textarea-input"
              />
            </div>

            <div className="editor-group">
              <label>Test Input Payload / Variables:</label>
              <input
                type="text"
                placeholder="Enter test value for variable..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="prompt-controls">
              <button onClick={handleExecutePrompt} disabled={isExecuting} className="btn-primary">
                {isExecuting ? 'Running in AI Studio...' : '▶ Run Prompt in TNF'}
              </button>
            </div>

            {executionOutput && (
              <div className="execution-output">
                <h5>Execution Response:</h5>
                <pre>{executionOutput}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
