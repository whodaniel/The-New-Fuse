import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
} from 'reactflow';
import { useWorkflow } from '../context/WorkflowContext.js';
import { validateWorkflowWithErrors } from '../validation/workflow-schema-validator.js';
import { nodeTypes } from '../nodes/nodeTypes.js';

interface WorkflowCanvasProps {
  onNodeSelect?: (node: Node | null) => void;
  onGraphChange?: (graph: { nodes: Node[]; edges: unknown[] }) => void;
}

/**
 * WorkflowCanvas — binds to WorkflowProvider graph state (same on SaaS + Tauri).
 *
 * Must be wrapped in ReactFlowProvider + WorkflowProvider.
 * Stylesheet is the host's responsibility: import 'reactflow/dist/style.css'.
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  onNodeSelect,
  onGraphChange,
}) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect: contextConnect,
    actions,
  } = useWorkflow();

  useEffect(() => {
    onGraphChange?.({ nodes: nodes as Node[], edges });
  }, [nodes, edges, onGraphChange]);

  const onConnect = useCallback(
    (connection: Parameters<typeof contextConnect>[0]) => {
      contextConnect(connection);
    },
    [contextConnect]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
      actions.selectNode(node as never);
    },
    [onNodeSelect, actions]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
    actions.clearSelection();
  }, [onNodeSelect, actions]);

  const validationErrors = useMemo(() => {
    const { errors } = validateWorkflowWithErrors({
      id: 'temp',
      name: 'temp',
      nodes,
      edges,
    });
    return errors;
  }, [nodes, edges]);

  const nodesWithErrors = useMemo(() => {
    return nodes.map((node) => {
      const nextError = validationErrors[node.id];
      const currentError = (node.data as Record<string, unknown> | undefined)?.error;
      if (currentError === nextError) return node;
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
      nodesWithErrors.filter((node) =>
        Boolean((node.data as Record<string, unknown> | undefined)?.error)
      ).length,
    [nodesWithErrors]
  );

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
        const type = String(nodeTemplate.type || 'agent');
        actions.addNode({
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: {
            label: nodeTemplate.label || 'Untitled Node',
            type,
            config: nodeTemplate.config || {},
            status: nodeTemplate.status || 'idle',
          },
        });
      } catch (error) {
        console.error('Error parsing dropped node data:', error);
      }
    },
    [actions]
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
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="top-right"
          className="!bg-slate-900/90 !border !border-white/10 !rounded-xl !shadow-[0_10px_24px_rgba(2,6,23,0.5)] [&>button]:!bg-slate-800 [&>button]:!border-slate-600 [&>button:hover]:!bg-slate-700"
        />
        {nodes.length > 0 && (
          <MiniMap
            position="bottom-right"
            className="!bg-slate-900/95 !border !border-white/10 !rounded-xl !overflow-hidden"
            nodeColor="#3b82f6"
            maskColor="rgba(15, 23, 42, 0.8)"
            nodeBorderRadius={4}
            pannable={true}
            zoomable={true}
          />
        )}
      </ReactFlow>
    </div>
  );
};
