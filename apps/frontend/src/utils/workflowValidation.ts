import zod_1 from 'zod';
const positionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
});
const conditionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['equals', 'contains', 'greater', 'less', 'regex']),
    field: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
});
const nodeDataSchema = zod_1.z.object({
    label: zod_1.z.string(),
    type: zod_1.z.string(),
    inputs: zod_1.z.array(zod_1.z.string()).optional(),
    outputs: zod_1.z.array(zod_1.z.string()).optional(),
    conditions: zod_1.z.array(conditionSchema).optional(),
    config: zod_1.z.record(zod_1.z.any()).optional(),
});
const nodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['input', 'output', 'default', 'agent', 'tool', 'condition']),
    position: positionSchema,
    data: nodeDataSchema,
});
const edgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(),
    target: zod_1.z.string(),
    type: zod_1.z.enum(['default', 'conditional']),
    data: zod_1.z.object({
        condition: conditionSchema.optional(),
    }).optional(),
});
export const isValidPosition = (position): any => {
    try {
        positionSchema.parse(position);
        return true;
    }
    catch {
        return false;
    }
};
export const isValidCondition = (condition): any => {
    try {
        conditionSchema.parse(condition);
        return true;
    }
    catch {
        return false;
    }
};
export const isValidNode = (node): any => {
    try {
        nodeSchema.parse(node);
        return true;
    }
    catch {
        return false;
    }
};
export const isValidEdge = (edge): any => {
    try {
        edgeSchema.parse(edge);
        return true;
    }
    catch {
        return false;
    }
};
export const validateNodeConfiguration = (node): any => {
    const errors = [];
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
            if (!((_c = node.data.config) === null || _c === void 0 ? void 0 : _c.toolId)) {
                errors.push('Tool ID is required');
            }
            if (!((_d = node.data.config) === null || _d === void 0 ? void 0 : _d.parameters)) {
                errors.push('Tool parameters configuration is required');
            }
            break;
        case 'condition':
            if (!((_e = node.data.conditions) === null || _e === void 0 ? void 0 : _e.length)) {
                errors.push('At least one condition is required');
            }
            else {
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
export const validateWorkflowConnections = (nodes, edges): any => {
    const errors = [];
    const connectedNodes = new Set();
    edges.forEach(edge => {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
    });
    nodes.forEach(node => {
        if (!connectedNodes.has(node.id)) {
            errors.push(`Node "${node.data.label}" is disconnected`);
        }
    });
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
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
            if (edge.type === 'conditional' && !((_a = edge.data) === null || _a === void 0 ? void 0 : _a.condition)) {
                errors.push(`Edge ${edge.id}: Conditional edge missing condition configuration`);
            }
        }
    });
    return errors;
};
export const validateWorkflowExecution = (nodes): any => {
    const errors = [];
    nodes.forEach(node => {
        const configErrors = (0, exports.validateNodeConfiguration)(node);
        if (configErrors.length > 0) {
            errors.push(`Node "${node.data.label}": ${configErrors.join(', ')}`);
        }
    });
    const hasStartNode = nodes.some(node => node.type === 'input');
    const hasEndNode = nodes.some(node => node.type === 'output');
    if (!hasStartNode) {
        errors.push('Workflow must have at least one input node');
    }
    if (!hasEndNode) {
        errors.push('Workflow must have at least one output node');
    }
    return errors;
};
export const validateWorkflow = (nodes, edges): any => {
    const errors = [];
    nodes.forEach(node => {
        if (!(0, exports.isValidNode)(node)) {
            errors.push(`Invalid node configuration: ${node.id}`);
        }
    });
    edges.forEach(edge => {
        if (!(0, exports.isValidEdge)(edge)) {
            errors.push(`Invalid edge configuration: ${edge.id}`);
        }
    });
    errors.push(...(0, exports.validateWorkflowConnections)(nodes, edges));
    errors.push(...(0, exports.validateWorkflowExecution)(nodes));
    return {
        isValid: errors.length === 0,
        errors,
    };
};
;

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
  nodes.forEach(node => {
    adjList.set(node.id, []);
  });

  // Build the graph
  edges.forEach(edge => {
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

  // 1. Identify Orphaned Nodes (No inputs AND No outputs, i.e., disconnected)
  // Or simpler: Nodes with no connections at all are definitely islands.
  // But also nodes that are part of a disconnected component that doesn't reach an end node.

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    const source = edge.source;
    const target = edge.target;
    outDegree.set(source, (outDegree.get(source) || 0) + 1);
    inDegree.set(target, (inDegree.get(target) || 0) + 1);
  });

  // Check for disconnected nodes (islands)
  // Exception: Maybe single node workflows are allowed? Assuming not for a "Dry Run" of a complex flow.
  // Let's mark nodes with 0 in-degree AND 0 out-degree as orphans.
  nodes.forEach(node => {
    if ((inDegree.get(node.id) === 0) && (outDegree.get(node.id) === 0)) {
        errors.push(`Node "${node.data.label}" is isolated (orphaned).`);
        invalidNodeIds.push(node.id);
    }
  });

  // 2. Check for nodes with no inputs (except valid start nodes)
  // Assuming 'input' type nodes are valid start points.
  // If a node is NOT an 'input' node and has in-degree 0, it might be an issue (unless it's an island caught above).
  // But let's stick to the prompt: "orphaned nodes (nodes with no inputs or outputs)"
  // The prompt says "nodes with no inputs or outputs". This is slightly ambiguous.
  // Usually "no inputs" is bad unless it's a start node. "No outputs" is bad unless it's a terminal node.

  nodes.forEach(node => {
    // Check missing inputs (if not a start node)
    // We don't have a strict 'start' type in all templates, but typically 'input' or 'trigger'.
    // Let's assume nodes with 0 in-degree that are NOT explicitly 'input' or 'trigger' might be suspicious,
    // but the prompt specifically asks to ensure "every path eventually leads to a terminal 'Output' or 'Response' node".

    // Let's focus on the path reachability first, as that covers "dead ends".
  });

  // 3. Reachability Check: Every path must lead to a terminal node.
  // Terminal nodes are those with type 'output' or 'response'.
  // Or simply nodes that have 0 out-degree should be of type 'output' or 'response'.

  const terminalTypes = ['output', 'response', 'end']; // Add more if needed

  // Find all nodes that have 0 out-degree.
  const endNodes = nodes.filter(n => outDegree.get(n.id) === 0);

  endNodes.forEach(node => {
    // If it's not a terminal type, it's a dead end.
    // However, some valid flows might end at an action that doesn't produce output?
    // The prompt says "eventually leads to a terminal 'Output' or 'Response' node".
    if (!terminalTypes.includes(node.type) && !node.data.label.toLowerCase().includes('output') && !node.data.label.toLowerCase().includes('response')) {
       // It's a dead end that isn't marked as terminal.
       errors.push(`Node "${node.data.label}" is a dead end but not a terminal node.`);
       invalidNodeIds.push(node.id);
    }
  });

  // Also need to check if there are nodes from which you CANNOT reach a terminal node.
  // We can do a reverse BFS/DFS from all valid terminal nodes.
  // Any node not visited in this reverse traversal (and not a terminal node itself)
  // is a node that cannot reach a terminal node.

  const validTerminalNodes = nodes.filter(n =>
      terminalTypes.includes(n.type) ||
      n.data.label.toLowerCase().includes('output') ||
      n.data.label.toLowerCase().includes('response')
  );

  if (validTerminalNodes.length === 0 && nodes.length > 0) {
      errors.push("No terminal (Output/Response) nodes found in the workflow.");
      // Mark all end nodes as invalid maybe?
      endNodes.forEach(n => invalidNodeIds.push(n.id));
  } else {
      // Reverse graph
      const reverseAdj = new Map<string, string[]>();
      nodes.forEach(n => reverseAdj.set(n.id, []));
      edges.forEach(e => {
          reverseAdj.get(e.target)?.push(e.source);
      });

      const visitedReverse = new Set<string>();
      const queue = [...validTerminalNodes.map(n => n.id)];
      queue.forEach(id => visitedReverse.add(id));

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
      nodes.forEach(node => {
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
    invalidNodeIds: [...new Set(invalidNodeIds)]
  };
};
