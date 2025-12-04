var NODE_TYPE_MAP = {
    httpRequest: 'n8n-nodes-base.httpRequest',
    slack: 'n8n-nodes-base.slack',
};
export function convertReactFlowToN8n(nodes, edges) {
    var n8nNodes = nodes.map(function (node) { return ({
        id: node.id,
        name: node.data.name || node.type,
        type: NODE_TYPE_MAP[node.type] || node.type,
        parameters: node.data.parameters || {},
        credentials: node.data.credentials,
    }); });
    var connections = {};
    edges.forEach(function (edge) {
        var _a, _b;
        var sourceNode = nodes.find(function (n) { return n.id === edge.source; });
        var targetNode = nodes.find(function (n) { return n.id === edge.target; });
        if (!sourceNode || !targetNode)
            return;
        if (!connections[edge.source]) {
            connections[edge.source] = { main: [] };
        }
        var sourceIndex = parseInt(((_a = edge.sourceHandle) === null || _a === void 0 ? void 0 : _a.split('-')[1]) || '0', 10);
        var targetIndex = parseInt(((_b = edge.targetHandle) === null || _b === void 0 ? void 0 : _b.split('-')[1]) || '0', 10);
        connections[edge.source].main.push({
            node: edge.target,
            type: 'main',
            index: targetIndex,
        });
    });
    return {
        nodes: n8nNodes,
        connections: connections,
    };
}
export function validateWorkflow(workflow) {
    for (var _i = 0, _c = workflow.nodes; _i < _c.length; _i++) {
        var node = _c[_i];
        switch (node.type) {
            case 'n8n-nodes-base.httpRequest':
                if (!node.parameters.url) {
                    console.error("HTTP Request node ".concat(node.id, " missing URL"));
                    return false;
                }
                if (!node.parameters.method) {
                    console.error("HTTP Request node ".concat(node.id, " missing method"));
                    return false;
                }
                break;
            case 'n8n-nodes-base.slack':
                if (!node.parameters.channel) {
                    console.error("Slack node ".concat(node.id, " missing channel"));
                    return false;
                }
                if (!node.parameters.text && !node.parameters.blocks) {
                    console.error("Slack node ".concat(node.id, " missing message content"));
                    return false;
                }
                break;
        }
    }
    var visited = new Set();
    var recursionStack = new Set();
    function hasCircularDependency(nodeId) {
        if (!connections[nodeId])
            return false;
        if (recursionStack.has(nodeId))
            return true;
        if (visited.has(nodeId))
            return false;
        visited.add(nodeId);
        recursionStack.add(nodeId);
        for (var _i = 0, _c = connections[nodeId].main; _i < _c.length; _i++) {
            var conn = _c[_i];
            if (hasCircularDependency(conn.node))
                return true;
        }
        recursionStack.delete(nodeId);
        return false;
    }
    for (var _d = 0, _e = workflow.nodes; _d < _e.length; _d++) {
        var node = _e[_d];
        if (hasCircularDependency(node.id)) {
            console.error('Workflow contains circular dependencies');
            return false;
        }
    }
    return true;
}
