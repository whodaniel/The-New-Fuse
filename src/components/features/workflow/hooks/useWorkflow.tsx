import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, useNodesState, useEdgesState, addEdge } from 'reactflow';
import { workflowExecutionService } from '../services/workflowExecutionService.js';
import { ExecutionState, ExecutionLog } from '../types.js';

export function useWorkflow(initialNodes: Node[] = [], initialEdges: Edge[] = []): any {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeExecutionStates, setNodeExecutionStates] = useState<Record<string, ExecutionState>>({});
  const [flowExecutionLogs, setFlowExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const onConnect = useCallback(
    (params: unknown) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeUpdate = useCallback((nodeId: string, newData: unknown) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  useEffect(() => {
    const subscription = workflowExecutionService.subscribe((update) => {
      setNodeExecutionStates((states) => ({
        ...states,
        [update.nodeId]: update.state
      }));

      setFlowExecutionLogs((logs) => [
        ...logs,
        {
          nodeId: update.nodeId,
          timestamp: Date.now(),
          message: update.message,
          data: update.result
        }
      ]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const executeWorkflow = async (): Promise<void> {) => {
    setIsExecuting(true);
    try {
      for (const node of nodes) {
        await workflowExecutionService.executeNode(node.id, {
          ...node.data,
          inputs: getNodeInputs(node.id, edges, nodes)
        });
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    nodes,
    edges,
    selectedNode,
    nodeExecutionStates,
    flowExecutionLogs,
    isExecuting,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    handleNodeUpdate,
    executeWorkflow
  };
}

function getNodeInputs(nodeId: string, edges: Edge[], nodes: Node[]): any {
  const inputEdges = edges.filter((edge) => edge.target === nodeId);
  return inputEdges.reduce((inputs, edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    if (sourceNode) {
      inputs[edge.targetHandle || 'default'] = sourceNode.data.output;
    }
    return inputs;
  }, {} as Record<string, any>);
}