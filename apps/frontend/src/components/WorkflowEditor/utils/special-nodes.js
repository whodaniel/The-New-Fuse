export function processSpecialNodes(n8nWorkflow) {
    return n8nWorkflow.nodes;
}
export function processErrorConnections(edges, connections, nodes) {
    edges
        .filter(function (edge) { var _a; return (_a = edge.sourceHandle) === null || _a === void 0 ? void 0 : _a.startsWith('error'); })
        .forEach(function (edge) {
        var _a;
        var sourceNode = nodes.find(function (n) { return n.id === edge.source; });
        var targetNode = nodes.find(function (n) { return n.id === edge.target; });
        if (sourceNode && targetNode) {
            connections[sourceNode.id] = connections[sourceNode.id] || {};
            connections[sourceNode.id].error = connections[sourceNode.id].error || [];
            connections[sourceNode.id].error.push({
                node: targetNode.id,
                input: ((_a = edge.targetHandle) === null || _a === void 0 ? void 0 : _a.replace('input-', '')) || 'main',
                type: 'error'
            });
        }
    });
}
