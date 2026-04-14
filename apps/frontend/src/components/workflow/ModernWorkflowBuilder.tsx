// @ts-nocheck
import { useMcpTools } from '@/hooks/useMcpTools';
import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './ModernWorkflowBuilder.css';
import { StatusDecorator } from './StatusDecorator';
import {
  AgentNode,
  A2ANode,
  ConditionNode,
  InputNode,
  MCPToolNode,
  NotificationNode,
  OutputNode,
  SubworkflowNode,
  TransformNode,
  LoopNode,
} from './lazy';
// AgentNode imported from './lazy'
// MCPToolNode imported from './lazy'
  const { servers, loading, source, setSource, resetSource } = useMcpTools();
  const selectedServer = servers.find((server) => server.name === data.mcpServer);
  const tools = selectedServer?.tools || [];
  const registryBadge = selectedServer?.metadata?.source === 'registry';
  const serverSchema = selectedServer?.metadata?.configurationSchema;
  const serverConfigProperties = serverSchema?.properties || {};

  const parseServerConfig = () => {
    if (!data?.serverConfig) return {};
    if (typeof data.serverConfig === 'string') {
      try {
        return JSON.parse(data.serverConfig);
      } catch {
        return {};
      }
    }
    return data.serverConfig;
  };

  const serverConfigValues = parseServerConfig();

  const buildConfigDefaults = (schema: any, existing: Record<string, any>) => {
    const properties = schema?.properties || {};
    const defaults: Record<string, any> = { ...existing };

    Object.entries(properties).forEach(([key, config]: [string, any]) => {
      if (defaults[key] !== undefined) return;
      if (config?.default !== undefined) {
        defaults[key] = config.default;
        return;
      }
      switch (config?.type) {
        case 'number':
          defaults[key] = 0;
          break;
        case 'boolean':
          defaults[key] = false;
          break;
        case 'object':
          defaults[key] = {};
          break;
        case 'array':
          defaults[key] = [];
          break;
        default:
          defaults[key] = '';
      }
    });

    return defaults;
  };

  const handleServerConfigChange = (paramName: string, value: any) => {
    const nextConfig = {
      ...serverConfigValues,
      [paramName]: value,
    };
    data.onChange?.('serverConfig', nextConfig as any);
  };

  return (
    <div className="mcp-node relative">
      <StatusDecorator status={data.status} />
      <div className="node-header">
        <div className="node-icon">🔧</div>
        <div className="node-title">{data.label}</div>
      </div>
      <div className="node-content">
        <div className="node-field">
          <label className="flex items-center justify-between">
            Server Source
            <button
              type="button"
              onClick={() => resetSource()}
              className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset
            </button>
          </label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className={`flex-1 px-2 py-1 text-xs rounded ${source === 'tnf' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}
              onClick={() => setSource('tnf' as any)}
              disabled={loading}
            >
              TNF Curated
            </button>
            <button
              type="button"
              className={`flex-1 px-2 py-1 text-xs rounded ${source === 'registry' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}
              onClick={() => setSource('registry' as any)}
              disabled={loading}
            >
              Official Registry
            </button>
          </div>
        </div>

        <div className="node-field">
          <label>MCP Server:</label>
          <select
            value={data.mcpServer || ''}
            onChange={(e) => {
              const nextServer = e.target.value;
              data.onChange?.('mcpServer', nextServer);
              const nextSchema = servers.find((server) => server.name === nextServer)?.metadata
                ?.configurationSchema;
              const defaults = nextSchema?.properties ? buildConfigDefaults(nextSchema, {}) : {};
              data.onChange?.('serverConfig', defaults as any);
            }}
            disabled={loading}
          >
            <option value="">Select a server...</option>
            {servers.map((server) => (
              <option key={server.id} value={server.name}>
                {server.name}
              </option>
            ))}
          </select>
          {registryBadge && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-200">
              Official Registry
            </div>
          )}
        </div>

        {selectedServer && tools.length === 0 && (
          <div className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded border border-amber-500/30">
            This server does not expose tools in the registry listing yet.
          </div>
        )}

        {Object.keys(serverConfigProperties).length > 0 && (
          <div className="node-field">
            <label>Server Configuration:</label>
            <div className="space-y-2 mt-2">
              {Object.entries(serverConfigProperties).map(
                ([paramName, paramConfig]: [string, any]) => {
                  const isRequired = serverSchema?.required?.includes(paramName);
                  const isSecret = Boolean(paramConfig?.['x-secret']);
                  const isEnum = Array.isArray(paramConfig?.enum) && paramConfig.enum.length > 0;
                  const value = serverConfigValues[paramName];
                  const isEmpty = value === undefined || value === '' || value === null;

                  if (isEnum) {
                    return (
                      <label key={paramName} className="block text-xs text-slate-300">
                        {paramName} {isRequired && <span className="text-red-400">*</span>}
                        <select
                          className="mt-1 w-full"
                          value={serverConfigValues[paramName] ?? ''}
                          onChange={(e) => handleServerConfigChange(paramName, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {paramConfig.enum.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        {isRequired && isEmpty && (
                          <div className="text-[10px] text-amber-400 mt-1">
                            ⚠️ Required configuration
                          </div>
                        )}
                      </label>
                    );
                  }

                  if (paramConfig?.type === 'boolean') {
                    return (
                      <label
                        key={paramName}
                        className="flex items-center gap-2 text-xs text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(serverConfigValues[paramName])}
                          onChange={(e) => handleServerConfigChange(paramName, e.target.checked)}
                        />
                        {paramName} {isRequired && <span className="text-red-400">*</span>}
                      </label>
                    );
                  }

                  if (paramConfig?.type === 'object' || paramConfig?.type === 'array') {
                    return (
                      <label key={paramName} className="block text-xs text-slate-300">
                        {paramName} {isRequired && <span className="text-red-400">*</span>}
                        <textarea
                          className="mt-1 w-full"
                          rows={3}
                          value={
                            typeof serverConfigValues[paramName] === 'string'
                              ? serverConfigValues[paramName]
                              : JSON.stringify(serverConfigValues[paramName] ?? '', null, 2)
                          }
                          onChange={(e) => {
                            try {
                              handleServerConfigChange(paramName, JSON.parse(e.target.value));
                            } catch {
                              handleServerConfigChange(paramName, e.target.value);
                            }
                          }}
                          placeholder={paramConfig?.description || paramName}
                        />
                        {isRequired && isEmpty && (
                          <div className="text-[10px] text-amber-400 mt-1">
                            ⚠️ Required configuration
                          </div>
                        )}
                      </label>
                    );
                  }

                  return (
                    <label key={paramName} className="block text-xs text-slate-300">
                      {paramName} {isRequired && <span className="text-red-400">*</span>}
                      <input
                        className="mt-1 w-full"
                        type={
                          isSecret ? 'password' : paramConfig?.type === 'number' ? 'number' : 'text'
                        }
                        value={serverConfigValues[paramName] ?? ''}
                        onChange={(e) =>
                          handleServerConfigChange(
                            paramName,
                            paramConfig?.type === 'number' ? Number(e.target.value) : e.target.value
                          )
                        }
                        placeholder={paramConfig?.description || paramName}
                      />
                      {isRequired && isEmpty && (
                        <div className="text-[10px] text-amber-400 mt-1">
                          ⚠️ Required configuration
                        </div>
                      )}
                    </label>
                  );
                }
              )}
            </div>
          </div>
        )}

        <div className="node-field">
          <label>Tool:</label>
          <select
            value={data.tool || ''}
            onChange={(e) => data.onChange?.('tool', e.target.value)}
            disabled={loading || !selectedServer}
          >
            <option value="">Select a tool...</option>
            {tools.map((tool) => (
              <option key={tool.id || tool.name} value={tool.name}>
                {tool.name}
              </option>
            ))}
          </select>
        </div>

        <div className="node-field">
          <label>Parameters:</label>
          <textarea
            value={data.parameters || ''}
            onChange={(e) => data.onChange?.('parameters', e.target.value)}
            placeholder="Enter parameters as JSON..."
          />
        </div>
      </div>
    </div>
  );
};

const FlowControlNode = ({ data }: { data: any }) => (
  <div className="flow-node">
    <div className="node-header">
      <div className="node-icon">⚡</div>
      <div className="node-title">{data.label}</div>
    </div>
    <div className="node-content">
      <div className="node-field">
        <label>Type:</label>
        <select
          value={data.type || 'condition'}
          onChange={(e) => data.onChange?.('type', e.target.value)}
        >
          <option value="condition">Condition</option>
          <option value="loop">Loop</option>
          <option value="delay">Delay</option>
          <option value="parallel">Parallel</option>
        </select>
      </div>
      <div className="node-field">
        <label>Configuration:</label>
        <textarea
          value={data.config || ''}
          onChange={(e) => data.onChange?.('config', e.target.value)}
          placeholder="Enter configuration..."
        />
      </div>
    </div>
  </div>
);

const nodeTypes = {
  agent: AgentNode,
  'mcp-tool': MCPToolNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
  transform: TransformNode,
  notification: NotificationNode,
  a2a: A2ANode,
  loop: LoopNode,
  subworkflow: SubworkflowNode,
};

const initialNodes: Node[] = [
  {
    id: 'start-node',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: '🚀 Start' },
  },
];

const initialEdges: Edge[] = [];

const WorkflowBuilderContent = () => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const [availableTemplates, setAvailableTemplates] = useState<
    { id: string; name: string; description?: string }[]
  >([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project, setCenter, getNodes } = useReactFlow();

  // Load templates from API on mount
  React.useEffect(() => {
    fetch(`${apiBaseUrl}/api/workflows/templates`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableTemplates(
            data.map((t: any) => ({ id: t.id, name: t.name, description: t.description }))
          );
        }
      })
      .catch(() => {});
  }, [apiBaseUrl]);

  const handleMiniMapClick = useCallback(
    (event: React.MouseEvent) => {
      const allNodes = getNodes();
      if (allNodes.length === 0) return;

      const nodesX = allNodes.map((n) => n.position.x);
      const nodesY = allNodes.map((n) => n.position.y);
      const minX = Math.min(...nodesX);
      const maxX = Math.max(...nodesX);
      const minY = Math.min(...nodesY);
      const maxY = Math.max(...nodesY);

      const worldWidth = maxX - minX + 400;
      const worldHeight = maxY - minY + 400;

      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();

      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      const ratioX = clickX / rect.width;
      const ratioY = clickY / rect.height;

      const targetX = minX + worldWidth * ratioX;
      const targetY = minY + worldHeight * ratioY;

      setCenter(targetX, targetY, { zoom: 1, duration: 800 });
    },
    [getNodes, setCenter]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          onChange: (field: string, value: any) => {
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
    [project, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const saveWorkflow = async () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        alert('Workflow saved successfully!');
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow');
    }
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setIsLogOpen(true);
    setExecutionLog(['🚀 Starting workflow execution...']);

    try {
      const workflow = { name: workflowName, nodes, edges };
      const response = await fetch(`${apiBaseUrl}/api/workflows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        const result = await response.json();
        setExecutionLog((prev) => [
          ...prev,
          '✅ Workflow executed successfully!',
          JSON.stringify(result, null, 2),
        ]);
      } else {
        setExecutionLog((prev) => [...prev, '❌ Workflow execution failed']);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      setExecutionLog((prev) => [...prev, `❌ Error: ${error}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTemplate = (templateName: string) => {
    const templates = {
      'ai-research': {
        nodes: [
          { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
          {
            id: 'research',
            type: 'agent',
            position: { x: 300, y: 100 },
            data: {
              label: 'Research Agent',
              agentType: 'perplexity',
              prompt: 'Research the given topic and provide comprehensive information',
            },
          },
          {
            id: 'analyze',
            type: 'agent',
            position: { x: 500, y: 100 },
            data: {
              label: 'Analysis Agent',
              agentType: 'claude',
              prompt: 'Analyze the research data and extract key insights',
            },
          },
          {
            id: 'report',
            type: 'agent',
            position: { x: 700, y: 100 },
            data: {
              label: 'Report Generator',
              agentType: 'chatgpt',
              prompt: 'Generate a comprehensive report based on the analysis',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'research' },
          { id: 'e2', source: 'research', target: 'analyze' },
          { id: 'e3', source: 'analyze', target: 'report' },
        ],
      },
      'content-creation': {
        nodes: [
          { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
          {
            id: 'ideation',
            type: 'agent',
            position: { x: 300, y: 100 },
            data: {
              label: 'Ideation Agent',
              agentType: 'gemini',
              prompt: 'Generate creative content ideas based on the brief',
            },
          },
          {
            id: 'writing',
            type: 'agent',
            position: { x: 500, y: 100 },
            data: {
              label: 'Writing Agent',
              agentType: 'chatgpt',
              prompt: 'Write engaging content based on the selected idea',
            },
          },
          {
            id: 'editing',
            type: 'agent',
            position: { x: 700, y: 100 },
            data: {
              label: 'Editor Agent',
              agentType: 'claude',
              prompt: 'Edit and refine the content for clarity and impact',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'ideation' },
          { id: 'e2', source: 'ideation', target: 'writing' },
          { id: 'e3', source: 'writing', target: 'editing' },
        ],
      },
      'data-processing': {
        nodes: [
          { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
          {
            id: 'ingest',
            type: 'mcpTool',
            position: { x: 300, y: 100 },
            data: {
              label: 'Data Ingestion',
              tool: 'file-system',
              parameters: '{"action": "read", "path": "data/"}',
            },
          },
          {
            id: 'clean',
            type: 'agent',
            position: { x: 500, y: 100 },
            data: {
              label: 'Data Cleaner',
              agentType: 'claude',
              prompt: 'Clean and normalize the data',
            },
          },
          {
            id: 'analyze',
            type: 'agent',
            position: { x: 700, y: 100 },
            data: {
              label: 'Data Analyst',
              agentType: 'gemini',
              prompt: 'Analyze the data and generate insights',
            },
          },
          {
            id: 'visualize',
            type: 'mcpTool',
            position: { x: 900, y: 100 },
            data: {
              label: 'Visualization',
              tool: 'database',
              parameters: '{"action": "create_chart"}',
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'ingest' },
          { id: 'e2', source: 'ingest', target: 'clean' },
          { id: 'e3', source: 'clean', target: 'analyze' },
          { id: 'e4', source: 'analyze', target: 'visualize' },
        ],
      },
    };

    const template = templates[templateName as keyof typeof templates];
    if (template) {
      setNodes(
        template.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onChange: (field: string, value: any) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === node.id ? { ...n, data: { ...n.data, [field]: value } } : n
                )
              );
            },
          },
        }))
      );
      setEdges(template.edges);
      setWorkflowName(
        `${templateName.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Workflow`
      );
    }
  };

  return (
    <div className="workflow-builder">
      {/* Header */}
      <div className="builder-header">
        <div className="header-left">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-name-input"
          />
          <div className="workflow-status">
            <span className="status-dot active"></span>
            <span>Ready</span>
          </div>
        </div>
        <div className="header-actions">
          <select
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              if (e.target.value) loadTemplate(e.target.value);
            }}
            className="template-selector"
          >
            <option value="">Load Template...</option>
            <optgroup label="Built-in">
              <option value="ai-research">AI Research Assistant</option>
              <option value="content-creation">Content Creation Pipeline</option>
              <option value="data-processing">Data Processing Workflow</option>
            </optgroup>
            {availableTemplates.length > 0 && (
              <optgroup label="From Server">
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button onClick={saveWorkflow} className="btn btn-secondary">
            💾 Save
          </button>
          <button onClick={executeWorkflow} className="btn btn-primary" disabled={isExecuting}>
            {isExecuting ? '⏳ Executing...' : '▶️ Execute'}
          </button>
        </div>
      </div>

      <div className="builder-content">
        {/* Sidebar */}
        <div className="builder-sidebar">
          <h3>Node Library</h3>

          <div className="node-category">
            <h4>🤖 Agents</h4>
            <div className="draggable-node" onDragStart={(e) => onDragStart(e, 'agent')} draggable>
              <div className="node-icon">🤖</div>
              <span>Agent Task</span>
            </div>
            <div className="draggable-node" onDragStart={(e) => onDragStart(e, 'a2a')} draggable>
              <div className="node-icon">🤝</div>
              <span>A2A Comm</span>
            </div>
          </div>

          <div className="node-category">
            <h4>🔧 Tools & Integration</h4>
            <div
              className="draggable-node"
              onDragStart={(e) => onDragStart(e, 'mcp-tool')}
              draggable
            >
              <div className="node-icon">🔧</div>
              <span>MCP Tool</span>
            </div>
            <div
              className="draggable-node"
              onDragStart={(e) => onDragStart(e, 'notification')}
              draggable
            >
              <div className="node-icon">🔔</div>
              <span>Notification</span>
            </div>
          </div>

          <div className="node-category">
            <h4>⚡ Logic & Flow</h4>
            <div
              className="draggable-node"
              onDragStart={(e) => onDragStart(e, 'condition')}
              draggable
            >
              <div className="node-icon">🔀</div>
              <span>Condition</span>
            </div>
            <div className="draggable-node" onDragStart={(e) => onDragStart(e, 'loop')} draggable>
              <div className="node-icon">🔁</div>
              <span>Loop</span>
            </div>
            <div
              className="draggable-node"
              onDragStart={(e) => onDragStart(e, 'transform')}
              draggable
            >
              <div className="node-icon">🧪</div>
              <span>Transform</span>
            </div>
          </div>

          <div className="node-category">
            <h4>📦 Organization</h4>
            <div
              className="draggable-node"
              onDragStart={(e) => onDragStart(e, 'subworkflow')}
              draggable
            >
              <div className="node-icon">📦</div>
              <span>Subworkflow</span>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="builder-main-area">
          <div className="builder-canvas" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#1f2937" gap={20} />
              <Controls />
              <MiniMap
                nodeColor="#374151"
                maskColor="rgba(0, 0, 0, 0.2)"
                onClick={handleMiniMapClick}
                zoomable
                pannable
              />
              <Panel position="top-right">
                <div className="canvas-info">
                  <div>Nodes: {nodes.length}</div>
                  <div>Connections: {edges.length}</div>
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {/* Collapsible Execution Log Panel */}
          <div className={`execution-log-panel ${isLogOpen ? 'open' : ''}`}>
            <div className="log-header" onClick={() => setIsLogOpen(!isLogOpen)}>
              <div className="header-title">
                <span>📋 Execution Log</span>
                {isExecuting && <span className="pulse-dot"></span>}
              </div>
              <button className="log-toggle-btn">{isLogOpen ? '▼' : '▲'}</button>
            </div>
            {isLogOpen && (
              <div className="log-content">
                {executionLog.length > 0 ? (
                  executionLog.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                  ))
                ) : (
                  <div className="log-empty">No execution data yet. Press "Execute" to start.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModernWorkflowBuilder = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
};

export default ModernWorkflowBuilder;
