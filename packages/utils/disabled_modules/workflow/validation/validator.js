"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = exports.WorkflowValidator = void 0;
class WorkflowValidator {
    constructor(executors) {
        this.executors = executors;
    }
}
() => ;
(nodes, edges) => {
    const context = { errors: [], warnings: [] };
    // Validate nodes
    for (const node of nodes) {
        await this.validateNode(node, context);
    }
    // Validate edges
    for (const edge of edges) {
        this.validateEdge(edge, nodes, context);
    }
    // Validate workflow structure
    this.validateWorkflowStructure(nodes, edges, context);
    return {
        isValid: context.errors.length === 0,
        errors: context.errors,
        warnings: context.warnings
    };
};
async;
validateNode();
Promise();
Promise(node, context);
{
    const executor = this.executors.get(node.type);
    if (!executor) {
        context.errors.push({
            type: 'error',
            nodeId: node.id,
            message: `Unknown node type: ${node.type}`,
            code: 'UNKNOWN_NODE_TYPE'
        });
        return;
    }
    try {
        await executor.validate(node.data);
    }
    catch (error) {
        context.errors.push({
            type: 'error',
            nodeId: node.id,
            message: error instanceof Error ? error.message : String(error),
            code: 'NODE_VALIDATION_ERROR'
        });
    }
}
validateEdge(edge, nodes, context);
{
    // Validate source and target nodes exist
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode) {
        context.errors.push({
            type: 'error',
            edgeId: edge.id,
            message: `Source node not found: ${edge.source}`,
            code: 'MISSING_SOURCE_NODE'
        });
    }
    if (!targetNode) {
        context.errors.push({
            type: 'error',
            edgeId: edge.id,
            message: `Target node not found: ${edge.target}`,
            code: 'MISSING_TARGET_NODE'
        });
    }
    // Additional edge validations can be added here
}
validateWorkflowStructure(nodes, edges, context);
{
    // Check for cycles
    if (this.hasCycles(nodes, edges)) {
        context.errors.push({
            type: 'error',
            message: 'Workflow contains cycles',
            code: 'CYCLIC_WORKFLOW'
        });
    }
    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(edge => {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
    });
    nodes.forEach(node => {
        if (!connectedNodes.has(node.id)) {
            context.warnings.push({
                type: 'warning',
                nodeId: node.id,
                message: 'Node is disconnected from the workflow',
                code: 'DISCONNECTED_NODE'
            });
        }
    });
}
hasCycles(nodes, edges);
{
    const visited = new Set();
    const recursionStack = new Set();
    const hasCycleFromNode = (nodeId) => {
        if (!visited.has(nodeId)) {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            const outgoingEdges = edges.filter(e => e.source === nodeId);
            for (const edge of outgoingEdges) {
                if (!visited.has(edge.target) && hasCycleFromNode(edge.target)) {
                    return true;
                }
                else if (recursionStack.has(edge.target)) {
                    return true;
                }
            }
        }
        recursionStack.delete(nodeId);
        return false;
    };
    for (const node of nodes) {
        if (!visited.has(node.id) && hasCycleFromNode(node.id)) {
            return true;
        }
    }
    return false;
}
exports.WorkflowValidator = WorkflowValidator;
class Validator {
    validateRequired(value, fieldName, context) {
        if (value === undefined || value === null || value === '') {
            context.errors.push({
                type: 'error',
                message: `${fieldName} is required`,
                code: 'REQUIRED_FIELD'
            });
        }
    }
    validateString(value, fieldName, context) {
        if (value !== undefined && value !== null && typeof value !== 'string') {
            context.errors.push({
                type: 'error',
                message: `${fieldName} must be a string`,
                code: 'INVALID_STRING'
            });
        }
    }
    validateNumber(value, fieldName, context) {
        if (value !== undefined && value !== null && typeof value !== 'number') {
            context.errors.push({
                type: 'error',
                message: `${fieldName} must be a number`,
                code: 'INVALID_NUMBER'
            });
        }
    }
    validateBoolean(value, fieldName, context) {
        if (value !== undefined && value !== null && typeof value !== 'boolean') {
            context.errors.push({
                type: 'error',
                message: `${fieldName} must be a boolean`,
                code: 'INVALID_BOOLEAN'
            });
        }
    }
    validateArray(value, fieldName, context) {
        if (value !== undefined && value !== null && !Array.isArray(value)) {
            context.errors.push({
                type: 'error',
                message: `${fieldName} must be an array`,
                code: 'INVALID_ARRAY'
            });
        }
    }
    validateEnum(value, fieldName, allowedValues, context) {
        if (value !== undefined && value !== null && !allowedValues.includes(value)) {
            context.errors.push({
                type: 'error',
                message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
                code: 'INVALID_ENUM'
            });
        }
    }
    validate(value, rules) {
        const context = { errors: [], warnings: [] };
        for (const rule of rules) {
            switch (rule.type) {
                case 'required':
                    this.validateRequired(value, rule.fieldName, context);
                    break;
                case 'string':
                    this.validateString(value, rule.fieldName, context);
                    break;
                case 'number':
                    this.validateNumber(value, rule.fieldName, context);
                    break;
                case 'boolean':
                    this.validateBoolean(value, rule.fieldName, context);
                    break;
                case 'array':
                    this.validateArray(value, rule.fieldName, context);
                    break;
                case 'enum':
                    if (rule.allowedValues) {
                        this.validateEnum(value, rule.fieldName, rule.allowedValues, context);
                    }
                    break;
            }
        }
        return {
            isValid: context.errors.length === 0,
            errors: context.errors,
            warnings: context.warnings
        };
    }
}
exports.Validator = Validator;
export {};
//# sourceMappingURL=validator.js.map