import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Node Components
const AgentNode = ({ data }: { data: any }) => (
  <div className="agent-node">
    <div className="node-header">
      <div className="node-icon">🤖</div>
      <div className="node-title">{data.label}</div>
    </div>
    <div className="node-content">
      <div className="node-field">
        <label>Agent Type:</label>
        <select value={data.agentType || 'claude'} onChange={(e) => data.onChange?.('agentType', e.target.value)}>
          <option value="claude">Claude AI</option>
          <option value="gemini">Gemini</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="perplexity">Perplexity</option>
        </select>
      </div>
      <div className="node-field">
        <label>Prompt:</label>
        <textarea 
          value={data.prompt || ''} 
          onChange={(e) => data.onChange?.('prompt', e.target.value)}
          placeholder="Enter your prompt here..."
        />
      </div>
    </div>
  </div>
);

const MCPToolNode = ({ data }: { data: any }) => (
  <div className="mcp-node">
    <div className="node-header">
      <div className="node-icon">🔧</div>
      <div className="node-title">{data.label}</div>
    </div>
    <div className="node-content">
      <div className="node-field">
        <label>Tool:</label>
        <select value={data.tool || ''} onChange={(e) => data.onChange?.('tool', e.target.value)}>
          <option value="">Select a tool...</option>
          <option value="screenshot">Take Screenshot</option>
          <option value="browser">Browser Automation</option>
          <option value="file-system">File System</option>
          <option value="database">Database Query</option>
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

const FlowControlNode = ({ data }: { data: any }) => (
  <div className="flow-node">
    <div className="node-header">
      <div className="node-icon">⚡</div>
      <div className="node-title">{data.label}</div>
    </div>
    <div className="node-content">
      <div className="node-field">
        <label>Type:</label>
        <select value={data.type || 'condition'} onChange={(e) => data.onChange?.('type', e.target.value)}>
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
  mcpTool: MCPToolNode,
  flowControl: FlowControlNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: '🚀 Start' },
    style: { background: '#10b981', color: 'white', border: 'none' },
  },
];

const initialEdges: Edge[] = [];

const WorkflowBuilderContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

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
          onChange: (field: string, value: string) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === newNode.id
                  ? { ...node, data: { ...node.data, [field]: value } }
                  : node
              )
            );
          }
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
      const response = await fetch('http://localhost:3000/api/workflows', {
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
    setExecutionLog(['🚀 Starting workflow execution...']);

    try {
      const workflow = { name: workflowName, nodes, edges };
      const response = await fetch('http://localhost:3000/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        const result = await response.json();
        setExecutionLog(prev => [...prev, '✅ Workflow executed successfully!', JSON.stringify(result, null, 2)]);
      } else {
        setExecutionLog(prev => [...prev, '❌ Workflow execution failed']);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      setExecutionLog(prev => [...prev, `❌ Error: ${error}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTemplate = (templateName: string) => {
    const templates = {
      'ai-research': {
        nodes: [
          { id: 'start', type: 'input', position: { x: 100, y: 100 }, data: { label: '🚀 Start' } },
          { id: 'research', type: 'agent', position: { x: 300, y: 100 }, data: { label: 'Research Agent', agentType: 'perplexity', prompt: 'Research the given topic and provide comprehensive information' } },
          { id: 'analyze', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Analysis Agent', agentType: 'claude', prompt: 'Analyze the research data and extract key insights' } },
          { id: 'report', type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Report Generator', agentType: 'chatgpt', prompt: 'Generate a comprehensive report based on the analysis' } },
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
          { id: 'ideation', type: 'agent', position: { x: 300, y: 100 }, data: { label: 'Ideation Agent', agentType: 'gemini', prompt: 'Generate creative content ideas based on the brief' } },
          { id: 'writing', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Writing Agent', agentType: 'chatgpt', prompt: 'Write engaging content based on the selected idea' } },
          { id: 'editing', type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Editor Agent', agentType: 'claude', prompt: 'Edit and refine the content for clarity and impact' } },
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
          { id: 'ingest', type: 'mcpTool', position: { x: 300, y: 100 }, data: { label: 'Data Ingestion', tool: 'file-system', parameters: '{"action": "read", "path": "data/"}' } },
          { id: 'clean', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Data Cleaner', agentType: 'claude', prompt: 'Clean and normalize the data' } },
          { id: 'analyze', type: 'agent', position: { x: 700, y: 100 }, data: { label: 'Data Analyst', agentType: 'gemini', prompt: 'Analyze the data and generate insights' } },
          { id: 'visualize', type: 'mcpTool', position: { x: 900, y: 100 }, data: { label: 'Visualization', tool: 'database', parameters: '{"action": "create_chart"}' } },
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
      setNodes(template.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: (field: string, value: string) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...n.data, [field]: value } }
                  : n
              )
            );
          }
        }
      })));
      setEdges(template.edges);
      setWorkflowName(`${templateName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Workflow`);
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
            <option value="ai-research">AI Research Assistant</option>
            <option value="content-creation">Content Creation Pipeline</option>
            <option value="data-processing">Data Processing Workflow</option>
          </select>
          <button onClick={saveWorkflow} className="btn btn-secondary">
            💾 Save
          </button>
          <button 
            onClick={executeWorkflow} 
            className="btn btn-primary"
            disabled={isExecuting}
          >
            {isExecuting ? '⏳ Executing...' : '▶️ Execute'}
          </button>
        </div>
      </div>

      <div className="builder-content">
        {/* Sidebar */}
        <div className="builder-sidebar">
          <h3>Node Library</h3>
          
          <div className="node-category">
            <h4>🤖 AI Agents</h4>
            <div
              className="draggable-node agent-node-preview"
              onDragStart={(event) => onDragStart(event, 'agent')}
              draggable
            >
              <div className="node-icon">🤖</div>
              <span>AI Agent</span>
            </div>
          </div>

          <div className="node-category">
            <h4>🔧 MCP Tools</h4>
            <div
              className="draggable-node mcp-node-preview"
              onDragStart={(event) => onDragStart(event, 'mcpTool')}
              draggable
            >
              <div className="node-icon">🔧</div>
              <span>MCP Tool</span>
            </div>
          </div>

          <div className="node-category">
            <h4>⚡ Flow Control</h4>
            <div
              className="draggable-node flow-node-preview"
              onDragStart={(event) => onDragStart(event, 'flowControl')}
              draggable
            >
              <div className="node-icon">⚡</div>
              <span>Flow Control</span>
            </div>
          </div>

          {/* Execution Log */}
          {executionLog.length > 0 && (
            <div className="execution-log">
              <h4>📋 Execution Log</h4>
              <div className="log-content">
                {executionLog.map((log, index) => (
                  <div key={index} className="log-entry">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
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
            />
            <Panel position="top-right">
              <div className="canvas-info">
                <div>Nodes: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      <style jsx>{`
        .workflow-builder {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0f172a;
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .workflow-name-input {
          background: transparent;
          border: none;
          color: white;
          font-size: 20px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid transparent;
        }

        .workflow-name-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        .workflow-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #94a3b8;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .template-selector {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(45deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .builder-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .builder-sidebar {
          width: 300px;
          background: rgba(255, 255, 255, 0.05);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          overflow-y: auto;
        }

        .builder-sidebar h3 {
          margin: 0 0 20px 0;
          color: #3b82f6;
          font-size: 18px;
        }

        .node-category {
          margin-bottom: 24px;
        }

        .node-category h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #94a3b8;
        }

        .draggable-node {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: grab;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .draggable-node:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }

        .draggable-node:active {
          cursor: grabbing;
        }

        .node-icon {
          font-size: 18px;
        }

        .builder-canvas {
          flex: 1;
          position: relative;
        }

        .canvas-info {
          background: rgba(0, 0, 0, 0.8);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .execution-log {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .execution-log h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #94a3b8;
        }

        .log-content {
          max-height: 200px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          padding: 12px;
        }

        .log-entry {
          font-size: 12px;
          font-family: 'Monaco', monospace;
          margin-bottom: 4px;
          color: #e2e8f0;
        }

        /* Node Styles */
        .agent-node, .mcp-node, .flow-node {
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 16px;
          min-width: 250px;
          color: #1f2937;
        }

        .node-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .node-title {
          font-weight: 600;
          font-size: 16px;
        }

        .node-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .node-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .node-field label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .node-field select,
        .node-field textarea {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .node-field textarea {
          min-height: 60px;
          resize: vertical;
        }

        .mcp-node {
          border-color: #10b981;
        }

        .flow-node {
          border-color: #f59e0b;
        }
      `}</style>
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