import React, { ReactNode } from 'react';
import { Connection, Edge, EdgeChange, Node, NodeChange } from 'reactflow';
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
interface WorkflowProviderProps {
  children: ReactNode;
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  readOnly?: boolean;
}
export declare const WorkflowProvider: React.FC<WorkflowProviderProps>;
export declare const useWorkflow: () => WorkflowContextType;
export default useWorkflow;
