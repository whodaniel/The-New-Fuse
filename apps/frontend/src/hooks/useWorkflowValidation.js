import { useCallback, useState } from 'react';
export var useWorkflowValidation = function () {
    var _a = useState([]), validationErrors = _a[0], setValidationErrors = _a[1];
    var validateWorkflow = useCallback(function (_a) {
        var nodes = _a.nodes, edges = _a.edges;
        var errors = [];
        // Check for disconnected nodes
        nodes.forEach(function (node) {
            var hasInputs = edges.some(function (edge) { return edge.target === node.id; });
            var hasOutputs = edges.some(function (edge) { return edge.source === node.id; });
            if (!hasInputs && !hasOutputs) {
                errors.push("Node \"".concat(node.data.label, "\" is disconnected"));
            }
        });
        // Check for cycles
        var hasCycle = detectCycle(nodes, edges);
        if (hasCycle) {
            errors.push('Workflow contains cycles');
        }
        // Check for required configurations
        nodes.forEach(function (node) {
            if (node.data.requiredConfig) {
                var missingConfig = node.data.requiredConfig.filter(function (config) { var _a; return !((_a = node.data.configuration) === null || _a === void 0 ? void 0 : _a[config]); });
                if (missingConfig.length > 0) {
                    errors.push("Node \"".concat(node.data.label, "\" is missing required configuration: ").concat(missingConfig.join(', ')));
                }
            }
        });
        setValidationErrors(errors);
    }, []);
    return {
        validationErrors: validationErrors,
        validateWorkflow: validateWorkflow,
    };
};
