export const createNode = (type, position, label): any => ({
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
export const createEdge = (source, target, condition): any => ({
    id: `${source}-${target}`,
    source,
    target,
    type: condition ? 'conditional' : 'default',
    data: condition ? { condition } : undefined,
});
export const validateWorkflow = (nodes, edges): any => {
    const errors = [];
    const connectedNodes = new Set();
    edges.forEach(edge => {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
    });
    nodes.forEach(node => {
        if (!connectedNodes.has(node.id)) {
            errors.push(`Node "${node.data.label}" (${node.id}) is not connected to any other nodes`);
        }
    });
    const hasCycle = (startNode, visited, path): any => {
        if (path.has(startNode))
            return true;
        if (visited.has(startNode))
            return false;
        visited.add(startNode);
        path.add(startNode);
        const outgoingEdges = edges.filter(edge => edge.source === startNode);
        for (const edge of outgoingEdges) {
            if (hasCycle(edge.target, visited, path))
                return true;
        }
        path.delete(startNode);
        return false;
    };
    nodes.forEach(node => {
        if (hasCycle(node.id, new Set(), new Set())) {
            errors.push(`Cycle detected starting from node "${node.data.label}" (${node.id})`);
        }
    });
    nodes.forEach(node => {
        var _a, _b, _c;
        switch (node.type) {
            case 'input':
                if (!((_a = node.data.outputs) === null || _a === void 0 ? void 0 : _a.length)) {
                    errors.push(`Input node "${node.data.label}" (${node.id}) must have at least one output`);
                }
                break;
            case 'task':
                if (!((_b = node.data.inputs) === null || _b === void 0 ? void 0 : _b.length)) {
                    errors.push(`Task node "${node.data.label}" (${node.id}) must have at least one input`);
                }
                break;
            case 'condition':
                if (!((_c = node.data.condition) === null || _c === void 0 ? void 0 : _c.length)) {
                    errors.push(`Condition node "${node.data.label}" (${node.id}) must have a condition`);
                }
                break;
        }
    });
    edges.forEach(edge => {
        var _a;
        if (edge.type === 'conditional' && !((_a = edge.data) === null || _a === void 0 ? void 0 : _a.condition)) {
            errors.push(`Conditional edge ${edge.id} must have a condition`);
        }
    });
    return {
        isValid: errors.length === 0,
        errors,
    };
};
export const optimizeWorkflow = (nodes, edges): any => {
    const connectedNodes = nodes.filter(node => {
        if (node.type === 'condition')
            return false;
        const outgoingEdges = edges.filter(edge => edge.source === node.id);
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        return outgoingEdges.length === 0 || incomingEdges.length === 0;
    });
    const optimizedNodes = nodes.filter(node => !connectedNodes.find(n => n.id === node.id));
    const mergeableNodes = optimizedNodes.filter(node => {
        if (node.type !== 'task')
            return false;
        const outgoingEdges = edges.filter(edge => edge.source === node.id);
        const nextNode = outgoingEdges.length === 1
            ? optimizedNodes.find(n => n.id === outgoingEdges[0].target)
            : null;
        return (nextNode === null || nextNode === void 0 ? void 0 : nextNode.type) === 'task';
    });
    mergeableNodes.forEach(node => {
        const outgoingEdge = edges.find(edge => edge.source === node.id);
        if (!outgoingEdge)
            return;
        const nextNode = optimizedNodes.find(n => n.id === outgoingEdge.target);
        if (!nextNode)
            return;
        node.data.outputs = [...node.data.outputs, ...nextNode.data.outputs];
        optimizedNodes.splice(optimizedNodes.indexOf(nextNode), 1);
        edges.splice(edges.indexOf(outgoingEdge), 1);
    });
    return {
        nodes: optimizedNodes,
        edges,
    };
};
export const exportWorkflow = (nodes, edges): any => {
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
export const importWorkflow = (workflow): any => {
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
//# sourceMappingURL=workflow.js.map