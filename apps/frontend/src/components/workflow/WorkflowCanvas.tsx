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
import { workflowValidationService } from '../../services/WorkflowValidationService';
import { NodeToolbar } from '../WorkflowBuilder/NodeToolbar';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes/nodeTypes';
import { WorkflowToolbar } from './WorkflowToolbar';

export const WorkflowCanvas: React.FC = () => {
  const { saveWorkflow, executeWorkflow } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      // Validate connection before adding
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (sourceNode && targetNode) {
        const validationErrors = workflowValidationService.validateEdgeConnection(
          sourceNode,
          targetNode
        );
        const hasErrors = validationErrors.some((e) => e.severity === 'error');

        if (hasErrors) {
          showNotification(validationErrors[0].message, 'error');
          return;
        }
      }

      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, nodes]
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
            ...nodeTemplate,
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
        createdBy: 'current-user',
      };

      const validation = await workflowValidationService.validateWorkflow(workflow);

      if (!validation.valid) {
        showNotification(
          `${validation.errors.length} errors found. Please fix them before saving.`,
          'error'
        );
        return;
      }

      await saveWorkflow(workflow);
      showNotification('Workflow saved', 'success');
    } catch (err) {
      showNotification((err as Error).message, 'error');
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
        createdBy: 'current-user',
      };

      const validation = await workflowValidationService.validateWorkflow(workflow);

      if (!validation.valid) {
        showNotification(
          `Cannot execute workflow with ${validation.errors.length} errors.`,
          'error'
        );
        return;
      }

      // Execute workflow if it has an ID (saved workflow)
      if (workflow.id && workflow.id !== 'temp') {
        const execution = await executeWorkflow(workflow.id);
        showNotification(`Workflow execution started. Execution ID: ${execution.id}`, 'success');
      } else {
        showNotification('Please save the workflow before executing it.', 'info');
      }
    } catch (err) {
      showNotification((err as Error).message, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-full w-full border border-white/10 rounded-md relative bg-slate-950">
      {notification && (
        <div
          className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${
            notification.type === 'error'
              ? 'bg-red-500'
              : notification.type === 'success'
                ? 'bg-green-500'
                : 'bg-blue-500'
          }`}
        >
          {notification.message}
        </div>
      )}
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
      <div onDrop={onDrop} onDragOver={onDragOver} style={{ height: '100%', width: '100%' }}>
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
    </div>
  );
};
