export {}
exports.validateWorkflow = exports.validateWorkflowExecution = exports.validateWorkflowConnections = exports.validateNodeConfiguration = exports.isValidEdge = exports.isValidNode = exports.isValidCondition = exports.isValidPosition = void 0;
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
const isValidPosition = (position): any => {
    try {
        positionSchema.parse(position);
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isValidPosition = isValidPosition;
const isValidCondition = (condition): any => {
    try {
        conditionSchema.parse(condition);
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isValidCondition = isValidCondition;
const isValidNode = (node): any => {
    try {
        nodeSchema.parse(node);
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isValidNode = isValidNode;
const isValidEdge = (edge): any => {
    try {
        edgeSchema.parse(edge);
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isValidEdge = isValidEdge;
const validateNodeConfiguration = (node): any => {
    var _a, _b, _c, _d, _e;
    const errors = [];
    switch (node.type) {
        case 'agent':
            if (!((_a = node.data.config) === null || _a === void 0 ? void 0 : _a.agentType)) {
                errors.push('Agent type is required');
            }
            if (!((_b = node.data.config) === null || _b === void 0 ? void 0 : _b.model)) {
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
exports.validateNodeConfiguration = validateNodeConfiguration;
const validateWorkflowConnections = (nodes, edges): any => {
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
        var _a;
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
exports.validateWorkflowConnections = validateWorkflowConnections;
const validateWorkflowExecution = (nodes): any => {
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
exports.validateWorkflowExecution = validateWorkflowExecution;
const validateWorkflow = (nodes, edges): any => {
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
exports.validateWorkflow = validateWorkflow;
export {};
//# sourceMappingURL=workflowValidation.js.map