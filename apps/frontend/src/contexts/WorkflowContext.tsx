import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  NodeChange, 
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';

// Define workflow types
export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

export interface WorkflowNode extends Node {
  data: {
    label: string;
    type: string;
    status?: NodeStatus;
    [key: string]: any;
  };
}

export interface WorkflowEdge extends Edge {
  data?: {
    label?: string;
    type?: string;
    animated?: boolean;
    [key: string]: any;
  };
}

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

export const WorkflowProvider: React.React.FC<WorkflowProviderProps> = ({
  children,
  initialNodes = [],
  initialEdges = [],
  readOnly = false
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
              data: { ...node.data, ...data }
            };
          }
          return node;
        })
      );
      
      // Update selected node if it's the one being updated
      if (selectedNode && selectedNode.id === id) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...data } } : null
        );
      }
    },
    [setNodes, selectedNode]
  );
  
  const removeNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== id && edge.target !== id)
      );
      
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
      
      // Simulate node execution
      setTimeout(() => {
        // Randomly succeed or fail for demo purposes
        const success = Math.random() > 0.2;
        updateNode(id, { status: success ? 'completed' : 'error' });
      }, 2000);
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
              data: { ...edge.data, ...data }
            };
          }
          return edge;
        })
      );
      
      // Update selected edge if it's the one being updated
      if (selectedEdge && selectedEdge.id === id) {
        setSelectedEdge((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...data } } : null
        );
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
  const selectNode = useCallback(
    (node: WorkflowNode | null) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );
  
  const selectEdge = useCallback(
    (edge: WorkflowEdge | null) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );
  
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
    // In a real app, this would save the workflow to the server
    const workflow = {
      nodes,
      edges
    };
    
    console.log('Saving workflow:', workflow);
    
    // Simulate API call
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('workflow-123');
      }, 1000);
    });
  }, [nodes, edges]);
  
  const loadWorkflow = useCallback(
    async (id: string) => {
      // In a real app, this would load the workflow from the server
      console.log('Loading workflow:', id);
      
      // Simulate API call
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Mock workflow data
          const mockNodes: WorkflowNode[] = [
            {
              id: 'node-1',
              type: 'input',
              position: { x: 100, y: 100 },
              data: { label: 'Start', type: 'input' }
            },
            {
              id: 'node-2',
              type: 'agent',
              position: { x: 300, y: 100 },
              data: { label: 'Process', type: 'agent' }
            },
            {
              id: 'node-3',
              type: 'output',
              position: { x: 500, y: 100 },
              data: { label: 'End', type: 'output' }
            }
          ];
          
          const mockEdges: WorkflowEdge[] = [
            {
              id: 'edge-1-2',
              source: 'node-1',
              target: 'node-2',
              data: { label: '' }
            },
            {
              id: 'edge-2-3',
              source: 'node-2',
              target: 'node-3',
              data: { label: '' }
            }
          ];
          
          setNodes(mockNodes);
          setEdges(mockEdges);
          resolve();
        }, 1000);
      });
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
      loadWorkflow
    }
  };
  
  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
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
