import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  OnSelectionChangeParams,
  Panel,
  Position,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PageShell from '../components/layout/PageShell';
import { useAuth } from '../hooks/useAuth';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import { safeStorage } from '../lib/safeStorage';
import { DEFAULT_PROVIDER_ID, LLM_PROVIDERS, resolveProviderId } from '../config/llmProviders';
import { apiService } from '../services/api';
import { useAgentStore } from '../stores/agentStore';

/**
 * Workflow Builder — Tauri Desktop
 * Visual canvas for agent / MCP / flow / output graphs with local draft + API sync.
 */

type WorkflowNodeData = {
  label: string;
  provider?: string;
  prompt?: string;
  agentId?: string;
  tool?: string;
  parameters?: string;
  controlType?: string;
  config?: string;
  outputType?: string;
  onChange?: (field: string, value: string) => void;
};

/**
 * Pre-registry provider ids that saved workflow drafts may still carry.
 * They stay selectable so old graphs keep rendering; new nodes use
 * canonical registry ids from LLM_PROVIDERS.
 */
const LEGACY_PROVIDER_OPTIONS = [
  { id: 'gemini', name: 'Google Gemini (legacy)' },
  { id: 'cerebras', name: 'Cerebras (legacy)' },
  { id: 'local', name: 'Local LLM (legacy)' },
];

const LEGACY_PROVIDER_IDS = LEGACY_PROVIDER_OPTIONS.map((p) => p.id);

const ProviderSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <select
    className="nodrag nopan"
    value={resolveProviderId(value, LEGACY_PROVIDER_IDS)}
    onChange={(e) => onChange(e.target.value)}
  >
    {LLM_PROVIDERS.map((provider) => (
      <option key={provider.id} value={provider.id}>
        {provider.name}
      </option>
    ))}
    {LEGACY_PROVIDER_OPTIONS.map((provider) => (
      <option key={provider.id} value={provider.id}>
        {provider.name}
      </option>
    ))}
  </select>
);

const AgentNode = ({ data }: { data: WorkflowNodeData }) => (
  <div className="workflow-node agent-node">
    <Handle type="target" position={Position.Left} id="in" className="wf-handle wf-handle-in" />
    <div className="node-header">
      <span className="node-icon">🤖</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Provider</label>
        <ProviderSelect
          value={data.provider || DEFAULT_PROVIDER_ID}
          onChange={(v) => data.onChange?.('provider', v)}
        />
      </div>
      <div className="node-field">
        <label>Prompt</label>
        <textarea
          className="nodrag nopan"
          value={data.prompt || ''}
          onChange={(e) => data.onChange?.('prompt', e.target.value)}
          placeholder="Enter your prompt..."
          rows={3}
        />
      </div>
    </div>
    <Handle type="source" position={Position.Right} id="out" className="wf-handle wf-handle-out" />
  </div>
);

const MCPToolNode = ({ data }: { data: WorkflowNodeData }) => (
  <div className="workflow-node mcp-node">
    <Handle type="target" position={Position.Left} id="in" className="wf-handle wf-handle-in" />
    <div className="node-header">
      <span className="node-icon">🔧</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Tool</label>
        <select
          className="nodrag nopan"
          value={data.tool || ''}
          onChange={(e) => data.onChange?.('tool', e.target.value)}
        >
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
          className="nodrag nopan"
          value={data.parameters || ''}
          onChange={(e) => data.onChange?.('parameters', e.target.value)}
          placeholder='{"action": "read", "path": "..."}'
          rows={2}
        />
      </div>
    </div>
    <Handle type="source" position={Position.Right} id="out" className="wf-handle wf-handle-out" />
  </div>
);

const FlowControlNode = ({ data }: { data: WorkflowNodeData }) => (
  <div className="workflow-node flow-node">
    <Handle type="target" position={Position.Left} id="in" className="wf-handle wf-handle-in" />
    <div className="node-header">
      <span className="node-icon">⚡</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Type</label>
        <select
          className="nodrag nopan"
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
          className="nodrag nopan"
          value={data.config || ''}
          onChange={(e) => data.onChange?.('config', e.target.value)}
          placeholder="Configuration..."
          rows={2}
        />
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Right}
      id="out"
      className="wf-handle wf-handle-out"
      style={{ top: '40%' }}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="alt"
      className="wf-handle wf-handle-out wf-handle-alt"
      style={{ top: '70%' }}
    />
  </div>
);

