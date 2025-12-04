// Validation utilities for N8n workflows and dynamic validation
/**
 * Validates an N8n workflow structure
 */
export function validateN8nWorkflow(workflow, options) {
    if (options === void 0) { options = {}; }
    var _a = options.checkCircularDependencies, checkCircularDependencies = _a === void 0 ? true : _a, _b = options.checkRequiredParameters, checkRequiredParameters = _b === void 0 ? true : _b, _c = options.checkConnections, checkConnections = _c === void 0 ? true : _c, _d = options.strictMode, strictMode = _d === void 0 ? false : _d;
    var errors = [];
    var warnings = [];
    // Basic structure validation
    if (!workflow) {
        errors.push('Workflow is null or undefined');
        return { isValid: false, errors: errors, warnings: warnings };
    }
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        errors.push('Workflow must have a nodes array');
        return { isValid: false, errors: errors, warnings: warnings };
    }
    if (!workflow.connections) {
        errors.push('Workflow must have a connections object');
        return { isValid: false, errors: errors, warnings: warnings };
    }
    // Check for at least one start node
    var startNodes = workflow.nodes.filter(function (node) {
        return node.type === 'n8n-nodes-base.start' || node.type === 'start';
    });
    if (startNodes.length === 0) {
        warnings.push('Workflow should have at least one start node');
    }
    else if (startNodes.length > 1) {
        warnings.push('Multiple start nodes found - only one will be executed');
    }
    // Validate individual nodes
    workflow.nodes.forEach(function (node, index) {
        if (!node.id) {
            errors.push("Node at index ".concat(index, " is missing an ID"));
        }
        if (!node.type) {
            errors.push("Node ".concat(node.id || index, " is missing a type"));
        }
        if (!node.name) {
            warnings.push("Node ".concat(node.id || index, " is missing a name"));
        }
        // Check required parameters if enabled
        if (checkRequiredParameters) {
            validateNodeParameters(node, errors, warnings);
        }
    });
    // Check connections if enabled
    if (checkConnections) {
        validateConnections(workflow, errors, warnings);
    }
    // Check for circular dependencies if enabled
    if (checkCircularDependencies) {
        var circularCheck = checkCircularDependencies(workflow);
        if (!circularCheck.isValid) {
            errors.push.apply(errors, circularCheck.errors);
        }
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}
/**
 * Validates node parameters based on node type
 */
function validateNodeParameters(node, errors, warnings) {
    var parameters = node.parameters || {};
    switch (node.type) {
        case 'n8n-nodes-base.httpRequest':
        case 'httpRequest':
            if (!parameters.url) {
                errors.push("HTTP Request node ".concat(node.id, " is missing required URL parameter"));
            }
            if (!parameters.method) {
                warnings.push("HTTP Request node ".concat(node.id, " is missing method parameter (defaults to GET)"));
            }
            break;
        case 'n8n-nodes-base.slack':
        case 'slack':
            if (!parameters.channel) {
                errors.push("Slack node ".concat(node.id, " is missing required channel parameter"));
            }
            if (!parameters.text && !parameters.blocks) {
                errors.push("Slack node ".concat(node.id, " is missing message content (text or blocks)"));
            }
            break;
        case 'n8n-nodes-base.code':
        case 'code':
            if (!parameters.code) {
                errors.push("Code node ".concat(node.id, " is missing required code parameter"));
            }
            break;
    }
}
/**
 * Validates workflow connections
 */
function validateConnections(workflow, errors, warnings) {
    var nodes = workflow.nodes, connections = workflow.connections;
    var nodeIds = new Set(nodes.map(function (node) { return node.id; }));
    // Check that all connections reference existing nodes
    Object.keys(connections).forEach(function (sourceNodeId) {
        if (!nodeIds.has(sourceNodeId)) {
            errors.push("Connection references non-existent source node: ".concat(sourceNodeId));
            return;
        }
        var nodeConnections = connections[sourceNodeId];
        if (nodeConnections.main) {
            nodeConnections.main.forEach(function (connection, index) {
                if (!nodeIds.has(connection.node)) {
                    errors.push("Connection from ".concat(sourceNodeId, " references non-existent target node: ").concat(connection.node));
                }
            });
        }
    });
    // Check for isolated nodes (nodes with no connections)
    var connectedNodes = new Set();
    Object.keys(connections).forEach(function (sourceId) {
        connectedNodes.add(sourceId);
        var nodeConnections = connections[sourceId];
        if (nodeConnections.main) {
            nodeConnections.main.forEach(function (connection) {
                connectedNodes.add(connection.node);
            });
        }
    });
    nodes.forEach(function (node) {
        if (!connectedNodes.has(node.id) && node.type !== 'n8n-nodes-base.start') {
            warnings.push("Node ".concat(node.id, " (").concat(node.name, ") appears to be isolated"));
        }
    });
}
/**
 * Checks for circular dependencies in workflow
 */
