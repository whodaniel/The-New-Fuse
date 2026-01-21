import { useCallback, useMemo } from 'react';
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
import { validateWorkflowWithErrors } from '../../utils/workflow-schema-validator';

interface WorkflowCanvasProps {
  onNodeSelect?: (node: Node | null) => void;
}

/**
 * WorkflowCanvas component
 * Note: Must be wrapped in ReactFlowProvider in a parent component
 * to allow siblings (like NodeProperties) to access the flow state.
 */
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

  // Validate and inject errors
  const nodesWithErrors = useMemo(() => {
    // Create a workflow object structure that matches schema expectations
    const workflowForValidation = {
      id: 'temp',
      name: 'temp',
      nodes: nodes,
      edges: edges
    };

    const { errors } = validateWorkflowWithErrors(workflowForValidation);

    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        error: errors[node.id]
      }
    }));
  }, [nodes, edges]);

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
        nodes={nodesWithErrors}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: '#64748b', strokeWidth: 2 },
          animated: true,
        }}
      >
        <Background color="#334155" gap={16} size={1} />
        <Controls className="bg-slate-800! border-slate-600! shadow-lg! [&>button]:bg-slate-700! [&>button]:border-slate-600! [&>button]:fill-white! [&>button:hover]:bg-slate-600!" />
        <MiniMap
          className="bg-slate-800! border-slate-600!"
          nodeColor="#1e40af"
          maskColor="rgba(15, 23, 42, 0.7)"
          nodeBorderRadius={4}
        />
      </ReactFlow>
    </div>
  );
};
