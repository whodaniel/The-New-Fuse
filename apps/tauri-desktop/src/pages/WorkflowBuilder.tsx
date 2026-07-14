import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  Panel,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useAuth } from '../hooks/useAuth';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import { safeStorage } from '../lib/safeStorage';
import { apiService } from '../services/api';

/**
 * Enhanced Workflow Builder - Tauri Desktop
 * Merges best of SaaS design with responsive Tauri optimizations
 */

// Custom Node Components
const AgentNode = ({ data }: { data: any }) => (
  <div className="workflow-node agent-node">
    <div className="node-header">
      <span className="node-icon">🤖</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Provider</label>
        <select
          value={data.provider || 'claude'}
          onChange={(e) => data.onChange?.('provider', e.target.value)}
        >
          <option value="claude">Claude AI</option>
          <option value="gemini">Gemini</option>
          <option value="gpt">ChatGPT</option>
          <option value="perplexity">Perplexity</option>
          <option value="local">Local LLM</option>
        </select>
      </div>
      <div className="node-field">
        <label>Prompt</label>
        <textarea
          value={data.prompt || ''}
          onChange={(e) => data.onChange?.('prompt', e.target.value)}
          placeholder="Enter your prompt..."
          rows={3}
        />
      </div>
    </div>
    <div className="node-handles">
      <span className="handle-label input">In</span>
      <span className="handle-label output">Out</span>
    </div>
  </div>
);

const MCPToolNode = ({ data }: { data: any }) => (
  <div className="workflow-node mcp-node">
    <div className="node-header">
      <span className="node-icon">🔧</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Tool</label>
        <select value={data.tool || ''} onChange={(e) => data.onChange?.('tool', e.target.value)}>
          <option value="">Select tool...</option>
          <option value="screenshot">Screenshot</option>
          <option value="browser">Browser Automation</option>
          <option value="filesystem">File System</option>
          <option value="database">Database Query</option>
          <option value="web-search">Web Search</option>
          <option value="api-call">API Call</option>
        </select>
      </div>
      <div className="node-field">
        <label>Parameters (JSON)</label>
        <textarea
          value={data.parameters || ''}
          onChange={(e) => data.onChange?.('parameters', e.target.value)}
          placeholder='{"action": "read", "path": "..."}'
          rows={2}
        />
      </div>
    </div>
  </div>
);

const FlowControlNode = ({ data }: { data: any }) => (
  <div className="workflow-node flow-node">
    <div className="node-header">
      <span className="node-icon">⚡</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Type</label>
        <select
          value={data.controlType || 'condition'}
          onChange={(e) => data.onChange?.('controlType', e.target.value)}
        >
          <option value="condition">Condition (If/Else)</option>
          <option value="loop">Loop (For Each)</option>
          <option value="delay">Delay (Wait)</option>
          <option value="parallel">Parallel (Fork)</option>
          <option value="merge">Merge (Join)</option>
        </select>
      </div>
      <div className="node-field">
        <label>Config</label>
        <textarea
          value={data.config || ''}
          onChange={(e) => data.onChange?.('config', e.target.value)}
          placeholder="Configuration..."
          rows={2}
        />
      </div>
    </div>
  </div>
);

const OutputNode = ({ data }: { data: any }) => (
  <div className="workflow-node output-node">
    <div className="node-header">
      <span className="node-icon">📤</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Output Type</label>
        <select
          value={data.outputType || 'display'}
          onChange={(e) => data.onChange?.('outputType', e.target.value)}
        >
          <option value="display">Display Result</option>
          <option value="file">Save to File</option>
          <option value="webhook">Send to Webhook</option>
          <option value="variable">Store in Variable</option>
        </select>
      </div>
    </div>
  </div>
);

const nodeTypes = {
  agent: AgentNode,
  mcpTool: MCPToolNode,
  flowControl: FlowControlNode,
  output: OutputNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 200 },
    data: { label: '🚀 Start' },
    style: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '16px 24px',
      fontWeight: 600,
    },
  },
];

