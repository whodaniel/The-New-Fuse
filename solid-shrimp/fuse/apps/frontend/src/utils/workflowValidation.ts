import { z } from 'zod';

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const conditionSchema = z.object({
  id: z.string(),
  type: z.enum(['equals', 'contains', 'greater', 'less', 'regex']),
  field: z.string(),
  value: z.union([z.string(), z.number()]),
});

const nodeDataSchema = z.object({
  label: z.string(),
  type: z.string(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  conditions: z.array(conditionSchema).optional(),
  config: z.record(z.string(), z.any()).optional(),
});

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['input', 'output', 'default', 'agent', 'tool', 'condition']),
  position: positionSchema,
  data: nodeDataSchema,
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(['default', 'conditional']),
  data: z
    .object({
      condition: conditionSchema.optional(),
    })
    .optional(),
});

export type Node = z.infer<typeof nodeSchema>;
export type Edge = z.infer<typeof edgeSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Condition = z.infer<typeof conditionSchema>;

export const isValidPosition = (position: unknown): boolean => {
  try {
    positionSchema.parse(position);
    return true;
  } catch {
    return false;
  }
};

export const isValidCondition = (condition: unknown): boolean => {
  try {
    conditionSchema.parse(condition);
    return true;
  } catch {
    return false;
  }
};

export const isValidNode = (node: unknown): boolean => {
  try {
    nodeSchema.parse(node);
    return true;
  } catch {
    return false;
  }
};

export const isValidEdge = (edge: unknown): boolean => {
  try {
    edgeSchema.parse(edge);
    return true;
  } catch {
    return false;
  }
};

export const validateNodeConfiguration = (node: Node): string[] => {
  const errors: string[] = [];
  switch (node.type) {
    case 'agent':
      if (!node.data.config?.agentType) {
        errors.push('Agent type is required');
      }
      if (!node.data.config?.model) {
        errors.push('Language model configuration is required');
      }
      break;
    case 'tool':
      if (!node.data.config?.toolId) {
        errors.push('Tool ID is required');
      }
      if (!node.data.config?.parameters) {
        errors.push('Tool parameters configuration is required');
      }
      break;
    case 'condition':
      if (!node.data.conditions?.length) {
        errors.push('At least one condition is required');
      } else {
        node.data.conditions.forEach((condition, index) => {
          if (!condition.field) {
            errors.push(`Condition ${index + 1}: Field is required`);
          }
          if (condition.value === undefined || condition.value === null) {
            errors.push(`Condition ${index + 1}: Value is required`);
          }
        });
      }
      break;
  }
  return errors;
};

export const validateWorkflowConnections = (nodes: Node[], edges: Edge[]): string[] => {
  const errors: string[] = [];
  const connectedNodes = new Set<string>();

  edges.forEach((edge) => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach((node) => {
    if (!connectedNodes.has(node.id)) {
      errors.push(`Node "${node.data.label}" is disconnected`);
    }
  });

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode) {
      errors.push(`Edge ${edge.id}: Source node not found`);
    }
    if (!targetNode) {
      errors.push(`Edge ${edge.id}: Target node not found`);
    }

    if (sourceNode && targetNode) {
      if (sourceNode.type === 'output') {
        errors.push(`Edge ${edge.id}: Output nodes cannot have outgoing connections`);
      }
      if (targetNode.type === 'input') {
        errors.push(`Edge ${edge.id}: Input nodes cannot have incoming connections`);
      }
      if (edge.type === 'conditional' && !edge.data?.condition) {
        errors.push(`Edge ${edge.id}: Conditional edge missing condition configuration`);
      }
    }
  });

  return errors;
};

export const validateWorkflowExecution = (nodes: Node[]): string[] => {
  const errors: string[] = [];

  nodes.forEach((node) => {
    const configErrors = validateNodeConfiguration(node);
    if (configErrors.length > 0) {
      errors.push(`Node "${node.data.label}": ${configErrors.join(', ')}`);
    }
  });

  const hasStartNode = nodes.some((node) => node.type === 'input');
  const hasEndNode = nodes.some((node) => node.type === 'output');

  if (!hasStartNode) {
    errors.push('Workflow must have at least one input node');
  }
  if (!hasEndNode) {
    errors.push('Workflow must have at least one output node');
  }

  return errors;
};

