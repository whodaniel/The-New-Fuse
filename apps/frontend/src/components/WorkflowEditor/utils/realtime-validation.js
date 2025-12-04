var WorkflowValidator = /** @class */ (function () {
    function WorkflowValidator(nodeTypes) {
        this.nodeTypes = nodeTypes;
    }
    WorkflowValidator.prototype.validate = function (nodes, edges) {
        var _this = this;
        var errors = [];
        if (nodes.length > 1 && edges.length === 0) {
            errors.push("Workflow contains nodes but no connections.");
        }
        nodes.forEach(function (node) {
            var nodeType = _this.nodeTypes.find(function (nt) { return nt.name === node.type; });
            if (!nodeType) {
                errors.push("Unknown node type: ".concat(node.type, " (ID: ").concat(node.id, ")"));
                return;
            }
            (nodeType.properties || []).forEach(function (prop) {
                if (prop.required && (node.data.parameters === undefined || node.data.parameters[prop.name] === undefined)) {
                    errors.push("Node '".concat(node.data.name || node.type, "' (ID: ").concat(node.id, ") is missing required parameter: ").concat(prop.displayName));
                }
            });
            if (nodeType.credentials && nodeType.credentials.length > 0 && (!node.data.credentials || !node.data.credentials.id)) {
                errors.push("Node '".concat(node.data.name || node.type, "' (ID: ").concat(node.id, ") is missing credentials."));
            }
        });
        return errors;
    };
    return WorkflowValidator;
}());
export { WorkflowValidator };