const WORKFLOW_DRAFT_KEY = 'tnf.workflow.draft';
const WORKFLOW_API_ID_KEY = 'tnf.workflow.apiId';

const WorkflowBuilderContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { state: synergy } = useOperatorSynergy();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const canUseWorkflowApi = isAuthenticated && synergy.apiOnline;

  // Reattach the editable-field handler to nodes that arrive without it (drafts
  // and templates serialize without functions). Without this, restored node
  // fields would be read-only no-ops because data.onChange is undefined.
  const attachHandlers = useCallback(
    (list: Node[]): Node[] =>
      list.map((node) => {
        // Decorative start/input nodes have no editable fields.
        if (node.type === 'input') return node;
        return {
          ...node,
          data: {
            ...node.data,
            onChange: (field: string, value: string) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id ? { ...n, data: { ...n.data, [field]: value } } : n
                )
              );
            },
          },
        };
      }),
    [setNodes]
  );

  useEffect(() => {
    setSavedWorkflowId(safeStorage.getItem(WORKFLOW_API_ID_KEY));
  }, []);

  useEffect(() => {
    try {
      const raw = safeStorage.getItem(WORKFLOW_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        name?: string;
        nodes?: Node[];
        edges?: Edge[];
        savedAt?: string;
      };
      if (draft.name) setWorkflowName(draft.name);
      if (draft.nodes?.length) setNodes(attachHandlers(draft.nodes));
      if (draft.edges) setEdges(draft.edges);
      if (draft.savedAt) {
        setSaveNotice(`Restored local draft from ${new Date(draft.savedAt).toLocaleString()}.`);
      }
    } catch {
      // ignore corrupt draft
    }
  }, [attachHandlers, setEdges, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeLabels: Record<string, string> = {
        agent: 'AI Agent',
        mcpTool: 'MCP Tool',
        flowControl: 'Flow Control',
        output: 'Output',
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: nodeLabels[type] || 'New Node',
          onChange: (field: string, value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id ? { ...node, data: { ...node.data, [field]: value } } : node
              )
            );
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Push the CURRENT canvas to the workflow API and return the persisted id.
  // Shared by Save and Run so a run never executes a stale server copy.
  const syncCanvasToApi = async (): Promise<string | null> => {
    const response = await apiService.saveWorkflowCanvas({
      id: savedWorkflowId || undefined,
      name: workflowName,
      nodes,
      edges,
    });
    if (response.success && response.data?.id) {
      setSavedWorkflowId(response.data.id);
      safeStorage.setItem(WORKFLOW_API_ID_KEY, response.data.id);
      return response.data.id;
    }
    setExecutionLog((prev) => [
      ...prev,
      `⚠️ API save failed: ${response.error || 'unknown error'}`,
    ]);
    return null;
  };

  const saveWorkflow = async () => {
    const workflow = { name: workflowName, nodes, edges, savedAt: new Date().toISOString() };
    try {
      safeStorage.setItem(WORKFLOW_DRAFT_KEY, JSON.stringify(workflow));
    } catch {
      setSaveNotice('Could not save draft — storage unavailable in this WebView.');
      return;
    }

    if (!canUseWorkflowApi) {
      setSaveNotice('Draft saved locally — sign in and connect API on :3001 to sync.');
      setExecutionLog((prev) => [...prev, '💾 Draft saved locally.']);
      return;
    }

    const id = await syncCanvasToApi();
    if (id) {
      setSaveNotice(`Synced to workflow API (${id.slice(0, 8)}…).`);
      setExecutionLog((prev) => [...prev, `💾 Saved to API: ${id}`]);
    } else {
      setSaveNotice('Local draft saved — API sync failed (see execution log).');
    }
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      setExecutionLog(['⚠️ Add nodes before running.']);
      return;
    }

    if (canUseWorkflowApi) {
      setIsExecuting(true);
      // Always persist the current canvas first so we execute exactly what's on
      // screen, not whatever was last saved.
      setExecutionLog(['▶ Saving current canvas before execution…']);
      const id = await syncCanvasToApi();
      if (!id) {
        setExecutionLog((prev) => [...prev, '❌ Could not save workflow — run aborted.']);
        setIsExecuting(false);
        return;
      }
      setExecutionLog((prev) => [...prev, `▶ Executing ${id.slice(0, 8)}… (current canvas)`]);
      const response = await apiService.executeWorkflow(id);
      if (response.success && response.data) {
        setExecutionLog((prev) => [
          ...prev,
          `✅ Execution ${response.data?.executionId} · status ${response.data?.status || 'started'}`,
        ]);
      } else {
        setExecutionLog((prev) => [...prev, `❌ Execute failed: ${response.error}`]);
      }
      setIsExecuting(false);
      return;
    }

    setIsExecuting(true);
    setExecutionLog(['[preview] Simulating workflow — sign in + API required for real execution.']);

    for (let i = 0; i < nodes.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setExecutionLog((prev) => [...prev, `[preview] Step ${i + 1}: ${nodes[i].data.label}`]);
    }

    setExecutionLog((prev) => [...prev, '[preview] Simulation complete.']);
    setIsExecuting(false);
  };

  const loadTemplate = (templateName: string) => {
    const templates: Record<string, { nodes: Node[]; edges: Edge[] }> = {
      research: {
        nodes: [
          {
            id: 'start',
            type: 'input',
            position: { x: 100, y: 200 },
            data: { label: '🚀 Start' },
            style: {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontWeight: 600,
            },
          },
          {
            id: 'research',
            type: 'agent',
            position: { x: 350, y: 150 },
            data: {
              label: 'Research Agent',
              provider: 'perplexity',
              prompt: 'Research the given topic',
            },
          },
          {
            id: 'analyze',
            type: 'agent',
            position: { x: 600, y: 150 },
            data: { label: 'Analysis Agent', provider: 'claude', prompt: 'Analyze the research' },
          },
          {
            id: 'report',
            type: 'output',
            position: { x: 850, y: 200 },
            data: { label: 'Generate Report', outputType: 'display' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'research', ...defaultEdgeOptions },
          { id: 'e2', source: 'research', target: 'analyze', ...defaultEdgeOptions },
          { id: 'e3', source: 'analyze', target: 'report', ...defaultEdgeOptions },
        ],
      },
      automation: {
        nodes: [
          {
            id: 'start',
            type: 'input',
            position: { x: 100, y: 200 },
            data: { label: '🚀 Start' },
            style: {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontWeight: 600,
            },
          },
          {
            id: 'browser',
            type: 'mcpTool',
            position: { x: 350, y: 150 },
            data: { label: 'Browser Action', tool: 'browser', parameters: '{}' },
          },
          {
            id: 'process',
            type: 'agent',
            position: { x: 600, y: 150 },
            data: { label: 'Process Data', provider: 'claude', prompt: 'Process the scraped data' },
          },
          {
            id: 'save',
            type: 'mcpTool',
            position: { x: 850, y: 200 },
            data: { label: 'Save Results', tool: 'filesystem', parameters: '{}' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'browser', ...defaultEdgeOptions },
          { id: 'e2', source: 'browser', target: 'process', ...defaultEdgeOptions },
          { id: 'e3', source: 'process', target: 'save', ...defaultEdgeOptions },
        ],
      },
    };

    const template = templates[templateName];
    if (template) {
      setNodes(attachHandlers(template.nodes));
      setEdges(template.edges);
      setWorkflowName(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Workflow`);
    }
  };

  const nodeLibrary = [
    { type: 'agent', icon: '🤖', label: 'AI Agent', color: '#8b5cf6' },
    { type: 'mcpTool', icon: '🔧', label: 'MCP Tool', color: '#10b981' },
    { type: 'flowControl', icon: '⚡', label: 'Flow Control', color: '#f59e0b' },
    { type: 'output', icon: '📤', label: 'Output', color: '#06b6d4' },
  ];

  return (
    <PageShell
      className="page-fill"
      title="Workflow Builder"
      subtitle={
        canUseWorkflowApi
          ? `${workflowName} · API sync enabled${savedWorkflowId ? ` · ${savedWorkflowId.slice(0, 8)}…` : ''}`
          : `${workflowName} · local draft + preview mode`
      }
      banner={
        <>
          <div className="info-banner">
            {canUseWorkflowApi
              ? 'Signed in with API online — Save syncs canvas to /workflows; Run executes saved workflow on server.'
              : 'Save always stores a local draft. Sign in (sidebar) and start REST API on :3001 to sync and run for real.'}
          </div>
          {saveNotice && (
            <div className="info-banner" role="status">
              {saveNotice}
            </div>
          )}
        </>
      }
      actions={
        <>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? 'Hide library' : 'Show library'}
          </button>
          <select
            className="secondary-button"
            onChange={(e) => e.target.value && loadTemplate(e.target.value)}
            defaultValue=""
          >
            <option value="">Load template…</option>
            <option value="research">AI Research</option>
            <option value="automation">Browser Automation</option>
          </select>
          <button type="button" className="secondary-button" onClick={saveWorkflow}>
            Save
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={executeWorkflow}
            disabled={isExecuting}
          >
            {isExecuting ? 'Running…' : 'Run'}
          </button>
        </>
      }
    >
      <SynergyStatusBar />
      <div className="page-fill-body">
        <div className="workflow-builder-container">
          <div className="workflow-toolbar">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="workflow-name-input"
              aria-label="Workflow name"
            />
            <div className="status-badge">
              <span className={`status-dot ${isExecuting ? 'executing' : 'ready'}`}></span>
              <span>{isExecuting ? 'Executing...' : 'Ready'}</span>
            </div>
          </div>

          <div className="workflow-content">
            {/* Sidebar */}
            {showSidebar && (
              <aside className="workflow-sidebar">
                <div className="sidebar-section">
                  <h3>📦 Node Library</h3>
                  <p className="sidebar-hint">Drag nodes to the canvas</p>
                  <div className="node-library">
                    {nodeLibrary.map((node) => (
                      <div
                        key={node.type}
                        className="library-node"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                        style={{ borderLeftColor: node.color }}
                      >
                        <span className="node-icon">{node.icon}</span>
                        <span className="node-label">{node.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {executionLog.length > 0 && (
                  <div className="sidebar-section">
                    <h3>📋 Execution Log</h3>
                    <div className="execution-log">
                      {executionLog.map((log, i) => (
                        <div key={i} className="log-entry">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sidebar-section">
                  <h3>ℹ️ Info</h3>
                  <div className="workflow-stats">
                    <div className="stat-item">
                      <span className="stat-value">{nodes.length}</span>
                      <span className="stat-label">Nodes</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{edges.length}</span>
                      <span className="stat-label">Connections</span>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Canvas */}
            <div className="workflow-canvas" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} color="#334155" gap={24} />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === 'agent') return '#8b5cf6';
                    if (node.type === 'mcpTool') return '#10b981';
                    if (node.type === 'flowControl') return '#f59e0b';
                    if (node.type === 'output') return '#06b6d4';
                    return '#10b981';
                  }}
                  maskColor="rgba(0, 0, 0, 0.6)"
                  style={{ background: '#1e293b', borderRadius: '8px' }}
                />
                <Panel position="top-right">
                  <div className="canvas-info">
                    <span>Nodes: {nodes.length}</span>
                    <span>Edges: {edges.length}</span>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </div>

          <style>{`
        .workflow-builder-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--tnf-obsidian, #020617);
          color: var(--tnf-text-primary, #f8fafc);
        }

        /* Toolbar (name + status below PageShell header) */
        .workflow-toolbar,
        .workflow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0 12px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toggle-sidebar-btn {
          background: transparent;
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-primary);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .workflow-name-input {
          background: transparent;
          border: 1px solid transparent;
          color: var(--tnf-text-primary);
          font-size: 18px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          min-width: 200px;
        }

        .workflow-name-input:focus {
          outline: none;
          border-color: var(--tnf-primary, #6366f1);
          background: rgba(99, 102, 241, 0.1);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--tnf-text-muted);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.ready { background: #10b981; }
        .status-dot.executing { background: #f59e0b; animation: pulse 1s infinite; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .template-select {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-primary);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .btn-secondary {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-primary);
        }

        .btn:hover { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Content Layout */
        .workflow-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Sidebar */
        .workflow-sidebar {
          width: 280px;
          background: var(--tnf-surface);
          border-right: 1px solid var(--tnf-border);
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .workflow-sidebar {
            position: absolute;
            left: 0;
            top: 48px;
            bottom: 0;
            z-index: 50;
            width: 260px;
          }
        }

        .sidebar-section h3 {
          margin: 0 0 8px;
          font-size: 14px;
          color: var(--tnf-primary-light, #8b5cf6);
        }

        .sidebar-hint {
          font-size: 12px;
          color: var(--tnf-text-muted);
          margin: 0 0 12px;
        }

        .node-library {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .library-node {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--tnf-border);
          border-left-width: 4px;
          border-radius: 10px;
          cursor: grab;
          transition: all 0.2s;
        }

        .library-node:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .library-node:active { cursor: grabbing; }

        .node-icon { font-size: 20px; }
        .node-label { font-weight: 500; }

        .execution-log {
          max-height: 150px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 12px;
        }

        .log-entry {
          font-size: 12px;
          font-family: monospace;
          margin-bottom: 4px;
          color: #e2e8f0;
        }

        .workflow-stats {
          display: flex;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--tnf-primary-light);
        }

        .stat-label {
          font-size: 11px;
          color: var(--tnf-text-muted);
        }

        /* Canvas */
        .workflow-canvas {
          flex: 1;
          position: relative;
        }

        .canvas-info {
          background: rgba(0, 0, 0, 0.8);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          display: flex;
          gap: 16px;
          color: var(--tnf-text-muted);
        }

        /* Node Styles */
        .workflow-node {
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid var(--tnf-border);
          border-radius: 12px;
          min-width: 240px;
          font-family: var(--tnf-font-body);
        }

        .workflow-node.agent-node { border-color: #8b5cf6; }
        .workflow-node.mcp-node { border-color: #10b981; }
        .workflow-node.flow-node { border-color: #f59e0b; }
        .workflow-node.output-node { border-color: #06b6d4; }

        .node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--tnf-border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px 10px 0 0;
        }

        .node-title {
          font-weight: 600;
          font-size: 13px;
          color: var(--tnf-text-primary);
        }

        .node-body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .node-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .node-field label {
          font-size: 11px;
          font-weight: 600;
          color: var(--tnf-text-muted);
          text-transform: uppercase;
        }

        .node-field select,
        .node-field textarea {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--tnf-border);
          border-radius: 6px;
          padding: 8px;
          color: var(--tnf-text-primary);
          font-size: 12px;
        }

        .node-field select:focus,
        .node-field textarea:focus {
          outline: none;
          border-color: var(--tnf-primary);
        }

        .node-field textarea {
          resize: vertical;
          min-height: 50px;
        }

        .node-handles {
          display: flex;
          justify-content: space-between;
          padding: 6px 14px;
          font-size: 10px;
          color: var(--tnf-text-muted);
        }

        /* ReactFlow Overrides */
        .react-flow__node {
          cursor: grab;
        }

        .react-flow__node:active {
          cursor: grabbing;
        }

        .react-flow__controls {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
        }

        .react-flow__controls-button {
          background: transparent;
          border-bottom: 1px solid var(--tnf-border);
          fill: var(--tnf-text-muted);
        }

        .react-flow__controls-button:hover {
          background: var(--tnf-surface-hover);
        }
      `}</style>
        </div>
      </div>
    </PageShell>
  );
};

const WorkflowBuilder: React.FC = () => (
  <ReactFlowProvider>
    <WorkflowBuilderContent />
  </ReactFlowProvider>
);

export default WorkflowBuilder;
