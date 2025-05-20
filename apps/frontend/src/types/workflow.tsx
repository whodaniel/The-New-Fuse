export {}
export {};
//# sourceMappingURL=workflow.js.map

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    configuration?: Record<string, any>;
    requiredConfig?: string[];
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultConfiguration?: Record<string, any>;
  requiredConfig?: string[];
}

export interface Category {
  id: string;
  name: string;
  nodes: NodeTemplate[];
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  position: {
    x: number;
    y: number;
  };
}

export interface WorkflowState {
  workflow: {
    id: string;
    nodes: Node[];
    edges: Edge[];
  };
  execution: {
    isExecuting: boolean;
    currentNode: string | null;
    executionPath: string[];
  };
  history: {
    past: Array<{
      nodes: Node[];
      edges: Edge[];
    }>;
    future: Array<{
      nodes: Node[];
      edges: Edge[];
    }>;
  };
}
