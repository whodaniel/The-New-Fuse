"use strict";
/**
 * Workflow Validator - Schema and Logic Validation
 *
 * Provides comprehensive validation for workflows, nodes, and configurations
 * Integrates with The New Fuse framework requirements and standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const WorkflowTypes_js_1 = require("../types/WorkflowTypes.js");
const WorkflowSchemas_js_1 = require("../schemas/WorkflowSchemas.js");
const errorUtils_js_1 = require("../utils/errorUtils.js");
class WorkflowValidator {
    logger;
    config;
    validationRules = new Map();
    warningRules = new Map();
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.initializeValidationRules();
        this.initializeWarningRules();
    }
    /**
     * Validate complete workflow
     */
    async validateWorkflow(workflow) {
        const errors = [];
        const warnings = [];
        try {
            // Zod Schema Validation
            const zodResult = WorkflowSchemas_js_1.UnifiedWorkflowSchema.safeParse(workflow);
            if (!zodResult.success) {
                for (const issue of zodResult.error.issues) {
                    errors.push({
                        code: 'SCHEMA_VALIDATION_ERROR',
                        message: `Schema validation error at ${issue.path.join('.')}: ${issue.message}`,
                        severity: 'error'
                    });
                }
                // If schema validation fails significantly, we might want to stop early,
                // but often we want to collect as many errors as possible.
            }
            // Run all validation rules
            for (const [ruleName, rule] of this.validationRules.entries()) {
                try {
                    const ruleErrors = rule(workflow);
                    errors.push(...ruleErrors);
                }
                catch (error) {
                    this.logger.error(`Validation rule ${ruleName} failed: ${(0, errorUtils_js_1.getErrorMessage)(error)}`);
                    errors.push({
                        code: 'VALIDATION_RULE_ERROR',
                        message: `Validation rule ${ruleName} failed: ${(0, errorUtils_js_1.getErrorMessage)(error)}`,
                        severity: 'error'
                    });
                }
            }
            // Run all warning rules
            for (const [ruleName, rule] of this.warningRules.entries()) {
                try {
                    const ruleWarnings = rule(workflow);
                    warnings.push(...ruleWarnings);
                }
                catch (_error) {
                    this.logger.warn(`Warning rule ${ruleName} failed: ${(0, errorUtils_js_1.getErrorMessage)(_error)}`);
                }
            }
            // Additional validation
            errors.push(...this.validateWorkflowDefinition(workflow.definition));
            warnings.push(...this.generatePerformanceWarnings(workflow));
        }
        catch (error) {
            this.logger.error(`Workflow validation failed: ${(0, errorUtils_js_1.getErrorMessage)(error)}`);
            errors.push({
                code: 'VALIDATION_FAILED',
                message: `Validation process failed: ${(0, errorUtils_js_1.getErrorMessage)(error)}`,
                severity: 'error'
            });
        }
        const result = {
            valid: errors.length === 0,
            errors,
            warnings
        };
        if (!result.valid) {
            this.logger.warn(`❌ Workflow validation failed: ${errors.length} errors, ${warnings.length} warnings`);
        }
        else {
            this.logger.debug(`✅ Workflow validation passed with ${warnings.length} warnings`);
        }
        return result;
    }
    /**
     * Validate workflow definition
     */
    validateWorkflowDefinition(definition) {
        const errors = [];
        // Validate nodes
        for (const node of definition.nodes) {
            errors.push(...this.validateNode(node));
        }
        // Validate connections
        for (const connection of definition.connections) {
            errors.push(...this.validateConnection(connection, definition));
        }
        // Validate variables
        for (const variable of definition.variables) {
            errors.push(...this.validateVariable(variable));
        }
        return errors;
    }
    /**
     * Validate individual node
     */
    validateNode(node) {
        const errors = [];
        // Basic node validation
        if (!node.id || typeof node.id !== 'string') {
            errors.push({
                code: 'INVALID_NODE_ID',
                message: 'Node must have a valid ID',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!node.name || typeof node.name !== 'string') {
            errors.push({
                code: 'INVALID_NODE_NAME',
                message: 'Node must have a valid name',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!Object.values(WorkflowTypes_js_1.WorkflowNodeType).includes(node.type)) {
            errors.push({
                code: 'INVALID_NODE_TYPE',
                message: `Invalid node type: ${node.type}`,
                nodeId: node.id,
                severity: 'error'
            });
        }
        // Position validation
        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            errors.push({
                code: 'INVALID_NODE_POSITION',
                message: 'Node must have valid position coordinates',
                nodeId: node.id,
                severity: 'error'
            });
        }
        // Type-specific validation
        errors.push(...this.validateNodeConfiguration(node));
        // Input/Output validation
        errors.push(...this.validateNodeInputsOutputs(node));
        return errors;
    }
    /**
     * Validate node configuration based on type
     */
    validateNodeConfiguration(node) {
        const errors = [];
        switch (node.type) {
            case WorkflowTypes_js_1.WorkflowNodeType.AGENT_TASK:
                errors.push(...this.validateAgentTaskNode(node));
                break;
            case WorkflowTypes_js_1.WorkflowNodeType.AGENT_HANDOFF:
                errors.push(...this.validateAgentHandoffNode(node));
                break;
            case WorkflowTypes_js_1.WorkflowNodeType.CONDITION:
                errors.push(...this.validateConditionNode(node));
                break;
            case WorkflowTypes_js_1.WorkflowNodeType.LLM_PROMPT:
                errors.push(...this.validateLLMPromptNode(node));
                break;
            case WorkflowTypes_js_1.WorkflowNodeType.API_CALL:
                errors.push(...this.validateAPICallNode(node));
                break;
            // Add more node type validations as needed
        }
        return errors;
    }
    validateAgentTaskNode(node) {
        const errors = [];
        const config = node.config;
        if (!config.task || typeof config.task !== 'string') {
            errors.push({
                code: 'MISSING_AGENT_TASK',
                message: 'Agent task node must have a task description',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!config.priority || !['low', 'medium', 'high'].includes(config.priority)) {
            errors.push({
                code: 'INVALID_TASK_PRIORITY',
                message: 'Agent task must have valid priority (low, medium, high)',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (config.expectedDuration && (typeof config.expectedDuration !== 'number' || config.expectedDuration <= 0)) {
            errors.push({
                code: 'INVALID_EXPECTED_DURATION',
                message: 'Expected duration must be a positive number',
                nodeId: node.id,
                severity: 'error'
            });
        }
        return errors;
    }
    validateAgentHandoffNode(node) {
        const errors = [];
        const config = node.config;
        if (!config.fromAgentId || typeof config.fromAgentId !== 'string') {
            errors.push({
                code: 'MISSING_FROM_AGENT',
                message: 'Agent handoff must specify source agent ID',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!config.toAgentId || typeof config.toAgentId !== 'string') {
            errors.push({
                code: 'MISSING_TO_AGENT',
                message: 'Agent handoff must specify target agent ID',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (config.fromAgentId === config.toAgentId) {
            errors.push({
                code: 'SELF_HANDOFF',
                message: 'Agent cannot handoff to itself',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!config.handoffTemplateId || typeof config.handoffTemplateId !== 'string') {
            errors.push({
                code: 'MISSING_HANDOFF_TEMPLATE',
                message: 'Agent handoff must specify handoff template ID',
                nodeId: node.id,
                severity: 'error'
            });
        }
        return errors;
    }
    validateConditionNode(node) {
        const errors = [];
        const config = node.config;
        if (!config.expression || typeof config.expression !== 'string') {
            errors.push({
                code: 'MISSING_CONDITION_EXPRESSION',
                message: 'Condition node must have an expression',
                nodeId: node.id,
                severity: 'error'
            });
        }
        else {
            // Validate JavaScript expression syntax
            try {
                new Function('return ' + config.expression);
            }
            catch (error) {
                errors.push({
                    code: 'INVALID_CONDITION_EXPRESSION',
                    message: `Invalid condition expression: ${(0, errorUtils_js_1.getErrorMessage)(error)}`,
                    nodeId: node.id,
                    severity: 'error'
                });
            }
        }
        return errors;
    }
    validateLLMPromptNode(node) {
        const errors = [];
        const config = node.config;
        if (!config.provider || typeof config.provider !== 'string') {
            errors.push({
                code: 'MISSING_LLM_PROVIDER',
                message: 'LLM prompt node must specify provider',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!config.model || typeof config.model !== 'string') {
            errors.push({
                code: 'MISSING_LLM_MODEL',
                message: 'LLM prompt node must specify model',
                nodeId: node.id,
                severity: 'error'
            });
        }
        if (!config.prompt || typeof config.prompt !== 'string') {
            errors.push({
                code: 'MISSING_LLM_PROMPT',
                message: 'LLM prompt node must have a prompt',
                nodeId: node.id,
                severity: 'error'
            });
        }
        return errors;
    }
    validateAPICallNode(node) {
        const errors = [];
        const config = node.config;
        if (!config.url || typeof config.url !== 'string') {
            errors.push({
                code: 'MISSING_API_URL',
                message: 'API call node must have a URL',
                nodeId: node.id,
                severity: 'error'
            });
        }
        else {
            try {
                new URL(config.url);
            }
            catch {
                errors.push({
                    code: 'INVALID_API_URL',
                    message: 'API call node must have a valid URL',
                    nodeId: node.id,
                    severity: 'error'
                });
            }
        }
        if (!config.method || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
            errors.push({
                code: 'INVALID_HTTP_METHOD',
                message: 'API call node must have a valid HTTP method',
                nodeId: node.id,
                severity: 'error'
            });
        }
        return errors;
    }
    /**
     * Validate node inputs and outputs
     */
    validateNodeInputsOutputs(node) {
        const errors = [];
        // Validate inputs
        for (const input of node.inputs) {
            if (!input.id || typeof input.id !== 'string') {
                errors.push({
                    code: 'INVALID_INPUT_ID',
                    message: 'Node input must have a valid ID',
                    nodeId: node.id,
                    severity: 'error'
                });
            }
            if (!input.name || typeof input.name !== 'string') {
                errors.push({
                    code: 'INVALID_INPUT_NAME',
                    message: 'Node input must have a valid name',
                    nodeId: node.id,
                    severity: 'error'
                });
            }
            if (!Object.values(WorkflowTypes_js_1.VariableType).includes(input.type)) {
                errors.push({
                    code: 'INVALID_INPUT_TYPE',
                    message: `Invalid input type: ${input.type}`,
                    nodeId: node.id,
                    severity: 'error'
                });
            }
        }
        // Validate outputs
        for (const output of node.outputs) {
            if (!output.id || typeof output.id !== 'string') {
                errors.push({
                    code: 'INVALID_OUTPUT_ID',
                    message: 'Node output must have a valid ID',
                    nodeId: node.id,
                    severity: 'error'
                });
            }
            if (!output.name || typeof output.name !== 'string') {
                errors.push({
                    code: 'INVALID_OUTPUT_NAME',
                    message: 'Node output must have a valid name',
                    nodeId: node.id,
                    severity: 'error'
                });
            }
            if (!Object.values(WorkflowTypes_js_1.VariableType).includes(output.type)) {
                errors.push({
                    code: 'INVALID_OUTPUT_TYPE',
                    message: `Invalid output type: ${output.type}`,
                    nodeId: node.id,
                    severity: 'error'
                });
            }
        }
        return errors;
    }
    /**
     * Validate connection
     */
    validateConnection(connection, definition) {
        const errors = [];
        if (!connection.id || typeof connection.id !== 'string') {
            errors.push({
                code: 'INVALID_CONNECTION_ID',
                message: 'Connection must have a valid ID',
                connectionId: connection.id,
                severity: 'error'
            });
        }
        // Validate source node exists
        const sourceNode = definition.nodes.find(n => n.id === connection.sourceNodeId);
        if (!sourceNode) {
            errors.push({
                code: 'MISSING_SOURCE_NODE',
                message: `Connection source node not found: ${connection.sourceNodeId}`,
                connectionId: connection.id,
                severity: 'error'
            });
        }
        else {
            // Validate source output exists
            const sourceOutput = sourceNode.outputs.find(o => o.id === connection.sourceOutputId);
            if (!sourceOutput) {
                errors.push({
                    code: 'MISSING_SOURCE_OUTPUT',
                    message: `Connection source output not found: ${connection.sourceOutputId}`,
                    connectionId: connection.id,
                    severity: 'error'
                });
            }
        }
        // Validate target node exists
        const targetNode = definition.nodes.find(n => n.id === connection.targetNodeId);
        if (!targetNode) {
            errors.push({
                code: 'MISSING_TARGET_NODE',
                message: `Connection target node not found: ${connection.targetNodeId}`,
                connectionId: connection.id,
                severity: 'error'
            });
        }
        else {
            // Validate target input exists
            const targetInput = targetNode.inputs.find(i => i.id === connection.targetInputId);
            if (!targetInput) {
                errors.push({
                    code: 'MISSING_TARGET_INPUT',
                    message: `Connection target input not found: ${connection.targetInputId}`,
                    connectionId: connection.id,
                    severity: 'error'
                });
            }
        }
        // Validate condition if present
        if (connection.condition) {
            try {
                new Function('return ' + connection.condition);
            }
            catch (error) {
                errors.push({
                    code: 'INVALID_CONNECTION_CONDITION',
                    message: `Invalid connection condition: ${(0, errorUtils_js_1.getErrorMessage)(error)}`,
                    connectionId: connection.id,
                    severity: 'error'
                });
            }
        }
        return errors;
    }
    /**
     * Validate variable
     */
    validateVariable(variable) {
        const errors = [];
        if (!variable.id || typeof variable.id !== 'string') {
            errors.push({
                code: 'INVALID_VARIABLE_ID',
                message: 'Variable must have a valid ID',
                severity: 'error'
            });
        }
        if (!variable.name || typeof variable.name !== 'string') {
            errors.push({
                code: 'INVALID_VARIABLE_NAME',
                message: 'Variable must have a valid name',
                severity: 'error'
            });
        }
        if (!Object.values(WorkflowTypes_js_1.VariableType).includes(variable.type)) {
            errors.push({
                code: 'INVALID_VARIABLE_TYPE',
                message: `Invalid variable type: ${variable.type}`,
                severity: 'error'
            });
        }
        // Validate default value type matches
        if (variable.defaultValue !== undefined) {
            const isValidType = this.validateVariableValue(variable.defaultValue, variable.type);
            if (!isValidType) {
                errors.push({
                    code: 'INVALID_DEFAULT_VALUE_TYPE',
                    message: `Default value type doesn't match variable type: ${variable.type}`,
                    severity: 'error'
                });
            }
        }
        return errors;
    }
    validateVariableValue(value, type) {
        switch (type) {
            case WorkflowTypes_js_1.VariableType.STRING:
                return typeof value === 'string';
            case WorkflowTypes_js_1.VariableType.NUMBER:
                return typeof value === 'number';
            case WorkflowTypes_js_1.VariableType.BOOLEAN:
                return typeof value === 'boolean';
            case WorkflowTypes_js_1.VariableType.OBJECT:
                return typeof value === 'object' && value !== null;
            case WorkflowTypes_js_1.VariableType.ARRAY:
                return Array.isArray(value);
            case WorkflowTypes_js_1.VariableType.DATE:
                return value instanceof Date || typeof value === 'string';
            default:
                return true;
        }
    }
    /**
     * Initialize validation rules
     */
    initializeValidationRules() {
        // Must have start node
        this.validationRules.set('must_have_start', (workflow) => {
            if (!this.config.requireStartNode)
                return [];
            const hasStart = workflow.definition.nodes.some(n => n.type === WorkflowTypes_js_1.WorkflowNodeType.START);
            return hasStart ? [] : [{
                    code: 'MISSING_START_NODE',
                    message: 'Workflow must have a start node',
                    severity: 'error'
                }];
        });
        // Must have end node
        this.validationRules.set('must_have_end', (workflow) => {
            if (!this.config.requireEndNode)
                return [];
            const hasEnd = workflow.definition.nodes.some(n => n.type === WorkflowTypes_js_1.WorkflowNodeType.END);
            return hasEnd ? [] : [{
                    code: 'MISSING_END_NODE',
                    message: 'Workflow must have an end node',
                    severity: 'error'
                }];
        });
        // No duplicate node IDs
        this.validationRules.set('no_duplicate_node_ids', (workflow) => {
            const nodeIds = workflow.definition.nodes.map(n => n.id);
            const duplicates = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
            return duplicates.map(id => ({
                code: 'DUPLICATE_NODE_ID',
                message: `Duplicate node ID found: ${id}`,
                nodeId: id,
                severity: 'error'
            }));
        });
        // No orphaned nodes (except START)
        this.validationRules.set('no_orphaned_nodes', (workflow) => {
            const errors = [];
            const connections = workflow.definition.connections;
            for (const node of workflow.definition.nodes) {
                if (node.type === WorkflowTypes_js_1.WorkflowNodeType.START)
                    continue;
                const hasIncoming = connections.some(c => c.targetNodeId === node.id);
                if (!hasIncoming) {
                    errors.push({
                        code: 'ORPHANED_NODE',
                        message: `Node "${node.name}" has no incoming connections`,
                        nodeId: node.id,
                        severity: 'error'
                    });
                }
            }
            return errors;
        });
        // Check circular references
        this.validationRules.set('no_circular_references', (workflow) => {
            if (this.config.allowCircularReferences)
                return [];
            const errors = [];
            const visited = new Set();
            const recursionStack = new Set();
            const hasCycle = (nodeId) => {
                if (recursionStack.has(nodeId))
                    return true;
                if (visited.has(nodeId))
                    return false;
                visited.add(nodeId);
                recursionStack.add(nodeId);
                const outgoingConnections = workflow.definition.connections.filter(c => c.sourceNodeId === nodeId);
                for (const connection of outgoingConnections) {
                    if (hasCycle(connection.targetNodeId))
                        return true;
                }
                recursionStack.delete(nodeId);
                return false;
            };
            for (const node of workflow.definition.nodes) {
                if (!visited.has(node.id) && hasCycle(node.id)) {
                    errors.push({
                        code: 'CIRCULAR_REFERENCE',
                        message: `Circular reference detected involving node: ${node.name}`,
                        nodeId: node.id,
                        severity: 'error'
                    });
                }
            }
            return errors;
        });
        // Node count limits
        this.validationRules.set('node_count_limit', (workflow) => {
            if (workflow.definition.nodes.length > this.config.maxNodes) {
                return [{
                        code: 'TOO_MANY_NODES',
                        message: `Workflow has too many nodes (${workflow.definition.nodes.length}/${this.config.maxNodes})`,
                        severity: 'error'
                    }];
            }
            return [];
        });
        // Connection count limits
        this.validationRules.set('connection_count_limit', (workflow) => {
            if (workflow.definition.connections.length > this.config.maxConnections) {
                return [{
                        code: 'TOO_MANY_CONNECTIONS',
                        message: `Workflow has too many connections (${workflow.definition.connections.length}/${this.config.maxConnections})`,
                        severity: 'error'
                    }];
            }
            return [];
        });
    }
    /**
     * Initialize warning rules
     */
    initializeWarningRules() {
        // Unnamed nodes
        this.warningRules.set('unnamed_nodes', (workflow) => {
            const warnings = [];
            for (const node of workflow.definition.nodes) {
                if (!node.name || node.name.trim() === '') {
                    warnings.push({
                        code: 'UNNAMED_NODE',
                        message: `Node of type "${node.type}" has no name`,
                        nodeId: node.id,
                        suggestion: 'Consider adding a descriptive name for better clarity'
                    });
                }
            }
            return warnings;
        });
        // Unreachable nodes
        this.warningRules.set('unreachable_nodes', (workflow) => {
            const warnings = [];
            const reachable = new Set();
            // Find start nodes
            const startNodes = workflow.definition.nodes.filter(n => n.type === WorkflowTypes_js_1.WorkflowNodeType.START);
            // BFS to find all reachable nodes
            const queue = startNodes.map(n => n.id);
            while (queue.length > 0) {
                const nodeId = queue.shift();
                if (reachable.has(nodeId))
                    continue;
                reachable.add(nodeId);
                const outgoingConnections = workflow.definition.connections.filter(c => c.sourceNodeId === nodeId);
                for (const connection of outgoingConnections) {
                    if (!reachable.has(connection.targetNodeId)) {
                        queue.push(connection.targetNodeId);
                    }
                }
            }
            // Check for unreachable nodes
            for (const node of workflow.definition.nodes) {
                if (node.type !== WorkflowTypes_js_1.WorkflowNodeType.START && !reachable.has(node.id)) {
                    warnings.push({
                        code: 'UNREACHABLE_NODE',
                        message: `Node "${node.name}" is not reachable from any start node`,
                        nodeId: node.id,
                        suggestion: 'Add connections to make this node reachable'
                    });
                }
            }
            return warnings;
        });
    }
    /**
     * Generate performance warnings
     */
    generatePerformanceWarnings(workflow) {
        if (!this.config.enablePerformanceValidation)
            return [];
        const warnings = [];
        // Deep nesting warning
        const maxDepth = this.calculateMaxDepth(workflow.definition);
        if (maxDepth > 10) {
            warnings.push({
                code: 'DEEP_NESTING',
                message: `Workflow has deep nesting (depth: ${maxDepth})`,
                suggestion: 'Consider breaking into smaller sub-workflows'
            });
        }
        // High complexity warning
        const complexity = this.calculateComplexity(workflow.definition);
        if (complexity > 50) {
            warnings.push({
                code: 'HIGH_COMPLEXITY',
                message: `Workflow has high complexity score (${complexity})`,
                suggestion: 'Consider simplifying or modularizing the workflow'
            });
        }
        return warnings;
    }
    calculateMaxDepth(definition) {
        const visited = new Set();
        const startNodes = definition.nodes.filter(n => n.type === WorkflowTypes_js_1.WorkflowNodeType.START);
        let maxDepth = 0;
        const dfs = (nodeId, depth) => {
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            maxDepth = Math.max(maxDepth, depth);
            const outgoingConnections = definition.connections.filter(c => c.sourceNodeId === nodeId);
            for (const connection of outgoingConnections) {
                dfs(connection.targetNodeId, depth + 1);
            }
        };
        for (const startNode of startNodes) {
            dfs(startNode.id, 1);
        }
        return maxDepth;
    }
    calculateComplexity(definition) {
        const nodeCount = definition.nodes.length;
        const connectionCount = definition.connections.length;
        const variableCount = definition.variables.length;
        const conditionCount = definition.connections.filter(c => c.condition).length;
        return nodeCount + connectionCount * 0.5 + variableCount * 0.3 + conditionCount * 2;
    }
    /**
     * Public API methods
     */
    async validateNodeConfig(nodeType, config) {
        const mockNode = {
            id: 'temp',
            type: nodeType,
            name: 'temp',
            position: { x: 0, y: 0 },
            config,
            inputs: [],
            outputs: [],
            metadata: {}
        };
        return this.validateNodeConfiguration(mockNode);
    }
    getValidationRules() {
        return Array.from(this.validationRules.keys());
    }
    addCustomValidationRule(name, rule) {
        this.validationRules.set(name, rule);
    }
    removeValidationRule(name) {
        return this.validationRules.delete(name);
    }
}
exports.WorkflowValidator = WorkflowValidator;
//# sourceMappingURL=WorkflowValidator.js.map