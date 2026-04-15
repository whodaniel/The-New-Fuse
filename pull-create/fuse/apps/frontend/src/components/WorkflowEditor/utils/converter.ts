/**
 * Converter utilities for transforming ReactFlow workflow to n8n format
 */

interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    type: string;
    name: string;
    parameters: Record<string, unknown>;
  };
}

interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
}

interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, Record<string, N8nConnection[][]>>;
  active: boolean;
  settings: Record<string, unknown>;
}

/**
 * Convert ReactFlow nodes and edges to n8n workflow format
 */
export function convertReactFlowToN8n(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  nodeTypesMetadata: Record<string, { typeVersion?: number }>
): N8nWorkflow {
  // Convert nodes
  const n8nNodes: N8nNode[] = nodes.map((node) => ({
    id: node.id,
    name: node.data.name || node.data.type,
    type: node.data.type,
    typeVersion: nodeTypesMetadata[node.data.type]?.typeVersion || 1,
    position: [node.position.x, node.position.y],
    parameters: node.data.parameters || {},
  }));

  // Build connections map
  const connections: Record<string, Record<string, N8nConnection[][]>> = {};

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    // Initialize connection structure for source node
    if (!connections[sourceNode.data.name || sourceNode.id]) {
      connections[sourceNode.data.name || sourceNode.id] = {};
    }

    // Determine output type (main, error, etc.)
    const outputType = edge.sourceHandle || 'main';
    if (!connections[sourceNode.data.name || sourceNode.id][outputType]) {
      connections[sourceNode.data.name || sourceNode.id][outputType] = [];
    }

    // Determine output index from source handle
    const outputIndex = parseInt(edge.sourceHandle?.replace(/\D/g, '') || '0', 10);
    const inputIndex = parseInt(edge.targetHandle?.replace(/\D/g, '') || '0', 10);

    // Ensure the output index array exists
    while (connections[sourceNode.data.name || sourceNode.id][outputType].length <= outputIndex) {
      connections[sourceNode.data.name || sourceNode.id][outputType].push([]);
    }

    // Add connection
    connections[sourceNode.data.name || sourceNode.id][outputType][outputIndex].push({
      node: targetNode.data.name || targetNode.id,
      type: 'main',
      index: inputIndex,
    });
  });

  return {
    name: 'Untitled Workflow',
    nodes: n8nNodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
    },
  };
}

/**
 * Convert n8n workflow format back to ReactFlow nodes and edges
 */
export function convertN8nToReactFlow(workflow: N8nWorkflow): {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
} {
  const nodes: ReactFlowNode[] = workflow.nodes.map((node) => ({
    id: node.id,
    type: 'dynamicNode',
    position: { x: node.position[0], y: node.position[1] },
    data: {
      type: node.type,
      name: node.name,
      parameters: node.parameters,
    },
  }));

  const edges: ReactFlowEdge[] = [];
  let edgeId = 0;

  // Convert connections to edges
  Object.entries(workflow.connections).forEach(([sourceName, outputs]) => {
    const sourceNode = workflow.nodes.find((n) => n.name === sourceName);
    if (!sourceNode) return;

    Object.entries(outputs).forEach(([outputType, outputConnections]) => {
      outputConnections.forEach((connections, outputIndex) => {
        connections.forEach((connection) => {
          const targetNode = workflow.nodes.find((n) => n.name === connection.node);
          if (!targetNode) return;

          edges.push({
            id: `edge-${edgeId++}`,
            source: sourceNode.id,
            target: targetNode.id,
            sourceHandle:
              outputType === 'main' ? `output-${outputIndex}` : `${outputType}-${outputIndex}`,
            targetHandle: `input-${connection.index}`,
          });
        });
      });
    });
  });

  return { nodes, edges };
}

export default { convertReactFlowToN8n, convertN8nToReactFlow };