export const validateWorkflow = (
  nodes: Node[],
  edges: Edge[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  nodes.forEach((node) => {
    if (!isValidNode(node)) {
      errors.push(`Invalid node configuration: ${node.id}`);
    }
  });

  edges.forEach((edge) => {
    if (!isValidEdge(edge)) {
      errors.push(`Invalid edge configuration: ${edge.id}`);
    }
  });

  errors.push(...validateWorkflowConnections(nodes, edges));
  errors.push(...validateWorkflowExecution(nodes));

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Detects if adding a connection creates a cycle in the workflow graph.
 * uses Depth-First Search (DFS) algorithm.
 *
 * @param nodes List of all nodes in the workflow
 * @param edges List of all edges in the workflow
 * @returns true if a cycle is detected, false otherwise
 */
export const detectWorkflowCycles = (nodes: any[], edges: any[]): boolean => {
  const adjList = new Map<string, string[]>();

  // Initialize adjacency list
  nodes.forEach((node) => {
    adjList.set(node.id, []);
  });

  // Build the graph
  edges.forEach((edge) => {
    if (adjList.has(edge.source)) {
      adjList.get(edge.source)?.push(edge.target);
    }
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjList.get(nodeId);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
};

export interface DryRunValidationResult {
  isValid: boolean;
  errors: string[];
  invalidNodeIds: string[];
}

export const validateWorkflowDryRun = (nodes: any[], edges: any[]): DryRunValidationResult => {
  const errors: string[] = [];
  const invalidNodeIds: string[] = [];

  // 1. Identify Orphaned Nodes

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    const source = edge.source;
    const target = edge.target;
    outDegree.set(source, (outDegree.get(source) || 0) + 1);
    inDegree.set(target, (inDegree.get(target) || 0) + 1);
  });

  nodes.forEach((node) => {
    if (inDegree.get(node.id) === 0 && outDegree.get(node.id) === 0) {
      errors.push(`Node "${node.data.label}" is isolated (orphaned).`);
      invalidNodeIds.push(node.id);
    }
  });

  // 2. Reachability Check: Every path must lead to a terminal node.
  const terminalTypes = ['output', 'response', 'end'];

  // Find all nodes that have 0 out-degree.
  const endNodes = nodes.filter((n) => outDegree.get(n.id) === 0);

  endNodes.forEach((node) => {
    if (
      !terminalTypes.includes(node.type) &&
      !node.data.label.toLowerCase().includes('output') &&
      !node.data.label.toLowerCase().includes('response')
    ) {
      // It's a dead end that isn't marked as terminal.
      errors.push(`Node "${node.data.label}" is a dead end but not a terminal node.`);
      invalidNodeIds.push(node.id);
    }
  });

  // Also need to check if there are nodes from which you CANNOT reach a terminal node.
  // We can do a reverse BFS/DFS from all valid terminal nodes.
  // Any node not visited in this reverse traversal (and not a terminal node itself)
  // is a node that cannot reach a terminal node.

  const validTerminalNodes = nodes.filter(
    (n) =>
      terminalTypes.includes(n.type) ||
      n.data.label.toLowerCase().includes('output') ||
      n.data.label.toLowerCase().includes('response')
  );

  if (validTerminalNodes.length === 0 && nodes.length > 0) {
    errors.push('No terminal (Output/Response) nodes found in the workflow.');
    // Mark all end nodes as invalid maybe?
    endNodes.forEach((n) => invalidNodeIds.push(n.id));
  } else {
    // Reverse graph
    const reverseAdj = new Map<string, string[]>();
    nodes.forEach((n) => reverseAdj.set(n.id, []));
    edges.forEach((e) => {
      reverseAdj.get(e.target)?.push(e.source);
    });

    const visitedReverse = new Set<string>();
    const queue = [...validTerminalNodes.map((n) => n.id)];
    queue.forEach((id) => visitedReverse.add(id));

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const preds = reverseAdj.get(curr) || [];
      for (const pred of preds) {
        if (!visitedReverse.has(pred)) {
          visitedReverse.add(pred);
          queue.push(pred);
        }
      }
    }

    // Any node not in visitedReverse cannot reach a terminal node.
    nodes.forEach((node) => {
      if (!visitedReverse.has(node.id)) {
        // Only report if we haven't already reported it as an isolated node
        if (!invalidNodeIds.includes(node.id)) {
          errors.push(`Node "${node.data.label}" cannot reach a terminal node.`);
          invalidNodeIds.push(node.id);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    invalidNodeIds: [...new Set(invalidNodeIds)],
  };
};
