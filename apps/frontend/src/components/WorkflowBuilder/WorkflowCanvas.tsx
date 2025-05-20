import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, useToast } from '@chakra-ui/react';
import { NodeToolbar } from './NodeToolbar.js';
import { WorkflowToolbar } from './WorkflowToolbar.js';
import { useWorkflow } from '../../hooks/useWorkflow.js';
import { nodeTypes } from './nodes.js';
import { edgeTypes } from './edges.js';

export const WorkflowCanvas: React.FC = () => {
  const toast = useToast();
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
        version: 1
      });
      toast({
        title: 'Workflow saved',
        status: 'success',
        duration: 3000
      });
    } catch (err) {
      toast({
        title: 'Error saving workflow',
        description: (err as Error).message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    try {
      const result = await executeWorkflow({
        nodes,
        edges
      });
      toast({
        title: 'Workflow executed',
        description: `Completed ${result.nodeCount} nodes in ${result.executionTime}ms`,
        status: 'success',
        duration: 3000
      });
    } catch (err) {
      toast({
        title: 'Error executing workflow',
        description: (err as Error).message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Box height="80vh" border="1px" borderColor="gray.200" borderRadius="md">
      <WorkflowToolbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        onSave={handleSaveWorkflow}
        onExecute={handleExecuteWorkflow}
        isSaving={isSaving}
        isExecuting={isExecuting}
      />
      <NodeToolbar onAddNode={(nodeType, position) => {
        const newNode = {
          id: `node-${Date.now()}`,
          type: nodeType,
          position,
          data: { label: nodeType }
        };
        setNodes(nodes => [...nodes, newNode]);
      }} />
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
    </Box>
  );
};
