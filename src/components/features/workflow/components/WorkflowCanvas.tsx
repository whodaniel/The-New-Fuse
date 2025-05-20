import React, { FC, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  NodeTypes,
  OnConnectStartParams,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AIProcessingNode } from '../nodes/AIProcessingNode.js';
import { ApiNode } from '../nodes/ApiNode.js';
import { DataTransformNode } from '../nodes/DataTransformNode.js';
import { MCPNode } from '../nodes/MCPNode.js';
import { MCPWorkflowNode } from '../nodes/MCPWorkflowNode.js';
import { AINewsAgentNode } from '../../../nodes/AINewsAgentNode.js';
import { AIVerificationAgent } from '../../../nodes/AIVerificationAgent.js';
import { AISummarizationAgent } from '../../../nodes/AISummarizationAgent.js';
import { AICollectiveOrchestratorNode } from '../../../nodes/AICollectiveOrchestratorNode.js';
import { AgentRegistryNode } from '../../../nodes/AgentRegistryNode.js';
import { NODE_COLORS } from '../constants/nodeTypes.js';
import { v4 as uuidv4 } from 'uuid';
import { NodeType } from '../types.js';

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  readOnly?: boolean;
  debugMode?: boolean;
  nodeExecutionStates?: Record<string, string>;
}

// Define custom node types
const nodeTypes: NodeTypes = {
  aiProcessingNode: AIProcessingNode,
  apiNode: ApiNode,
  dataTransformNode: DataTransformNode,
  mcpNode: MCPNode,
  mcpWorkflowNode: MCPWorkflowNode,
  aiNewsAgent: AINewsAgentNode,
  aiVerificationAgent: AIVerificationAgent,
  aiSummarizationAgent: AISummarizationAgent,
  aiCollectiveOrchestrator: AICollectiveOrchestratorNode,
  agentRegistry: AgentRegistryNode
};

const WorkflowCanvas: FC<WorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  readOnly = false,
  debugMode = false,
  nodeExecutionStates = {},
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { project } = useReactFlow();

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChangeInternal(changes);
      if (onNodesChange) {
        onNodesChange(nodes);
      }
    },
    [nodes, onNodesChange, onNodesChangeInternal]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes);
      if (onEdgesChange) {
        onEdgesChange(edges);
      }
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  );

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      if (onEdgesChange) {
        onEdgesChange(edges);
      }
    },
    [setEdges, edges, onEdgesChange]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_, node) => {
      if (onNodeSelect) {
        onNodeSelect(node);
      }
    },
    [onNodeSelect]
  );

  // Handle drag over for node creation
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop for node creation
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      
      // Check if the dropped element is a valid node type
      if (!nodeType) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create a new node
      const newNode = {
        id: `node-${uuidv4()}`,
        type: nodeType,
        position,
        data: { 
          label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1, -4)} Node`,
          config: {}
        },
      };

      setNodes((nds) => nds.concat(newNode));
      if (onNodesChange) {
        onNodesChange([...nodes, newNode]);
      }
    },
    [reactFlowInstance, nodes, setNodes, onNodesChange]
  );

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          nodeColor={(node) => {
            const category = node.data?.category || 'default';
            return NODE_COLORS[category] || '#ccc';
          }}
        />
        <Background color="#f8f8f8" gap={16} size={1} />
        {debugMode && (
          <Panel position="top-right">
            <div className="bg-white p-2 rounded shadow-md">
              <h3 className="text-sm font-semibold">Debug Mode</h3>
              <div className="text-xs">
                <p>Nodes: {nodes.length}</p>
                <p>Edges: {edges.length}</p>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider to ensure context is available
export const WorkflowCanvasProvider: FC<WorkflowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowCanvas {...props} />
  </ReactFlowProvider>
);