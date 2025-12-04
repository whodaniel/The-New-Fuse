var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var createNode = function (type, position, label) { return ({
    id: "".concat(type, "-").concat(Date.now()),
    type: type,
    position: position,
    data: {
        label: label,
        type: type,
        inputs: [],
        outputs: [],
    },
}); };
export var createEdge = function (source, target, condition) { return ({
    id: "".concat(source, "-").concat(target),
    source: source,
    target: target,
    type: condition ? 'conditional' : 'default',
    data: condition ? { condition: condition } : undefined,
}); };
export var validateWorkflow = function (nodes, edges) {
    var errors = [];
    var connectedNodes = new Set();
    edges.forEach(function (edge) {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
    });
    nodes.forEach(function (node) {
        if (!connectedNodes.has(node.id)) {
            errors.push("Node \"".concat(node.data.label, "\" (").concat(node.id, ") is not connected to any other nodes"));
        }
    });
    var hasCycle = function (startNode, visited, path) {
        if (path.has(startNode))
            return true;
        if (visited.has(startNode))
            return false;
        visited.add(startNode);
        path.add(startNode);
        var outgoingEdges = edges.filter(function (edge) { return edge.source === startNode; });
        for (var _i = 0, outgoingEdges_1 = outgoingEdges; _i < outgoingEdges_1.length; _i++) {
            var edge = outgoingEdges_1[_i];
            if (hasCycle(edge.target, visited, path))
                return true;
        }
        path.delete(startNode);
        return false;
    };
    nodes.forEach(function (node) {
        if (hasCycle(node.id, new Set(), new Set())) {
            errors.push("Cycle detected starting from node \"".concat(node.data.label, "\" (").concat(node.id, ")"));
        }
    });
    nodes.forEach(function (node) {
        var _a, _b;
        switch (node.type) {
            case 'input':
                if (!((_a = node.data.outputs) === null || _a === void 0 ? void 0 : _a.length)) {
                    errors.push("Input node \"".concat(node.data.label, "\" (").concat(node.id, ") must have at least one output"));
                }
                break;
            case 'task':
                if (!((_b = node.data.inputs) === null || _b === void 0 ? void 0 : _b.length)) {
                    errors.push("Task node \"".concat(node.data.label, "\" (").concat(node.id, ") must have at least one input"));
                }
                break;
            case 'condition':
                if (!((_c = node.data.condition) === null || _c === void 0 ? void 0 : _c.length)) {
                    errors.push("Condition node \"".concat(node.data.label, "\" (").concat(node.id, ") must have a condition"));
                }
                break;
        }
    });
    edges.forEach(function (edge) {
        var _a;
        if (edge.type === 'conditional' && !((_a = edge.data) === null || _a === void 0 ? void 0 : _a.condition)) {
            errors.push("Conditional edge ".concat(edge.id, " must have a condition"));
        }
    });
    return {
        isValid: errors.length === 0,
        errors: errors,
    };
};
export var optimizeWorkflow = function (nodes, edges) {
    var connectedNodes = nodes.filter(function (node) {
        if (node.type === 'condition')
            return false;
        var outgoingEdges = edges.filter(function (edge) { return edge.source === node.id; });
        var incomingEdges = edges.filter(function (edge) { return edge.target === node.id; });
        return outgoingEdges.length === 0 || incomingEdges.length === 0;
    });
    var optimizedNodes = nodes.filter(function (node) { return !connectedNodes.find(function (n) { return n.id === node.id; }); });
    var mergeableNodes = optimizedNodes.filter(function (node) {
        if (node.type !== 'task')
            return false;
        var outgoingEdges = edges.filter(function (edge) { return edge.source === node.id; });
        var nextNode = outgoingEdges.length === 1
            ? optimizedNodes.find(function (n) { return n.id === outgoingEdges[0].target; })
            : null;
        return (nextNode === null || nextNode === void 0 ? void 0 : nextNode.type) === 'task';
    });
    mergeableNodes.forEach(function (node) {
        var outgoingEdge = edges.find(function (edge) { return edge.source === node.id; });
        if (!outgoingEdge)
            return;
        var nextNode = optimizedNodes.find(function (n) { return n.id === outgoingEdge.target; });
        if (!nextNode)
            return;
        node.data.outputs = __spreadArray(__spreadArray([], node.data.outputs, true), nextNode.data.outputs, true);
        optimizedNodes.splice(optimizedNodes.indexOf(nextNode), 1);
        edges.splice(edges.indexOf(outgoingEdge), 1);
    });
    return {
        nodes: optimizedNodes,
        edges: edges,
    };
};
export var exportWorkflow = function (nodes, edges) {
    return {
        nodes: nodes,
        edges: edges,
        metadata: {
            version: '1.0',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
    };
};
export var importWorkflow = function (workflow) {
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
