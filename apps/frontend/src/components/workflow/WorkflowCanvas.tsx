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
import { NodeToolbar } from '../WorkflowBuilder/NodeToolbar';
import { WorkflowToolbar } from './WorkflowToolbar';
import { useWorkflow } from '../../hooks/useWorkflow';
import { workflowValidationService } from '../../services/WorkflowValidationService';
import { nodeTypes } from './nodes/nodeTypes';
import { edgeTypes } from './edges';

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
    (connection: Connection) => {
      // Validate connection before adding
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (sourceNode && targetNode) {
        const validationErrors = workflowValidationService.validateEdgeConnection(sourceNode, targetNode);
        const hasErrors = validationErrors.some(e => e.severity === 'error');
        
        if (hasErrors) {
          toast({
            title: 'Invalid Connection',
            description: validationErrors[0].message,
            status: 'error',
            duration: 3000
          });
          return;
        }
      }
      
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, nodes, toast]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  // Handle dropping nodes from the node library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');

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
            label: nodeTemplate.label,
            configuration: nodeTemplate.config || {},
            ...nodeTemplate
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

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      // Validate workflow before saving
      const workflow = {
        id: 'temp',
        name: workflowName,
        nodes,
        edges,
        status: 'draft' as const,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user'
      };
      
      const validation = await workflowValidationService.validateWorkflow(workflow);
      
      if (!validation.valid) {
        toast({
          title: 'Validation Failed',
          description: `${validation.errors.length} errors found. Please fix them before saving.`,
          status: 'error',
          duration: 5000
        });
        return;
      }
      
      await saveWorkflow(workflow);
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
      // Validate workflow before execution
      const workflow = {
        id: 'temp',
        name: workflowName,
        nodes,
        edges,
        status: 'draft' as const,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user'
      };
      
      const validation = await workflowValidationService.validateWorkflow(workflow);
      
      if (!validation.valid) {
        toast({
          title: 'Validation Failed',
          description: `Cannot execute workflow with ${validation.errors.length} errors.`,
          status: 'error',
          duration: 5000
        });
        return;
      }
      
      // Execute workflow if it has an ID (saved workflow)
      if (workflow.id && workflow.id !== 'temp') {
        const execution = await executeWorkflow(workflow.id);
        toast({
          title: 'Workflow execution started',
          description: `Execution ID: ${execution.id}`,
          status: 'success',
          duration: 3000
        });
      } else {
        toast({
          title: 'Save Required',
          description: 'Please save the workflow before executing it.',
          status: 'warning',
          duration: 3000
        });
      }
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
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ height: '100%', width: '100%' }}
      >
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
    </Box>
  );
};
