// @ts-nocheck
import React, { useCallback, useState } from 'react';
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
import { useWorkflow } from '../../hooks/useWorkflow';
import { showNotification } from '../../utils/notifications';
import { edgeTypes } from '../workflow/edges';
import { WorkflowToolbar } from '../workflow/WorkflowToolbar';
import { nodeTypes } from './nodes';
import { NodeToolbar } from './NodeToolbar';

export const WorkflowCanvas: React.FC = () => {
  const { saveWorkflow, executeWorkflow } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      await saveWorkflow({
        name: workflowName,
        nodes,
        edges,
        version: 1,
      });
      showNotification({ message: 'Workflow saved successfully!', type: 'success' });
    } catch (err) {
      showNotification({ message: 'Failed to save workflow', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    try {
      const result = await executeWorkflow({
        nodes,
        edges,
      });
      showNotification({
        message: `Completed ${result.nodeCount} nodes in ${result.executionTime}ms`,
        type: 'success',
        title: 'Workflow executed',
      });
    } catch (err) {
      showNotification({
        message: (err as Error).message,
        type: 'error',
        title: 'Error executing workflow',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-[80vh] border border-gray-200 rounded-md">
      <WorkflowToolbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        onSave={handleSaveWorkflow}
        onExecute={handleExecuteWorkflow}
        isSaving={isSaving}
        isExecuting={isExecuting}
      />
      <NodeToolbar
        onAddNode={(nodeType, position) => {
          const newNode = {
            id: `node-${Date.now()}`,
            type: nodeType,
            position,
            data: { label: nodeType },
          };
          setNodes((nodes) => [...nodes, newNode]);
        }}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
