import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  MarkerType,
} from 'reactflow';
import { Injectable } from '@nestjs/common';
import 'reactflow/dist/style.css';

import { Tool } from '@the-new-fuse/tools/base';
import { CustomNode } from '@the-new-fuse/components/CustomNode';
import { WorkflowData, FlowNode, FlowEdge } from '@the-new-fuse/types/flow';

@Injectable()
export class ProjectVisualizer extends Tool {
  private readonly defaultStyles = {
    edge: {
      stroke: '#888',
      strokeWidth: 2,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    },
  };

  constructor() {
    super('Flow Visualizer', 'Visualizes workflow using React Flow');
  }

  calculateNodePosition(id: string): { x: number; y: number } {
    const index = parseInt(id, 10) || 0;
    return {
      x: (index % 3) * 250 + 50,
      y: Math.floor(index / 3) * 250 + 50,
    };
  }

  prepareVisualizationData(workflowData: WorkflowData): { nodes: FlowNode[], edges: FlowEdge[] } {
    const formattedNodes: FlowNode[] = workflowData.nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position || this.calculateNodePosition(node.id),
      data: {
        label: node.label,
        type: node.type,
        parameters: node.parameters,
      },
    }));

    const formattedEdges: FlowEdge[] = workflowData.edges.map((edge) => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      style: this.defaultStyles.edge,
      markerEnd: this.defaultStyles.edge.markerEnd,
    }));

    return { nodes: formattedNodes, edges: formattedEdges };
  }
}

// Separate React component for visualization
export const WorkflowVisualizer: React.FC<{ workflowData: WorkflowData, visualizer: ProjectVisualizer }> = ({ 
  workflowData, 
  visualizer 
}) => {
  const { nodes: initialNodes, edges: initialEdges } = visualizer.prepareVisualizationData(workflowData);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, ...visualizer.defaultStyles.edge }, eds));
    },
    [setEdges, visualizer]
  );

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = visualizer.prepareVisualizationData(workflowData);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [workflowData, visualizer, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={{ custom: CustomNode }}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
