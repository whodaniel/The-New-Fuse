export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: string;
    inputs?: any[];
    outputs?: any[];
    condition?: any;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: {
    condition?: any;
    [key: string]: any;
  };
  [key: string]: any;
}

export const createNode = (
  type: string,
  position: { x: number; y: number },
  label: string
): WorkflowNode => ({
  id: `${type}-${Date.now()}`,
  type,
  position,
  data: {
    label,
    type,
    inputs: [],
    outputs: [],
  },
});

export const createEdge = (source: string, target: string, condition?: any): WorkflowEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  type: condition ? 'conditional' : 'default',
  data: condition ? { condition } : undefined,
});

export const validateWorkflow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const connectedNodes = new Set<string>();

  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach((node) => {
    if (!connectedNodes.has(node.id)) {
      errors.push(`Node "${node.data.label}" (${node.id}) is not connected to any other nodes`);
    }
  });

  const hasCycle = (startNode: string, visited: Set<string>, path: Set<string>): boolean => {
    if (path.has(startNode)) return true;
    if (visited.has(startNode)) return false;

    visited.add(startNode);
    path.add(startNode);

    const outgoingEdges = edges.filter((edge) => edge.source === startNode);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target, visited, path)) return true;
    }

    path.delete(startNode);
    return false;
  };

  nodes.forEach((node) => {
    if (hasCycle(node.id, new Set(), new Set())) {
      errors.push(`Cycle detected starting from node "${node.data.label}" (${node.id})`);
    }
  });

  nodes.forEach((node) => {
    switch (node.type) {
      case 'input':
        if (!node.data.outputs?.length) {
          errors.push(`Input node "${node.data.label}" (${node.id}) must have at least one output`);
        }
        break;
      case 'task':
        if (!node.data.inputs?.length) {
          errors.push(`Task node "${node.data.label}" (${node.id}) must have at least one input`);
        }
        break;
      case 'condition':
        if (!node.data.condition?.length) {
          errors.push(`Condition node "${node.data.label}" (${node.id}) must have a condition`);
        }
        break;
    }
  });

  edges.forEach((edge) => {
    if (edge.type === 'conditional' && !edge.data?.condition) {
      errors.push(`Conditional edge ${edge.id} must have a condition`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const optimizeWorkflow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
  const connectedNodes = nodes.filter((node) => {
    if (node.type === 'condition') return false;
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    const incomingEdges = edges.filter((edge) => edge.target === node.id);
    return outgoingEdges.length === 0 || incomingEdges.length === 0;
  });

  const optimizedNodes = nodes.filter((node) => !connectedNodes.find((n) => n.id === node.id));

  const mergeableNodes = optimizedNodes.filter((node) => {
    if (node.type !== 'task') return false;
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    const nextNode =
      outgoingEdges.length === 1
        ? optimizedNodes.find((n) => n.id === outgoingEdges[0].target)
        : null;
    return nextNode?.type === 'task';
  });

  mergeableNodes.forEach((node) => {
    const outgoingEdge = edges.find((edge) => edge.source === node.id);
    if (!outgoingEdge) return;

    const nextNode = optimizedNodes.find((n) => n.id === outgoingEdge.target);
    if (!nextNode) return;

    node.data.outputs = [...(node.data.outputs || []), ...(nextNode.data.outputs || [])];

    // Remove nextNode from optimizedNodes
    const nextNodeIndex = optimizedNodes.indexOf(nextNode);
    if (nextNodeIndex > -1) {
      optimizedNodes.splice(nextNodeIndex, 1);
    }

    // Remove outgoingEdge from edges
    const edgeIndex = edges.indexOf(outgoingEdge);
    if (edgeIndex > -1) {
      edges.splice(edgeIndex, 1);
    }
  });

  return {
    nodes: optimizedNodes,
    edges,
  };
};

export const exportWorkflow = (nodes: WorkflowNode[], edges: WorkflowEdge[]): any => {
  return {
    nodes,
    edges,
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  };
};

export const importWorkflow = (workflow: any): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    throw new Error('Invalid workflow: nodes must be an array');
  }
  if (!workflow.edges || !Array.isArray(workflow.edges)) {
    throw new Error('Invalid workflow: edges must be an array');
  }
  return {
    nodes: workflow.nodes,
    edges: workflow.edges,
  };
};