const OutputNode = ({ data }: { data: WorkflowNodeData }) => (
  <div className="workflow-node output-node">
    <Handle type="target" position={Position.Left} id="in" className="wf-handle wf-handle-in" />
    <div className="node-header">
      <span className="node-icon">📤</span>
      <span className="node-title">{data.label}</span>
    </div>
    <div className="node-body">
      <div className="node-field">
        <label>Output Type</label>
        <select
          className="nodrag nopan"
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

/** Stable identity — keep outside the component to avoid React Flow warning #002. */
const nodeTypes = {
  agent: AgentNode,
  mcpTool: MCPToolNode,
  flowControl: FlowControlNode,
  output: OutputNode,
};

const edgeTypes = {};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

const startNodeStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '16px 24px',
  fontWeight: 600,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 200 },
    data: { label: '🚀 Start' },
    style: startNodeStyle,
  },
];

const WORKFLOW_DRAFT_KEY = 'tnf.workflow.draft';
const WORKFLOW_API_ID_KEY = 'tnf.workflow.apiId';

const NODE_LABELS: Record<string, string> = {
  agent: 'AI Agent',
  mcpTool: 'MCP Tool',
  flowControl: 'Flow Control',
  output: 'Output',
};

type PaletteAgent = {
  id: string;
  name: string;
  provider?: string;
  source: 'api' | 'federation';
};

const WorkflowBuilderContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { state: synergy, unifiedAgents } = useOperatorSynergy();
  const { agents, loading: agentsLoading, error: agentsError, fetchAgents } = useAgentStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [remoteWorkflows, setRemoteWorkflows] = useState<Array<{ id: string; name: string }>>([]);
  const [remoteLoadError, setRemoteLoadError] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition, getViewport, fitView } = useReactFlow();

  const canUseWorkflowApi = isAuthenticated && synergy.apiOnline;

  const paletteAgents: PaletteAgent[] = useMemo(() => {
    const fromApi = agents.map((a) => ({
      id: a.id,
      name: a.name,
      provider: a.config?.provider || a.type,
      source: 'api' as const,
    }));
    if (fromApi.length > 0) return fromApi;

    return (unifiedAgents || []).slice(0, 24).map((a) => ({
      id: a.id,
      name: a.name || a.id,
      provider: a.platform || 'custom',
      source: 'federation' as const,
    }));
  }, [agents, unifiedAgents]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const attachHandlers = useCallback(
    (list: Node[]): Node[] =>
      list.map((node) => {
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
    void fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (!canUseWorkflowApi) {
      setRemoteWorkflows([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const response = await apiService.getWorkflows();
      if (cancelled) return;
      if (response.success && Array.isArray(response.data)) {
        setRemoteWorkflows(
          response.data.map((w) => ({
            id: w.id,
            name: w.name || w.id,
          }))
        );
        setRemoteLoadError(null);
      } else {
        setRemoteWorkflows([]);
        setRemoteLoadError(response.error || 'Could not list remote workflows.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canUseWorkflowApi]);

  const loadRemoteWorkflow = async (id: string) => {
    const response = await apiService.getWorkflow(id);
    if (!response.success || !response.data) {
      setSaveNotice(`Failed to load workflow: ${response.error || 'unknown error'}`);
      return;
    }
    const definition = (response.data as { definition?: { nodes?: Node[]; edges?: Edge[] } })
      .definition;
    const nodesFromApi =
      definition?.nodes ||
      ((response.data as { nodes?: Node[] }).nodes as Node[] | undefined) ||
      [];
    const edgesFromApi =
      definition?.edges ||
      ((response.data as { edges?: Edge[] }).edges as Edge[] | undefined) ||
      [];
    if (!nodesFromApi.length) {
      setSaveNotice('Remote workflow had no canvas nodes.');
      return;
    }
    setWorkflowName(response.data.name || 'Loaded Workflow');
    setSavedWorkflowId(response.data.id);
    safeStorage.setItem(WORKFLOW_API_ID_KEY, response.data.id);
    setNodes(attachHandlers(nodesFromApi));
    setEdges(edgesFromApi);
    setSelectedNodeId(null);
    setSaveNotice(`Loaded remote workflow ${response.data.id.slice(0, 8)}…`);
    requestAnimationFrame(() => fitView({ padding: 0.2 }));
  };

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
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return;
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    },
    [setEdges]
  );

  const onSelectionChange = useCallback(({ nodes: selected }: OnSelectionChangeParams) => {
    setSelectedNodeId(selected[0]?.id ?? null);
  }, []);

  const createNode = useCallback(
    (
      type: string,
      position: { x: number; y: number },
      extras: Partial<WorkflowNodeData> = {}
    ): Node => {
      const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return {
        id,
        type,
        position,
        data: {
          label: extras.label || NODE_LABELS[type] || 'New Node',
          ...extras,
          onChange: (field: string, value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, [field]: value } } : node
              )
            );
          },
        },
      };
    },
    [setNodes]
  );

  const addNodeAt = useCallback(
    (
      type: string,
      clientPosition?: { x: number; y: number },
      extras?: Partial<WorkflowNodeData>
    ) => {
      let position = { x: 280, y: 180 };
      if (clientPosition) {
        position = screenToFlowPosition(clientPosition);
      } else {
        const vp = getViewport();
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        const cx = (bounds?.width || 600) / 2;
        const cy = (bounds?.height || 400) / 2;
        position = {
          x: (cx - vp.x) / vp.zoom - 120,
          y: (cy - vp.y) / vp.zoom - 40,
        };
      }
      setNodes((nds) => nds.concat(createNode(type, position, extras)));
    },
    [createNode, getViewport, screenToFlowPosition, setNodes]
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
      let extras: Partial<WorkflowNodeData> | undefined;
      const rawExtras = event.dataTransfer.getData('application/tnf-node-extras');
      if (rawExtras) {
        try {
          extras = JSON.parse(rawExtras) as Partial<WorkflowNodeData>;
        } catch {
          extras = undefined;
        }
      }
      addNodeAt(type, { x: event.clientX, y: event.clientY }, extras);
    },
    [addNodeAt]
  );

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    extras?: Partial<WorkflowNodeData>
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (extras) {
      event.dataTransfer.setData('application/tnf-node-extras', JSON.stringify(extras));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  // WKWebView / Tauri often breaks HTML5 DnD. Pointer drag works reliably.
  type PaletteDragPayload = {
    type: string;
    extras?: Partial<WorkflowNodeData>;
    label: string;
    icon: string;
    color: string;
  };

  const [paletteGhost, setPaletteGhost] = useState<
    (PaletteDragPayload & { x: number; y: number }) | null
  >(null);
  const pointerPayloadRef = useRef<PaletteDragPayload | null>(null);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const pointerDraggingRef = useRef(false);
  const suppressClickRef = useRef(false);

  const endPointerDrag = useCallback(
    (clientX: number, clientY: number) => {
      const payload = pointerPayloadRef.current;
      const wasDragging = pointerDraggingRef.current;
      pointerPayloadRef.current = null;
      pointerOriginRef.current = null;
      pointerDraggingRef.current = false;
      setPaletteGhost(null);

      if (!payload || !wasDragging) return;
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (
        bounds &&
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom
      ) {
        addNodeAt(payload.type, { x: clientX, y: clientY }, payload.extras);
      }
    },
    [addNodeAt]
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const payload = pointerPayloadRef.current;
      const origin = pointerOriginRef.current;
      if (!payload || !origin) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (!pointerDraggingRef.current) {
        if (dx * dx + dy * dy < 36) return;
        pointerDraggingRef.current = true;
      }
      setPaletteGhost({
        ...payload,
        x: event.clientX,
        y: event.clientY,
      });
    };
    const onUp = (event: PointerEvent) => {
      if (!pointerPayloadRef.current) return;
      endPointerDrag(event.clientX, event.clientY);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [endPointerDrag]);

  const beginPointerDrag = (event: React.PointerEvent, payload: PaletteDragPayload) => {
    if (event.button !== 0) return;
    pointerPayloadRef.current = payload;
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    pointerDraggingRef.current = false;
  };

  const handleLibraryActivate = (type: string, extras?: Partial<WorkflowNodeData>) => {
    if (suppressClickRef.current) return;
    addNodeAt(type, undefined, extras);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    if (selectedNodeId === 'start') {
      setSaveNotice('The Start node cannot be deleted.');
      return;
    }
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setEdges, setNodes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelected, selectedNodeId]);

  const syncCanvasToApi = async (): Promise<string | null> => {
    const response = await apiService.saveWorkflowCanvas({
      id: savedWorkflowId || undefined,
      name: workflowName,
      nodes: nodes.map(({ data, ...rest }) => {
        const { onChange: _onChange, ...safeData } = (data || {}) as WorkflowNodeData;
        return { ...rest, data: safeData };
      }),
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
    const serializableNodes = nodes.map(({ data, ...rest }) => {
      const { onChange: _onChange, ...safeData } = (data || {}) as WorkflowNodeData;
      return { ...rest, data: safeData };
    });
    const workflow = {
      name: workflowName,
      nodes: serializableNodes,
      edges,
      savedAt: new Date().toISOString(),
    };
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
      await new Promise((resolve) => setTimeout(resolve, 400));
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
            style: startNodeStyle,
          },
          {
            id: 'research',
            type: 'agent',
            position: { x: 350, y: 150 },
            data: {
              label: 'Research Agent',
              provider: 'nvidia',
              prompt: 'Research the given topic',
            },
          },
          {
            id: 'analyze',
            type: 'agent',
            position: { x: 600, y: 150 },
            data: { label: 'Analysis Agent', provider: 'openai', prompt: 'Analyze the research' },
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
            style: startNodeStyle,
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
            data: { label: 'Process Data', provider: 'openai', prompt: 'Process the scraped data' },
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
      setSelectedNodeId(null);
      requestAnimationFrame(() => fitView({ padding: 0.2 }));
    }
  };

  const exportWorkflow = () => {
    const serializableNodes = nodes.map(({ data, ...rest }) => {
      const { onChange: _onChange, ...safeData } = (data || {}) as WorkflowNodeData;
      return { ...rest, data: safeData };
    });
    const payload = {
      name: workflowName,
      nodes: serializableNodes,
      edges,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '-').toLowerCase() || 'workflow'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSaveNotice('Exported workflow JSON.');
  };

  const importWorkflow = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        name?: string;
        nodes?: Node[];
        edges?: Edge[];
      };
      if (!parsed.nodes?.length) {
        setSaveNotice('Import failed — no nodes in file.');
        return;
      }
      if (parsed.name) setWorkflowName(parsed.name);
      setNodes(attachHandlers(parsed.nodes));
      setEdges(parsed.edges || []);
      setSelectedNodeId(null);
      setSaveNotice(`Imported ${parsed.nodes.length} nodes from ${file.name}.`);
      requestAnimationFrame(() => fitView({ padding: 0.2 }));
    } catch {
      setSaveNotice('Import failed — invalid JSON.');
    }
  };

  const clearCanvas = () => {
    setNodes(initialNodes);
    setEdges([]);
    setSelectedNodeId(null);
    setSaveNotice('Canvas cleared.');
  };

  const nodeLibrary: Array<{
    id: string;
    type: string;
    icon: string;
    label: string;
    color: string;
    extras?: Partial<WorkflowNodeData>;
  }> = [
    { id: 'agent', type: 'agent', icon: '🤖', label: 'AI Agent', color: '#8b5cf6' },
    {
      id: 'research-agent',
      type: 'agent',
      icon: '🔎',
      label: 'Research Agent',
      color: '#8b5cf6',
      extras: {
        label: 'Research Agent',
        provider: 'nvidia',
        prompt: 'Research the given topic thoroughly',
      },
    },
    {
      id: 'analysis-agent',
      type: 'agent',
      icon: '🧪',
      label: 'Analysis Agent',
      color: '#8b5cf6',
      extras: {
        label: 'Analysis Agent',
        provider: 'openai',
        prompt: 'Analyze the upstream result',
      },
    },
    { id: 'mcp', type: 'mcpTool', icon: '🔧', label: 'MCP Tool', color: '#10b981' },
    {
      id: 'mcp-browser',
      type: 'mcpTool',
      icon: '🌐',
      label: 'Browser Action',
      color: '#10b981',
      extras: { label: 'Browser Action', tool: 'browser', parameters: '{}' },
    },
    {
      id: 'mcp-fs',
      type: 'mcpTool',
      icon: '📁',
      label: 'File System',
      color: '#10b981',
      extras: { label: 'File System', tool: 'filesystem', parameters: '{}' },
    },
    { id: 'flow', type: 'flowControl', icon: '⚡', label: 'Flow Control', color: '#f59e0b' },
    {
      id: 'flow-condition',
      type: 'flowControl',
      icon: '⎇',
      label: 'Condition',
      color: '#f59e0b',
      extras: { label: 'Condition', controlType: 'condition' },
    },
    {
      id: 'flow-loop',
      type: 'flowControl',
      icon: '🔁',
      label: 'Loop',
      color: '#f59e0b',
      extras: { label: 'Loop', controlType: 'loop' },
    },
    { id: 'output', type: 'output', icon: '📤', label: 'Output', color: '#06b6d4' },
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
              : 'Save always stores a local draft. Sign in (sidebar) and start REST API on :3001 to sync and run for real.'}{' '}
            Tip: drag library components onto the canvas (pointer drag works in desktop WebView), or
            click to place. Connect nodes via the blue/green handles.
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
            aria-label={showSidebar ? 'Hide library' : 'Show library'}
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
          <button type="button" className="ghost-button" onClick={exportWorkflow}>
            Export
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importWorkflow(file);
              e.target.value = '';
            }}
          />
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
            <div className="toolbar-actions">
              <button type="button" className="ghost-button" onClick={clearCanvas}>
                Clear
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={deleteSelected}
                disabled={!selectedNodeId || selectedNodeId === 'start'}
              >
                Delete node
              </button>
              <div className="status-badge">
                <span className={`status-dot ${isExecuting ? 'executing' : 'ready'}`}></span>
                <span>{isExecuting ? 'Executing...' : 'Ready'}</span>
              </div>
            </div>
          </div>

          <div className="workflow-content">
            {showSidebar && (
              <aside className="workflow-sidebar">
                <div className="sidebar-section">
                  <h3>📦 Node Library</h3>
                  <p className="sidebar-hint">Drag onto canvas · or click to place</p>
                  <div className="node-library">
                    {nodeLibrary.map((node) => {
                      const payload = {
                        type: node.type,
                        extras: node.extras,
                        label: node.label,
                        icon: node.icon,
                        color: node.color,
                      };
                      return (
                        <div
                          key={node.id}
                          className="library-node"
                          draggable
                          role="button"
                          tabIndex={0}
                          onClick={() => handleLibraryActivate(node.type, node.extras)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleLibraryActivate(node.type, node.extras);
                            }
                          }}
                          onPointerDown={(e) => beginPointerDrag(e, payload)}
                          onDragStart={(e) => onDragStart(e, node.type, node.extras)}
                          style={{ borderLeftColor: node.color }}
                        >
                          <span className="node-icon">{node.icon}</span>
                          <span className="node-label">{node.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="sidebar-section">
                  <div className="section-row">
                    <h3>🤖 Agents</h3>
                    <button
                      type="button"
                      className="ghost-button compact"
                      onClick={() => void fetchAgents({ force: true })}
                      disabled={agentsLoading}
                    >
                      {agentsLoading ? '…' : 'Refresh'}
                    </button>
                  </div>
                  {agentsError && <p className="sidebar-hint warn">{agentsError}</p>}
                  {!agentsError && paletteAgents.length === 0 && (
                    <p className="sidebar-hint">
                      No agents yet — open Agent Hub or wait for federation.
                    </p>
                  )}
                  <div className="agent-palette">
                    {paletteAgents.map((agent) => {
                      const extras: Partial<WorkflowNodeData> = {
                        label: agent.name,
                        agentId: agent.id,
                        provider: agent.provider || 'nvidia',
                        prompt: `Run as ${agent.name}`,
                      };
                      const payload = {
                        type: 'agent',
                        extras,
                        label: agent.name,
                        icon: '🤖',
                        color: '#8b5cf6',
                      };
                      return (
                        <button
                          key={`${agent.source}-${agent.id}`}
                          type="button"
                          className="agent-chip"
                          title={`Drag or click to add ${agent.name}`}
                          onClick={() => handleLibraryActivate('agent', extras)}
                          onPointerDown={(e) => beginPointerDrag(e, payload)}
                          draggable
                          onDragStart={(e) => onDragStart(e, 'agent', extras)}
                        >
                          <span className="agent-chip-name">{agent.name}</span>
                          <span className="agent-chip-meta">
                            {agent.provider || 'agent'} · {agent.source}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {canUseWorkflowApi && (
                  <div className="sidebar-section">
                    <h3>☁️ Saved workflows</h3>
                    {remoteLoadError && <p className="sidebar-hint warn">{remoteLoadError}</p>}
                    {!remoteLoadError && remoteWorkflows.length === 0 && (
                      <p className="sidebar-hint">No remote workflows yet — Save to create one.</p>
                    )}
                    <div className="agent-palette">
                      {remoteWorkflows.slice(0, 12).map((wf) => (
                        <button
                          key={wf.id}
                          type="button"
                          className="agent-chip"
                          onClick={() => void loadRemoteWorkflow(wf.id)}
                        >
                          <span className="agent-chip-name">{wf.name}</span>
                          <span className="agent-chip-meta">{wf.id.slice(0, 8)}…</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode && selectedNode.type !== 'input' && (
                  <div className="sidebar-section">
                    <h3>🎛️ Selected</h3>
                    <p className="sidebar-hint">
                      {String(selectedNode.data?.label || selectedNode.id)}
                    </p>
                    <div className="node-field">
                      <label>Label</label>
                      <input
                        className="nodrag"
                        value={String(selectedNode.data?.label || '')}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNodes((nds) =>
                            nds.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, label: value } }
                                : n
                            )
                          );
                        }}
                      />
                    </div>
                  </div>
                )}

                {executionLog.length > 0 && (
                  <div className="sidebar-section">
                    <h3>📋 Execution Log</h3>
                    <div className="execution-log">
                      {executionLog.map((log, i) => (
                        <div key={`${i}-${log.slice(0, 12)}`} className="log-entry">
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

            <div className="workflow-canvas" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                deleteKeyCode={null}
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

          {paletteGhost ? (
            <div
              className="palette-drag-ghost"
              style={{
                left: paletteGhost.x + 12,
                top: paletteGhost.y + 12,
                borderLeftColor: paletteGhost.color,
              }}
              aria-hidden
            >
              <span className="node-icon">{paletteGhost.icon}</span>
              <span className="node-label">{paletteGhost.label}</span>
            </div>
          ) : null}

          <style>{`
        .workflow-builder-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--tnf-obsidian, #020617);
          color: var(--tnf-text-primary, #f8fafc);
          position: relative;
        }

        .palette-drag-ghost {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--tnf-surface-card, rgba(15, 23, 42, 0.92));
          border: 1px solid var(--tnf-border);
          border-left-width: 4px;
          border-radius: 10px;
          box-shadow: var(--tnf-shadow-md);
          color: var(--tnf-text-primary);
          font-size: 13px;
          font-weight: 600;
        }

        .library-node,
        .agent-chip {
          -webkit-user-drag: element;
          user-select: none;
          touch-action: none;
        }

        .workflow-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0 12px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
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

        .workflow-content {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        .workflow-sidebar {
          width: 300px;
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

        .section-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .section-row h3 { margin: 0; }

        .ghost-button.compact {
          padding: 4px 8px;
          font-size: 11px;
        }

        .sidebar-hint {
          font-size: 12px;
          color: var(--tnf-text-muted);
          margin: 0 0 12px;
        }

        .sidebar-hint.warn {
          color: #fbbf24;
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

        .agent-palette {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
        }

        .agent-chip {
          text-align: left;
          background: rgba(139, 92, 246, 0.12);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 8px;
          padding: 8px 10px;
          color: var(--tnf-text-primary);
          cursor: pointer;
        }

        .agent-chip:hover {
          background: rgba(139, 92, 246, 0.22);
        }

        .agent-chip-name {
          display: block;
          font-size: 12px;
          font-weight: 600;
        }

        .agent-chip-meta {
          display: block;
          font-size: 10px;
          color: var(--tnf-text-muted);
          margin-top: 2px;
        }

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

        .workflow-canvas {
          flex: 1;
          position: relative;
          min-width: 0;
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

        .workflow-node {
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid var(--tnf-border);
          border-radius: 12px;
          min-width: 240px;
          font-family: var(--tnf-font-body);
          position: relative;
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
        .node-field textarea,
        .node-field input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--tnf-border);
          border-radius: 6px;
          padding: 8px;
          color: var(--tnf-text-primary);
          font-size: 12px;
        }

        .node-field select:focus,
        .node-field textarea:focus,
        .node-field input:focus {
          outline: none;
          border-color: var(--tnf-primary);
        }

        .node-field textarea {
          resize: vertical;
          min-height: 50px;
        }

        .wf-handle {
          width: 12px !important;
          height: 12px !important;
          border: 2px solid #fff !important;
        }

        .wf-handle-in {
          background: #3b82f6 !important;
        }

        .wf-handle-out {
          background: #22c55e !important;
        }

        .wf-handle-alt {
          background: #f59e0b !important;
        }

        .react-flow__node {
          cursor: grab;
        }

        .react-flow__node:active {
          cursor: grabbing;
        }

        .react-flow__node.selected .workflow-node {
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.7);
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
