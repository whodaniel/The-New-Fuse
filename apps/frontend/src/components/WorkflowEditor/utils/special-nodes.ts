export function processSpecialNodes(n8nWorkflow): any {
    return n8nWorkflow.nodes;
}
export function processErrorConnections(edges, connections, nodes): any {
    edges
        .filter(edge => { var _a; return (_a = edge.sourceHandle) === null || _a === void 0 ? void 0 : _a.startsWith('error'); })
        .forEach(edge => {
        var _a;
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
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
//# sourceMappingURL=special-nodes.js.map