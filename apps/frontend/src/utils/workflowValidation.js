exports.validateWorkflow = exports.validateWorkflowExecution = exports.validateWorkflowConnections = exports.validateNodeConfiguration = exports.isValidEdge = exports.isValidNode = exports.isValidCondition = exports.isValidPosition = void 0;
import zod_1 from 'zod';
var positionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
});
var conditionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['equals', 'contains', 'greater', 'less', 'regex']),
    field: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
});
var nodeDataSchema = zod_1.z.object({
    label: zod_1.z.string(),
    type: zod_1.z.string(),
    inputs: zod_1.z.array(zod_1.z.string()).optional(),
    outputs: zod_1.z.array(zod_1.z.string()).optional(),
    conditions: zod_1.z.array(conditionSchema).optional(),
    config: zod_1.z.record(zod_1.z.any()).optional(),
});
var nodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['input', 'output', 'default', 'agent', 'tool', 'condition']),
    position: positionSchema,
    data: nodeDataSchema,
});
var edgeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(),
    target: zod_1.z.string(),
    type: zod_1.z.enum(['default', 'conditional']),
    data: zod_1.z.object({
        condition: conditionSchema.optional(),
    }).optional(),
});
var isValidPosition = function (position) {
    try {
        positionSchema.parse(position);
        return true;
    }
    catch (_b) {
        return false;
    }
};
exports.isValidPosition = isValidPosition;
var isValidCondition = function (condition) {
    try {
        conditionSchema.parse(condition);
        return true;
    }
    catch (_b) {
        return false;
    }
};
exports.isValidCondition = isValidCondition;
var isValidNode = function (node) {
    try {
        nodeSchema.parse(node);
        return true;
    }
    catch (_b) {
        return false;
    }
};
exports.isValidNode = isValidNode;
var isValidEdge = function (edge) {
    try {
        edgeSchema.parse(edge);
        return true;
    }
    catch (_b) {
        return false;
    }
};
exports.isValidEdge = isValidEdge;
var validateNodeConfiguration = function (node) {
    var _b, _f;
    var errors = [];
    switch (node.type) {
        case 'agent':
            if (!((_b = node.data.config) === null || _b === void 0 ? void 0 : _b.agentType)) {
                errors.push('Agent type is required');
            }
            if (!((_f = node.data.config) === null || _f === void 0 ? void 0 : _f.model)) {
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
                node.data.conditions.forEach(function (condition, index) {
                    if (!condition.field) {
                        errors.push("Condition ".concat(index + 1, ": Field is required"));
                    }
                    if (condition.value === undefined || condition.value === null) {
                        errors.push("Condition ".concat(index + 1, ": Value is required"));
                    }
                });
            }
            break;
    }
    return errors;
};
exports.validateNodeConfiguration = validateNodeConfiguration;
var validateWorkflowConnections = function (nodes, edges) {
    var errors = [];
    var connectedNodes = new Set();
    edges.forEach(function (edge) {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
    });
    nodes.forEach(function (node) {
        if (!connectedNodes.has(node.id)) {
            errors.push("Node \"".concat(node.data.label, "\" is disconnected"));
        }
    });
    edges.forEach(function (edge) {
        var sourceNode = nodes.find(function (n) { return n.id === edge.source; });
        var targetNode = nodes.find(function (n) { return n.id === edge.target; });
        if (!sourceNode) {
            errors.push("Edge ".concat(edge.id, ": Source node not found"));
        }
        if (!targetNode) {
            errors.push("Edge ".concat(edge.id, ": Target node not found"));
        }
        if (sourceNode && targetNode) {
            if (sourceNode.type === 'output') {
                errors.push("Edge ".concat(edge.id, ": Output nodes cannot have outgoing connections"));
            }
            if (targetNode.type === 'input') {
                errors.push("Edge ".concat(edge.id, ": Input nodes cannot have incoming connections"));
            }
            if (edge.type === 'conditional' && !((_a = edge.data) === null || _a === void 0 ? void 0 : _a.condition)) {
                errors.push("Edge ".concat(edge.id, ": Conditional edge missing condition configuration"));
            }
        }
    });
    return errors;
};
exports.validateWorkflowConnections = validateWorkflowConnections;
var validateWorkflowExecution = function (nodes) {
    var errors = [];
    nodes.forEach(function (node) {
        var configErrors = (0, exports.validateNodeConfiguration)(node);
        if (configErrors.length > 0) {
            errors.push("Node \"".concat(node.data.label, "\": ").concat(configErrors.join(', ')));
        }
    });
    var hasStartNode = nodes.some(function (node) { return node.type === 'input'; });
    var hasEndNode = nodes.some(function (node) { return node.type === 'output'; });
    if (!hasStartNode) {
        errors.push('Workflow must have at least one input node');
    }
    if (!hasEndNode) {
        errors.push('Workflow must have at least one output node');
    }
    return errors;
};
exports.validateWorkflowExecution = validateWorkflowExecution;
var validateWorkflow = function (nodes, edges) {
    var errors = [];
    nodes.forEach(function (node) {
        if (!(0, exports.isValidNode)(node)) {
            errors.push("Invalid node configuration: ".concat(node.id));
        }
    });
    edges.forEach(function (edge) {
        if (!(0, exports.isValidEdge)(edge)) {
            errors.push("Invalid edge configuration: ".concat(edge.id));
        }
    });
    errors.push.apply(errors, (0, exports.validateWorkflowConnections)(nodes, edges));
    errors.push.apply(errors, (0, exports.validateWorkflowExecution)(nodes));
    return {
        isValid: errors.length === 0,
        errors: errors,
    };
};
exports.validateWorkflow = validateWorkflow;
