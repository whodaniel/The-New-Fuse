/**
 * Workflow Validation Service - Comprehensive workflow validation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var WorkflowValidationService = /** @class */ (function () {
    function WorkflowValidationService() {
    }
    // Main validation method
    WorkflowValidationService.prototype.validateWorkflow = function (workflow) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, warnings, _i, _a, node, _b, _c, edge, actualErrors, actualWarnings;
            return __generator(this, function (_d) {
                errors = [];
                warnings = [];
                // Structural validation
                errors.push.apply(errors, this.validateStructure(workflow.nodes, workflow.edges));
                // Node validation
                for (_i = 0, _a = workflow.nodes; _i < _a.length; _i++) {
                    node = _a[_i];
                    errors.push.apply(errors, this.validateNode(node, workflow.nodes, workflow.edges));
                }
                // Edge validation
                for (_b = 0, _c = workflow.edges; _b < _c.length; _b++) {
                    edge = _c[_b];
                    errors.push.apply(errors, this.validateEdge(edge, workflow.nodes));
                }
                // Workflow-level validation
                errors.push.apply(errors, this.validateWorkflowLogic(workflow.nodes, workflow.edges));
                // Performance warnings
                warnings.push.apply(warnings, this.generatePerformanceWarnings(workflow.nodes, workflow.edges));
                actualErrors = errors.filter(function (e) { return e.severity === 'error'; });
                actualWarnings = __spreadArray(__spreadArray([], warnings, true), errors.filter(function (e) { return e.severity === 'warning'; }), true);
                return [2 /*return*/, {
                        valid: actualErrors.length === 0,
                        errors: actualErrors,
                        warnings: actualWarnings
                    }];
            });
        });
    };
    // Validate workflow structure
    WorkflowValidationService.prototype.validateStructure = function (nodes, edges) {
        var errors = [];
        // Check for empty workflow
        if (nodes.length === 0) {
            errors.push({
                id: 'empty-workflow',
                type: 'structure',
                severity: 'error',
                message: 'Workflow cannot be empty'
            });
            return errors;
        }
        // Check for start nodes
        var startNodes = nodes.filter(function (node) {
            return !edges.some(function (edge) { return edge.target === node.id; });
        });
        if (startNodes.length === 0) {
            errors.push({
                id: 'no-start-node',
                type: 'structure',
                severity: 'error',
                message: 'Workflow must have at least one start node (node with no incoming connections)'
            });
        }
        // Check for end nodes
        var endNodes = nodes.filter(function (node) {
            return !edges.some(function (edge) { return edge.source === node.id; });
        });
        if (endNodes.length === 0) {
            errors.push({
                id: 'no-end-node',
                type: 'structure',
                severity: 'warning',
                message: 'Workflow should have at least one end node (node with no outgoing connections)'
            });
        }
        // Check for isolated nodes
        var connectedNodeIds = new Set(__spreadArray(__spreadArray([], edges.map(function (e) { return e.source; }), true), edges.map(function (e) { return e.target; }), true));
        var isolatedNodes = nodes.filter(function (node) { return !connectedNodeIds.has(node.id); });
        isolatedNodes.forEach(function (node) {
            var _a;
            errors.push({
                id: "isolated-node-".concat(node.id),
                type: 'structure',
                severity: 'warning',
                message: "Node \"".concat(((_a = node.data) === null || _a === void 0 ? void 0 : _a.name) || node.id, "\" is not connected to the workflow"),
                nodeId: node.id
            });
        });
        return errors;
    };
    // Validate individual nodes
    WorkflowValidationService.prototype.validateNode = function (node, allNodes, allEdges) {
        var errors = [];
        // Check node data
        if (!node.data) {
            errors.push({
                id: "node-no-data-".concat(node.id),
                type: 'node',
                severity: 'error',
                message: "Node \"".concat(node.id, "\" has no data"),
                nodeId: node.id
            });
            return errors;
        }
        // Check node name
        if (!node.data.name || node.data.name.trim() === '') {
            errors.push({
                id: "node-no-name-".concat(node.id),
                type: 'node',
                severity: 'warning',
                message: "Node \"".concat(node.id, "\" has no name"),
                nodeId: node.id
            });
        }
        // Type-specific validation
        switch (node.type) {
            case 'agent':
                errors.push.apply(errors, this.validateAgentNode(node));
                break;
            case 'mcpTool':
                errors.push.apply(errors, this.validateMCPToolNode(node));
                break;
            case 'condition':
                errors.push.apply(errors, this.validateConditionNode(node, allEdges));
                break;
            case 'loop':
                errors.push.apply(errors, this.validateLoopNode(node));
                break;
            case 'subworkflow':
                errors.push.apply(errors, this.validateSubworkflowNode(node));
                break;
        }
        return errors;
    };
    // Validate agent nodes
    WorkflowValidationService.prototype.validateAgentNode = function (node) {
        var _a, _b;
        var errors = [];
        var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
        if (!config.agentId) {
            errors.push({
                id: "agent-no-id-".concat(node.id),
                type: 'configuration',
                severity: 'error',
                message: "Agent node \"".concat(((_b = node.data) === null || _b === void 0 ? void 0 : _b.name) || node.id, "\" has no agent selected"),
                nodeId: node.id
            });
        }
        return errors;
    };
    // Validate MCP tool nodes
    WorkflowValidationService.prototype.validateMCPToolNode = function (node) {
        var _a, _b, _c;
        var errors = [];
        var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
        if (!config.mcpServer) {
            errors.push({
                id: "mcp-no-server-".concat(node.id),
                type: 'configuration',
                severity: 'error',
                message: "MCP Tool node \"".concat(((_b = node.data) === null || _b === void 0 ? void 0 : _b.name) || node.id, "\" has no server selected"),
                nodeId: node.id
            });
        }
        if (!config.mcpTool) {
            errors.push({
                id: "mcp-no-tool-".concat(node.id),
                type: 'configuration',
                severity: 'error',
                message: "MCP Tool node \"".concat(((_c = node.data) === null || _c === void 0 ? void 0 : _c.name) || node.id, "\" has no tool selected"),
                nodeId: node.id
            });
        }
        return errors;
    };
    // Validate condition nodes
    WorkflowValidationService.prototype.validateConditionNode = function (node, allEdges) {
        var _a, _b, _c;
        var errors = [];
        var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
        // Check for condition expression
        if (!config.expression || config.expression.trim() === '') {
            errors.push({
                id: "condition-no-expression-".concat(node.id),
                type: 'configuration',
                severity: 'error',
                message: "Condition node \"".concat(((_b = node.data) === null || _b === void 0 ? void 0 : _b.name) || node.id, "\" has no condition expression"),
                nodeId: node.id
            });
        }
        // Check for multiple output paths
        var outgoingEdges = allEdges.filter(function (edge) { return edge.source === node.id; });
        if (outgoingEdges.length < 2) {
            errors.push({
                id: "condition-single-path-".concat(node.id),
                type: 'structure',
                severity: 'warning',
                message: "Condition node \"".concat(((_c = node.data) === null || _c === void 0 ? void 0 : _c.name) || node.id, "\" should have at least two output paths"),
                nodeId: node.id
            });
        }
        return errors;
    };
    // Validate loop nodes
    WorkflowValidationService.prototype.validateLoopNode = function (node) {
        var _a, _b;
        var errors = [];
        var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
        if (!config.collection) {
            errors.push({
                id: "loop-no-collection-".concat(node.id),
                type: 'configuration',
                severity: 'error',
                message: "Loop node \"".concat(((_b = node.data) === null || _b === void 0 ? void 0 : _b.name) || node.id, "\" has no collection specified"),
                nodeId: node.id
            });
        }
        return errors;
    };
    // Validate subworkflow nodes
    WorkflowValidationService.prototype.validateSubworkflowNode = function (node) {
        var _a, _b;
        var errors = [];
        var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
        if (!config.subworkflowId) {
            errors.push({
                id: "subworkflow-no-id-".concat(node.id),
                type: 'configuration',
                severity: 'error',
                message: "Subworkflow node \"".concat(((_b = node.data) === null || _b === void 0 ? void 0 : _b.name) || node.id, "\" has no subworkflow selected"),
                nodeId: node.id
            });
        }
        return errors;
    };
    // Validate edges
    WorkflowValidationService.prototype.validateEdge = function (edge, allNodes) {
        var errors = [];
        // Check source node exists
        var sourceNode = allNodes.find(function (node) { return node.id === edge.source; });
        if (!sourceNode) {
            errors.push({
                id: "edge-invalid-source-".concat(edge.id),
                type: 'edge',
                severity: 'error',
                message: "Edge \"".concat(edge.id, "\" has invalid source node \"").concat(edge.source, "\""),
                edgeId: edge.id
            });
        }
        // Check target node exists
        var targetNode = allNodes.find(function (node) { return node.id === edge.target; });
        if (!targetNode) {
            errors.push({
                id: "edge-invalid-target-".concat(edge.id),
                type: 'edge',
                severity: 'error',
                message: "Edge \"".concat(edge.id, "\" has invalid target node \"").concat(edge.target, "\""),
                edgeId: edge.id
            });
        }
        // Check for self-loops
        if (edge.source === edge.target) {
            errors.push({
                id: "edge-self-loop-".concat(edge.id),
                type: 'edge',
                severity: 'warning',
                message: "Edge \"".concat(edge.id, "\" creates a self-loop"),
                edgeId: edge.id
            });
        }
        return errors;
    };
    // Validate workflow logic
    WorkflowValidationService.prototype.validateWorkflowLogic = function (nodes, edges) {
        var errors = [];
        // Check for circular dependencies
        var cycles = this.detectCycles(nodes, edges);
        cycles.forEach(function (cycle, index) {
            errors.push({
                id: "circular-dependency-".concat(index),
                type: 'dependency',
                severity: 'error',
                message: "Circular dependency detected: ".concat(cycle.join(' → ')),
                details: { cycle: cycle }
            });
        });
        return errors;
    };
    // Detect cycles in the workflow graph
    WorkflowValidationService.prototype.detectCycles = function (nodes, edges) {
        var cycles = [];
        var visited = new Set();
        var recursionStack = new Set();
        // Build adjacency list
        var adjacencyList = new Map();
        nodes.forEach(function (node) { return adjacencyList.set(node.id, []); });
        edges.forEach(function (edge) {
            var neighbors = adjacencyList.get(edge.source) || [];
            neighbors.push(edge.target);
            adjacencyList.set(edge.source, neighbors);
        });
        // DFS to detect cycles
        var dfs = function (nodeId, path) {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            var neighbors = adjacencyList.get(nodeId) || [];
            for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
                var neighbor = neighbors_1[_i];
                if (!visited.has(neighbor)) {
                    dfs(neighbor, __spreadArray([], path, true));
                }
                else if (recursionStack.has(neighbor)) {
                    // Found a cycle
                    var cycleStart = path.indexOf(neighbor);
                    var cycle = path.slice(cycleStart);
                    cycle.push(neighbor); // Complete the cycle
                    cycles.push(cycle);
                }
            }
            recursionStack.delete(nodeId);
        };
        // Check each unvisited node
        nodes.forEach(function (node) {
            if (!visited.has(node.id)) {
                dfs(node.id, []);
            }
        });
        return cycles;
    };
    // Generate performance warnings
    WorkflowValidationService.prototype.generatePerformanceWarnings = function (nodes, edges) {
        var warnings = [];
        // Check for too many nodes
        if (nodes.length > 50) {
            warnings.push({
                id: 'too-many-nodes',
                type: 'structure',
                severity: 'warning',
                message: "Workflow has ".concat(nodes.length, " nodes. Consider breaking it into smaller workflows for better performance.")
            });
        }
        // Check for deeply nested structures
        var maxDepth = this.calculateMaxDepth(nodes, edges);
        if (maxDepth > 10) {
            warnings.push({
                id: 'deep-nesting',
                type: 'structure',
                severity: 'warning',
                message: "Workflow has a maximum depth of ".concat(maxDepth, " levels. Deep nesting can impact performance.")
            });
        }
        return warnings;
    };
    // Calculate maximum depth of the workflow
    WorkflowValidationService.prototype.calculateMaxDepth = function (nodes, edges) {
        // Find start nodes
        var startNodes = nodes.filter(function (node) {
            return !edges.some(function (edge) { return edge.target === node.id; });
        });
        if (startNodes.length === 0)
            return 0;
        // Build adjacency list
        var adjacencyList = new Map();
        nodes.forEach(function (node) { return adjacencyList.set(node.id, []); });
        edges.forEach(function (edge) {
            var neighbors = adjacencyList.get(edge.source) || [];
            neighbors.push(edge.target);
            adjacencyList.set(edge.source, neighbors);
        });
        // BFS to find maximum depth
        var maxDepth = 0;
        var queue = startNodes.map(function (node) { return ({ nodeId: node.id, depth: 1 }); });
        var visited = new Set();
        var _loop_1 = function () {
            var _a = queue.shift(), nodeId = _a.nodeId, depth = _a.depth;
            if (visited.has(nodeId))
                return "continue";
            visited.add(nodeId);
            maxDepth = Math.max(maxDepth, depth);
            var neighbors = adjacencyList.get(nodeId) || [];
            neighbors.forEach(function (neighbor) {
                if (!visited.has(neighbor)) {
                    queue.push({ nodeId: neighbor, depth: depth + 1 });
                }
            });
        };
        while (queue.length > 0) {
            _loop_1();
        }
        return maxDepth;
    };
    // Quick validation for real-time feedback
    WorkflowValidationService.prototype.validateNodeConfiguration = function (node) {
        return this.validateNode(node, [node], []);
    };
    // Validate edge connection
    WorkflowValidationService.prototype.validateEdgeConnection = function (sourceNode, targetNode) {
        var errors = [];
        // Check for self-connection
        if (sourceNode.id === targetNode.id) {
            errors.push({
                id: 'self-connection',
                type: 'edge',
                severity: 'warning',
                message: 'Cannot connect a node to itself'
            });
        }
        // Type-specific connection rules
        if (sourceNode.type === 'input' && targetNode.type === 'input') {
            errors.push({
                id: 'input-to-input',
                type: 'edge',
                severity: 'error',
                message: 'Cannot connect input node to another input node'
            });
        }
        if (sourceNode.type === 'output' && targetNode.type === 'output') {
            errors.push({
                id: 'output-to-output',
                type: 'edge',
                severity: 'error',
                message: 'Cannot connect output node to another output node'
            });
        }
        return errors;
    };
    return WorkflowValidationService;
}());
// Export singleton instance
export var workflowValidationService = new WorkflowValidationService();
export default WorkflowValidationService;
