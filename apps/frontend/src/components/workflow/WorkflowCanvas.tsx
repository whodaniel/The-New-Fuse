import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { validateWorkflowWithErrors } from '../../utils/workflow-schema-validator';
import { nodeTypes } from './nodes/nodeTypes';

interface WorkflowCanvasProps {
  onNodeSelect?: (node: Node | null) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onGraphChange?: (graph: { nodes: Node[]; edges: Edge[] }) => void;
}

const EMPTY_NODES: Node[] = [];
const EMPTY_EDGES: Edge[] = [];

/**
 * WorkflowCanvas component
 * Note: Must be wrapped in ReactFlowProvider in a parent component
 * to allow siblings (like NodeProperties) to access the flow state.
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  onNodeSelect,
  initialNodes,
  initialEdges,
  onGraphChange,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes ?? EMPTY_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges ?? EMPTY_EDGES);

  useEffect(() => {
    if (!initialNodes) return;
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (!initialEdges) return;
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    onGraphChange?.({ nodes, edges });
  }, [nodes, edges, onGraphChange]);

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

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const validationErrors = useMemo(() => {
    // Create a workflow object structure that matches schema expectations
    const workflowForValidation = {
      id: 'temp',
      name: 'temp',
      nodes: nodes,
      edges: edges,
    };

    const { errors } = validateWorkflowWithErrors(workflowForValidation);
    return errors;
  }, [nodes, edges]);

  // Only clone nodes when the error payload actually changes.
  const nodesWithErrors = useMemo(() => {
    return nodes.map((node) => {
      const nextError = validationErrors[node.id];
      const currentError = (node.data as Record<string, unknown> | undefined)?.error;

      if (currentError === nextError) {
        return node;
      }

      return {
        ...node,
        data: {
          ...node.data,
          error: nextError,
        },
      };
    });
  }, [nodes, validationErrors]);

  const erroredNodeCount = useMemo(
    () =>
      nodesWithErrors.filter((node) => {
        const payload = node.data as Record<string, unknown> | undefined;
        return Boolean(payload?.error);
      }).length,
    [nodesWithErrors]
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
    <div
      className="h-full w-full relative bg-slate-950"
      onDrop={onDrop}
      onDragOver={onDragOver}
      role="region"
      aria-label="Workflow canvas"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_84%_78%,rgba(245,158,11,0.14),transparent_44%)]" />
      <div className="absolute left-3 top-3 z-10 pointer-events-none flex items-center gap-2">
        <span className="rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-100">
          Workflow Canvas
        </span>
        <span className="rounded-lg border border-sky-300/25 bg-sky-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-sky-100">
          {nodes.length} Nodes
        </span>
        <span className="rounded-lg border border-amber-300/25 bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-100">
          {edges.length} Edges
        </span>
        <span className="rounded-lg border border-rose-300/25 bg-rose-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-rose-100">
          {erroredNodeCount} Issues
        </span>
      </div>
      <div className="absolute right-3 bottom-3 z-10 pointer-events-none">
        <span className="rounded-lg border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
          Drag nodes in from the left panel
        </span>
      </div>
      <ReactFlow
        nodes={nodesWithErrors}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView={nodesWithErrors.length > 0}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: '#64748b', strokeWidth: 2 },
          animated: true,
        }}
      >
        <Background color="#334155" gap={18} size={1.1} />
        <Controls
          position="top-right"
          className="bg-slate-900/90! border-white/10! rounded-xl! shadow-[0_10px_24px_rgba(2,6,23,0.5)]! [&>button]:bg-slate-800! [&>button]:border-slate-600! [&>button]:fill-slate-100! [&>button:hover]:bg-slate-700!"
        />
        <MiniMap
          className="bg-slate-900/90! border-white/10! rounded-xl!"
          nodeColor="#1e40af"
          maskColor="rgba(15, 23, 42, 0.7)"
          nodeBorderRadius={4}
        />
      </ReactFlow>
    </div>
  );
};
