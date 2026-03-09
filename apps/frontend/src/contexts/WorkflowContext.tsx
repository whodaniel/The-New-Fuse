import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import {
  addEdge,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import { WorkflowApiService } from '../api/workflow';

// Define workflow types
export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

export type WorkflowNode = Node & {
  data: {
    label: string;
    type: string;
    status?: NodeStatus;
    [key: string]: any;
  };
};

export type WorkflowEdge = Edge & {
  data?: {
    label?: string;
    type?: string;
    animated?: boolean;
    [key: string]: any;
  };
};

// Define context types
interface WorkflowContextType {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  isReadOnly: boolean;
  selectedNode: WorkflowNode | null;
  selectedEdge: WorkflowEdge | null;
  actions: {
    addNode: (node: WorkflowNode) => void;
    updateNode: (id: string, data: any) => void;
    removeNode: (id: string) => void;
    executeNode: (id: string) => void;
    addEdge: (edge: WorkflowEdge) => void;
    updateEdge: (id: string, data: any) => void;
    removeEdge: (id: string) => void;
    selectNode: (node: WorkflowNode | null) => void;
    selectEdge: (edge: WorkflowEdge | null) => void;
    setReadOnly: (readOnly: boolean) => void;
    clearSelection: () => void;
    executeWorkflow: () => void;
    saveWorkflow: () => Promise<string>;
    loadWorkflow: (id: string) => Promise<void>;
  };
}

// Create context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider component
interface WorkflowProviderProps {
  children: ReactNode;
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  readOnly?: boolean;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  children,
  initialNodes = [],
  initialEdges = [],
  readOnly = false,
}) => {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode['data']>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge['data']>(initialEdges);

  // State for selection and read-only mode
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<WorkflowEdge | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(readOnly);

  // Handle connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, data: { label: '', type: 'default' } }, eds));
    },
    [setEdges]
  );

  // Node actions
  const addNode = useCallback(
    (node: WorkflowNode) => {
      setNodes((nds) => [...nds, node]);
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (id: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, ...data },
            };
          }
          return node;
        })
      );

      // Update selected node if it's the one being updated
      if (selectedNode && selectedNode.id === id) {
        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...data } } : null));
      }
    },
    [setNodes, selectedNode]
  );

  const removeNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));

      // Clear selection if the removed node was selected
      if (selectedNode && selectedNode.id === id) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const executeNode = useCallback(
    (id: string) => {
      // Set node status to running
      updateNode(id, { status: 'running' });

      // Execute node through workflow service
      try {
        // In a real implementation, this would call the actual node execution API
        // For now, we'll use a simplified approach that marks nodes as completed
        setTimeout(() => {
          updateNode(id, { status: 'completed' });
        }, 1000);
      } catch (error) {
        console.error('Failed to execute node:', error);
        updateNode(id, { status: 'error' });
      }
    },
    [updateNode]
  );

  // Edge actions
  const addEdgeAction = useCallback(
    (edge: WorkflowEdge) => {
      setEdges((eds) => [...eds, edge]);
    },
    [setEdges]
  );

  const updateEdge = useCallback(
    (id: string, data: any) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: { ...edge.data, ...data },
            };
          }
          return edge;
        })
      );

      // Update selected edge if it's the one being updated
      if (selectedEdge && selectedEdge.id === id) {
        setSelectedEdge((prev) => (prev ? { ...prev, data: { ...prev.data, ...data } } : null));
      }
    },
    [setEdges, selectedEdge]
  );

  const removeEdge = useCallback(
    (id: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== id));

      // Clear selection if the removed edge was selected
      if (selectedEdge && selectedEdge.id === id) {
        setSelectedEdge(null);
      }
    },
    [setEdges, selectedEdge]
  );

  // Selection actions
  const selectNode = useCallback((node: WorkflowNode | null) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const selectEdge = useCallback((edge: WorkflowEdge | null) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Workflow actions
  const executeWorkflow = useCallback(() => {
    // Find start nodes (nodes with no incoming edges)
    const startNodes = nodes.filter((node) => {
      return !edges.some((edge) => edge.target === node.id);
    });

    // Execute each start node
    startNodes.forEach((node) => {
      executeNode(node.id);
    });
  }, [nodes, edges, executeNode]);

  const saveWorkflow = useCallback(async () => {
    try {
      // Use actual API service to save workflow
      const workflowService = new WorkflowApiService();
      const workflowData = {
        name: 'Untitled Workflow',
        description: 'Workflow created from context',
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge.data,
        })),
      };

      const response = await workflowService.saveWorkflow(workflowData);
      const responseError =
        typeof response.error === 'string' ? response.error : response.error?.message;

      if (response.success && response.data) {
        return response.data.id;
      } else {
        throw new Error(responseError || 'Failed to save workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      throw error;
    }
  }, [nodes, edges]);

  const loadWorkflow = useCallback(
    async (id: string) => {
      try {
        // Use actual API service to load workflow from server
        const workflowService = new WorkflowApiService();
        const response = await workflowService.getWorkflow(id);
        const responseError =
          typeof response.error === 'string' ? response.error : response.error?.message;

        if (response.success && response.data) {
          const workflow = response.data;

          // Map the workflow data to our node/edge format
          const loadedNodes: WorkflowNode[] = workflow.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            position: node.position || { x: 100, y: 100 },
            data: {
              label: node.data?.label || node.label || 'Untitled',
              type: node.data?.type || node.type,
              ...node.data,
            },
          }));

          const loadedEdges: WorkflowEdge[] = workflow.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            data: edge.data || { label: '' },
          }));

          setNodes(loadedNodes);
          setEdges(loadedEdges);
        } else {
          throw new Error(responseError || 'Failed to load workflow');
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
        throw error;
      }
    },
    [setNodes, setEdges]
  );

  // Create context value
  const contextValue: WorkflowContextType = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isReadOnly,
    selectedNode,
    selectedEdge,
    actions: {
      addNode,
      updateNode,
      removeNode,
      executeNode,
      addEdge: addEdgeAction,
      updateEdge,
      removeEdge,
      selectNode,
      selectEdge,
      setReadOnly: setIsReadOnly,
      clearSelection,
      executeWorkflow,
      saveWorkflow,
      loadWorkflow,
    },
  };

  return <WorkflowContext.Provider value={contextValue}>{children}</WorkflowContext.Provider>;
};

// Custom hook to use the workflow context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export default useWorkflow;
