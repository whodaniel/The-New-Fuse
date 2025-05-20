    const NODE_TYPE_MAP = {
  httpRequest: 'n8n-nodes-base.httpRequest',
  slack: 'n8n-nodes-base.slack',
};
export function convertToN8n(nodes, edges): any {
  const n8nNodes = nodes.map((node) => ({
    id: node.id,
    name: node.data.name || node.type,
    type: NODE_TYPE_MAP[node.type] || node.type,
    parameters: node.data.parameters || {},
    credentials: node.data.credentials,
  }));
  const connections = {};
  edges.forEach((edge) => {
    var _a, _b;
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode)
      return;
    if (!connections[edge.source]) {
      connections[edge.source] = { main: [] };
    }
    const sourceIndex = parseInt(((_a = edge.sourceHandle) === null || _a === void 0 ? void 0 : _a.split('-')[1]) || '0', 10);
    const targetIndex = parseInt(((_b = edge.targetHandle) === null || _b === void 0 ? void 0 : _b.split('-')[1]) || '0', 10);
    connections[edge.source].main.push({
      node: edge.target,
      type: 'main',
      index: targetIndex,
    });
  });
  return {
    nodes: n8nNodes,
    connections,
  };
}
export function validateWorkflow(workflow): any {
  for (const node of workflow.nodes) {
    switch (node.type) {
      case 'n8n-nodes-base.httpRequest':
        if (!node.parameters.url) {
          console.error(`HTTP Request node ${node.id} missing URL`);
          return false;
        }
        if (!node.parameters.method) {
          console.error(`HTTP Request node ${node.id} missing method`);
          return false;
        }
        break;
      case 'n8n-nodes-base.slack':
        if (!node.parameters.channel) {
          console.error(`Slack node ${node.id} missing channel`);
          return false;
        }
        if (!node.parameters.text && !node.parameters.blocks) {
          console.error(`Slack node ${node.id} missing message content`);
          return false;
        }
        break;
    }
  }
  const visited = new Set();
  const recursionStack = new Set();
  function hasCircularDependency(nodeId): any {
    if (!connections[nodeId])
      return false;
    if (recursionStack.has(nodeId))
      return true;
    if (visited.has(nodeId))
      return false;
    visited.add(nodeId);
    recursionStack.add(nodeId);
    for (const conn of connections[nodeId].main) {
      if (hasCircularDependency(conn.node))
        return true;
    }
    recursionStack.delete(nodeId);
    return false;
  }
  for (const node of workflow.nodes) {
    if (hasCircularDependency(node.id)) {
      console.error('Workflow contains circular dependencies');
      return false;
    }
  }
  return true;
}