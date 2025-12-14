import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Connection,
  Controls,
  MiniMap,
  Node,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './nodes/nodeTypes';

interface WorkflowCanvasProps {
  onNodeSelect?: (node: Node | null) => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ onNodeSelect }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeSelect) {
        onNodeSelect(node);
      }
    },
    [onNodeSelect]
  );

  // Handle dropping nodes from the node library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow/data');

      if (!nodeData) return;

      try {
        const nodeTemplate = JSON.parse(nodeData);
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        const newNode = {
          id: `${nodeTemplate.type}-${Date.now()}`,
          type: nodeTemplate.type,
          position,
          data: {
            name: nodeTemplate.label || 'Untitled Node',
            type: nodeTemplate.type,
            config: nodeTemplate.config || {},
            status: nodeTemplate.status || 'idle',
          },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error('Error parsing dropped node data:', error);
      }
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="h-full w-full relative bg-slate-950" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
