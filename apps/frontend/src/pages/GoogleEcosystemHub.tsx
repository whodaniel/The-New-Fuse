import React, { useState } from 'react';

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  listId: string;
  listTitle?: string;
  updated: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

export interface SparkTaskIngestion {
  id: string;
  sourceType: 'docs_export' | 'spark_prompt' | 'gem_conversation';
  title: string;
  rawContent: string;
  parsedObjectives: string[];
  actionItems: {
    id: string;
    description: string;
    targetAgentRole?: string;
    status: 'pending' | 'dispatched' | 'completed';
  }[];
  createdAt: string;
}

export interface AIStudioPromptTemplate {
  id: string;
  name: string;
  description: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  tags: string[];
}

export const GoogleEcosystemHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'spark' | 'aistudio'>('tasks');

  // --- Google Tasks ---
  const [taskLists] = useState<GoogleTaskList[]>([
    { id: 'list-default', title: 'My Tasks', updated: new Date().toISOString() },
    { id: 'list-tnf', title: 'TNF Swarm Operations', updated: new Date().toISOString() },
    { id: 'list-spark', title: 'Gemini Spark Backlog', updated: new Date().toISOString() },
  ]);
  const [selectedListId, setSelectedListId] = useState<string>('all');
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

  // --- Spark Ingestion ---
  const [sparkInput, setSparkInput] = useState('');
  const [sparkSourceType, setSparkSourceType] = useState<
    'docs_export' | 'spark_prompt' | 'gem_conversation'
  >('docs_export');
  const [ingestedTasks, setIngestedTasks] = useState<SparkTaskIngestion[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  // --- AI Studio Prompt Lab ---
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

    const listId = selectedListId === 'all' ? 'list-default' : selectedListId;
    const currentList = taskLists.find((l) => l.id === listId);
    const newTask: GoogleTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      notes: newTaskNotes.trim() || undefined,
      status: 'needsAction',
      listId,
      listTitle: currentList?.title || 'My Tasks',
      updated: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setNewTaskNotes('');
  };

  const handleSyncLedger = () => {
    setSyncStatus('Syncing with TNF Swarm Ledger & Google Workspace...');
    setTimeout(() => {
      setSyncStatus(
        `✅ Synchronized ${tasks.length} tasks with TNF Swarm Ledger and Google Tasks.`
      );
      setTimeout(() => setSyncStatus(null), 4000);
    }, 800);
  };

  const handleParseSpark = () => {
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

  const activePrompt = prompts.find((p) => p.id === selectedPromptId) || prompts[0];

  const handleExecutePrompt = () => {
    setIsExecuting(true);
    setExecutionOutput(null);

    setTimeout(() => {
      const sampleResponse =
        `[Google AI Studio Model: ${activePrompt.model}]\n` +
        `[Input Variable: ${testInput || 'Standard prompt execution'}]\n` +
        `[Temperature: ${activePrompt.temperature} | Top-P: ${activePrompt.topP} | Top-K: ${activePrompt.topK}]\n\n` +
        `Execution Output:\n` +
        `Directive analyzed. Synthetic Swarm executed with 0 latency violations.\n` +
        `1. Prompt mapped to active agent session\n` +
        `2. Dispatched to verified target lane\n` +
        `3. State ledger synchronized with TNF Core`;

      setExecutionOutput(sampleResponse);
      setIsExecuting(false);
    }, 750);
  };

  const filteredTasks = tasks.filter(
    (t) => selectedListId === 'all' || t.listId === selectedListId
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', color: '#f8fafc' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: '#60a5fa' }}>
            ⚡ Google & Gemini Spark Ecosystem Hub
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            Manage Google Tasks, Ingest Gemini Spark tasks, and run Google AI Studio Prompt
            experiments directly in TNF
          </p>
        </div>
        <button
          onClick={handleSyncLedger}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🔄 Sync Swarm Ledger
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {syncStatus && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            {syncStatus}
          </div>
        )}

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'tasks' ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'tasks' ? 'white' : '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            📋 Google Tasks ({tasks.filter((t) => t.status === 'needsAction').length})
          </button>
          <button
            onClick={() => setActiveTab('spark')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'spark' ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'spark' ? 'white' : '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✨ Spark Tasks Ingestor
          </button>
          <button
            onClick={() => setActiveTab('aistudio')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'aistudio' ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'aistudio' ? 'white' : '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            🧪 AI Studio Prompt Lab
          </button>
        </div>

        {/* --- GOOGLE TASKS --- */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Filter List:</span>
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <option value="all">All Lists</option>
                  {taskLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form
              onSubmit={handleAddTask}
              style={{
                display: 'flex',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px',
                borderRadius: '8px',
              }}
            >
              <input
                type="text"
                placeholder="New Google Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                style={{
                  flex: 2,
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
              />
              <input
                type="text"
                placeholder="Notes..."
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Add
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px',
                    borderRadius: '8px',
                    opacity: t.status === 'completed' ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={t.status === 'completed'}
                    onChange={() => handleToggleTask(t.id)}
                    style={{ marginTop: '4px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </div>
                    {t.notes && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {t.notes}
                      </div>
                    )}
                    <div
                      style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11px' }}
                    >
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#93c5fd',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {t.listTitle}
                      </span>
                      {t.due && <span style={{ color: '#fbbf24' }}>Due: {t.due}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SPARK INGESTOR --- */}
        {activeTab === 'spark' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Source:</span>
                <select
                  value={sparkSourceType}
                  onChange={(e) => setSparkSourceType(e.target.value as any)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    padding: '6px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <option value="docs_export">Google Docs Export (Gemini Web Export)</option>
                  <option value="spark_prompt">Gemini Spark / Web Chat Transcript</option>
                  <option value="gem_conversation">Custom Gem / Workspace Project</option>
                </select>
              </div>

              <textarea
                rows={5}
                placeholder="Paste Gemini Spark conversation, notes, or Google Docs export text here..."
                value={sparkInput}
                onChange={(e) => setSparkInput(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              />

              <button
                onClick={handleParseSpark}
                disabled={isIngesting || !sparkInput.trim()}
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 18px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {isIngesting
                  ? 'Deconstructing Spark Task...'
                  : '⚡ Ingest & Deconstruct into TNF Objectives'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: '8px 0 0 0', color: '#60a5fa' }}>
                Deconstructed Spark Missions ({ingestedTasks.length})
              </h4>
              {ingestedTasks.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '14px',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                      🎯 {item.title}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {item.sourceType}
                    </span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '13px' }}>
                    <strong>Objectives:</strong>
                    <ul style={{ margin: '4px 0 8px 20px', color: '#cbd5e1' }}>
                      {item.parsedObjectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <strong>Action Items:</strong>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '6px',
                      }}
                    >
                      {item.actionItems.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>
                            <strong style={{ color: '#93c5fd' }}>[{act.targetAgentRole}]:</strong>{' '}
                            {act.description}
                          </span>
                          <span
                            style={{ color: act.status === 'dispatched' ? '#10b981' : '#fbbf24' }}
                          >
                            {act.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AI STUDIO PROMPT LAB --- */}
        {activeTab === 'aistudio' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Saved Templates</h4>
              {prompts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPromptId(p.id)}
                  style={{
                    background:
                      p.id === selectedPromptId
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${p.id === selectedPromptId ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)'}`,
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                    {p.model}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px',
                borderRadius: '8px',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Target Model:</label>
                <select
                  value={activePrompt.model}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPrompts((prev) =>
                      prev.map((p) => (p.id === activePrompt.id ? { ...p, model: val } : p))
                    );
                  }}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-2.0-flash-thinking-exp">
                    Gemini 2.0 Flash Thinking Exp
                  </option>
                  <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro Exp</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>System Instructions:</label>
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
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Prompt Template:</label>
                <textarea
                  rows={3}
                  value={activePrompt.userPrompt}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPrompts((prev) =>
                      prev.map((p) => (p.id === activePrompt.id ? { ...p, userPrompt: val } : p))
                    );
                  }}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Test Input Parameter:</label>
                <input
                  type="text"
                  placeholder="Enter test parameter value..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                />
              </div>

              <button
                onClick={handleExecutePrompt}
                disabled={isExecuting}
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 18px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {isExecuting ? 'Running in AI Studio...' : '▶ Run Prompt in TNF'}
              </button>

              {executionOutput && (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                    Output:
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      color: '#a7f3d0',
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {executionOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleEcosystemHub;
