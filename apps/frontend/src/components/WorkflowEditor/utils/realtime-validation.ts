export class WorkflowValidator {
    constructor(nodeTypes) {
        this.nodeTypes = nodeTypes;
    }
    validate(nodes, edges) {
        const errors = [];
        if (nodes.length > 1 && edges.length === 0) {
            errors.push("Workflow contains nodes but no connections.");
        }
        nodes.forEach(node => {
            const nodeType = this.nodeTypes.find(nt => nt.name === node.type);
            if (!nodeType) {
                errors.push(`Unknown node type: ${node.type} (ID: ${node.id})`);
                return;
            }
            (nodeType.properties || []).forEach((prop) => {
                if (prop.required && (node.data.parameters === undefined || node.data.parameters[prop.name] === undefined)) {
                    errors.push(`Node '${node.data.name || node.type}' (ID: ${node.id}) is missing required parameter: ${prop.displayName}`);
                }
            });
            if (nodeType.credentials && nodeType.credentials.length > 0 && (!node.data.credentials || !node.data.credentials.id)) {
                errors.push(`Node '${node.data.name || node.type}' (ID: ${node.id}) is missing credentials.`);
            }
        });
        return errors;
    }
}
//# sourceMappingURL=realtime-validation.js.map