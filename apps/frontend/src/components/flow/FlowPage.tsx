// @ts-nocheck
import { Button } from '@/components/core';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowRouter } from '../../hooks/useFlowRouter';

export const FlowPage = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
}: any) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const { registerNode, updateNode, removeNode, navigateToNode } = useFlowRouter();

  useEffect(() => {
    nodes.forEach((node: any) => {
      registerNode(node);
    });
  }, []);

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      changes.forEach((change: any) => {
        if (change.type === 'position' || change.type === 'dimensions') {
          const node = nodes.find((n: any) => n.id === change.id);
          if (node) {
            updateNode(node);
          }
        } else if (change.type === 'remove') {
          removeNode(change.id);
        }
      });
      if (onNodesChange) {
        onNodesChange(nodes);
      }
    },
    [nodes, onNodesChange, onNodesChangeInternal, updateNode, removeNode]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      if (onEdgesChange) {
        onEdgesChange(edges);
      }
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  );

  const handleConnect = useCallback(
    (connection: any) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_: any, node: any) => {
      navigateToNode(node.id);
    },
    [navigateToNode]
  );

  return (
    <div className="w-full h-screen bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        fitView
        className="bg-background"
      >
        <Panel position="top-right" className="space-x-2">
          <Button size="sm" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </Panel>
        <Controls className="bg-card border rounded-md shadow-none" />
        <MiniMap className="bg-card border rounded-md shadow-none" />
        <Background className="bg-muted" />
      </ReactFlow>
    </div>
  );
};