function checkCircularDependencies(workflow) {
    var connections = workflow.connections;
    var errors = [];
    var visited = new Set();
    var recursionStack = new Set();
    function hasCircularDependency(nodeId) {
        if (!connections[nodeId])
            return false;
        if (recursionStack.has(nodeId)) {
            errors.push("Circular dependency detected involving node: ".concat(nodeId));
            return true;
        }
        if (visited.has(nodeId))
            return false;
        visited.add(nodeId);
        recursionStack.add(nodeId);
        var nodeConnections = connections[nodeId];
        if (nodeConnections.main) {
            for (var _i = 0, _a = nodeConnections.main; _i < _a.length; _i++) {
                var connection = _a[_i];
                if (hasCircularDependency(connection.node)) {
                    return true;
                }
            }
        }
        recursionStack.delete(nodeId);
        return false;
    }
    // Check all nodes for circular dependencies
    Object.keys(connections).forEach(function (nodeId) {
        if (!visited.has(nodeId)) {
            hasCircularDependency(nodeId);
        }
    });
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: []
    };
}
/**
 * Creates a dynamic validator for specific node types
 */
export function createDynamicValidator(nodeType) {
    return function (parameters) {
        var errors = [];
        var warnings = [];
        switch (nodeType) {
            case 'httpRequest':
            case 'n8n-nodes-base.httpRequest':
                if (!parameters.url) {
                    errors.push('URL is required for HTTP Request nodes');
                }
                else {
                    try {
                        new URL(parameters.url);
                    }
                    catch (_a) {
                        errors.push('URL must be a valid URL format');
                    }
                }
                if (parameters.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(parameters.method)) {
                    warnings.push("Unusual HTTP method: ".concat(parameters.method));
                }
                break;
            case 'slack':
            case 'n8n-nodes-base.slack':
                if (!parameters.channel) {
                    errors.push('Channel is required for Slack nodes');
                }
                else if (!parameters.channel.startsWith('#') && !parameters.channel.startsWith('@')) {
                    warnings.push('Slack channel should typically start with # or @');
                }
                if (!parameters.text && !parameters.blocks) {
                    errors.push('Either text or blocks must be provided for Slack messages');
                }
                break;
            case 'code':
            case 'n8n-nodes-base.code':
                if (!parameters.code) {
                    errors.push('Code is required for Code nodes');
                }
                else if (parameters.code.length > 10000) {
                    warnings.push('Code is very long - consider breaking into smaller functions');
                }
                break;
            default:
                warnings.push("No specific validation available for node type: ".concat(nodeType));
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    };
}
/**
 * Validates ReactFlow data structure
 */
export function validateReactFlowData(nodes, edges) {
    var errors = [];
    var warnings = [];
    // Validate nodes
    if (!Array.isArray(nodes)) {
        errors.push('Nodes must be an array');
    }
    else {
        nodes.forEach(function (node, index) {
            if (!node.id) {
                errors.push("Node at index ".concat(index, " is missing an ID"));
            }
            if (!node.type) {
                errors.push("Node ".concat(node.id || index, " is missing a type"));
            }
            if (!node.position) {
                errors.push("Node ".concat(node.id || index, " is missing position data"));
            }
        });
    }
    // Validate edges
    if (!Array.isArray(edges)) {
        errors.push('Edges must be an array');
    }
    else {
        var nodeIds_1 = new Set(nodes.map(function (node) { return node.id; }));
        edges.forEach(function (edge, index) {
            if (!edge.id) {
                errors.push("Edge at index ".concat(index, " is missing an ID"));
            }
            if (!edge.source) {
                errors.push("Edge ".concat(edge.id || index, " is missing source"));
            }
            else if (!nodeIds_1.has(edge.source)) {
                errors.push("Edge ".concat(edge.id || index, " references non-existent source node: ").concat(edge.source));
            }
            if (!edge.target) {
                errors.push("Edge ".concat(edge.id || index, " is missing target"));
            }
            else if (!nodeIds_1.has(edge.target)) {
                errors.push("Edge ".concat(edge.id || index, " references non-existent target node: ").concat(edge.target));
            }
        });
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}
export default {
    validateN8nWorkflow: validateN8nWorkflow,
    createDynamicValidator: createDynamicValidator,
    validateReactFlowData: validateReactFlowData
};
